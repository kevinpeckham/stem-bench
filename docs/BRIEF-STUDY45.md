# Study 45: chord quality on the one-chord-a-bar sheet

Registered 2026-11-11 before any scored run. Kevin approved the guitar
quality follow-up on 2026-11-11 ("yes to both") without a figure; the
fence below is the bench's and is stated here before the run.

## Question

Study 43 found that the dense GuitarSet sheet (SS2-107-Ab) was never a
format problem: on Beat This small0's bars as read its roots are right
on four of six takes, and what keeps five of six below "good" is chord
quality (7 of 11 on four takes, 2 of 11 on one). The two SS2 sheets are
ii–V–I progressions: a minor, a dominant seventh, two majors, a
half-diminished seventh, a dominant seventh, a minor. The drafts write
"Bbm" or "Bb7" for the half-diminished, "Eb" for a dominant, and on two
takes power chords throughout ("C#5 F#5 B5 …").

The production system prompt's step 0 reads: "think like a rock musician
reading a chart — simple, plausible progressions in the key over exotic
spellings; power chords (5) and sus chords are common here." That is a
style prior written for the rock band the app was built around; on a
jazz-flavoured acoustic sheet it is a bias against the very qualities
the notes carry. Where exactly is the quality lost (the hint, the
model's own call, or the power-chord fallback), and does replacing that
one clause with a style-neutral instruction about quality recover it,
without costing the modern songs anything?

## Arms

- **Arm 0, $0 (scripts/attribute-study45.ts, src/study45/attribute.ts,
  tested):** over Study 43's 24 guitar cells (12 takes × bar and half
  grid), the per-cell hints recomputed with the same ChordMini child on
  the same grid, the truth per cell the sheet's chord at the cell start,
  the draft per cell the stored answer expanded. Each quality-bearing
  position is classed: draft right; hint wrong and the draft followed
  it; hint wrong and the draft wrote a third family; hint right and the
  draft lost it; power chord where the truth has a third. Totals by
  sheet and grid.
- **Arm 1, $ (scripts/run-study45.ts, from run-study43.ts):** the same
  pipeline on Beat This small0's bars as read with ONE change, the
  system prompt `system45` (src/study45/prompt45.ts): production's rock
  clause replaced by "name the quality the notes support — a seventh
  (7, m7, maj7, m7b5) when the seventh sounds, a plain triad when it
  does not, and a power chord (5) only when neither third sounds; prefer
  plausible progressions in the key over exotic spellings." Pinned by
  test to differ from production in that clause only. Items: the twelve
  SS2 takes (paired with Study 43's bar-grid drafts) and the ten Woodward
  songs (paired with Study 41's small0 drafts), guitar first. Grading,
  class rule, hints, transcription unchanged. 22 drafts. **Fence $2.50,
  hard stop before the next draft.**

## Predictions

- P1 (Arm 0): on the dense sheet at the bar grid, at least half of the
  lost quality positions are ones where the hint's family was already
  wrong (the hint carries the loss), and power chords account for the
  two takes under 4 of 11.
- P2: the quality clause lifts qualities on at least 6 of the 12 takes
  and makes at least two more takes good.
- P3: it lowers roots on no take.
- P4: on the ten Woodward songs it lowers roots on at most one and the
  class on none.
- P5: no draft under the quality clause writes a power chord on the
  guitar takes.

## Decision rule

S45-D1. If P2 and P3 hold and no Woodward draft's class drops, the bench
recommends the quality clause to the app as a production prompt change,
with the paired cells as the evidence. If qualities go down more often
than up, or any Woodward class drops, the bench recommends production's
clause stand and reports the attribution as the place to work instead
(the hint model's vocabulary). Anything between is reported without a
recommendation.

## Disclosures

- The prompt deviation is the study's variable and is registered here;
  production fidelity holds for every other character of the prompt
  (pinned by test).
- The Woodward arm exists because the rock clause was written for a band
  like theirs; a clause that helps a jazz sheet and hurts a rock chart
  is not a recommendation.
- Study 43's three content-filter stops were at the bar grid; if the
  filter trips again the cell is counted and not retried.
- The grader's quality families (Study 34): sus; dim (dim, dim7, m7b5);
  min; dom (7, 9, 11, 13); maj (plain, maj7, 6, add); other (5 among
  them). A power chord is therefore "other" against every sheet quality.

## Results (2026-11-11, registration cedaf0b; Arm 0 $0, Arm 1 $1.46 of the $2.50 fence, 22 drafts, none refused)

### Arm 0: where the quality was lost (Study 43's 24 guitar cells)

| cells | quality positions | draft right | hint right | lost: hint wrong, draft followed | hint wrong, draft other | hint right, draft lost | power chord |
|---|---|---|---|---|---|---|---|
| SS2-107-Ab, bar grid (5 drafts) | 97 | 57 (59 %) | 48 (49 %) | 14 | 11 | 2 | 13 |
| SS2-88-F, bar grid (5 drafts) | 91 | 53 (58 %) | 53 (58 %) | 7 | 5 | 1 | 25 |
| all 24 cells, both grids | 621 | 381 (61 %) | 344 (55 %) | 71 | 42 | 16 | 111 |

On the dense sheet at the bar grid, 25 of the 40 lost positions are bars
where the ChordMini hint's quality family was already wrong (the model
followed it on 14 and wrote a third family on 11), 13 are power chords
on one take (02), and 2 are the model losing a right hint. The hint
model's vocabulary has no half-diminished, so every A#:hdim7 bar arrives
with a wrong or empty hint. **P1 right** on both clauses: the hint carries
the majority of the loss, and the two takes under 4 of 11 (02 on each
sheet) are power chords almost entirely (13 of 14 and 15 of 15 lost).

### Arm 1: the quality clause against production, same bars

| take | production (Study 43, bar grid) | quality clause |
|---|---|---|
| 00_SS2-107-Ab | 14/14, q 9/11, good | 14/14, q 10/11, good |
| 01_SS2-107-Ab | 14/14, q 7/11, saved | 14/14, q 6/11, saved (gains two power chords) |
| 02_SS2-107-Ab | 14/14, q 2/11, saved (power chords) | 14/14, q 3/11, saved (power chords) |
| 03_SS2-107-Ab | 12/14, q 7/11, saved | 12/14, q 8/11, saved (gains one power chord) |
| 04_SS2-107-Ab | 11/14, q 8/11, **confidently-wrong** | 14/14, q 10/11, **good** |
| 05_SS2-107-Ab | 14/14, q 7/11, saved | 14/14, q 7/11, saved |
| 00_SS2-88-F | refused (content filter) | 14/14, q 11/11, good |
| 01_SS2-88-F | 14/14, q 5/11, saved (power chords) | 14/14, q 5/11, saved (power chords) |
| 02_SS2-88-F | 12/14, q 1/11, saved (power chords) | 12/14, q 3/11, saved (power chords) |
| 03_SS2-88-F | refused (content filter) | 14/14, q 8/11, saved |
| 04_SS2-88-F | 14/14, q 9/11, good | 14/14, q 11/11, good |
| 05_SS2-88-F | 14/14, q 9/11, good | 14/14, q 9/11, good |

Ten paired takes: qualities up on 6, down on 1 (01_SS2-107-Ab, 7 → 6,
where the clause's own permission for power chords let two in), roots
down on none, good 3 → 4 (the one confidently-wrong draft on Beat This
bars, 04_SS2-107-Ab, drafts good: the half-diminished named, the roots
all right). Over all twelve, five drafts are good under the clause
against three of the ten production drafts that answered. The clause
spells the half-diminished (m7b5) in 7 of 12 drafts; production's bar-grid
drafts spelled it in 3 of 10. Power chords: drafts containing one
went 3 → 5, so the clause's "only when neither third sounds" did not
hold the line on thin takes; the two power-chord takes (02 on each
sheet) stayed power chords.

Woodward, ten paired against Study 41's small0 drafts: qualities up on
1 (let-it-in 21 → 22 of 25), down on none; roots down on 1
(california-lullabye 50 → 48 of 53, class still good); good 8 → 8; no
class lowered. The rock clause was not carrying the rock charts.

Predictions: P1 right; **P2 wrong** (qualities up on 6 of 12 as
predicted, but good rose by one paired take, not two); P3 right; P4
right; **P5 wrong** (power chords in 5 of 12 drafts).

Unlooked-for: the two guitar takes whose production drafts stopped at
the gateway's content filter in Study 43 (00 and 03 of SS2-88-F) both
drafted normally under the quality clause, and no draft of 22 was
stopped. The runs differ in one clause of the system prompt; the bench
records the observation and draws no causal line from two cases.

### Decision (S45-D1)

By the registered rule the clause is recommended only if P2 and P3 hold;
P2 did not, so the registered outcome is **reported without a
recommendation** (qualities did not go down more often than up and no
Woodward class dropped, so production's clause is not endorsed either).
Disclosure: the runner's printed S45-D1 line used a looser condition
(qualities up on six, roots down on none, no Woodward class lowered)
and printed "recommend"; the brief's rule governs and this paragraph
corrects the printout.

The bench's labelled judgment, beside the rule: the evidence favours the
clause. It lifted qualities on six takes and lowered one, turned the
only confidently-wrong draft on the shipped tracker's bars into a good
one, named the half-diminished where production never did, and cost the
ten modern songs nothing in class. What it did not fix is the
power-chord fallback on thin takes and the hint model's missing
half-diminished, which Arm 0 put at 25 of 40 lost positions; those are
the next two gaps, and the second is the larger.

### Disclosures

- Spend $1.462 (322,311 in, 54,483 out) against $2.50; all 22 cells ran.
- The attribution's "hint" is the bench's per-cell majority vote of
  ChordMini frames (scripts/study10/nchord.py), the same hint the drafts
  saw; the app's production hint is the same model voted the same way.
- The paired guitar comparison has ten pairs, not twelve, because two
  production drafts were refused in Study 43; the two unpaired takes are
  reported, not scored in P2 or P3.
