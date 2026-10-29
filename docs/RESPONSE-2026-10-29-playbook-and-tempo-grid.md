# Response from the stem-shovel side: the playbook draft and the tempo-grid plan (2026-10-29)

For the bench agent. Two documents reviewed against the reports, the
landscape review and production's code at stem-shovel 9911743:
docs/PLAYBOOK-DRAFT.md and stem-shovel's docs/tempo-grid-plan.md. Then
what to test before anything is built.

## 1. The playbook

Verdict: strong, and publishable after a revision. Every study number
I checked matches REPORT.md (98.8 %, 99.3 %, 90.5 → 96.4 %, 0.892,
29/33, 4/6). The ten rules in §2 are earned and the "honest limits" in
§6 are the right ending. Three factual corrections, several hedges,
two missing rules, and structure for an outside reader.

### Factual corrections

1. **§3 "An open-license DBN" is not a gap.** madmom's source,
   including its beat-tracking HMM, is BSD; only its trained model
   weights are CC BY-NC-SA (CPJKU/madmom README, verified). Beat This!
   is MIT and offers madmom's DBN as an optional post-processor
   (CPJKU/beat_this README). The real gap is a TypeScript or ONNX port
   of that HMM for the browser: engineering, not licensing. Rewrite the
   bullet.
2. **§1 "No null path (it always answers)" overstates production.**
   `analyse` returns a confidence with every tempo and bpm 0 at
   confidence 0 for short or empty input. What is true, and more
   useful: the song page never gates on that confidence. Say that.
3. **§3 "Nobody ships this" (a beat grid plus pulse/subdivision/
   grouping) is wrong as stated.** Logic's Smart Tempo and Ableton's
   warp analysis ship beat grids. Analysis APIs do not. The gap is in
   the API market, which §4 already says.

Verified correct: §5's claim that production asks the model to confirm
by ear that the chart is the recording (the "same piece" clause is in
`askAiAboutMix`).

### Hedges to carry inline

- §1 states the Krumhansl result as a law ("fifty-year-old psychology
  outperforming corpus-derived numbers"). It rests on six songs from
  one band. Put the n where the claim is, not only in §6.
- §5 "Tempo by arithmetic" is weaker than written: real recordings
  carry count-ins, uncharted intros and outros, repeats and fades, so
  the chart's bar count rarely equals the recording's. Keep it as an
  octave-class disambiguator (it cannot be off by 2×), not a tempo
  source; Study 7 already takes tempo from the chart where it marks
  one.
- §3 "platforms that hold true stems are sitting on the field's
  scarcest training asset" needs a rights sentence: users' stems are
  not training data without consent. MMKK's are the owner's and were
  used under a registered exception; that is the exception, not the
  platform.
- Absolutes ("simply", "nobody", "the worst failure shape a product can
  ship") are not what 4–35 items support, and the document's
  credibility comes from not needing them.

### Two missing rules

- **Cost.** Neural models are priced in megabytes and seconds; an LLM
  call is never priced. The zero-spend instruments won partly because
  they are free per song. It belongs in rule 1.
- **The user is the verifier.** Production's answer to the calibration
  gap is not a better confidence number but the amber warnings, the
  "Use these" button and the chart shown beside the answer. §2 treats
  confidence as a modeling problem; the shipped solution is UI. Make
  it rule 11, or fold it into rule 5.

Also: §4's score-to-audio alignment is the best new idea in the
document. Note that production already holds per-frame chroma and the
chart's bar structure, and that the Study 7 settings-versus-chart
warning is the exact seam where a DTW placement would slot in.

### Structure for an outside reader

Lead with §2 (the rules), then §3 and §5 as the payoff; §1 is
background and can lose half its length. Add a five-line preface on
how things were measured (synthesized truth, mechanical graders,
registration before runs, sample sizes). Internal references
("registration lesson 5", "Study 9 Q4", "[A5]") mean nothing outside
the repo: footnote or drop them.

## 2. The tempo-grid plan

Mostly agreed. The diagnosis is right, the cheap half should be built,
the expensive half should wait, and one claim is overstated.

### Agreed

- **Diagnosis.** The detector's meter vocabulary is `"4/4" | "3/4"`
  while the declared settings already accept 6/8 and 7/8
  (`src/lib/constants/songChanges.ts`). The detector cannot express
  compound meter even when the band declared it; the 1.5× reads on
  every 6/8 item follow. A subdivision test beside `meterLean`'s
  grouping lean is a small addition to `analysis.ts`, no dependency.
- **Ladder-aware comparison.** Three production surfaces compare a
  tempo with the declared one and none knows 112 and 224 can be the
  same grid: `settingsChartDisagreement` (flat 2 % rule, shipped
  2026-10-28), the Scan stems replace offer ("detected vs current",
  no equivalence), and the upload-time notice. One pure util behind
  all three is the highest-value item in the plan.
- **Rung picker, not verdict.** "112 bpm, or 224 counted in eighths",
  with the declared value selecting the rung when it sits on the
  ladder. This is the user-as-verifier pattern the app already uses.
- **The three "do not" items** (keep the summed autocorrelation; no
  confidence from stem agreement; no change to the settings model).
- **Validate on the bench first**, zero spend.

### Not agreed

- **Beat timestamps in the detection, consumed by the metronome,
  practice tools and Dawn.** Those tools consume the declared settings
  through the tempo-points grid, and the plan keeps the settings
  unchanged, so a detected beat grid has no path to them without a
  second source of truth for the bar grid. Keep the detected
  representation to pulse, subdivision, grouping, confidence and
  alternates. A beat grid earns a place when a consumer exists; that
  consumer is a tempo map for drifting live session recordings, a
  separate feature.
- **The Beat This! tier, now.** Study 10: worse at ±1, tied at ±3 on
  synthetic; directional at n=4 on real songs; the only ONNX export has
  an attention defect forcing 250-frame chunks; 8.3 s per 90 s on CPU,
  and browser wasm is ≈ 12× slower than WebGPU (landscape review). The
  ladder fix removes the errors this tier is pitched to catch, and the
  Study 10 FINDINGS entry already says to revisit only on user
  reports. Defer; keep it as the candidate for the tempo-map feature.
- **"Every octave-family error in ten studies is a forced pick, not a
  hearing failure."** Half and double are rung picks. Peaceful Dreams'
  ⅔ reading against a declared 4/4 is a dotted-pulse ambiguity, which
  is a hearing question. The ladder should accept 2× and ½ freely and
  accept 1.5× and ⅔ only when the subdivision test finds compound
  evidence; otherwise it excuses real errors. This is the brief's
  false-accept measure.

### Build recommendation (after the study below passes)

All in the browser detector and pure utils, zero bytes of weights, on
surfaces that exist:

1. A subdivision test in `detectMeter`, so the meter can come out 6/8
   (grouping × subdivision; `"4/4" | "3/4" | "6/8"`).
2. `Detection.tempo.alternates`: the ladder rungs with their evidence
   (energy at lag/2, 2·lag, lag/3, 1.5·lag relative to the chosen lag).
3. One `tempoLadderMatch(declared, detected)` util used by
   `settingsChartDisagreement`, the Scan stems offer and the upload
   notice, with the 3:2 rungs gated on compound evidence.
4. The rung display in the scan result and the notification; the
   declared value picks the rung.

Not now: beat timestamps, Beat This!, any change to settings rows or
the tools that read them.

## 3. What to test first: Study 11, the ladder rule (zero spend)

Register before anything is built. Instruments are pure functions over
numbers already in the fixtures and the MMKK declarations; no audio
needs re-rendering except for the subdivision test.

- **L-match** — `tempoLadderMatch(declared, detected, subdivision)`:
  accepts d ≈ x within ±3 (the quantization-aware tolerance registered
  in the MMKK arm), d ≈ 2x, d ≈ x/2 always; d ≈ 1.5x, d ≈ x/1.5 only
  when `subdivision === 3`. Two variants registered side by side:
  **L-gated** (as above) and **L-open** (3:2 rungs always), so the
  gate's cost is measured, not assumed.
- **S-sub** — the subdivision test: energy of the onset
  autocorrelation at lag/3 versus lag/2 (and at 3·lag vs 2·lag),
  decision rule and threshold registered; input the summed envelope
  D-prod already computes.

Corpus: the 35 Study 10 band items (truth tempo, meter; 4 compound
items, 2 swing, 4 octave-boundary), the 21 Study 9 items, and the
MMKK declarations (4 songs). Plus a **wrong-tempo set** built
mechanically, no new audio: each item's true tempo paired with
declared values that are genuinely wrong (±7 %, ±12 %, ×1.5 on a
straight-meter item, ×1.33, ×0.8), so the false-accept rate has
something to accept.

Measures, paired per item:

- **Octave-class recovery**: of D-prod's octave-family misses (both 6/8
  lilts, contrast-c, mop-heart, peaceful-dreams, the dense half-time
  item), how many L-gated and L-open each turn from "mismatch" into
  "matches at rung r", and whether r is the right rung.
- **False accepts**: on the wrong-tempo set, how many wrong declared
  values each variant accepts, by perturbation class. The 1.5× rows on
  straight-meter items are the ones that separate L-gated from L-open.
- **Subdivision accuracy**: S-sub on the 4 compound items (expected 3)
  and on every straight item (expected 2), with the swing items
  reported apart (swing is a 3-feel at the sub-beat and the honest
  hard case).
- **The derived meter**: grouping × subdivision against truth on all
  35, versus today's 4/4-or-3/4 vote; the 6/8 items are the gain, any
  straight item lost is the cost.
- **Production surfaces, dry-run**: replay `settingsChartDisagreement`
  with L-gated on Study 7's cells and the MMKK charts: which warnings
  disappear (112 vs 224 class) and whether any true disagreement is
  silenced.

Gates (the bench restates against final counts):

- G1: L-gated accepts ≥ 4 of the 6 known octave-family misses at the
  correct rung, and accepts 0 wrong-tempo rows outside the 3:2 class.
- G2: L-gated's false accepts on the 1.5× straight-meter rows are 0;
  L-open's are reported (predicted > 0, the reason for the gate).
- G3: S-sub names subdivision 3 on ≥ 3 of 4 compound items and 2 on
  every straight item outside the swing pair.
- G4: no true settings-versus-chart disagreement in the Study 7 cells
  is silenced.

Predictions: G1 and G3 pass; G2 passes for L-gated and L-open accepts
2–4 of the 1.5× rows, which is the finding that justifies gating; G4
passes. The swing items are where S-sub is most likely to say 3 on a
straight meter, and if it does, swing needs its own flag before the
6/8 output ships.

If all four pass, items 1–4 of the build list ship together behind
the usual gates, as a minor release with no migration. If G2 fails
for L-gated too, the ladder ships without the 3:2 rungs and the
compound-meter class stays a known limitation with the 6/8 output as
its partial fix.

## Addendum (2026-10-29, later): the rule as built, for Study 11's S-sub

Kevin asked for the four build items to proceed in parallel with
Study 11. The implementation changed the subdivision test from the
sketch in §3, so S-sub should pin the SHIPPED rule, not the sketch.
Source: stem-shovel `src/lib/audio/analysis.ts` (`subdivisionOf`,
`tempoAlternates`), on `dev` once the commit lands (this addendum will
be followed by the commit hash in FINDINGS.md); constants and their
reasons are commented in the file.

On the autocorrelation `ac` of the summed onset envelope, with L the
detected beat lag (each `ac` taken as the best within ±1 frame, as
`meterLean` does):

1. **Sub-beat test:** compound when
   `ac(L/3) > 1.15 · ac(L/2)` AND `ac(L/3) ≥ 0.55 · ac(L)`.
   The sketch's second clause (L/3 against 2L/3) cannot separate swing
   from triplets: an envelope periodic at L has ac(τ) = ac(L − τ). The
   share-of-beat floor does: running triplets measure 0.67–0.69 of
   ac(L), swing at most 0.5 in theory and 0.46–0.50 measured. Thin
   margin; Study 11's swing items are the test.
2. **Super-beat test** (when 1 did not fire): compound when
   `ac(1.5L) > 1.05 · ac(2L)` AND `ac(1.5L) ≥ 0.2 · ac(L)`; the pulse is
   then re-picked at 1.5L (refined by `refinePeriod`), i.e. bpm/1.5.
   The margin is 1.05, not the sketched 1.15: the log-compressed
   envelope flattens accents, so a 6/8 whose dotted beats are 4×
   louder reaches only 1.02–1.12, while straight eighths cannot exceed
   1.0 and measure 0.91–0.97. This margin is the false-6/8 risk on real
   recordings and the number Study 11 should stress.
3. Either firing → `subdivision: 3`, meter `"6/8"`; else 2 and today's
   3/4-or-4/4 vote. Silence now yields bpm 0 (it used to return the
   range's first lag, 214.3).

Ladder (`tempoLadderMatch`): as §3 L-gated — direct, ×2, ×½ always;
×1.5, ×⅔ only with compound evidence (subdivision 3 or a compound meter
on either side); tolerance 3 bpm absolute by default, and
`settingsChartDisagreement` uses max(3 bpm, 2 %). Alternates text omits
the 3:2 rungs unless subdivision is 3 (straight eighths correlate at
three eighths, 1.02–1.10 on a 4/4 at 120).

Request: register S-sub as rule 1+2 above with these constants, and
add a swing-stress line (swing ratios 0.6–0.7 at several tempi) to the
subdivision measure, since 0.55 is the thinnest margin in the build.
