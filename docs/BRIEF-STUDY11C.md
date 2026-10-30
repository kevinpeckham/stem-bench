# BRIEF — stem-bench Study 11c: the declared-meter gate, and the mirror that retires a rule

**REGISTERED.** The three validations requested in
docs/RESPONSE-2026-10-30-study-11b.md, against the patch at stem-shovel
**2cf70cb** (verbatim port, src/study11c/ladder2cf.ts, pinned by test:
tempoLadderMatch with declared-meter gates, isCompoundMeter,
isTripleMeter, the ×3 rung). Zero model spend; arm 1 and arm 3 are
pure functions over Study 11b's stored reads, arm 2 renders three new
items.

## The question

Study 11b's fix 1 had two candidate rules. The bench proposed
evaluating the subdivision test at the DECLARED tempo's lag; the
stem-shovel side rejected that with a constructed mirror — a straight
song wrongly declared at ⅔ of its true tempo puts the declared lag's
third exactly on the eighth grid, so the acoustic test reads compound
and excuses the wrong value — and shipped the declared-meter gate
instead (3:2 rungs open only for declared compound meters, ×3 only
for declared triple meters; no detector term). The mirror was argued,
not measured. This study measures it, plus the patched gate's
regression surface and the new rung's exposure.

## Arms and gates

- **Arm 1 — the declared-meter gate over the 11b corpus** (stored
  detections, declared meters from the fixtures and the MMKK rows).
  **C1**: 0 of the 332 corrected wrong rows accepted; no true-count
  match the shipped rule found is lost (lilt-a and verb-y keep ⅔ via
  declared 6/8, lilt-b and contrast-c keep their direct matches,
  mop-heart GAINS ×3 via declared 3/4); peaceful-dreams stays
  unmatched — the warning stays loud, now by data instead of by luck.
- **Arm 2 — the mirror fixture** (corpus/mixes11c.json, seeds
  11100+i): straight 4/4 with running eighths (the Study 10 renderer
  at swing 0.5) at 96, 120 and 138 bpm, each paired with a genuinely
  wrong declared tempo at exactly ⅔ (64, 80, 92). Both rules score
  the same pairs through the same shipped matcher, differing only in
  what licenses the 3:2 rungs: the bench's declared-lag subdivision
  test (Study 11 Amendments 1–2, in full: BEAT_FLOOR and SUB3_FLOOR
  included) versus the declared meter. **C2**: the declared-meter
  gate accepts 0 of 3. The declared-lag rule's accepts are the
  REPORTED measure — if it accepts any, the bench's proposed rule is
  retired on the record, by the measurement its proposer registered.
- **Arm 3 — the ×3 rung's exposure**: on every item whose detection
  is exact, wrong declared values at exactly 3× the detection and at
  3× ± 4 bpm (outside the shipped 3-bpm tolerance). **C3**: 0 accepts
  on items not declared triple; 0 off-tolerance accepts anywhere; the
  exact-3× accepts on triple-declared items are REPORTED, not gated —
  they are the ×2-class count ambiguity the rung-picker UI exists to
  absorb, now quantified.

## Predictions (the bench's)

1. C1 passes clean: the gate is a strict subset of the shipped one on
   the wrong rows, and every declared-meter condition needed for the
   true counts is in the fixtures' data.
2. C2 passes for the declared-meter gate — and the declared-lag rule
   accepts **3 of 3**: tracing the bench's own amended rule on these
   renders, the declared lag sits on the eighth grid (BEAT_FLOOR
   clears), its third is the eighth (r̂ high), its half is a dotted
   eighth (nothing) — every clause the amendments added still
   licenses the rung. The stem-shovel counterexample is correct and
   the bench's rule should be retired. Registering the prediction of
   one's own rule's defeat is the cheapest honesty available.
3. C3 passes; the exact-3× rows are accepted on the triple-declared
   items (that is the rung working as designed) and nowhere else.

## Spend fences

Zero. Three renders and arithmetic.

## Disclosure

Analyst Claude Fable 5. Verbatim port pinned at 2cf70cb; no model
measured or consulted; no development smoke was needed or run — the
predictions trace the committed code paths.
