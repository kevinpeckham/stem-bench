# BRIEF — stem-bench Study 2: does reasoning help a model write a drum beat?

**Pre-registration, committed before any scored run.**

stem-shovel's Text-to-Beat runs its model with reasoning OFF, on an
empirical claim hard-coded as a comment in production
(src/lib/server/textToBeat.ts, v0.143.0): "a thinking model spends two
or three minutes on a drum pattern and gets it no better, while the same
model with reasoning off answers in a few seconds." The claim has never
been measured. Study 1's Amendment 1 previewed half of it for free
(kimi-k2.6 with default reasoning spent its whole output budget thinking
and returned nothing); this study measures both halves — quality and
economics — under a protocol registered in advance.

## System under test

The production Text-to-Beat call, ported verbatim and pinned by
tests/study2.test.ts at stem-shovel v0.143.0: the system prompt
(src/study2/prompt.ts, including the starting-pattern example rows), the
reply schema and validity pipeline with production's exact error
messages (src/study2/validate.ts; the port stops before
drumPresetProject, which cannot reject a schema-valid, length-checked
reply), the retry-with-reason (one more go, production's message
verbatim), and the gateway's OpenAI-style REST endpoint production uses
for this feature. Neither arm sends temperature: production does not
(disclosed; sampling nondeterminism is mitigated by 25 paired tasks, and
noted as a limitation).

## Arms (2): the reasoning field is the variable

- **R-off** — production verbatim: `reasoning: { effort: "none" }`,
  max_tokens 1500.
- **R-default** — the reasoning field omitted (the provider's default),
  max_tokens 8000. The raised cap is the one registered asymmetry: a
  thinking model needs room to finish, and production's 1500 would
  conflate budget exhaustion with reasoning quality (Study 1 Amendment
  1). Reasoning tokens bill as output tokens; that cost is part of what
  the arm measures.

If a model rejects `effort: "none"` outright (an API error, not an
answer), its R-off runs the lowest reasoning setting that model
supports, disclosed per model — the Amendment 1 rule, registered this
time instead of discovered.

## Corpus (25 tasks, hand-authored, committed in corpus/beats.json)

Beat descriptions across styles and meters (4/4 at 8/16/32 steps, 3/4
and 6/8 at 12), always on an open pattern (voices: [], the production
fresh-machine case). Each task carries mechanical checks tied ONLY to
what its prompt explicitly asks: a stated bpm, a named drum present or
absent, hits on named steps, a stated swing/humanize/kit/effect. Style
conventions the prompt leaves implicit are never checked (the AP
lesson applied in advance: no analyst-authored taste rubric anywhere).
49 checks total across 25 tasks.

(Correction, 2026-10-22, before any analysis was read: this brief's
first commit miscounted its own committed corpus as "24 tasks, 83
checks"; the corpus — committed before any scored run and unchanged —
has 25 tasks and 49 checks. The prose is corrected to match the
registration artifact; nothing scored changed.)

## Grading (mechanical, committed, tested)

Per cell: validity (production's own validator is the grader — first-try
and after the retry), the checks (src/grading/beatChecks.ts), latency
and token counts per attempt. **Combined score** per task: 0 if no valid
reply after the retry, else checks passed / checks total.

## Models and cells

50 cells per model (25 tasks × 2 arms), plus retries inside cells.

- **Pilot:** `moonshotai/kimi-k2.6` — the production model and the
  claim's subject. Fence **$8** (the R-default arm pays for reasoning;
  Amendment 1 measured ~$0.14/cell of pure thinking at the 8k cap).
  Authorized by Kevin's "register ... then proceed with the study"
  (2026-10-22).
- **Matrix:** `anthropic/claude-fable-5-1`, `anthropic/claude-haiku-4.5`,
  `google/gemini-3.5-flash`, `openai/gpt-oss-120b`. Fence **$20**. Runs
  only on Kevin's explicit go-ahead after the pilot's results are
  committed.

## Hypotheses

- **S2-H1 (the production claim — the gate, comparative per the AR
  protocol):** for the production model, R-default does NOT beat R-off
  on combined score: paired per task, sign-flip permutation, the claim
  is UPHELD when R-default's mean advantage is both under 3 points and
  not significant at p < .05; REFUTED when R-default is significantly
  better by 3+ points (that would be the surprise worth publishing
  loudest). The same read is reported per matrix model, registered as
  reads, not gates.
- **S2-H2 (economics — registered read):** latency and output-token
  multiples, R-default over R-off, per model. The claim's other half
  predicts large multiples for the open-weight reasoners.
- **S2-H3 (descriptive):** first-try validity, retry rescue rate, and
  the retry's economics per arm and model.
- **S2-H4 (descriptive):** per-check-kind failure counts — which
  explicit instructions models miss when writing beats.

## Predictions (registered before any scored run)

1. The claim is upheld for kimi: R-off within 3 points of R-default,
   at a fraction of the latency and tokens (≥ 5× both).
2. First-try validity ≥ 85% in both arms for kimi; the retry rescues
   most of the rest.
3. Across the matrix, no model gains 3+ points significant from
   reasoning; fable's adaptive thinking is the most plausible
   exception, and if anyone pays for reasoning usefully it is on the
   step-indexed checks (hitsOnAll, accentOnlyAt — counting positions
   is where thinking could help).
4. gpt-oss and kimi show the largest token multiples (≥ 5×); haiku and
   gemini modest (≤ 3×).

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Claim upheld for kimi, economics large | The hard-coded production choice is now a measured one; the comment in textToBeat.ts gets a citation instead of an anecdote |
| Claim refuted for kimi | Production is leaving quality on the table for latency; the product decision (seconds vs minutes) may still stand, but it becomes an explicit trade, and the brief's "gets it no better" line must be corrected |
| Reasoning helps only on step-indexed checks | The useful framing is task-class, not on/off: route counting-heavy requests to a thinking call |
| A model rejects effort none | Run its lowest supported setting, disclose, and record the gateway's normalization behavior per provider — useful operational knowledge on its own |
| Validity ceilings everywhere | The checks carry the study; if those also ceiling, the corpus was too easy and a harder Study 2a (constraint-dense prompts) gets registered rather than re-reading this one |

## Disclosure

The analyst model is Claude Fable 5; the matrix includes
claude-fable-5-1. All grading is mechanical, committed and tested before
any scored run (the validity grader is production's own validator,
ported and pinned). The corpus prompts were authored by the analyst; the
checks verify only explicit prompt text, so no taste judgment enters any
score.
