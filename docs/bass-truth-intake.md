# Bass truth from Logic: exporting a pair and taking it in

How Kevin gets a bass stem and its MIDI out of a Logic session for the
bench (Study 48 and after), and what the bench does with them. Written
2026-11-12 after two exports failed.

## Exporting from Logic

**What the bench needs:** one WAV of the bass stem and one `.mid` of the
bass part, from the same session. Any start point is fine: the intake
finds the offset itself and reports it as a bar count. The tempo map and
time signature come with the MIDI file.

**What crashed Logic (2026-11-12), and the fix.** Two things together
produced a 14-byte MIDI file (a header, no tracks):

1. Exporting a **track stack** rather than a single track. Alone this
   did not crash in Kevin's testing, but it looks unhandled when the
   second problem is present.
2. Part of the selection was a **Session Player** region (Logic's "Bass
   Player"), not MIDI. Session Player regions are not MIDI until
   converted.

The recipe that exported flawlessly: convert every Session Player region
to MIDI, merge the individual tracks and regions into **one MIDI track**,
and export that single track. A file of a few kilobytes with hundreds
of notes is a good export; 14 bytes is the crash.

An export of several regions as separate tracks (Peaceful Dreams,
Interbellum) also works: the intake merges the tracks. Overlapping
alternate takes would not be told apart, so one track is better.

## Taking a pair in

```
.venv-study36/bin/python -I scripts/ingest-bass-pair.py <slug> <wav url or path> <mid url or path> --label "Bass Guitar"
```

The intake downloads into `corpus-mmkk/<slug>/bass-truth/` (gitignored:
no audio or MIDI is ever committed), decodes the stem, runs the app's
Basic Pitch on it, reads the MIDI with its tempo map, and finds where the
stem starts in MIDI time by cross-correlating onsets and then checking
pitch class, since a repeating riff gives the onsets alone a near-tie a
beat or two away. It checks the offset holds in every 30 s window, finds
where the stem sits against the app's own bass stem for the song (so the
MIDI can be placed on the app's beats), and writes the numbers, digests
and offsets into `corpus/study48-manifest.json`, which is committed. It
refuses a MIDI with fewer than 20 notes as an incomplete export.

A good intake prints an integral bar offset ("13.002 bars (integral)"),
a pitch-class agreement near the onset-match count, and a per-window
deviation of a hundredth of a second or less. A mismatched pair (the
wrong WAV for a MIDI) prints a negative or fractional offset, pitch-class
agreement under a tenth of the notes and a drift warning; it should be
discarded with `rm -rf corpus-mmkk/<slug>/bass-truth` before the right
file is taken in, because the intake keeps what it has downloaded.
