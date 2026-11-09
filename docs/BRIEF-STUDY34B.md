# Study 34b: do declared priors make the chartless draft safe?

Registered 2026-11-09, before any scored run. Adopts the app's brief
(stem-shovel docs/bench-brief-study34b-declared-priors-2026-11-09.md)
whole, with the reconciliations below. Study 34 (results ba88e9c)
located the break at the declared-input stage; this study asks (A)
whether detection could have known it was guessing, (B) whether the
drafter is good when a person supplies the tempo and the meter, and
(C) one free column on pickups.

## Part A instrument (no model spend)

The detector is the bench's NEWEST committed verbatim port of
production `analyse()`: src/study11b/analysis200.ts (stem-shovel
79ed4def, v0.200.0, "the tempo ladder"), the version whose Detection
carries `tempo.confidence`, `tempo.subdivision`, `tempo.alternates`
(factor, bpm, strength per rung), `meter.confidence` (with 6/8 in its
vocabulary) and `key.confidence` — the fields the app's brief asks
for. Features production-capped (90 s), peak-normed mono, the
production call shape. DISCLOSED: Study 34's run took its declared
inputs from the older study9 port (no ladder, no 6/8); Part A's table
carries Study 34's recorded values beside the v0.200 port's wherever
both exist, so any disagreement between the two ports is visible
rather than silently re-measured.

Fifteen recordings: the twelve Study 34 slots plus letter-lands,
mop-heart and peaceful-dreams (mono downmixes of the public mixes).
Interbellum and the control are detected like the rest; their page
declarations are their truth, as the app's brief states.

## Truth for "right" (registered before any detection is read)

Tempo right = within 4 % of the truth below; a rung is right the same
way. Meter right = exact value. Key right = same tonic pitch class and
mode (detector unicode accidentals normalized).

| Recording | Tempo | Meter | Key | Tempo provenance |
|---|---|---|---|---|
| eat-all-the-clocks | 120 | 4/4 | E minor | page |
| interbellum | 115 | 4/4 | C major | page |
| letter-lands | 132 | 4/4 | F# major | page |
| mop-heart | 224 | 3/4 | A major (first declared; mid-chart B disclosed) | page |
| peaceful-dreams | 145 | 4/4 | D major | page |
| dippermouth-blues | 185.5 | 4/4 | C major | JAAH aligned median bar |
| st-louis-blues | 67.0 | 4/4 | D major (JAAH writes "D"; major assumed, disclosed) | JAAH aligned median bar |
| livery-stable-blues | 163.8 | 4/4 | Eb major | JAAH aligned median bar |
| roll-called-up-yonder | 97.1 | 4/4 | Ab major | self-similarity at the engraved 64-beat verse cycle (below) |
| three-oclock-waltz | 141.6 | 3/4 | C major | self-similarity at the published 192-beat strain lag (below) |
| jw-let-it-in | 121 | 4/4 | D minor | artist page |
| jw-same-boat | 93 | 4/4 | F# major | artist page |
| kitten-on-the-keys | — | 4/4 | F major | no tempo truth; meter/key expected only |
| sp-today-live | — | 4/4 | Eb major | no tempo truth; meter/key expected only |
| irish-jigs-medley | — | 6/8 | — | no tempo or key truth; meter expected only |

**The Tier 2 tempo instrument** (scripts/truth-study34b-tempo.ts,
output corpus/study34b-declared.json, committed with this brief): the
publication fixes a repeat's length in beats, the recording's chroma
self-similarity fixes its period in seconds, tempo follows — no onset
comb, no production code. Hymn: verse+refrain = 16 bars = 64 beats;
the verse lag's first three multiples agree within 0.2 % (39.57 /
39.52 / 39.60 s, correlation rising to 0.91 at the triple), period
39.56 s → 97.1 bpm. Waltz: strain A recurs 64 bars later (extraction
bars 13-45 ≡ 77-109) = 192 beats; lag 81.36 s → 141.6 bpm, and the
form identity closes: the audible span holds 149.2 bars at that tempo
= the published 118 plus one repeated 31-bar strain, an integer match.
Cross-checks disclosed: the Study 10 n-beat tracker taps the waltz at
136.4 (MAD 4.5 %), which matches no integer form (143.7 bars), and
cannot tap the hymn at all (MAD 47 %); the Study 34 report's "~105"
for the hymn was an unlabeled estimate and is SUPERSEDED by this
instrument (correction noted in REPORT.md; Study 34's 0/16 roots and
its class are unaffected — the detected 78.6 bpm C minor is wrong
against 97.1 exactly as it was against ~105).

## Part A reading (exploratory, registered as such)

For each signal — tempo.confidence, meter.confidence, key.confidence,
and the strongest alternate's strength — report the single threshold
that best separates the wrong detections from the right ones (fewest
misclassifications; ties broken toward the midpoint), the
misclassification count at that threshold, and how many recordings sit
within 10 % of it. A threshold read off fifteen recordings is a
hypothesis for the next corpus, not a finding, and the report will say
so in those words.

## Part B: the five wrong slots with tempo and meter declared

The Study 34 pipeline exactly (same grid, vote, placement, nchord
hints, prompt, model claude-fable-5-1, graders, truth), with ONLY the
declared inputs changed:

- **Declared tempo** = the truth above rounded to a whole bpm
  (dippermouth 186, st-louis 67, livery 164, hymn 97, waltz 142), as a
  person would type or tap; the onset comb refines the period as the
  pipeline always does.
- **Declared meter** = the truth (3/4 for the waltz, 4/4 otherwise).
- **Arm 1 (all five):** key = the detected key Study 34 recorded for
  that slot, verbatim (deterministic reproduction of what detection
  says; a visitor can tap a tempo, few can name a key).
- **Arm 2 (the three slots whose detected key was wrong —
  st-louis-blues (B♭ major vs D), roll-called-up-yonder (C minor vs
  Ab), three-oclock-waltz (A minor vs C)):** the truth key declared
  ("D", "Ab", "C", page-style spellings). Prices a wrong key under a
  right grid.

Eight drafts total. The runner persists rawDraft, barCountChanged and
unknownShare (the ba88e9c fields) and reports the last two per draft.

**Registered Tier 2 class reconciliation (pre-data).** Both Tier 2
recordings demonstrably perform MORE of the piece than the publication
(the committed instrument above: hymn 4.75 verse cycles; waltz 149 =
118 + a repeated strain), so Study 34's bar-count clause — grid bars
vs published bars — would class a CORRECT declared grid confidently
wrong by artifact. For Tier 2 slots in this study the clause is
replaced: the structural failure condition is the grid abandoning the
declared prior (grid tempo off the declared by more than 4 %); roots
grade cyclically for the hymn (answer bar j against truth bar j mod
16 — the verses repeat the 16-bar setting; a partial final cycle may
mis-phase its last bars, which lands on the measurement and is
disclosed) and index-aligned over min(n, 118) for the waltz exactly as
Study 34 ran it (the repeated strain degrades the tail; same
disclosure). Tier 1 slots keep Study 34's class rule unchanged
(barsAligned is whole-recording truth). "Confidently wrong" otherwise
as registered in Study 34: saved roots < 80 %.

### Gates (the app's, verbatim; never re-thresholded)

- **S34b-G1:** with tempo and meter declared (arm 1), none of the five
  is confidently wrong. Good, saved-below-threshold and refused all
  pass.
- **S34b-G2:** at least three of the five arm-1 slots reach roots of
  80 % or more.
- **S34b-G3 (reported, not gated):** per arm-2 slot, the change in
  roots and qualities from declaring the key.

If a declared grid still cannot hold a drifting 78, the report says at
which stage it failed (comb, vote, fit) and whether the pipeline
refused or saved.

## Part C: pickups (no model spend)

Under the DECLARED grid (page values for the five Badverbs recordings;
the Part B declared values for the five wrong slots), report per
recording: how many beats before bar one's placed downbeat the first
audible sound falls ((anchor − span.first) / beat), and the truth's
own pickup where time truth exists ((truth bar one − span.first) /
beat; truth bar one = JAAH barsAligned[0].start, eat −0.085 s,
interbellum 0, letter/mop/peaceful 0 per the Study 31d family truth,
its ~0.07 s early ruler bias disclosed). The two MIDI slots report the
measurement plus the engraving's answer (neither engraving carries a
pickup; both open on a downbeat). No gate; the readout notes which
rows a half-bar bound (PICKUP_MAX_BAR_FRACTION 0.5) would class as
pickups.

## Spend

Parts A and C: $0. Part B: eight drafts at Study 34's ~$0.06 each ≈
$0.50; fence **$2.00** (the app's requested fence), hard stop before
the next draft once spent exceeds it, per-draft cost declared in the
report.

## Disclosures

- Gateway ignores temperature on fable-5-1; single-sample drafts carry
  sampling noise (standing since Study 32).
- nchord stands in for production ChordMini (since Study 10).
- Fable measures claude-fable-5-1; tolerable because every grader is
  mechanical and registered here.
- The Part A detector port is v0.200.0; the shipped app has moved past
  it (v0.25x). The alternates/confidence SHAPE is what the app asked
  about; absolute values may differ from today's production build.
- The hymn's cyclic grading assumes the recording opens at a verse
  start (the span does); the waltz's index grading degrades after the
  repeated strain's insertion point. Both land on the measurement.
