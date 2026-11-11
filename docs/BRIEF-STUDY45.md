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
