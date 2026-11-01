# Study 16 — the chart reads barmark: validating the adoption

Registered 2026-11-01, before any scored run. Zero spend: every grader
is committed, mechanical code; no model is called.

## What shipped

stem-shovel adopted the barmark standard end to end (Kevin's pins):

- **371831ae** — the parser: `barmark` is the chord chart's parser
  behind the `barmarkChartBars` adapter to the app's `ChartBar` shape;
  a refuse-not-guess migration converts the stored charts.
- **b5ed9ed2** — the renderer: `@barmark/render` draws the chart
  everywhere the app shows one.
- **a0926c65** — sections are known by their name, not a numeral.

All five stored charts are migrated (Letter Lands, Mop Heart and
Interbellum by the script; Eat All the Clocks and Peaceful Dreams by
Kevin's hand), each confirmed by the band against its recording's
section markers. The app consumes **barmark 0.5.0** (bumped at
431f3506; the adapter file is byte-identical from 371831ae through dev
HEAD), so 0.5.0 is the version pinned here — it is what the stored
charts were migrated and confirmed under. The alignment code is
unchanged from Study 15's pin (bc683871 ≡ 371831ae on
`chartAlignment`, `alignedPlacements`, `chartBarSeconds`), so the
Study 15 ports remain production-exact and are reused.

## Pins

| What | Where | Pin |
|---|---|---|
| Production adapter | src/study16/barmarkChartBars.ts | stem-shovel 371831ae, verbatim below the imports |
| barmark parser | package.json devDependency | 0.5.0 exact, npm (provenance-attested) |
| Retired parser (baseline) | src/study14/chordChartBars.ts | stem-shovel 39c25b5 (Study 14's port) |
| Alignment | src/study15/*.ts | stem-shovel bc683871 (Study 15's ports; unchanged at the adoption pins) |
| Placement baseline | results/study15.json | Study 15's committed run |

Pinned by tests/study16.test.ts (version pin + adapter behavior pins +
grader unit tests).

## Corpus

- `corpus/badverbs-charts/<slug>.chart.md` — the band's STORED,
  MIGRATED charts, fetched verbatim 2026-11-01 from the public
  Badverbs song pages (the Study 10 authorization; the band is
  Badverbs, "mmkk" survives as the account slug). Four of the five
  migrated charts are public: letter-lands, peaceful-dreams,
  eat-all-the-clocks, mop-heart. **Interbellum is not on a public
  page and is out of scope — disclosed, not sampled around.**
- `corpus/badverbs-declared.json` — the band's CURRENT declared
  sections (post-a0926c65: `{name, start}`, no numeral) and the 0:00
  settings rows production hands the parser as defaults.
- The committed app-dialect texts (`corpus/mmkk-chart-texts/`) and
  verified content lists (`corpus/mmkk-charts.json` letter-lands;
  the peaceful-dreams band revision, 152 bars, grid-verified at
  Study 15's registration) are the baselines.
- Real audio: the Study 10 downloads in `corpus-mmkk/` (gitignored;
  hashes in corpus/fixture-mmkk.json).

**What the bench holds no verified truth for, disclosed:** the
committed eat-all-the-clocks transcription (86 bars) predates the
band's own revision of that chart (the Study 15 report's chart-error
finding led the band to rewrite it), so eat has no committed content
truth; it is content-EXPLORATORY and structure-GATED (the declared
section grid is band truth). Mop-heart was never bench-verified at
all and is exploratory in every arm.

## Arms and gates

### Arm A — cross-parser agreement (the retired parser is the yardstick)

The three committed app-dialect texts through both parsers. The old
combined stated line (`key: F#maj 4/4 132 bpm`) is the app dialect's;
barmark's binding grammar wants the directive form, so each parser
reads the IDENTICAL bar/section body under its own dialect's header.
The substitution table, registered:

| Chart | App-dialect header | barmark header |
|---|---|---|
| letter-lands | `key: F#maj 4/4 132 bpm` | `key: F#, time: 4/4, tempo: 132` |
| peaceful-dreams | `Key: D · 4/4 · 145 bpm` | `key: D, time: 4/4, tempo: 145` |
| eat-all-the-clocks | `key: Emin 4/4 120 bpm` | `key: Em, time: 4/4, tempo: 120` |

Agreement (src/study16/grading16.ts `barsAgreement`) is per bar:
run-length-collapsed normalized chords, bpm, meter, the section a bar
begins, the key in force (normalized). The registered chord
normalization: ♯/♭ fold to ASCII; a Logic parenthetical after a power
chord's `5` drops (`F#5(7)` → `F#5`), elsewhere it splices
(`C#(7)` → `C#7`) — the two vocabularies name the same harmony.

**G1.** All three charts: zero differences, zero warnings from either
parser.

### Arm B — the migration, graded (the production path reads the stored charts)

Each public migrated chart through `barmarkChartBars` with
production's defaults (the song's 0:00 tempo and meter). Graded
mechanically:

- Structure (`sectionGridErrors`): the chart's section starts on its
  own grid (cumulative `chartBarSeconds`) against the band's declared
  section starts, matched by order; a section-count mismatch is a
  fail, not a partial score.
- Content (`contentDiffs`): against the verified lists — letter-lands
  (corpus/mmkk-charts.json, Study-12-gated) and peaceful-dreams (the
  retired parser's reading of the committed band revision). The FINAL
  section may carry at most ONE extra trailing bar: the grammar's
  unmeasured ring-out (`| Em | ... |`) writes the final attack as its
  own bar, a convention that post-dates the verified lists. Anything
  else — an interior extra bar, a missing bar, a different harmony or
  order — is a difference.

**G2.** letter-lands, peaceful-dreams and eat-all-the-clocks each:
zero parser warnings, AND every declared section start within
**±0.10 s** on the chart grid, AND (letter, peaceful) zero content
differences. Mop-heart: reported, not gated.

### Arm C — the recordings, through the new path

The migrated charts aligned to their real recordings
(chroma-DTW ports @bc683871), plus the six wrong cross-pairs among
the three gated songs.

**G3.** Two-clause same-piece — ratio ≥ 1.6
(ALIGNMENT_SAME_PIECE_RATIO) AND median local cost ≤ 0.30 (Study 15's
recommended second clause): all three right pairs PASS, all six wrong
pairs FAIL at least one clause. (Study 15 margins: right 2.04–3.21 /
0.17–0.24; wrong 1.13–1.24 / 0.46–0.48.)
**G4.** Placement no-regression. Baseline NAMED (registration
lesson 7): Study 15 @bc683871, results/study15.json — letter-lands
median |section error| 0.08 s, peaceful-dreams 0.11 s. Gate: through
the new path, letter-lands ≤ **0.33 s** and peaceful-dreams ≤
**0.36 s** (baseline + 0.25 s). Eat is exploratory here: its Study 15
number (1.99 s) was produced by the old wrong chart, so there is no
comparable baseline.

## Predictions (scored in the report, not gates)

- **P1** Bar counts: letter-lands 76; peaceful-dreams **153** (the
  verified 152 plus the migrated chart's ring-out attack bar); eat 71.
- **P2** Eat's corrected chart brings its placement median |err| to
  ≤ 0.50 s (from 1.99 s).
- **P3** Ratios: letter and peaceful within ±0.15 of Study 15 (2.04,
  3.21); eat ≥ its Study 15 value (2.53 — the chart only got truer).
- **P4** Mop-heart (first alignment ever, 3/4 at 224 bpm) passes the
  two-clause same-piece.

## Spend

$0. No model runs. Pilot fence and matrix fence vacuous.

## Deviations and notes

- The adapter port changes only its type-import path; pinned verbatim
  below the imports by diff at registration and by behavior tests.
- The committed app-dialect texts' stated lines produce a barmark
  diagnostic (the combined form never was barmark grammar); arm A's
  registered header substitution is the only text change, and the
  bodies are byte-identical between the two parsers' inputs.
- Fetching the corpus preceded this registration; no fetched chart was
  parsed before the brief and graders were committed.

## Amendment 1 (2026-11-01, registered before results were accepted)

The first run crashed in the EXPLORATORY mop-heart cross-pairs after
every gate had printed: `alignChart` throws when a chart runs more
than twice the recording ("check its tempo" — production's own
refusal), and peaceful-dreams' 253 s chart against mop-heart's ~112 s
recording trips it. The runner now catches the throw for exploratory
cross-pairs and records the refusal — which, for a wrong pair, is the
production path giving the right answer by construction. No gate, no
grader and no gated pair is touched; the run is repeated whole.
