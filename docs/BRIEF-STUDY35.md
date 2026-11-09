# Study 35: the chartless draft on modern recordings, with its refusals registered

Registered 2026-11-09, before any scored run. Adopts the app's brief
(stem-shovel docs/bench-brief-study35-modern-material-2026-11-09.md)
whole; Kevin cleared the corpus rights 2026-11-09 ("rights are clear
proceed"). Corpus frozen at 69ea88c BEFORE this registration.

## Corpus (ten, all Josh Woodward, CC BY 4.0 per page, audio hashes in corpus/study35-chords-verbatim.json)

The two measured songs count toward the ten per the brief. Three swaps
from the proposal, same artist and license, disclosed: Border Blaster,
Once Tomorrow and Crazy Glue publish tab shapes or an empty chords
block, which cannot make registered symbol truth; My Favorite Regret
(6/8 straight), Goodbye to Spring (a 240 bpm extreme-tempo probe) and
Cherubs replace them.

| # | Slot | Declared (page) | Transposition gate | Axis |
|---|---|---|---|---|
| 1 | jw-let-it-in | 121, Dm, 4/4 | 0 ACCEPT (.053, Study 34) | piano full band |
| 2 | jw-same-boat | 93, F#, 4/4 | REFUSED -> intervals (Study 34) | acoustic capo |
| 3 | jw-gravity | 48, F, 6/8 swing | +5 ACCEPT (.089) = its capo 5 | compound swung, electric |
| 4 | jw-my-favorite-regret | 65, D, 6/8 straight | +7 ACCEPT (.105) = its capo 7 | compound straight |
| 5 | jw-california-lullabye | 176, A, 4/4 | +2 ACCEPT (.047) = its capo 2 | fast, produced |
| 6 | jw-swansong | 170, G#, 4/4 | REFUSED (.011) -> intervals | full-band rock |
| 7 | jw-afterglow | 98, A, 4/4 | 0 ACCEPT (.046), no capo | drums-and-guitar pop |
| 8 | jw-cherubs | 165, D, 4/4 | REFUSED (.001) -> intervals | fast |
| 9 | jw-goodbye-to-spring | 240, A#, 4/4 | REFUSED (.011) -> intervals | extreme declared tempo |
| 10 | jw-im-letting-go | 76, Am, 4/4 | +5 ACCEPT (.064) = its capo 5 | sparse slow (notes-floor probe) |

Truth: tier-3 sequence truth transcribed verbatim from each page's
Tablature & Chords symbols (tab-only lines excluded; swansong's bridge
uses the artist's own parenthesized translations), committed beside
the verbatim blocks (corpus/study35-chords-verbatim.json,
corpus/study35-truth/). Five transposition gates ACCEPT and each
equals the page's stated capo — the instrument confirming itself five
times on known capos; three REFUSE into interval-invariant root
grading (the jw-same-boat rule). Quality families are
transposition-free. The pickup column is measured under the declared
grid; the corpus's pickup census is recorded in the results (the
brief's two-real-pickups wish is verified there — tier-3 truth has no
time-domain downbeats, so pickup readings are observational, as in
34b Part C's MIDI rows). PRE-REGISTRATION CENSUS, disclosed: under the
voted declared grids none of the eight new recordings puts first sound
after bar one, so no pickup fires the half-bar bound anywhere in this
corpus — the wish is UNMET AS MEASURED (the bench has no ear-truth
instrument for pickups, and fishing the catalog blind buys no
certainty); the bound's catch rate therefore stays unmeasured after
this study too, and the column is reported as the census. Three
recordings place voted bar one 2.5-3.5 beats BEFORE the first sound
(my-favorite-regret, swansong, cherubs), recorded as observations. The
same census already says the comb holds declared grids on modern
material: all eight land 0.0-1.4 % off declared, before any model
spend.

## Pipeline and modes

The Study 34/34b pipeline exactly (mono downmix, study9 features,
chartlessGrid with the declared bar prior, the 31c/32 vote and
placement, nchord hints, Study 23 prompt, claude-fable-5-1, graders
unchanged).

- **Declared mode (graded):** bpm = the page's declared tempo (what a
  visitor types), meter = the page's meter. Key = the study9-port
  detected key, as in 34b arm 1 (a visitor taps a tempo; few name a
  key). jw-let-it-in's Study 34 record IS its declared-mode record
  (detected 121.0/4/4/D minor equals the declared values and the
  prompt string is identical); reused, not re-spent, disclosed.
  jw-same-boat is re-drafted at its declared 93 (Study 34 ran it at
  the detected 123.1). Nine paid drafts.
- **Automatic mode ($0):** the v0.200-port detector's full Detection
  per song, for the S35-G4 confidence reading only. No drafts.

## The holds, registered before the run (the app's values, 916d3ca4)

Computed per record and reported whether or not they fire:

1. **Grid drift**: |grid bpm − declared bpm| / declared > 4 %
   (GENERATED_MAX_GRID_DRIFT).
2. **Thin transcription**: transcribed notes / grid bars < 3
   (GENERATED_MIN_NOTES_PER_BAR).
3. **Detected grid** (automatic mode only): recorded, not exercised —
   declared mode is the graded mode.
4. **Confidence refusal** (automatic mode, reported under G4): the
   v0.200 port's tempo.confidence < 0.84 refuses.

A held draft counts as refused, per the brief ("a wrong draft the
holds caught is a refusal and passes").

**Registered predictions** (the brief's, kept verbatim to be wrong
about): on modern recordings the drift and notes holds fire on none;
the confidence refusal fires on every wrong tempo detection and on at
most two right ones in ten.

## Gates (the app's, verbatim; never re-thresholded)

- **S35-G1 (the tool gate):** in declared mode with the holds, no
  recording lands confidently wrong AND saved. Classes are Study 34's:
  good / refused (held counts as refused) / confidently wrong
  (saved sequence roots < 80 %).
- **S35-G2:** good (roots >= 90 %, qualities >= 80 %) on at least
  seven of the ten.
- **S35-G3 (usefulness):** the drift and notes holds together hold at
  most one good or near-good draft (near-good = sequence roots >=
  80 %, registered here).
- **S35-G4 (reported, not gated):** automatic mode's confidence-refusal
  refuse rate, and whether any wrong tempo detection passed it.

## Arm D (exploratory, two drafts, no gate): the tempo-following grid

Kevin's question, on the two 34b comb-drift recordings only
(st-louis-blues, livery-stable-blues): beats from librosa 0.11's
dynamic-programming beat tracker (beat_track on the recording,
start_bpm = the declared tempo, trim false), grouped into bars by the
declared meter; bar one = the tracked beat nearest 34b's voted anchor
(the vote as it ran, not re-run). Same hints (nchord on the tracked
bar starts), same prompt (declared bpm), same graders
(pairBarsByTime handles variable bars natively). Reported beside 34b's
fixed-comb numbers: bar count vs truth, roots, qualities. Reading per
the brief: bars land + roots stay low = transcription is the limit;
roots recover = a tempo-following grid earns a design in
@barmark/listen.

## Spend

Nine declared drafts + two arm D at 34b's ~$0.05 ≈ $0.55. Fence
**$3.00** (the app's), hard stop before the next draft past the fence;
cost per draft declared (the tool's cost per visitor).

## Disclosures

- Gateway ignores temperature on fable-5-1 (standing); nchord stands
  in for ChordMini (standing); Fable measures fable-5-1 (mechanical
  graders only).
- One artist's production style and voice covers nine of ten modern
  slots; the Badverbs anchors (Study 33 numbers, no re-draft) add a
  second artist. External validity is bounded accordingly and said so
  in the report.
- Sequence truth has no bar counts or time anchors: structure and
  bar-one checks do not apply to tier-3 slots; the pickup column is
  observational.
- The confidence threshold 0.84 and the hold values 4 % and 3
  notes/bar were READ OFF 34b's fifteen recordings; this study is
  their first out-of-sample test, which is the point.

## Defect and correction (2026-11-09, same day, before any publication)

The first grading pass compared the draft's SOUNDING roots against the
chart's SHAPE roots without applying the calibrated transposition —
sequenceScore has no transposition parameter, and no earlier corpus
had a nonzero accepted value to expose that (Study 34's tier-3 slots
were transpose 0 or interval-invariant). The tell was mechanical:
every slot classed confidently-wrong was exactly a nonzero-transpose
slot (+5/+7/+2/+5) while its transposition-free quality score sat near
perfect. Per the hard rules the run stopped there: the grader gained
sequenceScoreTransposed with unit tests (published pitch classes
shifted +transpose mod 12; transpose 0 reproduces sequenceScore), the
runner was corrected, and the nine persisted drafts were regraded at
$0 by scripts/regrade-study35.ts — the model was never re-queried and
no threshold moved. Both gradings are preserved in
results/study35.json (rootsBefore under each slot's regrade key).
