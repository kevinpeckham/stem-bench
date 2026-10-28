# BRIEF — stem-bench Study 7: the redesigned song-check, re-measured

**Pre-registration, committed before any scored run.**

Study 4 found the song-check reading its candidates instead of hearing
the mix; stem-shovel redesigned the feature in response (v0.185–0.192):
the call now requires a chart, casts the model as a chart reader with
the recording playing ("Do not estimate a tempo by ear"), passes the
song's tempo/meter as bar-following facts rather than candidates to
confirm, never passes the key, drops the confidence field, and gates
what reaches the song's settings through `chartStatedAnswer` (tempo
and meter survive only where the chart text states them). Study 4's
published findings now describe a retired design. Study 7 measures the
replacement: does the redesign close the deference failure, and does
the new chord-only chart path (the band's own chart document, no key
signatures, no tempo marks) behave as designed?

## System under test

The v0.192.0 call, ported verbatim and pinned (stem-shovel origin/dev
commit 95ed19aa: `askAiAboutMix`, both `CHART_NOTE` branches,
`chartStatedAnswer`, the confidence-less `AnswerSchema`) —
tests/study7.test.ts. Registered deviations as in Study 4: temperature
0, maxOutputTokens 2000, maxRetries 4 on transport (production sets
none). The bench sends chart text only (never a score file part), as
production's summary path does.

## The fixture (reused, committed)

Study 4's 12 metered MP3 mixes (truth by construction; pulseless items
are excluded — their probe belonged to the retired chartless path,
which the product no longer runs). Score-arm charts are fixture5's
truth summaries (tempo marks, time signatures, key signatures —
`chartStatedAnswer` keeps tempo/meter). Chord-arm charts come from the
committed band-chart generator (src/study7/chordChart.ts): section
headings and bar lines only, with a TESTED structural guarantee that
no generated chart matches the production tempo/meter regexes — so
the application layer must null both.

## Arms (4) × 12 items × 2 models

- **R-true** — score summary + TRUE settings (the happy path).
- **R-wrong** — score summary + WRONG settings (Study 4's transforms:
  tempo octave-trapped, meter rotated). The chart states the truth;
  the settings lie; the redesign claims the lie cannot reach the song.
- **R-chord** — band chart + TRUE settings: key from chords alone,
  tempo/meter correctly refused.
- **R-chord-wrong** — band chart + WRONG settings: the lie has no
  chart to be checked against; the application layer must still
  refuse tempo/meter structurally, and placement (bar-following on a
  wrong tempo) degrades measurably or does not.

Models: `google/gemini-3-flash` (production) and
`google/gemini-3.5-flash` (robustness). 96 cells. Fence **$5**
(estimated well under $1). Single phase; authorized by Kevin's "let's
proceed with Study 7" (2026-10-28).

## Grading (mechanical, committed, tested)

Two levels per cell. **RAW** (chart obedience): tempo/meter against
the chart's statements (score arms: truth; chord arms: null/"free"
are the only correct answers — a number is an invented tempo), key
and change placement against truth (±3 bpm, ±4 s as in Study 4), and
the echo reads (raw answer matching the wrong setting). **APPLIED**
(what `chartStatedAnswer` lets through): correctness against truth in
score arms; correct refusal (null) in chord arms; wrong-setting
survival in wrong arms.

## Gates (production model; the Study 3 lesson — no every-model clause)

- **S7-G1 (the redesign's central claim):** wrong settings surviving
  to APPLICATION ≤ 1 of 24 wrong-arm cells per field. Anchor: Study
  4's L-wrong, where the old design echoed wrong candidates 10–12/12
  straight into the answer.
- **S7-G2 (the no-ear-estimates instruction):** invented tempos in
  chord arms ≤ 1 of 24 — the Study 4 invented-tempo probe reborn
  inside the new design's own terms.
- **The study gate: S7-G1 AND S7-G2.**

## Registered reads

Raw echo rates under wrong settings (the residual risk the app layer
guards; Study 4's anchor makes this the before/after picture); key
accuracy from chords alone vs from signatures; keyChange detection
and placement per arm, including degradation under wrong-tempo
bar-following (R-chord-wrong vs R-chord); cost per call.

## Predictions (registered before any scored run)

1. Both gates pass: the application layer is structural for chord
   arms and the chart-transcription instruction holds for score arms.
2. Raw echo under R-wrong drops far below Study 4's 10–12/12 (the
   instruction changed from "confirm or correct" to "the chart's
   mark") — predicted ≤ 4/12 per field — but does NOT reach zero:
   the settings text still anchors.
3. Key from chords alone lands 10–12/12 (Study 4 saw strong
   harmony-from-text); keyChange placement under wrong tempo degrades
   by at least one item (bar-following arithmetic inherits the lie).
4. 3.5-flash echoes less than production (its Study 4 independence
   advantage persists under the new prompt).

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Both gates pass, echo drops | The redesign is measured sound: publish as the Study 4 production-response loop closed, with the echo residual as the number to watch on any model swap |
| S7-G1 fails | `chartStatedAnswer`'s regexes leak a wrong value through — a code path finding, file it with anatomy |
| S7-G2 fails | "Do not estimate a tempo by ear" does not survive contact with audio — the Study 2 accept-and-disobey lesson in a third modality; the chord path needs the applied-layer null regardless (it has it), and the raw answer should not be shown |
| Placement collapses under wrong tempo | Bar-following inherits settings errors: ship guidance is to surface placement as approximate when settings and chart disagree |

## Disclosure

Analyst Claude Fable 5; no Anthropic model measured (no audio on the
gateway). Every grade is mechanical, committed and tested before any
scored run; the chord-chart generator's structural guarantee is
asserted by test rather than assumed.
