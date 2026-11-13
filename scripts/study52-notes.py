#!/usr/bin/env python3
"""Study 52 (docs/BRIEF-STUDY52.md): note-level scores of the second
transcribers against the MIDI truth, by Study 48's measure (mir_eval
transcription: onset within 50 ms, pitch within 50 cents, offsets ignored;
exact, pitch class, onset only; octave errors among notes matched on class).

    .venv-study36/bin/python -I scripts/study52-notes.py            # preflight, then scores
    .venv-study36/bin/python -I scripts/study52-notes.py --check    # preflight only

Readers: every <stem folder>/study52/<reader>.json present for all six songs
([startSec, durationSec, pitchMidi, velocity] rows in stem time). Each is
scored as written (`<reader>`) and under Study 48's bass constraint
(`<reader>-bass`: E1 to C4, the lowest of notes starting within 30 ms, none
under 60 ms). The scoring and the constraint are copied from
scripts/study48-notes.py; the preflight stops the run unless they give back
results/study48-notes.json for Basic Pitch and its constrained notes on every
song. Writes notes-<pipeline>-mix.json beside each stem (gitignored) and
results/study52-notes.json."""
import json
import sys
from pathlib import Path

import librosa
import mir_eval
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
MIN_NOTE = 0.06
BASS_LO, BASS_HI = 28, 60
CLUSTER = 0.03
REGISTERS = [("E1-A1", 28, 33), ("Bb1-E2", 34, 40), ("F2-B2", 41, 47), ("C3+", 48, 127)]
READERS = ["hfbass", "muscriptor"]
man = json.loads((ROOT / "corpus" / "study48-manifest.json").read_text())


def bass_constrain(notes: list) -> list:
    kept = [n for n in notes if BASS_LO <= n["pitch"] <= BASS_HI and n["end"] - n["start"] >= MIN_NOTE]
    kept.sort(key=lambda n: n["start"])
    out = []
    i = 0
    while i < len(kept):
        j = i
        while j + 1 < len(kept) and kept[j + 1]["start"] - kept[i]["start"] <= CLUSTER:
            j += 1
        out.append(min(kept[i : j + 1], key=lambda n: n["pitch"]))
        i = j + 1
    return out


def positive(notes: list) -> list:
    return [n for n in notes if n["end"] - n["start"] > 1e-4 and n["start"] >= 0]


def to_mir(notes: list, fold: bool):
    notes = positive(notes)
    iv = np.array([[n["start"], n["end"]] for n in notes]) if notes else np.zeros((0, 2))
    p = np.array([n["pitch"] for n in notes], dtype=float)
    if fold:
        p = (p % 12) + 48
    return iv, librosa.midi_to_hz(p) if len(p) else np.zeros(0)


def score(truth: list, est: list) -> dict:
    dropped = len(truth) - len(positive(truth))
    truth = positive(truth)
    est = positive(est)
    ri, rp = to_mir(truth, False)
    ei, ep = to_mir(est, False)
    p, r, f, _ = mir_eval.transcription.precision_recall_f1_overlap(ri, rp, ei, ep, onset_tolerance=0.05, pitch_tolerance=50.0, offset_ratio=None)
    rfi, rfp = to_mir(truth, True)
    efi, efp = to_mir(est, True)
    pf, rf, ff, _ = mir_eval.transcription.precision_recall_f1_overlap(rfi, rfp, efi, efp, onset_tolerance=0.05, pitch_tolerance=50.0, offset_ratio=None)
    po, ro, fo = mir_eval.transcription.onset_precision_recall_f1(ri, ei, onset_tolerance=0.05)
    matches = mir_eval.transcription.match_notes(rfi, rfp, efi, efp, onset_tolerance=0.05, pitch_tolerance=50.0, offset_ratio=None)
    by_reg = {name: {"truthNotes": sum(1 for n in truth if lo <= n["pitch"] <= hi), "matchedClass": 0, "octaveWrong": 0} for name, lo, hi in REGISTERS}
    up = down = 0
    for ti, ei_ in matches:
        t, e = truth[ti]["pitch"], est[ei_]["pitch"]
        reg = next(name for name, lo, hi in REGISTERS if lo <= t <= hi) if t >= 28 else "E1-A1"
        by_reg[reg]["matchedClass"] += 1
        if e != t:
            by_reg[reg]["octaveWrong"] += 1
            if e > t:
                up += 1
            else:
                down += 1
    matched = len(matches)
    return {
        "truthNotes": len(truth),
        "truthDroppedZeroLength": dropped,
        "estNotes": len(est),
        "exact": {"precision": round(p, 4), "recall": round(r, 4), "f": round(f, 4)},
        "pitchClass": {"precision": round(pf, 4), "recall": round(rf, 4), "f": round(ff, 4)},
        "onsetOnly": {"precision": round(po, 4), "recall": round(ro, 4), "f": round(fo, 4)},
        "octave": {"matchedOnClass": matched, "wrong": up + down, "rate": round((up + down) / matched, 4) if matched else None, "up": up, "down": down},
        "byRegister": by_reg,
    }


# preflight: this copy of the scoring and the constraint gives back Study 48's numbers
s48 = json.loads((ROOT / "results" / "study48-notes.json").read_text())["songs"]
dirs = {slug: ROOT / Path(e["raw"]).parent for slug, e in man["entries"].items()}
truths = {slug: json.loads((d / "truth-mix.json").read_text()) for slug, d in dirs.items()}
for slug, e in man["entries"].items():
    d = dirs[slug]
    off = e["appStemOffset"]["offsetSec"]
    bp = [{"start": s, "end": s + dur, "pitch": int(p)} for s, dur, p, _ in json.loads((d / "bp-notes.json").read_text())]
    for name, notes in (("bp", bp), ("bp-bass", bass_constrain(bp))):
        mine = score(truths[slug], [{"start": n["start"] + off, "end": n["end"] + off, "pitch": n["pitch"]} for n in notes])
        if mine != s48[slug][name]:
            raise SystemExit(f"{slug} {name}: this scoring does not reproduce Study 48")
print(f"preflight: {len(dirs)} songs; the scoring and the bass constraint reproduce Study 48's note-level scores for bp and bp-bass")
if "--check" in sys.argv:
    raise SystemExit(0)

readers = [r for r in READERS if all((d / "study52" / f"{r}.json").exists() for d in dirs.values())]
out = {"readers": readers, "songs": {}}
for slug, e in man["entries"].items():
    d = dirs[slug]
    off = e["appStemOffset"]["offsetSec"]
    out["songs"][slug] = {}
    for r in readers:
        raw = [{"start": s + off, "end": s + dur + off, "pitch": int(p)} for s, dur, p, _ in json.loads((d / "study52" / f"{r}.json").read_text())]
        for name, notes in ((r, raw), (f"{r}-bass", bass_constrain(raw))):
            (d / f"notes-{name}-mix.json").write_text(json.dumps(notes))
            s = score(truths[slug], notes)
            out["songs"][slug][name] = s
            print(f"{slug:18s} {name:16s} notes {s['estNotes']:4d} (truth {s['truthNotes']}) | F exact {s['exact']['f']:.3f} class {s['pitchClass']['f']:.3f} onset {s['onsetOnly']['f']:.3f} | octave wrong {s['octave']['wrong']}/{s['octave']['matchedOnClass']} (up {s['octave']['up']}, down {s['octave']['down']})")
(ROOT / "results" / "study52-notes.json").write_text(json.dumps(out, indent="\t") + "\n")
print("results/study52-notes.json written")
