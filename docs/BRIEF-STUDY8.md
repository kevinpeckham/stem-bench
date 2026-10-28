# BRIEF — stem-bench Study 8: section detection (the loophole test)

**Pre-registration, committed before any scored run.**

`detectSectionsWithAi` is the last unmeasured AI feature in stem-shovel:
it listens to a mix and returns named sections with boundaries in
seconds, optionally guided by the chart's rehearsal marks and the
band's section vocabulary. It kept the listening-first shape through
the v0.19x redesign. Studies 4 and 7 established that the listening
layer reads rather than hears — but their data left one loophole: the
things models DID register blind were gross structural events, and
section boundaries ARE gross structural events. This is the audio task
most favorable to genuine listening; either outcome is a finding.
Blind success would be the program's first evidence of useful hearing;
blind failure at the most favorable task closes the question.

## System under test

The v0.192.0 call ported verbatim and pinned (stem-shovel origin/dev
95ed19aa: system, question with facts/vocabulary/existing branches —
the bench sends no `existing` — the summary-chart CHART_NOTE branch,
the confidence-less SectionsAnswerSchema): tests/study8.test.ts.
Registered deviations as in Studies 4/7: temperature 0,
maxOutputTokens 2000, maxRetries 4.

## The fixture (extended, committed before registration)

Study 4's 12 metered mixes (their section boundaries are tempo/key
change points or single-section loops) PLUS three new contrast mixes
(contrast-a/b/c) whose sections alternate sparse texture (soft
whole-bar chords, no drums) with the full comp — boundaries a human
hears instantly — with ground-truth names (Verse, Chorus, Intro,
Bridge, Interlude) and boundaries at exact seconds by construction.
The sparse renderer is a registered synthesis extension (absent field
= byte-identical existing renders; verified by the deterministic
rebuild). Chart-arm texts are the Study 5 lead sheets with a rehearsal
mark at every section start (the committed `markedChart` generator).
Pulseless items excluded as in Study 7.

## Arms (3) × 15 items × 2 models (90 cells)

All arms carry production's facts line (true tempo and meter — the
feature runs after detection in the product):

- **S-blind** — audio + facts only: the loophole test.
- **S-vocab** — + the registered vocabulary (Intro, Verse, Chorus,
  Bridge, Interlude, Outro — covering every truth name): names
  should improve, boundaries should not.
- **S-chart** — + vocabulary + the marked lead-sheet summary:
  production's best path, and Studies 4/7's placement precedent says
  it should excel.

Models: `google/gemini-3-flash` (production) and 3.5-flash. Fence
**$5** (estimated well under $1). Single phase; authorized by Kevin's
"proceed" (2026-10-28).

## Grading (mechanical, committed, tested)

Boundaries = section starts after 0 s; found when an answered section
start lands within ±4 s; false boundaries counted (an answered start
matching no truth boundary); names graded case-insensitively by
prefix on named items; section-count delta recorded. An unparseable
answer scores zero with all boundaries missed.

## Gates (production model only)

- **S8-G1 (the product's claimed-good path):** S-chart boundary
  detection ≥ 80% with mean false boundaries ≤ 0.5 per item. The
  placement precedent (Studies 4/7: 6/6 and 3/3 changes placed within
  ±4 s) makes this the path the product may rely on.
- Blind performance is deliberately NOT gated — it is the open
  question, reported as the headline read either way.

## Predictions (registered before any scored run)

1. S-chart passes the gate comfortably (≥ 90% boundaries).
2. The loophole is real but partial: blind boundary detection on the
   CONTRAST items ≥ 2/3 of boundaries (texture flips are the gross
   events Study 4 saw noticed in prose) while blind detection on the
   no-contrast items (shift/mod boundaries and single-section loops)
   stays below 30% with false boundaries invented on the uniform
   drift/waltz/lilt loops (structure hallucinated where none exists).
3. Vocabulary improves names, not boundaries (±1 boundary of S-blind).
4. 3.5-flash ≈ production blind (the deafness was generational-stable
   in Study 4); placement via chart equal.

## Interpretation table (pre-registered)

| Outcome | Reading |
|---|---|
| Gate passes, blind split per prediction 2 | The nuanced close: models hear texture, not form — section detection ships chart-gated like the song-check, with blind detection honest only for arrangement-contrast boundaries |
| Blind strong everywhere | The program's first real listening result; soften the Study 4 narrative publicly and re-examine what else gross-event hearing could carry |
| Blind fails even on contrast items | The loophole closes completely: no production listening path should run chartless, full stop |
| S-chart gate fails | The placement precedent does not transfer to multi-boundary form — a surprise worth anatomy before interpretation |

## Disclosure

Analyst Claude Fable 5; no Anthropic model measured (no audio on the
gateway). Every grade mechanical, committed and tested before any
scored run; the contrast mixes' sparse renderer is committed and the
existing fixtures' byte-identity under the extension was verified by
deterministic rebuild.
