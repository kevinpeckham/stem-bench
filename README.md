# stem-bench

Pre-registered benchmark studies of the AI features in
[stem-shovel](https://www.stemshovel.com), the Lightning Jar music
collaboration app. A sibling of
[barkup-bench](https://github.com/kevinpeckham/barkup-bench) and
[aeo-bench](https://github.com/kevinpeckham/aeo-bench), run under the same
rules: briefs committed before any scored run, mechanical graders with
unit tests, deterministic fixtures, spend fences, results published
whether gates pass or fail.

## Study 1: the hint-following study

stem-shovel drafts a chord chart by showing a model each bar's Basic
Pitch transcription plus a free template matcher's chord guess — "a hint,
not an answer." Does the model read the notes or copy the hint?

16 hand-authored songs (440 bars, known chords by construction) are
synthesized to audio, transcribed by the production Basic Pitch pipeline,
and drafted under four arms: no hint, the production matcher's hint, the
truth as hint, and a systematically wrong hint (root up a fourth). The
registered headline number is the **flip rate**: how often a model that
got a bar right without a hint follows a wrong one.

Registration: [docs/BRIEF-STUDY1.md](docs/BRIEF-STUDY1.md). Results land
in `results/` and on the
[Lightning Jar research dashboard](https://www.lightningjar.com/research).

## Run it

```sh
bun install
bun test               # graders and prompt pins
bun run fixture        # rebuild corpus/fixture.json (~15 min of CPU transcription)
bun run study1:pilot   # needs AI_GATEWAY_API_KEY in .env.local
bun run study1:analyze
```

## Layout

- `corpus/progressions.json` — the hand-authored ground truth
- `corpus/fixture.json` — transcribed notes, production bar lines, matcher chords
- `src/fixture/` — synthesis and the verbatim port of stem-shovel's matcher
- `src/grading/` — chord equivalence and per-bar scoring (tested)
- `src/harness/` — production-faithful prompts and the gateway runner
- `docs/` — one pre-registered brief per study

Apache-2.0, like stem-shovel itself.
