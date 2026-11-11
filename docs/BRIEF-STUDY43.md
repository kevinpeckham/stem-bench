# Study 43: the draft format on fast-moving harmony (two cells a bar)

Registered 2026-11-11 before any scored run. Kevin approved the spend on
2026-11-11 ("approved", to a proposal of about forty drafts at about $3).

## Question

The two failures left on the automatic chart look like one failure. The
three confidently-wrong guitar drafts of Study 38 were all on one dense
sheet (SS2-107-Ab: 14 chords in 16 bars), and the Winterreise songs
average about one and a half chord changes a bar, where every draft was
confidently-wrong (roots median 41 %). The draft format writes one
chord per cell and the pipeline hands it one cell per bar, so a bar with
two chords can only ever score one of them, whatever the tracker and the
model do. Does giving the pipeline two cells a bar, with nothing else
changed, lift the sequence score on this material, and by how much?

The two-cells-a-bar grid is the mechanism of Study 37 Part D (the
half-bar convention) and of Study 41's half-bar observation (the tracker
read two songs at half bars and the drafts cost nothing for it). It
needs no prompt or schema change: the draft's "bars" are the cells, and
the typed tempo is scaled so the declared bar equals the median cell.

## Corpus (corpus/study43-manifest.json, from Study 38's)

- **guitar, 12 items:** GuitarSet SS2-107-Ab and SS2-88-F, comping
  takes, six players each (36 and 44 s; 16 annotated bars, 14 chords in
  the sheet). SS2-107-Ab is the dense sheet that produced all three
  confidently-wrong guitar drafts in Study 38; SS2-88-F is its control
  (same players, same length, scored good or saved in Study 38).
- **winterreise, 8 items:** the eight shortest SC06 performances (44 to
  120 s): D911 nos. 18, 19, 22, 02, 16, 08, 15, 13. Study 38's madmom-bar
  drafts on these eight scored roots 0.18 to 0.44, median 0.25.

Audio as in Study 38 (22050 Hz mono raw, gitignored). Truth as in Study
38: the sheet's chord sequence (guitar, transposition 0) and the
annotation's timed chord sequence (Winterreise, transposition-invariant
interval grading where the key gate failed).

## Tracker ($0, scripts/trackers-study43.py)

Beat This small0 (the tracker the app ships, Studies 41 and 42), the
package at `dbn=False`, over the twelve guitar excerpts; the eight
Winterreise readings are copied from results/study39-trackers.json (same
audio, same package). Readings committed in results/study43-trackers.json
before any draft. Bars are the tracker's downbeats as read; no
correction. (One take, 01_SS2-88-F, is read at 41 downbeats in 44 s
where its five fellows read 16 or 17: it stays in, as read.)

## Instrument (scripts/run-study43.ts, from run-study41.ts)

Study 41's pipeline verbatim from the bar lines on: Basic Pitch notes,
ChordMini per-cell hints, system23 + question23, temperature 0 (the
gateway ignores it on this model, Study 41), adaptive thinking at low
effort, sequence grading (LCS over collapsed roots and over quality
families), the Study 35 class rule (roots < 80 % confidently-wrong;
roots ≥ 90 % and qualities ≥ 80 % good; else saved-below-threshold).

Each item is drafted twice:

- **bar:** cells are the tracker's downbeats; typed tempo its median
  beat; meter from its beats per bar (3 → 3/4, else 4/4).
- **half:** each tracker bar split at the tracker beat nearest its
  midpoint (the midpoint itself when no beat lies inside); typed tempo
  scaled so beats-per-bar × 60 / bpm equals the median cell; meter as
  above.

Order: guitar items shortest first, then Winterreise shortest first;
within an item bar then half, so a fence stop leaves whole items.
Per cell the result records roots, qualities, class, cell count, the
tracker's own bar count and tempo, cells per tracker bar, input and
output tokens, and the raw draft. The secondary per-bar truth (the
chord sounding at each annotated bar start) is reported for the guitar
items, not scored.

Fence: **$3.00**, hard stop before the next draft, 40 drafts planned.

## Predictions

- P1: on the dense sheet (SS2-107-Ab, six players) the half grid scores
  good on at least 4 of 6.
- P2: on the twelve guitar items the half grid lifts roots over the bar
  grid on at least 8.
- P3: on the eight Winterreise songs the half grid's roots median is at
  least 0.45 (Study 38's bar-grid median on these eight was 0.25) and no
  song reaches good.
- P4: the half grid lowers roots against the bar grid on no more than 2
  of the 20 items (a finer grid costs nothing on harmony that does not
  move, Study 41).

## Decision rule

S43-D1. If the half grid lifts roots on at least 60 % of the 20 items
(12) and lowers no more than 2, the bench recommends the app draft the
automatic chart on two cells a bar (the tracker's bar split at its
middle beat) and write the chart with two chords a bar where they
differ. If the half grid lowers more items than it lifts, the bench
recommends the bar grid stand. Anything between: no grid change
recommended; the bench reports where each grid wins.

P3 decides the free-tempo question separately: if the Winterreise median
stays under 0.45 on the half grid, the format was not the ceiling on the
lieder and the next study on that material is about the audio and the
truth, not the chart.

## Disclosures

- The grader, prompt and class rule are Study 41's unchanged; only the
  cell boundaries and the typed tempo differ between arms.
- A "beat" grid (every tracker beat a cell) is implemented in the runner
  and not registered for this study; it is not run.
- The LCS sequence grader rewards a finer grid only through chords it
  recovers: repeated chords collapse before alignment, so two cells
  that carry the same chord score as one.
- The tracker readings are the package's; Study 42's export reproduces
  them exactly, so the app's port, once verified, draws the same bars.
- Spend is reported as spent; the fence is a hard stop, not a budget to
  reach.
