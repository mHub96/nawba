"""Generate the Iraqi-Arabic narration for the Nawba app.

Uses Microsoft neural voice ar-IQ-RanaNeural through the `edge-tts` package
(pip install edge-tts). Re-run after editing anything in /content: only lines
whose text changed are regenerated. Output: public/audio/*.mp3 + index.json
(the service worker reads index.json to cache every clip for offline use).

    python tools/gen_audio.py            # default female voice (Rana)
    python tools/gen_audio.py --voice ar-IQ-BasselNeural   # male voice
"""
import argparse, asyncio, hashlib, json, pathlib, sys

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


async def main(voice, rate):
    OUT.mkdir(parents=True, exist_ok=True)
    idx_path = OUT / "index.json"
    old = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else {}
    old_hashes = old.get("hashes", {})
    todo, hashes = [], {}
    for key, text in lines():
        h = hashlib.sha1(f"{voice}|{rate}|{text}".encode()).hexdigest()[:12]
        hashes[key] = h
        if old_hashes.get(key) != h or not (OUT / f"{key}.mp3").exists():
            todo.append((key, text))
    print(f"{len(hashes)} clips, {len(todo)} to generate with {voice}")
    sem = asyncio.Semaphore(4)

    async def one(key, text):
        async with sem:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, voice, rate=rate).save(str(OUT / f"{key}.mp3"))
                    print("  ok", key)
                    return
                except Exception as e:  # network hiccup: retry
                    print("  retry", key, e, file=sys.stderr)
                    await asyncio.sleep(2)
            raise SystemExit(f"failed: {key}")

    await asyncio.gather(*(one(k, t) for k, t in todo))
    for f in OUT.glob("*.mp3"):  # remove clips no longer referenced
        if f.stem not in hashes:
            f.unlink()
    idx_path.write_text(json.dumps({"voice": voice, "files": sorted(hashes), "hashes": hashes}, ensure_ascii=False, indent=0), encoding="utf-8")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="ar-IQ-RanaNeural")
    ap.add_argument("--rate", default="-8%", help="slightly slower = calmer, clearer")
    a = ap.parse_args()
    asyncio.run(main(a.voice, a.rate))
