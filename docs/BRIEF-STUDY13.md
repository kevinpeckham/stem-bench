# BRIEF — stem-bench Study 13: the chord path on real recordings, and the conditional reconciler

**REGISTERED.** The candidates memo's recommendation B, reshaped after
Kevin's question "would the reconciler still have value?" into a
two-arm registered conditional: first MEASURE the thing the reconciler
would improve, then run the reconciler only if there is something to
improve. Study 12's outputs made this possible — the bar grid in
recording seconds (alignment) and bar-aligned chord truth on real
audio (the letter-lands transcription) did not exist when the memo was
written.

## Arm 1 — production's chord path on real recordings (zero spend)

The first real-audio measurement of the path that makes chord drafts:
Basic Pitch (the committed Study 1 pipeline, verbatim) over the song's
summed NON-DRUM stems (drums excluded by label, disclosed — the
matcher consumes harmonic notes), then the v0.142 template matcher,
on a bar grid taken from Study 12's chart alignment. Scored against
the chart transcription (corpus/mmkk-charts.json) with two registered
allowances: a two-chord bar counts on either chord (strict-first
reported beside it), and a power-chord truth (X5) accepts X, Xm or X5
at the same root — a power chord declares no third, so no detector can
be wrong about one (allowance usage reported).

- **letter-lands is the gated item** (the clean transcription);
  **eat-all-the-clocks exploratory** (its −26 s reading mismatch is
  disclosed; per-section behavior reported).
- No gate — arm 1 is a measurement. Its registered role is the
  **trigger: arm 2 runs iff letter-lands accuracy < 90 %**, else arm 2
  is SKIPPED by rule and the study closes as the baseline measurement
  alone.

## Arm 2 — the reconciler (conditional; pilot ≈ $0.30, fence $3)

One text-only LLM pass per song: the declared key, meter and tempo,
and per bar the detected chord plus the transcribed notes (production's
own `describeBars` lines, the Study 1 format). The model corrects
chords ONLY where the notes support it, answers N.C. on silent bars,
returns JSON. Prompt registered verbatim in
src/study13/grading13.ts and pinned by test; registered deviations as
ever (temperature 0, maxOutputTokens 4000, maxRetries 4). Models:
anthropic/claude-fable-5-1 (the production chart-draft model) and
google/gemini-3.5-flash (the cheap contrast). Graded mechanically with
the same rules as arm 1; fixes (wrong→right) and breaks (right→wrong)
counted separately.

- **S13-G2** (per model, on letter-lands): reconciled accuracy ≥ the
  arm-1 baseline AND fixes ≥ 2 × breaks. The double-fix clause is the
  program's answer to the Study 9 agreement trap: a consistency pass
  that confidently smooths correct oddities must fail the gate, not
  hide inside a net-zero.
- The literature anchor (disclosed, not relied on): the ISMIR 2025
  symbol-reconciliation result, +1–3 WCSR and sevenths 67.2 → 74.6
  from an ~80 base [landscape A16].

## Predictions (the bench's)

1. The trigger FIRES: the matcher lands in the 60s–80s on real audio,
   not the synthetic 95.8 % — real timbres, voicings and synth pads
   are what the 80–83 literature plateau is made of. The power-chord
   allowance does real work (the chart is mostly power chords; the
   matcher will answer full triads).
2. Arm 2, fable: passes S13-G2 — the key plus note evidence is enough
   symbol context for a near-ceiling reader to fix root-level and
   quality-level mistakes at better than 2:1. Changed-bar count stays
   modest (< a third of bars) because the prompt prefers the detector
   on ambiguity.
3. Arm 2, gemini-3.5-flash: coin flip on the 2:1 clause; if it fails,
   it fails by over-editing (more changed bars than fable), the
   pattern every prior study of that family suggests.
4. eat-all-the-clocks (exploratory) shows the same direction with
   noisier numbers, degraded where Study 12 showed its transcription
   is wrong — those bars' "truth" is partly the bench's misreading,
   which is why it carries no gate.

## Spend fences

Arm 1: zero. Arm 2 pilot: 4 calls (2 songs × 2 models), ≈ $0.30, on
the registering go-ahead given the trigger; anything further (more
songs, more models) needs Kevin's go-ahead. Cap $3.

## What production does with the result

Arm 1's number is the first measurement of chord-draft quality on
real user-shaped audio — wanted regardless. If arm 2 passes for the
production model, the reconciler ships as a cheap text-only pass in
the chart-draft job (symbols in, symbols out, the model never hears
anything), gated like everything else by its own measured fix/break
ratio. If the trigger never fires, the finding is that the matcher
needs no help, and the question closes the way Study 10 closed the
detector-swap question.

## Disclosure

Analyst Claude Fable 5, and arm 2 measures claude-fable-5-1 (the same
family): tolerable as in Study 1 because every grade is mechanical,
committed and tested before any call. The MMKK chart transcriptions
and alignment are Study 12's committed artifacts, unchanged.
