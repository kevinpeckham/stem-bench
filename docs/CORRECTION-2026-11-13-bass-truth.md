# Correction: the bass truth was missing notes (Studies 48 to 52)

Found 2026-11-13, during Study 52, before its results were written up.

## The defect

The intake's MIDI parser (scripts/ingest-bass-pair.py `midi_notes`)
paired each note-off with the latest note-on of its pitch. Logic writes
two notes of one pitch played back to back with the second note's on
*before* the first note's off, at the same tick. The parser then
overwrote the first note, which was never recorded, and closed the
second at once, with no length. Zero-length notes were then dropped by
Study 48's scoring (disclosed there as "zero-length MIDI notes", and
wrongly taken for export debris) and by its grader's too-short rule.

So in every run of same-pitch notes the truth lost notes that are in
the part and in the audio:

| song | notes in the MIDI | lost outright | left with no length, then dropped | the truth was missing |
|---|---|---|---|---|
| Peaceful Dreams | 454 | 25 | 22 | 10 % |
| Interbellum | 491 | 35 | 36 | 14 % |
| Letter Lands | 315 | 10 | 15 | 8 % |
| Eat All the Clocks | 264 | 4 | 4 | 3 % |
| Downline | 438 | 37 | 40 | 18 % |
| Mop Heart | 338 | 2 | 2 | 1 % |

Every transcriber that heard one of those notes was marked with an
extra onset; none could be credited for it. Every score in Studies 48
to 52 was computed against this truth.

## How it was found

Study 52's new transcriber dropped from 76 % to 43 % of bars right on
Letter Lands, the easiest song, while its note-level score rose. Its
"extra" notes there were the same notes, in the same slots, that pYIN
wrote. Of the 42 truth notes the grader had dropped on Downline, the new
transcriber heard 41, Basic Pitch 39 and pYIN 31. The raw MIDI events
showed the on-before-off order.

## The fix

`midi_notes` now pairs the notes of a pitch first in, first out
(tests/ingest_bass_pair_test.py pins the back-to-back case, written
either way round, and overlapping notes). scripts/reparse-bass-midi.py
re-read all six MIDI files: no note-off is left unpaired and no note has
zero length; each alignment offset found by the intake still holds to
within 10 ms on the corrected notes (the offsets were found from onsets,
and the onsets that survived were right). The manifest keeps each
entry's first-parse counts under `midiNotesFirstParse`.

Nothing else changes: the audio, the transcriptions, the grid, the
graders, every threshold and every decision rule are as registered.

## What is re-run

All of it, by the committed scripts, on the corrected truth: Study 48
(notes and bars), Study 49 (attribution, Basic Pitch's knobs, the
filters), Study 50 (the grids), Study 51 (trusted bars) and Study 52.
Each brief carries its re-run results beside a note of what it first
published; the first results files are kept in
results/superseded-2026-11-13/. Predictions and decision rules are not
rewritten: each is re-scored on the corrected truth, and where an
outcome flips, both are stated.

Study 52's first scored pass ran on the defective truth and is not
kept as a result; its numbers are disclosed in its brief and it is
re-registered.
