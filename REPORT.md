# stem-bench REPORT

## Study 3 — can a model read sheet music? (2026-10-23)

**Question.** stem-shovel's chart-read has a model read an engraved
score into production's per-measure summary format; its model choice
and modality claim rested on one informal test. Registered in
docs/BRIEF-STUDY3.md: 11 Verovio-engraved scores (268 readable
measures, every element class, two 2-page items, an unreadable probe),
ground truth from the ported production `musicXmlSummary`, per-class
measure-exact and ±1 recall, arms D-pdf vs D-image, production's prompt
verbatim. Two pre-matrix amendments, both committed with anatomy:
transparent PNGs composited to black-on-black at the model, and the
probe needed re-calibration twice (vector PDFs stay crisp at any zoom;
150 px was still readable in fact — the pilot model read 7/8 chords
from a smear a human cannot, so unreadability probes must be calibrated
by model behavior, not eyesight). Total spend ≈ $2.1 of the $34 fences.

### Results (readable items; chord recall exact / keys ±1 pooled)

| Model | D-image chords | D-pdf chords | keys ±1 (gate read) | measure drift | probe |
|---|---|---|---|---|---|
| fable-5-1 (production) | **98.8%** | 76.0% | **91.7%** | 0.0 | honest ×2 |
| gemini-3.5-flash | 97.1% | 70.4% | 91.7% | 0.1 | **1 fabricated line** |
| opus-4.8 | 62.2% | 82.5% | 70.8% | 1.6 | honest, 1 format miss |
| haiku-4.5 | 1.2% | 0.0% | 70.8% | 14.9 | honest ×2 |

**Gate accounting: S3-H1 PASS, S3-H2 FAIL by letter — the study gate
fails via its every-model clause.** The production model passes
everything it is gated on: keys at exactly the registered 91.7% ≥ 90%,
near-perfect image reading (98.8% chord recall at 100% precision, zero
measure drift), and honest declines on the probe in both arms. S3-H2's
wording — "zero fabricated lines, EVERY model, both arms" — fails via
the pilot model: shown the 80 px smear as an image, gemini wrote
`m1 key C major 4/4` under an invented title instead of the Note
declaration (its PDF arm declined honestly; the archived 150 px run
also holds its full fabrication signature, a confident 0/8 progression).
The registration lesson, now recurring: a gate quantified over every
model makes the weakest model the gate — the AR/S2 lesson in a third
costume. Published as failed.

### The findings

1. **Frontier vision models read sheet music.** Fable reads engraved
   notation from a clean PNG at 98.8% exact chord recall with perfect
   precision and zero measure-count drift, at roughly $0.06 a score.
   The production anecdote ("read as text, the keys are plain") is
   upheld under measurement, and chart-read's model choice is validated
   against two tiers and a competitor.
2. **The PDF ingestion path, not notation reading, is the bottleneck.**
   Three of four models lose 20+ points of chord recall moving from
   PNG to PDF of the identical page (fable 98.8 → 76.0); repeats
   collapse hardest. Ship guidance: chart-read should rasterize PDFs
   itself and send images, rather than trusting each provider's
   internal PDF pipeline. (Opus is the odd one out — better on PDF —
   so the effect is per-provider-pipeline, not intrinsic to PDFs.)
3. **Haiku cannot do this job**: 1.2% chord recall, 15-measure drift,
   ~120 output tokens per score — it reads the signatures and writes a
   stub. The sharpest tier cliff the program has measured.
4. **The honesty map**: anthropic models decline the unreadable page
   (opus once declined without the registered Note form — a format
   miss, not a fabrication, per the registered distinction); gemini
   fabricates under image input. Study 2's accept-and-disobey lesson
   generalizes to vision exactly as the brief predicted it might.
5. Prediction scorecard: 1 right (fable keys, to the decimal of the
   bar); 2 half-right (chords above the predicted band in images);
   3 wrong in an instructive way (repeats weak, but endings 100%
   everywhere answered — the volta brackets read fine; it is the
   repeat DOTS that get lost, and only in PDFs); 4 right in substance
   (one model fabricated, and it was not an anthropic one); 5 right
   for gemini and fable, refuted by opus.

### Disclosure

Analyst Claude Fable 5; the matrix includes claude-fable-5-1. Every
grade is mechanical, committed and tested before any scored run; the
ground-truth instrument is production's own summary code, ported
verbatim. Amendments 1–2 preceded all matrix cells.

## Study 2 — does reasoning help a model write a drum beat? (2026-10-22)

**Question.** stem-shovel's Text-to-Beat hard-codes reasoning OFF on an
unmeasured claim (textToBeat.ts: a thinking model takes minutes and
"gets it no better"). Registered in docs/BRIEF-STUDY2.md (commit
c4e7a1d) before any scored run: the production call ported verbatim and
pinned (system prompt, validator with production's exact error
messages, retry-with-reason, the REST endpoint), 25 tasks with 49
mechanical checks tied only to explicit prompt text, two arms — R-off
(production verbatim: effort none, 1500-token cap) and R-default (the
reasoning field omitted, 8000-token cap, the registered asymmetry).
Combined score: 0 without a valid reply, else checks passed/total.
Total spend ≈ $4.85 of the $28 fences.

| Model | R-off score | R-default score | valid (off→def) | latency × | out-tokens × |
|---|---|---|---|---|---|
| kimi-k2.6 (production) | **95.0%** | 44.0% | 24/25 → 11/25 | 20.3 | 29.7 |
| fable-5-1 | 100.0% | 100.0% | 25/25 → 25/25 | 1.2 | 1.4 |
| haiku-4.5 | 92.0% | 92.0% | 23/25 → 23/25 | 1.0 | 1.0 |
| gpt-oss-120b | 77.0% | 92.0% | 21/25 → 24/25 | 2.7 | 2.8 |
| gemini-3.5-flash | **0.0%** | 99.0% | 0/25 → 25/25 | 0.7 | 1.0 |

**Gate S2-H1 PASS — the first gate in this program to pass by letter.**
For the production model the claim is upheld beyond its own wording:
R-default is not merely "no better," it is 51 points WORSE (p = .0015).
Kimi's default reasoning exhausted even the 8,000-token budget (5.3×
production's cap) on 14/25 tasks and returned no content — and the
production retry cannot rescue an empty reply (a conversation with an
empty assistant turn is a 400). On the 11 tasks where its reasoning
finished, checks were perfect: completed thinking helps slightly and
completes less than half the time.

**The finding that outranks the gate: "reasoning off" is not a portable
call shape.** gemini-3.5-flash does not honor `effort: "none"` — it
thinks ~3,000 tokens regardless, so under production's 1500-token cap
it burned exactly to the cap and returned nothing, twice per request,
0/25 valid; with room to think it is 25/25 at 99%. stem-shovel's
TEXT_TO_BEAT_MODEL is swappable by env var precisely so models can be
compared without a deploy — and this measurement shows the swap would
silently break the feature for a model that ignores the reasoning
field. The registered fallback (Amendment-1 rule) covered a model that
REJECTS effort none with an API error; gemini instead accepts and
disobeys, a failure class the registration did not anticipate —
published as measured. Meanwhile anthropic models are indifferent
(fable ×1.4 tokens with adaptive thinking, haiku identical arms), and
gpt-oss is the one model where reasoning buys quality (+15 points,
p = .14, not significant, at 2.8× cost — mostly by fixing its weak
first-try format validity: 13/25 first-try off, with the retry
rescuing 8).

Prediction scorecard: 1 right (upheld for kimi, economics ≥ 5×);
2 wrong (R-default first-try validity 40%, not ≥ 85%); 3 refuted by
letter via gemini's +99 — though by call-shape breakage, not reasoning
quality; 4 half-wrong (gpt-oss ×2.8 not ≥ 5×, and gemini's off arm is
SLOWER than its reasoning arm, 26 s vs 16 s medians, because cap
exhaustion runs the clock twice).

Ship guidance recorded for stem-shovel: the hard-coded choice is now a
measured one for the shipped model; the env-var swap path needs either
a per-model output budget or a one-request smoke test, and
reasoning-capable swaps (gpt-oss class) want the retry's rejected-reply
path checked against empty completions. Corrections before any result
was read, both dated in the brief: the analyzer's scoring brought to
the registered rule (budget-exhausted cells score 0; only
first-attempt API failures drop), and the brief's prose corrected to
the committed corpus counts (25 tasks, 49 checks).

Disclosure unchanged: analyst Claude Fable 5, matrix includes
fable-5-1, every grade mechanical (the validity grader is production's
own validator, ported and pinned).

## Study 1 — the hint-following study (2026-10-21)

**Question.** stem-shovel's chart draft shows the model each bar's Basic
Pitch transcription plus a free template matcher's chord guess — "a hint,
not an answer." Does the model read the notes or copy the hint?

**Method.** Registered in docs/BRIEF-STUDY1.md (commit c22a1ba) before any
scored run. 16 hand-authored songs, 440 bars, synthesized and transcribed
by the production pipeline; production prompt texts pinned by test; four
arms varying only the hint: none, the production matcher's, the truth,
and a systematically wrong transform (root up a fourth, quality kept).
Mechanical per-bar grading (same root pitch class + canonical quality).
Template-matcher baseline, known at registration: **398/440 (90.5%)** —
with a caveat it earns itself: on the power-chord song its "5"-template
penalty scores 3/28.

**Amendment 1** (committed 8c4201b, before any scored haiku/kimi cell):
haiku-4.5 rejects production's adaptive-thinking option (64 API errors);
kimi-k2.6 spent the full 8000-token output budget reasoning in 62/64
cells and returned no JSON — independently reproducing the production
text-to-beat lesson at $8.70 of reasoning tokens. Amended call shapes:
haiku on provider defaults; kimi on production's own kimi path (gateway
REST, reasoning off). Failed runs archived in results/archive/.

### Results (bar accuracy; 64 cells per model)

| Model | A-none | A-matcher | A-correct | A-wrong | copy rate | flip rate |
|---|---|---|---|---|---|---|
| fable-5-1 (production) | 92.3%* | **99.8%** | 100.0% | 99.3% | **0.0%** | **0.0%** |
| gemini-3.5-flash (pilot) | 94.1% | 94.3% | 99.5% | 99.5% | **0.0%** | **0.0%** |
| gpt-oss-120b | 65.9% | 85.9% | 96.1% | 77.7% | 15.3% | 22.6% |
| haiku-4.5 | 49.5% | 87.5% | 94.5% | 30.9% | 42.7% | 49.5% |
| kimi-k2.6 | 28.2% | 75.5% | 95.7% | 11.4% | 56.2% | **69.1%** |

*Includes one reproducibly empty completion (morning-fuse, 5976 tokens
in, 0 out, twice) scored 0/28 per the registered no-retry rule;
excluding it fable's A-none is 98.5%.

Copy rate: bars answered with the wrong hint, of 438 hintable. Flip
rate (the registered headline): bars the model got RIGHT with no hint
that it answered with the wrong hint when one was shown.

### The findings

1. **Hint-following is a capability gradient, not a universal.** The
   frontier models never copied a wrong root — 0 of ~850 opportunities
   between them — while kimi flipped 69% of bars it could read correctly
   on its own, haiku 50%, gpt-oss 23% (gpt-oss bimodally: two songs
   surrendered wholesale, the rest read clean). The registered
   prediction (flips > 50% for small models, production model least) was
   right about the shape and wrong about the universality: wrong hints
   did not hurt the strong models at all.
2. **Hints carry notation, not just pitch.** The pilot model at ceiling
   still gained from WRONG hints (94.1% → 99.5%): on the power-chord
   song it wrote the right roots as plain majors without a hint, and
   wrong-rooted "5"-suffix hints fixed the spelling while the notes
   fixed the pitches. Hint influence in strong models operates at the
   notation-style layer, never the chord-identity layer. (A design note
   rides along: A-correct/A-wrong hints inherit the truth's segment
   boundaries, so part of their lift is alignment, an advantage the
   production A-matcher arm does not have.)
3. **The production design is validated — and is what rescues cheap
   models.** A-matcher beat A-none for every model: +7.4 pts for fable
   (99.8%, the best shipped-configuration number in the study), +39 for
   haiku, +47 for kimi. But no cheap substitution exists: in the shipped
   configuration haiku (87.5%) and kimi (75.5%) sit BELOW the free
   matcher's own 90.5%, while fable adds +9.3 pts over it at about
   $0.10 a draft. The DRAFT_MODEL choice is measured, not vibes.
4. **Only the frontier models beat the free matcher reading notes
   alone** (gemini 94.1%, fable 98.5% on answered cells vs 90.5%) —
   registered prediction 1 ("every model beats the baseline") is
   refuted: haiku, kimi and gpt-oss fall far short.
5. **Disclosure tracks capability.** Shown wrong hints, fable flagged
   the matcher disagreement in its notes in 11/16 songs; gpt-oss 7,
   gemini 4, haiku 2, kimi 0. The registered prediction (rare
   everywhere, < 20%) is refuted in the best direction for the
   production model: it both ignores a wrong hint and says so.

### Gate accounting (registered wording, never re-thresholded)

S1-H1 read "A-correct beats A-none, p < .05 for the pilot model AND for
the pooled matrix." Pooled matrix: Δ +37.7 pts over 64 pairs,
p < 0.00005 — decisive. Pilot model: Δ +5.4 pts but p = 1.0, because
every song except one is at ceiling in both arms and a paired
permutation with one informative pair cannot reach significance at any
effect size. **The conjunct gate therefore FAILS by letter** via the
pilot clause — the fourth registration lesson of the research program:
a gate clause about a model at ceiling measures the fixture, not the
mechanism. The fixture-health stop rule (A-correct ≥ 70%) passed for
every model (94.5–100%).

Prediction scorecard: 2 and 4 right; 1, 5 and half of 3 refuted —
recorded above.

### Spend

Pilot $0.74 (fence $3). Matrix ≈ $17.4 including the archived kimi
reasoning burn ($8.70) and reruns (fence $30). Total ≈ $18.1.

### Production response and Amendment 2 (same day)

stem-shovel v0.142.0 (commit 69e015d6) adopted the finding within hours:
the matcher's flat "5" penalty became a missing-tone penalty (a template
tone carrying under 5% of the bar's profile costs 0.08), and the chart
draft now retries an empty completion (the morning-fuse case). The bench
re-ported the matcher verbatim, pinned the new behavior, recomputed the
hints over the STORED notes (nothing re-transcribed; the v0.141 fields
kept for reproducibility), and re-ran the shipped-configuration arm as
registered Amendment 2 (80 cells, $2 of the $6 fence, zero errors).
Note on cross-checking: stem-shovel's own re-score said 397→423; the
bench says 398→424 — the one-bar difference is static-bloom's silent
bar (truth N.C., matcher N.C.), which the registered equivalence counts
correct.

Hint accuracy 90.5% → **96.4%** (42 wrong-hint bars → 16). The shipped
arm under each matcher:

| Model | v0.141 hints | v0.142 hints | propagated wrong hints (old → new) |
|---|---|---|---|
| fable-5-1 | 99.8% | 99.3% | 0/42 → 0/16 (rescues 100% of both) |
| gemini-3.5-flash | 94.3% | 98.2% | 14 → 7 |
| gpt-oss-120b | 85.9% | 92.0% | 35 → 13 |
| haiku-4.5 | 87.5% | 92.5% | 9 → 9 |
| kimi-k2.6 | 75.5% | **94.8%** | 26 → 10 |

Reads against the amendment's registered predictions: the hint-followers
rose toward their A-correct ceilings as predicted (kimi +19.3 pts to
94.8% vs its 95.7% ceiling; haiku +5.0), and fable is unchanged within
noise, still propagating zero wrong hints. The flip rate — the Study 1
headline — is a wrong-hint-arm metric that does not involve the matcher
and is unchanged by construction.

The substitution conclusion SHARPENS with the better matcher: haiku
(92.5%), kimi (94.8%) and gpt-oss (92.0%) now sit below the bare
v0.142 matcher's own 96.4% — in the shipped configuration those models
subtract value from the free matcher — while fable (99.3%) and gemini
(98.2%) still add to it. The cheapest configuration that beats
everything upstream of it remains the shipped one.

### Disclosure

The analyst model is Claude Fable 5; the matrix includes
claude-fable-5-1. Every grade is mechanical, committed and tested before
any scored run; no model output was judged by any model or person.
