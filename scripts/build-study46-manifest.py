#!/usr/bin/env python3
"""Study 46 (docs/BRIEF-STUDY46.md): the whole of GuitarSet as a hint
corpus. Every excerpt (360: 6 players × 5 styles × 2 progressions × 3
tempi... as shipped, comp and solo) decoded to 22050 Hz mono f32le raw
(gitignored) and its JAMS read for the instructed chords (the lead sheet),
the performed chords (what the player played), and the annotated bars.
Writes corpus/study46-manifest.json. $0, mechanical; from
build-study38-manifest.py's arm B, which read the SS comp excerpts only."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GS = ROOT / "corpus-study38" / "guitarset"
SR = 22050


def decode(src: Path, dst: Path) -> None:
    if dst.exists():
        return
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-acodec", "pcm_f32le", str(dst)], check=True)


entries = {}
raw_dir = GS / "raw"
raw_dir.mkdir(exist_ok=True)
for jams_path in sorted((GS / "annotation").glob("*.jams")):
    name = jams_path.stem
    m = re.match(r"^(\d\d)_([A-Za-z]+\d)-(\d+)-([A-G][#b]?)_(comp|solo)$", name)
    if not m:
        print(f"skip {name}", file=sys.stderr)
        continue
    player, sheet, bpm, key, mode = m.groups()
    wav = GS / "audio_mono-mic" / f"{name}_mic.wav"
    if not wav.exists():
        print(f"missing audio {wav}", file=sys.stderr)
        continue
    raw = raw_dir / f"{name}.22050.f32le.raw"
    decode(wav, raw)
    j = json.load(open(jams_path))
    chords = [a for a in j["annotations"] if a["namespace"] == "chord"]
    instructed = next(a for a in chords if not a["annotation_metadata"].get("data_source"))
    performed = next((a for a in chords if a["annotation_metadata"].get("data_source")), None)
    beats = next(a for a in j["annotations"] if a["namespace"] == "beat_position")
    bars = [d["time"] for d in beats["data"] if d["value"]["position"] == 1]
    entries[f"gs-{name}"] = {
        "raw": str(raw.relative_to(ROOT)),
        "seconds": round(j["file_metadata"]["duration"], 2),
        "player": player,
        "style": re.sub(r"\d$", "", sheet),
        "sheet": sheet,
        "mode": mode,
        "bpm": int(bpm),
        "key": key,
        "meter": f"{beats['data'][0]['value']['num_beats']}/4",
        "instructed": [{"start": d["time"], "end": d["time"] + d["duration"], "label": d["value"]} for d in instructed["data"]],
        "performed": [{"start": d["time"], "end": d["time"] + d["duration"], "label": d["value"]} for d in performed["data"]] if performed else None,
        "annotatedBars": bars,
    }
out = ROOT / "corpus" / "study46-manifest.json"
out.write_text(json.dumps({"source": "GuitarSet (Xi et al. 2018), annotation + audio_mono-mic; instructed = the lead sheet, performed = the player's chords", "entries": entries}, indent="\t") + "\n")
from collections import Counter

print(len(entries), "excerpts;", Counter(e["style"] for e in entries.values()), Counter(e["mode"] for e in entries.values()), "with performed:", sum(1 for e in entries.values() if e["performed"]))
