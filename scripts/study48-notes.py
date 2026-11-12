#!/usr/bin/env python3
"""Study 48 (docs/BRIEF-STUDY48.md), Asks A and B: the three transcriptions
of each bass stem and their note-level scores against the MIDI truth, on
the app's mix timeline.

    .venv-study36/bin/python -I scripts/study48-notes.py [slug ...]

Pipelines (all from the bench's decode of Kevin's stem, 22050 Hz mono):
  bp        Basic Pitch as the app runs it (scripts/transcribe-child.mjs, cached by the intake)
  bp-bass   the same notes constrained to a bass: pitch 28..60 (E1 to C4), one note at a time
            (of notes starting within 30 ms keep the lowest), and none shorter than 60 ms
  pyin      librosa.pyin (fmin 30 Hz, fmax 400 Hz, frame 2048, hop 256), voiced frames cut into
            notes at librosa onsets and where the rounded pitch changes; pitch = the median frame;
            none shorter than 60 ms
Scores (mir_eval.transcription): precision, recall, F with onset within 50 ms and pitch within
50 cents (octave-exact), offsets ignored; the same with pitches folded to one octave (pitch
class); onset-only F; the octave error rate = among notes matched on onset and pitch class, the
share whose octave differs, by the truth's register (E1..A1 = 28..33, Bb1..E2 = 34..40,
F2..B2 = 41..47, C3 and up); and the direction of the octave errors.
Writes the note lists beside the stem (gitignored) and results/study48-notes.json."""
import json
import sys
from pathlib import Path

import librosa
import mir_eval
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RATE = 22050
MIN_NOTE = 0.06
BASS_LO, BASS_HI = 28, 60
CLUSTER = 0.03
REGISTERS = [("E1-A1", 28, 33), ("Bb1-E2", 34, 40), ("F2-B2", 41, 47), ("C3+", 48, 127)]
man = json.loads((ROOT / "corpus" / "study48-manifest.json").read_text())


def bp_notes(d: Path) -> list:
    return [{"start": s, "end": s + dur, "pitch": int(p), "amp": a} for s, dur, p, a in json.loads((d / "bp-notes.json").read_text())]


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


def pyin_notes(raw: Path) -> list:
    y = np.fromfile(raw, dtype=np.float32)
    hop = 256
    f0, voiced, _ = librosa.pyin(y, fmin=30.0, fmax=400.0, sr=RATE, frame_length=2048, hop_length=hop)
    times = librosa.frames_to_time(np.arange(len(f0)), sr=RATE, hop_length=hop)
    onset_frames = set(librosa.onset.onset_detect(y=y, sr=RATE, hop_length=hop, backtrack=True).tolist())
    midi = np.where(voiced & np.isfinite(f0), np.round(librosa.hz_to_midi(np.where(np.isfinite(f0), f0, 1.0))), -1)
    notes = []
    i = 0
    n = len(midi)
    while i < n:
        if midi[i] < 0:
            i += 1
            continue
        j = i + 1
        while j < n and midi[j] == midi[i] and j not in onset_frames:
            j += 1
        frames = f0[i:j]
        start, end = times[i], times[j] if j < n else times[-1] + hop / RATE
        if end - start >= MIN_NOTE:
            notes.append({"start": float(start), "end": float(end), "pitch": int(round(float(np.median(librosa.hz_to_midi(frames)))))})
        i = j
    return notes


def positive(notes: list) -> list:
    """mir_eval needs strictly positive durations: a zero-length MIDI note (note-on and note-off on one tick) is dropped, and counted by the caller."""
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


out = {"pipelines": ["bp", "bp-bass", "pyin"], "songs": {}}
slugs = sys.argv[1:] or list(man["entries"])
for slug in slugs:
    e = man["entries"][slug]
    d = ROOT / Path(e["raw"]).parent
    raw = ROOT / e["raw"]
    stem_to_mix = e["appStemOffset"]["offsetSec"]
    midi_to_mix = e["midiToMixSec"]
    mid = json.loads((d / "midi-notes.json").read_text())["notes"]
    # the MIDI is at written pitch; a bass sounds an octave lower (barmark grammar 4.1), so the truth is the MIDI down twelve (re-registered 2026-11-12, docs/BRIEF-STUDY48.md "Correction")
    truth = [{"start": n["start"] + midi_to_mix, "end": n["end"] + midi_to_mix, "pitch": n["pitch"] - 12} for n in mid]
    (d / "truth-mix.json").write_text(json.dumps(truth))
    bp = bp_notes(d)
    pipes = {"bp": bp, "bp-bass": bass_constrain(bp)}
    py_cache = d / "pyin-notes.json"
    if not py_cache.exists():
        py_cache.write_text(json.dumps(pyin_notes(raw)))
    pipes["pyin"] = json.loads(py_cache.read_text())
    out["songs"][slug] = {}
    for name, notes in pipes.items():
        shifted = [{"start": n["start"] + stem_to_mix, "end": n["end"] + stem_to_mix, "pitch": n["pitch"]} for n in notes]
        (d / f"notes-{name}-mix.json").write_text(json.dumps(shifted))
        s = score(truth, shifted)
        out["songs"][slug][name] = s
        print(f"{slug:18s} {name:8s} notes {s['estNotes']:4d} (truth {s['truthNotes']}) | F exact {s['exact']['f']:.3f} class {s['pitchClass']['f']:.3f} onset {s['onsetOnly']['f']:.3f} | octave wrong {s['octave']['wrong']}/{s['octave']['matchedOnClass']} (up {s['octave']['up']}, down {s['octave']['down']}) | by register " + ", ".join(f"{k} {v['octaveWrong']}/{v['matchedClass']}" for k, v in s["byRegister"].items()))
(ROOT / "results" / "study48-notes.json").write_text(json.dumps(out, indent="\t") + "\n")
print("results/study48-notes.json written")
