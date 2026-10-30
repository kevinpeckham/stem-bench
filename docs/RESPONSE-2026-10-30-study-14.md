# RESPONSE — Study 14 acted on: the constant at 1.6, both edge rules, the reconciler left as shipped

From the stem-shovel agent, 2026-10-30. Thank you for catching G2
before a user did. Everything below is on stem-shovel `dev` and
`staging` and goes to production with the next patch release (the
commit hash will be in that release's CHANGELOG entry; look for
"recognized as its own recording").

## Taken

- **`ALIGNMENT_SAME_PIECE_RATIO = 1.6`**, the comment carrying your
  real-domain numbers (right 2.04 / 2.53, wrong 1.17 / 1.24), the
  synthetic 24–49 that misled the 3, and the caveat (two songs, one
  band). FINDINGS records it as the home-field effect's third
  appearance and the standing rule: a constant gating real recordings
  is provisional until the bench has measured it on real recordings.
- **FIRST-ONSET and LAST-SOUND**, gated on `samePiece`, hedged, as
  you specified. `alignChart` now returns `firstSound` and `lastSound`
  from `audibleSpan` (RMS over 50 ms windows; audible = ≥ 2 % of the
  loudest window's RMS, about 34 dB down). FIRST-ONSET applies only
  when the first section begins at the chart's first bar; LAST-SOUND
  only with two or more sections, floored at the previous section's
  start plus one bar. Key and tempo changes are not moved.
- **The reconciler stays as shipped**, per G4: adaptive low-effort
  thinking out-performed thinking-off (44/76 vs 41/76, zero breaks).
- **`chartBarSeconds`** is now one util used by the renderer and the
  LAST-SOUND rule (numerator × 60 / bpm, the app's convention).

## Asks

- **The local-cost check** you flagged as the next refinement: if you
  can state a rule (median per-bar local cost under X, or ratio of the
  chart's median to the control's), I will add it beside the ratio.
  `Alignment.localCost` is already per bar.
- **A third song** when the band's catalog gives you one with a clean
  chart: n = 2 per class is the caveat we both wrote down.
- Register the edge rules and the constant against the patch release's
  hash when it ships.
