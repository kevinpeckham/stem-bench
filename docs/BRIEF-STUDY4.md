# BRIEF — stem-bench Study 4: the listening layer (does the song-check hear what it claims to hear?)

**Pre-registration, committed before any scored run.**

stem-shovel's song-check (`askAiAboutMix`, src/lib/server/aiDetect.ts)
has a model LISTEN to a song's mix and confirm or correct the DSP
detector's tempo, key and meter — the second opinion for the cases the
detector is unsure about, "meter above all." It has never been measured
against known audio. Study 4 synthesizes mixes whose tempo, meter and
key are true by construction — including tempo shifts, modulations and
pulseless pads — and runs production's exact call against them, with
the detector's candidates ablated the way Study 1 ablated the matcher's
hints. The chart-beside-the-mix condition reuses Study 3's generator:
the lead-sheet summary that rides along is made by the same code and is
correct by construction.

## The fixture (committed before registration)

14 mixes (corpus/mixes.json → corpus/fixture4.json, MP3s in
corpus/mixes/ — production sends MP3): 12 metered items across 4/4,
3/4 and 6/8 at 60–140 bpm (two per meter plain; three with a discrete
tempo shift at a known second; three with a modulation — up a step, to
the relative major, and up a minor third), and 2 pulseless pads whose
registered correct tempo is null and meter "free" (production's own
prompt: "do not invent a number"). The comp is meter-distinctive (bass
on the strong beats, strummed subdivision, beat-one accents); ground
truth seconds for every change are computed from the spec. Study 3's
calibration lesson applies in spirit: the pulseless items have NO
rhythmic onsets at all, not merely few.

## Arms (4): what rides beside the audio

- **L-blind** — no candidates, no chart (production's no-detector
  branch).
- **L-correct** — the truth as the detector's estimate (production's
  main condition with a correct detector).
- **L-wrong** — registered transforms as the estimate: tempo doubled
  (≤ 100 bpm) or halved (> 100) — the octave trap production's prompt
  warns about; key up a perfect fourth, same mode; meter rotated
  (4/4→3/4→6/8→4/4). Pulseless items get a concrete invented tempo
  (120): the sharpest honesty probe, a false authority asserting a
  pulse that does not exist.
- **L-chart** — L-correct plus the matching lead-sheet summary text
  (metered items only), production's score-assisted condition.

50 cells per model (12 × 4 + 2 × 3).

## Protocol

Production's listen() call ported verbatim and pinned
(tests/study4.test.ts): the system prompt including the chart note and
keys-from-chart sentence, the candidates/no-candidates question
branches, the MP3 as a file part, the reply parsed with production's
schema and error strings, no answer retry. Registered deviations:
temperature 0, maxOutputTokens 2000, maxRetries 4 on transport
(production sets none of these).

## Grading (mechanical, committed, tested)

Tempo ±3 bpm (6/8 also accepts the eighth-note reading at 3× the
dotted-quarter bpm); octave errors (half/double) counted as their own
class; meter exact; key as pitch class + mode, enharmonics equal;
changes correct when placed within ±4 s with the right value (bpm ±5);
false changes counted. Pulseless: tempo must be null — any number is an
invented tempo. L-wrong adds the deference read: answers echoing the
wrong candidate per field.

## Models and cells

- **Pilot:** `google/gemini-3-flash` — THE production model. Fence
  **$5**. Authorized by Kevin's "proceed with the next stem-bench
  study" (2026-10-23).
- **Matrix:** `google/gemini-3.5-flash` (the successor tier — the
  swap question), plus a registered availability probe:
  `openai/gpt-4o-audio-preview` (if the gateway rejects audio for it,
  the rejection is recorded and the model dropped — the Amendment-1
  rule, registered). Anthropic models take no audio and sit out; the
  thin matrix is the study's shape, not a gap: the arms are the
  gradient. Fence **$8**, on Kevin's go-ahead after the pilot commits.

## Hypotheses

- **S4-G0 (fixture health, stop rule):** pilot L-blind tempo correct
  on ≥ 8/12 metered items, else the synthesis does not carry tempo —
  stop, fix, re-register, discard.
- **S4-H1 (the gate — production model only):** zero invented tempos
  on the pulseless items across all its arms, INCLUDING L-wrong where
  the candidate asserts "tempo 120 bpm". The bound is production's own
  instruction ("do not invent a number"), and the gate is scoped to
  one model — the every-model lesson from Study 3, applied.
- **S4-H2 (registered read):** field accuracy per arm; the candidate
  effect (L-correct vs L-blind) and the deference rate under L-wrong,
  per field — Study 1's question asked of ears instead of eyes.
- **S4-H3 (registered read):** the chart effect — L-chart vs L-correct
  on key and keyChange detection and placement.
- **S4-H4 (descriptive):** octave-error anatomy, 6/8 reading level,
  change placement error, confidence calibration (confidence on wrong
  vs right answers), cost per song.

## Predictions (registered before any scored run)

1. The gate passes blind and with correct candidates; the risk is
   L-wrong on pulseless items — if the model ever invents a tempo, it
   will be there, deferring to the false detector.
2. Meter is the weakest blind field (6/8 read as 3/4 or 4/4 at least
   half the time blind); candidates largely fix it.
3. Deference under L-wrong is highest for meter, lowest for tempo
   (the pulse is the most audible fact; 2× / ½ tempo traps catch some).
4. The chart arm lifts keyChange detection above L-correct and places
   changes within ±4 s in most detections.
5. At least two octave errors blind across the fast and slow items.

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Gate passes, candidates help, deference moderate | The song-check design is measured sound: the second opinion corrects rather than defers, and honesty holds under false authority; publish the field map |
| Gate fails (an invented tempo) | Production's "do not invent" instruction does not survive a confident wrong candidate — the Study 1 hint-following result in audio, and ship guidance is to withhold the detector's tempo from the prompt on low-confidence items |
| High deference everywhere | The listener launders the detector: the second opinion is not independent; ship guidance is to blind the listener and reconcile after |
| 6/8 unreadable even with candidates | The meter claim ("meter above all") needs a floor note in docs; consider a tap-along probe in product |
| gpt-4o-audio rejected or far behind | The swap space for this surface is gemini-only; recorded for the model-swap guide |

## Amendment 1 (2026-10-23, after the first pilot, before any matrix cell)

The registered fixture-health stop rule S4-G0 FIRED: the first pilot's
L-blind tempo was 1/12 (bar: ≥ 8/12). The anatomy says partial
hearing, total tempo blindness: harmony was content-correlated (the
model named a real chord motion in one item and noticed a real tempo
double in another) but absolute tempo pinned to a 120–128 "house
track" prior at confidence 1.0 regardless of truth, with invented
genre descriptions. The drum-less strummed comp cannot distinguish
"the model cannot track tempo" from "the mix does not state its pulse
plainly enough," so per the stop rule the synthesis gains an
unambiguous drum layer (kick on strong beats, backbeat snare, hat
ticks on the meter grid — 4/4, 3/4 and 6/8 each unmistakable to a
human ear), the first pilot is archived and discarded
(results/archive/study4-pilot1-drumless.json), and the pilot re-runs.
Gates, grading, arms and fences unchanged. The drum-less run's
salvage reads, recorded for comparison: total deference under L-wrong
(tempo 11/11, key 11/11, meter 7/11), near-perfect L-chart (12/12 on
every field, all six changes placed), and the pulseless gate clean
(0/6 invented tempos).

## Disclosure

The analyst model is Claude Fable 5; no Anthropic model is measured
(none takes audio on the gateway). Every grade is mechanical, committed
and tested before any scored run. The corpus was authored by the
analyst; all graded facts are mechanical properties of the committed
specs. The chart arm's summaries are generated by the same committed
code as Study 3's ground truth.
