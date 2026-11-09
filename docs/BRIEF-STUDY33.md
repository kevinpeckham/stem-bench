# Study 33 — the stereo file as two stems: chart drafting without stems

Registered 2026-11-09, before any scored run. Kevin's research question,
verbatim in intent: Stem Shovel can auto-generate a barmark chart from a
fresh song with stems. How well does that capability work on a stereo
file? Is it worth treating the stereo file as two stems and running it
through the same process?

## What is already answered, and what is not

The grid half is settled: the shipped chartless grid (Studies 28–32) has
only ever been measured on mono downmixes of these exact stereo mixes
(the fetch converter runs `ffmpeg -ac 1`), so a fresh stereo file gets
the validated grid for free. The untested half is the draft: the
production pipeline transcribes stems (Basic Pitch) and the bench's
reference numbers (Study 31c: letter 72/76 = 94.7%, peaceful 151/153 =
98.7%) came from transcribing the NON-DRUM STEM SUM. A stereo file has
no such sum. The study measures what replaces it.

Scoping measurement (2026-11-09, $0, scratchpad): the four corpus mixes
correlate L/R at 0.83–0.90 with the side channel 10–13 dB under the mid,
weakest below 200 Hz — kick and bass are centered; the separation lives
in cymbals, air and width.

## Arms (per song, identical grid, hints, prompt and grader)

Each arm differs ONLY in the buffer(s) handed to Basic Pitch. Every
transcription input is peak-normalized first (as production normalizes
the stem sum). Two-buffer arms transcribe each buffer separately and
concatenate the note lists sorted by start (the faithful "two stems,
same process" port).

- **R** — the non-drum stem sum (the stems ceiling, same build as
  Study 32 arm 7 without the pad).
- **A** — the full mix, mono (channels averaged; the naive stereo-file
  path and the headline number). Note the mono downmix IS the mid
  channel, so arm C is arm A plus the side channel's extra notes.
- **B** — L and R as two pseudo-stems (the question as asked).
- **C** — mid and side as two pseudo-stems (the steelman of B).
- **D** — the HPSS harmonic component of the mono mix (median-filtering
  harmonic/percussive separation, src/study33/hpss.ts): the DSP
  stand-in for "non-drum sum" that needs no stems.

Shared per song, computed once on the mono mix and reused by every arm:
the chartless grid + ship vote (w1lead ×2, w4 with the 1.2 ratio rule
×2, w7 ×1) + the Study 31c placement rule give the barStarts; nchord
per-bar labels give the hints; the Study 23 production prompt
(system23/question23) and claude-fable-5-1 draft each arm's bar lines;
expandChords + rootScore against the song's chart grade the draft
(right/bearing over the first min(grid bars, chart bars) bars).

## Gates

- **S33-G1 (reproduction):** arm R's root score is at least the frozen
  Study 31c reference minus 0.05 on every pilot/matrix song. A fail is
  a defective port, not a finding: stop, fix, re-register.
- **S33-G2 (the question):** arm B's root score does not exceed arm A's
  by more than 0.02 (mean across the songs run). PASS confirms the
  registered answer "L/R-as-two-stems is not worth it"; a FAIL is the
  study answering "worth it" and is published as such.
- **S33-G3 (the comparator):** arm D's root score is at least arm A's
  minus 0.02 (mean across the songs run) — harmonic separation does
  not hurt the draft.

## Registered predictions (reported beside the gates, not gated)

- **P1:** arm A lands below arm R — drum bleed costs bars — but within
  15 points of it.
- **P2:** arms B and C land within noise of arm A: the side channel
  contributes cymbal and reverb notes, not harmony.
- **P3 (synthetic sweep):** side-channel chord-tone purity rises with
  pan width and reaches near the chords-only ceiling at full width;
  HPSS-harmonic purity beats the mono mix at every width.

## The synthetic separation sweep ($0, mechanical)

Real mixes give one point on "how much stereo is there"; the sweep gives
the curve. One 16-bar 120 bpm 4/4 song from the Study 32 primitives
(kick with beater click on 1 and 3, snare on 2 and 4, both centered;
one chord per bar, C–F–G–Am rotating) is rendered with the chord
instrument constant-power panned at width 0, 0.5 and 1.0
(src/study33/corpus33.ts). At each width, Basic Pitch transcribes the
mono sum, the L channel, the side channel and the HPSS harmonic of the
mono sum; the chords-only render is the ceiling. The score is chord-tone
purity: transcribed note-seconds whose pitch class belongs to the bar's
chord, over all transcribed note-seconds (duration-weighted, overlap
clipped to bars, committed grader with unit tests). No model calls.

## Pilot and matrix

- **Pilot (fence $0.3, runs on the registering go-ahead):**
  letter-lands (132 bpm 4/4, frozen ref 72/76, Correction-4 truth
  −0.121) × the five arms = 5 drafts, plus the synthetic sweep.
  Estimated from Study 32's measured tokens (≈13.8k in per letter-size
  draft): ≈69k in / ≈8k out ≈ $0.25.
- **Matrix (fence $0.6, needs Kevin's explicit approval after the
  pilot's results are committed):** peaceful-dreams (145 bpm 4/4,
  frozen ref 151/153) × the five arms ≈ $0.45. mop-heart and
  eat-all-the-clocks carry no frozen 31c reference and stay out.

## Registered deviations and notes

- The gateway ignores temperature on claude-fable-5-1 (disclosed since
  Study 31c): one draft per cell, sampling noise undisclosed by the
  provider, the same for every arm.
- Grid, vote, placement and nchord hints are computed once on the mono
  mix and shared by all arms: the study isolates the transcription
  input, not the grid (Studies 28–32 settled the grid).
- Stereo decode is `ffmpeg -ac 2` at 22050 Hz cached beside the mp3;
  the existing mono raws remain the arm-A/mid source of truth.
- The HPSS instrument and the purity grader are committed with unit
  tests before any scored run, per the hard rules.
