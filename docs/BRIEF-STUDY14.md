# BRIEF — stem-bench Study 14: the shipped alignment and reconciler, validated; the tritone control measured

**REGISTERED.** All four asks from the stem-shovel responses
(docs/RESPONSE-2026-10-30-study-12.md and -study-13.md), on verbatim
ports pinned at their commits: the alignment set at **39c25b5**
(chartAlignment, chartBars, chordChartBars, alignedPlacements,
chordPitchClasses, chartSectionName, chartStatedValues, the constant)
and the reconciler utils at **5b2288f8** (reconcileChordsMessage,
parseReconciledChords). Imports rewritten, nothing else; the ports do
not chase stem-shovel changes mid-study. Spend: two model calls
(arm E, ≈ $0.40); everything else zero. Fence $2.

## Arms and gates

**A — the tritone control, measured (their ask 1).** The shipped
same-piece check rotates the chart's own reference chromagram a
tritone and takes `ratio = controlCost / cost` against the provisional
`ALIGNMENT_SAME_PIECE_RATIO = 3`; the bench's Study 12 floor (8.6×)
measured a different control (another song's chart). Through the
shipped `alignChart` itself: the tritone ratio on RIGHT charts
(letter-lands, eat, and the six Study 12 probe recordings with their
own charts) and on WRONG charts (the six mismatched pairings), side by
side with Study 12's wrong-song cost ratios. **S14-G2: every
right-chart tritone ratio ≥ 3 AND every wrong-chart tritone ratio
< 3** — the shipped constant must separate on this corpus — with the
measured floor and ceiling reported so the constant can be raised or
defended by number.

**B — the parsers round-trip (their ask 2's prerequisite).**
`chordChartBars` over the bench's MMKK transcriptions re-rendered in
the band-markdown conventions (## headings, `| F#5 Esus4 |` grids,
N.C. rests) must reproduce the committed bar lists exactly (counts,
chords, sections); `chartBars` over a Study 8 marked measure summary
(contrast-b) must reproduce its spec (24 bars, marks, tempo, meter);
and the 6/8 convention is pinned: a 6/8 chart with its tempo declared
in EIGHTHS (their app's rule, per their decision note) renders
reference bars at the app's bar seconds, not `barSeconds`'. **S14-G1:
all three exactly.**

**C — the shipped aligner reproduces Study 12 (their ask 2).** The
ported `alignChart` + `alignedPlacements` on letter-lands, fed through
THEIR parser from the generated markdown: **S14-G3: ≥ 6 of the 7
non-edge section boundaries within 0.5 s of the band's declared
starts, `samePiece` true, and both edge sections hedged.** (The code
hedges first and last sections unconditionally — noted, so that
clause documents rather than tests.) eat-all-the-clocks reported
exploratory, its high-local-cost bars checked against Study 12's
known bad-bridge region.

**D — edge corrections, measured (their ask 3; no gate).** Two
registered candidate rules on the real songs: FIRST-ONSET snap (the
recording's first 50 ms RMS above 0.1 of peak, as an anchor
correction for the first placed boundary) and LAST-SOUND snap (the
last RMS above 0.05 of peak, bounding the final section's end).
Reported as error deltas on the known edge misses (letter-lands
intro 3.6 s, outro 9.1 s) — a measured suggestion for
`alignedPlacements`, not a ship claim.

**E — the reconciler under the production configuration (their
Study 13 ask).** Two calls: claude-fable-5-1 with
`thinking: adaptive, effort: low` (their shipped providerOptions; our
arm ran thinking-off), through THEIR message builder and parser
(pinned equal in spirit to the bench's registered forms by test), on
the Study 13 arm-1 data. **S14-G4: letter-lands ≥ the 29/76 baseline
AND fixes ≥ 2× breaks** — S13-G2 restated under the production
config; the delta against the thinking-off run reported.

## Predictions (the bench's)

1. G1 passes — the conventions were built for exactly these forms.
2. G2 passes with margin: right-chart tritone ratios land well above
   3 (power-chord charts are strongly tonal; a tritone rotation lands
   maximally far), wrong-chart ratios near 1 (a wrong chart and its
   rotation are equally wrong). Recommendation lands at "keep 3," with
   the measured floor quoted.
3. G3 passes; the mid-song precision survives the parser path.
4. G4 passes; thinking-low changes the fix count only modestly in
   either direction.
5. D: the last-sound snap recovers most of the 9.1 s outro miss (the
   tail is ring-out and silence); the first-onset snap is the coin
   flip (the intro miss may be a real performance pickup, not dead
   air).

## Disclosure

Analyst Claude Fable 5; arm E measures claude-fable-5-1 (family
disclosure as Studies 1 and 13; every grade mechanical and committed
first). Ten files ported verbatim at the named pins; the bench's
`fft` import is the Study 9 port of the same function (byte-identical
at a99fb18; their file's local changes since do not touch it).
