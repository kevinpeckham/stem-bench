#!/usr/bin/env python3
"""Re-read every bass truth MIDI with the corrected parser
(scripts/ingest-bass-pair.py midi_notes, first-in-first-out pairing since
2026-11-13) without touching the audio, the Basic Pitch cache or the offsets.

    .venv-study36/bin/python -I scripts/reparse-bass-midi.py

For each entry of corpus/study48-manifest.json: checks the MIDI's digest,
rewrites <stem folder>/midi-notes.json, and re-checks the alignment the
intake found: the same fine scan (10 ms steps, within 0.3 s of the stored
offset, most notes right on pitch class within 60 ms, ties to the smallest
median onset error) must land within 10 ms of the stored offset, or the
script stops. Updates the entry's note count, pitch range, span and
alignment counts, and records the old count."""
import importlib.util
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ingest_bass_pair", ROOT / "scripts" / "ingest-bass-pair.py")
ingest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ingest)

man = json.loads(ingest.MANIFEST.read_text())
for slug, e in man["entries"].items():
    mid = ROOT / e["midi"]
    if ingest.sha256(mid) != e["midiSha256"]:
        raise SystemExit(f"{slug}: the MIDI is not the one taken in")
    d = mid.parent
    old = json.loads((d / "midi-notes.json").read_text())["notes"]
    m = ingest.midi_notes(mid)
    notes = m["notes"]
    if m["tempos"] != e["tempos"] or m["sigs"] != e["sigs"]:
        raise SystemExit(f"{slug}: the tempo or signature map changed")
    bp = json.loads((d / "bp-notes.json").read_text())
    bps = sorted((n[0], n[2]) for n in bp)
    starts = np.array([s for s, _ in bps])
    stored = -e["offsetSec"]
    scans = [(float(lg), ingest.match(notes, bps, starts, lg, e["seconds"])) for lg in np.arange(stored - 0.3, stored + 0.3, ingest.DT)]
    top = max(r["classRight"] for _, r in scans)
    lag, r = min(((lg, rr) for lg, rr in scans if rr["classRight"] >= top - 2), key=lambda x: x[1]["medianOnsetErr"] if x[1]["medianOnsetErr"] is not None else 9)
    if abs(lag - stored) > 0.0101:
        raise SystemExit(f"{slug}: the corrected notes align at {-lag:.3f} s, not the stored {e['offsetSec']:.3f} s")
    at_stored = ingest.match(notes, bps, starts, stored, e["seconds"])
    (d / "midi-notes.json").write_text(json.dumps(m))
    zero_old = sum(1 for n in old if n["end"] - n["start"] < 1e-4)
    if "midiNotesFirstParse" not in e:
        e["midiNotesFirstParse"] = {"notes": len(old), "zeroLength": zero_old, "alignment": e["alignment"], "note": "the intake's parser until 2026-11-13 paired each note-off with the latest note-on of its pitch; back-to-back notes of one pitch lost the first note and left the second with no length"}
    e["midiNotes"] = len(notes)
    e["midiPitchRange"] = [min(n["pitch"] for n in notes), max(n["pitch"] for n in notes)]
    e["midiSpan"] = [notes[0]["start"], max(n["end"] for n in notes)]
    e["alignment"] = at_stored
    print(f"{slug}: {len(old)} notes ({zero_old} zero-length) -> {len(notes)} notes ({sum(1 for n in notes if n['end'] - n['start'] < 1e-4)} zero-length); offset holds at {e['offsetSec']:.3f} s (scan lands at {-lag:.3f}); onsets matched {at_stored['onsetMatched']}/{at_stored['inSpan']}, pitch class right {at_stored['classRight']}")
ingest.MANIFEST.write_text(json.dumps(man, indent="\t") + "\n")
