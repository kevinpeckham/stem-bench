# BRIEF — stem-bench Study 10: neural MIR baselines against the production detector (draft)

**DRAFT, not yet registered.** Written by the stem-shovel side
(2026-10-29) for the stem-bench agent to finish designing, register by
commit and run. Zero LLM spend: every instrument here is a local model
or deterministic code. "Left to the bench" lists what is open.

## Why

Studies 4, 7 and 8 and the landscape review (docs/LANDSCAPE-2026-10-29.md)
settled that the listening models do not hear tempo or key and that the
app is right to hear with code. The review then found that the code it
hears with is the classical baseline the neural MIR models replaced,
with measured gaps: Krumhansl templates ≈ 53 MIREX on FMAKv2 against 73
for a small CNN; a three-detector tempo vote 65 % exact on GiantSteps
against 85 % for a trained model; no audio structure detector at all
where SongFormer and LinkSeg place boundaries within 3 s ≈ 78 % of the
time; chords from Basic Pitch plus a template matcher against end-to-end
chord models near 80–83 maj-min WCSR. Several of those models ship as
small ONNX files with permissive licenses and run in onnxruntime-web.
This study measures them against production's detector on the bench's
own truth, so that what replaces a component is a number, not a paper.

Study 9 (stems) is independent: it asks whether per-stem reading beats
the mix inside the current method family; this study asks whether the
family should change. Both can run on the same fixture; if Study 9 has
delivered the per-part renderer, the neural instruments here are run on
the mix and, as a secondary arm, on the drum stem (beats) and the
harmonic stems (key, chords).

## Instruments (committed, pinned by test)

Baseline, ported verbatim from stem-shovel `src/lib/audio/analysis.ts`
at a99fb18 (the Study 9 port, shared if it exists):

- **D-prod** — `extractFeatures` → `combineFeatures` → `analyse`:
  tempo, meter, key; `extractKeySegments`/`detectKeys` for key changes;
  and the production chord path (Basic Pitch + the template matcher,
  Study 1's port) for chords.

Candidates, each a published model run through onnxruntime-node (the
browser port is the deployment question, measured apart):

- **N-beat** — Beat This! small (≈ 2 M parameters, ≈ 10 MB ONNX, MIT;
  huggingface.co/ashudesai/songbird-models, or an export from the
  official checkpoint): log-mel front end at 22 050 Hz / 128 mels /
  50 fps written in TypeScript, peak picking as the paper (no DBN).
  Outputs beats and downbeats; **tempo** = the median inter-beat
  interval over the item; **meter** = the modal beats-per-bar between
  downbeats (3 → 3/4, 4 → 4/4, 6 or 2 → 6/8 by a registered rule).
- **N-seg** — LinkSeg (1.5 MB ONNX, CC-BY 4.0;
  huggingface.co/elicwhite/linkseg-7c-onnx), fed N-beat's beats;
  boundaries only, graded as Study 8 (`grade8`, ±4 s, plus ±0.5 s).
- **N-key-profiles** — D-prod's own chroma with the Krumhansl profiles
  swapped for Albrecht–Shanahan, and separately Temperley: the cheapest
  possible change, isolating the profile from the rest of the pipeline.
- **N-key-cnn** — a CNN key model with published GiantSteps/FMAKv2
  scores. madmom's Korzeniowski–Widmer weights are CC BY-NC-SA, so they
  can be measured but not shipped; a permissively licensed checkpoint
  is preferred, and failing one the bench may train the published
  architecture on its own synthesized set (registered as such). Optional:
  in only if an export with a reproducible test exists; otherwise
  recorded as not run.
- **N-chord** — ChordMini (2.3 M parameters, 17 MB ONNX, 170 classes,
  MIT; huggingface.co/musetric/chordmini-onnx) with its CQT front end
  in TypeScript; chords mapped to the bench's symbol vocabulary
  (`parseChord`/`sameChord`) and graded with Study 1's `gradeChords`
  per bar, maj-min and with sevenths.

Each candidate is pinned by a test that runs it on one committed item
and asserts the exact output, so a changed weight file or front end
cannot drift mid-study.

## Corpus

The committed fixtures, truth by construction: Study 4/7/8 mixes
(tempo, meter, key, changes, sections, pulseless items with a null
tempo), Study 1's progressions (chords per bar). No new synthesis is
required for the primary comparison.

A **hard set** is added, synthesized, committed before registration:
items with swing eighths, 6/8, tempi at the octave boundary (≈ 70 and
≈ 140 bpm), a reverb tail, a dense arrangement, a modulating
progression, extended chords (7ths, sus, slash basses) — the cases the
review names as where templates and autocorrelation fail and the
neural models were built. The agent registers the count (≥ 12).

**Real recordings: the MMKK catalog.** The program rule is all music
synthesized, written to keep copyrighted and user audio out of the
bench. Kevin is the exclusive rights holder of MMKK's original songs,
whose stems, mixes, settings and charts live in the MMKK account on
Stem Shovel, so a registered exception for that catalog breaks neither
reason for the rule. The review warns that synthesized pop is kind to
template methods, and these are the recordings the detector was tuned
on (docs/audio-engine.md: "every declared tempo exact, four of five
keys right"), so they are the real test of the hard-set claims.

- **Truth** is the band's own declaration: the song's tempo, meter and
  key rows (with their changes), the chart's chords per bar and its
  section marks, as entered by the band. Provenance is recorded per
  label; a label the band left blank is not scored. A declared tempo
  is the intent, and a played tempo can drift, so beats are graded
  only where the band's grid holds (a registered tolerance), and a
  disagreement between detector and declaration on a real song is
  reported with the audio's own evidence rather than scored as wrong
  outright.
- **Audio stays out of the repository.** Stems and mixes are fetched
  by a script with Kevin's credentials into a gitignored folder; the
  fixture commits their ids, hashes, durations and labels only. The
  rule change (an exception for material whose rights the program's
  owner holds) is registered in CLAUDE.md with this brief.
- **Count**: every MMKK song with stems and a declared tempo and key
  (the agent inventories them through the app; ≈ 10–20 expected).
  Study 9's secondary arms run on the same stems, true stems with no
  bleed, which no published model has seen.

## Registered measures

Paired per item against D-prod:

- **Tempo:** exact within 1 bpm (Accuracy1) and within an octave
  (Accuracy2); octave errors and null-on-pulseless handling apart.
- **Beats** (N-beat only, D-prod has none): F-measure at ±70 ms against
  the synthesis grid; downbeat F-measure.
- **Meter:** accuracy on 4/4, 3/4 and 6/8 items; the 6/8 class is new
  to D-prod (which answers 4/4 or 3/4) and is scored as a separate
  line.
- **Key:** accuracy; relative-minor and fifth confusions counted apart;
  MIREX weighted score for comparability with the literature.
- **Key changes:** Study 4's grading where D-prod's `detectKeys` is
  compared with the candidate's segment keys on the same boundaries.
- **Chords:** Study 1's per-bar grade, maj-min and with sevenths.
- **Sections:** `grade8` hit rate at ±4 s and ±0.5 s, false boundaries
  per item, uniform loops apart.
- **Deployment cost** per candidate: weight size, cold load and
  inference time per 90 s of audio in onnxruntime-node on the bench
  machine (a registered proxy; the browser is measured once, by hand,
  for the winners, on WebGPU and wasm, and reported without a gate).

## Gates

A candidate **recommends replacement** of its production component when,
on the full fixture including the hard set:

- **G-beat:** N-beat's tempo Accuracy1 ≥ D-prod's and its octave errors
  ≤ D-prod's, with no new failure class (an item D-prod gets exact that
  N-beat misses by more than an octave counts as one).
- **G-meter:** N-beat's meter accuracy ≥ D-prod's on 4/4 and 3/4, and
  it scores the 6/8 items D-prod cannot.
- **G-key:** a key candidate's accuracy exceeds D-prod's by ≥ 3 items
  with no new confusion class; N-key-profiles is reported even if only
  N-key-cnn passes, since it is a one-line change.
- **G-chord:** N-chord's maj-min grade ≥ D-prod's and its sevenths grade
  higher, on the hard set as well as the plain one.
- **G-seg:** N-seg places 0 boundaries on uniform loops and ≥ Study 8's
  chart-arm hit rate at ±4 s on contrast items; its ±0.5 s rate is
  reported as the thing the chart-anchored model could not do.
- **Budget:** a winner over 25 MB of weights or over 10 s per 90 s in
  onnxruntime-node is reported as "wins, deployment open" rather than
  recommended.

## Predictions (draft; the agent re-registers them)

1. N-beat passes G-beat and G-meter: exact on every clean item, fewer
   octave errors on the ≈ 70/140 bpm items, 6/8 scored; the swing items
   are where it might lose a beat F-measure point without losing the
   tempo.
2. N-key-profiles gains 1–3 items over Krumhansl, mostly relative-minor
   cases; N-key-cnn, if run, passes G-key with the fifth confusions
   gone. On the plain synthetic set the differences are small; the hard
   set decides.
3. N-chord matches D-prod on maj-min and wins clearly on sevenths and
   slash chords; Basic Pitch's note transcription is the weaker link,
   not the matcher.
4. N-seg passes G-seg on contrast items and finds some harmonic-shift
   boundaries the model never did; it also invents ≤ 1 boundary per
   item on uniform loops, so the 0 in G-seg is the prediction most
   likely to fail, and the reason the gate asks for it.
5. Every candidate fits the budget in Node; the browser figures on wasm
   are the number that decides what ships, not these.

## Spend fences

- LLM spend: none. Model downloads: the weights named above, hashes
  recorded in the fixture.
- Compute: local; the hard-set synthesis and Basic Pitch run as Study
  1 did (≈ 15 min).

## Left to the bench

- The per-candidate front ends (log-mel, CQT) and their parity tests
  against each model's reference implementation.
- The N-key-cnn export, or its omission.
- The hard-set specs and count; the 6/8 and swing renderers if
  `synth4.ts` lacks them (register as synthesis extensions with the
  byte-identity check on existing fixtures, as Study 8 did).
- The MMKK fetch script, the per-label provenance, and the beat-grid
  tolerance for played tempo drift.
- Gate counts restated against the final fixture.
- Production fidelity: D-prod analyzes 32 kHz AudioBuffers in the
  browser; the bench renders 22 050 Hz. Register the rate used and
  check `extractFeatures` at it (shared with Study 9).

## What production does with the result

Each passing gate names a component to replace in
`src/lib/audio/analysis.ts` (beats and meter together; key profiles at
once if they win, the CNN behind a size check; chords; a new section
detector feeding the chart-anchored model's placement). A failing gate
closes the question for that component and is recorded in stem-shovel's
FINDINGS.md. Licenses to carry forward: Beat This! and ChordMini MIT,
LinkSeg CC-BY 4.0 (attribution in the app's built-with page). madmom's
pretrained models (CC BY-NC-SA 4.0) and Essentia's library (AGPLv3) and
models (CC BY-NC-ND 4.0) are non-commercial by default; either would
need a commercial license from its authors before shipping, so N-key-cnn
must come from a permissively licensed checkpoint or a model the bench
trains itself, and an export of madmom's weights is for measurement
only.

## Disclosure

Analyst Claude Fable 5. No language model is measured or consulted;
every grade is mechanical and committed before any candidate runs on
the fixture. Candidate weights are third-party files pinned by hash and
by an output test; their published scores are quoted from the review
and not relied on.
