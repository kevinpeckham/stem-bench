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
