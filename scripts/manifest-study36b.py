#!/usr/bin/env python3
"""Study 36b corpus manifest: pair the purchased Josh Woodward bundles
(corpus-study36/{regular,instrumental,alternate}, not committed) with the
song-page census (corpus/study36b-census.json) and write
corpus/study36b-manifest.json: per song slug, the regular and
instrumental filenames, their sha256, duration in seconds from the
decoded raw, and the declared tempo/meter/key. Only names, hashes and
numbers are committed. Run with python -I."""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
C36 = ROOT / "corpus-study36"
census = json.load(open(ROOT / "corpus" / "study36b-census.json"))
songs = census["songs"]
SR = 22050

norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
# hand aliases where the page slug and the filename title differ
ALIASES = {
    "athousandskinspt1": "AThousandSkinsPart1",
    "athousandskinspt2": "AThousandSkinsPart2",
    "skynyrdsnumber": "SkynyrdsNumber4874",
    "xb": "0x0000007b",
}
by_norm = {norm(s): s for s in songs}


def title_of(fname: str) -> str:
    base = re.sub(r"^(JoshWoodward|WoshJoodward)-", "", fname[:-4])
    base = re.sub(r"-NoVox(-|$)", r"\1", base).rstrip("-")
    parts = base.split("-")
    # the track number is the last short numeric segment with something after it
    # (the album "33" is itself numeric, so the first match is wrong there)
    for i in range(len(parts) - 2, -1, -1):
        if re.fullmatch(r"\d{1,3}", parts[i]):
            return "-".join(parts[i + 1 :])
    return base


def hashes(name: str) -> dict:
    out = {}
    p = C36 / f"{name}.sha256"
    if p.exists():
        for line in open(p):
            h, f = line.strip().split(maxsplit=1)
            out[f] = h
    return out


def duration(dirname: str, fname: str) -> float | None:
    raw = C36 / dirname / f"{fname}.22050.f32le.raw"
    return round(raw.stat().st_size / 4 / SR, 2) if raw.exists() else None


manifest = {}
unmatched = {"regular": [], "instrumental": []}
for kind in ("regular", "instrumental"):
    hs = hashes(kind)
    for f in sorted(os.listdir(C36 / kind)):
        if not f.endswith(".mp3"):
            continue
        t = norm(title_of(f))
        slug = by_norm.get(t) or ALIASES.get(t)
        if slug is None or slug not in songs:
            unmatched[kind].append(f)
            continue
        entry = manifest.setdefault(slug, {"page": songs[slug]["page"], "bpm": songs[slug]["bpm"], "meter": songs[slug]["meter"], "feel": songs[slug]["feel"], "key": songs[slug]["key"]})
        if kind in entry:
            # a second file for the same song (album duplicate); keep the first, record the other
            entry.setdefault(f"{kind}Also", []).append({"file": f, "sha256": hs.get(f)})
            continue
        entry[kind] = {"file": f, "sha256": hs.get(f), "seconds": duration(kind, f)}

paired = sum(1 for e in manifest.values() if "regular" in e and "instrumental" in e)
with_truth = sum(1 for e in manifest.values() if "regular" in e and e["bpm"] and e["meter"])
out = {
    "purchased": "2026-11-10, Josh Woodward Epic Bundle (Regular MP3, Instrumental MP3, Alternate MP3 zips); sha256 of the zips in corpus-study36/bundles.sha256 (not committed) and below",
    "zips": {l.split()[1].split("/")[-1]: l.split()[0] for l in open(C36 / "bundles.sha256")} if (C36 / "bundles.sha256").exists() else {},
    "license": "CC BY 4.0 (artist's FAQ); attribution: Music by Josh Woodward, https://www.joshwoodward.com/",
    "songs": len(manifest),
    "regularWithDeclaredTempoAndMeter": with_truth,
    "pairedWithInstrumental": paired,
    "unmatched": unmatched,
    "alternateBundleFiles": len([f for f in os.listdir(C36 / "alternate") if f.endswith(".mp3")]) if (C36 / "alternate").exists() else 0,
    "entries": manifest,
}
(ROOT / "corpus" / "study36b-manifest.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
print(f"songs {len(manifest)} | regular with tempo+meter {with_truth} | paired with instrumental {paired} | unmatched regular {len(unmatched['regular'])} instrumental {len(unmatched['instrumental'])}")
for k, v in unmatched.items():
    for f in v:
        print(f"  unmatched {k}: {f}")
