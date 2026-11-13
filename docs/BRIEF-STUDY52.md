# Study 52: another transcriber for the bass line

Registered 2026-11-13, before any score below was computed. $0: no
gateway call; two outside models run on this machine. Fifth and last
item of docs/PLAN-bass-line.md, with Kevin's go-ahead for both models
("proceed with my permission to install the bass transcriber; I am
curious about MuScriptor even if we can't use it commercially, let's
test it").

## Question

Studies 49 to 51 found that Basic Pitch's settings, filters on its
notes, the grid, and trust by agreement with pYIN each leave the written
bass line at about three notes in four and under half its bars. What is
left is the reader. **Does a different transcriber write a better line,
and is it the second reader Study 51 lacked?**

## Readers

**Arm 1, `hfbass`** (this registration). xavriley/hf_midi_transcription
(MIT; commit 96f6797), its bass checkpoint
`filobass_20000_iterations.pth` (sha256 cbc792a1…5026e84, from the
Hugging Face repo xavriley/midi-transcription-models): the
onset/offset/frame/velocity CRNN of the piano_transcription_inference
fork (commit 7568dc7), by its name trained on FiloBass, jazz double
bass. Run as shipped: thresholds onset 0.3, offset 0.3, frame 0.1, the
stem loaded at 16 kHz mono (scripts/study52-hfbass.py, in its own
environment `.venv-study52`: torch 2.15.0, librosa 1.0.1, numpy 2.5.4,
torchlibrosa 0.1.0). The checkpoint is a pickle that the library loads
unsafely; the script loads it through torch's weights-only unpickler
with only numpy's array constructors allowed, and gives the library a
tensor-only copy.

**Arm 2, `muscriptor`** (to be registered by amendment before it runs).
MuScriptor (Kyutai and Mirelo, 2026; code MIT, weights CC BY-NC 4.0 and
gated behind a Hugging Face login and licence acceptance that only
Kevin can give). Its model size, instrument conditioning and how its
events become notes cannot be fixed until the package can load weights;
the amendment fixes them without touching anything below. The app could
not ship these weights commercially; Kevin asked for the number anyway.

Each reader is graded two ways, as Study 48 graded Basic Pitch: as
written (`<reader>`) and under the bass constraint (`<reader>-bass`: E1
to C4, the lowest of notes starting within 30 ms, none under 60 ms).
**The constrained line is the primary one**, for parity with every
Basic Pitch line it is compared to.

## Measures (all from earlier studies, none edited)

On the tracker's grid with the per-bar subdivision rule, over Study
48's graded span:

- **Notes** (scripts/study52-notes.py; Study 48's mir_eval measure,
  copied): exact, pitch-class and onset-only F at 50 ms; octave errors.
- **The line** (Study 50's `gradeLines` over Study 48's `gradeBar`):
  bars right, one error, wrong; slot F; onsets found and extra. Beside
  Basic Pitch's selected configuration (`o50-f30-n11-i0-m0`,
  bass-constrained), Study 49's best.
- **Trusted bars** (Study 51's `sameLine` and scoring): the bars of the
  reader's constrained line shown when Basic Pitch's line is the same
  (`bp`), when pYIN's is (`pyin`), when either is, when both are.

**Preflight**: the notes script stops unless its copy of the scoring
gives back Study 48's note-level scores for Basic Pitch and its
constrained notes on every song; the runner stops unless Basic Pitch
through it gives back Study 49's bars, and unless the two ports of the
bass constraint agree on each reader's notes.

## Predictions

Arm 1, the constrained `hfbass` line:

- **P1.** More bars entirely right than Basic Pitch on at least five of
  six songs.
- **P2.** Mean bars right of at least 60 % (Basic Pitch: 45.2 %).
- **P3.** It clears Study 48's bar (70 % right, at most 10 % wrong) on
  at most three songs.
- **P4.** Octave errors on at most 3 % of matched notes on every song.
- **P5.** Agreement with Basic Pitch shows at least a quarter of the
  bars with notes on at least five songs, and the shown bars are at
  least 80 % right pooled.
- **P6.** No agreement rule meets Study 51's bar on every song.

Arm 2, written now so that arm 1's result cannot shape them:

- **M1.** MuScriptor's line has more bars right than Basic Pitch on at
  least five of six songs.
- **M2.** Its mean bars right is below `hfbass`'s.
- **M3.** Bars where `hfbass` and MuScriptor write the same line are at
  least 85 % right pooled.

## Decision rules

Per reader:

- **S52-D1, the line.** Study 48's bar, not moved: shown if at least
  70 % of bars are right and at most 10 % wrong on every song.
- **S52-D2, a better first reader.** Yes if its mean bars right is at
  least 10 points over Basic Pitch's selected configuration and no song
  loses more than 2.
- **S52-D3, trusted bars.** Study 51's bar, not moved: a rule is
  recommended if on every song the bars it shows are at least 70 %
  right and at most 10 % wrong and it shows at least a quarter of the
  bars with notes; the qualifying rule that shows the most, pooled.

## Disclosures

- **Seen before registration, without truth.** `hfbass` was run on the
  six stems to build the fixture. Seen: its note counts (363, 360, 324,
  249, 394, 332), which sit close to the truth's counts known from
  Study 48 (404, 395, 270, 250, 359, 334 graded); that its pitches equal
  pYIN's at shared onsets on 284 to 357 notes a song, so it reports
  sounding pitch and needs no octave shift; that it is nearly
  monophonic and writes a few notes under 20 ms, which the constraint
  drops. No score against the truth has been computed. P1 and P2 lean on
  the note counts.
- **Domain.** The checkpoint is trained on jazz double bass; these
  stems are a sampled electric bass rendering the MIDI. The comparison
  is fair to the app's situation and says nothing about FiloBass-like
  material.
- **Licences.** hf_midi_transcription's code and model card say MIT.
  MuScriptor's weights are non-commercial. Neither is a recommendation
  to ship; S52 decisions are measurements.
- Outside code was read before it ran (the wrapper, the inference
  fork's loading and post-processing; MuScriptor's download and loading
  path), and the model binaries are not committed.
- Six songs by one writer. Deterministic on this machine; a rerun
  reproduces every number.
