#!/usr/bin/env python3
"""Study 36b census parser: read the fetched Josh Woodward song pages
(corpus-study36/pages/*.html, not committed) and write the committed
metadata table corpus/study36b-census.json: declared tempo, key, meter
and feel, length, the CC BY 4.0 license line's presence, the MP3 URL,
and whether a Tablature & Chords block with chord symbols exists. The
page text itself is not committed; only these fields, so the table is
auditable against the live pages. Run with python -I (the pages are
downloaded data)."""
import html as H
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "corpus-study36" / "pages"
OUT = ROOT / "corpus" / "study36b-census.json"

CHORD_LINE = re.compile(
    r"(?m)^\s*(?:[A-G][#b]?(?:m|maj|min|sus|dim|add|aug)?[0-9]*(?:/[A-G][#b]?)?\s+)+[A-G][#b]?(?:m|maj|min|sus|dim|add|aug)?[0-9]*(?:/[A-G][#b]?)?\s*$"
)


def field(h: str, name: str) -> str | None:
    i = h.find(f"<b>{name}:</b>")
    if i < 0:
        return None
    seg = h[i : i + 220]
    txt = H.unescape(re.sub(r"<!-- -->|<[^>]+>", "", seg)).replace(f"{name}:", "").strip()
    for cut in ("Length", "Meter", "Tempo", "Key", "License", "This work"):
        if cut in txt[1:]:
            txt = txt.split(cut)[0].strip()
    return txt or None


rows = {}
missing = []
for p in sorted(PAGES.glob("*.html")):
    slug = p.stem
    h = p.read_text(errors="replace")
    if "Unknown Song" in h or len(h) < 2000:
        missing.append(slug)
        continue
    tempo = field(h, "Tempo")
    meter = field(h, "Meter")
    key = field(h, "Key")
    length = field(h, "Length")
    bpm = None
    if tempo:
        m = re.search(r"(\d+(?:\.\d+)?)", tempo)
        bpm = float(m.group(1)) if m else None
    meter_sig, feel = None, None
    if meter:
        parts = meter.split()
        meter_sig = parts[0] if parts else None
        feel = parts[1] if len(parts) > 1 else None
    mp3 = re.search(r'src="(https://www\.joshwoodward\.com/mp3/[^"]+\.mp3)"', h)
    pre = re.search(r"Tablature &amp; Chords.*?<pre[^>]*>(.*?)</pre>", h, re.S)
    chords = H.unescape(re.sub(r"</?b>", "", pre.group(1))).strip() if pre else None
    sym_lines = len(CHORD_LINE.findall(chords)) if chords else 0
    title = re.search(r"<title>(.*?)</title>", h, re.S)
    rows[slug] = {
        "page": f"https://www.joshwoodward.com/song/{slug}",
        "title": H.unescape(title.group(1)).split("|")[0].strip() if title else slug,
        "bpm": bpm,
        "key": key,
        "meter": meter_sig,
        "feel": feel,
        "length": length,
        "ccBy40": "Creative Commons Attribution 4.0" in H.unescape(h),
        "mp3": mp3.group(1) if mp3 else None,
        "chordsBlock": chords is not None,
        "chordSymbolLines": sym_lines,
    }

census = {
    "fetched": "2026-11-10",
    "source": "joshwoodward.com song pages (Song Data block); audio from the artist's Epic Bundle, purchased 2026-11-10",
    "pages": len(rows),
    "missing": missing,
    "songs": rows,
}
OUT.write_text(json.dumps(census, indent=1, ensure_ascii=False) + "\n")

from collections import Counter  # noqa: E402

meters = Counter(r["meter"] for r in rows.values())
feels = Counter(f"{r['meter']} {r['feel']}" for r in rows.values())
print(f"pages parsed {len(rows)}, unusable {len(missing)}")
print("with bpm:", sum(1 for r in rows.values() if r["bpm"]), "| with meter:", sum(1 for r in rows.values() if r["meter"]), "| CC BY 4.0 line:", sum(1 for r in rows.values() if r["ccBy40"]), "| mp3 url:", sum(1 for r in rows.values() if r["mp3"]))
print("meters:", dict(meters.most_common()))
print("meter+feel:", dict(feels.most_common(12)))
print("chords blocks:", sum(1 for r in rows.values() if r["chordsBlock"]), "| with >=3 symbol lines:", sum(1 for r in rows.values() if r["chordSymbolLines"] >= 3))
bpms = sorted(r["bpm"] for r in rows.values() if r["bpm"])
if bpms:
    print(f"bpm range {bpms[0]}..{bpms[-1]}, median {bpms[len(bpms)//2]}")
print(f"wrote {OUT}")
