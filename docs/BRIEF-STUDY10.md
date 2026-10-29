# BRIEF — stem-bench Study 10: neural MIR baselines against the production detector

**REGISTERED.** Drafted by the stem-shovel side (2026-10-29, ccbbb4d,
with docs/LANDSCAPE-2026-10-29.md as its evidence base); finished and
registered by the bench the same day. Bench decisions are marked
⟨bench⟩; the draft's "Left to the bench" list is resolved below. Zero
LLM spend: every instrument is a local model or deterministic code.
Three development smokes are disclosed (one item per neural candidate,
run while building the runners, before registration): N-beat on
drift-4a (120.0, 4/4) and waltz-a (96.8, 3/4); N-seg on contrast-b
(boundaries 7.7/31.7 + one false, missing 24 s at the reference
operating point); N-chord on harbor-lights (28/28 bars vs the
matcher's 27/28). They are single items, not results; the registered
tables are computed after this commit.

## Why

Studies 4, 7 and 8 and the landscape review settled that the listening
models do not hear tempo or key and that the app is right to hear with
code. The review then found that the code it hears with is the
classical baseline the neural MIR models replaced, with measured gaps:
Krumhansl templates ≈ 53 MIREX on FMAKv2 against 73 for a small CNN; a
three-detector tempo vote 65 % exact on GiantSteps against 85 % for a
trained model; no audio structure detector at all where SongFormer and
LinkSeg place boundaries within 3 s ≈ 78 % of the time; chords from
Basic Pitch plus a template matcher against end-to-end chord models
near 80–83 maj-min WCSR. Several of those models ship as small ONNX
files with permissive licenses. This study measures them against
production's detector on the bench's own truth, so that what replaces
a component is a number, not a paper.

Study 9 settled the question INSIDE the current method family (per-stem
reading loses to the summed mix; stem activity wins sections); this
study asks whether the family should change.

## Instruments (committed, pinned by test)

Baseline:

- **D-prod** — the Study 9 verbatim port (src/study9/analysis.ts,
  stem-shovel a99fb18): `extractFeatures` → `analyse` for tempo, meter
  and key. ⟨bench⟩ Its input here is the MIX buffer (the single-upload
  shape), not Study 9's per-stem combine. For chords, the production
  path exactly as Study 1: Basic Pitch transcription + the v0.142
  template matcher (`chordsPerBar`).

Candidates (Python 3.12 under `.venv-study10`, deps pinned in
scripts/study10/requirements.txt; onnxruntime CPU; weights fetched by
scripts/fetch-models10.sh and verified against the SHA-256 hashes
recorded in corpus/fixture10.json — never committed):

- **N-beat** (scripts/study10/nbeat.py) — Beat This! small, seed 0
  (CPJKU, ISMIR 2024, MIT; ONNX export ashudesai/songbird-models).
  Front end: the reference `LogMelSpect` verbatim via torchaudio
  (22050 Hz, n_fft 1024, hop 441, f 30–11000, 128 mels, slaney,
  frame_length-normalized, power 1, log1p(1000x)); the reference
  split/aggregate and "minimal" postprocessor (maxpool 7, logit > 0)
  translated torch→numpy. ⟨bench⟩ Registered derivations: tempo =
  60 / median inter-beat interval (0.1 bpm resolution ≈ the 20 ms
  frame grid — null under 2 beats); meter = modal beats-per-bar
  between downbeats (3→3/4, 4→4/4, 2 or 6→6/8).
- **N-seg** (scripts/study10/nseg.py) — LinkSeg 7-class (Buisson,
  McFee, Essid, ISMIR 2024; weights CC-BY 4.0; ONNX port
  elicwhite/linkseg-7c-onnx, MIT), fed N-beat's beats. Windowing,
  requantization and decoding are line-faithful ports of the published
  pipeline; mel per the model card (torchaudio MelSpectrogram
  22050/1024/256/64 mels + AmplitudeToDB). Operating point: the
  published defaults (peak window 8 s past/future, tau 0).
- **N-key-profiles** (src/study10/keyprofiles.ts) — production's
  `detectKey` verbatim with the Krumhansl–Kessler tables swapped for
  Albrecht–Shanahan 2013 and, separately, Temperley 2007
  (Kostka–Payne); the KK build is pinned identical to production's
  answers. The cheapest possible candidate: one table.
- **N-chord** (scripts/study10/nchord.py) — ChordMini ChordNet 2E1D,
  170 classes (ptnghia-j/ChordMini, MIT; ONNX musetric/chordmini-onnx,
  checkpoint blob b61f6b3a02cc…): librosa 0.11.0 `cqt` at the model's
  exact published contract (sr 22050, hop 2048, fmin C1, 144 bins,
  24/octave, norm 1, sparsity 0.01, hann, scale, constant pad) →
  log(|CQT|+1e-6) → 108-frame windows in static groups of 16 →
  9-frame window-local logit smoothing + argmax (per the reference
  shader) → run-length segments → per-bar majority vote → the bench
  vocabulary via scripts/study10/chordmini-vocab.json (all 170 labels
  mapped; raw labels preserved in output).
- **N-key-cnn** ⟨bench⟩: **omitted, recorded as not run.** madmom's
  Korzeniowski–Widmer weights are CC BY-NC-SA (measurable, never
  shippable) with no maintained ONNX export, and no permissively
  licensed checkpoint with a reproducible test was found; training our
  own was judged out of scope for this registration. The draft
  provided for exactly this outcome.

### Registered deviations

1. ⟨bench⟩ N-beat runs 250-frame chunks, not the reference 1500: this
   ONNX export's attention silently degrades past ~300 frames
   (verified: at the reference chunk size only the first ~5 s of beats
   fire; the last firing frame pins near 299 for any longer input).
   The reference's own border/overlap logic is kept; an export defect
   worked around, disclosed also under deployment.
2. The export's input tensor is named `spectrogram` (the model card
   says `input_spectrogram`).
3. Candidates read the renderer's float samples directly (no MP3
   round trip); D-prod reads the same floats through the AudioBuffer
   shim. Sample rate 22050 Hz as registered in Study 9.
4. Tempo grading at ±1 bpm (DSP precision; Study 4's ±3 was for model
   answers), with the program's 6/8 eighth-note (3×) allowance and
   Study 9's any-section rule.
5. N-chord's CQT runs float32 (the reference runner's own dtype).

## Corpus (committed with this brief)

- **Band items, 35** (corpus/fixture10.json `bandItems`; audio
  deterministic from spec + seed, not committed): the 17 Study 4/8
  specs (seeds 4000+i, incl. both pulseless), the 6 Study 9 mislead
  specs (9000+i, mix = parts' sum), and the **hard set** — 12 new
  specs in corpus/mixes10.json (10000+i, rendered by
  src/study10/synth10.ts, its own code path; every committed fixture
  stays byte-identical): swing eighths ×2 (0.67, 0.62), octave-boundary
  tempi ×4 (70/140/72/144), reverb tail ×2 (one 6/8), dense
  arrangement ×2 (one also reverbed), chromatic-mediant modulations ×2
  (F→A, C→Eb). Truth, bar grid, beat grid (4/3/2 beats per bar by
  meter) and section truth per item.
- **Chord songs, 20** (`chordSongs`): Study 1's 16 (truth + the
  stored v0.142 matcher baseline) plus 4 hard progressions
  (corpus/progressions10.json, seeds 1100+i, Study 1's renderer):
  sevenths ×2, sus chords, a passing diminished — transcribed and
  matched by the production pipeline at build time (baseline 59/64).
  ⟨bench⟩ Slash basses are excluded: the bench vocabulary has no slash
  spelling, so neither side could be graded on them.
- **Real recordings (MMKK): registered, not yet run.** Kevin holds
  exclusive rights to MMKK's originals on Stem Shovel; the program's
  all-synthesized rule gets a registered exception for that catalog
  (neither copyright nor user-privacy reason applies). ⟨bench⟩ The arm
  needs credentials the bench does not hold, so it is registered as a
  dated amendment to run when Kevin provides the fetch: audio into a
  gitignored folder, ids/hashes/durations/labels committed, truth =
  the band's declarations with per-label provenance, blank labels
  unscored, beat grading only where the declared grid holds (tolerance
  set in the amendment), detector-vs-declaration disagreements
  reported with evidence rather than scored wrong. Gates below are
  scored on the synthetic fixture; MMKK results will be reported as
  their own table without re-thresholding anything.

## Registered measures

Paired per item against D-prod: tempo Accuracy1 (±1, rules above) and
octave errors apart; beat and downbeat F-measure at ±70 ms against the
synthesis grid (N-beat only — production has no beat output); meter
accuracy on 4/4+3/4, the 6/8 line apart (D-prod's vocabulary has no
6/8); key accuracy (any section), relative-minor and fifth confusions
counted apart; chords per bar — full-vocabulary `sameChord` ("with
sevenths") and the maj-min reduction (root + third class:
major/minor/sus/none, src/study10/grading10.ts); sections via the
Study 8 tolerance (±4 s) with ±0.5 s reported beside it; deployment
cost = weight size + wall time per 90 s of audio in onnxruntime-node
(⟨bench⟩ CPU on this VM; the browser is measured by hand for winners
only, reported without a gate). Pulseless items: N-beat's null is
correct and D-prod's forced number is reported, not paired (it has no
null path — as registered in Study 9).

## Gates (final, against this fixture)

- **G-beat** (33 pulsed band items): N-beat tempo Accuracy1 ≥
  D-prod's AND octave errors ≤ D-prod's AND no item where D-prod is
  exact and N-beat is worse than an octave.
- **G-meter**: N-beat meter accuracy ≥ D-prod's on the 4/4+3/4 items,
  AND right on ≥ 2 of the 3 6/8 items (lilt-a, lilt-b, verb-y), which
  D-prod structurally cannot name.
- **G-key**: a profile candidate passes when its accuracy exceeds
  KK's by ≥ 3 items with 0 items where KK is right and it is wrong.
  Reported in full either way.
- **G-chord** (20 songs, 512 bars): N-chord maj-min ≥ the matcher's
  AND full-vocabulary strictly higher, both overall and on the 4 hard
  progressions (64 bars).
- **G-seg**: 0 boundaries on the 22 single-section items (6 loops, 6
  mislead, 10 single-section hard) AND 8/8 contrast boundaries at
  ±4 s (the Study 8 chart-arm rate). Change/mediant boundaries and the
  ±0.5 s rate are reported, ungated.
- **Budget**: a winner over 25 MB of weights or over 10 s per 90 s of
  audio here is "wins, deployment open", not recommended.

## Predictions (the bench's, registered before the full run)

1. G-beat PASSES: N-beat ≥ 30/33 exact including all four
   octave-boundary items and both swing items; D-prod keeps its 3:2
   misses (both lilts, contrast-c) and loses ground on reverb or
   swing; no worse-than-octave regression. On the pulseless pads
   N-beat emits few or no beats (the honest null D-prod cannot say).
2. G-meter PASSES, with the 6/8 clause carried 2–3 of 3.
3. G-key FAILS for both profiles via the +3 clause: KK is near
   ceiling on this corpus, so there is nothing to gain; any movement
   shows on the mediant-mod items. The profiles are reported as
   indifferent-here, hard-set-elsewhere (the review's FMAKv2 gap is
   about real recordings — the MMKK amendment is where this gate
   could differ).
4. G-chord PASSES on the full vocabulary (the smoke beat the matcher
   28/28 vs 27/28; the matcher's hard-set baseline is 59/64) with
   maj-min at least parity — the riskiest clause is maj-min parity on
   the plain set, where the matcher is near ceiling.
5. G-seg FAILS via contrast recall (the disclosed smoke missed the
   24 s boundary at the published 8 s peak window) while the 0-false
   clause holds — the mirror of Study 9: the free activity detector
   found 8/8 where the neural segmenter's operating point trades
   recall for stability. If so, the ship guidance stays D-activity.
6. Budget: N-beat (10.4 MB) and N-seg (1.6 MB) well inside; N-chord
   (17.1 MB) inside on size but OVER the 10 s / 90 s time budget on
   this CPU (the smoke ran ~28 s/90 s incl. session load) → at best
   "wins, deployment open", pending the by-hand WebGPU figure.

## Spend fences

LLM spend: none. Model downloads: the five files above, hash-pinned.
Compute: local (the fixture's Basic Pitch run took ~3 min at build).

## What production does with the result

Each passing gate names a component to replace in
`src/lib/audio/analysis.ts` (beats and meter together; key profiles
at once if they win; chords; a section detector feeding the
chart-anchored model's placement). A failing gate closes the question
for that component and is recorded in stem-shovel's FINDINGS.md.
Licenses to carry forward on any ship: Beat This! and ChordMini MIT;
LinkSeg CC-BY 4.0 (attribution in the app's built-with page); madmom
(CC BY-NC-SA) and Essentia (AGPL / CC BY-NC-ND) stay out absent a
commercial license.

## Amendment 1 — the MMKK real-recordings arm (2026-10-29, registered before its run)

Kevin authorized the fetch ("No MMKK songs are private[,] they are
publicly available on pages on www.stemshovel.com[,] feel free to
download and copy as needed"), and the catalog turned out fully
public: no credentials were needed. corpus/mmkk-sources.json commits
the inventory (the account's one public project, Badverbs, 7 songs);
scripts/fetch-mmkk.ts downloads each public song page's payload — the
band's settings rows ({kind, start, value}: key, meter, tempo, WITH
declared start times), the section list (name + declared start
seconds), the chart document, every stem's original upload and the
rendered mix — into gitignored corpus-mmkk/, decodes to the bench
shape (ffmpeg, 22050 Hz mono f32le), and commits only
corpus/fixture-mmkk.json (urls, SHA-256, bytes, durations, labels,
provenance).

What the catalog holds: 4 full-band songs with stems, settings and
timed sections (eat-all-the-clocks Em 4/4 120; letter-lands F#maj 4/4
132; mop-heart Amaj→Bmaj 3/4 224; peaceful-dreams Dmaj 4/4 145) and 3
single-stem sketches with partial labels (i-liked-you-wild Fmaj only;
the-bells Gmaj only; the-cure-was-my-beatles nothing declared). Blank
labels are unscored, as registered.

Registered scoring (scripts/run-study10-mmkk.ts, same graders):

- **Tempo** (4 songs): against any declared tempo row, at BOTH ±1
  (the study's primary) and ±3 (the quantization-aware secondary —
  registered here up front, unlike the synthetic arm where ±3 was
  post-hoc); octave class apart; the 6/8 3× rule as registered.
- **Meter** (4), **key** (6): declared values ("F#maj" → "F# major");
  any declared row counts.
- **Sections** (4 songs, declared starts in seconds): boundaries at
  ±4 s and ±0.5 s via the registered seg grader, for N-seg (on
  N-beat's beats) AND Study 9's D-activity on the real stems (grid:
  D-prod's tempo and meter anchored at 0 — the detected-grid variant,
  since real recordings declare no bar grid).
- **Beats**: ungraded (real recordings carry no per-beat truth);
  N-beat's beat count and IBI stability are reported descriptively.
- **Chords**: unscored (the charts' spellings — "F♯(5)(7)" — are
  outside both vocabularies and carry no bar-aligned truth).
- **Inputs**: D-prod and D-activity get the per-stem buffers
  (production's real shape, Study 9's dProd); N-beat, N-seg and the
  key-profile candidates get the rendered mix where one exists, else
  the stems' sum.
- **Disagreement rule** (as registered in the arm): a detector that
  contradicts a declaration is scored against it in the primary
  table, and the item is additionally flagged with the audio's own
  evidence when that evidence clearly disputes the declaration
  (e.g. a stable measured grid at a different value); both reads are
  reported. mop-heart's declared 224 bpm in 3/4 is the likely case.

No gates are re-thresholded: the synthetic-arm verdicts above stand.
The amendment's results are their own table, answering the one open
question — whether the neural candidates' real-recording advantage
appears on the material production was tuned on.

## Disclosure

Analyst Claude Fable 5. No language model is measured or consulted;
every grade is mechanical, committed and tested before the full run.
Candidate weights are third-party files pinned by hash and provenance
(ChordMini's hashes match its model card's published table);
published scores are quoted from the review and not relied on. The
three one-item development smokes are disclosed above.
