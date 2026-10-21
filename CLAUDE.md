# CLAUDE.md — stem-bench

Benchmark studies of the AI features in stem-shovel (the Lightning Jar
music collaboration app), run with the same scientific-integrity rules as
barkup-bench and aeo-bench. Read BRIEF.md for the program, docs/BRIEF-*.md
for each study's pre-registration.

## Hard rules

- **Registration by commit.** A study's brief (docs/BRIEF-*.md), its
  corpus, its graders and their tests are committed BEFORE any scored
  model run. Gates are never re-thresholded after data exists; a defective
  fixture or grader means stop, fix, re-register, re-run.
- **Mechanical graders only.** Every score is computed by committed code
  with unit tests. No model and no analyst ever judges an answer.
- **Spend fences.** Each brief registers a pilot fence and a matrix fence.
  The pilot runs on the registering go-ahead; the full matrix needs
  Kevin's explicit approval after the pilot's results are committed.
- **All music is synthesized.** The corpus is hand-authored progressions
  rendered by src/fixture/synth.ts; no user audio, no copyrighted
  recordings, nothing leaves the machine but gateway requests.
- **Production fidelity.** Prompt texts, transcription thresholds and the
  template matcher are ports of stem-shovel's production code, pinned by
  test; a deviation (there is one: temperature 0) is registered in the
  brief. When stem-shovel's aiDetect.ts changes, the port does NOT chase
  it mid-study.
- **Fable disclosure.** The analyst model is Claude Fable 5 and the
  matrix measures claude-fable-5-1 (the same family). That is tolerable
  only because every grader is mechanical and committed before runs; any
  study needing judged scoring must exclude the analyst's family or use
  independent human judges.

## Commands

```bash
bun test               # graders and prompt pins — must pass before any run
bun run fixture        # rebuild corpus/fixture.json (synthesize + Basic Pitch, ~15 min)
bun run study1:pilot   # pilot model over all cells
bun run study1:matrix  # matrix models (needs Kevin's go-ahead)
bun run study1:analyze # tables, paired tests, hint-influence rates
```

`AI_GATEWAY_API_KEY` in `.env.local` (gitignored). Results are committed
in `results/`. No co-author lines in commits.
