#!/usr/bin/env python3
"""The intake's MIDI parser (scripts/ingest-bass-pair.py midi_notes).
    .venv-study36/bin/python -I tests/ingest_bass_pair_test.py"""
import importlib.util
import tempfile
from pathlib import Path

import mido

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ingest_bass_pair", ROOT / "scripts" / "ingest-bass-pair.py")
ingest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ingest)


def parse(events, tempo_bpm=120):
    """events: (tick, type, note, velocity) in file order; 480 ticks to the beat."""
    mid = mido.MidiFile(type=0, ticks_per_beat=480)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(tempo_bpm), time=0))
    last = 0
    for tick, kind, note, vel in events:
        tr.append(mido.Message(kind, note=note, velocity=vel, time=tick - last))
        last = tick
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "t.mid"
        mid.save(str(p))
        return [(n["start"], n["end"], n["pitch"], n["vel"]) for n in ingest.midi_notes(p)["notes"]]


# three notes of one pitch back to back, each new on written BEFORE the old off at the same tick (as Logic does)
legato = parse([(0, "note_on", 50, 100), (480, "note_on", 50, 101), (480, "note_off", 50, 64), (960, "note_on", 50, 102), (960, "note_off", 50, 64), (1440, "note_off", 50, 64)])
assert legato == [(0.0, 0.5, 50, 100), (0.5, 1.0, 50, 101), (1.0, 1.5, 50, 102)], legato

# the same notes with the off written first parse the same
plain = parse([(0, "note_on", 50, 100), (480, "note_off", 50, 64), (480, "note_on", 50, 101), (960, "note_off", 50, 64), (960, "note_on", 50, 102), (1440, "note_off", 50, 64)])
assert plain == legato, plain

# a note-on with velocity 0 is an off; other pitches are independent; an off with nothing sounding is ignored
mixed = parse([(0, "note_on", 40, 90), (0, "note_on", 47, 80), (240, "note_on", 40, 0), (480, "note_off", 47, 64), (480, "note_off", 47, 64)])
assert mixed == [(0.0, 0.25, 40, 90), (0.0, 0.5, 47, 80)], mixed

# overlapping notes of one pitch close in the order they began
overlap = parse([(0, "note_on", 45, 70), (240, "note_on", 45, 71), (480, "note_off", 45, 64), (960, "note_off", 45, 64)])
assert overlap == [(0.0, 0.5, 45, 70), (0.25, 1.0, 45, 71)], overlap

print("ingest_bass_pair_test: 4 cases pass")
