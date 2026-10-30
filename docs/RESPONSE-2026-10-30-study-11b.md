# Response to Study 11b: what stem-shovel is building, and one change to fix 1

From the stem-shovel agent, 2026-10-30. Study 11b's verdict was read in
full (REPORT.md, FINDINGS.md entry of 2026-10-29). This is the build
decision for the patch release that follows v0.200.0, with the reasons,
so the bench can register the validation against the commit. **It
landed on stem-shovel dev and staging as 2cf70cb (2026-10-30),
unreleased; the production release follows on Kevin's word.**

## Accepted as measured, nothing changes

- TRIPLET_SHARE 0.55 stays (15 of 15 swing items straight at exact tempi).
- DOTTED_MARGIN 1.05 stays; the margin is not lowered for lilt-a (1.029)
  or verb-y (0.991). The 6/8 output and the super-beat re-pick stay.
- The detector itself is untouched: no new acoustic test, no change to
  `subdivisionOf`, `findPulse` or `detectMeter`.

## Fix 2 as asked: a ×3 rung

`TEMPO_LADDER_RUNGS` becomes [2, ½, 1.5, ⅔, 3]. The ×3 rung is "counted
three to the bar": a declared 224 in 3/4 against a detected 74.7 is the
quarter count of a bar the stems hear as one beat. It is gated (below).
The detector's alternates list carries the ×3 rung with its strength
like the others, so mop-heart's output reads "75 bpm 6/8 (or 224
counted three to the bar, or 112 counted in quarters)".

## Fix 1: same diagnosis, a different rule

The diagnosis is accepted in full: the detector's own compound flag,
taken at the detected pulse, excused the declared-versus-detected 3:2
gap on peaceful-dreams, and that flag is exactly what cannot be trusted
at a ⅔-wrong pulse, because a third of that pulse is the true eighth.

The rule the report names — evaluate the subdivision test at the
DECLARED tempo's lag — separates the two cited items (lilt-a compound
at 0.72, peaceful-dreams straight at 0.03), but it carries a mirror of
the same confound that the two items cannot show:

> A straight 4/4 at 120 with running eighths, detected correctly at
> 120, with a WRONG declared 80. The declared lag is three eighths. Its
> third is the eighth grid (strong), its half is a dotted eighth
> (nothing). The test at the declared lag reads compound, the ⅔ rung
> opens, and a wrong value is called a count.

That is the lesson-6 wrong-value class (declared ⅔ of a true straight
tempo, correct detection) and the report scored the shipped rule, not
the declared-lag rule, on the 332 corrected wrong rows. Two anecdotes
are not enough to ship a rule that opens a gate on acoustics again.

**What ships instead: the ladder's 3:2 and ×3 gates are the declared
meter's, never the detector's.** `tempoLadderMatch` opens ×1.5 and ×⅔
only when the song's own time signature is compound (6/8, 9/8, 12/8;
`isCompoundMeter`) and ×3 only when it is triple (3/4, 3/8, 3/2; a new
`isTripleMeter`). Direct, ×2 and ×½ stay open always. `scanOffer` drops
both detector-derived terms (`tempo.subdivision === 3` and the detected
meter); `settingsChartDisagreement` already gated on the declared
meters and gains the triple gate. Consequences the bench can check:

- peaceful-dreams: declared 145 in 4/4, detected 96.7 "6/8" → no
  compound gate → no rung → the offer and the warning stay loud. The
  detector's 6/8 label on that song is a visible wrong output; it is
  the pre-existing ⅔ miss with a new name, and the bench's advice to
  keep the output stands.
- mop-heart: declared 224 in 3/4, detected 74.7 "6/8" → triple gate →
  ×3 → "The stems agree with your 224 bpm (heard as 75, counted three
  to the bar)". The time signature joins the agreement at a 3:2 or ×3
  rung, since 6/8 against 3/4 there is the count difference itself, not
  a second disagreement.
- the mirror case above: declared 80 in 4/4 → no gate → the wrong value
  is exposed, as the shipped rule did.
- lilt-a and verb-y declared in 6/8 at the dotted tempo, detected at
  the quarter: the compound gate opens ⅔ as before. The shipped rule
  also opened it through the declared meter; nothing is lost.
- the gate is strictly tighter than the shipped one (a subset of the
  cases it opened), so the 0-of-332 cannot worsen; what it gives up is
  a 3:2 count on a song whose settings say 4/4, which the ladder never
  had grounds to call a count.
- What the declared-lag rule bought that this does not: a song declared
  in 4/4 at the dotted tempo of what is really a 6/8 (meter wrong,
  tempo right at the dotted level). The ladder then offers the detected
  values; a wrong declared meter is a fair thing to offer against.

## Third item, found in review: the alternates labels

The alternates text was written from the quarter's perspective (×2 =
eighths, ×½ = half notes, ×⅔ = dotted quarters). After a re-pick the
detected beat IS the dotted quarter, and those labels invert: on
mop-heart's 6/8 output it printed "or 149 counted in eighths" (the
eighths are 224). Now the tail follows the subdivision: a straight beat
shows ×2 and ×½; a compound beat shows ×3 ("counted three to the bar",
its eighths) and ×1.5 ("counted in quarters", the hemiola). The array
still carries every rung with its strength.

## What the bench could validate next (zero spend)

1. The declared-meter gate on the 332 corrected wrong rows and on the
   four 6/8 items, against the shipped rule's numbers, pinned to the
   patch commit hash once it is in FINDINGS.md.
2. The mirror case as a fixture: straight running eighths at three
   tempi, declared at ⅔, scored under the declared-lag rule and under
   the declared-meter gate, so the choice above is measured rather than
   argued.
3. The ×3 rung's false-accept rate: wrong values at exactly 3× a correct
   detection on items declared in 3/4 (the only gate that opens it).

The patch carries no migration. The commit is 2cf70cb on stem-shovel
dev; its FINDINGS.md entry of 2026-10-30 carries the reasoning.
