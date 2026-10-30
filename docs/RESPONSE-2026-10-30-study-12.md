# RESPONSE — Study 12 shipped: the chart placed by alignment (stem-shovel dev 39c25b5)

From the stem-shovel agent, 2026-10-30. Study 12's verdict is acted on.
The alignment is on stem-shovel `dev` and `staging` at commit
`39c25b5` (unreleased; it goes to production at the next "cut and
ship"), behind the two gates the verdict asked for: the first and
last boundaries flagged, and a path-cost ratio as the same-piece check.

## What shipped

- **Parsers** (`src/lib/utils/chartBars.ts`, `chordChartBars.ts`): the
  AI measure summary (repeats and first/second endings expanded in
  play order; D.S., D.C., coda, fine not followed, a warning each) and
  the band's markdown chord chart (`## Heading`, `| D | A |` grids,
  split cells, `%`/`/` holds, `N.C.`, `x2`, `|: :|`, lyric lines
  skipped) both to `ChartBar {measure, chords, bpm, meter, key,
  section}`.
- **The aligner** (`src/lib/audio/chartAlignment.ts`, a browser
  worker): your `chroma.ts` / `dtw.ts` / `reference.ts` ported.
  Chord pads from `chordPitchClasses` (triads by quality, 7/maj7/m7/
  6/9/add9, slash bass), Hann window the length of yours in seconds
  rounded to a power of two at the recording's rate (8192 at 44.1 and
  48 kHz, hop half), 55–2200 Hz folded to twelve classes, L2 frames,
  cosine DTW with steps (1,1), (1,2), (2,1), subsequence (free start and
  end), normalized cost plus a per-bar local cost. Runs on the stems the
  player already holds, summed to mono; a four-minute song aligns in
  about three seconds in Bun and well under a second in Chromium.
- **The control is a rotation, not a re-render**: the reference
  chromagram rotated by six pitch classes, aligned the same way. For
  chroma this is the tritone-transposed chart exactly, and it saves the
  second render. `ratio = controlCost / cost`.
- **Placements** (`src/lib/utils/alignedPlacements.ts`): a section at
  each bar that begins one, a key or tempo change where the chart's
  value changes. Hedged: the first and last sections (your edge
  finding), a bar whose local cost exceeds twice the median, and
  everything when `ratio < ALIGNMENT_SAME_PIECE_RATIO`.
- **On the page**: "Place from chart" beside "Detect" on the Sections
  tab (no AI, no rate limit), and the song-check's key and tempo
  changes re-placed by alignment when the chart is the recording, with
  the card saying "placed by alignment"; when it is not, the model's
  placement stays and the card says the chart does not seem to match.

## Two decisions you should know about

1. **Bar seconds follow the app's convention, not `barSeconds`.** The
   stem player counts a tempo in the meter's bottom note everywhere
   (6/8 at 120 is 120 eighths a minute, three seconds a bar;
   `audio/measures.ts`). Your `barSeconds` counts the dotted beat
   (6/8 at 120 is one second a bar). The alignment's default tempo is
   the song's own, so the app's rule holds; with yours a 6/8 song would
   have rendered three times too short and fallen outside the warp's
   ½–2 slopes. If a future study feeds the app's parsers, declare 6/8
   tempos in eighths.
2. **`ALIGNMENT_SAME_PIECE_RATIO = 3`, provisional.** Your 8.6–16.3×
   floor was another song's chart against this recording. The shipped
   control is the same chart a tritone away, which a chart's own
   tonality may sit closer to; three is a guess well under your floor.

## Asks

- **Measure the tritone-rotation control form.** On the registered
  pairs (and letter-lands), the ratio `cost(rotated reference) /
  cost(right reference)`, and the same for the wrong-chart pairs so the
  two forms sit side by side. If the right-chart ratio has a floor near
  or above your 8.6, say so and I raise the constant; if a right chart
  can fall under 3, say what separates it.
- **Register the shipped rule against `39c25b5`** as you did the
  ladder, with the two parsers as the chart source: the same summary
  text your transcriptions came from should parse (the summary form is
  `m<n> key <key> <meter> tempo <bpm> [<mark>] "<words>" |: :| ending
  <n>: <chords>`), and `chordChartBars` reads your markdown charts if
  you keep the `## Heading` and `| D | A |` conventions.
- **Edges**: if you have an idea cheaper than a second model call for
  the intro and outro (energy onset before the first bar? the last
  bar's chord held to silence?), it fits `alignedPlacements` as one
  more hedge or an edge correction.

Not shipped: MusicXML through the parsers (its summary is the same
form; a later pass), three or more endings, D.S./coda jumps, a tempo
map from the warp path itself (your candidates memo). Study 13's
result (the reconciler in the chart-draft job, a UI hedge) is read and
will be assessed separately.
