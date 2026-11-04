# Study 17 — the transcription successor: three zero-model front ends against the real-recording cliff

**Registered before any run** (this brief, the instruments and their
tests in one commit; the run follows). Date: 2026-11-04.

## The question

Study 13 measured production's chord path at **29/76 bars (38.2 %)**
on the gated real recording, against 95.8 % at home on the synthetic
bench, and named the transcription stage — not the matcher, not the
model — as the binding constraint. Its closing guidance: "if the chord
feature matters, the next investment is Basic Pitch's successor on
real timbres, not more model." Studies 13/14 also measured the only
model lever: a text reconciler pass lifts the gated song to 44/76
under production's shipped configuration, with zero breaks.

This study measures three zero-model successors to the transcription
stage, all built from things production already has, and then asks
whether the reconciler's gain survives a better front end:

- **B — per-stem transcription.** Production holds the stems
  separately; Study 13's path sums the non-drum stems FIRST and feeds
  Basic Pitch the polyphonic mixture it fails on. Arm B transcribes
  each non-drum stem alone and merges the note events before the same
  matcher.
- **C — chroma evidence into the shipped matcher.** Production's
  `chordOf` scores a 12-bin pitch-class profile; nothing requires that
  profile to come from transcribed notes. Arm C feeds it bar-pooled
  chromagram mass (Study 12's committed chromagram) directly, skipping
  note-event detection entirely.
- **D — the neural rematch.** ChordMini lost the synthetic chord gate
  in Study 10, but Study 10's own amendment proved this corpus's
  lesson runs both ways (LinkSeg flipped from 54 false boundaries to
  the best section reader on real audio). ChordMini has never been
  scored on real audio with bar-aligned chord truth, because that
  truth did not exist until Study 12.

## Corpus, truth and grading (all reused, none new)

The two MMKK real recordings with bar-aligned chord truth from
Study 12's committed transcriptions: **letter-lands (76 bars, GATED)**
and **eat-all-the-clocks (86 bars, exploratory only — its truth
carries the disclosed reading mismatch)**. peaceful-dreams remains
untranscribable. Audio: the fetched public catalog in `corpus-mmkk/`
(hashes committed in `corpus/fixture-mmkk.json`), stems and mixes as
22050 Hz float32 raws already on disk.

Grading: `gradeBars` from Study 13 verbatim (two-chord bars count on
either; the power-chord allowance; rest bars right only on "N.C.";
strict-first and allowance counts reported beside every number). The
bar grid per song is Study 12's alignment, recomputed exactly as
Study 13 did (reference render → chromagram → subsequence DTW against
the mix), one grid shared by every arm.

## Arms

- **A (anchor, $0):** Study 13 arm 1 re-run byte-for-byte: sum the
  non-drum stems, peak-normalize, Basic Pitch via the committed child,
  `chordsPerBar`. Exists to prove the instrument before anything new
  is measured.
- **B (per-stem, $0):** Basic Pitch on each non-drum stem separately
  (each stem peak-normalized alone, exactly as the sum is); the note
  events concatenated; the same `chordsPerBar`. Per-stem note counts
  reported.
- **C (chroma, $0):** the summed non-drum audio's chromagram
  (Study 12's `chromagram`, unchanged); for each bar, the mean of the
  L2-normalized frames whose start lies in [barStart, nextBarStart);
  that 12-bin pool fed to production's `chordOf` with `bass = null`
  and the same previous-chord hysteresis `chordsPerBar` applies. A bar
  with no frames or zero mass is "N.C.". No parameter is introduced:
  window, hop, fold and normalization are Study 12's; templates,
  penalties and the 0.06 hysteresis margin are production's.
- **D (neural, $0):** ChordMini exactly as Study 10 pinned it
  (checkpoint, ONNX export, CQT contract, 9-frame smoothing), run on
  the MIX (its native domain: the reference usage is a full-mix mono
  downmix), with `--bars` from the shared grid; the per-bar majority
  vote mapped by the pinned vocab. A secondary read on the summed
  non-drum audio is reported as disclosed, unregistered analysis.
- **E (reconciler, conditional, the only spend):** Study 14's measured
  production path verbatim — the ported `reconcileChordsMessage`
  builder and `parseReconciledChords` parser with the Study 13
  registered system prompt, `claude-fable-5-1`, thinking adaptive at
  low effort, 16000-token cap — stacked on the best of {B, C, D-mix}
  by gated-song score (ties break toward B, then C; the winning arm's
  chords are used on both songs). **Trigger: E runs iff S17-G2 passes** (there is
  a successor to stack on; reconciler-on-A is already measured, 44/76,
  Study 14 G4). Note evidence for E: arm B's merged notes if B is the
  winner, else arm A's notes (the reconciler's contract wants per-bar
  note lines; C and D produce none, so the winner's chords pair with
  the best available note lines — disclosed design choice, frozen
  here). Both songs, one call each.

## Gates

- **S17-G1 (instrument):** arm A reproduces Study 13 arm 1 exactly:
  gated 29/76 (strict-first 20, power allowance 9) and exploratory
  24/86. Any deviation: STOP, investigate, re-register before any
  other arm is read.
- **S17-G2 (a successor exists):** max(B, C, D-mix) ≥ **37/76** on the
  gated song (≥ +8 bars over the anchor).
- **S17-G3 (code beats code-plus-model):** max(B, C, D-mix) ≥
  **44/76** on the gated song — a zero-model front end matching or
  beating production's reconciled number changes the ship order.
- **S17-G4 (conditional, only if E runs):** fixes ≥ 2 × breaks AND
  reconciled > the winner's own baseline, on the gated song.

The exploratory song is reported beside every arm and gates nothing.

## Spend fence

**$2.** Arms A–D are $0 (local CPU; the Python venv and ONNX models
from Study 10 are already on disk). Arm E is two gateway calls at a
16k output cap (Study 14 measured ≈ $0.20/run at this shape). No
pilot/matrix split: the whole study sits inside the standing
pilot-scale allowance, run on Kevin's 2026-11-04 go-ahead.

## Predictions (scored in the report)

1. G1 passes; the pipeline is deterministic end to end.
2. B ≥ 35/76; central estimate 38–44. Isolated timbres are the
   material Basic Pitch was built for; the bass stem alone should
   repair many root errors.
3. C ≥ 38/76 and C > B; central estimate 42–50. Sustained pads and
   rich voicings are exactly what chroma keeps and note-event
   detection drops.
4. D-mix lands 40–50/76 under gradeBars, with its misses concentrated
   where the truth says maj7/m7 (the Study 10 triad bias, now on real
   audio).
5. G3 passes: at least one arm reaches 44/76 (predicted: C or D).
6. If E runs: breaks ≤ 2 (two studies measured zero), and the gain
   shrinks to ≤ +8 bars over the winner (the front end and the
   reconciler fix overlapping bars); best reconciled ≥ 50/76.

## Instruments registered with this brief

`src/study17/chromaChords.ts` (bar pooling + the chroma→chordOf path),
`scripts/run-study17.ts` (arms A–D, one results file, prints the E
trigger), `scripts/run-study17-reconcile.ts` (arm E), and
`tests/study17.test.ts`: the chroma path proves itself on both states
(a synthetic rendered progression must come back ≥ 85 % right through
the full pool-and-match path; digital silence must come back all
"N.C."), and note-merge order-invariance is pinned. Graders are
Study 13's, already tested.

Two arm-C weaknesses the self-proof surfaced BEFORE this registration,
disclosed and pinned rather than papered over: (1) a seventh over-read
class — low-bass spectral smear at the chromagram's 55 Hz fold floor
(semitone spacing is below one FFT bin there) buys spurious sevenths
(Bb read as Bbmaj7 on the synthetic proof, 7/8 recovered, hence the
85 % floor); (2) a nearly-silent bar inherits a neighbor's chord
through the 186 ms analysis window, because L2-normalized frames carry
no magnitude and any silence threshold would be a tuned parameter the
arm is registered not to have. Rest bars: 0 of 76 gated, 2 of 86
exploratory, so (2) costs at most 2 exploratory bars. No threshold in any arm is tuned on the real recordings; every
choice is stated above and frozen at this commit.

## Disclosure

Analyst Claude Fable 5; arm E measures claude-fable-5-1 (same family),
tolerable as in Studies 1/13/14 because every grade is mechanical,
committed and tested before any call. The gateway ignores temperature
on this model family (disclosed since Study 13; the bench sets none
here). Deviation from production: none in the matcher or chromagram;
arm B's per-stem normalization is stated above.
