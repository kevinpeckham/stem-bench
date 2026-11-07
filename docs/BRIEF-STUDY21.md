# Study 21 — the chord reader on the rest of the catalog: does 77.6 % generalize to songs whose truth the bench got after it shipped?

**Registered before any run.** Date: 2026-11-07. Bench-drafted (Kevin's
go-ahead on suggestion #1); micro validation, zero spend, no
transcription — ChordMini reads the mix.

## The question

Every real-audio chord number in this program rests on the same two
songs the pipeline was developed against (letter-lands 59/76,
eat-all-the-clocks 53/86, root level under the power allowance). Study
20b banked bar-level truth for peaceful-dreams and mop-heart, charts
that arrived AFTER the reader shipped (v0.236.0) and after Study 19
gated its port, so for the model they are held out in the sense that
matters: nothing in the pipeline or its studies ever touched them. This
study grades the shipped reader there. Mop-heart is the interesting
case: plain major triads in sparse 3/4 are the model's native
vocabulary, so unlike letter-lands it can earn STRICT credit — if it
reads poorly there, that outranks anything Study 20 found.

## Registered grading decision (pre-data, disclosed)

Study 13's power allowance credits a right-rooted maj/min/5 answer when
the truth's quality is exactly "5", because a power chord declares no
third. Peaceful-dreams' chart writes `X5(7)` on 32 bars — a power chord
with an optional seventh, which declares no third either, so the
rationale applies verbatim. The PRIMARY grade (gradeBars21) extends the
allowance to truth quality "5(7)", changing nothing else; the
Study-13-verbatim grade is computed and reported beside it on every
song. A pin test proves the two grades are identical wherever no
"5(7)" truth exists (both anchors, mop-heart, the whole fixture
vocabulary), so no prior study's number can shift. The barmark strict
grade (Study 20's G1 comparator) is reported third.

## Arms ($0)

One arm: the pinned reference pipeline (nchord --bars) on each song's
mix over the Study 12 bar grid, exactly as Studies 13/17/19/20/20b —
the two anchors and the two held-out songs (corpus/mmkk-charts-20b.json,
provenance in corpus/charts-src/PROVENANCE.md; the render-only
parenthetical strip from 20b applies to the alignment pads). The 20b
alignment sanity rule carries over: strictly monotone bar grid spanning
at least 60 % of the mix, or the song is UNALIGNABLE and excluded.

## Gates

- **S21-G1 (anchors):** letter-lands and eat-all-the-clocks reproduce
  59/76 and 53/86 exactly (the fourth reproduction; gradeBars21 equals
  gradeBars there by the pin).
- **S21-G2 (the point):** EACH held-out song reads at least **50 %** of
  its chord-bearing bars at root level under the extended allowance
  (peaceful-dreams ≥ 77/153, mop-heart ≥ 70/140) — clearly on the
  reader's side of the 38.2 % cliff the note path showed on material it
  was developed against, on material the reader has never seen.

Everything else is reported, not gated: strict and strict-first per
song, the verbatim-grade delta (the price of the 5(7) vocabulary), and
the per-class anatomy.

## Spend fence

**$0.** Local CPU only (~2 minutes a song; no Basic Pitch).

## Predictions (scored in the report)

1. G1 reproduces exactly.
2. peaceful-dreams reads 55–75 % under the extended allowance, and the
   Study-13-verbatim grade sits 15–30 bars lower (the 5(7) slots).
3. mop-heart reads 55–80 %, and its strict-first is within 5 bars of
   its allowance number — on an all-triad chart, right means strictly
   right.
4. G2 passes on both songs.
5. The combined four-song root-level figure lands within 10 points of
   the two-song figure (69.1 %), so the shipped headline survives the
   catalog.

## Disclosure

Analyst Claude Fable 5. No model API measured; one new grader
(gradeBars21) whose only change is the "5(7)" allowance, pinned
identical to gradeBars everywhere that quality is absent; grades
committed before the run. The held-out charts predate this study
(committed 80d24d7) and were gathered for Study 20b, not chosen for
this one.
