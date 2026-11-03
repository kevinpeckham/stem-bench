# Study 16b (micro) — the shipped two-clause samePiece, validated

Registered 2026-11-03, before any scored run. Zero spend; every grader
is committed mechanical code. The Study 6b micro pattern: validating a
change stem-shovel shipped in answer to a bench verdict, on the bench's
existing corpus.

## What shipped

Study 16's urgent ask (FINDINGS 7b27ed7c): AND the local-cost clause
into production `samePiece`, because a real catalog wrong pair — the
Eat All the Clocks recording against the Mop Heart chart — clears the
1.6 ratio gate at 1.74 and is told apart only by its median local cost
of 0.323. stem-shovel shipped it at **2d585b75** (2026-11-02, citing
the escapee by name): `samePiece = ratio >= ALIGNMENT_SAME_PIECE_RATIO
&& localMedian <= ALIGNMENT_SAME_PIECE_LOCAL_COST`, with the new
constant at **0.3** — exactly the bench-recommended number. The
alignment core is unchanged since bc683871, and `alignedPlacements` is
unchanged from the pin through dev HEAD.

## Pins and ports

- src/study16b/alignedPlacements.ts — VERBATIM at 2d585b75 (verified
  by diff below the imports at registration); src/study16b/constants.ts
  carries both constants. Pinned by tests/study16b.test.ts (constants
  exact; the escapee shape rejected; the 0.30 boundary inclusive).
- Everything else reused as registered for Study 16: the study15
  alignment ports (unchanged at the pin), the study16 adapter +
  barmark 0.5.0, the migrated-chart corpus (corpus/badverbs-charts),
  the real recordings, and results/study16.json as the baseline.

## The run (scripts/run-study16b.ts)

Re-run Study 16's arm C pairings through the SHIPPED
`alignedPlacements`: the four right pairs (three gated + mop-heart),
the six registered wrong cross-pairs, and the five alignable
exploratory mop-heart cross-pairs including the escapee (the
mop-recording × peaceful-chart pair stays refused by production's
too-long check, recorded as in Study 16 Amendment 1).

## Gates

- **16b-G1 (the ship matches the recommendation):** constants exactly
  1.6 and 0.3, clause AND-ed — pinned by test before the run.
- **16b-G2 (right pairs unharmed):** all four right pairs report
  `samePiece` true through the shipped code.
- **16b-G3 (the escapee class is closed):** every wrong pair — the six
  registered AND the exploratory set including eat⊗mop-heart at ratio
  1.74 — reports `samePiece` false through the shipped code.
- **16b-G4 (nothing else moved):** the clause touches only samePiece
  and, through it, hedging; for every right pair the section placements
  equal Study 16's committed results within 0.01 s, and no right-pair
  placement gains a hedge it did not have in Study 16.

## Predictions

- P1: 15/15 pair verdicts correct (4 right true, 11 wrong false).
- P2: placements byte-identical to Study 16 (same alignment inputs,
  same barStarts; the clause cannot move them).

## Spend

$0. No model runs.
