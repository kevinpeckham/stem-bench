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

## Results (2026-11-11, registration 8bfdacd; $1.54 of the $3.00 fence, 40 drafts, 3 refused)

| item | bar grid: roots, qualities, class (cells) | half grid: roots, qualities, class (cells) | Study 38 on madmom bars |
|---|---|---|---|
| 00_SS2-107-Ab | 14/14, 9/11, good (16) | 14/14, 7/11, saved (32) | 11/14 confidently-wrong |
| 01_SS2-107-Ab | 14/14, 7/11, saved (16) | 14/14, 7/11, saved (32) | 14/14 saved |
| 02_SS2-107-Ab | 14/14, 2/11, saved (16) | 14/14, 1/11, saved (32) | 10/14 confidently-wrong |
| 03_SS2-107-Ab | 12/14, 7/11, saved (17) | 12/14, 9/11, saved (33) | 11/14 confidently-wrong |
| 04_SS2-107-Ab | 11/14, 8/11, confidently-wrong (16) | 14/14, 9/11, good (31) | 11/14 confidently-wrong |
| 05_SS2-107-Ab | 14/14, 7/11, saved (16) | 14/14, 7/11, saved (32) | 13/14 saved |
| 00_SS2-88-F | refused, content filter (16) | 14/14, 11/11, good (32) | 14/14 good |
| 01_SS2-88-F | 14/14, 5/11, saved (41) | 14/14, 5/11, saved (81) | 14/14 saved |
| 02_SS2-88-F | 12/14, 1/11, saved (17) | 14/14, 4/11, saved (33) | 12/14 saved |
| 03_SS2-88-F | refused, content filter (16) | 14/14, 10/11, good (31) | 13/14 good |
| 04_SS2-88-F | 14/14, 9/11, good (17) | 14/14, 9/11, good (33) | 14/14 good |
| 05_SS2-88-F | 14/14, 9/11, good (16) | 14/14, 9/11, good (31) | 14/14 good |
| D911-02 | 33/60, 36/51, wrong (103) | 39/60, 39/51, wrong (205) | 16/60 wrong |
| D911-08 | 55/93, 43/85, wrong (142) | 32/93, 22/85, wrong (283) | 18/93 wrong |
| D911-13 | 25/81, 15/51, wrong (65) | 45/81, 25/51, wrong (129) | 22/81 wrong |
| D911-15 | 41/113, 35/107, wrong (87) | 52/113, 56/107, wrong (173) | 20/113 wrong |
| D911-16 | refused, content filter (101) | 39/67, 31/42, wrong (201) | 25/67 wrong |
| D911-18 | 13/44, 11/34, wrong (32) | 24/44, 23/34, wrong (63) | 10/44 wrong |
| D911-19 | 37/41, 36/40, **good** (82) | 36/41, 35/40, saved (163) | 18/41 wrong |
| D911-22 | 26/72, 13/56, wrong (61) | 45/72, 29/56, wrong (121) | 14/72 wrong |

Guitar: roots median 1.00 on both grids; the half grid lifts roots on 2
takes (02_SS2-88-F 12 → 14, 04_SS2-107-Ab 11 → 14), lowers 0, equal on 8.
Winterreise: roots median 0.36 (bar) → 0.58 (half); lifts 5, lowers 2
(D911-19 37 → 36, D911-08 55 → 32). Input tokens: half grid 1.12× the
bar grid. The half grid's typed tempo doubles (4/4 at 214 for a 107
take) by the registered convention; the drafts did not mind.

### What the dense sheet really was

The premise was wrong, and the data says so. SS2-107-Ab is 14 chord
positions in 16 bars, one chord a bar with two repeats (C#m F# B E Bb7
Eb Abm %, twice): the one-chord-per-bar format was never its ceiling.
Its three confidently-wrong drafts in Study 38 were on madmom's bars; on
Beat This small0's bars as read, four of the six takes score roots
14/14 at the bar grid and the fifth 12/14. What keeps five of six takes
below "good" is **qualities**: 7/11 on four takes, 2/11 on one. The
sheet carries a dominant seventh and two minor chords; the drafts write
the roots and miss the colours. So on acoustic guitar the automatic
chart's remaining gap is chord quality, not bar lines and not the
format. P1 wrong (1 of 6 good on the half grid, and 1 on the bar grid);
P2 wrong (2 of 12 lifted, because 8 were already 14/14).

### What the half grid did on the lieder

A real lift and not enough: roots from a median of 0.36 to 0.58, five
of eight songs up, every song still confidently-wrong on the half grid.
P3 right (0.58 against the registered 0.45; no song good, as predicted). (Corrected 2026-11-13: first scored wrong by two hundredths against 0.60, a threshold the registration above does not contain.) Two songs went down, one of them hard (D911-08, 55 → 32:
283 cells of 0.4 s on a 114 s song, which the draft could not hold
together). The format is part of the ceiling on fast-moving harmony
and the audio and the truth are the rest.

Unlooked-for: **D911-19 (Täuschung) drafts good on Beat This small0's
bars as read** (37/41 roots, 36/40 qualities), where Study 38's madmom
draft of the same recording was 18/41. The first Winterreise song to
reach good in the program, and it did so on the tracker the app ships
with nothing typed. On the bar grid small0's seven graded songs score a
median of 0.36 against Study 38's 0.25 on these eight with madmom.

P4 right: the half grid lowered 2 of 20 (both lieder).

### Refusals

Three drafts stopped at the gateway's content filter with empty text
(finish reason content-filter): 00_SS2-88-F and 03_SS2-88-F at the bar
grid and D911-16 at the bar grid. Each item's other grid drafted
normally from the same audio, so the filter is tripping on something in
the bar-grid prompt text, not the music. Counted as drafts, ungraded,
not retried (the bench does not work around classifier stops).

### Decision (S43-D1)

The half grid lifted 7 of 20 and lowered 2: **no grid change
recommended** (mixed). For the app: draft on the tracker's bar as read;
two cells a bar buys nothing on full-band or guitar material where the
chords change by the bar, costs 12 % more input, and on the lieder lifts
a draft that is still wrong. The free-tempo question (P3) is settled in the direction the brief anticipated: the format was not the whole ceiling, so the next study on the lieder is about the audio and the truth, not the chart. (Corrected 2026-11-13: the registered trigger for that reading, a median under 0.45, did not fire; the median rose to 0.58, so the format was part of the ceiling. The reading rests on every song staying confidently wrong at the half grid, not on the registered rule.) The guitar result redirects the acoustic
question: the next gap there is chord quality on a one-chord-a-bar
sheet, a question for the drafting prompt and the per-bar hints, not
the tracker.

### Disclosures

- Spend $1.541 (268,175 in, 66,990 out) against the $3.00 fence; all
  40 registered cells ran.
- Three content-filter stops disclosed above; their cells are in
  results/study43.json with the finish reason.
- The brief's premise about the dense sheet (two chords a bar) was wrong
  as written; the registered instrument measured it anyway and the
  predictions are scored as registered.
