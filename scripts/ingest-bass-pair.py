#!/usr/bin/env python3
"""Study 48 (docs/BRIEF-STUDY48.md): take in one bass stem and its MIDI
truth, as Kevin supplies them (a URL or a local path each), and find how
they line up.

    .venv-study36/bin/python -I scripts/ingest-bass-pair.py <slug> <wav> <mid> [--label "Bass Guitar"]

Downloads into corpus-mmkk/<slug>/bass-truth/ (gitignored; audio and
MIDI never committed), decodes the stem to 22050 Hz mono f32le, runs the
bench's Basic Pitch child on it (the app's transcriber, cached), reads the
MIDI with its tempo map into absolute seconds (all tracks merged: a DAW
exports one track per region), and finds the offset between MIDI time
and the stem's first sample: a coarse cross-correlation of the two onset
trains over ±90 s, then the candidate among the top coarse peaks whose
fine scan (±1 s, 10 ms) matches the most notes on pitch class within
60 ms, because a repeating riff gives the onsets alone a near-tie a beat
or two away. Reports the offset in seconds and, where the tempo is
constant, in bars; checks the offset holds in every 30 s window (drift).
Writes the entry into corpus/study48-manifest.json (committed: numbers,
digests and paths, no notes)."""
import argparse
import hashlib
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

import mido
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RATE = 22050
DT = 0.01
TOL = 0.06
MANIFEST = ROOT / "corpus" / "study48-manifest.json"


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(src: str, dst: Path) -> None:
    if dst.exists():
        return
    if src.startswith("http://") or src.startswith("https://"):
        urllib.request.urlretrieve(src, dst)
    else:
        dst.write_bytes(Path(src).read_bytes())


def midi_notes(path: Path) -> dict:
    m = mido.MidiFile(str(path))
    events = []
    for ti, t in enumerate(m.tracks):
        tick = 0
        for x in t:
            tick += x.time
            events.append((tick, ti, x))
    events.sort(key=lambda e: e[0])
    tempo, last_tick, last_time = 500000, 0, 0.0
    on, notes, tempos, sigs, names = {}, [], [], [], {}
    for tick, ti, x in events:
        t = last_time + mido.tick2second(tick - last_tick, m.ticks_per_beat, tempo)
        last_tick, last_time = tick, t
        if x.type == "set_tempo":
            tempo = x.tempo
            tempos.append({"sec": round(t, 4), "bpm": round(mido.tempo2bpm(tempo), 3)})
        elif x.type == "time_signature":
            sigs.append({"sec": round(t, 4), "sig": f"{x.numerator}/{x.denominator}"})
        elif x.type == "track_name":
            names[ti] = x.name
        elif x.type == "note_on" and x.velocity > 0:
            on[(ti, x.channel, x.note)] = (t, x.velocity)
        elif x.type in ("note_off", "note_on"):
            k = (ti, x.channel, x.note)
            if k in on:
                s, v = on.pop(k)
                notes.append({"track": ti, "start": round(s, 4), "end": round(t, 4), "pitch": x.note, "vel": v})
    notes.sort(key=lambda n: n["start"])
    # distinct tempi (a DAW repeats the same tempo at region starts)
    distinct = []
    for tp in tempos:
        if not distinct or abs(distinct[-1]["bpm"] - tp["bpm"]) > 0.005:
            distinct.append(tp)
    return {"ticksPerBeat": m.ticks_per_beat, "tracks": len(m.tracks), "trackNames": names, "tempos": distinct, "sigs": sigs, "notes": notes}


def basic_pitch(raw: Path, out: Path) -> list:
    if not out.exists():
        proc = subprocess.run(
            ["node", str(ROOT / "scripts" / "transcribe-child.mjs"), str(ROOT / "src" / "fixture" / "model.json"), str(ROOT / "src" / "fixture" / "weights.json"), str(raw)],
            capture_output=True,
            check=True,
        )
        out.write_bytes(proc.stdout)
    return json.loads(out.read_text())  # [start, duration, pitch, amplitude]


def train(times, length, weights=None):
    a = np.zeros(int(length / DT) + 1)
    for i, t in enumerate(times):
        k = int(round(t / DT))
        if 0 <= k < len(a):
            a[k] += 1.0 if weights is None else weights[i]
    kern = np.exp(-0.5 * (np.arange(-5, 6) / 2) ** 2)
    return np.convolve(a, kern, "same")


def xcorr(a, b, lags):
    out = []
    for lg in lags:
        s = int(round(lg / DT))
        out.append(np.dot(a[s:], b[: len(b) - s]) if s >= 0 else np.dot(a[:s], b[-s:]))
    return np.array(out)


def match(mid, bps, starts, lag, seconds, lo=0.0, hi=None):
    hi = seconds if hi is None else hi
    used = np.zeros(len(bps), bool)
    n_in = hit = exact = octave = cls = 0
    errs = []
    for n in mid:
        t = n["start"] + lag
        if not (lo <= t < hi):
            continue
        n_in += 1
        j = np.searchsorted(starts, t)
        cands = [jj for jj in (j - 1, j) if 0 <= jj < len(bps) and not used[jj] and abs(starts[jj] - t) <= TOL]
        if not cands:
            continue
        jj = min(cands, key=lambda q: abs(starts[q] - t))
        used[jj] = True
        hit += 1
        d = bps[jj][1] - n["pitch"]
        if d == 0:
            exact += 1
        elif d % 12 == 0:
            octave += 1
        if d % 12 == 0:
            cls += 1
            errs.append(abs(starts[jj] - t))
    return {"inSpan": n_in, "onsetMatched": hit, "exact": exact, "octaveOff": octave, "classRight": cls, "medianOnsetErr": round(float(np.median(errs)), 4) if errs else None}


def app_bass_stem(slug: str) -> Path | None:
    """The app's own bass stem for the song (corpus/fixture-mmkk.json names; corpus-mmkk/<slug>/<id>.wav), if held."""
    fx = json.loads((ROOT / "corpus" / "fixture-mmkk.json").read_text())
    for song in fx["songs"]:
        if song.get("slug") != slug:
            continue
        for st in song.get("stems", []):
            name = (st.get("name") or "").lower()
            if "bass" in name and "synth" not in name:
                ident = (st.get("id") or st.get("stemId") or st.get("url") or "").rsplit("/", 1)[-1]
                for cand in (ROOT / "corpus-mmkk" / slug).glob(f"{Path(ident).stem}*.{RATE}.f32le.raw"):
                    return cand
    return None


def envelope(raw: Path, hop: int = 220) -> np.ndarray:
    x = np.fromfile(raw, dtype=np.float32)
    n = len(x) // hop
    e = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1))
    e = np.log1p(1000 * e)
    return e - e.mean()


def stem_offset(kevin_raw: Path, app_raw: Path) -> dict:
    """app-stem time = Kevin-stem time + offset, by full cross-correlation of log RMS envelopes (10 ms hops)."""
    ek, ea = envelope(kevin_raw), envelope(app_raw)
    n = len(ek) + len(ea)
    c = np.fft.irfft(np.fft.rfft(ea, n) * np.conj(np.fft.rfft(ek, n)), n)
    i = int(np.argmax(c))
    lag = i if i < n // 2 else i - n
    hop_s = 220 / RATE
    if lag >= 0:
        ov = min(len(ek), len(ea) - lag)
        r = float(np.corrcoef(ek[:ov], ea[lag : lag + ov])[0, 1])
    else:
        ov = min(len(ea), len(ek) + lag)
        r = float(np.corrcoef(ek[-lag : -lag + ov], ea[:ov])[0, 1])
    return {"offsetSec": round(lag * hop_s, 3), "overlapSec": round(ov * hop_s, 1), "envelopeCorrelation": round(r, 3), "appStemSeconds": round(len(ea) * hop_s, 2)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("wav")
    ap.add_argument("mid")
    ap.add_argument("--label", default="Bass")
    args = ap.parse_args()
    d = ROOT / "corpus-mmkk" / args.slug / "bass-truth"
    d.mkdir(parents=True, exist_ok=True)
    wav, mid = d / f"{args.slug}-bass.wav", d / f"{args.slug}-bass.mid"
    fetch(args.wav, wav)
    fetch(args.mid, mid)
    raw = d / f"{args.slug}-bass.{RATE}.f32le.raw"
    if not raw.exists():
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-ac", "1", "-ar", str(RATE), "-f", "f32le", "-acodec", "pcm_f32le", str(raw)], check=True)
    seconds = raw.stat().st_size / 4 / RATE
    m = midi_notes(mid)
    (d / "midi-notes.json").write_text(json.dumps(m))
    bp = basic_pitch(raw, d / "bp-notes.json")
    notes = m["notes"]
    if len(notes) < 20:
        print(f"{args.slug}: the MIDI has {len(notes)} notes in {m['tracks']} tracks ({mid.stat().st_size} bytes): an incomplete export; nothing written", file=sys.stderr)
        sys.exit(2)
    bps = sorted((n[0], n[2]) for n in bp)
    starts = np.array([s for s, _ in bps])
    length = max(seconds, notes[-1]["end"]) + 100
    mt = train([n["start"] for n in notes], length)
    bt = train([n[0] for n in bp], length, [n[3] for n in bp])
    coarse = np.arange(-90, 90, DT)
    c = xcorr(bt, mt, coarse)
    # top coarse peaks at least 0.5 s apart
    order = np.argsort(c)[::-1]
    peaks = []
    for i in order:
        if all(abs(coarse[i] - p) > 0.5 for p in peaks):
            peaks.append(float(coarse[i]))
        if len(peaks) == 5:
            break
    scans = []
    for p in peaks:
        for lag in np.arange(p - 1.0, p + 1.0, DT):
            scans.append((float(lag), match(notes, bps, starts, lag, seconds)))
    top = max(r["classRight"] for _, r in scans)
    lag, r = min(((lg, rr) for lg, rr in scans if rr["classRight"] >= top - 2), key=lambda x: x[1]["medianOnsetErr"] if x[1]["medianOnsetErr"] is not None else 9)
    windows = []
    for w0 in np.arange(0, seconds, 30):
        sel = [n for n in notes if w0 <= n["start"] + lag < w0 + 30]
        if len(sel) < 8:
            continue
        ws = [(float(lg), match(sel, bps, starts, lg, seconds, w0, w0 + 30)) for lg in np.arange(lag - 0.5, lag + 0.5, DT)]
        wt = max(rr["classRight"] for _, rr in ws)
        wl = min(((lg, rr) for lg, rr in ws if rr["classRight"] >= wt - 1), key=lambda x: x[1]["medianOnsetErr"] if x[1]["medianOnsetErr"] is not None else 9)
        windows.append({"from": float(w0), "notes": len(sel), "lag": round(wl[0], 3), "classRight": wl[1]["classRight"]})
    drift = max(abs(w["lag"] - lag) for w in windows) if windows else None
    bpm0 = m["tempos"][0]["bpm"] if m["tempos"] else None
    beats_per_bar = int(m["sigs"][0]["sig"].split("/")[0]) if m["sigs"] else 4
    offset_bars = None
    if bpm0 and len(m["tempos"]) == 1:
        beats = -lag * bpm0 / 60
        bars = beats / beats_per_bar
        offset_bars = {"beats": round(beats, 3), "bars": round(bars, 3), "integral": abs(bars - round(bars)) < 0.02}
    app = app_bass_stem(args.slug)
    app_off = stem_offset(raw, app) if app else None
    # MIDI time -> the app's mix time (the app's stems start with its mix): + mixOffsetSec
    mix_off = round(app_off["offsetSec"] + lag, 3) if app_off else None
    entry = {
        "label": args.label,
        "appStem": str(app.relative_to(ROOT)) if app else None,
        "appStemOffset": app_off,
        "midiToMixSec": mix_off,
        "wav": str(wav.relative_to(ROOT)),
        "wavSha256": sha256(wav),
        "raw": str(raw.relative_to(ROOT)),
        "seconds": round(seconds, 3),
        "midi": str(mid.relative_to(ROOT)),
        "midiSha256": sha256(mid),
        "midiTracks": m["tracks"],
        "trackNames": sorted(set(m["trackNames"].values())),
        "tempos": m["tempos"],
        "sigs": m["sigs"],
        "midiNotes": len(notes),
        "midiPitchRange": [min(n["pitch"] for n in notes), max(n["pitch"] for n in notes)],
        "midiSpan": [notes[0]["start"], notes[-1]["end"]],
        "basicPitchNotes": len(bp),
        "offsetSec": round(-lag, 3),
        "offsetBars": offset_bars,
        "alignment": r,
        "windows": windows,
        "driftSec": None if drift is None else round(drift, 3),
        "coarsePeaks": [round(p, 2) for p in peaks],
    }
    man = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {"note": "Study 48 bass truth: Kevin's MIDI per bass stem, offsets found by scripts/ingest-bass-pair.py; audio and MIDI gitignored", "entries": {}}
    man["entries"][args.slug] = entry
    MANIFEST.write_text(json.dumps(man, indent="\t") + "\n")
    ob = f", {offset_bars['bars']:.3f} bars{' (integral)' if offset_bars['integral'] else ''}" if offset_bars else ""
    print(f"{args.slug}: stem {seconds:.1f} s; MIDI {len(notes)} notes in {m['tracks']} tracks, tempo {m['tempos']}, {m['sigs']}")
    print(f"  stem starts at MIDI time {-lag:.3f} s{ob}; onsets matched {r['onsetMatched']}/{r['inSpan']} within 60 ms, pitch class right {r['classRight']}, exact {r['exact']}, octave off {r['octaveOff']}")
    print(f"  per-window lag deviation at most {drift} s over {len(windows)} windows; other coarse candidates {peaks[1:]}")
    if app_off:
        print(f"  the app's bass stem starts {-app_off['offsetSec']:+.3f} s from this stem (envelope correlation {app_off['envelopeCorrelation']} over {app_off['overlapSec']} s); MIDI time + {mix_off} s = the app's mix time")
    else:
        print("  no app bass stem held for this song; MIDI cannot be placed on the app's beats", file=sys.stderr)
    if drift is not None and drift > 0.05:
        print("  WARNING: the offset moves between windows; check the tempo map", file=sys.stderr)


if __name__ == "__main__":
    main()
