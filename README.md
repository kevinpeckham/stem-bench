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
Production adopted the findings the same day (stem-shovel v0.142.0) and
a registered amendment re-measured the shipped arm under the fix.

## Study 2: does reasoning help a model write a drum beat?

stem-shovel runs Text-to-Beat with reasoning off, on a claim hard-coded
as a code comment. Study 2 ported the production call verbatim and ran
reasoning-off against reasoning-default across five models on 25 beat
prompts with 49 mechanical checks.

The claim held 51 points beyond its wording for the shipping model, and
the bigger finding is portability: "reasoning off" is a request, not a
guarantee. Gemini accepts the setting, thinks ~3,000 tokens anyway, and
under production's token cap returns nothing at all — the env-var model
swap would silently break the feature.

Registration: [docs/BRIEF-STUDY2.md](docs/BRIEF-STUDY2.md). Findings:
[REPORT.md](REPORT.md).

## Study 3: can a model read sheet music?

stem-shovel's chart-read has a model read an engraved score into a
per-measure summary. Study 3 measured it as a round trip: scores
authored as MusicXML (every fact known), engraved by Verovio, read
under the production prompt, graded against the app's own summary of
the source file. We believe it is the first registered LLM
notation-reading benchmark.

The shipping model reads engraved notation from a clean image at 98.8%
exact chord recall with zero measure drift, about six cents a score.
One model fabricated a key and meter from an unreadable 80 px page
rather than say so; the honesty gate is published as failed by letter.

CORRECTED 2026-10-24 (found by Study 5): the PDF-gap finding was a
fixture artifact — our PDF generation silently dropped chord
accidentals, and the models were correctly reading corrupted pages.
On clean PDFs the frontier models read 99.3%, equal to images; the
real hazard is accidental-dropping PDF authoring, detectable but not
recoverable. Details in REPORT.md's Study 3 Correction.

Registration: [docs/BRIEF-STUDY3.md](docs/BRIEF-STUDY3.md) (with two
disclosed fixture amendments). Findings: [REPORT.md](REPORT.md).

## Study 4: the listening layer

stem-shovel's song-check has a model listen to a mix and second-guess
the app's tempo, key and meter detection. Study 4 synthesized mixes
whose facts are true by construction, verified the pulse was physically
in the audio, and ablated the text that rides beside it.

The second opinion reads; it does not hear. Blind, two gemini
generations pin tempo to a genre prior at confidence 1.0 and miss the
key 10+ times out of 12; given wrong candidates they echo them; given
the song's chart they are perfect on every field and place every
change within four seconds. The feature's real value is the
chart-anchoring path.

Registration: [docs/BRIEF-STUDY4.md](docs/BRIEF-STUDY4.md) (the stop
rule fired twice and its premise was then mechanically discharged).
Findings: [REPORT.md](REPORT.md).

## Study 5: the composed pipeline

The real production chain — engraved page, chart-read, chart-anchored
song-check — measured end to end with a propagation classifier. Its
first run's anatomy caught the Study 3 confound above (the composition
study audited its predecessors); after the fix, both gates pass at
zero added errors: the chain is exactly as good as the page its reader
is shown, and the one reader omission was rescued by the listener
reading the chart's chords.

Registration: [docs/BRIEF-STUDY5.md](docs/BRIEF-STUDY5.md). Findings:
[REPORT.md](REPORT.md).

## Study 6 (micro): the warning heuristic, validated

stem-shovel shipped a corrupted-chart warning from this bench's Study 3
correction; Study 6 validated it at zero model spend, over existing
reads of the same pages corrupted and clean. The shipped rule caught
10/10 detectable corruptions; its documented blind spot measured at
4/42 clean reads; a key-in-force refinement resolves the false
positives, and its one residual flag caught a real misplaced-modulation
read. The loop closed twice: the bench validated a feature that exists
because of the bench.

Registration: [docs/BRIEF-STUDY6.md](docs/BRIEF-STUDY6.md). Findings:
[REPORT.md](REPORT.md).

## Study 6b: the key-in-force warning, registered

stem-shovel shipped the key-in-force refinement on Study 6's
exploratory number, measured on the very reads it was shaped on. Study
6b gives the shipped rule pages it has never seen: 24 new engraved
charts (honest sharp- and flat-key charts, modulating charts, and
charts whose chords carry accidentals), each read clean and through
the accidental-dropping PDF path, with the clean-read false-positive
gate registered before any read. Registered, not yet run.

Registration: [docs/BRIEF-STUDY6B.md](docs/BRIEF-STUDY6B.md).

## Study 7: the redesigned song-check, re-measured

stem-shovel rebuilt the song-check after Study 4; Study 7 measured the
replacement. The deference failure is closed (zero wrong settings
reach a song; raw echo under a truth-stating chart fell from 10-12/12
to zero) — and the no-ear-estimates instruction fails 24/24 on
chord-only charts, with every invented tempo the settings value
verbatim: the fact line beats the instruction, the program's recurring
law in its fourth costume. The application gate contains all harm.
Ship guidance: parse tempo and meter from the chart; ask the model
only what text cannot answer.

Registration: [docs/BRIEF-STUDY7.md](docs/BRIEF-STUDY7.md). Findings:
[REPORT.md](REPORT.md).

## Study 8: section detection, the loophole test

After four studies concluded the listening layer reads rather than
hears, Study 8 went looking for the loophole in that verdict — and
found it. Blind, the models hear texture contrast (7-8 of 8 section
boundaries where the band drops out and returns): the program's first
genuine listening result. But it is texture, not form: harmonic
boundaries land half the time, uniform loops get subdivided into
invented structure, and even a chart marking one section does not
stop the form prior from inventing a chorus. The chart arm detects
100% with perfect placement; the gate failed by half a false boundary.
Ship guidance: parse the chart's marks, ask the model only for
placement in seconds.

Registration: [docs/BRIEF-STUDY8.md](docs/BRIEF-STUDY8.md). Findings:
[REPORT.md](REPORT.md).

## Study 6b: the key-in-force warning, validated on unseen pages

The program's first study registered by the production agent itself:
stem-shovel shipped Study 6's suggested refinement, then declined to
trust a rule designed on the data it was scored on, and registered its
own validation here — new pages its rule had never seen, a pinned
verbatim port, a tested only-quieter property, and a zero-spend
reproduction gate. The bench ran it unmodified. Both gates passed with
a perfect sheet (8/8 detectable hits, 16/16 silence, 0/24 clean
flags); the verdict delivered back was the rare kind: nothing to
change. Cross-agent registration now runs in both directions.

Registration: [docs/BRIEF-STUDY6B.md](docs/BRIEF-STUDY6B.md).
Findings: [REPORT.md](REPORT.md).

## Study 9: stem-aware analysis

Drafted by the stem-shovel agent, finished and run by the bench: does
reading the uploaded stems individually beat the summed mix the
detector actually uses? Four zero-model-spend instruments over 21
items, six carrying a stem built to sabotage the sum. The sabotage
failed: the summed onset envelope was exact on 18 of 21 including all
six misleading stems, while picking the sharpest single stem scored 11
with seven regressions — cross-stem reinforcement IS the tempo signal.
What the stems do hold is the arrangement: a which-stems-are-sounding
detector found 8/8 section boundaries with zero inventions on loops.
And a per-stem key agreement score gave its maximum to the study's one
wrong key answer — a confidence signal pointing the wrong way.

Registration: [docs/BRIEF-STUDY9.md](docs/BRIEF-STUDY9.md). Findings:
[REPORT.md](REPORT.md).

## Study 10: neural MIR baselines, and the home-field rematch

The stem-shovel agent's landscape review asked whether the app hears
with obsolete code; the bench ran the review's own candidates — Beat
This!, LinkSeg, ChordMini, two literature key-profile swaps, all
real, hash-pinned, $0 — against the production detector on a hard
synthetic set, then on MMKK's real public catalog with the band's
declarations as truth. Synthetic: all five gates failed in
production's favor (one lesson: a ±1 bpm tolerance measured the
neural tracker's 20 ms output grid, not its hearing — ±3 is a dead
tie). Real recordings flipped the section result: LinkSeg found 29/33
declared boundaries where Study 9's activity detector collapsed, the
tempo detector's 3:2 and half-time classes showed up on real songs,
and Krumhansl beat both literature profiles 4/6 to 1/6. Keep the
detector, keep the templates; LinkSeg is the measured no-chart
section fallback.

Registration: [docs/BRIEF-STUDY10.md](docs/BRIEF-STUDY10.md).
Findings: [REPORT.md](REPORT.md).

## Study 11: the tempo ladder rule

Study 10 left tempo's octave-family misses as the largest measured
error class; the stem-shovel agent specified a fix to test — a
ladder-aware comparison whose 3:2 rungs are licensed by a subdivision
test — and the bench registered and ran it for $0 over the stored
detections. The first runs caught two defects in the instrument
itself, fixed by registered amendment: the subdivision hypothesis must
be the DECLARED tempo (slower-of-pair is confounded by the 2:3 eighth
mapping) and must require the hypothesis pulse to exist (a bogus
hypothesis has no beat peak and games any relative floor). Verdict:
every count-class miss recovers at its correct rung and the one true
hearing error stays correctly rejected; subdivision reads 4/4 compound
and 31/31 straight with swing splitting honestly. Two gates failed by
letter on the wrong-value generator's own defects — zero genuinely
wrong values were accepted in 255 rows — which is the program's sixth
registration lesson: a wrong-value generator must respect every true
label of an item.

Registration: [docs/BRIEF-STUDY11.md](docs/BRIEF-STUDY11.md).
Findings: [REPORT.md](REPORT.md).

## Study 11b: the shipped tempo ladder, validated

stem-shovel built the tempo ladder in production (v0.200.0) in
parallel with Study 11, with a sharper subdivision rule than the
bench's sketch, and asked for a validation of the shipped rule plus a
swing-stress sweep. The sweep came back clean — 15/15 straight at
exact tempi, their triplet-share argument validated — the ladder
accepted 0 of 332 corrected wrong rows, and the super-beat re-pick
fixed two of Study 10's octave misses outright. The costly half
landed on real recordings, exactly where their addendum said to
stress: the fast waltz re-picked to its bar pulse, a defensible
hearing with no ladder rung to land on, and the sub-beat test fired
at the detector's own ⅔-wrong pulse — Study 11's amendment confound,
shipped — silencing a warning the gates required to stay loud. The
margin numbers forbid tuning (reverb pushes a true 6/8 inside the
straight items' band); the fixes are the declared-tempo hypothesis
and a ×3 rung, and the alternates ladder already carries the truth
everywhere the 6/8 call misses.

Registration: [docs/BRIEF-STUDY11B.md](docs/BRIEF-STUDY11B.md).
Findings: [REPORT.md](REPORT.md).

## Run it

```sh
bun install
bun test               # graders and prompt pins
bun run fixture        # rebuild corpus/fixture.json (~15 min of CPU transcription)
bun run study1:pilot   # needs AI_GATEWAY_API_KEY in .env.local
bun run study1:analyze # (study2:pilot / study2:matrix / study2:analyze likewise)
```

## Layout

- `corpus/progressions.json` — the hand-authored ground truth
- `corpus/fixture.json` — transcribed notes, production bar lines, matcher chords
- `src/fixture/` — synthesis and the verbatim port of stem-shovel's matcher
- `src/grading/` — chord equivalence and per-bar scoring (tested)
- `src/harness/` — production-faithful prompts and the gateway runner
- `docs/` — one pre-registered brief per study

Apache-2.0, like stem-shovel itself.
