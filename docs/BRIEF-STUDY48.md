# Study 48: is a transcribed bass line right often enough to show a bassist?

Registered 2026-11-12 before any scored run. $0 model spend: no gateway
call; the pipelines are Basic Pitch, a constraint on it, and pYIN, all
local. The app's brief (stem-shovel
docs/bench-brief-bass-transcription-2026-11-12.md) offered $3 for hand
transcription; Kevin's MIDI makes that unnecessary. **The run is held
until Kevin has read this brief**: the corpus is his own recordings and
the scoring choices (what counts as a right bar) are his to object to.
The seen-before-registration numbers are disclosed below.

## Question

Kevin wants each stem to carry its own part written out, starting with
the bass as a barmark `Bs` line. Before the app builds it: on real bass
stems, is the written line right often enough that a bassist would use
it rather than throw it away? The brief splits that into the
transcription (Ask A), a transcriber built for the job (Ask B), the
quantization (Ask C) and the verdict a musician would give (Ask D).

## Corpus (corpus/study48-manifest.json, scripts/ingest-bass-pair.py)

Kevin's MMKK songs with a separate bass stem and his MIDI of the bass
part from the Logic session, one pair per song, as he exports them. Taken
in so far (2026-11-12):

| song | stem | MIDI | the stem on the app's timeline |
|---|---|---|---|
| Peaceful Dreams | 185.4 s, 48 kHz | 429 notes, 9 region tracks, 145 bpm 4/4 | the mix starts one bar into the session; Kevin's stem export starts at bar 14 (verified by onset and pitch-class match: 349 of 357 matched notes agree, no drift) |
| Interbellum | 133.1 s | 456 notes, 11 region tracks, 115 bpm 4/4 | the mix starts one bar into the session; the stem is the app's own (30 ms apart; 323 of 324 matched notes agree) |

More pairs join as Kevin's exports succeed (two failed on 2026-11-12:
14-byte files); each goes through the same intake, and the study's
tables grow by rows, not by rules. Audio and MIDI are gitignored; the
manifest holds digests, offsets and counts.

The grid is the app's own: Beat This small0's beats and downbeats per
recording as the app stores them (corpus/study44-app-beats.json, equal
to the bench's to the frame, Study 44), on the mix timeline. MIDI time
reaches it through the intake's two offsets; a transcription of Kevin's
stem reaches it through the envelope cross-correlation with the app's
stem.

**What the MIDI is.** Peaceful Dreams' region tracks are named "Bass
Player - Pop Songwriter", Logic's Session Player: the stem is rendered
from this MIDI by a sampled bass, so the truth is exact and the sound is
clean. Interbellum's regions are named by section and the source is not
known to the bench. A miked or DI'd human bass would be harder than
either; this study's result is a ceiling for such stems and the bench
says so where it reports.

## Pipelines (Asks A and B; scripts/study48-notes.py, tests/study48_notes_test.py)

- **bp**: Basic Pitch as the app runs it (scripts/transcribe-child.mjs,
  the app's model and thresholds), on the bench's 22050 Hz mono decode of
  the stem.
- **bp-bass**: the same notes constrained to a bass: pitch 28 to 60 (E1
  to C4), one note at a time (of notes starting within 30 ms, the lowest
  is kept), none shorter than 60 ms. The cheap fix the brief asks about.
- **pyin**: librosa's pYIN (fmin 30 Hz, fmax 400 Hz, frame 2048, hop 256),
  voiced frames cut into notes at librosa's onsets and where the rounded
  pitch changes, pitch the median frame, none shorter than 60 ms. The
  monophonic tracker; pYIN over CREPE because it runs without a model
  download and the stem is one instrument.

Note-level scores (mir_eval 0.8.2): precision, recall and F with the
onset within 50 ms and the pitch within 50 cents, offsets ignored
(octave-exact); the same with every pitch folded to one octave (pitch
class); onset-only F; and the **octave error rate**, among notes matched
on onset and pitch class the share whose octave is wrong, by the truth's
register (E1 to A1, Bb1 to E2, F2 to B2, C3 and up) and by direction.

## Quantization and grading (Asks C and D; src/study48/bassLine.ts, tests/study48.test.ts, scripts/run-study48.ts)

- **The grid.** Each bar is the tracker's downbeat to the next, its
  beats the tracker's beats inside; each beat divides into four
  (sixteenths) or three (eighth-note triplets).
- **Straight or triplet**, per bar, from the line's own onsets: triplet
  only when the mean quantization residual on the triplet grid is under
  0.8 of the straight grid's and the bar has two onsets or more;
  otherwise straight. The same rule for the truth and for a
  transcription.
- **Notes too short to be meant**: shorter than 0.4 of a sixteenth at
  their beat are dropped, truth and transcription alike.
- **Onset and end** go to the nearest slot (an onset just before the next
  downbeat belongs to it); two onsets in one slot keep the lower note.
- **A bar is graded** against the truth's bar: every truth onset must
  have a transcribed onset in the same slot with the same pitch, octave
  included (a bassist reads octaves; a line an octave off is a wrong
  part, as the brief says), and no extra onsets. **Right** is zero
  errors, **one error** is one missing, extra or wrong-pitched onset,
  **wrong** is more. A bar on the other grid (straight against triplet)
  is wrong unless both are empty. Reported beside it: the share of bars
  whose rhythm alone is exactly right, and per note the share on the
  right slot, with the right pitch class, with the right pitch.
- **The graded span** is the truth's: from the first bar with a MIDI note
  to the last; silent bars inside it count and must be silent in the
  transcription.
- **The line is written** as barmark: `{E1}` note sets (sounding pitch,
  MIDI 28 = E1), a slot per beat, `_` groups for subdivisions with `/`
  holds and `--` rests, `{X}._{Y}` for a dotted eighth and sixteenth,
  four bars a line, under `part: Bs = Bass`; every written chart must
  parse in barmark 0.17 with zero errors (a grader check, not a score).
  The truth's line is written the same way, so what the app would show
  from perfect notes is on record.

## Predictions

- P1: Basic Pitch as the app runs it has an octave error rate of at
  least 30 % on every song, and most of its octave errors are upward
  (the second harmonic read as the note).
- P2: the lowest register (E1 to A1) has the highest octave error rate
  on every song.
- P3: the bass constraint lifts octave-exact F by at least 0.15 over
  plain Basic Pitch on every song.
- P4: pYIN's octave-exact F is above the constrained Basic Pitch's on
  every song.
- P5: with the best pipeline per song, at least 80 % of the truth's
  notes land on the right slot.
- P6: no pipeline reaches 70 % of bars entirely right on every song.

## Decision rule

S48-D1. A written bass line helps more than it misleads when at least
70 % of its bars are entirely right and at most 10 % are wrong, on every
song in the corpus. If Basic Pitch or the constrained Basic Pitch clears
it, the bench answers **yes** and names the cheaper one that does. If
only pYIN clears it, the answer is **only with a monophonic tracker**.
If none does, **no**, with the failure named by the tables: octave,
ghost notes, missed repeats or rhythm. The labelled judgment the brief
asks for (at what share a bassist would use the line) is the bench's and
is given beside the rule, not in place of it.

## Disclosures

- **Seen before registration**, from the intake's alignment check (60 ms
  onset match, before any constraint): Peaceful Dreams 357 of 429 MIDI
  notes matched by a Basic Pitch note, 190 exact and 159 an octave off;
  Interbellum 324 of 456 matched, 67 exact and 256 an octave off. Basic
  Pitch found 694 notes on Peaceful Dreams against 429 in the MIDI. P1
  is written knowing this; P2 to P6 are not informed by any number.
- The alignment counts above use the intake's matcher, not mir_eval; the
  study's Ask A numbers will differ in detail.
- $0; the run is local. pYIN on a three-minute stem takes a few minutes.
- The truth's own quantization is the reference, so a MIDI note the DAW
  placed off the grid (a humanized part) is quantized by the same rule
  before grading; the share of truth bars on the triplet grid is
  reported.
- The app's beats are the grid, so a tracker error is a quantization
  error here for truth and transcription alike; it cancels in the bar
  grade when both move together and shows as a rhythm miss when they do
  not. Study 44 put the app's beats at F 1.000 against the bench's; the
  bench has no truth for the beats of these two songs.
- Kevin's stems are the MIDI rendered by Logic's Session Player (Peaceful
  Dreams by its track names; Interbellum unknown), not a miked bass.
