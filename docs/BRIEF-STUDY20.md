# Study 20 — coloring ChordMini's roots from the notes: can the free channel dress the model's chords in the chart's colors?

**Registered before any run** (this brief, src/study20/, tests/study20.test.ts
and scripts/run-study20.ts in one commit; the run follows). Date:
2026-11-07. Drafted by the stem-shovel agent
(`docs/bench-brief-chord-colors-2026-11-07.md` in the app repo), who asked
the bench to register its own numbers; registered and run by the bench.

## The question

ChordMini (shipped, Study 19) has the roots: 70/76 and 75/84 bars (both
verified against results/study19.json before this registration; eat has
two rest bars). It never writes the colors this band's charts are made
of: letter-lands' truth is 74 power-chord and 50 sus4 slots (verified; 2
dominant-seventh slots are the rest), so strict it scores ~0 there. The
app has a second, free channel: the Basic Pitch notes of the tonal
stems. The candidate is `colorChord(root, modelQuality, profile, bass)`,
a pure function that dresses the model's root in the color the notes
support and NEVER changes the root.

## Verified corpus facts that shape the design (disclosed up front)

- **Letter-lands' truth has no plain major or minor triad at all**, so
  rule 2's major/minor flip can only cost there; its value, if any, must
  come from eat-all-the-clocks (32 minor + 4 major slots).
- **No corpus has a slash chord in truth**: the synthetic fixture plays
  root position by construction, and neither graded real song's chart
  writes one. The brief's requested SLASH_MIN_SHARE sweep therefore has
  nothing to reward anywhere; rule 4 is measured as its firing count and
  its G1/G2 cost at the shipped 0.20 only, and the report flags the
  slash rule as UNVALIDATABLE from this corpus (the brief's own
  "colors not reachable" clause).
- The synthetic fixture's color slots: 24 power, 4 sus4, 3 7sus4, 2
  sus2 in 440 bars — thin, so the A2 sweep is over PRESENT_SHARE only.

## Registered interpretations of the candidate's rules (deviations disclosed)

1. **sus4 is tested before the power chord.** The brief's literal order
   tests the fifth first, and every sus chord contains a fifth, so sus4
   would be unreachable as written. Registered order with the third
   absent: fourth present → sus4; else second present → sus2; else
   fifth present → power chord; else the model stands.
2. **Vocabulary reduction**: maj6 → maj, min6 → min, minmaj7 → min,
   dim7 and hdim7 → dim (the chart vocabulary the app displays has no
   half-diminished symbol; its own map shows Cdim for all three, and
   rule 5 leaves dim alone). Otherwise the brief's list.
3. **The profile is the v0.231 matcher's own arithmetic** (overlap
   seconds x (0.3 + amplitude), the 15 % bass-duration rule) WITHOUT
   the matcher's 0.5x bass boost: the boost exists to steer a root
   choice this function never makes, and boosting would distort the
   presence shares the sus rules read. The pin test proves the
   arithmetic: evidence + boost reproduces the stored matcher3PerBar
   over all 440 fixture bars.
4. **A0 is nchord's perBar** (the bench's pinned Study 17 instrument).
   Study 19 measured the app's vote equal to it everywhere but two
   exact-tie bars that grade identically either way.
5. **G1 strict** uses barmark 0.17.0 (the published notation package
   the band's charts are written in; new exact-pinned dependency):
   same root pitch class, same bass pitch class, same interval set;
   enharmonics equal; F#5 ≠ F#, D7sus4 ≠ Dsus4, G/B ≠ G. A bar with two
   chart chords is strict-right on either (as every grade since Study
   13); strict-first reported beside.

## Arms ($0, no model-API calls; notes re-transcribed from committed raws)

- **A0**: the model's symbol as shipped (nchord perBar).
- **A1**: colorChord at the shipped constants (PRESENT_SHARE 0.12,
  SLASH_MIN_SHARE 0.20).
- **A2**: PRESENT_SHARE swept {0.08, 0.10, 0.12, 0.15, 0.20} on the
  synthetic fixture only, using a truth-proxy model (quality from truth
  with the color ERASED: 5 → maj, sus4 → maj, sus2 → maj, 7sus4 → 7;
  minor families → min; root from truth), picked by fixture strict
  score, applied unchanged to the real set once.
- **A3 (negative control)**: the matcher's own template choice
  (forcedRootChord: chordOf231's scoring verbatim, pinned by test) with
  the root forced to the model's and the seventh allowed — Study 17's
  hallucinated-sevenths arm, root-fixed.
- **Vocal split**: eat-all-the-clocks runs every arm on two note
  channels — all tonal stems (primary, the app's channel) and without
  the stem named "Eat all the Clocks" (the vocal; Study 17 found it
  pollutes merged harmony on this song). Gates read the primary channel;
  both are reported.

## Gates

- **S20-G1 (the point, strict)**: A1's strict-any score reaches 46/76
  on letter-lands AND 38/86 on eat-all-the-clocks (the brief's shape:
  two thirds and half of the root-right bars).
- **S20-G2 (roots must not fall)**: A1's root-level grade (Study 13's
  gradeBars) is at least A0 − 1 on each song (A0 = 59/76, 53/86).
- **S20-G3 (the cost of guessing)**: bars right in A0 under the
  allowance but wrong in A1 number at most 4 per song.
- **S20-G4 (rule 3 earns its place)**: A3's strict-any total over both
  songs is BELOW A1's (else the seventh fence is not needed and the
  hypothesis about hallucinated sevenths is wrong).

Registered decision rules: the major/minor flip is dropped from the
recommended candidate if its real-set record is net negative on strict;
the slash rule ships only with a flag (no corpus can validate it).

## Spend fence

**$0.** Local CPU only (~8 minutes of transcription).

## Predictions (scored in the report)

1. S20-G1 passes; central estimate 50–62 on letter-lands (power chords
   are easy for the notes: third absent, fifth present), 40–50 on eat.
2. S20-G2 passes with a dip of at most 1 per song.
3. S20-G3 cost ≤ 3 on letter-lands, ≤ 4 on eat.
4. S20-G4 passes decisively: A3's strict total is under half of A1's
   (the root-fixed matcher still dresses bars in sevenths).
5. The flip fires at most 3 times per song and is net ≤ 0 on the real
   set, so the recommendation drops it; the slash rule fires at most 2
   bars total, all cost.
6. The fixture sweep picks PRESENT_SHARE 0.12 or 0.15 (A2 = A1 or one
   step stricter).
7. Excluding the vocal stem changes eat's A1 strict by +0 to +4 bars.

## Disclosure

Analyst Claude Fable 5. No model API measured; every grade mechanical
and committed before the run. The bench prototypes the candidate to the
app's spec and reports; the app implements its own shipping copy. The
notes channel is the bench's (non-drum stems summed, peak-normalized,
Basic Pitch) — the app weights stems individually; registered as a
disclosed channel difference.
