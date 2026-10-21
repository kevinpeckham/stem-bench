# BRIEF — stem-bench Study 1: the hint-following study

**Pre-registration, committed before any scored run.**

stem-shovel's chart draft (`draftChartWithAi`, src/lib/server/aiDetect.ts)
gives the model each bar's Basic Pitch transcription AND a template
matcher's per-bar chord guess in brackets — "a hint, not an answer," the
prompt says. Nobody knows whether the model reads the noisy notes or
copies the hint. With synthesized songs the truth is known by
construction, so the hint can be ablated: present and right, present and
wrong, the production matcher's, or absent. If models mostly copy the
hint, the expensive frontier call is laundering a free template matcher's
guess; if they mostly read the notes, wrong hints should barely hurt.

## The fixture (committed before registration)

16 hand-authored songs (corpus/progressions.json): 440 bars, 4/4, one
chord per bar in stem-shovel's chart vocabulary, keys across the circle,
qualities covering the matcher's template set (major, m, 7, maj7, m7,
sus4, 7sus4, sus2, dim, 5) plus two N.C. stop bars. Each song is rendered
to audio by src/fixture/synth.ts (deterministic additive synthesis: low
root on beats 1 and 3, strummed quarter-note chord tones) and transcribed
by Basic Pitch with stem-shovel's exact model files and thresholds
(scripts/transcribe-child.mjs). The committed corpus/fixture.json holds,
per song, the transcribed notes, the production `describeBars` lines the
model reads, and the production matcher's per-bar chords.

The transcription is realistically noisy (that is the point: production
reads Basic Pitch on real stems). **Known at registration:** the matcher
baseline printed by `bun run fixture` — a fixture property computed
before any model run — so predictions below were written knowing roughly
how recoverable the chords are mechanically.

## Arms (4): the hint is the only variable

The system and question texts are production's verbatim (pinned by
tests/prompt.test.ts), the no-examples branch, no existing sections.
Arms differ ONLY in the bracket hints (and A-none drops the one system
sentence introducing them):

- **A-none** — no hints.
- **A-matcher** — the production template matcher's segments (the shipped
  product's condition).
- **A-correct** — the ground truth as hints.
- **A-wrong** — the registered transform of the truth: root up a perfect
  fourth, quality kept (D→G, Bm→Em, A7→D7) — a diatonically plausible
  neighbor the bar's notes contradict; N.C. stays N.C.

## Protocol

One gateway call per (song × arm × model): `generateText`, temperature 0
(the registered deviation from production, which leaves temperature
default), maxOutputTokens 8000, maxRetries 4 on transport only — no
retry on a malformed answer, matching production's chart draft. Anthropic
models get production's `thinking: adaptive, effort: low`. The answer is
parsed exactly as production parses it (first JSON object, production's
valibot schema); a cell that does not parse scores zero bars and is
counted as a parse failure.

## Grading (mechanical, committed, tested)

The answer's `chords` string is expanded ("%" repeats), padded or
truncated to the song's bar count (missing and extra bars are misses),
and each bar scored by the registered equivalence (src/grading/symbols.ts):
same root pitch class + same canonical quality; enharmonics equal;
unicode accidentals read; slash bass ignored (the synthesis plays root
position); quality aliases (min/maj/sus/Δ…) normalized to the template
vocabulary. N.C. matches only N.C.

## Models and cells

64 cells per model (16 songs × 4 arms).

- **Pilot:** `google/gemini-3.5-flash`. Fence **$3** (estimated well
  under $1). Authorized by Kevin's "Proceed with Study 1" (2026-10-21).
- **Matrix:** `anthropic/claude-fable-5-1` (production's DRAFT_MODEL),
  `anthropic/claude-haiku-4.5`, `moonshotai/kimi-k2.6` (stem-shovel's
  open-weight generator model), `openai/gpt-oss-120b`. Estimated $10–20;
  fence **$30**. Runs only on Kevin's explicit go-ahead after the pilot's
  results are committed.

## Hypotheses

- **S1-H1 (the mechanism — the gate):** paired per song, pooled per
  model: A-correct beats A-none, sign-flip permutation p < .05 for the
  pilot model and for the pooled matrix. A right hint must help; if it
  does not, the fixture or the protocol is defective (stop, fix,
  re-register).
- **S1-H2 (the headline — registered directional read):** A-wrong falls
  below A-none per model. The size of the drop is the measurement: a
  model that reads the notes loses little; a hint-copier loses the full
  distance between the hint's accuracy (0% on transformed bars) and its
  own.
- **S1-H3 (hint influence — registered descriptive):** on bars where the
  wrong hint differs from the truth: **copy rate** (answer equals the
  wrong hint) and **flip rate** (answer equals the wrong hint on bars
  that same model answered correctly in A-none). Flip rate is the
  headline number: it conditions on demonstrated ability to read the
  notes.
- **S1-H4 (the product read):** A-none accuracy per model against the
  committed template-matcher baseline — is the frontier call worth
  anything over the free matcher? And A-matcher against both: does the
  shipped combination beat either alone?
- **S1-H5 (disclosure — descriptive):** in A-wrong, cells whose `notes`
  field mentions the matcher/a disagreement (committed regex in
  analyze-study1.ts). A model that silently follows a wrong hint is worse
  for the product than one that flags the conflict.
- **Fixture-health stop rule:** if the pilot's A-correct bar accuracy is
  under 70%, stop — the transcription is too degraded to carry the
  ablation — fix the fixture, re-register, discard the pilot.

## Predictions (registered before any model run)

1. Every model beats the matcher baseline in A-none.
2. A-correct lands near ceiling (≥ 90%) for every model.
3. A-wrong hurts every model, with flip rates above 50% for the small
   models — the hint outweighs the notes — and the production model
   (fable-5-1) flipping least.
4. A-matcher sits between A-none and A-correct, closer to A-correct
   (the matcher is right more often than wrong on this fixture).
5. Disclosure is rare (< 20% of A-wrong cells) everywhere.

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Flip rates high everywhere | The chart draft launders the matcher: the hint drives the answer, and the matcher's errors become the model's. Ship guidance: drop the hint from the prompt, or feed it only where the matcher is confident |
| Flip rates low, A-wrong ≈ A-none | Models genuinely read transcription; the hint is decoration. Ship guidance: the hint is harmless but the matcher line can go — fewer tokens, same chart |
| A-correct ≫ A-none ≫ matcher baseline, flips moderate | The production design is roughly right: hints help, notes ground. Report the per-model flip rates so the DRAFT_MODEL choice rests on the measured number |
| A-none under the matcher baseline for some model | That model should not draft charts from notes at all — the free matcher beats it; an anti-recommendation by name |
| S1-H1 fails | Fixture or protocol defect; the stop-fix-re-register row applies |

## Amendment 1 (2026-10-21, before any scored haiku or kimi cell)

The first matrix run produced zero scored cells for two models, both
call-shape incompatibilities, not model answers:

- **haiku-4.5** rejected production's `thinking: adaptive` provider
  option ("adaptive thinking is not supported on this model") — 64 API
  errors, zero tokens billed. Amended: haiku runs with provider defaults;
  the fable thinking settings apply only to the production DRAFT_MODEL.
- **kimi-k2.6** spent the entire 8000-token output budget on reasoning
  in 62/64 cells and returned no JSON (the other 2 answered). This is
  the exact behavior stem-shovel's production kimi path works around
  (textToBeat.ts: the gateway REST endpoint with `reasoning: effort
  none`). Amended: kimi runs with production's own kimi call shape —
  REST, reasoning off, same 8000-token cap and temperature 0.

The failed runs are archived in results/archive/ as evidence (the kimi
one independently reproduces the production text-to-beat lesson at
$8.70 of reasoning tokens). Fable, gemini and gpt-oss results are
untouched; gates, grading and fences are unchanged.

## Amendment 2 (2026-10-21, registered before any A-matcher2 cell)

Production responded to Study 1 the same day: stem-shovel v0.142.0
(commit 69e015d6) replaced the matcher's flat "5" penalty with a
missing-tone penalty (each template tone carrying under 5% of the bar's
profile costs 0.08), citing this study. The bench re-ports the matcher
verbatim, pins the new behavior in tests, and re-runs ONLY the
shipped-configuration arm with the new hints:

- **Fixture:** `matcher2Segments` / `matcher2PerBar` computed by the
  v0.142.0 port over the STORED notes (scripts/rescore-fixture.ts) —
  nothing re-transcribed, the v0.141 fields kept, so Study 1's prompts
  and baseline stay reproducible. New hint accuracy **424/440 (96.4%)**
  vs 398/440 (90.5%). (stem-shovel's own re-score said 423 and 397: the
  one-bar difference is static-bloom's silent bar, truth N.C. and
  matcher N.C., which the registered equivalence counts correct.)
- **Arm A-matcher2:** identical protocol, the v0.142 hints, all five
  Study 1 models, 80 cells. Fence **$6**.
- **Registered reads:** (1) A-matcher2 vs A-matcher accuracy per model —
  prediction: the hint-followers (haiku, kimi) rise toward their
  A-correct ceilings, fable stays ≈ 99.8%; (2) matcher-error
  propagation — on bars where the respective hint is wrong, how often
  the model's answer IS the wrong hint — compared old vs new. The flip
  rate (the Study 1 headline) is a wrong-hint-arm metric, does not
  involve the matcher, and is unchanged by construction.
- Production also added a retry on empty completions (the morning-fuse
  case, also from this study). Study 1's registered no-retry rule
  stands; the A-matcher2 arm keeps it for comparability.

## Disclosure

The analyst model is Claude Fable 5; the matrix includes
claude-fable-5-1 (the same family). Every grade in this study is computed
by committed, tested, mechanical code; no model output is judged by any
model or person. Predictions were registered knowing the fixture's
matcher baseline (a mechanical property) and nothing else.
