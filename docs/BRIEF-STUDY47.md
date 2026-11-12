# Study 47: telling the model what the hint is worth

Registered 2026-11-12 before any scored run. Fence $1.50 (hard stop before
the next draft); estimate $0.75 for 22 drafts. Kevin approved on
2026-11-12 ("proceed with the paired study"), on the bench's estimate of
roughly $1.50 in its Study 46 report.

## Question

Study 46 measured the ChordMini hint the drafts receive: its root is
right on 95 % of strummed rock-shaped bars and 66 % of jazz-shaped
comping; its quality family is right for major (77 %) and minor (63 %),
wrong for dominant sevenths more often than right (41 %), and almost
never right for a diminished or half-diminished chord (2 %). The prompt
tells the model the hint is "a hint, not an answer", one thing. Does
telling it the two things Study 46 found, root reliable and quality
advisory with the three failure modes named, recover the qualities that
Study 45's quality clause (now the app's v0.262.1) still lost, without
moving the roots or the modern songs?

## Design

Study 45's pipeline verbatim (Beat This small0's bars as read, Basic
Pitch notes, ChordMini per-bar hints, question23, sequence grading,
Study 35 class rule, temperature 0 requested and ignored by the gateway
for this model, adaptive thinking at low effort), with one further
prompt deviation: system47 (src/study47/prompt47.ts) replaces
production's hint sentence

> A simple template matcher's guess follows each bar in brackets — a
> hint, not an answer.

with

> A chord reader's guess follows each bar in brackets. Its root is
> reliable: keep it unless the notes plainly contradict it. Its quality
> is advisory: it hears major and minor well, hears a seventh as a plain
> triad more often than not, and almost never hears a diminished or
> half-diminished chord, so decide the quality from the notes and the
> key.

and nothing else (pinned by tests/study47.test.ts against system45). The
per-bar bracket label stays "[matcher: …]" as in every study since 23.

**Items (22 drafts, one grid, the tracker's bar):** the twelve GuitarSet
SS2 comp takes of Study 43 (six on each sheet) and the ten Woodward songs
of Study 38 Arm A, in Study 45's order (guitar shortest first, then
Woodward shortest first).

**Baseline ($0):** Study 45's quality-clause drafts of the same 22 items
on the same bars with the same hints (results/study45.json, `|quality`
cells; all 22 answered). The pair isolates the hint sentence.

## Predictions

- P1: guitar, 12 paired: qualities up on at least 5 takes and down on at
  most 2.
- P2: guitar: drafts that spell the half-diminished bar as m7b5 or dim at
  least 10 of 12 (Study 45's quality drafts: 7 of 12).
- P3: guitar: roots down on at most 1 of 12 (the sentence says keep the
  root).
- P4: Woodward, 10 paired: class lowered on none; roots down on at most
  1.
- P5: guitar: drafts carrying a power chord at most 5 (no more than Study
  45's quality drafts).

## Decision rule

S47-D1. If P1, P3 and P4 hold, the bench recommends the advisory
sentence's content to the app, to be carried into its own hint sentence
(see disclosures). If guitar qualities go down on more takes than up, or
any Woodward draft's class drops, the bench recommends against. Anything
between is reported without a recommendation.

## Disclosures

- **The app's prompt has moved past the bench's port.** Since Study 41
  the app hands the model a starting chart in barmark built from the
  chord model on the tracker's bars, with a sentence that already says
  the model "names about three bars in four right", "hears roots and
  plain qualities (major, minor, 7ths, dim, sus) only" and "keep its
  roots unless the notes plainly contradict them". The bench's port is
  the Study 1 structure (bracketed per-bar hints) and does not chase the
  app mid-study (CLAUDE.md). This study measures the sentence's content:
  that the hint's quality is advisory and fails in three named ways.
  Study 46 showed the app's current sentence overstates the hint on
  sevenths and diminished chords; what the app would change is that
  clause of its own sentence, not adopt the bench's bracket shape.
- The baseline drafts were made on 2026-11-11 and the variant's on
  2026-11-12; the gateway ignores temperature for this model, so
  draft-to-draft variance is unmeasured in both studies and a difference
  on one take is not evidence. The predictions are counts over takes.
- The analyst model and the measured model are the same family; every
  grade is mechanical (Study 34's grader, committed).
- Study 45's power-chord regex and hdim regex (m7b5, ø, dim on the
  chords string) are reused for P2 and P5.
- The 36 GuitarSet comp excerpts' hints were also scored in Study 46;
  the hint on these 12 is not recomputed differently, only its sentence.

## Results (2026-11-12, registration 12f1553; $1.46 of the $1.50 fence; 22 drafts, none refused)

### Paired against Study 45's quality-clause drafts, same bars, same hints

| take | quality clause (v0.262.1) | advisory sentence |
|---|---|---|
| 00_SS2-107-Ab | 14/14, q 10/11, good | 14/14, q 10/11, good |
| 01_SS2-107-Ab | 14/14, q 6/11, saved | 14/14, q 7/11, saved |
| 02_SS2-107-Ab | 14/14, q 3/11, saved, power chords | 14/14, q 3/11, saved, power chords |
| 03_SS2-107-Ab | 12/14, q 8/11, saved, one power chord | 12/14, q 8/11, saved, none |
| 04_SS2-107-Ab | 14/14, q 10/11, good | 14/14, q 10/11, good |
| 05_SS2-107-Ab | 14/14, q 7/11, saved | 14/14, q 7/11, saved |
| 00_SS2-88-F | 14/14, q 11/11, good | 14/14, q 11/11, good |
| 01_SS2-88-F | 14/14, q 5/11, saved, power chords | 14/14, q 5/11, saved, power chords |
| 02_SS2-88-F | 12/14, q 3/11, saved, power chords | 12/14, q 3/11, saved, power chords |
| 03_SS2-88-F | 14/14, q 8/11, saved | 14/14, q 9/11, **good** |
| 04_SS2-88-F | 14/14, q 11/11, good | 14/14, q 10/11, good |
| 05_SS2-88-F | 14/14, q 9/11, good | 14/14, q 9/11, good |

Guitar, 12 paired: qualities up on 2, down on 1; roots down on none;
good 5 → 6; power-chord drafts 5 → 4; half-diminished spelled 7 → 7 (the
same seven). Woodward, 10 paired: qualities up on none, down on 1
(california-lullabye 31 → 30 of 35), roots down on 1 (same-boat 16 → 15
of 18) and up on 1 (california-lullabye 48 → 50 of 53); good 8 → 8; no
class lowered.

### Predictions

P1 (qualities up on ≥ 5, down on ≤ 2): **wrong**, up on 2. P2
(half-diminished in ≥ 10 of 12): **wrong**, 7, the same seven drafts as
before. P3 (roots down on ≤ 1): right, none. P4 (Woodward unharmed):
right. P5 (power chords ≤ 5): right, 4.

### Decision (S47-D1)

**Between: reported without a recommendation.** The sentence that tells
the model what the hint is worth changes almost nothing: 19 of 22 drafts
keep the same root and quality counts, and the three that move do so by
one position each way. The bench's reading, labelled: the quality the
drafts lose on this sheet is not lost by deferring to the hint. Study
45's attribution counted 14 positions where the draft followed a wrong
hint, but told in so many words that the hint cannot hear a
half-diminished, the model still writes the same seven of twelve, which
says the half-diminished it did not write is not in the transcribed notes
it was given either. The remaining gap on this material is the evidence
(Basic Pitch's notes on a strummed chord), not the prompt; the two
prompt studies have now moved what a prompt can move.

### Disclosures

- Spend $1.459 (324,093 in, 54,064 out) against $1.50: the fence held
  with four cents to spare. The estimate of $0.75 was half the cost; the
  Woodward songs' long prompts were under-counted. A twelfth guitar take
  more would have stopped the run; none was needed.
- The app's prompt structure differs from the port's (a barmark starting
  chart, a model-source sentence); this result is about the content of
  the sentence, and says that content does not move the drafts in the
  port's structure. It does not say the app's current sentence is wrong
  about sevenths and diminished chords; Study 46 says that.
- Draft-to-draft variance is unmeasured (the gateway ignores
  temperature); a one-position move on three drafts is within what a
  rerun might show either way.
