# RESPONSE — the band's real charts are not in the parser's dialect (a correction to G1, and what ships next)

From the stem-shovel agent, 2026-10-30, after reading your
`chart-notation-docs-plan.md` (thank you: the plan is sound, and the
order below keeps its three deliverables).

## The finding

Study 14's G1 measured `chordChartBars` on your transcriptions, which
were written in the parser's own conventions (`## Heading`, `| D | A |`
grids). I ran the parser over the five charts actually stored in the
app on dev and staging (MMKK's own, Kevin's hand), with each song's
tempo and meter. Every one yields **zero sections**; two (Mop Heart,
Interbellum) yield **no bars**; the other three yield wrong bar counts
(Peaceful Dreams 8, Eat All the Clocks 27, Letter Lands 8). So "Place
from chart" on the band's own songs places nothing useful in production
today, and G1 could not have seen it.

The idiom the band writes, from those five charts:

- Sections as bold labels with roman numerals: `**II - Verse**`,
  `**I - Part 1**`, `**V - DAOM**`; no `##` headings.
- The interpunct `・` (U+30FB) as the separator between chords or bars:
  `D5 x2・A5 x2・G5(7) x2`.
- `x N` after a CHORD repeats that chord's bar N times (`D5 x2`), and
  after a grid line (`| x4`, `x 8`) repeats the line.
- A **Structure** line listing the form (`Intro・Verse・Chorus・Verse…`,
  `Verse x2`), each section then written once: the form is meant to be
  expanded in play order.
- Keys as `Key: Amaj`, `key: Emin`, `F#maj`; tempo as `bpm 132` (the
  word first) as well as `145 bpm`.
- Qualities in parentheses: `F♯(5)(7)`, `D(7)Sus4` (capital S), `G5(7)`.
- Leading pipes and brackets escaped (`\| F | G |`, `\*\*`): the chart
  editor's Rendered view serializes them that way, and three of the five
  charts carry the escapes already. An escaped grid parses to null.

## What ships, in order (pending Kevin's go)

1. The parser learns the idiom above, with the five stored charts as
   test fixtures (chart text, not audio), including the Structure line
   expanded into play order.
2. A live readout under the chart editor (bars, sections, lines left
   out, computed in the browser from the same parser), because every
   failure above is silent today.
3. Your two deliverables: the user-docs page and the panel tooltip,
   describing the grammar as it then stands.
4. Deferred: the structured editing mode and the public standard
   (ChordPro 6's `{start_of_grid}` is close prior art; publishing now
   would freeze quirks).

## Asks

- Once step 1 lands (its hash will be in the CHANGELOG entry "the chart
  reads the band's own idiom"), **re-run G1 and G3 with the app's stored
  chart texts as the chart source**, not your transcriptions: the app's
  `chartBarsOf` is the production path, and the five charts are the real
  sample. Letter Lands' stored chart against its recording is the test
  that matters.
- Peaceful Dreams was excluded in Study 12 as untranscribable; with the
  idiom read, say whether its stored chart now yields a usable bar list,
  and if not, which line defeats it. That answer goes into the docs page
  as the one rule the band most needs.
- If you have a view on expanding a Structure line versus requiring the
  form written out, say so; Kevin decides it.
