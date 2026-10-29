# BRIEF — stem-bench Study 9: stem-aware analysis (draft)

**DRAFT, not yet registered.** Written by the stem-shovel side
(2026-10-29) for the stem-bench agent to finish designing, register by
commit, pilot and run under the program's rules (CLAUDE.md). The
section "Left to the bench" lists what this draft leaves open; nothing
here is a result.

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
- **Q5, dropped.** A spectrogram image to the model was considered;
  the landscape review (docs/LANDSCAPE-2026-10-29.md, §4) found no
  evidence that vision models read pitch, key or structure from
  spectrograms, so it is not funded. The review also suggests the
  study after this one: neural MIR baselines (Beat This!, LinkSeg, a
  key CNN, ChordMini) against D-prod.

## Fixture (extend, committed before registration)

- **Per-part rendering.** Extend `src/study4/synth4.ts` so `renderMix`
  can return the parts separately — at least drums, bass and comp
  (strum or pad) — with a test that their float sum equals the existing
  mix within 1e-6 per sample for every committed Study 4/7/8 spec, so
  every existing truth (tempo, meter, key, changes, sections) carries
  over unchanged and the existing fixtures stay byte-identical.
- **Unhelpful stems (new specs, truth by construction).** A handful of
  items add a fourth part designed to mislead the summed envelope: a
  rubato lead line (free-time melody, no grid), a slow pad with
  arbitrary onsets, a seeded noise/room track, and a comp whose
  subdivision suggests double time against the drums. Pulseless items
  stay excluded as in Studies 7 and 8.
- **Real stems (secondary arm).** Kevin holds exclusive rights to
  MMKK's original songs, whose true stems and band-declared settings
  are on Stem Shovel; Study 10's brief registers the exception and the
  fetch. D-activity, D-stem-tempo and D-key-agree run on them as a
  secondary arm, graded against the band's declarations, with the
  chart's section marks as the section truth.
- **Stem order and names are hidden** from every instrument (stems are
  `s1…sN`, shuffled per item with a seed): the detector must find the
  rhythm section, not be told.

## Instruments (committed, pinned by test)

- **D-prod** — production's detector ported verbatim: `extractFeatures`
  per stem, `combineFeatures`, `analyse` (tempo, meter, key) from
  stem-shovel `src/lib/audio/analysis.ts` at a99fb18, plus
  `extractKeySegments`/`detectKeys` if key changes are scored. The
  baseline every variant is compared with.
- **D-stem-tempo** — per-stem autocorrelation with production's
  detrending and refinement, reporting each stem's bpm and peak
  sharpness; the answer is the sharpest stem's; a registered
  disagreement flag when the top two stems' tempos differ by an octave.
- **D-activity** — per-bar RMS per stem on the truth grid (the bench
  knows the bars; a production port would use the detected tempo and
  the agent should register which grid the instrument gets), a stem
  "active" above a registered fraction of its own peak RMS, a boundary
  where the active set changes and holds for ≥ 2 bars; names not
  attempted (Study 8 showed naming belongs to the chart).
- **D-key-agree** — production's `detectKey` per stem, weighted as
  `combineFeatures` weights chroma; the answer is the production key,
  the new output an agreement score (fraction of tonal stems whose key
  is the answer or its relative); compared with production's confidence
  as a separator of right from wrong.
- **AI side arm (Q4)** — production's song-check question, chartless,
  as Study 4's blind arm, over the mix and over the harmonic stem,
  listener model(s) as Study 8 (google/gemini-3-flash, 3.5-flash).

## Registered measures (draft)

- Tempo: exact within 1 bpm; octave errors counted apart; null
  answers on pulseless items counted correct as in Study 4.
- Sections: Study 8's `grade8` — boundaries within ±4 s, false
  boundaries per item, split by contrast / harmonic-shift / uniform
  items.
- Key: accuracy; for Q3, the mean score on right answers minus the
  mean on wrong ones for each confidence measure (and a simple
  rank statistic the agent registers).
- Every measure paired per item against D-prod.

## Gates (draft, for the agent to confirm against the fixture counts)

- **G1 (Q1):** D-activity finds ≥ the Study 8 chart-arm boundary recall
  on contrast items and places **0** boundaries on single-section
  loops.
- **G2 (Q2):** D-stem-tempo is exact on every item D-prod is exact on,
  and on ≥ half the unhelpful-stem items where D-prod is not; no new
  octave errors.
- **G3 (Q3):** the agreement score's right-minus-wrong separation
  exceeds production confidence's.
- Q4 and Q5 carry no gate: measured recommendations either way.

## Predictions (draft; the agent re-registers them in its own words)

1. D-activity passes G1: stem activity IS the texture the model
   heard, and a set-change detector cannot invent structure on a
   uniform loop. Harmonic-shift boundaries with no arrangement change
   stay invisible to it, as they were to the model (those belong to
   the chart).
2. D-stem-tempo equals D-prod on clean items and wins on the rubato
   and noise items; the double-time comp item is where it may lose,
   choosing the comp's sharper half-period — the disagreement flag
   fires there, which is the point of registering it.
3. Agreement separates better than the correlation margin but
   modestly; the relative-minor case is where production's margin is
   smallest.
4. Q4: the stem does not help the model name the key (≤ 1 item
   changes), consistent with Studies 4 and 7.

## Spend fences (draft)

- D-prod, D-stem-tempo, D-activity, D-key-agree: zero model spend.
- Q4 pilot: 6 items × 2 conditions × 1 model, ≈ $0.50, on the
  registering go-ahead; matrix (all pulsed items, 2 models) ≈ $4, on
  Kevin's go-ahead after the pilot is committed.
- Cap $5 in all.

## Left to the bench

- The per-part renderer's exact parts and the byte-identity test.
- The unhelpful-stem specs (how many; the agent chooses ≥ 6).
- The D-activity grid (truth bars vs detected tempo) and thresholds,
  fixed before the first run.
- Whether key changes (Study 4's shift/mod items) are scored per stem.
- Gate counts and predictions restated against the final fixture.
- Production fidelity: the port's commit is a99fb18; register any
  deviation (sample rate: production analyzes 32 kHz AudioBuffers, the
  bench renders 22050 Hz; `extractFeatures` must be checked at that
  rate and the deviation registered).

## What production does with the result

A D-activity pass ships as a stem-activity section detector in the
browser (code, free), with the model kept for names and chart
placement; a D-stem-tempo pass replaces the summed envelope; a Q3 pass
becomes the confidence the song page shows. A fail on any of them is
recorded in stem-shovel's FINDINGS.md and the mix stays the input.

## Disclosure

Analyst Claude Fable 5; the models measured in Q4 are Google's,
outside the analyst's family. Every grade is mechanical; D-prod is a
verbatim port pinned by test and does not chase stem-shovel changes
mid-study. Zero model calls before registration.
