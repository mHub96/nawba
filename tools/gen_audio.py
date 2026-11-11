"""Generate the Iraqi-Arabic narration for the Nawba app.

Uses Microsoft neural voice ar-IQ-RanaNeural through the `edge-tts` package
(pip install edge-tts). Re-run after editing anything in /content: only lines
whose text changed are regenerated. Output: public/audio/*.mp3 + index.json
(the service worker reads index.json to cache every clip for offline use).

    python tools/gen_audio.py            # default female voice (Rana)
    python tools/gen_audio.py --voice ar-IQ-BasselNeural   # male voice
"""
import argparse, asyncio, hashlib, json, os, pathlib, sys, urllib.request

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
OUT = ROOT / "public" / "audio"


def lines():
    narr = json.loads((CONTENT / "narration.json").read_text(encoding="utf-8"))
    for k, v in narr.items():
        yield k, v
    cat = json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))
    for it in cat["items"]:
        if it.get("lay"):
            yield f"item_{it['id']}", it["lay"]
    for c in cat["categories"]:
        if c.get("lay"):
            yield f"cat_{c['id']}", c["lay"]
    edu = json.loads((CONTENT / "education.json").read_text(encoding="utf-8"))
    for m in edu:
        yield f"edu_{m['id']}_t", m["ar"]
        for i, p in enumerate(m["paras"]):
            yield f"edu_{m['id']}_{i}", p


OPENAI_INSTRUCTIONS = (
    "Speak in natural Iraqi Arabic, Baghdadi dialect, exactly as written — do not convert to Modern Standard Arabic. "
    "You are a calm, warm, experienced Iraqi nurse guiding a frightened family member through an epileptic seizure. "
    "Steady, unhurried pace with short natural pauses at commas and full stops; reassuring and clear, never dramatic. "
    "For questions, use a gentle rising intonation."
)


def openai_key():
    k = os.environ.get("OPENAI_API_KEY", "").strip()
    f = ROOT / ".openai-key"          # git-ignored local file, one line
    if not k and f.exists():
        k = f.read_text(encoding="utf-8").strip()
    if not k:
        raise SystemExit("Set OPENAI_API_KEY or put the key in .openai-key (project root).")
    return k


def openai_tts(text, voice, model, key, path):
    body = json.dumps({"model": model, "voice": voice, "input": text, "instructions": OPENAI_INSTRUCTIONS, "response_format": "mp3"}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/audio/speech", data=body, method="POST",
                                 headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        path.write_bytes(r.read())


def eleven_key():
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    f = ROOT / ".elevenlabs-key"      # git-ignored local file, one line
    if not k and f.exists():
        k = f.read_text(encoding="utf-8").strip()
    if not k:
        raise SystemExit("Set ELEVENLABS_API_KEY or put the key in .elevenlabs-key (project root).")
    return k


def eleven_request(path, key, body=None):
    req = urllib.request.Request("https://api.elevenlabs.io" + path, data=json.dumps(body).encode() if body else None,
                                 method="POST" if body else "GET", headers={"xi-api-key": key, "Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=120)


def eleven_list_voices():
    key = eleven_key()
    data = json.load(eleven_request("/v1/voices", key))
    for v in data.get("voices", []):
        lab = v.get("labels") or {}
        print(f"{v['voice_id']}  {v['name']:<28} {lab.get('gender','')} {lab.get('accent','')} {lab.get('language','')} {lab.get('description','')}")
    sub = json.load(eleven_request("/v1/user/subscription", key))
    print(f"\ncharacters used {sub.get('character_count')} of {sub.get('character_limit')} this period")


def eleven_tts(text, voice_id, model, key, path):
    body = {"text": text, "model_id": model,
            "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True, "speed": 0.92}}
    with eleven_request(f"/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128", key, body) as r:
        path.write_bytes(r.read())


async def main(voice, rate, engine="edge", model="gpt-4o-mini-tts", only=None):
    OUT.mkdir(parents=True, exist_ok=True)
    key = openai_key() if engine == "openai" else eleven_key() if engine == "elevenlabs" else None
    tag = f"{engine}:{model}:{voice}" if engine in ("openai", "elevenlabs") else voice
    idx_path = OUT / "index.json"
    old = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else {}
    old_hashes = old.get("hashes", {})
    todo, hashes = [], {}
    for key, text in lines():
        h = hashlib.sha1(f"{tag}|{rate}|{text}".encode()).hexdigest()[:12]
        hashes[key] = h
        if (old_hashes.get(key) != h or not (OUT / f"{key}.mp3").exists()) and (not only or key in only):
            todo.append((key, text))
        elif only and key not in only:
            hashes[key] = old_hashes.get(key, h)   # keep untouched clips as they are
    print(f"{len(hashes)} clips, {len(todo)} to generate with {tag}")
    sem = asyncio.Semaphore(4)

    async def one(k, text):
        async with sem:
            for attempt in range(3):
                try:
                    if engine in ("openai", "elevenlabs"):
                        fn = openai_tts if engine == "openai" else eleven_tts
                        await asyncio.to_thread(fn, text, voice, model, key, OUT / f"{k}.mp3")
                        print("  ok", k)
                        return
                    await edge_tts.Communicate(text, voice, rate=rate).save(str(OUT / f"{k}.mp3"))
                    print("  ok", k)
                    return
                except Exception as e:  # network hiccup / rate limit: retry
                    print("  retry", k, e, file=sys.stderr)
                    await asyncio.sleep(3 * (attempt + 1))
            raise SystemExit(f"failed: {k}")

    await asyncio.gather(*(one(k, t) for k, t in todo))
    for f in OUT.glob("*.mp3"):  # remove clips no longer referenced
        if f.stem not in hashes:
            f.unlink()
    idx_path.write_text(json.dumps({"voice": tag, "files": sorted(hashes), "hashes": hashes}, ensure_ascii=False, indent=0), encoding="utf-8")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", choices=["edge", "openai", "elevenlabs"], default="edge",
                    help="edge = Microsoft Iraqi neural voices (free); openai = gpt-4o-mini-tts; elevenlabs = ElevenLabs (needs ELEVENLABS_API_KEY)")
    ap.add_argument("--voice", default=None, help="edge: ar-IQ-RanaNeural | ar-IQ-BasselNeural; openai: coral, sage…; elevenlabs: a voice_id (see --list-voices)")
    ap.add_argument("--model", default=None, help="openai: gpt-4o-mini-tts; elevenlabs: eleven_multilingual_v2 (default) or eleven_v3")
    ap.add_argument("--list-voices", action="store_true", help="elevenlabs: list the voices in the account and remaining characters")
    ap.add_argument("--rate", default="-8%", help="edge only: slightly slower = calmer, clearer")
    ap.add_argument("--only", nargs="*", help="regenerate just these clip keys (e.g. a sample: --only c_calm c_side item_R_long)")
    a = ap.parse_args()
    if a.list_voices:
        eleven_list_voices(); raise SystemExit
    if a.engine == "elevenlabs" and not a.voice:
        raise SystemExit("ElevenLabs needs --voice <voice_id>. Run with --list-voices to see the account's voices.")
    voice = a.voice or ("coral" if a.engine == "openai" else "ar-IQ-RanaNeural")
    model = a.model or {"openai": "gpt-4o-mini-tts", "elevenlabs": "eleven_multilingual_v2"}.get(a.engine, "")
    asyncio.run(main(voice, a.rate, a.engine, model, set(a.only) if a.only else None))
