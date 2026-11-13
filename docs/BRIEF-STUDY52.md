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

## The truth's defect, and re-registration (2026-11-13, after the first scored pass, before any write-up)

The first scored pass (registration 2f6e186) showed `hfbass` at 43 % of
bars right on Letter Lands against Basic Pitch's 76 %, with a higher
note-level score. Looking at its bars there showed "extra" notes that
pYIN wrote identically, and the cause was the truth: the intake's MIDI
parser had been losing back-to-back notes of one pitch, 1 % to 18 % of
each song's notes (docs/CORRECTION-2026-11-13-bass-truth.md). A
defective fixture: fixed (commit c844706, with a test), every MIDI
re-read, offsets confirmed, Studies 48 to 51 re-run, and this study
re-registered by this commit before its pass is run again. Readers,
measures, predictions and decision rules are unchanged.

**Seen in the defective pass**, `hfbass` under the constraint, by song
(Peaceful Dreams, Interbellum, Letter Lands, Eat All the Clocks,
Downline, Mop Heart): note-level exact F 0.857, 0.810, 0.865, 0.944,
0.826, 0.991, no octave errors; bars right 50 %, 38 %, 43 %, 80 %,
53 %, 86 % (mean 58.2 % against Basic Pitch's 45.2 %); agreement with
Basic Pitch showing 53 % of bars, 65 % of them right, pooled. P1, P3,
P4 and P6 would have held, P2 and P5 not; S52-D1 no, S52-D2 no (Letter
Lands down 34 points), S52-D3 no rule. The first pass's files are in
results/superseded-2026-11-13/.

The predictions were written before any of this and are scored as
written. The analyst now expects the corrected truth to favour whichever
reader hears repeated notes best, which the defective pass suggests is
`hfbass`; that expectation is disclosed, not registered.

Also seen before this re-registration: the re-runs of Studies 48 to 51
on the corrected truth (Basic Pitch's selected configuration now 36 %,
32 %, 76 %, 42 %, 63 %, 40 % of bars right, mean 48.4 %).

## Results (2026-11-13, re-registration d3561c5, on the corrected truth; $0; arm 1, `hfbass`)

Both preflights passed. The constrained and the unconstrained line are
the same on every song to within one bar, so one column is shown.

### Notes

| song | `hfbass` exact F | onset-only F | octave errors | Basic Pitch constrained, exact F (Study 48) | pYIN |
|---|---|---|---|---|---|
| Peaceful Dreams | 0.881 | 0.886 | 0 of 360 | 0.759 | 0.756 |
| Interbellum | 0.825 | 0.832 | 0 of 349 | 0.768 | 0.753 |
| Letter Lands | 0.909 | 0.969 | 0 of 290 | 0.892 | 0.604 |
| Eat All the Clocks | 0.949 | 0.953 | 0 of 243 | 0.716 | 0.695 |
| Downline | 0.935 | 0.937 | 0 of 388 | 0.801 | 0.790 |
| Mop Heart | 0.991 | 0.991 | 0 of 332 | 0.854 | 0.865 |

Not one octave error in 1,962 matched notes. It is the better reader on
every song by the note.

### The line

| song | Basic Pitch (Study 49's best): right · wrong | `hfbass`: right · wrong | slot F, Basic Pitch → `hfbass` | extra onsets, Basic Pitch → `hfbass` |
|---|---|---|---|---|
| Peaceful Dreams | 36 · 38 % | 53 · 25 % | 0.767 → 0.862 | 40 → 9 |
| Interbellum | 32 · 49 % | 39 · 54 % | 0.820 → 0.835 | 23 → 8 |
| Letter Lands | 76 · 13 % | 51 · 9 % | 0.916 → 0.924 | 23 → 38 |
| Eat All the Clocks | 42 · 35 % | **82 · 7 %** | 0.789 → 0.962 | 40 → 3 |
| Downline | 63 · 20 % | **74 · 8 %** | 0.808 → 0.893 | 53 → 21 |
| Mop Heart | 40 · 47 % | **87 · 9 %** | 0.753 → 0.958 | 82 → 11 |
| mean bars right | 48.4 % | 64.3 % | | |

Three songs clear Study 48's bar outright, which no pipeline had done
on any song. `hfbass` adds almost no extra onsets; what it gets wrong
is misses: it finds 75 % to 97 % of the truth's onsets, and Interbellum
(75 %) and Peaceful Dreams (78 %) are where it falls short.

**Letter Lands is a question about the truth, not yet an answer about
the reader** (post-hoc, labelled; scripts/sensitivity-study52.ts). The
corrected MIDI holds 20 notes on Letter Lands that are 4 ms long, an E
on the fourth beat of the riff's bars, and 23 of 4 to 7 ms on
Interbellum. Study 48's grader drops truth notes under 0.4 of a
sixteenth as not meant, so they are not in the truth. `hfbass` writes a
note in 19 of those 20 slots on Letter Lands (in the four such bars
looked at, pYIN hears one there too and Basic Pitch holds the previous
note), and each is counted as an extra. With those onsets forgiven, `hfbass` on Letter
Lands is 79 % of bars right, not 51 %, and Basic Pitch is unchanged at
76 %; Interbellum does not move. Whether a 4 ms note is a note is
Kevin's to say; the registered result stands until he does.

**Kevin's answer (2026-11-13): "4ms notes should be discarded, they are
likely artifacts of the editing process in the DAW."** So the grader's
rule is right for the truth and the registered result stands: Letter
Lands 51 %, S52-D2 no. What the answer also says is that the Letter
Lands stem carries about twenty sounds the part does not intend, because
Logic's sampler played the debris when it rendered the stem. `hfbass`
hears them and is marked down for it; that is a property of this
fixture, not of a bass played by hand, and the 79 % remains a labelled
what-if. A Letter Lands pair exported after deleting those notes would
settle it with no what-if.

### Trusted bars (the `hfbass` line, shown when another reading agrees)

| rule | bars shown | right | wrong | songs meeting all three conditions |
|---|---|---|---|---|
| every bar | 546 | 65 % | 17 % | 3 |
| agrees with Basic Pitch | 287 (53 %) | 77 % | 12 % | 4 |
| agrees with pYIN | 184 (34 %) | 77 % | 10 % | 2 |
| either | 342 (63 %) | 75 % | 12 % | 4 |
| both | 129 (24 %) | 81 % | 8 % | 2 |

Agreement with Basic Pitch, by song: Peaceful Dreams 61 % shown, 60 %
right, 17 % wrong; Interbellum 40 %, 48 %, 52 %; Letter Lands 36 %,
95 %, 5 %; Eat All the Clocks 35 %, 95 %, 5 %; Downline 73 %, 80 %,
6 %; Mop Heart 38 %, 94 %, 3 %. Four songs qualify. Peaceful Dreams
misses on accuracy and Interbellum fails outright: where both readers
drop the same short legato notes, agreement confirms the wrong bar.

### Predictions

- P1 (more bars right than Basic Pitch on five of six): right, five.
- P2 (mean bars right at least 60 %): right, 64.3 %.
- P3 (clears Study 48's bar on at most three songs): right, exactly
  three.
- P4 (octave errors at most 3 % everywhere): right, none at all.
- P5 (agreement with Basic Pitch shows a quarter of the bars on five
  songs and they are 80 % right pooled): **wrong**; six songs, 77 %.
- P6 (no agreement rule meets Study 51's bar on every song): right.

Five of six. (On the defective truth P2 would have failed.)

### Decisions

- **S52-D1, the line: no.** 70 % right and at most 10 % wrong on three
  songs of six (Eat All the Clocks, Downline, Mop Heart), not on every
  song.
- **S52-D2, a better first reader: no, by the registered rule.** The
  mean gain is 15.9 points against the 10 required, but Letter Lands
  loses 25 where the rule allows 2. The loss is the 4 ms notes above;
  with them forgiven no song loses. That is a sensitivity, not the
  result. Kevin has since confirmed the 4 ms notes are debris,
  so the truth is right and this decision is final for this corpus.
- **S52-D3, trusted bars: no rule.** Agreement with Basic Pitch
  qualifies on four songs of six.

### What the study changes

This is the first reader that moves the line: about double Basic
Pitch's bars right on two songs, half again on one, a fifth more on
two and fewer on Letter Lands; no octave errors; a third of the extra
onsets. It is not yet a line to show on every song,
and by the rules written before the run it is not recommended. What
stands between it and those rules is small and specific: one question
about the truth on Letter Lands, and one song, Interbellum, whose short
legato notes no reader here separates.

The study also found that the truth every bass study had used was
missing notes, and five studies were re-run because of it.

### Disclosures

- $0. Registered at 2f6e186; the first pass ran on a defective truth
  and is disclosed above; re-registered at d3561c5; the pass on the
  corrected truth ran once.
- Arm 2 (MuScriptor) has not run: its weights need a Hugging Face login
  and a licence acceptance that are Kevin's. M1 to M3 stand as written.
- The checkpoint is by its name trained on jazz double bass; these are
  sampled electric bass. The model card says MIT; the app's use of it
  would need its own look at the licence and at how the checkpoint is
  loaded (a pickle; this study loaded it through the safe unpickler).
- The sensitivity analysis and the look at Letter Lands' bars were made
  after the scored pass.

## Amendment: arm 2, MuScriptor (2026-11-13, registered before its notes were scored)

Kevin accepted the model's licence and logged this machine in to
Hugging Face. What the first registration left open is fixed here;
nothing else in this brief changes.

- **Model.** MuScriptor 0.4.0 (github.com/muscriptor/muscriptor, commit
  8a1ef88; code MIT), the `medium` weights (hf MuScriptor/muscriptor-medium;
  CC BY-NC 4.0, so not shippable commercially), on the CPU in float32,
  in its own environment `.venv-study52m` (torch 2.15.0, torchaudio
  2.11.1). The weights are safetensors; no pickle is loaded.
- **Settings.** As shipped: greedy decoding, prelude forcing on, no
  sampling. One choice: the instrument constraint
  `instruments=["electric_bass"]`, which the package offers for when the
  instrument is known, as it is for a bass stem.
- **Notes.** The model's own event stream (`TranscriptionModel.transcribe`),
  each note start paired with its end, in seconds of the stem
  (scripts/study52-muscriptor.py). Graded as written (`muscriptor`) and
  under the bass constraint (`muscriptor-bass`, primary), like arm 1.
- **Not scored: the command line's MIDI.** The script also wrote the MIDI
  the package's CLI produces by default (its own beat grid, its measured
  onset lag removed). Without truth: only 1 to 86 of its 243 to 393
  notes per song fall within 80 ms of `hfbass`'s note of the same pitch,
  against 237 to 388 for the event stream, so that MIDI is on the
  package's own bar-aligned timeline, not the stem's. Putting it back on
  the stem's clock would be the bench's work, not the model's, so it is
  left out.
- **One more agreement rule**, for M3: the bars of the `muscriptor-bass`
  line shown when arm 1's `hfbass-bass` line is the same (`hfbass`),
  beside the four rules above (`trusts52b`, src/study52/second.ts, with
  a test). Arm 1's results are untouched by the change and reproduce.

**Seen before this amendment, without truth.** Note counts 393, 390,
287, 243, 393, 335 (the corrected truth holds 454, 491, 315, 264, 438,
338; `hfbass` wrote 363, 360, 324, 249, 394, 332). Its pitches equal
pYIN's at shared onsets on 217 to 373 notes a song, so it reports
sounding pitch. Its onsets sit 5 to 10 ms after `hfbass`'s and within
4 ms of Basic Pitch's, median, so no lag correction is applied. It is
monophonic but for six overlaps on one song. It took about four times
the audio's length on this CPU, against a third for `hfbass`. **And all
of arm 1's results on the corrected truth are known**, which M1 to M3
were written before.

Predictions M1 to M3 and decision rules S52-D1 to D3 apply as written,
the decisions per reader.
