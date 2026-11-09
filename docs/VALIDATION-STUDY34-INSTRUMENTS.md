# Study 34 instrument validation (pre-registration)

Date: 2026-11-09. Everything here ran BEFORE docs/BRIEF-STUDY34.md was
written, on recordings whose per-bar truth is already known (the three
MMKK Badverbs mixes: band charts, declared tempos, DAW exports with bar
one at 0:00). No scored model run has happened. The purpose was to
decide which truth-construction instruments Study 34 may rely on.
Script: scripts/validate-seqalign-study34.ts (committed, re-runnable).

## Verdicts

| Instrument | Verdict | Evidence |
|---|---|---|
| JAAH beat alignment (src/study34/align.ts), contrast gate >= 1.15 | ACCEPTED | synthetic recovery test; dippermouth contrast 1.78, st-louis 1.34, livery 1.19 on the fetched transfers |
| Free-boundary chroma Viterbi (alignSequenceToTime) | REJECTED | label-at-time 63.5% / 50.8% / 33.5% on letter / peaceful / eat |
| Bar-grid chroma Viterbi (alignSequenceToGrid) | REJECTED | 73.7% / 73.9% / 63.4%; anchor recovered but vamp phase still slides |
| Rigid chain fit (alignRigid, tempo +-2.5% x offset) | REJECTED as automatic truth | peaceful 100.0% exact, but letter slid one bar (contrast 1.02) and eat picked 123 bpm over the true 120 (51.1%) |
| Global key calibration (calibrateKeyGlobal), margin gate >= 0.02 | ACCEPTED with gate | letter 0 (margin 0.033) ok, peaceful 0 (0.041) ok, eat wrong at margin 0.010 — the gate refuses it; refused slots fall back to the published key, flagged |

The margin gate 0.02 was chosen on these three validation songs; that
choice predates registration and is disclosed here rather than tuned
later.

## What this decides for Study 34's truth design

1. No chord-boundary timeline is ever constructed by chroma fitting.
   The rejected aligners stay in src/study34/seqalign.ts as evidence.
2. Truth tiers, to be registered verbatim in BRIEF-STUDY34:
   - Tier 1 (time truth): the three JAAH slots (beat-aligned
     annotations, contrast-gated transfer fit) and the two Badverbs
     slots (band charts on declared-tempo grids, DAW-export anchors
     with committed diagnostics). Full grading: per-bar roots,
     quality families, slash bass, bar count, sections, bar-one
     placement.
   - Tier 2 (bar truth): slots whose publication states exact
     bar-by-bar harmony (public-domain sheet music, hymnal). Grading
     is INDEX-ALIGNED per bar (the Study 33 precedent): draft bar i
     against truth bar i, no time checks. Key fixed by the
     publication, cross-checked by the gated global calibration.
   - Tier 3 (sequence truth): slots whose publication gives ordered
     progressions without durations (the two Josh Woodward artist
     charts, the Sunny Pilots song). Grading is sequence-level:
     the draft chart's collapsed chord sequence against the published
     sequence (longest common subsequence over roots, and over
     quality families), plus the refusal/save class.
   - Class-only: the Irish jig medley, which has no published harmony
     for this specific performance. Only the mechanical refusal/save
     class and meter plausibility are recorded; it counts toward no
     accuracy gate.
3. G1/G2 denominators follow the tiers and are restated mechanically
   in the brief before any run.
