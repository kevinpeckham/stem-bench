# Study 18 — the matcher's two new rules on real audio: the bass pickup and the presence line, measured where they disagree

**Registered before any run** (this brief, the port, its tests and the
runner in one commit; the run follows). Date: 2026-11-06. Drafted by the
stem-shovel agent (`docs/HANDOFF-2026-11-06-matcher-v0231.md`, committed
verbatim; the app's FINDINGS.md 2026-11-06 entry is its twin), finished
and registered by the bench.

## The question

stem-shovel v0.231.0 (commit 748a3369) changed two scoring rules in the
chord matcher, found by re-scoring THIS bench's Study 1 fixture notes:
a bass note must now sound for 15 % of the bar to earn the root bonus
(`BASS_MIN_SHARE = 0.15`), and a template tone under 12 % of the bar's
profile counts as missing at a 0.12 cost (`PRESENT_SHARE` 0.05 → 0.12,
`MISSING_PENALTY` 0.08 → 0.12). On the synthetic fixture the ship is a
clean win: 424 → 439 of 440, the power-chord song 20 → 28 of 28.

The open question is REAL audio. The handoff could only approximate it
(notes rebuilt from Study 13's `barNotes` text, losing sub-150 ms notes
and all start times; its baseline reads 48/76 where the stored truth is
29/76), and its directional read says the two rules pull apart there:
the bass rule a clear win, the presence rule a wash or a small loss that
trades strict power-chord wins for majors with a weak third. The handoff
explicitly leaves the proper measurement "the bench's to run". The
home-field rule (three for three after Study 17) says shipped constants
need real-recording numbers; this study supplies them, and separately
per rule, since a joint number would hide one rule behind the other.

## Instruments (registered with this brief)

- `src/study18/chords231.ts`: the v0.231.0 matcher ported verbatim with
  the three constants as parameters, so every configuration runs one
  code path. Pinned by test (`tests/study18.test.ts`): at the v0.142
  constants (0.05 / 0.08 / bass share 0, which makes the overlap
  condition vacuous) it reproduces the bench's pinned v0.142 port BAR
  FOR BAR over all 440 fixture bars, and both fault cases from the
  handoff reproduce exactly (the pickup bar reads C#m7 old / E5 new;
  the leak profile reads Bsus2 old / B5 new).
- `scripts/run-study18.ts`: both arms, one results file, prints every
  gate.

Notes provenance for the real arm: the raw Basic Pitch note events were
not committed by Studies 13/17 (only `describeBars` text), but the
transcription is deterministic from the committed raws and child — the
anchor has reproduced exactly twice (Study 13, Study 17 G1). The real
arm therefore re-transcribes (sum the non-drum stems, peak-normalize,
the committed child), rebuilds the bar grid exactly as Studies 13/17
did, and gates on the anchor reproducing a third time. Grading is
Study 13's `gradeBars` verbatim (strict-first and power allowance
reported beside every number).

## Arms

- **Fixture arm ($0):** the handoff's five-row configuration table over
  `corpus/fixture.json`'s stored notes: v0.142; bass only; bass +
  present 0.12 at old penalty; shipped; present 0.15. On a 439/440
  shipped read, the runner writes `matcher3Segments` / `matcher3PerBar`
  beside the v0.141/v0.142 fields (the handoff's follow-up 1; nothing
  existing is rewritten).
- **Real arm ($0, CPU only):** three registered configurations over the
  re-transcribed notes of letter-lands (76 bars, GATED) and
  eat-all-the-clocks (86 bars, exploratory), on the shared bar grid:
  **anchor** (v0.142 constants), **bass-only** (bass 0.15, present and
  penalty old), **shipped**. A disclosed, ungated sweep rides along:
  presentShare {0.08, 0.10, 0.12, 0.15} × bassMinShare {0.10, 0.15,
  0.20, 0.25}, one line each, because the fixture is flat across those
  ranges and the real recordings are where they separate (the handoff's
  follow-up 5).

## Gates

- **S18-G1 (anchor):** the v0.142 configuration over the re-transcribed
  notes reproduces Study 13 arm 1 exactly: 29/76 (strict-first 20,
  power 9) and 24/86. Any deviation: STOP, investigate, re-register.
- **S18-G2 (fixture):** the five-row table reproduces the handoff's
  numbers exactly (424 / 432 / 432 / 439 / 439), static-bloom 20 → 28.
- **S18-G3 (the bass rule earns real audio):** bass-only ≥ the anchor
  on EACH song and > the anchor on at least one.
- **S18-G4 (the presence rule earns real audio):** shipped total over
  both songs ≥ bass-only total over both songs. PASS: the shipped
  constants stand as measured. FAIL: the registered verdict recommends
  reverting PRESENT_SHARE / MISSING_PENALTY to 0.05 / 0.08 and keeping
  the bass rule — the handoff's own suggested rule, adopted unchanged.

## Spend fence

**$0.** No model calls anywhere; the real arm costs ~8 minutes of local
transcription CPU. No pilot/matrix split.

## Predictions (scored in the report)

1. G1 passes exactly, the anchor's third reproduction.
2. G2 passes (disclosed: the bench already verified the 424 → 439 and
   20 → 28 claims pre-registration by running the APP'S OWN chords.ts,
   pre-fix and post-fix, over the fixture notes — the arbiter pass that
   preceded this brief; the gate re-derives them through the bench's
   registered port).
3. G3 passes: bass-only beats the anchor on both songs, central
   estimate +6 to +14 on letter-lands and +1 to +4 on eat-all-the-clocks
   (the handoff's reconstruction, baselined at 48 instead of 29,
   overstates the letter-lands gain).
4. G4 FAILS by a small margin: the presence rule's real net lands in
   [-5, 0), the fixture's +7 for it being home-field advantage again,
   and the verdict recommends the revert.
5. Sweep: bassMinShare 0.25 regresses eat-all-the-clocks (its bass
   moves faster); on letter-lands a higher presentShare monotonically
   trades majors-with-weak-thirds for power-chord wins, and the band's
   74-of-76 power-chord truth makes that look better there than it
   would anywhere else.

## Downstream notes carried for other studies (the handoff's 3 and 4)

Study 10's ChordMini comparison is unaffected (its fields are its own);
any re-tabling moves the production matcher's synthetic column to 439.
Studies 13/14/17 reconciler cells were computed from stored v0.142
hints and are not re-run; their hint baseline has moved, which the
report notes.

## Disclosure

Analyst Claude Fable 5. No model is measured; every grade is mechanical
and committed before the run. The handoff's real-audio table is an
approximation its author disclosed and this study supersedes; its
synthetic table was verified pre-registration as described in
prediction 2. The real recordings are Badverbs' own, from the disclosed
public catalog fetch (Study 10 Amendment 1).
