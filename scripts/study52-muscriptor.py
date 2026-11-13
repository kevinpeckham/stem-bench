#!/usr/bin/env python3
"""Study 52, arm 2 (docs/BRIEF-STUDY52.md): MuScriptor on the bass stems.

MuScriptor (Kyutai and Mirelo; code MIT, weights CC BY-NC 4.0, gated on
Hugging Face), the `medium` model, greedy decoding as shipped, constrained to
the `electric_bass` instrument group, on Kevin's stem as a file. No truth is
read here. Two note lists per song, in stem time, beside the stem (gitignored):

  study52/muscriptor.json      the model's event stream as it comes
                               (TranscriptionModel.transcribe): the primary list
  study52/muscriptor-cli.json  the notes of the MIDI its command line writes by
                               default (the same events with the package's own
                               beat grid detected and its measured onset lag
                               taken out; not quantized), read back with the
                               bench's MIDI parser

Rows are [startSec, durationSec, pitchMidi, 0].

    .venv-study52m/bin/python -I scripts/study52-muscriptor.py [slug ...]
"""
import importlib.util
import json
import sys
import tempfile
import time
from pathlib import Path

import torch
from muscriptor import TranscriptionModel
from muscriptor.events import NoteEndEvent, NoteStartEvent
from muscriptor.utils.midi import ExportOptions

ROOT = Path(__file__).resolve().parent.parent
SIZE = "medium"
INSTRUMENTS = ["electric_bass"]
spec = importlib.util.spec_from_file_location("ingest_bass_pair", ROOT / "scripts" / "ingest-bass-pair.py")
ingest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ingest)

man = json.loads((ROOT / "corpus" / "study48-manifest.json").read_text())
torch.set_num_threads(16)
model = TranscriptionModel.load_model(SIZE, device="cpu")
for slug in sys.argv[1:] or list(man["entries"]):
    e = man["entries"][slug]
    wav = ROOT / e["wav"]
    out = ROOT / Path(e["raw"]).parent / "study52"
    out.mkdir(exist_ok=True)
    t = time.time()
    grid = model.detect_beat_grid_for(str(wav), "best-effort")
    events = list(model.transcribe(str(wav), instruments=INSTRUMENTS))
    ends = {ev.start_event.index: ev.end_time for ev in events if isinstance(ev, NoteEndEvent)}
    starts = [ev for ev in events if isinstance(ev, NoteStartEvent)]
    rows = sorted([float(s.start_time), float(ends[s.index] - s.start_time), int(s.pitch), 0] for s in starts)
    (out / "muscriptor.json").write_text(json.dumps(rows))
    onsets = [s.start_time for s in starts]
    if grid is not None:
        grid = grid.with_onset_delay(onsets)
    midi = model.events_to_midi_bytes(iter(events), beat_grid=grid, export=ExportOptions())
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "m.mid"
        p.write_bytes(midi)
        cli = ingest.midi_notes(p)["notes"]
    (out / "muscriptor-cli.mid").write_bytes(midi)
    (out / "muscriptor-cli.json").write_text(json.dumps([[n["start"], n["end"] - n["start"], n["pitch"], 0] for n in cli]))
    delay = getattr(grid, "onset_delay", None) if grid is not None else None
    (out / "muscriptor.meta.json").write_text(json.dumps({"size": SIZE, "instruments": INSTRUMENTS, "notes": len(rows), "cliNotes": len(cli), "instrumentsHeard": sorted({s.instrument for s in starts}), "gridDetected": grid is not None, "onsetDelay": repr(delay), "seconds": round(time.time() - t, 1)}))
    print(f"{slug}: {len(rows)} notes ({len(cli)} in the CLI's MIDI); instruments {sorted({s.instrument for s in starts})}; grid {'yes' if grid is not None else 'no'}, onset delay {delay!r}; {time.time() - t:.0f} s")
