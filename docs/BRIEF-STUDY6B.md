# BRIEF — stem-bench Study 6b: the key-in-force warning, registered

**Pre-registration draft, for Kevin's review before it is committed as
registered.** Small model spend: new pages, read once by the production
reader.

Study 6 (docs/BRIEF-STUDY6.md, REPORT.md) registered two instruments
for stem-shovel's `chartReadWarnings` and found the shipped rule caught
every detectable corrupted read (10/10 on the production reader) but
flagged 4/42 clean reads — honest sharp-key charts whose chords carry
no accidentals — while the registered letters refinement traded those
for 2/42 on a modulating chart. A third variant, judging each chord
against the key signature IN FORCE at its measure, was written after
those results and labeled exploratory: 10/10 and 1/42, the one flag a
read that had placed a modulation three bars late. stem-shovel shipped
the scoped rule on 2026-10-28 on the strength of that exploratory
number. A rule designed on the data it is scored on fits that data;
this study gives it reads it has never seen.

## Instruments (committed, pinned by test)

- **H-prod** — stem-shovel's shipped rule, ported VERBATIM from
  src/lib/utils/chartReadWarnings.ts at the commit that shipped it
  (b2452d6, 2026-10-28), pinned by tests/study6b.test.ts. Its
  definition, in words: walk the `m<n> …` lines in order; the key in
  force is the latest `key <K> major|minor` at or before the line (a
  line's own mark applies to its chords; the last mark on a line
  counts). A key's altered letters are the first n of F C G D A E B
  for n sharps, B E A D G C F for n flats. A chord is SUSPICIOUS when
  the key in force has ≥ 2 accidentals, its root letter is one of that
  key's altered letters, and the root carries no accidental; a slash
  bass is not judged. The rule flags when ≥ 8 chords in all, ≥ 2 are
  suspicious, AND no chord in the chart carries an accidental on its
  root or bass. "Note:" lines pass through as before.
- **H-scoped** — Study 6's exploratory variant (src/study6/warnings.ts
  `chartReadWarningsScoped`), unchanged, as the comparison. It differs
  from H-prod in ONE condition: it does not require the chart to be
  free of accidentals altogether. H-prod can therefore only be quieter
  than H-scoped on the same read; the study measures what that extra
  condition costs in hits and buys in silence.

Neither instrument changes after this brief is committed. If a defect
is found in the port, the study stops, the port is fixed and
re-pinned, and the brief is re-registered before any read is scored.

## Corpus (new pages, committed before the reader runs)

Study 6's reads are the data the scoped rule was shaped on, so they
serve only as a reproduction check (below). The scored corpus is new:
`corpus/scores6b.json` specs, engraved as Study 3 and 5 engraved
theirs (Verovio → PDF, production's file path, D-pdf arm only), in two
conditions per item:

- **Clean**: the current generator, accidentals intact.
- **Corrupted**: the same page through the accidental-dropping path
  the archived Study 3 generator took by mistake (a text font with no
  music glyphs, so ♯ and ♭ vanish from every chord symbol while the key
  signatures stay engraved). The switch is a registered generator
  option, not a re-run of the old bug, and a test asserts that the
  corrupted summary of each item equals the clean one with the chord
  accidentals removed.

Item design, 24 items, chosen so each false-positive class Study 6
named is represented in numbers that can move the rate:

- **8 honest sharp- or flat-key charts** (≥ 2 accidentals) whose
  chords legitimately carry none: D major on D G A Bm Em, A major on A
  D E F♯m-free voicings (A D E Bm), B♭ major on B♭ F Gm Dm, E♭ major on
  E♭ A♭ B♭ Cm — the copper-line and drift-4a class. Clean reads of
  these must stay quiet.
- **8 modulating charts**: two or three sections each in its own key
  (G → D, C → E♭, A → F, D → B♭ …), every chord honest in its own
  section's key, 10 to 16 measures — the mod-c class. Clean reads must
  stay quiet, and this is where H-prod's key-in-force logic earns its
  keep or does not.
- **8 charts with chords on altered letters** carrying accidentals (E♭
  major with A♭ and B♭ chords, A major with F♯m and C♯m, F♯ minor …),
  so that their CORRUPTED pages are detectable: the dropped accidentals
  leave bare A, B, F, C chords under a signature that alters them.

Every item has ≥ 8 chord symbols (the floor is not under test). The
detectability label is mechanical, from the spec, as Study 6 defined
it: a corrupted page is **detectable** iff the key in force at some
measure has ≥ 2 accidentals and ≥ 2 of that item's true chords are
rooted on letters that key alters. By construction the third group's
16 corrupted pages are detectable and the first two groups' are not
(nothing chord-visible was corrupted; silence is correct there).

Reader: production's chart-read (anthropic/claude-fable-5-1), Study
3's runner verbatim, one read per page per condition: 48 reads.

## Spend fences

- **Pilot**: 6 items (2 per group), both conditions, 12 reads, ≈ $1.
  Runs on the registering go-ahead; its reads are committed and its
  numbers reported before the matrix.
- **Matrix**: the remaining 18 items, 36 reads, ≈ $3. Needs Kevin's
  explicit go-ahead after the pilot's results are committed. Cap $6 in
  all; the study stops at the cap and reports what it has.

## Registered measures

Per instrument, on the production reader:

- **Hit rate** on detectable corrupted reads (the third group, 16 if
  every read answers).
- **Silence rate** on undetectable corrupted reads (groups one and two,
  16): a flag there is a false alarm on a corrupted page, counted
  apart from the clean false positives.
- **False-positive rate** on clean reads (24), reported in all and per
  group, with the named anatomy of every flag (which chords under
  which key in force, and whether the reader's placement of a key
  change caused it).
- **The cost of H-prod's extra condition**: reads H-scoped flags and
  H-prod does not, listed, each labeled hit lost or false alarm
  avoided.
- **Reproduction check** (no new reads): both instruments over Study
  6's 148 saved texts; H-scoped must reproduce 10/10, 0/12, 1/42 on the
  production reader or the port is wrong and the study stops. H-prod's
  numbers on that set are reported as context, not as evidence.

A read the reader fails to answer, or that lands under the 8-chord
floor, is counted apart as a floor effect, as Study 6 did for haiku.

## Gate

G1, the number that matters for product trust: **H-prod flags ≤ 1 of
the 24 clean reads.** A second clean flag fails the gate, and the
report then recommends what the anatomy supports: tightening (a higher
suspicious-chord floor, or requiring the suspicious chords to fall in
one key section) or reverting to the pooled rule with its known cost.
G2, so the gate cannot be passed by a rule that never speaks: **H-prod
catches ≥ 14 of the 16 detectable corrupted reads.**

## Predictions (registered before any read)

1. H-prod passes G1 at 0 or 1 clean flags out of 24, and the flag, if
   any, is on a modulating chart whose read placed a key change on the
   wrong measure — the same anatomy as Study 6's mod-c flag. The
   honest sharp-key group produces no flag at all.
2. H-prod passes G2 at 15 or 16 of 16: the one plausible miss is a
   corrupted read where the reader restores an accidental from
   context (it knows E♭ major has an A♭), which H-prod's
   no-accidental-anywhere condition then silences while H-scoped still
   flags. That is the cost of the extra condition, and it is ≤ 1.
3. H-prod and H-scoped agree on every clean read (the extra condition
   cannot create a flag), so their clean false-positive counts are
   equal.
4. The reproduction check passes exactly.

## Disclosure

Analyst Claude Fable 5; the reader measured is claude-fable-5-1, the
same family, tolerable because every grade is mechanical and committed
before the first read. The brief, the corpus specs and pages, both
instruments and their tests, and the detectability labels are
committed before the pilot runs. H-prod is a verbatim port pinned by
test; it is not adjusted to this corpus, and this corpus is not
adjusted to it.
