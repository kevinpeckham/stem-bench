# BRIEF — stem-bench Study 15: the v0.201.2 patch registered, and the local-cost rule stated by number

**REGISTERED.** The two remaining asks from the stem-shovel Study 14
response, now that the band revised the Peaceful Dreams chart to
machine-true form (verified: all ten sections grid-match the declared
starts exactly; the bench's comparison runs are disclosed development
smokes). Verbatim port at **bc683871** (v0.201.2: the 1.6 constant,
`audibleSpan`, the FIRST-ONSET and LAST-SOUND edge rules,
`chartBarSeconds`), parsers reused from the Study 14 ports (the patch
does not touch them). Zero spend.

## Corpus

Three real songs with charts committed as text
(corpus/mmkk-chart-texts/): **letter-lands and peaceful-dreams GATED**
(machine-true charts — peaceful's is the band's own revision, fetched
from the app and committed with its sections snapshot in
corpus/mmkk-peaceful-rev.json), **eat-all-the-clocks exploratory**
(its −26 s transcription mismatch stands). Six real wrong cross-pairs
(every recording against every other song's chart). The six synthetic
probe pairs for local-cost context.

## Gates

- **S15-G1 (the 1.6 constant on the expanded real set):** all three
  right-chart ratios ≥ 1.6 AND all six wrong-pair ratios < 1.6 — the
  constant the bench recommended, now tested at n = 3/6 instead of
  2/2.
- **S15-G2 (the edge rules):** on both gated songs, the first
  section placed within 0.5 s of its declared 0 (FIRST-ONSET) and the
  last section's start within 1.0 s of declared (LAST-SOUND) — the
  rules must repair the known misses (letter-lands +3.6/−9.1 in
  Study 12's pipeline, peaceful +6.5/−7.5 in the pre-patch port) —
  with no interior regression (every non-edge boundary still ≤ 0.5 s).
- **S15-G3 (the local-cost rule, their ask stated by number):** the
  real-domain median per-bar local costs must separate right charts
  from wrong ones (max right < min wrong); the deliverable is the
  recommended clause — "median local cost ≤ X," X the real-domain
  midpoint — with all four class bands reported so the margin is a
  number, exactly as the 1.6 was derived.

## Predictions (the bench's)

1. G1 passes: letter 3.2, peaceful 3.2 measured in the disclosed
   comparisons; eat ~2.5; wrong pairs clustered near 1.1–1.3 — all
   six below 1.6.
2. G2 passes: FIRST-ONSET zeroes both intros (both recordings start
   with audible content at ~0.0); LAST-SOUND lands letter's outro
   within ~0.1 and peaceful's within ~0.2 (lastSound − 20 bars). The
   risk clause is peaceful's quiet interlude dragging an interior
   boundary past 0.5 — measured, and if it fails the gate the finding
   is a real limit of pad-only sections, not of the patch.
3. G3 passes with a clean band gap; the recommended X lands near the
   midpoint of right-real and wrong-real medians, and the margin is
   wider than the ratio's 1.65× (the local cost is the sharper
   statistic — it ignores the control entirely).

## What stem-shovel does with the result

G1+G2 passing registers v0.201.2's constants and rules as validated
on the expanded set — the "register against the patch hash" ask
closed. G3's X ships as the second same-piece clause if they want the
belt and braces; if the bands overlap, the honest answer is the ratio
stands alone.

## Disclosure

Analyst Claude Fable 5. No model measured or consulted; the two
chart-comparison runs that qualified Peaceful Dreams are disclosed
development smokes (their numbers appear in the predictions); the
band's chart revision is the band's, fetched and committed verbatim.
