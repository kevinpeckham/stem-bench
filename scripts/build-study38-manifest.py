#!/usr/bin/env python3 -I
"""Study 38 (docs/BRIEF-STUDY38.md): build corpus/study38-manifest.json.
No model spend; data preparation only.

Arm A (modern, automatic): the ten Josh Woodward songs with artist-chart
truth (corpus/study34-truth, corpus/study35-truth); audio already decoded
for Studies 34/35; madmom downbeats already in results/study36-trackers.json.

Arm B (acoustic guitar, steady tempo): GuitarSet v1.1.0 (CC BY 4.0,
Zenodo 3371780), the singer-songwriter style comping excerpts (6 lead
sheets x 6 players = 36), mono reference-microphone audio decoded to
22050 Hz f32le; truth = the instructed chord sheet (JAMS chord annotation
with no data_source), annotated beats and measures, tempo and key from
the file name.

Arm C (voice and piano, free tempo): Schubert Winterreise Dataset v2.1
(CC BY 3.0, Zenodo 3968389), the SC06 performance (Scarlata/Denk, 24
songs); truth = ann_audio_chord for SC06, bars = ann_audio_measure.

Audio stays out of git (corpus-study38/ is ignored); sha256 per file is
recorded here.
"""
import csv
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GS = ROOT / "corpus-study38" / "guitarset"
SWD = ROOT / "corpus-study38" / "winterreise"
OUT = ROOT / "corpus" / "study38-manifest.json"
SR = 22050


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def decode(src: Path, dst: Path) -> None:
    if dst.exists():
        return
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-acodec", "pcm_f32le", str(dst)],
        check=True,
    )


entries = {}

# ---- Arm A -------------------------------------------------------------
MODERN = {
    "jw-let-it-in": ("corpus-study34", "study34-truth"),
    "jw-same-boat": ("corpus-study34", "study34-truth"),
    "jw-gravity": ("corpus-study35", "study35-truth"),
    "jw-my-favorite-regret": ("corpus-study35", "study35-truth"),
    "jw-california-lullabye": ("corpus-study35", "study35-truth"),
    "jw-swansong": ("corpus-study35", "study35-truth"),
    "jw-afterglow": ("corpus-study35", "study35-truth"),
    "jw-cherubs": ("corpus-study35", "study35-truth"),
    "jw-goodbye-to-spring": ("corpus-study35", "study35-truth"),
    "jw-im-letting-go": ("corpus-study35", "study35-truth"),
}
s35 = json.load(open(ROOT / "results" / "study35.json"))["results"]
s34 = json.load(open(ROOT / "results" / "study34.json"))["results"]
for slug, (cdir, tdir) in MODERN.items():
    truth = json.load(open(ROOT / "corpus" / tdir / f"{slug}.truth.json"))
    published = [c for sec in truth["sections"].values() for c in sec]
    base = s35.get(slug) or s34.get(slug)
    entries[slug] = {
        "arm": "A",
        "raw": f"{cdir}/{slug}.mp3.22050.f32le.raw",
        "title": slug.replace("jw-", "").replace("-", " "),
        "declared": truth.get("declared"),
        "truth": {"published": published, "transposition": truth["transposition"]["value"], "tier": truth.get("tier"), "source": truth.get("source")},
        "baseline": {
            "study": "35" if slug in s35 else "34",
            "roots": base["roots"],
            "quals": base["quals"],
            "draftBars": base.get("draftBars"),
            "class": base.get("class"),
        },
        "trackers": "results/study36-trackers.json",
    }

# ---- Arm B -------------------------------------------------------------
gs_audio = GS / "audio_mono-mic"
gs_raw = GS / "raw"
gs_raw.mkdir(exist_ok=True)
for jams_path in sorted((GS / "annotation").glob("*_SS*_comp.jams")):
    name = jams_path.stem  # e.g. 00_SS1-68-E_comp
    m = re.match(r"^(\d\d)_(SS\d)-(\d+)-([A-G][#b]?)_comp$", name)
    if not m:
        continue
    player, sheet, bpm, key = m.groups()
    wav = gs_audio / f"{name}_mic.wav"
    if not wav.exists():
        print(f"missing audio {wav}", file=sys.stderr)
        continue
    raw = gs_raw / f"{name}.22050.f32le.raw"
    decode(wav, raw)
    j = json.load(open(jams_path))
    chords = [a for a in j["annotations"] if a["namespace"] == "chord"]
    instructed = next(a for a in chords if not a["annotation_metadata"].get("data_source"))
    performed = next((a for a in chords if a["annotation_metadata"].get("data_source")), None)
    beats = next(a for a in j["annotations"] if a["namespace"] == "beat_position")
    bars = [d["time"] for d in beats["data"] if d["value"]["position"] == 1]
    num_beats = beats["data"][0]["value"]["num_beats"]
    slug = f"gs-{name}"
    entries[slug] = {
        "arm": "B",
        "raw": str(raw.relative_to(ROOT)),
        "sha256": sha256(raw),
        "seconds": round(j["file_metadata"]["duration"], 2),
        "title": "acoustic guitar excerpt",
        "declared": {"bpm": int(bpm), "meter": f"{num_beats}/4", "key": key, "style": sheet, "player": player},
        "truth": {
            "published": None,  # filled by the runner from timedChords via chordSequence (house symbols)
            "timedChords": [{"start": d["time"], "end": d["time"] + d["duration"], "label": d["value"]} for d in instructed["data"]],
            "performedChords": [{"start": d["time"], "end": d["time"] + d["duration"], "label": d["value"]} for d in performed["data"]] if performed else None,
            "transposition": 0,
            "tier": 1,
            "source": "GuitarSet instructed chord annotation (the lead sheet given to the player)",
        },
        "annotatedBars": bars,
        "annotatedBeats": [d["time"] for d in beats["data"]],
        "trackers": "results/study38-trackers.json",
    }

# ---- Arm C -------------------------------------------------------------
swd_root = next((p for p in SWD.glob("**/01_RawData") if p.is_dir()), None)
if swd_root is None:
    print("winterreise not unpacked yet; arm C skipped", file=sys.stderr)
else:
    base = swd_root.parent
    audio_dir = swd_root / "audio_wav"
    chord_dir = base / "02_Annotations" / "ann_audio_chord"
    measure_dir = base / "02_Annotations" / "ann_audio_measure"
    swd_raw = SWD / "raw"
    swd_raw.mkdir(exist_ok=True)
    for wav in sorted(list(audio_dir.glob("*SC06.wav")) + list(audio_dir.glob("*HU33.wav"))):
        name = wav.stem  # Schubert_D911-01_SC06
        perf = name.split("_")[-1]
        # SC06 (2006, Scarlata/Denk; audio CC BY-NC-ND 3.0 per 03_ExtraMaterial/license_SC06.txt,
        # used unmodified for measurement only) is the drafted arm C; HU33 (1933, Hüsch; Public
        # Domain Mark 1.0) joins the $0 metrical arm only.
        arm = "C" if perf == "SC06" else "C-metrical"
        raw = swd_raw / f"{name}.22050.f32le.raw"
        decode(wav, raw)
        chord_csv = next(chord_dir.glob(f"{name}*.csv"))
        measure_csv = next(measure_dir.glob(f"{name}*.csv"))
        timed = []
        with open(chord_csv, newline="") as f:
            rows = list(csv.reader(f, delimiter=";"))
        header = rows[0]
        for r in rows[1:]:
            rec = dict(zip(header, r))
            timed.append({"start": float(rec["start"]), "end": float(rec["end"]), "label": rec["shorthand"]})
        bars = []
        with open(measure_csv, newline="") as f:
            rows = list(csv.reader(f, delimiter=";"))
        header = rows[0]
        for r in rows[1:]:
            rec = dict(zip(header, r))
            bars.append(float(rec["start"]))
        slug = f"swd-{name.split('_')[1].lower()}-{perf.lower()}"
        entries[slug] = {
            "arm": arm,
            "license": "CC BY-NC-ND 3.0 (audio; 03_ExtraMaterial/license_SC06.txt)" if perf == "SC06" else "Public Domain Mark 1.0 (03_ExtraMaterial/license_HU33.txt)",
            "raw": str(raw.relative_to(ROOT)),
            "sha256": sha256(raw),
            "title": "song for voice and piano",
            "declared": None,
            "truth": {
                "published": None,
                "timedChords": timed,
                "transposition": 0,
                "tier": 1,
                "source": f"Schubert Winterreise Dataset {chord_csv.name} (audio-time chord annotation, {perf})",
            },
            "annotatedBars": bars,
            "trackers": "results/study38-trackers.json",
        }

OUT.write_text(json.dumps({"note": __doc__.strip(), "entries": entries}, indent="\t") + "\n")
from collections import Counter

print(Counter(e["arm"] for e in entries.values()), "->", OUT)
