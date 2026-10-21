# stem-bench REPORT

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

### Disclosure

The analyst model is Claude Fable 5; the matrix includes
claude-fable-5-1. Every grade is mechanical, committed and tested before
any scored run; no model output was judged by any model or person.
