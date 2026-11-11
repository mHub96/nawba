"""Baghdadi dialect pass for family-facing Arabic text.

Spells words the way Baghdadis say them, so families read their own dialect and the voice model pronounces
it the Baghdadi way (qaf → گ, some kaf → چ). Only Arabic word forms listed below are touched; everything
else (code, Latin text, medical names) is left alone. Safe to run more than once.

    python tools/baghdadi.py            # rewrite content/*.json and the family app's strings
    python tools/baghdadi.py --dry-run  # show what would change
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
AR = r'ء-يـً-ْ'          # Arabic letters + tatweel + harakat
PREFIX = r'(?:و|ب|ل|ف|وب|ول)?(?:ال)?'               # attached particles/article

# whole word forms → Baghdadi (matched with any attached prefix; suffix listed explicitly)
WORDS = {
    # qaf pronounced g
    'اكعد': 'اگعد', 'يكعد': 'يگعد', 'كاع': 'گاع',
    'حلك': 'حلگ', 'حلكه': 'حلگه',
    'قريبة': 'گريبة', 'قريب': 'گريب', 'أقرب': 'أگرب',
    'وقت': 'وگت', 'وقته': 'وگته', 'وكت': 'وگت', 'وكتها': 'وگتها',
    'قوة': 'گوة', 'قوي': 'گوي', 'قوية': 'گوية',
    'قبل': 'گبل', 'قبله': 'گبله', 'قبلها': 'گبلها',
    'قصير': 'گصير', 'قصيرة': 'گصيرة', 'قليلة': 'گليلة', 'قلة': 'گلة',
    'قماش': 'گماش', 'رقبته': 'رگبته', 'كال': 'گال',
    'تكدر': 'تگدر', 'تكدرون': 'تگدرون', 'يكدر': 'يگدر', 'يكدرون': 'يگدرون', 'نكدر': 'نگدر', 'كدرنا': 'گدرنا',
    'وكع': 'وگع', 'توكع': 'توگع', 'يوكع': 'يوگع',
    'وكف': 'وگف', 'وكفت': 'وگفت', 'وكّف': 'وگّف', 'توكف': 'توگف', 'توكّف': 'توگّف', 'توكّفين': 'توگّفين', 'يوكف': 'يوگف',
    # kaf pronounced ch
    'كم': 'چم', 'كانت': 'چانت',
    # Baghdadi word choice / spelling
    'متضايق': 'ضايج', 'هسه': 'هسّه', 'شوية': 'شويّة', 'كد': 'شگد',
}
# exact phrases (applied before word forms)
PHRASES = {
    'ذبّ (استفرغ)': 'زاع (استفرغ)',
    'تكسير بجسمه وتعب': 'جسمه مكسّر وتعبان',
    'وكد طوّلت': 'وشگد طوّلت',
}


def baghdadi(text):
    for a, b in PHRASES.items():
        text = text.replace(a, b)
    for a, b in sorted(WORDS.items(), key=lambda kv: -len(kv[0])):
        text = re.sub(rf'(?<![{AR}])({PREFIX}){re.escape(a)}(?![{AR}])', lambda m: m.group(1) + b, text)
    return text


def walk(obj, fn):
    if isinstance(obj, str): return fn(obj)
    if isinstance(obj, list): return [walk(x, fn) for x in obj]
    if isinstance(obj, dict): return {k: (walk(v, fn) if k in ('lay', 'ar', 'paras') or not isinstance(v, str) else v) for k, v in obj.items()}
    return obj


def main(dry):
    changed = 0
    # content: narration (all values), catalog (lay only — 'ar' there is clinical Arabic for staff), education (ar title + paras)
    files = {
        'content/narration.json': lambda d: {k: baghdadi(v) for k, v in d.items()},
        'content/catalog.json': lambda d: {**d, 'categories': [{**c, **({'lay': baghdadi(c['lay'])} if c.get('lay') else {})} for c in d['categories']],
                                           'items': [{**i, **({'lay': baghdadi(i['lay'])} if i.get('lay') else {})} for i in d['items']]},
        'content/education.json': lambda d: [{**m, 'ar': baghdadi(m['ar']), 'paras': [baghdadi(p) for p in m['paras']]} for m in d],
    }
    for rel, fn in files.items():
        p = ROOT / rel; old = json.loads(p.read_text(encoding='utf-8')); new = fn(old)
        if new != old:
            changed += 1
            if not dry: p.write_text(json.dumps(new, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            print('updated' if not dry else 'would update', rel)
    # family app strings: Arabic runs inside the JS source
    p = ROOT / 'public/app/app.js'; src = p.read_text(encoding='utf-8')
    out = re.sub(rf'[{AR}][{AR}\s،؟.()"«»\-]*', lambda m: baghdadi(m.group(0)), src)
    if out != src:
        changed += 1
        if not dry: p.write_text(out, encoding='utf-8')
        print('updated' if not dry else 'would update', 'public/app/app.js')
    print('files changed:', changed)


if __name__ == '__main__':
    main('--dry-run' in sys.argv)
