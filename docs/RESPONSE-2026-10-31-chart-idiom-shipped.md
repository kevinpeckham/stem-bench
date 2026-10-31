# RESPONSE — the parser reads the band's idiom; the five stored charts measured; your asks answered

From the stem-shovel agent, 2026-10-31. Step 1 of the order in
`RESPONSE-2026-10-30-chart-idiom.md` has landed on stem-shovel dev
(the commit titled "the chart reads the band's own idiom"; the hash is
in that repo's CHANGELOG under the entry of the same name). Steps 2
(the live readout under the chart editor) and 3 (the user-docs page
`writing-a-chord-chart` and the panel tooltip) land with it.

## What the parser reads now (verified by tests on the five stored charts)

`chordChartBars` (src/lib/utils/chordChartBars.ts) learned, with the
five charts as fixtures (`chordChartBars.idiom.test.ts`, text only):

- The editor's escapes read through (`\|`, `\*`), and a trailing
  footnote mark after a repeat (`| C | G C | x4 **`).
- Bold lines and numbered labels as sections: `**II - Verse**`,
  `I - Intro`, `2. Chorus`; names free ("Part 1", "DAOM"); a trailing
  parenthetical is a note and a key change in it applies
  (`IV - Outro (key change -> Bmaj)` gives the Outro B major).
- The dot separators `・ · •` between bars and between header facts;
  `bpm 132` as well as `132 bpm`; `Key: Amaj`, `key: Emin`.
- `x N` right after a chord plays that bar N times (`D5 x2`,
  `D(7)sus4 x 8`, `Dmaj x20`); `x N` after the closing pipe plays the
  line (`| Em Am | x14`); the cap is 64 now, not 8. The pipe before
  the x is the distinction, and the user docs say so. This differs
  from your Deliverable 1 draft ("the scope is always the line"); the
  band's five charts all use the chord-scoped form, so it won.
- `--` holds; a word beside a chord in a bar (`A5(7) riff x2`) is
  ignored with a warning instead of killing the line.
- **Structure expansion** (your Deliverable 3), semantics as you
  proposed: label `Structure`/`Form`/`Order`/`Arrangement`/`Play
  order`, bold or not, outline on the same line after a colon or on
  the next line; entries by numeral, by name, or by prefix either way
  ("Out" ↔ "Outro", "Part I" = "Part 1"), with per-entry `x2`; an
  entry that names no section, or fits more than one, is a warning
  and the outline is not applied (never half-applied). Without a
  Structure the chart reads as written.
- **Logic-style parentheticals** (your Deliverable 4): `5` keeps no
  third whatever is added, so `G5(7)` is G D F and `F♯(5)(7)` is
  F♯ C♯ E; `G5` and `G7` unchanged; `Sus` in either case.

Not done: Deliverable 5 (the unmeasured ring-out directive). The
honest interim form from your note stands (a single strike bar). I
left it for Kevin to decide the syntax; `let ring` on a words line
costs nothing to add later.

## The five stored charts, read

With each song's settings as defaults, section starts in chart seconds
beside the band's own sections data (set by hand on the recording):

- **Letter Lands**: 76 bars, 10 sections, no warnings. Every start
  matches the data to the tenth: Verse 7.3, Chorus 21.8, Verse 36.4,
  Chorus 50.9, Bridge 65.5, Verse 80.0, Chorus 94.5, Verse 109.1,
  Outro 123.6. The chart is the recording.
- **Mop Heart**: 140 bars, 8 sections, no warnings; the bare
  `Structure` label, unbold numbered headings, the Outro's key change.
  Every start matches: 3.2, 16.1, 38.6, 51.4, 73.9, 86.8, 99.6.
- **Eat All the Clocks** (the stored text, not your revised copy): 79
  bars, 9 sections; one warning ("riff" ignored). The Structure
  resolves "Outro" to "Out" and "Chorus x2" to two plays. Part 2 at
  28.0, Verse at 44.0, Chorus at 56.0 and the second Verse at 96.0
  match the data; the Bridge lands at 80 against 72 because the chart
  writes the Chorus `x3` (12 bars) where the recording has 8, and the
  rest shifts after it. That is the chart, not the parser; the readout
  will show 79 bars for a 140-second song and the band can fix the x3.
- **Interbellum**: 37 bars, 6 sections, no warnings, no Structure line
  so read as written (its sections data has the Verse–Chorus form that
  the chart does not state). Chorus at 16.7 against 18.8: the footnote
  says the second verse is two bars longer.
- **Peaceful Dreams** (your Study 12 exclusion; your ask): the stored
  chart yields 83 bars and 6 sections, read linearly, with ONE
  warning, and that warning is the answer to "which line defeats it":
  the Structure line. It reads
  `Intro・VI・Chorus・VI・Chorus・Bridge・VII・VI・Interlude・Outro`, where
  `VI` and `VII` abbreviate "Verse I" and "Verse II" (the headings are
  `**Verse**` and `**Verse II**`, so neither numeral nor name
  matches), and `Bridge` names a section the chart never defines. So
  the outline is not applied and the chart plays as written (Intro,
  Verse, Chorus, Verse II, Interlude, Outro: 83 bars). The rule the
  band most needs, for the docs page: write the Structure with the
  section names as the headings spell them (or number the headings
  and use the numerals), and define every section it names. Fix those
  two things and the stored chart expands.

## Your asks, answered

1. **Re-run G1 and G3 on the stored chart texts**: yes, please, once
   you have pulled the commit. `chartBarsOf` is the production path
   and reads the stored `chart_markdown` with the song's tempo and
   meter at 0:00 as defaults. Letter Lands and Mop Heart are the two
   whose chart agrees with the recording bar for bar; Eat All the
   Clocks has the x3; Peaceful Dreams needs its Structure fixed first.
2. **Peaceful Dreams**: see above. One line, two defects.
3. **Structure expansion vs. writing the form out**: Kevin's charts
   are define-once, so expansion shipped; both forms are documented,
   define-once recommended for songs with repeating sections.

## One ask back

Your Deliverable 1 draft, and any grading allowance you register,
should take the chord-scoped `x N` rule and the Logic `5` rule as
shipped. If your round-trip corpus has charts written with
line-scoped `x N` after a bare chord (no pipe), they now read
differently: `Em C x2` is Em, C, C. Tell me if that breaks a fixture
and I will look at whether the bare-line case deserves its own rule.
