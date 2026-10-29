# BRIEF — stem-bench Study 9: stem-aware analysis

**REGISTERED.** Drafted by the stem-shovel side (2026-10-29, commit
ea2b381); finished and registered by the bench the same day. The
bench's design decisions are marked ⟨bench⟩ throughout; the draft's
"Left to the bench" list is resolved in "Bench decisions" below.
Registration precedes every scored result; the one disclosed exception
is a development smoke test of the four instruments on a single item
(contrast-b, zero model spend), whose values are pinned in
tests/study9.test.ts so the port cannot drift.

## Why

Studies 4, 7 and 8 settled what the listening models can do with a
rendered mix: they do not hear tempo or key (Study 4 blind: a genre
prior at confidence 1.0; Study 7: the settings echoed 47/47), they do
hear arrangement texture (Study 8 contrast items 7/8 blind) and they
invent form where there is none (3–6 false boundaries on uniform
loops). Production therefore anchors every model answer to the chart.

What no study has measured is the signal production never uses: the
**stems**. A stem-shovel song is uploaded as separate tracks, and the
browser detector (`src/lib/audio/analysis.ts`, a99fb18) decodes each
one, yet it is only partly stem-aware: the meter is a per-stem vote
weighted by each stem's lean, and the key's chroma is weighted by each
stem's tonality squared (drums drop out unnamed), but the **tempo**
autocorrelates the SUM of every stem's onsets, and the two AI features
(`askAiAboutMix`, `detectSectionsWithAi`) receive only the mix. The
question is whether reading stems individually — discarding unhelpful
ones, comparing the rest, choosing a best answer — beats the mix, and
where. Each outcome is a finding: a stem-aware detector that wins
ships as code at zero model cost; one that does not tells production
the mix is enough.

## Questions

- **Q1, sections from stem activity.** Which stems sound in each bar
  is the arrangement, measured exactly. Does a boundary detector on the
  per-bar active-stem set find the Study 8 truth boundaries at least as
  well as the chart-anchored model did, with no invented boundaries on
  single-section loops?
- **Q2, tempo from the most rhythmic stem.** Does autocorrelating each
  stem's onsets and keeping the sharpest peak equal or beat the summed
  envelope, especially when an arrhythmic stem (a rubato lead, a pad,
  a room/noise track) is in the batch? Does disagreement between stems
  predict the octave (half/double-time) errors?
- **Q3, key confidence from agreement.** Per-stem keys agreeing (or
  landing on the relative minor) — does an agreement score separate
  right key answers from wrong ones better than the production
  confidence (the profile-correlation margin)?
- **Q4, side arm: one harmonic stem to the model.** Does production's
  listener model name the key from an isolated bass-plus-comp stem
  better than from the mix? Studies 4 and 7 predict no; this is the
  cheapest way to close the question.
- **Q5 ⟨bench⟩: DEFERRED.** The spectrogram-image arm is out of this
  study; if it is ever run it is a Study 10 with its own registration.

## Fixture (committed with this brief)

- **Per-part rendering** ⟨bench⟩: `src/study9/parts.ts` `renderParts`
  makes the SAME synthesis calls as `renderMix`, in the same order on
  the same seeded stream, routed into drums / bass / comp (plus the
  optional `extra`), normalized once by the sum's peak.
  `renderMix` itself is untouched; tests/study9.test.ts pins the parts'
  float sum to `renderMix` within 1e-6 per sample for every committed
  spec, so every existing truth carries over and the committed MP3s
  stay what they were.
- **Items** ⟨bench⟩: the 15 pulsed Study 4/8 specs (6 loops, 6
  tempo/key-change items, 3 contrast items; the 2 pulseless items stay
  excluded as in Studies 7 and 8 — the ported detector has no null
  tempo path, so the Study 4 honesty measure does not apply to it)
  plus **6 misleading-stem specs** in corpus/mixes9.json (seeds 9000+i):
  rubato lead ×2 (one in 3/4), slow off-grid pad, seeded noise/room
  track, double-time comp ×2 (one over a pad-tempo 72 minor item). 21
  items in all; fixture9.json records truth, class, truth bar grid,
  section truth, stem order and MP3 paths.
- **Stem order and names are hidden** from every instrument: stems are
  shuffled per item by `stemOrder(n, seed)` (seeded Fisher–Yates,
  recorded in the fixture); the detector must find the rhythm section,
  not be told.

## Instruments (committed, pinned by test)

- **D-prod** — production's detector ported verbatim in
  `src/study9/analysis.ts` from stem-shovel `src/lib/audio/analysis.ts`
  at a99fb18: `extractFeatures` per stem, `combineFeatures`, `analyse`
  (tempo, meter, key). The baseline every variant is compared with.
- **D-stem-tempo** — `analyse` per stem; the answer is the stem with
  the highest tempo confidence (production's own peak-sharpness
  measure); a registered disagreement flag when the top two stems'
  tempos sit within 6% of a 2.0 ratio.
- **D-activity** — per-bar RMS per stem; a stem is active in a bar
  when its RMS is ≥ 0.2 of its own peak bar RMS (ACTIVE_FRACTION); a
  boundary where the active-stem set changes and the new set holds
  ≥ 2 bars (HOLD_BARS). ⟨bench⟩ Both registered grids are run: the
  **truth bar grid** (primary — the bench knows the bars) and the
  **detected grid** (secondary — D-prod's own tempo and meter anchored
  at 0, what a production port would have). Names not attempted.
- **D-key-agree** — the answer is production's key from the combined
  features; the new output is the fraction of tonal stems (tonality ≥
  0.35 of the max, production's own reuse threshold) whose own
  `detectKey` lands on the answer or its relative.
- **AI side arm (Q4)** — production's song-check question, chartless
  and candidate-less: exactly Study 4's L-blind cell over the mix MP3
  and over the harmonic stem (bass + comp) MP3.

## Registered measures

- Tempo: exact within 1 bpm of the initial tempo or ⟨bench⟩ any
  section's tempo on tempo-change items (the detector reports one
  number for a song that has two; either is a truth); octave errors
  (within 1 bpm of half or double a truth tempo) counted apart.
- Sections: boundaries within ±4 s (grade8's tolerance), false
  boundaries per item, split by contrast / change / loop / mislead.
- Key: right when it names the item's key or ⟨bench⟩ any section's key
  on modulating items; for Q3, mean score on right answers minus mean
  on wrong for each confidence measure, plus ⟨bench⟩ AUC (the
  probability a random right answer outscores a random wrong one,
  ties ½).
- Every measure paired per item against D-prod.
- ⟨bench⟩ Key changes are NOT scored per stem (deferred; the global
  key is the production surface being measured).

## Gates (final, against the 21-item fixture)

- **S9-G1 (Q1):** D-activity on the truth grid finds **8/8** contrast
  boundaries (the Study 8 chart-arm recall on those items) and places
  **0** boundaries on the 6 single-section loops.
- **S9-G2 (Q2):** D-stem-tempo is exact on every item D-prod is exact
  on (no regressions, and no regression may be an octave error), and
  on ≥ half the mislead items where D-prod is not exact. ⟨bench⟩ If
  D-prod errs on fewer than 2 mislead items the rescue clause is
  vacuous and the gate reduces to the no-regression clauses — reported
  as "the sum was robust", which is itself the shipping answer.
- **S9-G3 (Q3):** the agreement score's right-minus-wrong separation
  exceeds production confidence's AND its AUC is at least
  confidence's. ⟨bench⟩ If fewer than 3 key answers are wrong across
  the 21 items the gate is UNEVALUABLE on this corpus — reported as
  such, not failed (a separator cannot be measured without errors to
  separate).
- Q4 carries no gate: a measured recommendation either way.

## Predictions (the bench's, registered before any result)

1. S9-G1 passes: stem activity IS the texture the Study 8 models
   heard, and a set-change detector cannot invent structure on a
   uniform loop. The 6 change-item boundaries (tempo/key shifts with
   no arrangement change) stay invisible to it, as they were to the
   blind model — those belong to the chart.
2. D-prod survives the pad and noise extras (detrending and onset
   weighting absorb them) but errs on at least one double-comp item
   (the summed envelope's sharpest period halves); the rubato lead is
   the coin flip. D-stem-tempo is exact wherever D-prod is and on the
   double-comp items too; the octave flag fires on both double-comp
   items — and also benignly on clean items whose bass walks in half
   time (disclosed: it fired on the contrast-b smoke).
3. Production key detection is at or near 21/21 on this synthetic
   corpus, so S9-G3 lands UNEVALUABLE; the agreement score is reported
   descriptively (its floor should sit on the mislead items, whose
   extra stem is atonal or rhythm-only).
4. Q4: the stem does not help the model name the key (≤ 1 item changes
   per model), consistent with Studies 4 and 7.

## Spend fences

- D-prod, D-stem-tempo, D-activity, D-key-agree: zero model spend.
- Q4 pilot ⟨bench⟩: the 6 registered items (drift-4a, waltz-a,
  contrast-b, mislead-rubato, mislead-double, mislead-pad) × 2
  conditions × google/gemini-3-flash = 12 calls, ≈ $0.15, on the
  registering go-ahead; matrix: all 21 items × 2 conditions × the two
  Study 8 models = 84 calls, ≈ $1, on Kevin's go-ahead after the pilot
  is committed.
- Q5: deferred, no fence.
- Cap $8 in all.

## What production does with the result

A D-activity pass ships as a stem-activity section detector in the
browser (code, free), with the model kept for names and chart
placement; a D-stem-tempo pass replaces the summed envelope; a Q3 pass
becomes the confidence the song page shows. A fail on any of them is
recorded in stem-shovel's FINDINGS.md and the mix stays the input.

## Production fidelity and registered deviations

- `src/study9/analysis.ts` is a verbatim port of stem-shovel
  `src/lib/audio/analysis.ts` at **a99fb18** (whole file, `@ts-nocheck`
  under the bench's stricter compiler); it does not chase stem-shovel
  changes mid-study.
- **Deviation (sample rate):** production analyzes 32 kHz
  AudioBuffers; the bench renders 22050 Hz. The port is rate-parametric
  (`fps = sampleRate / HOP`); tests/study9.test.ts pins `fps` at the
  bench rate, and the disclosed smoke run detected a clean item's
  tempo, meter and key exactly at 22050 Hz.
- The Q4 cell is Study 4's L-blind runner verbatim (registered
  deviations unchanged: temperature 0, maxOutputTokens 2000,
  maxRetries 4 on transport).

## Disclosure

Analyst Claude Fable 5; the models measured in Q4 are Google's,
outside the analyst's family. Every grade is mechanical; D-prod is a
verbatim port pinned by test. Zero model calls before registration;
the single pre-registration smoke of the zero-spend instruments on
contrast-b is disclosed above and pinned in the tests.

## Postscript (2026-10-29, after registration and run)

The stem-shovel side updated its draft upstream (20e82c9, 0e4a32c)
after the bench had taken ea2b381 as its base; the registered text
above is what the study ran against, and the upstream changes are
recorded here rather than merged:

- **Q5** was dropped there outright on the landscape review's evidence
  (docs/LANDSCAPE-2026-10-29.md §4: no evidence vision models read
  pitch, key or structure from spectrograms) — stronger than the
  bench's "deferred", same effect, and the bench adopts the review's
  conclusion: no spectrogram study will be registered.
- A **real-stems secondary arm** (the MMKK catalog, Kevin's exclusive
  rights, truth from the band's declarations) was added to the draft
  after registration. It was NOT run in Study 9 and its absence
  changes nothing registered here; it belongs to Study 10's scope,
  whose draft (docs/BRIEF-STUDY10.md) registers the rights exception
  and the fetch.
