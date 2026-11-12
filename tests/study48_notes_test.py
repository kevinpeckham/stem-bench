"""Unit tests for the Study 48 note pipelines' rules (scripts/study48-notes.py):
    .venv-study36/bin/python -I -m unittest tests/study48_notes_test.py"""
import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("s48", ROOT / "scripts" / "study48-notes.py")


def load():
    # the script runs its main body on import; load only the functions by executing up to the pipeline loop
    src = (ROOT / "scripts" / "study48-notes.py").read_text().split("\nout = {")[0]
    ns = {"__name__": "s48", "__file__": str(ROOT / "scripts" / "study48-notes.py")}
    exec(compile(src, "study48-notes.py", "exec"), ns)
    return ns


class BassConstraint(unittest.TestCase):
    def setUp(self):
        self.s = load()

    def test_keeps_the_lowest_of_simultaneous_notes_and_drops_short_and_out_of_range(self):
        notes = [
            {"start": 1.00, "end": 1.50, "pitch": 38},
            {"start": 1.02, "end": 1.40, "pitch": 50},  # the octave above, 20 ms later: dropped for the lower
            {"start": 1.20, "end": 1.24, "pitch": 40},  # 40 ms: too short
            {"start": 2.00, "end": 2.50, "pitch": 70},  # above the bass
            {"start": 2.00, "end": 2.50, "pitch": 33},
            {"start": 3.00, "end": 3.50, "pitch": 24},  # below E1
        ]
        out = self.s["bass_constrain"](notes)
        self.assertEqual([n["pitch"] for n in out], [38, 33])

    def test_score_counts_octave_errors_by_register_and_direction(self):
        truth = [{"start": 0.0, "end": 0.5, "pitch": 31}, {"start": 1.0, "end": 1.5, "pitch": 43}, {"start": 2.0, "end": 2.5, "pitch": 36}]
        est = [{"start": 0.01, "end": 0.5, "pitch": 43}, {"start": 1.0, "end": 1.5, "pitch": 43}, {"start": 2.0, "end": 2.5, "pitch": 24}]
        s = self.s["score"](truth, est)
        self.assertEqual(s["exact"]["f"], round(1 / 3, 4))  # only the F2 bar's note is exact
        self.assertEqual(s["pitchClass"]["f"], 1.0)
        self.assertEqual(s["octave"], {"matchedOnClass": 3, "wrong": 2, "rate": round(2 / 3, 4), "up": 1, "down": 1})
        self.assertEqual(s["byRegister"]["E1-A1"], {"truthNotes": 1, "matchedClass": 1, "octaveWrong": 1})
        self.assertEqual(s["byRegister"]["F2-B2"]["octaveWrong"], 0)

    def test_pyin_segments_a_synthetic_bass_line(self):
        import numpy as np

        sr = 22050
        y = np.zeros(int(sr * 2.0), dtype=np.float32)
        for k, midi in enumerate([31, 36, 38, 43]):
            f = 440 * 2 ** ((midi - 69) / 12)
            t = np.arange(int(sr * 0.5)) / sr
            seg = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-3 * t)
            y[k * int(sr * 0.5) : (k + 1) * int(sr * 0.5)] = seg.astype(np.float32)
        raw = ROOT / "tests" / ".study48-synth.raw"
        y.tofile(raw)
        try:
            notes = self.s["pyin_notes"](raw)
        finally:
            raw.unlink()
        pitches = [n["pitch"] for n in notes if n["end"] - n["start"] > 0.2]
        self.assertEqual(pitches, [31, 36, 38, 43])


if __name__ == "__main__":
    sys.exit(unittest.main())
