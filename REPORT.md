# stem-bench REPORT

## Correction (2026-11-07, prompted by Kevin): the recordings are metronome-exact at their declared tempos — the broken legs were the bench's DTW ruler and one chart's arrangement, and Studies 23b/24's tempo interpretations are withdrawn

Kevin's correction ("their tempo is precisely metronomically constant"
— the songs from stems/mix, as opposed to the demos) was verified the
same hour, off the raw audio with no DTW involved
(scripts/diag-tempo-2026-11-07.ts): a wide fine comb sweep over the
onset envelope finds razor-sharp peaks (peak/median 5.2–7.2) at
131.97–131.99, 120.00, 144.96–144.98 and 223.82–223.97 bpm against
declared 132/120/145/224. The corpus is the manifest's stems/mix, so
the caveat about demos does not apply. **Every recording is click-exact
at its declared tempo.**

What was actually broken, localized by a second $0 diagnostic
(scripts/diag-arrangement-2026-11-07.ts, the shipped reader's hints
graded per 16-bar window under the DTW grid vs the TRUE uniform grid):

1. **The DTW ruler's bar geometry is unusable, far beyond its known
   ~400 ms wander.** Its "bar durations" on letter-lands span
   0.91–2.43 s against a true 1.818 s, and its grids drift up to
   14–22 s from any uniform line. Its per-bar BINS remain musically
   aligned to the chart (DTW-grid hints 70/76, 74/84, 149/153,
   115/140), which is why every prior per-bar CHORD grade stands —
   but nothing geometric derived from it (anchors, periods, index
   pairings of uniform arms) was ever truth.
2. **The '7.15 s and 6.5 s intros' never existed.** The true-grid
   hints score best at shift −4 on letter-lands AND peaceful-dreams:
   chart bar one sits at t ≈ −0.12 s on both — the recordings open ON
   the downbeat. The DTW start was four bars late. Study 13's arm D
   had this receipt in 2026 ink ("first section declared at 0, first
   audible energy at 0.00") and Studies 23b/24 trusted the ruler over
   it. Consequently the earlier same-day correction UNDER Study 24
   ("E4 finds the audio start, not the charted start") was itself
   wrong in its explanation: the audio start IS the charted start on
   these songs; E4's t = 0 was within ~0.12 s of true chart bar one,
   and prediction 6's premise (7.15 s as truth) is what dissolves.
3. **eat-all-the-clocks' chart does not match its recording's
   arrangement.** 86 chart bars at 120 bpm need 172 s; the recording
   is 147.5 s — about 13 chart bars have no audio. The true-grid hint
   windows decay 14/16 → 0/6 toward the tail while the DTW grid
   "scores" by compression. No grid of any kind can chart bars that
   were not played.

**What this withdraws.** Study 23b's headline ("a perfect tap does not
save the declared tempo") and Study 24's ("the tempo is not a
constant") are both withdrawn as interpretations. 23b's B2 arm never
simulated a user tap: its anchor was the RULER's first bar — on two
songs four bars late — so the index-paired grading punished every
uniform arm by whole-bar shifts while the grid-given baseline was
shift-aligned by construction. The gates measured what their registered
constructions measured and are not re-scored; the constructions
themselves are now known defective as simulations of the feature.
Study 24's "truth-fit period" ruler (the LSQ fit) is void with them.

**What this reverses into good news, re-scored against the true
periods:** Study 24's P2 onset joint comb found the true period on ALL
FOUR songs (1.8185 vs 1.8182, 2.0004 vs 2.0000, 1.6552 exact, 0.8036
exact — ≤ 0.02%), and P1's chord-change comb on three of four (letter
its one real miss, 5.3% off). The bench reported that perfection as
"24% off fit" against its own broken ruler. With the true tempo
recoverable mechanically and bar one at t ≈ 0 on these recordings, the
chartless pipeline's INPUTS are already near chart-grade on the three
arrangement-matched songs: true-grid reader hints 70/76, 134/153,
111/140 (eat's 55/84 is the arrangement mismatch, not hearing).

**What stands:** every per-bar chord grade in Studies 13–24 (binned by
DTW, which tracks the chart musically); Study 22's core claim that grid
geometry cannot be certified against this truth (now strengthened:
the truth's geometry is the broken part); Study 23's serialization
verdict; Study 24's dialect result (18/62 on peaceful under a
near-true-period grid).

**Proposed next (not run — needs a registration go-ahead): Study 25,**
the corrected end-to-end: grid = declared period anchored at true bar
one (t ≈ 0, or the onset joint comb's fit), drafts on all four songs,
graded index-paired against the chart. Registered prediction would be
near-baseline on letter/peaceful/mop and an arrangement-capped eat.
~$0.3.

## Study 24 — true-tempo estimation splits the catalog: reader-derived grids reach baseline parity on steady songs (with the program's best dialect number ever), and the wandering songs have no uniform grid to find (2026-11-07)

Run as registered (2bd7ca9, $2 fence, ≈ $0.3 by token parity — 64,605
in / 12,012 out). P1 (chord-change joint comb over the shipped reader's
grid-free segment boundaries) and P2 (onset joint comb) searched
period ± 10% around declared with phase, two-stage; arm B3 re-ran the
Study 23b pipeline verbatim with P1's fitted (phase, period) — the
period the only variable against 23b's B1.

**S24-G2 FAIL as a whole, and the split IS the finding.** On the two
songs that hold their declared tempo, the fitted chartless grid takes
the draft to baseline parity with zero UX: peaceful-dreams 148/153
roots (grid-given baseline 151/153, within 2 points) **with 18 of its
62 dialect bars written exactly — ABOVE grid-given's 11, the best
dialect number the program has measured**; mop-heart 136/140, ABOVE its
131/140 baseline. On the two songs that don't, the draft stays
collapsed (letter-lands 36/76, eat-all-the-clocks 24/84, both below
even 23b's declared-period comb arm).

**The deep mechanical fact reframes 23b: those songs have no uniform
grid at all.** The in-run least-squares uniform fit to the aligned
truth ITSELF hits only 3/76, 5/86, 5/153 and 17/140 truth bars at 15%
tolerance — the recordings (or the DTW ruler, within its ~400 ms
wander) drift beyond what ANY single (phase, period) can track. 23b's
"the declared bpm is wrong" was half the story; the other half is that
on letter and eat the tempo is not a constant, so the comb did not fail
to find the true period — a single true period does not exist there.

**S24-G1 PASSES as registered and the pass is disclosed as hollow — an
instrument lesson, not a recovery claim.** The registered "ceiling"
(the least-squares fit, index-paired hits) minimizes squared error, not
hits; under wandering truth it lands between tempo regimes and hits
almost nothing, so "within 10 points of the ceiling" was trivially
satisfiable (B3 beat it everywhere: 7 vs 3, 24 vs 5, 84 vs 5, 69 vs
17). By the gate's registered INTENT — did the search recover the best
uniform grid — letter-lands is a miss: P1 returned 1.914 s where even
the declared 1.818 s serves the draft better. Lesson for any future
grid gate: the ceiling must be a hits-MAXIMIZING uniform search, not a
least-squares line. The gate stands as registered; its construction is
what failed, and no decision leans on it below.

**The combs themselves:** P2 (onsets) landed closer to the truth-fit
period than P1 (chord changes) on three of four songs — the
chord-change comb, the study's premise, is the WEAKER period
instrument on this corpus (it drifted letter to a worse-than-declared
period; both combs returned essentially the declared period on eat,
whose reader segments were already the noisiest in 23b's shootout). One
unregistered observation worth its own study: P1's residual score
orders the four songs exactly by draft success (0.137 and 0.229 s on
the two parity songs, 0.281 and 0.343 s on the two failures) — a
candidate zero-cost confidence signal for the feature to decline
gracefully, needing its own registration before anything leans on it.

**The decision, honestly composed.** The registered table's literal row
for G1-pass/G2-fail says the residual is the start bar; the anatomy
contradicts that rationale (G1's shifted pairing already removed the
start-bar factor, and letter's best shift still hits 7/76), so the
operative prescription is the G1-fail row's: for wandering songs the
grid leg needs beat-tracking-grade instruments or an alignment path.
The composite verdict to the app: ship-shaped for steady songs
(reader-derived uniform grid, no tap, no chart, baseline-parity drafts
and the best color recovery measured), undefined for wandering ones,
and the boundary may be mechanically detectable for free.

**Prediction scorecard:** (1) "G1 passes on all four" — RIGHT by the
letter, hollow as disclosed above. (2) "G2 fails via letter; peaceful
and mop within 5 points" — RIGHT in every named part (eat, unnamed,
also failed). (3) "P1 closer to the truth-fit than P2 on 3+ songs" —
WRONG, inverted: P2 won three of four. (4) "B3 >= 23b's B1 everywhere"
— WRONG, split 2–2 (the fitted period helped exactly where a period
exists). (5) "music-start variant helps letter, hurts peaceful" —
WRONG on both halves: letter's musicStart is 0.0 s (the recording
opens loud), so the variant starts at 0.45 s and hits 1/76, and
peaceful's is unchanged. (6) "spend <= $0.60" — RIGHT (≈ $0.3).

Disclosure: analyst Claude Fable 5, measured model claude-fable-5-1
(same family; grades mechanical, registered first). The gateway ignores
temperature on this model. Results in results/study24.json.

### Correction (2026-11-07, same day, found by Study 24's variant data): Study 23b's E4 claim was wrong as published

The 23b report, its FINDINGS verdict and its dashboard entry said the
music-start anchor (E4) "catches letter-lands' 7.15 s intro at 121 ms."
It does not. E4's anchor on letter-lands is t = 0.0 s — the recording
opens with a loud note — which is 7.15 s (about four bars) BEFORE the
charted music; the 121 ms figure is the CIRCULAR (mod-period) error,
i.e. exactly the coincidence a comb would report, not the past-a-phase
detection E4 was designed for. Prediction 6's E4 clause ("within one
bar of the 7.15 s truth start, which no comb can express") therefore
scored WRONG, not right as published. Across the corpus E4 found the
audio start, not the charted-music start (raw offsets −7.15, −2.39,
−6.5 and −0.29 s), so NOTHING measured yet detects an uncharted intro.
The shootout's other numbers are unaffected. The FINDINGS entry, the
auto-chart brief addendum and the dashboard entry carry the same dated
correction.

## Study 23b — the chartless-song grid kills the draft BOTH ways: a perfect tap does not save the declared tempo, and the registered decision is true-tempo estimation (2026-11-07)

Run as registered (6b2d599, $2 fence, ≈$0.6 spent by token parity with
Study 23's measured $0.31 — the runner logged tokens, 129,892 in /
24,647 out, not dollars). Both arms build the grid a CHARTLESS song
would actually have — period from the declared bpm and meter, bar count
from the recording's length — and everything downstream (transcription
binning, nchord hints, prompt, model, grading) is Study 23's verbatim.
B2 anchors the grid at the aligned truth's first bar start (a perfect
user tap); B1 takes Study 22's blind onset-comb phase. Gates sat on the
JSON chords channel, index-paired against the chart, baselines
recomputed in-run from results/study23.json.

**S23B-G1 FAIL on every song — the tap arm is the WORST arm measured.**
B2 roots against the grid-given baseline: letter-lands 39/76 vs 72/76,
eat-all-the-clocks 21/84 vs 68/84, peaceful-dreams 64/153 vs 151/153,
mop-heart 53/140 vs 131/140. The mechanical anatomy says why with no
room for argument: B2's grid hits the truth lattice at EXACTLY ONE bar
per song — its own anchor — and its mean per-bar error runs 3.3 to
8.4 SECONDS (multiple bars adrift by mid-song). The phase was perfect
by construction, so the entire error is the period: the declared bpm is
not the recording's tempo, and a uniform grid built from it walks off
the truth within a dozen bars no matter where it starts.

**S23B-G2 PASS, but inverted: the blind comb BEAT the perfect tap on
all four songs** (52, 51, 138, 133 roots — mop-heart lands ABOVE its
grid-given baseline, 133/140 vs 131/140, and peaceful reaches 138/153).
Two mechanisms, both visible in the committed records, neither a
vindication of blind grids: (1) the comb fits the whole recording's
onsets, so its wrong-by-whole-bars phase acts as a crude mid-song
recentering of the wrong-period lattice (B1 mean |err| roughly half of
B2's, e.g. mop 596 ms vs 3,347 ms); (2) these songs' progressions
repeat, so index-paired roots forgive a grid shifted by whole loops.
B1's grids are still not truth (index hits 7/86 at best): the scores
survive because the music is periodic, not because the bars are right.

**The registered decision table fires its third row: uniform grids are
insufficient even anchored. The feature needs alignment-grade grids or
true-tempo estimation — the declared bpm cannot be trusted as the
period, and no tap UX fixes that.** The dialect casualty confirms the
stakes: peaceful's 62 chart-dialect bars, 11 exactly right grid-given
(Study 23), drop to 4 (B2) and 6 (B1) — color spelling needs the right
notes in the right bar.

**The downbeat shootout ($0, Kevin's tap-free question):** graded by
circular anchor error against the truth's first bar start, hit within
15% of a bar. The onset comb E1 hits 3/4 songs (53/15/115 ms; misses
peaceful at 766 ms). The chord-change comb E3 hits 2/4 (73/179 ms),
the bass comb E2 1/4, and the music-start anchor E4 2/4 by
circular error — a figure corrected the same day: see the Correction
under Study 24 (E4's letter-lands anchor is t = 0, four bars before the
charted music; the 121 ms is mod-period coincidence). So yes: tap-free anchoring is
already roughly tap-grade on this corpus — and it is the wrong
question. B2 just proved a PERFECT anchor is worth nothing under a
wrong period. The measurement that matters next is the period itself
(the E3 comb generalizes to a phase-and-period search over the shipped
reader's chord-change times, at zero new UX).

**Prediction scorecard (registered first, scored against the data):**

1. "G1 fails via letter and eat; mop within 5 points; peaceful
   marginal" — HALF RIGHT. G1 failed, but on ALL FOUR songs; mop's tap
   arm lost 56 points, not <5. The declared-tempo rot is universal,
   not a two-song defect.
2. "G2 also fails, B1 below B2 on at least two songs" — WRONG, fully
   inverted: G2 passed with B1 above B2 everywhere.
3. "B2's index error grows roughly linearly (period error, not phase
   error), making the decision true-tempo estimation" — CONFIRMED in
   mechanism (anchor-bar hit, then seconds of drift; phase perfect by
   construction leaves only the period), though the runner persisted
   the anatomy as per-song summaries (hits, mean |err|), not the
   per-bar curve — disclosed.
4. "peaceful's dialect ≤ 5 of 62 under B2" — RIGHT (4).
5. "Spend ≤ $0.80" — RIGHT (≈ $0.6 by token parity).
6. "E3 beats E1 on ≥ 3 songs; E4 within a bar of letter's 7.15 s" —
   WRONG on both clauses: E1 beat E3 (3 hits vs 2), and the E4-letter
   clause's published RIGHT (121 ms) is corrected to WRONG under Study
   24 (the anchor was t = 0, four bars early; 121 ms was circular).

Disclosure: analyst Claude Fable 5, measured model claude-fable-5-1
(same family; every grade mechanical and committed before the run). The
gateway ignores temperature on this model (standing note since Study
23). All graders and the comb are prior studies' committed instruments;
results in results/study23b.json.

## Study 23 — recording to chart: all four gates FAIL on the chart the app would parse, while the same answers' JSON channel quietly contains the best chord numbers the program has ever measured (2026-11-07)

The end-to-end composition, run as registered (6b0c0b5, grid-given per
Study 22's decision, hints from the shipped reader, production prompt
and call shape, one fable call per song; measured spend ≈ $0.31 against
the $2 fence). Every gate was set on the CHART channel — the draft's
markdown read through the production barmark adapter, the thing a user
would see — and every gate failed:

- **S23-G1 FAIL:** peaceful-dreams' chart does not parse at all.
- **S23-G2 FAIL:** only letter-lands' chart carries the right bar count
  (76); eat renders 68 of 86 bars, mop-heart 84 of 140.
- **S23-G3 FAIL:** with bars missing, the chart channel's index-paired
  roots collapse (30/84, 38/140).
- **S23-G4 FAIL:** 0 of peaceful's 62 dialect bars on the chart channel.

**The anatomy inverts the verdict's texture: the model did the musical
job, and lost it in serialization.** The same answers' `chords` field
(production's bar-exact JSON channel) grades:

- letter-lands 76 bars, roots 72/76 — ABOVE the hint's 70;
- eat-all-the-clocks 86 bars, roots 68/84 (the one true regression,
  7 points under the hint on the vocal-heavy song);
- **peaceful-dreams 153 bars, roots 151/153 — above the hint's 149 —
  with strict 84/153 against the reader's 20, and 11 of the 62 dialect
  bars EXACTLY right**: D7sus4 written strictly 11 times where the
  reader alone scores zero by vocabulary, and G7 on ten G5(7) bars —
  the seventh heard, the chart's spelling absent from every example,
  the same half-heard signature Study 21 measured in the reader;
- mop-heart 140 bars, roots 131/140, strict 129/140.

Had the gates been set on the JSON channel, G1/G2 pass trivially, G4
passes at 11 ≥ 10, and only G3 fails (eat). They were not, and they are
not re-thresholded: the chart channel is what ships, and it is broken
in a specific, legible way. Peaceful's chart writes CELL-level repeats
("| D5 x8 |") that the band's notation does not define — invited by the
production prompt's own compact example ("D(7)sus4 · D5 x2") — and the
parser refuses the document. Mop under-writes its repeats and loses 56
bars. The failure is not hearing, not harmony, not structure detection
(the section lists are sensible); it is the last step, serializing an
already-correct per-bar answer into parseable barmark.

**Verdict to the app:** the auto-chart composition is one deterministic
step away from viable. The draft's JSON already carries bar-exact
chords and section starts; a chart BUILT from those fields by code —
rather than trusted from the model's free markdown — would have passed
G1, G2 and G4 on this pilot, with only eat's root regression left to
examine. Constraining the prompt's chart examples to row notation is
the weaker second option. Nothing ships from this pilot; the fix is an
app-side design choice and any re-test is a new registration.

**Prediction scorecard — a clean sweep of the right kind:** all five
predictions WRONG on the gated channel, and every predicted MECHANISM
visible in the JSON channel (parse quality, hint-following roots,
7sus4-led dialect recovery concentrated exactly where the prompt's
examples reach, mop's strictness). The bench predicted the music and
failed to predict the serialization.

**Disclosures:** analyst Claude Fable 5, measured model claude-fable-5-1
(same family; grades mechanical and registered first). The gateway
reports temperature is not supported by this model and ignored — the
program's standing temperature-0 deviation is therefore void on fable
calls (as the Claude 5 gateway notes already record); calls are
production-shaped either way. The run also surfaced that peaceful-dreams
transcribes to 2,477 notes (the densest input yet, 25.7k prompt tokens).

## Study 22 — the bar grid from the recording alone: the sanity gate caught the bench's metric, the decision gate failed everywhere, and the real finding is that the program's truth cannot certify a grid finer than itself (2026-11-07)

The recording-to-chart question (Kevin, 2026-11-07) stands on a prior
one: an auto-written chart has no chart to align, so can a usable bar
grid come from the recording alone? Registered 0f2e02d with the shipped
tempo detector's catalog-tuning and 210 bpm range cap disclosed up
front; $0.

**The first run failed its own sanity gate, as designed.** S22-G1 ran
the declared-tempo-plus-blind-phase pipeline on each chart's SYNTHETIC
render, whose true bar starts are exact, and scored 0 % on all four —
because the registered metric paired grid index to bar index while a
blind phase estimate exists only modulo the period. The comb had in
fact landed 68 ms from the render's downbeats. Per the program's rules
the metric was replaced (amendment 1, 7466564: lattice distance, each
truth bar start against the nearest lattice point, the arm's period
reported beside the rate so a half-period lattice cannot take silent
octave credit), with the defective run's real-song numbers disclosed as
seen. On the re-run **S22-G1 PASSES at 100.0 % on all four renders.**

**S22-G2 FAIL, decisively: the declared-tempo arm reads 8.5–68.8 %
against the 80 % line — and the least-squares CEILING reads only
27.3–37.9 %.** When the best uniform grid that can be fit to the truth
itself misses two-thirds of the truth at ±15 % of a bar (mean absolute
error ~400 ms, against tolerances of 122–280 ms), no derivable grid
could have passed. The mechanism is the finding:

- **The chart-anchored DTW truth resolves bar positions to a few
  hundred milliseconds, no finer.** Its step size is 93 ms and its path
  wanders: consecutive truth bar durations swing hundreds of ms (p5–p95
  on letter-lands: 0.91–2.15 s around a 1.70 s median). Per-bar CHORD
  grading tolerates this — a boundary a few hundred ms off barely moves
  a 1.7 s bar's vote, which is why Study 21 read 97 % roots on the same
  grids — but a bar-position gate at ±15 % of a bar is finer than the
  ruler. Whether the bands also genuinely drift cannot be separated
  from the ruler's wander with these instruments.
- One open observation is recorded without adjudication: letter-lands'
  chart declares 132 bpm and the (catalog-tuned) detector agrees at
  132.0, while the truth's median bar implies ~141. Either the chart's
  figure is nominal or the DTW compresses; finer truth would say.
- **Arm A1 (fully blind detector): every detected tempo sits on a
  Study 11 ladder rung of the declared** (1.0, 1.0, 1.499, 2.0 — the
  224 bpm song capped to half time by the detector's range, as
  disclosed), and the off-rung grids score 3.5 % and 27.9 %.

**The registered decision:** the end-to-end draft study may NOT assume
a derivable uniform grid. Constructively: it should run grid-given
(the chart-anchored alignment, like every chord study) and register the
no-chart grid as an open problem that needs finer truth than the bench
owns — human-tapped downbeats or a validated beat tracker — before it
can even be measured, let alone passed.

**Prediction scorecard:** 1 WRONG as first registered (the sanity gate
failed — on the bench's own metric — and RIGHT after the amendment it
forced), 2 WRONG in the most decision-relevant direction (ceiling
28–38 %, not ≥ 90 %), 3 NOT EVALUABLE (its premise, a ≥ 90 % ceiling,
never occurred), 4 RIGHT in full (all four on ladder rungs; raw-octave
grids under 50 %), 5 RIGHT (mop-heart weakest at 8.5 %).

**Disclosure:** analyst Claude Fable 5; zero model calls; both runs'
numbers committed; the amendment changed the metric's wraparound
behavior only, with thresholds untouched, and the synthetic sanity gate
re-arbitrated it.

## Study 21 — the chord reader on the rest of the catalog: the roots generalize at 90 %, the all-triad song is the program's first big strict result, and the gate fails on the grade's vocabulary, not the reader's hearing (2026-11-07)

The shipped reader's real-audio numbers rested on the two songs the
pipeline was developed against. Study 20b banked truth for the other two
charted Badverbs songs AFTER the reader shipped, so this study graded it
there (registered fbf1110; $0; no transcription — the reader works on
the mix). One registered grading decision, made pre-data: the power
allowance extends to truth quality "5(7)" (a power chord with an
optional seventh declares no third either), pinned identical to the
Study 13 grade wherever that quality is absent.

- **S21-G1 PASS exact:** the anchors reproduce 59/76 and 53/86 — the
  fourth reproduction.
- **S21-G2 FAIL as registered:** peaceful-dreams reads 73/153 (47.7 %)
  against the 50 % line; mop-heart reads 107/140 (76.4 %) and passes
  its half easily. The gate fails by four bars, and the anatomy says
  the four bars — and forty more — are the grade's vocabulary, not the
  reader's hearing.

**The anatomy:**

- **Roots, the number that transfers: 90.3 % across the catalog**
  (letter-lands 70/76, eat 75/84, peaceful-dreams **149/153 — 97.4 %,
  the best root performance in the program**, mop-heart 115/140).
- **mop-heart is the program's first big STRICT result:** 107 of its
  140 bars exactly right, zero allowance credit — plain major triads
  are the model's native vocabulary, and the sparse 3/4 arrangement
  that destroyed the note-channel power hint (16 fires, 16 misses in
  Study 20b) does not trouble a reader that hears the mix. Prediction 3
  landed exactly: on an all-triad chart, right means strictly right.
- **peaceful-dreams fails on dialect, not hearing.** 62 of its 153 bars
  (40 %) carry qualities outside the allowance vocabulary. On the 32
  X5(7) bars the model answers X7 on 24 — it HEARS the optional
  seventh — but "7" is not in the registered allowance set {maj, m, 5},
  so only its 6 plain-maj answers credit. On the 30 7sus4 bars it
  answers X7 or Xsus4 (roots right 29 of 30), each half of the truth,
  credit zero. The registered gate stands un-re-thresholded; the
  disclosed root-level and per-class reads carry the real story, as
  Study 17's did.
- The verbatim-grade delta was 6 bars, not the predicted 15–30, for
  the same reason: the model says 7, not maj, on 5(7) bars, so the
  extension had little to credit. A wrong prediction that uncovered a
  better fact.

**Prediction scorecard:** 1 RIGHT (exact), 2 WRONG twice over (47.7 %
below the band; delta 6 — the model hears the seventh), 3 RIGHT
exactly (strict-first = right, 107 = 107), 4 WRONG (G2 fails on
peaceful-dreams), 5 RIGHT (combined 292/453 = 64.5 %, within ten points
of the two-song 69.1 %).

**What it means:** nothing changes in the app — the reader is already
shipped and Study 17's hedge already says it will not spell the chart's
colors. What changed is the evidence: the reader's roots now stand on
four songs instead of two, at 82–97 % per song, and the colors it
misses are half-heard (the seventh in 5(7), the sus-or-seventh split in
7sus4) rather than unheard — which is precisely the raw material the
draft layer reads. The suggested end-to-end draft study inherits this
as its baseline. A future grading note, registered before it is needed:
charts in other dialects will keep hitting allowance-vocabulary edges,
and the honest fix is per-study registration of the allowance against
the chart's own symbol census, never post-hoc.

**Disclosure:** analyst Claude Fable 5; zero model calls; the one new
grader is pinned by test to Study 13's wherever 5(7) is absent (both
anchors, mop-heart, the whole fixture vocabulary), so no prior number
moved. Spend $0.

## Study 20b — the power hint on held-out songs: both gates FAIL — one on the merits, one on the bench's own registration error (2026-11-07)

Study 20's one asset — the power call's 22-of-23 precision — was frozen
verbatim and taken to two songs whose charts the bench had never seen
(registration 7c40f9a BEFORE the truth arrived; the charts came from
Kevin after the app's firewall blocked the planned public-page fetch,
committed verbatim with provenance at 80d24d7). Kevin's direction: the
blind pitch-floor variant rides as a disclosed secondary arm. $0 spent.

**S20B-G2 FAIL — the bench's registration error, owned and fully
diagnosed.** The anchors re-ran at 25 fires / 24 right (letter-lands)
and 16 / 10 (eat) against registered constants of 23/22 and 12/7. The
cause is not the pipeline: Study 20's anatomy counted bare `X5`
SYMBOLS, but the registered implementation counts `rule === "power"`
FIRINGS, which include power calls the full candidate then dressed with
a slash (2 on letter, 4 on eat). The re-derivation from the committed
study20.json reproduces the 20b firing record BAR FOR BAR on both
anchors, so reproducibility holds exactly; the constants I registered
were derived from the wrong column. The gate fails as registered and is
not re-thresholded; the diagnosis stands beside it.

**S20B-G1 FAIL on the merits: 60.9 % held-out precision (39 of 64)
against the 0.75 line.** The anatomy is a regime story, not noise:

- **peaceful-dreams: 81 % (39/48), and on in-vocabulary power bars the
  rule was PERFECT — 39 of 39.** Its nine misses: six on `X5(7)` bars,
  where the power-class read was right and all six would grade right if
  the hint had the chart's `(7)` spelling (the vocabulary gap Kevin
  flagged mid-study, measured); one on a 7sus4 bar; two on the triads
  verse. Genuine wrong fires: three.
- **mop-heart: 0 % (0/16).** Every fire landed on a plain major-triad
  bar. Sparse 3/4 material (Vox, Bass, Keys; ~5.5 transcribed notes a
  bar at 224 bpm, against letter-lands' ~15.5) simply fails to put the
  third on the page, and the rule reads that silence as a power chord.
  "No third transcribed" is evidence of absence only when the
  arrangement is dense enough that a played third would have been
  transcribed. Even crediting peaceful's six spelling-gap bars, the
  held-out total is 45/64 = 70.3 % — the gate fails either way,
  and mop-heart is why.
- **Arm B (blind pitch floor) is worse, decisively: 48.8 % (39/80).**
  On mop-heart it fired 33 times, all wrong — the floor strips the bass
  register where that arrangement actually carries its thirds, so it
  manufactures false absences. The registered decision rule keeps A; B
  is reported and not recommended.

**Verdict: do not ship the power hint.** Its precision is not a number,
it is a function of arrangement density: 96 % on letter-lands, 81 % on
peaceful-dreams, 0 % on mop-heart, and the hint cannot tell which song
it is in. The one defensible successor idea the data names is a density
precondition (fire only when the bar carries enough transcribed
evidence that an absent third is informative) plus the `(7)` spelling —
registered fresh and blind if the app wants it; the bench does not
recommend further spend unprompted. The card's hedge stays "never a
power chord."

**Prediction scorecard:** 1 WRONG (G2 — the bench's own constants), 2
WRONG (64 fires, above the 10–35 band), 3 WRONG (60.9 %), 4 half (B
fired more, as predicted, but its precision fell 12 points, outside the
0.10 band — the floor's rationale inverts on bass-carried
arrangements), 5 WRONG (root-conditioned held-out precision 64 %, not
≥ 85 % — mop's fires were root-right and still wrong, because the truth
is a triad).

**Disclosure:** analyst Claude Fable 5; zero model-API calls; grades
mechanical and registered before the truth was seen. One pre-run
instrument amendment (render-only parenthetical strip, 80d24d7) and one
mid-study clarification to Kevin about it are in the session record;
the graded truth was never softened. Transcription counts matched the
prior studies exactly (1179 and 985 notes), so the anchors' inputs were
bit-identical.

## Study 20 — coloring ChordMini's roots from the notes: all four gates FAIL, and the hypothesis is refuted as specified (2026-11-07)

The app's brief (committed as docs/bench-brief-chord-colors-2026-11-07.md
in its repo) proposed `colorChord`: with the root fixed by the model, let
the bar's note profile choose the chart's color — power chord, sus4,
sus2, a major/minor flip, a slash bass — without ever touching the root.
The bench verified the brief's premises (roots 70/76 and 75/84; letter's
truth is 74 power + 50 sus4 slots), registered its own pass lines at the
brief's suggested shape (2e523e6), built the candidate to spec with
pinned instruments, and ran it. **Every gate fails.** $0 spent.

- **S20-G1 FAIL (the point):** A1 strict reads 22/76 and 14/86 against
  pass lines of 46 and 38. The synthetic sweep said 438/440; the real
  recordings say 22/76 — the program's home-field lesson (Studies 13,
  17, 18) repeats in its sharpest form yet.
- **S20-G2 FAIL (roots fall):** root-level drops 59 → 55 on letter-lands
  and 53 → 33 on eat-all-the-clocks. The recoloring is destructive
  exactly where the model was already credited: Em → Esus4 on seven E5
  bars, sus2 and slash dressings on power-chord truth, each one
  trading an allowance-credited triad for a wrong color.
- **S20-G3 FAIL:** the cost of guessing is 4 on letter-lands (at the
  line) and 20 on eat (five times it).
- **S20-G4 FAIL, reversed:** the negative control BEATS the candidate —
  A3 (the matcher's own templates, root forced, sevenths allowed) totals
  48 strict against A1's 36, and on eat it even beats the raw model
  (26 vs 19 strict) by writing the m and m7 colors eat's truth actually
  contains. The premise that the seventh fence was the protective piece
  is refuted: the hand rules, not the sevenths, are what loses.

**The anatomy (why the notes cannot color these bars):**

- **The power rule is precise and starved.** When A1 said power chord it
  was right 22 of 23 times on letter-lands. But it reached only ~23 of
  the ~74 power bars: on the rest, the re-transcription's profile shows
  a third or a fourth above the 12 % line that the recording's guitars
  never played — harmonic smear and bleed, the same artifact class
  Study 13 documented at the chromagram floor. On roughly 50 of
  letter's power bars the right color is UNREACHABLE by any
  profile-threshold rule, because the note evidence itself contradicts
  it (the brief's "colors not reachable" answer, measured).
- **The sus rules are the damage.** 20 sus4 and 5 sus2 calls on eat, 0
  right; 8 sus4-class calls on letter, 0 right. Phantom fourths turn
  credited triads into uncredited sus chords.
- **The slash rule, flagged pre-run as unvalidatable, behaved exactly
  that way:** 14 firings across both songs, zero slash chords in any
  truth, every firing a cost.
- **The flip**: fired 3 times, all on letter-lands where no maj/min
  truth exists, 0 right. The registered decision rule drops it.
- **The bench's own registered interpretation cost bars and is owned
  here:** sus4-before-power (registered because the brief's literal
  order made sus4 unreachable) sent 3 letter and 11 eat bars to sus4
  where power would have been strict-right. Under the brief's literal
  order the scores would be ~25/76 and ~25/86 — every gate still fails.
- **The vocal-stem split barely matters here:** excluding eat's vocal
  stem moves A1 by +1.

**Prediction scorecard (mostly wrong, as a refutation should be):** 1
WRONG (predicted 50–62 and 40–50), 2 WRONG (predicted a dip ≤ 1;
measured −4 and −20), 3 half wrong (letter's cost 4 is at the line, eat's
20 is five times it), 4 WRONG REVERSED (predicted A3 under half of A1;
A3 won), 5 half right (the flip's record and the drop recommendation,
yes; slashes fired 14 times, not ≤ 2), 6 RIGHT (the fixture picked
0.12; A2 ≡ A1 everywhere), 7 RIGHT (vocal +1, inside +0..+4).

**Verdict to the app:** do not ship `colorChord`; the card's hedge stays
"never a power chord." The one measured asset worth a successor brief is
the power rule's precision: root and fifth dominant with third, fourth
AND second all absent was right 22 of 23 times when it fired. A
candidate that ONLY makes that call (no sus, no flip, no slash, model
otherwise untouched) would have scored ~22/76 strict at a cost of ~1 —
a hint, not a recoloring. That is a different study, registered fresh if
the app wants it.

**Disclosure:** analyst Claude Fable 5; zero model-API calls; every
grade mechanical and committed before the run (barmark 0.17.0 strict
grade — aliased, because Study 16 pins the bare dependency at the app's
0.5.0; evidence arithmetic pinned to the Study 18 port over all 440
fixture bars; the forced-root control pinned to chordOf231 exactly).
Notes channel: the bench's summed-stem transcription, a disclosed
difference from the app's per-stem weighting.

## Study 19 — the ChordMini port gated: perfect frame parity, and the bench's numbers are now the app's (2026-11-06)

stem-shovel shipped the Study 17 chord pipeline in TypeScript (app
commit 2256d489: librosa's CQT baked into a plan, a 255-tap Kaiser
half-band in place of soxr, the SHA-pinned `chordnet.onnx` under
onnxruntime-web in a child process, the reference smoothing, the
bench's vote and label map) and asked the bench to gate the port
(`docs/bench-brief-chordmini-2026-11-06.md` in the app repo; its
promised parity table was absent, so everything here is measured
fresh). The app's code ran AS COMMITTED from a pinned worktree, no
bench port; the reference is `nchord.py` exactly as Study 10 pinned it.
Registered 5b773aa. Zero model-API spend.

**Both gates PASS, at the strongest possible reading.**

- **S19-G1 (frame parity), PASS at 100.000 %:** zero disagreeing
  frames on all four public mixes — 1,522 + 1,588 + 2,764 + 1,228 =
  7,102 frames, every per-frame label identical to the Python
  reference's. The TS CQT (Kaiser resampler included), the wasm ONNX
  inference and the smoothing reproduce numpy + librosa + the Python
  runtime bit-for-bit at argmax level. Frame counts match exactly per
  song.
- **S19-G2 (bar parity), PASS exact:** the app's per-bar vote reads
  **59/76** gated and **53/86** exploratory — Study 17's registered
  numbers to the bar, not merely within the one-bar tolerance.

**The one disclosed difference, fully anatomized:** the internal
cross-check (the app's vote over the REFERENCE's frames vs nchord's own
perBar) differs on letter-lands at exactly two bars, 61 and 63. Both
are exact 5-to-5 frame ties between raw `F#` and `F#:min`; numpy's
argmax breaks a tie toward the lower vocab index (F#m), the app's vote
toward the first label the bar encounters (F#). The truth at both bars
is F#5, the power allowance admits either reading, and the grade is
identical either way. Tie-break order on exact ties is the entire
remaining daylight between the two implementations.

**Prediction scorecard:** 1 right and exceeded (predicted ≥ 99.9 %,
measured 100.000 % everywhere), 2 right exactly (identical scores
predicted and found), 3 vacuously satisfied (no disagreeing frames
exist to locate), 4 right (frame counts equal).

**Standing rule restated:** the app never runs the reconciler on the
model's chords (Study 17 G4, sixteen breaks); the shipped code's
comment carries it and nothing here changes it.

**Verdict:** ship stands; the bench's Study 17 numbers are now the
app's own, by measurement rather than citation. Pre-registration
checks: the app's `chart-symbols.json` is the bench's vocab map (170
entries, zero diffs) and its `chordVocab` matches in index order.
Disclosure: analyst Claude Fable 5; no model API measured; every grade
mechanical and committed before the run; ~30 seconds of compute per
song. Spend $0.

## Study 18 — the matcher's two new rules on real audio: both earn their keep, and the handoff's own hedge is overturned (2026-11-06)

stem-shovel v0.231.0 changed two matcher rules after re-scoring THIS
bench's fixture notes (the handoff is committed verbatim at
docs/HANDOFF-2026-11-06-matcher-v0231.md): a bass note must sound for
15 % of the bar to earn the root bonus, and a template tone under 12 %
of the profile counts as missing at a 0.12 cost. The app could verify
the synthetic side; its real-audio table was a disclosed approximation
(notes rebuilt from `barNotes` text, baseline 48/76 where the stored
truth is 29/76) whose directional read said the presence rule was a
wash or a small loss there. Study 18 ran the proper measurement:
registered 2b692cf, one parameterized port of the v0.231 matcher pinned
bar-for-bar to the v0.142 port at the old constants, notes
RE-TRANSCRIBED from the committed raws, two rules measured separately.
Zero spend, no model calls.

**All four gates PASS.**

- **S18-G1 (anchor), PASS exact:** the v0.142 configuration over the
  re-transcribed notes reads 29/76 (strict-first 20, power 9) and
  24/86 — the anchor's third exact reproduction.
- **S18-G2 (fixture), PASS exact:** the handoff's five-row table
  reproduces to the digit (424 / 432 / 432 / 439 / 439 of 440;
  static-bloom 20 → 28 of 28), re-derived through the bench's
  registered port. `matcher3Segments` / `matcher3PerBar` now sit beside
  the v0.141/v0.142 fields in corpus/fixture.json (nothing rewritten).
- **S18-G3 (the bass rule), PASS:** bass-only lifts the gated song
  29 → 39/76 and the exploratory song 24 → 26/86. Both inside the
  registered central estimates.
- **S18-G4 (the presence rule), PASS — and the hedge is overturned:**
  shipped reads 41/76 and 30/86, total 71 against bass-only's 65, so
  the presence rule is net +6 on real audio where the handoff's
  approximation read it as a wash or a loss. The app's stated judgment
  ("an under-claimed power chord is the better failure for a chart
  hint") was right on the merits, and now it is right on the numbers:
  the lossy note reconstruction (sub-150 ms notes and start times
  dropped) was the artifact, not the rule. Strict-first rises too
  (20 → 24 gated, 18 → 23 exploratory), so the gain is genuine
  readings, not allowance credit.

**The headline:** two constants and one duration check take the real
chord path from 38.2 % to **53.9 %** on the gated song — 41/76, exactly
Study 13's reconciled number. The free code change is worth as much on
this song as the language-model reconciler pass was. The ordering from
Study 17 is unchanged, and the report says so plainly: ChordMini on the
mix still reads 59/76, eighteen bars past the improved matcher, so the
front-end swap remains the measured next step; the improved matcher
raises the floor the app already ships, not the ceiling.

**The sweep (disclosed, ungated):** shipped (0.12 / 0.15) sits on the
plateau on both songs. Bass 0.10 readmits pickups on the gated song
(41 → 37); bass 0.25 regresses the exploratory song, whose bass moves
faster, exactly as the handoff reasoned. presentShare 0.15 buys one to
two bars on the gated song's power-chord-heavy truth and nothing
reliable elsewhere — informational for the app, no re-tuning
recommended, and none performed.

**Prediction scorecard:** 1 right (exact), 2 right, 3 right in full
(both central estimates hit: +10 and +2), 4 WRONG in the happy
direction (predicted the presence rule's real net in [-5, 0) and a
revert recommendation; measured +6 — the registered gate, adopted
unchanged from the handoff's own suggested rule, settles it the other
way), 5 mostly right (the bass 0.25 regression and the letter-lands
monotonicity both appear; the plateau is flatter than predicted).

**Cross-study notes (the handoff's items 3 and 4):** Study 10's
ChordMini fields are untouched; any re-tabling moves the production
matcher's synthetic column to 439/440. Studies 13/14/17 reconciler
cells stand as computed from the stored v0.142 hints; the hint baseline
has moved from 29/76 to 41/76 for anything measured after v0.231.0, and
future studies gate anchors against the version they pin.

**Disclosure:** analyst Claude Fable 5; no model measured; every grade
mechanical and committed before the run. The bench verified the
handoff's synthetic claims pre-registration by running the app's own
pre- and post-fix chords.ts over the fixture notes (disclosed in the
brief, prediction 2); the registered gate re-derived them through the
bench's port. Spend $0; ~8 minutes of transcription CPU.

## Study 17 — the transcription successor: the neural rematch wins on real timbres, and the reconciler meets its first breaks (2026-11-04)

Study 13 named the transcription stage as the binding constraint on
real-recording chord drafts (38.2 % gated) and pointed the next
investment at "Basic Pitch's successor on real timbres, not more
model." Three zero-model successors measured against that cliff
(registered d374708; brief docs/BRIEF-STUDY17.md): per-stem
transcription into the same matcher (B), bar-pooled chroma into the
same matcher (C), and ChordMini — Study 10's synthetic loser — on its
first real audio with bar-aligned chord truth (D). One conditional
reconciler arm (E) on the winner.

**G1 PASS, exact.** The anchor reproduced Study 13 arm 1 to the digit
(29/76, strict-first 20, power 9; exploratory 24/86) before anything
new was read.

**G2 and G3 PASS, both through arm D.** ChordMini on the mix scores
**59/76 (77.6 %)** on the gated song and 53/86 (61.6 %) exploratory —
past the 37/76 successor gate AND past 44/76, production's reconciled
number, so a zero-model front end now beats code-plus-model. Study
10's synthetic verdict reverses on real audio, the home-field lesson's
third instrument class (sections flipped with LinkSeg, now chords with
ChordMini).

**The anatomy matters as much as the number.** The gated chart's truth
is 74 power-chord and 50 sus4 slots — this band writes roots and
colors, not sevenths — and D's gated credit came ENTIRELY through the
registered power-chord allowance (strict-first 0): it reads roots as
plain triads. A disclosed, unregistered root-only read makes the real
ranking visible: anchor 53/76 roots, B 65, C 68, D-mix 70 (exploratory:
D-mix 75/84, anchor 60). Every successor out-reads the anchor at the
root level; the registered differences are quality dressing. Arm C is
the sharpest case: 0/76 under the registered grade — its pooled chroma
dresses nearly every right root in a hallucinated seventh (the exact
over-read class its pre-registration self-proof surfaced and the brief
disclosed), and the allowance admits only maj/m/5 qualities — while
holding 68/76 roots. A quality fix would need a mass threshold, which
is a tuned parameter, so it belongs to a registered follow-up or
nowhere. Arm B splits by stem inventory, and the mechanism is legible:
letter-lands has no vocal stem and B improves (32/76 registered, 65
roots vs the anchor's 53); eat's stem set includes the vocal stem,
whose transcribed melody pollutes the merged harmony, and B drops
(15/86, roots 47 vs 60). If per-stem transcription ships anywhere,
vocal-labeled stems stay out of the chord evidence — untested here,
registered nowhere, so a hypothesis, not a finding. The disclosed
D-harm read (ChordMini on the summed non-drum audio) beat D-mix on the
gated song (63/76) and collapsed exploratory (33/86 vs 53) — the
registered choice of the mix, ChordMini's native domain, survives.

**G4 FAIL — the reconciler's first breaks in three studies, and the
gate built for this caught it.** E stacked Study 14's production
reconciler path on D-mix with arm A's note lines as evidence (the
registered design: C and D produce no notes). Gated: 59 → **47**,
fixes 4, breaks **16** — after two studies of zero breaks. The
mechanism is exactly the agreement trap the gate was registered
against, in a new costume: D's chords are better than the transcribed
notes support, so "correct the chords toward the notes" destroys
information. The reconciler's measured value is conditional on its
evidence channel being the one that produced the draft. On the
exploratory song it changed nothing (0/0). Negative result, kept
loudly: do not stack the note-reconciler on a non-note front end.

Prediction scorecard: 1 right (exact). 2 wrong (B 32 < the predicted
35 floor, and it fell on the exploratory song). 3 wrong, spectacularly
(C registered 0/76; the disclosed over-read class at full scale — C > B
held only in the unregistered root read, 68 > 65). 4 half (direction
right, magnitude exceeded the 40–50 band, and the strict-first-0
anatomy was not foreseen; the predicted maj7/m7 miss class does not
exist in this truth). 5 right (G3 passed via D, one of the two named).
6 wrong in the instructive direction (predicted breaks ≤ 2 and ≥ 50
reconciled; got 16 breaks, 47, G4 FAIL).

### What production does with this

ChordMini on the mix is the measured chord front end for real
recordings: 38 % → 78 % registered on the gated song (roots 70–75 of
76–84 on both), 4–6 s per song on CPU, ~30 MB of pinned weights, zero
API spend. Its limits ship with it: the output vocabulary is
root-level (it will never spell F#5 or Esus4), so the draft layer that
renders chart symbols decides the dressing — for this band's material,
root-plus-power-spelling covers most of the chart. Do NOT run the
Study 13/14 note-reconciler on its output (G4: 16 breaks); the
reconciler remains valid only on the Basic Pitch path whose notes it
reads. The home-field rule is now three-for-three: no detector
decision for real recordings gets made on synthetic numbers again.

### Spend

Arms A–D $0 (local CPU, ~40 min of transcription). Arm E two calls,
≈ $0.30 of the $2 fence. Program spend since Study 9: ≈ $1.80.

### Disclosure

Analyst Claude Fable 5; arm E measures claude-fable-5-1 (same family;
every grade mechanical and committed before any call). The root-only
table is disclosed, unregistered analysis, clearly separated from the
registered gates. The gateway ignores temperature on this family
(standing disclosure); no temperature was set.

## Study 16b (micro) — the shipped two-clause samePiece: the escapee class is closed by production code (2026-11-03)

The Study 6b pattern: stem-shovel shipped Study 16's urgent ask at
2d585b75 (citing the escapee by name in its commit message), and the
bench validated the ship on the registered corpus. Verbatim port pinned
by test; zero spend; registered before the run.

**All gates PASS, 15/15 pair verdicts, both predictions hit.** The
constants are exactly the recommended pair (1.6 AND-ed with 0.30,
inclusive boundary). All four right pairs stay samePiece true. All
eleven alignable wrong pairs are false — including eat-recording ×
mop-heart-chart at ratio 1.74, the pair that defeated the ratio clause
in Study 16 and would have been called the same piece by the previous
production code. Placements and hedges are byte-equal to Study 16
(the clause touches only the verdict, as designed). The one
non-alignable pair stays refused by production's own too-long check.

The alignment thread that opened with Study 12 is now fully closed on
shipped code: placement validated (12, 15, 16), the same-piece gate
validated twice and hardened once (14's constant catch, 15's
complementarity analysis, 16's escapee, 16b's confirmation of the
ship). Verdict to stem-shovel: nothing to change.

## Study 16 — the chart reads barmark: the adoption validated end to end, the migration grid-perfect, and a wrong pair finally defeats the ratio clause (2026-11-01)

The adoption study. stem-shovel retired its in-house chart parser for
the barmark standard (pins 371831ae / b5ed9ed2 / a0926c65, barmark
0.5.0 exact; the adapter port is byte-identical below the imports and
the alignment ports from Study 15 are unchanged at the pins). All five
stored Badverbs charts were migrated; the four public ones are the
corpus, fetched verbatim with the band's current declared sections
(Interbellum is not on a public page — disclosed, out of scope).
Registered b589daf; Amendment 1 (exploratory-pair refusal handling)
before results were accepted; zero spend. **All four gates pass; all
four predictions hit.**

**S16-G1 PASS — the parsers agree bar for bar.** The three committed
app-dialect texts through the retired `chordChartBars` and through
`barmark` 0.5.0 behind the production adapter (identical bodies, each
parser its registered dialect header): 76 / 152 / 86 bars, zero
differences, zero warnings. Nothing the app could read was lost in the
adoption.

**S16-G2 PASS — the migration is grid-perfect.** Every public migrated
chart parses with zero warnings and lands EVERY band-declared section
start at **0.0000 s** error on its own grid — letter-lands (76 bars,
10 sections), peaceful-dreams (153: the verified 152 plus the
grammar's ring-out attack bar), eat-all-the-clocks (71, the band's
corrected play-order form), and exploratory mop-heart (140 bars, 8
sections, 3/4 at 224 bpm with a mid-chart key change). Content against
the verified lists: letter and peaceful zero differences under the
registered normalization (Logic parentheticals fold onto the bench
vocabulary: `F#5(7)` ≡ `F#5`, `C#(7)` ≡ `C#7`).

**S16-G3 PASS — and the two-clause design finally earns its keep on a
gated-set scale and beyond.** Right pairs: ratios 1.90 / 3.18 / 2.63,
median local costs 0.177–0.210, all passing both clauses. All six
registered wrong pairs fail. But the margins kept eroding: the wrong
pairs peak at 1.55 / 1.57 on the ratio (Study 15's thin 0.02 again),
caught by local costs 0.33–0.48. And in the EXPLORATORY mop-heart
cross-pairs, the eat-recording × mop-chart pair scores **ratio 1.74 —
the first real wrong pair ABOVE the 1.6 gate** — and is rejected only
by the second clause (median local 0.323 > 0.30). The ratio clause
alone is now demonstrably insufficient on real material; the AND is
load-bearing, exactly as Study 15's complementarity analysis
predicted. (One exploratory pair was refused outright by production's
own too-long check — the right answer by construction.)

**S16-G4 PASS — no placement regression.** letter-lands median
|section error| 0.05 s (baseline 0.08), peaceful-dreams 0.11 s
(baseline 0.11), through the entirely new parse path.

**The predictions, 4/4.** P1: bar counts exactly 76 / 153 / 71.
P2: eat-all-the-clocks — exploratory in every prior study because its
chart was wrong — drops from median |err| **1.99 s to 0.09 s** with
the band's corrected chart and is now gate-grade on every measure; the
Study 12 finding that the chart, not the aligner, was the bottleneck
is confirmed by the fix. P3: ratios moved at most 0.14 where content
was preserved (letter 2.04 → 1.90, the beat-level refinements in the
migrated chart change the rendered reference). P4: mop-heart's
first-ever alignment passes the two-clause gates.

Recommendation delivered to stem-shovel (FINDINGS): adoption
validated, ship with confidence; the one standing ask is the
LAST-SOUND ring-out refinement (Study 15's +3.33 outro residual, still
visible here as peaceful's ±1.7 s tail sections), and the bench's
standing recommendation to adopt the medianLocal ≤ 0.30 clause in
production `samePiece` is now urgent rather than prophylactic — a real
catalog pair crosses the ratio gate.

## Study 15 — the patch registered at n = 3, the ratio's margin collapses to 0.02, and the local-cost clause saves it (2026-10-30)

The Study 14 response's remaining asks, run the day the band's revised
Peaceful Dreams chart qualified as the second GATED song (its ten
sections grid-match the declared starts exactly — the first fully
machine-true chart in the catalog). Verbatim port at bc683871
(v0.201.2); zero spend; registered be65593.

**S15-G1 PASS — by two hundredths.** Right-chart ratios 2.04 / 3.21 /
2.53, all six wrong cross-pairs below 1.6 — but the two new pairs
involving Peaceful Dreams land at **1.57 and 1.58**, a 0.02 margin.
The 1.6 constant survives its first expansion of n and is officially
thin: same-key, same-tonality wrong pairings close most of the gap.

**S15-G3 PASS, clean — and this is the deliverable.** The real-domain
median per-bar local costs separate completely: right charts 0.172–
0.243, wrong charts 0.365–0.482. **The recommended second clause:
`median(localCost) ≤ 0.30`**, AND-ed with the ratio. The
complementarity is the point: the ratio's two 0.02-margin near-misses
carry medians 0.365 and 0.400 — comfortably caught — so the two
clauses fail in different ways and together restore the margin the
ratio lost. Disclosed per the home-field rule: three synthetic wrong
pairs would pass both clauses, in a domain production never sees.

**S15-G2 FAIL by letter, with the anatomy split three ways.** The
edge rules WORK where they were aimed: letter-lands' intro 3.61 →
**0.00** and outro 9.11 → **0.08**; peaceful's intro → **0.00**. The
failures: (1) peaceful's outro lands +3.33 against the 1.0 gate — the
LAST-SOUND rule subtracts the chart's outro length from the last
audible sample, and a 20-bar single-chord decay's 5-second ring-out
inflates it; a real, bounded residual worth one more refinement
(ring-out is below the audible floor's intent but above its 2 %
threshold on this fade). (2) The registered interior clause was
mis-drafted by the bench: "every non-edge boundary still ≤ 0.5 s"
asserts an absolute that letter-lands' pre-existing stragglers (3.61
on the first Verse, 1.88 late) never met in any prior study — a
no-regression intent written as a ceiling. The gate fails by the
letter the bench wrote; the data shows zero interior regressions
against Study 14's values. Registration lesson seven: a
no-regression clause must name the baseline, not restate a hope.

Prediction scorecard: 1 right (including eat's ~2.5); 2 half (both
intros and letter's outro repaired exactly as traced; peaceful's
ring-out residual and the mis-drafted clause were not); 3 right in
full, including the margin claim (the local statistic's band gap,
1.5×, now beats the ratio's 0.01×).

### Verdict delivered

v0.201.2's constant and edge rules are registered as validated at
n = 3/6 with the margin stated; ship the local-cost clause
(`medianLocal ≤ 0.30`) beside the ratio — it is no longer optional
belt-and-braces, it is what restores the same-piece check's margin;
and one refinement remains open on LAST-SOUND for long ring-outs.
The chart-idiom response (their 3b3ff08) queues Study 16: re-run on
the band's five STORED chart texts once the idiom parser lands —
noting for their record that their "Peaceful Dreams → 8 bars" audit
predates the band's revision, whose stored text now parses 152 bars
clean in the current dialect.

### Spend

$0. Program spend since Study 9: ≈ $1.50 across seven studies.

### Disclosure

Analyst Claude Fable 5; the two chart-comparison runs that qualified
Peaceful Dreams were disclosed in the brief; the band's chart revision
is the band's own, committed verbatim.

## Study 14 — the shipped alignment and reconciler validated; the same-piece constant caught before release (2026-10-30)

All four asks from the stem-shovel responses, on verbatim ports at
their pins (the alignment set at 39c25b5, the reconciler utils at
5b2288f8), registered at 3cfd698 with one amendment. ≈ $0.40.

**G1 PASS, exact.** Their parsers round-trip the bench's material
perfectly: `chordChartBars` reproduces both MMKK transcriptions bar
for bar and section for section from the band-markdown conventions
(76/76, 86/86), `chartBars` reads a Study 8 marked measure summary to
its spec (24/24, marks, tempo, meter), and the 6/8-in-eighths
convention renders exactly the app's bar seconds (2.000 s at 180).
Future bench studies can feed production's own parsers.

**G2 FAIL — and this is the study's reason to exist: the shipped
same-piece constant rejects the band's own correct charts.** The
tritone-ratio landscape: right charts score 24–49 on synthetic audio
but **2.04 and 2.53 on the real recordings — both below the shipped
threshold of 3** — so `samePiece` comes back false on correct charts,
every placement gets hedged, and the song-check's card would tell the
band their own chart "does not seem to match." Amendment 1 added the
missing measurement, the real-domain wrong pairs: **1.17 and 1.24.**
So on real audio — the only domain production sees — the control DOES
separate (wrongs ≤ 1.24, rights ≥ 2.04), just not at 3.
**Recommendation: ALIGNMENT_SAME_PIECE_RATIO ≈ 1.6** (the real-domain
midpoint), with the honest caveats attached: n = 2 per class, one
band, and the margin is a factor of ~1.6 rather than Study 12's order
of magnitude — worth a second check (the local-cost median is already
computed and separates further) before trusting it at scale. The
synthetic numbers that inspired the 3 were real but belong to a
domain production never sees — the home-field lesson, third
appearance.

**G3 FAIL by letter, via that same constant and nothing else.** The
shipped aligner itself, fed through its own parser from the markdown:
six of eight non-edge boundaries within 0.11 s of the band's declared
starts (Study 12's precision reproduced through the production code
path), edges hedged as designed, 1.1 s to align a 141 s song in Bun.
The only failing clause is `samePiece` — the constant again.

**G4 PASS, and production's configuration is strictly better than the
bench's.** The reconciler under the shipped `thinking: adaptive,
effort: low`: letter-lands **44/76 (fixes 15, breaks 0)** against the
bench's thinking-off 41/76 (12/0), in half the output tokens — the
thinking mode eats the per-bar narration that forced Study 13's cap
amendment. The exploratory song improved too (28/86, 4/0). Zero
breaks across every reconciler run in two studies.

**Arm D — the edge fixes, measured (their ask 3).** The FIRST-ONSET
snap repairs both real intros outright (letter-lands' first section
placed 7.15 s with the declared start at 0 and first audible energy
at 0.00; eat 2.41 → 0.00). The LAST-SOUND rule, stated as "the final
section starts at the last audible sound minus the chart's final-
section duration," repairs letter-lands' 9.11 s outro miss to
**0.03 s** — but would worsen eat (whose outro length the bench's
transcription guessed wrong), so it must ship gated on samePiece and
hedged like the rest. Both are one-line additions to
`alignedPlacements`.

Prediction scorecard: 1 right; 2 WRONG in the direction that matters
(the real-domain collapse of the tritone ratio was not predicted —
the amendment exists because the registered pairs couldn't see it);
3 half (the aligner clause passed; samePiece failed); 4 right; 5
half-right (the last-sound rule exceeded expectations on the clean
chart and inherits chart quality exactly as feared).

### Verdict delivered

Do not release the alignment with the constant at 3 — it hedges
everything on real audio and mislabels correct charts as mismatched.
Set it near 1.6 (or add the local-cost check) and both real behaviors
come right: correct charts place with sub-tenth mid-song precision,
wrong charts still refuse. Ship the two edge rules behind the
samePiece gate. The reconciler needs nothing: the production config
out-performs the bench's measurement of it.

### Spend

≈ $0.40 of the $2 fence (arm E's two calls). Program spend since
Study 9: ≈ $1.10.

### Disclosure

Analyst Claude Fable 5; arm E measures claude-fable-5-1 (family
disclosure as before; mechanical grades committed first). Ten files
ported verbatim; one amendment, registered before any verdict.

## Study 13 — the chord path meets real audio, and the reconciler earns its keep (2026-10-30)

The reconciler question ("would it still have value?") answered as a
registered two-arm conditional (e932906): first measure what it would
improve, then run it only if there is headroom. Study 12's artifacts
made the measurement possible — the bar grid in recording seconds and
bar-aligned chord truth on real audio.

**Arm 1 — the finding that matters most: production's chord path
scores 38.2 % on a real recording.** Basic Pitch + the v0.142 matcher
— 95.8 % at home on the synthetic bench, the Study 10 winner over
ChordMini — reads the real letter-lands at 29/76 bars (strict-first
20/76; the registered power-chord allowance did real work, 9 bars),
and the exploratory eat-all-the-clocks at 27.9 %. The home-field gap
is not the predicted 15–30 points; it is nearly 60. Real synth pads,
guitar voicings and sustained textures are what Study 1's fixture
gotcha warned about (rich harmonics defeat the transcription), now
measured instead of suspected. The 80–83 literature plateau was never
the matcher's to claim. The registered trigger (< 90 %) fired without
drama.

**Amendment 1, our recurring own-harness lesson:** all four pilot
cells truncated at the registered 4000-token output cap — the models
narrate per-bar before the JSON — the exact budget-conflates-with-
failure class Study 8's Amendment 1 hit. Cap to 16000, re-run under
the fence; the truncated run stays in history. (Fable also ignores
the temperature-0 deviation — the gateway says unsupported —
disclosed.)

**Arm 2 — S13-G2 PASS for both models, and the agreement-trap clause
came back spotless.** One text-only pass over the key, the detected
chords and production's own per-bar note lines:

| model | reconciled | baseline | fixes | breaks |
|---|---|---|---|---|
| claude-fable-5-1 (production) | **41/76 (53.9 %)** | 29/76 | **12** | **0** |
| gemini-3.5-flash | 36/76 (47.4 %) | 29/76 | 7 | 0 |

+15.7 points for the production model with ZERO right-answers broken
across 27 changed bars — the double-fix gate (fixes ≥ 2× breaks),
registered against Study 9's agreement trap, passed at infinity. The
exploratory song moved the same direction (fable +3, 0 breaks);
gemini burned the full 16k budget narrating 86 bars and never reached
the JSON there — the budget failure mode of that family (Studies 2
and 8), not the over-editing one I predicted for it.

Prediction scorecard: 1 right in direction, wrong in magnitude (the
real gap is far larger than the 60s–80s guess); 2 right (fable
passes; changed 27/76 just over the "under a third" sub-claim); 3
wrong in the instructive direction (gemini passed the gate cleanly on
the gated song and failed by budget, not by over-editing, on the
other); 4 right.

### What production does with this

Two findings, in order of weight. First: **chord drafts on real user
audio are far weaker than any synthetic number suggested** — 38 %,
with the transcription (not the matcher, not the model) as the
binding constraint; that reframes the chord-hint feature's honest
quality bar and is worth a UI hedge regardless of anything else.
Second: the reconciler is real and cheap — a text-only pass by the
model production already runs for chart drafts lifts the real-audio
number 16 points with zero breaks for about a cent a song. Ship shape:
reconcile inside the chart-draft job (symbols in, symbols out), keep
the detector's chord when the model's answer parses to nothing, and
cap output generously (Amendment 1's lesson). The ceiling remains the
transcription: 54 % reconciled is better, not good — if the chord
feature matters, the next investment is Basic Pitch's successor on
real timbres, not more model.

### Spend

≈ $0.60 of the $3 fence (including the truncated first pilot). The
program's model spend since Study 9: ≈ $0.70.

### Disclosure

Analyst Claude Fable 5; arm 2 measures claude-fable-5-1 (same family),
tolerable as in Study 1 because every grade is mechanical, committed
and tested before any call. One registered trigger, one amendment,
truncated run preserved.

## Study 12 — chart-to-seconds by synthesize-and-align: code takes the model's last job, and the edges talk back (2026-10-30)

The candidates memo's recommendation A, registered by the bench
(e431bf6): render the chart as sustained chord pads at the declared
tempo, chroma-DTW the render against the recording, and every bar —
hence every section mark and chord — gets a timestamp with no model.
This was the one hearing job Study 8 had left to the LLM (boundary
placement in seconds). Zero spend: a 92.9 ms chromagram on the port's
own fft, DTW with non-stalling reference steps and a subsequence mode
for count-ins and tails, and a pad renderer that knows nothing the
chart doesn't state. Real-arm truth: the bench's disclosed
transcriptions of the public MMKK charts (letter-lands gated —
unambiguous, duration cross-checks; eat-all-the-clocks exploratory
with a disclosed −26 s reading mismatch; peaceful-dreams excluded as
untranscribable — a real-world limit of chart-driven anything).

### Results

**G1a PASS at exactly the letter: 532/560 bar starts (95.0 %) within
±0.25 s.** By class the errors live where physics says: reverb tails
(worst 1.32–1.44 s) and dense mixes; the mediant modulations were
perfect to the hop. **G1b PASS 8/8 — the headline.** Every contrast
section boundary within ±0.5 s, the precision metric every listener
failed (Study 8's models ≈ 0/8 there, Study 10's neural segmenter
0/8, the literature's best model reader 0.423 at ±0.5 on real music).
Reported beside it: **7/8 tempo/key-change boundaries at ±0.5 s** —
boundaries that are structurally invisible to stem activity and that
blind models found half the time. DTW does not care that the tempo
moved; that is the method.

**The wrong-chart probe: 6/6, separations 8.6–16.3×.** The right
chart's path cost sits an order of magnitude under the wrong one on
every registered pair. The "is this chart this recording?" question —
which production currently asks the model to answer by ear — is a
number.

**G2 FAIL by one boundary, and the anatomy is the finding.** On the
real letter-lands recording: 8/9 boundaries at ±4 s (parity with the
neural segmenter), 6/9 at ±0.5 s against the registered ≥ 7/9. But
look at where: the SIX mid-song boundaries landed at **0.02–0.11
seconds** — precision no listener in eleven studies has approached on
a real recording — while the three misses are the edges: the first
boundary (3.6 s, the subsequence start absorbing the real intro), the
second-to-last (1.9 s) and the outro (9.1 s, where the chart's 8-bar
outro reading meets a 3-second performance tail). Alignment is
sub-tenth-second wherever the performance follows the chart and fails
exactly where the chart stops describing the performance. The
neural segmenter edges it 7/9-to-6/9 at ±0.5 on this one song by
being merely mediocre everywhere instead of perfect in the middle and
lost at the ends. eat-all-the-clocks behaved exactly as predicted:
clean until the bench's uncertain Bridge reading (0.07–0.24 s), then
2.0 → 8.0 s adrift, re-anchoring at the outro — a wrong transcription
degrades placement locally and visibly, which is what a shipping
path-cost/edge-confidence gate would catch.

Prediction scorecard: 1 right (including the tempo-change tracking);
2 half — the error SHAPE was predicted ("where the performance
departs from the chart, the outro tail") but the gate count missed by
one; 3 right in full; 4 right in full.

### What production does with this

Ship guidance: alignment takes placement, behind two mechanical
gates — the path cost (the probe's 8.6× floor separates right from
wrong charts) and an edge flag (first/last boundaries carry the
chart-fidelity risk; show them hedged, as the rung picker does for
tempo). The model's remaining role in this feature, if the edge flag
is accepted as UI: nothing. The probe ships separately as the
same-piece check, replacing the by-ear clause in `askAiAboutMix`.
Real-arm honesty: the method is only as good as the chart and the
transcription — peaceful-dreams could not even be transcribed — so
chart-quality is now the binding constraint, which is a data problem,
not a hearing problem. The program's arc completes: every hearing
task measured across twelve studies now has a code-or-data answer
that beats or matches the model, except the one thing the models
genuinely hear (texture contrast, Study 8) — and code took that too
(Study 9's activity detector on stems; this study's alignment from
charts).

### Spend

$0.

### Disclosure

Analyst Claude Fable 5. No model measured or consulted; the MMKK
transcriptions were committed before any alignment ran; declared
starts touched scoring only.

## Study 11c — the declared-meter gate validated; the bench's own rule retired on the record (2026-10-30)

The three validations stem-shovel requested for its patch at 2cf70cb
(the ×3 rung; the 3:2 and ×3 gates moved to the DECLARED meter, off
the detector's flag entirely; alternates labels fixed). Verbatim port
pinned; zero spend; arms 1 and 3 are pure functions over Study 11b's
stored reads, arm 2 renders three new items. The bench registered the
prediction of its own proposed rule's defeat before running.

**C1 PASS, perfectly.** The declared-meter gate over the full 11b
corpus: 0 of 332 corrected wrong rows accepted, no true-count match
lost, and THREE gained over the shipped v0.200.0 rule — lilt-a and
verb-y match at ⅔ through their declared 6/8 (data where the acoustic
margin missed), and mop-heart matches at ×3 through its declared 3/4:
"224, counted three to the bar." peaceful-dreams stays loud, now by
data instead of by luck.

**C2: the mirror did its job twice over.** The bench's declared-lag
rule accepted **3 of 3** wrong values, exactly as the registered
prediction traced — on straight running eighths, a ⅔-wrong declared
tempo puts its lag's third on the eighth grid and every clause of the
bench's amended rule (BEAT_FLOOR included: the declared lag sits on
the grid too, r̂ 0.64–0.66) licenses the rung. **The bench's rule is
retired on the record, by the measurement its proposer registered.**
The gate verdict is FAIL by letter, though, on its other half: the
declared-meter gate accepted 1 of 3 — and the anatomy matters. On
mirror-138 the DETECTOR itself misread the straight eighths at 92
with a compound flag (at 92, a third of the lag IS the 138 eighth —
the peaceful-dreams confound, now reproduced on synthetic material),
and the wrong declared 92 matched the wrong detection DIRECTLY at
rung 1, which no gate governs. A ladder cannot reject
declared-equals-detected; the failure class is Study 11's lesson 6
again (wrongness defined against truth, compared against a wrong
detection), not a gate leak — the gates themselves never opened.

**C3 PASS.** The ×3 rung opens nowhere but triple-declared meters
(0 leaks, 0 off-tolerance accepts); the exact-3× rows are accepted on
all 5 triple-declared items — the ×2-class count ambiguity, now
quantified, living where it belongs: in the rung picker.

**The bonus finding: mirror-138.** The mirror fixture incidentally
built the first SYNTHETIC reproduction of the detection-side ⅔+false-
compound confound (truth 138, detected 92 "6/8", the true tempo on
the alternates at strength 0.96). stem-shovel gains a regression
fixture for the detector confound that previously existed only on one
real recording — and the patched comparison surface already contains
it correctly: the declared-meter gate refuses to call 138-vs-92 a
count, so the warning stays loud.

Prediction scorecard: 1 right in full; 2 half — the declared-lag 3/3
exactly as traced, the declared-meter 0/3 missed (1/3 via the
collision class the prediction did not anticipate); 3 right in full.

Verdict to stem-shovel: ship the patch to production as is. The
declared-meter gate strictly dominates both its predecessors on
everything a gate controls; the one C2 accept is detection-side and
pre-existing, with mirror-138 as its new regression fixture.

### Spend

$0. The ladder thread closes at five studies (10, its amendment, 11,
11b, 11c) for ~$0.08 total, all of it Study 9's pilot.

### Disclosure

Analyst Claude Fable 5; verbatim port pinned at 2cf70cb; no model
measured or consulted; the registered predictions included the
bench's own rule losing.

## Study 11b — the shipped tempo ladder: the margins are honest, the confound shipped (2026-10-29)

Requested by the stem-shovel side and run on their shipped v0.200.0
(verbatim port at 79ed4def): the sub-beat test (1.15 margin, 0.55
triplet share), the super-beat test (1.05 margin, 0.2 floor, pulse
re-picked at 1.5L), and the shipped tempoLadderMatch, over the
Study 11 corpus, a new 15-item swing-stress sweep (ratios 0.60–0.70 ×
three tempi, the addendum's request) and the lesson-6-corrected
wrong-tempo set. Zero spend. One disclosed pre-registration smoke
shaped the predictions.

**V3 PASS, 15/15 — the triplet-share argument is validated.** Not one
swing item at any ratio or tempo read compound; every tempo exact.
TRIPLET_SHARE 0.55 (their AM-GM "swing cannot exceed 0.5" argument)
holds across the full sweep, including 0.67 triplet swing where
Study 11's sketch rule had read 3. **V4 PASS, 0/332** false accepts
through the shipped ladder with the corrected generator — the
generator fix retro-confirms Study 11's read that its by-letter
failures were collisions, not ladder defects.

**V1 FAIL 2/4, and the margin numbers say why it cannot simply be
tuned up.** lilt-b and contrast-c now detect their 6/8 EXACTLY (76,
subdivision 3 — two of Study 10's octave-family misses fixed at the
detector level by the super-beat re-pick). But lilt-a's super-beat
ratio is 1.029 against the 1.05 margin (their own fixtures measured
1.02–1.12 — the bench's lighter accents land at the bottom of that
band), and verb-y's reverb smears it to **0.991 — below 1.0, the straight
envelope's theoretical ceiling** (their own AM-GM bound; measured
straight items sit just under at 0.91–0.97), so no margin that is
safe by construction can reach it. [Corrected 2026-10-30: this
originally read "inside the 0.91–0.97 band," which 0.991 is not —
the operative claim is the ceiling, caught in the downstream's
sourcing pass.] The save is complete, though: on all 4
compound items the true dotted tempo sits ON the shipped alternates
ladder (strengths 0.97–1.07, top rung) — the rung-picker UI surfaces
the right count everywhere the 6/8 call misses.

**V2 FAIL — and this is the finding that matters: both scorable real
recordings flipped to 6/8.** mop-heart re-picked to 74.7 = 224/3, the
BAR pulse of a fast waltz counted in one. The hearing is musically
defensible (a bar of three IS a group of three) but the consequence
is a regression: declared 224 sat on the old detection's ladder at ×2
and sits on the new one's at ×3 — a rung the ladder does not have.
And peaceful-dreams' sub-beat test fired at the detector's own
⅔-wrong pulse — **Study 11 Amendment 1's confound, now in shipped
code**: at 96.7, L/3 IS the true eighth of the 145 grid, the
subdivision call is structurally unable to tell "compound here" from
"straight at 1.5× of here," and the shipped ladder then matched the
declared 145 at ×1.5 ON THE DETECTOR'S OWN CONFOUNDED FLAG — the
warning that Study 11's G1 required to stay loud goes silent, for the
wrong reason.

### Verdict delivered

Keep TRIPLET_SHARE and the ladder util as shipped (V3/V4 clean); keep
the super-beat re-pick (it fixed two items exactly). Two fixes named:
(1) the compound flag that EXCUSES a declared/detected 3:2 gap must be
evaluated at the DECLARED tempo's lag, not the detector's own —
Study 11 Amendment 1's rule, which separates lilt-a (compound at
declared 60, r̂ 0.72) from peaceful-dreams (straight at declared 145,
0.03); (2) fast triple meter needs either a ×3 rung or a
3/4-in-one expression — mop-heart's 74.7 is a defensible hearing with
no rung to land on. The 6/8 OUTPUT is not a stop-ship (false fires on
declared-straight real songs are contained by fix 1 at the warning
surface; the alternates carry the truth); the margin itself should
not be lowered (verb-y proves the bands overlap).

Prediction scorecard: 1 half-right (predicted 0–1 of 4, got 2 — the
re-pick works more often than the smoke suggested); 2 WRONG in the
instructive direction (predicted real recordings stay straight; both
flipped — the named false-6/8 risk materialized exactly where the
addendum said to stress); 3 and 4 right in full.

### Spend

$0. The program's four ladder-thread studies (10, Amendment, 11, 11b)
total ~$0.08, all of it Study 9's Q4 pilot.

### Disclosure

Analyst Claude Fable 5; verbatim port pinned at 79ed4def; the
development smoke disclosed in the brief; no model measured or
consulted.

## Study 11 — the tempo ladder rule: two gates pass, two fail by letter on their own measuring stick (2026-10-29)

Specified by the stem-shovel agent (its response to the playbook and
tempo-grid plan, c970245), finished and registered by the bench with
three disclosed restatements (18002cd): ratio tolerance (production's
shipped 2 % rule) instead of absolute ±3; verb-y replacing the dense
item in the six-miss list (that was N-beat's miss, not D-prod's); G4
redefined off Study 7's cells, whose registered wrong settings are
×2/÷2 by construction and would have failed the dry-run vacuously.
Zero spend: two pure functions — tempoLadderMatch (L-gated / L-open)
and a subdivision test at a named tempo hypothesis — over the stored
Study 10 detections, 37 items, 255 mechanically wrong declared values.

**Two instrument defects were caught by the first runs and fixed by
registered amendment before any result was accepted** — both now part
of the finding:

- *Amendment 1:* the slower-of-pair subdivision hypothesis is
  mathematically confounded — a straight song misread at ⅔ maps its
  true duple eighths exactly onto the slower pulse's thirds, so the
  license test read "compound" on the one item it exists to reject
  (peaceful-dreams). The hypothesis became the DECLARED tempo: the
  declaration is the claim under test, and there lilt-a's 60 is
  genuinely compound (r̂(L/3) = 0.72) while peaceful-dreams' 145 is
  straight (0.03).
- *Amendment 2:* at a bogus hypothesis tempo there is no beat peak at
  all (r̂(L) ≈ 0.0007 vs 0.36–0.75 for real pulses), the relative
  floor goes vacuous, and "r̂(L/3) > r̂(L/2)" degenerates to the
  autocorrelation main lobe — 22 of 33 wrong ×1.5 rows were licensed.
  A subdivision-3 read now requires the hypothesis pulse to exist
  (BEAT_FLOOR 0.1; three orders of magnitude of separation). A
  compound-count claim about a pulse that does not exist is no claim.

### Results

**G1 PASS, 5/5 + the rejection that matters.** Every count-class miss
from Study 10 recovers at its correct rung — both lilts, contrast-c
and verb-y at ⅔ on genuine compound evidence, mop-heart at 2 — and
peaceful-dreams, the true hearing error the review insisted must stay
an error, is correctly NOT accepted by L-gated (L-open accepts it:
the measured cost of ungated 3:2 rungs, exactly as the gate design
predicted).

**G3 PASS, clean.** Subdivision 3 on 4/4 compound items, 2 on all 31
straight items outside the swing pair; swing split honestly (swing-x
at 0.67 reads 3 — triplet swing IS a 3-feel; swing-y at 0.62 reads
2). The derived meter names 6/8 on all four compound items — the
first time the detector's vocabulary can say it — at the registered
cost of one swing item, confirming the review's "swing needs its own
flag" caveat.

**G2 FAIL by letter, 1/33 — and the 1 is a true value.** The one
accepted ×1.5 row is shift-b: declared 108 built as "wrong" from
section 1's 72 — but 108 IS the song's own second-section tempo,
matching the detection at rung 1. The wrong-value generator respected
only the first truth label of multi-tempo items. Across all 255 rows,
L-gated accepted zero genuinely wrong values; L-open accepted 30/33
of the ×1.5 rows — the measured justification for gating, exactly as
predicted.

**G4 FAIL by letter, 1/221 — an artifact of pairing.** The silenced
row is peaceful-dreams declared 192.9 (truth × 1.33) against the
already-wrong detection 96.7: 192.9 is the double rung OF THE WRONG
GRID. Wrongness was defined against truth while the comparison runs
against the detection; on the one item where the detection itself was
3:2-off, those diverge. Reported context: all 15 of Study 7's
registered wrong settings sit on the always-accepted rungs (they were
built as ×2/÷2) — the ladder reads them as "same grid, counted
differently," the ambiguity the rung-picker UI exists to absorb.

Sixth registration lesson, earned twice in one study: **a mechanical
wrong-value generator must respect every true label of an item, and
define wrongness against the value actually being compared** — truth-
anchored wrongness collides with multi-tempo songs and with wrong
detections, and both collisions score as false accepts that aren't.

Prediction scorecard: 1 right (5/5 + rejection); 2 right in direction
(L-open 30/33 ≈ the predicted ≥ 80 %), wrong by letter (gate 0 missed
via the collision); 3 right in full including the swing split; 4
wrong by letter via the pairing artifact it did not anticipate.

### The shipping question

By the response's own decision rule, a full pass ships build items
1–4 and a G2 failure drops the 3:2 rungs. Neither branch matches what
happened: the gates that failed, failed on defects of the measuring
stick, not of the ladder — zero genuine false accepts in 255 rows.
The bench's read: the evidence supports the full build list, and the
by-letter failures transfer to the generator, not the rule. Per
program discipline the gates are not re-thresholded; the call is
stem-shovel's, with this analysis on the table (and a corrected
generator is a one-line registered follow-up if wanted).

### Spend

$0. Two amendments, three runs, all local arithmetic.

### Disclosure

Analyst Claude Fable 5. No model measured or consulted; SUB3_FLOOR
and BEAT_FLOOR were set from disclosed development values; superseded
runs remain in git history (7ddce82 and the pre-amendment run).

## Study 10 — neural MIR baselines: the classical detector holds its ground (2026-10-29)

Drafted by the stem-shovel agent on its landscape review's evidence
(docs/LANDSCAPE-2026-10-29.md), finished and registered by the bench
(5e8913d): four published neural-MIR candidates — Beat This! small
(MIT), LinkSeg 7-class (CC-BY 4.0), ChordMini (MIT), and two
literature key-profile swaps — against production's hand-rolled
detector and template matcher, on 35 band items (the Study 4/8/9
corpus plus a 12-item hard set: swing, octave-boundary tempi, reverb,
dense, mediant modulations) and 20 chord songs (Study 1's 16 plus 4
extended-chord progressions). All weights hash-pinned and verified
against published tables; runners are vendored reference code; zero
LLM spend; three one-item development smokes disclosed in the brief.

### Results: all five gates FAIL — each in production's favor

**G-beat FAIL, with the study's most instructive nuance.** At the
registered ±1 bpm, D-prod is exact 29/33 to N-beat's 18/33. But
N-beat derives tempo from the median inter-beat interval on a 20 ms
frame grid, so its answers land at 142.9 for 140, 111.1 for 110 —
musically right, numerically outside the registered letter. A
disclosed, unregistered sensitivity read at Study 4's model-grade ±3
is a dead tie, 29/33 each — with different misses: both engines drop
the three 3:2 compound-meter items; N-beat alone halves one dense
item (the registered octave flag case) and smears two tempo-shift
items; D-prod alone misses the 6/8 reverb item. Fifth registration
lesson of the program: an absolute tolerance at DSP precision
measures the candidate's output quantization, not its hearing. What
the gate letter cannot take away: N-beat's beat F-measure at ±70 ms
is **0.892** (downbeats 0.867) — a per-beat grid production simply
does not have — and on the two pulseless pads it emitted 3 and 1
beats (tempo null), the honest answer D-prod structurally cannot give.

**G-meter FAIL.** On 4/4 and 3/4 items N-beat's downbeat-vote meter
is 21/29 against D-prod's 27/29, and it named 6/8 on only 1 of the 4
compound items (it tracks the eighth-note pulse there, so its
downbeat spacing votes 6 only once). The draft's hope that the
neural tracker brings 6/8 for free is dead on this corpus.

**G-key FAIL, exactly as predicted.** Krumhansl 29/33,
Albrecht–Shanahan 29/33, Temperley 30/33 (+1, gate needed +3, zero
new confusions — Temperley's win is mod-c's modulation target). All
four shared misses are modulating items where the global key is a
blend by construction. On synthetic diatonic pop the profile tables
are interchangeable; the literature's gap lives on real recordings —
deferred to the MMKK amendment.

**G-seg FAIL, decisively — the loop-invention disease is not cured
by graph attention.** LinkSeg placed **54 false boundaries across the
22 single-section items** (~2.5/item), worse than the chart-anchored
LLM's ~1.2/loop in Study 8, and found 5/8 contrast boundaries at ±4 s
(0/8 at ±0.5 s) against the Study 8 chart arm's 8/8 and Study 9
D-activity's 8/8 with zero inventions. The published operating point
(8 s peak window, tau 0) trades everything for recall on real-music
form and still misses a third of the bench's plainest boundaries. On
this fixture the free stem-activity detector from Study 9 beats the
published neural segmenter outright.

**G-chord FAIL overall; the hard set splits it.** Full-vocabulary:
the production matcher 483/504 bars to ChordMini's 418 — the neural
model hears triads where the truth says maj7/m7 (full-vocab 38/64 on
the hard progressions vs the matcher's 59/64). Maj-min: matcher
490/504 vs 470/504 overall, but on the hard progressions ChordMini
edges it 61/64 to 59/64, and one song is a catastrophe worth naming:
static-bloom (the N.C.-bar song) collapsed to 4/28 under ChordMini
while the matcher read 27/28. Basic Pitch + templates, tuned on this
synth, is simply the stronger chord reader here; the matcher's
weakest clause (sevenths) was already fixed by Study 1's
missing-tone penalty.

**Budget:** every candidate fits (N-beat 8.3 s per 90 s of audio on
this CPU — inflated by the registered export-defect workaround of
250-frame chunks — N-seg 5.4 s, N-chord 3.7 s, all ≤ 10 s; D-prod
1.2 s and 0 MB). Deployment was never the blocker; accuracy was.

Prediction scorecard: 3 right (G-key, including the
Temperley-mod-c detail); 1 wrong at the registered letter and right
at the disclosed ±3 read; 2 wrong in both clauses; 4 wrong except the
hard-set maj-min edge; 5 half-right (contrast recall failed as
predicted, but the 0-false clause failed much harder than predicted);
6 wrong in the happy direction (N-chord fit the time budget).

### What production does with this

Nothing ships. The question the landscape review raised — "is the
app hearing with obsolete code?" — closes with a measured answer: on
truth-by-construction material, production's summed-envelope
autocorrelation, per-stem meter vote, Krumhansl templates and Basic
Pitch + v0.142 matcher beat or match every published candidate tried,
at zero weight bytes. Honest boundary: this corpus is synthetic
additive-tone pop, the material templates were born on; the review's
neural-model gaps were measured on real recordings. The registered
MMKK real-recordings amendment (pending Kevin's credentials) is where
these models get their home-field rematch — and where N-beat's ±3
tie, its 0.89 beat grid, and its honest pulseless nulls suggest the
beat tracker, alone among the candidates, could still earn a place.

### Amendment 1 — the home-field rematch on MMKK's real recordings (2026-10-29, same day)

Kevin authorized the fetch and the catalog turned out fully public —
no credentials needed. The amendment (registered 2ed4d15 before its
run) scored the instruments against the band's own declarations on 7
real songs (4 full-band with stems, settings and DECLARED section
start times; 3 single-stem sketches, blank labels unscored). The
synthetic gates stand; this table answers the domain question the
synthetic arm could not.

**The domain warning was real — in both directions.**

- **Sections flip.** LinkSeg, which invented 54 boundaries on
  synthetic loops, finds real form: 29/33 declared boundaries at ±4 s
  (letter-lands 8/9 with ZERO false boundaries; mop-heart 7/7 +1),
  consistent with its published ~78 % at 3 s. Study 9's D-activity,
  perfect on synthetic arrangements, drops to 25/33 with 19 false on
  real stems (its detected-grid anchoring and real dynamics don't
  mix). For songs without charts, the 1.5 MB CC-BY segmenter is now a
  measured candidate; with a chart, Study 8's chart-anchored model
  still holds the names.
- **Tempo: production's failure classes are real-world classes.** At
  ±1, D-prod 2/4 vs N-beat 1/4 — but D-prod's two misses are GROSS:
  exactly half of mop-heart's declared 224, and exactly 2/3 of
  peaceful-dreams' declared 145 (the 3:2 confusion, now on a real
  recording). At the registered ±3 read N-beat leads 3/4 to 2/4, its
  one miss being 214.3 vs the declared 224 (4 %; the disagreement
  flag notes D-prod's exact-half supports the declaration, so this
  one is scored a real miss, not a disputed label). n=4 — direction,
  not proof: the trained tracker degrades gracefully where the
  autocorrelation fails in octave classes.
- **Meter holds for production** (4/4 vs N-beat's 3/4 — N-beat read
  the real 3/4 waltz as 4/4).
- **Key: the profile question closes hard.** Krumhansl 4/6 against
  Albrecht–Shanahan 1/6 and Temperley 1/6 — the literature profiles
  collapse into parallel-minor and subdominant flips on real mixes
  (F# major → F# minor, F → Bb). The synthetic arm said
  "interchangeable"; the real arm says production's choice is the
  right one. G-key's FAIL is now a confirmed keep-KK.

Amended ship guidance to stem-shovel: keep the detector exactly as
is for tempo (the 3:2/half classes are known, and the neural
alternative isn't ±1-accurate on real material either), keep
Krumhansl without a second thought, and consider LinkSeg — not the
synthetic-corpus winner D-activity — as the no-chart section
fallback, behind the chart when one exists.

### Spend

$0 in both arms. Model downloads ~30 MB hash-pinned; the MMKK fetch
~800 MB of public audio into a gitignored folder (hashes committed);
everything else local CPU.

### Disclosure

Analyst Claude Fable 5. No language model measured or consulted;
every grade mechanical, committed and tested before the full run; the
±1→±3 tempo sensitivity read is disclosed as unregistered analysis,
clearly separated from the registered gate verdicts.

## Study 9 — stem-aware analysis: the stems name the form, the sum keeps the time (2026-10-29)

Drafted by the stem-shovel agent, finished and registered by the bench
(c36f7fe): does reading the uploaded stems individually beat the summed
mix that production's browser detector and both AI features actually
use? Four zero-spend instruments over 21 items (the 15 pulsed Study
4/8 specs plus 6 new misleading-stem specs whose fourth part — rubato
lead, off-grid pad, noise/room track, double-time comp — is designed to
pollute the summed onset envelope), stems shuffled so nothing knows
which is the drums; plus a 12-call AI side arm. D-prod is a verbatim
port of stem-shovel analysis.ts at a99fb18, rate-parametric and pinned
at the bench's 22050 Hz (registered deviation).

### Results

**S9-G1 PASS, perfectly, on both grids.** D-activity (per-bar RMS per
stem; boundary = the active-stem set changes and holds 2 bars) found
**8/8** contrast boundaries with **0** false boundaries on the loops
AND on the change items — identically on the truth bar grid and on the
production-portable detected grid. The models' Study 8 blind score on
the same items was 7-8/8 with 3-6 inventions per uniform loop; the
chart-anchored production model still invented ~1 boundary per loop.
The activity detector cannot invent structure on a loop *by
construction* — the active set never changes. Its blindness is equally
structural: all 6 tempo/key-change boundaries (arrangement unchanged)
are invisible, as predicted — those belong to the chart. One honest
caveat the mislead class surfaced: a noise/room track with slow swells
toggles its own activity bit (+2 false on mislead-noise), so a shipped
version wants the atonal-stem guard the brief's Q2/Q3 outputs provide.

**S9-G2 FAIL, decisively — and the failure is the finding.** The draft
asked whether keeping the sharpest single stem's tempo beats the sum.
It does not: D-prod exact **18/21**, D-stem-tempo exact **11/21**, with
7 regressions (5 of them octave errors) and 0 rescues. The sum was
robust to ALL six misleading extras — pad, noise, rubato and both
double-time comps left it exact — while the sharpest-single-stem rule
repeatedly picked a bass or comp whose own autocorrelation is cleanest
at half time. Summing the stems' onset envelopes is not a compromise
production settled for; the cross-stem reinforcement at the true period
IS the tempo signal. D-prod's only misses are a shared systematic: the
two 6/8 lilts and 3/4 contrast-c read at 1.5× (the dotted-pulse 3:2
confusion), which no stem-aware variant fixed either. The registered
octave-disagreement flag fired on 10/21 items including clean ones
(a half-time bass is normal music, not a hazard signal) — useless as
shipped, reported as measured.

**S9-G3 UNEVALUABLE (registered fallback), with a descriptive warning.**
Production's key detection was right 20/21, so there is nothing to
separate — but the one wrong answer (mod-a's global key on a modulating
item) carried stem agreement **1.00** while production's own
correlation margin ranked it 3rd-lowest of 21. On this corpus the
agreement score is not just unproven, it pointed the wrong way on the
only error available.

**Q4 pilot (gemini-3-flash, 12 cells, ~$0.08):** giving the model the
isolated bass+comp stem instead of the mix helped nowhere and hurt
twice (waltz-a and mislead-rubato flipped right→wrong; one stem cell
unparseable). Tempo answers were the familiar 120/126/128 genre prior
in both conditions — Study 4's reading-not-hearing, unchanged by stem
isolation. Prediction 4 said ≤1 item changes; 2 changed, both for the
worse — the direction (no help) held, the count missed.

Prediction scorecard: 1 right in full; 2 refuted in both halves (the
sum survived the double-time comps, and sharpest-stem regressed); 3
right (near-ceiling keys, G3 unevaluable) except that it guessed the
agreement floor would sit on mislead items — the real floor was
indifference to the one actual error; 4 right in direction, wrong in
count.

### What production should do with this

Ship nothing for tempo and key: the summed-envelope detector beat every
stem-aware variant tried against it, and its one weakness (3:2 on
compound meters) is not fixed by stems. Consider shipping D-activity as
a browser-side section detector: zero model cost, structurally immune
to the loop-invention failure that survived even chart anchoring in
Study 8, with the model kept for names and the chart for harmonic
boundaries; guard it against sustained-noise stems. The Q4 matrix
(84 calls, ~$1, fenced) remains open if closing the stem-to-model
question across both Study 8 models is wanted.

### Spend

Zero for the gates; Q4 pilot ~$0.08 of the $8 cap. Matrix not run
(awaiting go-ahead; the gates did not need it).

### Disclosure

Analyst Claude Fable 5; the Q4 model is Google's, outside the
analyst's family. Every grade mechanical and committed before any
scored result; one pre-registration smoke of the instruments on
contrast-b disclosed in the brief and pinned in tests.

## Study 6b — the key-in-force warning, registered and validated on unseen pages (2026-10-29)

**Registered by the stem-shovel agent, run by the bench** — the
program's first study authored by the production side. stem-shovel
shipped Study 6's exploratory key-in-force rule (their commit
b2452d6) and then declined to trust it: a rule designed on the data
it is scored on fits that data. Study 6b gave it reads it had never
seen: 24 new charts engraved clean AND corrupted through a registered
generator option reproducing the accidental-dropping path, with each
of Study 6's named false-positive classes represented 8 items strong
(honest bare-chord sharp/flat keys, modulating charts, and
accidental-carrying charts whose corrupted pages are detectable).
Verbatim port pinned at their commit; a TESTED only-quieter property
between the shipped rule and the bench's exploratory variant; a
zero-spend reproduction check gating the run (it reproduced Study 6
exactly: 10/10, 0/12, 1/42). 48 reads by the production reader,
pilot-fenced; ~$1.60 of the $6 cap.

**Both gates PASS with a perfect sheet.** H-prod on the production
reader: detectable corrupted reads **8/8** caught, undetectable
corrupted reads **16/16** silent, clean reads **0/24** flagged —
zeros in every false-positive class including the modulating charts
where the pooled rule failed and the honest sharp-key charts where
the shipped-before-refinement rule failed. The extra condition
stem-shovel added when productionizing (no flag if any chord carries
an accidental) cost nothing: not one read where the bench's variant
flagged and theirs stayed silent. Predictions 1–4 all held, with
prediction 2's allowed miss (a reader restoring an accidental from
context) never materializing.

The shipped warning is now validated on data it was not designed on:
100% hit, 100% silence, 0% false alarm, on the production reader.
The loop this closes is the program's longest: Study 5's anatomy
found the corruption class → Study 3's correction described it →
stem-shovel shipped a heuristic → Study 6 measured it and suggested
the refinement → stem-shovel shipped the refinement and registered
its own validation → Study 6b confirms it. Four hand-offs, each side
checking the other.

Disclosure: analyst Claude Fable 5; the reader is claude-fable-5-1;
every instrument, label and page committed before the first read, by
the agent whose rule was under test — and the bench ran it without
adjustment.

## Study 8 — section detection: they hear texture, not form (2026-10-28)

**Question.** The last unmeasured AI feature, and the loophole test:
Studies 4/7 showed the listening layer reads rather than hears, but
what it DID register blind were gross structural events — and section
boundaries are gross structural events. Registered in
docs/BRIEF-STUDY8.md: the v0.192.0 `detectSectionsWithAi` ported
verbatim, Study 4's mixes plus three new sparse/dense contrast mixes
(boundaries a human hears instantly, names and seconds true by
construction), arms blind / +vocabulary / +marked chart, 90 cells,
two models, ~$0.60. Amendment 1 before publication: the bench's own
2000-token cap truncated the rambling production model mid-JSON in 16
cells — the budget-conflates-with-failure shape Study 2 caught in
kimi, this time in our own harness — cap raised, failed cells re-run.

**The loophole is real: models hear texture.** Blind, on the contrast
mixes, the production model found 7/8 section boundaries and
3.5-flash 8/8 — the program's first genuine listening result after
four studies of text-reading verdicts. But the hearing is texture,
not form: harmonic and tempo-change boundaries landed only 3/6 blind,
and uniform single-section loops were subdivided into invented
verse/chorus structure at 3–6 false boundaries per item (production
blind noise 3.3/item overall; 3.5-flash notably cleaner at 1.0 —
Study 4's generational equality does NOT extend to structural
hearing). Prediction 2 substantially right; prediction 4 wrong in the
instructive direction.

**Gate S8-G1 FAILS by half a boundary.** The chart arm detected
14/14 boundaries (100%) on the production model with every placement
within ±4 s — but mean false boundaries landed at 0.53/item against
the registered ≤ 0.50: eight false boundaries across fifteen items
where the bound allowed seven and a half. 3.5-flash passes (0.47).
The noise's source is itself the finding's sharpest nuance: even
CHART-ANCHORED, uniform loops get subdivided (~1.2 false/item on
loops, 0.0 on contrast and change items) — the chart's single [A]
mark does not stop the form prior from inventing a chorus. Study 7
found explicit chart text beats wrong settings; Study 8's corollary
is that the chart's SILENCE does not beat the model's priors. Names
complete the pattern: 8/8 from the chart, ≤ 3/8 without — names come
from text, as everything always has.

Ship guidance briefed: section detection should ship chart-gated like
the song-check; blind mode is honest ONLY for arrangement-contrast
boundaries and should be labeled so; and the parse-don't-ask rule
extends here — take the section COUNT and NAMES from the chart's
rehearsal marks mechanically, and ask the model only for what
measured perfect and text cannot supply: the boundaries' placement in
seconds. That applied-layer rule would zero the loop subdivision and
pass the gate by construction.

Scorecard: 1 wrong by letter (100% detection, gate lost on half a
false boundary); 2 substantially right; 3 mixed (vocabulary moved
nothing much); 4 wrong instructively. Two production-model cells
remained unanswered even at the raised cap (rambling persists),
counted as misses, disclosed.

Disclosure: analyst Claude Fable 5; no Anthropic model measured;
every grade mechanical, committed and tested before any scored run;
Amendment 1 preceded publication and changed only the output budget.

## Study 7 — the redesigned song-check, re-measured (2026-10-28)

**Question.** stem-shovel rebuilt the song-check in response to Study 4
(chart-reader framing, "Do not estimate a tempo by ear", bar-following
facts instead of confirm/correct candidates, the `chartStatedAnswer`
application gate). Study 7 measured the replacement: the v0.192.0 call
ported verbatim and pinned, four arms over Study 4's metered mixes
(score summary vs band chart × true vs wrong settings), two models,
96 cells, ~$0.40 of the $5 fence. Grading at two levels: the RAW
answer (chart obedience) and the APPLIED answer (what the gate lets
through).

**S7-G1 PASS, decisively: the deference failure is closed where it
counts.** Zero wrong settings survived to application on the
production model (0/24 per field; anchor: the retired design echoed
wrong candidates 10–12/12 straight into the answer). Better still,
the RAW echo under a truth-stating chart is also zero: told "the
song's settings say tempo 240" while the chart's mark reads 120, the
model follows the chart, 12/12. The chart-transcription framing
works when there is a chart statement to transcribe.

**S7-G2 FAILS at 24/24 — and the values convict the mechanism.** On
chord-only charts (no tempo mark anywhere; the registered correct
answer is null), the model NEVER answered null — but it did not
estimate by ear either. Every single invented tempo equals the
SETTINGS value verbatim: 120 when the settings said 120, 60 when they
lied and said 60, both models, 47/47 cells. "Use them to follow the
bars" reads, to the model, as "this is the tempo"; the instruction
and the facts contradict, and the facts win. Meter identically. The
harm is fully contained — `chartStatedAnswer` nulls both fields on a
chart that states neither, 24/24 correct refusals — so the study gate
fails by letter while no wrong value can reach a song. The recurring
shape, fourth appearance: text beats instruction (Studies 1, 2, 4
each found a costume for it).

Reads: key from chords alone is perfect (12/12 both models — the band
chart path's actual job works); keyChange placement under wrong-tempo
bar-following degrades exactly as predicted (3/3 → 1/3 production,
0/3 on 3.5-flash: the arithmetic inherits the lie); and 3.5-flash
shows the guard's design limit — it echoed a wrong setting once under
a truth-stating chart, and the presence-based gate (the chart SAYS a
tempo, so keep the model's) passed the wrong value through, 1/22. The
production model never did; the gate is production-scoped and PASSES.

Ship guidance delivered: (1) never display the raw tempo/meter from
chord-path answers (the applied nulls are the real result); (2) the
deeper fix — `chartStatedAnswer` filters by PRESENCE when it could
substitute by VALUE: the chart summary's tempo marks and time
signature are machine-readable text, so tempo and meter need no model
at all; parse them straight from the chart and reserve the model for
what measured perfect — keys from chords and placement in seconds.

Prediction scorecard: 1 half-right (G1 yes, G2 no at 24/24);
2 wrong in both directions at once (score-chart echo fell to zero,
chord-chart echo rose to twelve-twelfths — the prediction missed that
the split IS the finding); 3 right in both halves; 4 wrong
(production out-resisted 3.5-flash under the new prompt).

Disclosure: analyst Claude Fable 5; no Anthropic model measured (no
audio on the gateway); every grade mechanical, committed and tested
before any scored run; the band-chart generator's
no-tempo/no-meter property is asserted by test.

## Study 6 (micro) — the warning heuristic, validated (2026-10-28)

**Question.** stem-shovel shipped `chartReadWarnings` from the Study 3
correction brief (the dropped-accidentals signature) without
measurement. The bench holds model reads of the SAME pages corrupted
and clean, so the validation cost zero model calls: 148 existing
reader texts (52 corrupted, 96 clean), expected labels mechanical from
the committed specs. Registered in docs/BRIEF-STUDY6.md (commit
4fe27d3) before the evaluation ran.

| Instrument (production reader) | detectable hit | undetectable fired | clean false positives |
|---|---|---|---|
| H-shipped (as in production) | **10/10** | 2/12 | **4/42** |
| H-letters (registered refinement) | 10/10 | 0/12 | 2/42 |
| H-scoped (EXPLORATORY, post-hoc) | 10/10 | 0/12 | 1/42 |

**The shipped heuristic works where it matters** — every detectable
corrupted read fired — and its false-positive class is exactly the one
its own source comment worries about, now measured: honest
natural-chord sharp-key charts (copper-line, drift-4a: D major, many
chords, zero accidentals legitimately) trip the all-or-nothing rule at
~10% of clean production-reader cells. The registered refinement
(count only accidental-less chords on the signature's OWN altered
letters) removes that class and introduces a new one the registration
did not predict: modulating charts, because pooling signatures across
sections makes one key's honest naturals look suspicious against
another key's letters. The post-hoc key-IN-FORCE variant (chords
judged against the signature active at their measure — disclosed as
unregistered exploratory) fixes that too, and its single residual
flag is the best result in the study: it fires on a read whose
MODULATION IS PLACED AT THE WRONG MEASURE (the image-arm mod-c read
put the key change three bars late, leaving F-section chords under
D-major scope) — a genuine read defect that deserves review, flagged
for the wrong stated reason. All-model robustness: misses are floor
effects (haiku's stub reads never reach 8 chords; two short opus
reads), per prediction 3.

Prediction scorecard: 1 right to the named items; 2 half-right (the
predicted fix worked, the modulation class was not predicted);
3 right. Recommendation delivered to stem-shovel: adopt key-in-force
scoping (re-validating it on their side or on a registered extension,
since here it is exploratory), and soften the warning's stated cause
to cover both file corruption and a doubtful read — the evidence says
the flag earns trust in both roles.

Disclosure: analyst Claude Fable 5; both registered instruments and
the label derivation committed and tested before evaluation; the
scoped variant is explicitly post-hoc. Zero model spend.

## Study 5 — the composed pipeline: when the reader feeds the listener (2026-10-24)

**Question.** Studies 3 and 4 measured chart-read and the song-check
separately; production composes them — the chart beside the mix is
chart-read's imperfect output, not truth. Registered in
docs/BRIEF-STUDY5.md: Study 4's 12 metered mixes, their matching lead
sheets engraved by Study 3's pipeline, read by production's chart-read
(fable, PNG and PDF arms), the output fed to production's song-check in
place of truth; Study 4's frozen L-chart cells as the ceiling; a
committed propagation classifier (pass / listener-added / propagated /
rescued / mutated over five fields). Total spend ≈ $3.4 of the $6
fence.

**The study's biggest result is what its first run caught: a
cross-study confound.** The C5-pdf reader reported chords printed
without flats, and the mechanism check proved pdfkit's WinAnsi fonts
silently drop the SMuFL accidental glyphs Verovio writes into chord
text — every "Eb" in every committed PDF rendered as "E" (see Study
3's Correction below; the fix, ASCII accidentals, is committed and all
affected cells across both studies were discarded and re-run).

**Final verdicts (corrected fixture): S5-G1 PASS in both arms at zero
listener-added errors.** The reader made exactly one error across both
arms and 38 facts per arm (it omitted mod-b's relative-major
modulation line from the summary), and the listener RESCUED it both
times, placing the C-major change at 20.2 s against a 20.21 s truth —
by reading the chart's chord content (the progression turns to C
material), not by hearing: Study 4's blind arm found 0/6 changes. The
propagation table is 37 pass + 1 rescued per arm; nothing propagated,
nothing mutated, nothing listener-added. With a competent reader the
composed chain equals its ceiling.

The first (confounded) run earns its own record: its PDF arm showed
the chain faithfully TRANSMITTING upstream damage — a reader
reasonably naming D major for a B-minor sheet whose F#7 printed as F7,
the listener propagating it 1:1; and reader positional errors (a
modulation read at m12 instead of m9) converting to confidently wrong
second-placements downstream. The corrected run shows none of these
because the pages are no longer lying. Both runs together give the
honest composition story: **the chain adds nothing of its own — it is
exactly as good as the page its reader is shown.** Ship guidance
accordingly: the song-check inherits chart-read's accuracy 1:1, so
surfacing the chart summary for user correction protects everything
downstream; and upstream PDF corruption is detectable (fable flagged
the key-vs-chords inconsistency unprompted in a Note) but not
recoverable.

Disclosure: analyst Claude Fable 5; the reader is claude-fable-5-1,
every grade mechanical and committed before any scored run; the
ceiling cells are reused frozen records; Amendment 1 (the confound and
the classifier's positional-attribution note) preceded the corrected
run.

## Study 4 — the listening layer: the second opinion reads, it does not hear (2026-10-23)

**Question.** stem-shovel's song-check has a model LISTEN to a mix and
confirm or correct the DSP detector's tempo, key and meter. Registered
in docs/BRIEF-STUDY4.md: 14 synthesized MP3 mixes with truth by
construction (three meters, tempo shifts, modulations, two pulseless
pads), production's `askAiAboutMix` call ported verbatim, candidates
ablated across four arms (blind / correct / wrong / chart-beside-mix,
the chart generated by Study 3's committed code). Two amendments: the
fixture-health stop rule fired twice, so the fixture itself was tried —
a committed onset-autocorrelation instrument proves the pulse is
physically in all 12 metered MP3s (12/12), and a disclosed one-cell
second-listener diagnostic reproduced the failure — discharging the
rule's premise and reclassifying the result as a model-class finding.
Total spend ≈ $1.2 of the $13 fences.

### Results (metered items; tempo incl. the 6/8 rule)

| Arm | 3-flash (production): tempo / meter / key | 3.5-flash: tempo / meter / key |
|---|---|---|
| L-blind | 2/12 · 7/12 · 1/12 | 1/12 · 7/12 · 2/12 |
| L-correct | 11/12 · 8/12 · 12/12 | 10/11 · 8/11 · 9/11 |
| L-wrong | 2/12 · 2/12 · 0/12 | 5/11 · 5/11 · 0/11 |
| L-chart | **12/12 · 12/12 · 12/12** | **12/12 · 12/12 · 12/12** |

Change detection: 0/6 blind for both models; 6/6 found AND placed
within ±4 s in the chart arm, both models. Deference under wrong
candidates: production echoes 10–12/12 per field; 3.5-flash pushes
back on tempo and meter (4/11 and 3/11 deference) but still swallows
the wrong key 10/11. `openai/gpt-4o-audio-preview` is not on the
gateway (the registered availability probe's result): the swap space
for this surface is gemini-only.

**Gate S4-H1 FAILS by letter** for the production model: one invented
tempo on a pulseless pad (blind: "60") — while, against prediction, it
RESISTED the false "120 bpm" authority on all four pulseless
wrong-candidate cells. It invents unprompted, not under pressure.
3.5-flash ran the probe clean (0/6).

### The findings

1. **The listening layer reads; it does not hear.** Blind, both
   gemini generations pin tempo to a 120–180 genre prior at
   confidence 1.0, name wrong keys (1–2/12), and find zero changes —
   on mixes whose pulse is mechanically verified and carries explicit
   kick, snare and hats. Given text, they transcribe it: correct
   candidates in, correct answers out; wrong candidates in, wrong
   answers out (production: 10–12/12 echoed); the chart in, perfection
   out — every field, every change, placed to the second, both models.
   The "second opinion" is a text channel wearing headphones.
2. **What they DO hear**: harmonic texture loosely (relative-key
   confusions, real chord motions occasionally named) and gross
   structural events (a tempo double noticed in prose but never
   quantified). Absolute tempo, meter and key extraction are not in
   the current audio stack — consistent across two model generations
   on physically verified pulses.
3. **The chart arm is the product**: with the lead sheet beside the
   mix, the song-check nails everything including the change
   placements the product actually wants (where does the modulation
   land, in seconds). Ship guidance: treat the song-check as a
   chart-anchoring tool, not a detector-checker; never let its
   "second opinion" override the DSP detector on tempo/meter; and the
   confidence field is uninformative (1.0 on fabricated answers).
4. Prediction scorecard: 1 wrong in the instructive direction (the
   invented tempo came unprompted, not under false authority);
   2 half-right (meter weak blind, candidates only partially fix it);
   3 wrong (deference was highest for key, not meter, and production
   deferred on everything); 4 right (the chart lifts change detection
   to 6/6 placed); 5 wrong (one octave error, not two — the misses
   were prior-pinning, not octave confusion).

### Disclosure

Analyst Claude Fable 5; no Anthropic model measured (none takes audio
on the gateway). Every grade mechanical, committed and tested before
any scored run; the fixture's pulse is verified by a committed
instrument; the one diagnostic cell is disclosed and excluded from
scored claims.

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

### Correction (2026-10-24, found by Study 5): the PDF arm measured corrupted pages

Study 5's anatomy exposed that pdfkit's WinAnsi fonts cannot encode
the SMuFL accidental glyphs Verovio writes into chord text, so every
PDF chord accidental in this study's fixture silently rendered as its
natural ("Eb" as "E", "F#7" as "F7"). The decisive split: fable's
D-pdf chord recall was ~94% on sharp/natural-key items and ~55% on
flat-key items. The PDFs were re-rendered with chart-ASCII accidentals
and every readable D-pdf cell re-run (archived originals in
results/archive/study3-dpdf-accidentals-confounded/). Corrected D-pdf
chord recall: **fable 76.0% → 99.3%, gemini 70.4% → 99.3%**, opus
82.5% → 74.2% (its better-on-PDF oddity shrinks into re-run noise),
haiku unchanged (0%, the stub behavior). Keys, repeats and specials
rose to 100% for fable.

Finding 2 as first published is therefore WITHDRAWN in its mechanism
and magnitude: for frontier models the PDF ingestion path is NOT a
bottleneck — they read a clean PDF as well as a clean PNG. The models
in the confounded arm were not failing to read; they were correctly
reading pages whose flats genuinely were not drawn. What replaces it:
**PDF text generation is the hazard** — font encodings of the
WinAnsi class silently drop music accidentals at authoring time, the
corruption survives any ingestion path including rasterization, and it
is detectable (the key signature disagreeing with chord spellings —
fable flagged exactly this unprompted) but not recoverable. The
"rasterize PDFs app-side" ship guidance is withdrawn as unnecessary
for clean PDFs and useless for corrupt ones; the replacement guidance
is a key-vs-chords consistency check on chart-read output. Gates
unchanged (S3-H1 was pooled keys, still 91.7% PASS; S3-H2 unchanged).

### Disclosure

Analyst Claude Fable 5; the matrix includes claude-fable-5-1. Every
grade is mechanical, committed and tested before any scored run; the
ground-truth instrument is production's own summary code, ported
verbatim. Amendments 1–2 preceded all matrix cells; the Correction
above postdates first publication and is mirrored on the dashboard and
the article.

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

## Study 25 — the corrected end-to-end: the draft on the true grid (registered docs/BRIEF-STUDY25.md, run 2026-11-07)

The correction's follow-up, registered at 07b37ad and run the same
day: arm B4 drafts each song on the TRUE grid — the declared period
(now known exact) anchored at chart bar one, resolved in-run by the
committed best-shift procedure (an oracle construction, disclosed as
the chartless feature's upper bound). One fable call per song,
prompt/model identical to Studies 23/23b/24.

**Amendment 1 (same day, before reporting):** the registered anchor
procedure was defective on eat-all-the-clocks — the shift search chose
a non-physical anchor (−7.585 s, bar one more than three bars before
the audio) on a one-root hint margin, and the bar-0 clamp then produced
a non-monotonic grid head. Void first-run numbers disclosed in the
brief and preserved as results/study25-defective-run1.json; the fix
(candidate anchors ≤ −period excluded, unit-tested) registered at
d005b48 before the eat-only re-run. The near-tie itself (56 vs 55
hint roots for "skips four chart bars" vs "opens on bar one") is a
corollary of eat's arrangement mismatch.

| song | anchor (shift) | B4 roots | grid-given baseline | S25 gate |
|---|---|---|---|---|
| letter-lands | −0.121 s (−4) | **72/76** | 72/76 | G1 ok — exact parity |
| peaceful-dreams | −0.119 s (−4) | **152/153**, dialect 12 | 151/153 | G1 ok — above baseline |
| mop-heart | 0.315 s (−4) | 103/140 | 131/140 | G1 MISS |
| eat-all-the-clocks | 0.415 s (−1) | 49/84 full; prefix 49/71 | 68/84 full; prefix 55/71 | G2 MISS |

**S25-G1 FAIL** (mop-heart), **S25-G2 FAIL** — both informative:

- mop-heart's miss is anchor PHASE, not period or indexing: the oracle
  anchor carries the DTW start's sub-bar residue (0.315 s), 115 ms off
  the comb phase, and at 224 bpm that is ~43% of a beat — the bins
  straddle. Study 24's B3 (comb phase, same period) drafted 136/140 on
  this song, ABOVE baseline. The hint-root-maximizing anchor is not
  the draft-maximizing anchor; whole-bar shift search cannot repair a
  sub-bar phase error.
- eat's prefix miss (69.0% vs 77.5%) says the chart/recording
  arrangement mismatch is NOT confined to the unplayed ~13-bar tail —
  the played span itself diverges from the chart's bar list, which the
  DTW baseline hides by construction (its bins follow the chart through
  the audio).

Predictions: 1 WRONG (G1 missed on mop), 2 registered open — the FAIL
reading held, 3 RIGHT (peaceful dialect 12 ≥ 11), 4 RIGHT (E4 bar-one
error 0.12/0.12/0.39 s on letter/peaceful/eat, 2.93 s ≈ 3.7 bars on
mop), 5 RIGHT (77,741 in / 15,348 out ≈ $0.35 incl. the void run, of
the $2 fence).

**Synthesis across Studies 24 + 25 (the corrected grid story):** with
the true period free (it is the declared bpm) the best measured
chartless construction per song is comb-phase B3 or oracle-anchor B4,
and the better of the two reaches parity or above on every
arrangement-matched song — letter 72/76 = baseline, peaceful 152/153 >
151, mop 136/140 > 131. The feature recipe this measures: declared
period + onset-comb phase, with bar one near t = 0; the open problems
are picking phase to beat-level precision at fast tempos and the
chart-vs-recording arrangement mismatch, which no grid can close.

## Studies 26 / 26b / 26c — the alignment's weak ends: cause refuted, recipe shipped-shape (registered docs/BRIEF-STUDY26.md, all $0, run 2026-11-07)

stem-shovel's ASK (docs/bench-brief-alignment-ends-2026-11-07.md): the
shipped chart alignment's bar map is unusable at the ends (their Letter
Lands: bar 1 at 8.06 s, 0.9 s intro "bars", last bar 15 s early), the
app now refuses such maps, and the deliverable is a cause and a
browser-worker recipe that gets Letter Lands through the acceptance
gate without loosening it.

**Baseline (design diagnostic, vs the true grid the correction gave
us):** the middle is good and the ends are broken on the three
arrangement-matched songs (letter 0.18 s mean mid vs 7.3/15.3 s ends;
peaceful 0.16 vs 6.6/23.3; mop 0.42 vs ~3/3.6), while eat's interior is
corrupted by its arrangement mismatch (7.8 s mean). The app's bar-1
acceptance rule fails ALL FOUR MMKK songs on bench numbers — the
shipped refusal currently refuses the whole set.

**The cause is not Kevin's hazy-audio seduction — the trim-to-drums
ablation refuted it (S26-G3 FAIL, with a design disclosure):** slicing
the audio to the drum span fixed nothing, because the chart still
cannot fit the sliced span; the end compression is FORCED (subsequence
DTW must place every chart bar and the ends have no room), not seduced
by low-contrast chroma. The middle-good/ends-bad shape of his
hypothesis was right.

**The recipe converged in three registered steps:**

- 26 (v1, Kevin's proposal with an LSQ slope): peaceful perfect,
  letter's intro repaired 7.3 s → 0.05 s, but the LSQ period came out
  0.95% biased and compounded to 1.3 s over letter's 29 extrapolated
  tail bars; mop inherits its middle's own offset. G1 FAIL.
- 26b (comb period, ±0.5-bar slide): letter perfect (0.02–0.05 s), but
  the wide slide reaches the half-bar backbeat lattice and broke
  peaceful's intro by +0.60 s. G1 FAIL. Two lessons priced: the comb
  is the period instrument; ±0.25 period is a half-bar-ambiguity
  fence, not a tuning knob.
- 26c (v3 = comb period + the 0.25 fence): **all three gates PASS** —
  letter 0.05/0.02 s ends, peaceful 0.06/0.11 s, mop app-accepted with
  the registered-expected 0.32 s outro residual (its DTW middle's own
  phase offset, Study 25's 224 bpm finding; whole-grid re-phasing is
  the named next remedy, out of an end-repair's scope), eat refused by
  the recipe's own interior-trust check (trusted span < 50% of bars),
  which is the right user-facing answer for an arrangement mismatch.

The shipped-shape recipe (src/study26/recipe.ts, unit-tested; one DTW
as today plus an onset envelope and comb sweeps, no second DTW pass):
(1) align; (2) period = onset joint comb within ±10% of the chart's
declared tempo; (3) phase = median residual over the middle 60%,
trusted = within 0.25·period, refuse if the trusted span is under half
the bars; (4) keep the aligned trusted span, extrapolate the ends at
the comb period; (5) slide each end by the δ in ±0.25·period that
maximizes mean detrended onset energy at its lines; (6) per-bar
confidence: aligned vs extrapolated+slid.

Estimator notes for the worker: the interior duration MEDIAN
underestimates the tempo (skewed noise; letter 1.699 vs 1.818 s) and
the LSQ slope was 1% biased — use the comb. Chart-version note: the
app's 80-bar Letter Lands chart fails the median acceptance check
(1.50 s) where the bench's 76-bar chart passes (1.699 s); the recipe
sidesteps the question by making the median land at the comb period.

## Correction 2 (2026-11-07, prompted by Kevin): eat-all-the-clocks never had an arrangement mismatch — the bench's chart fixture had 15 phantom bars

Kevin: "according to the barmark parser there are 71 bars which
matches the hand-added sections precisely and matches the song
precisely — so we may still have a gap somewhere." The gap was ours.
The live chart (stemshovel.com, chartVersion 131) has 71 bars: each
Chorus is the 4-bar line x2 (8 bars) where the fixture inventoried on
2026-10-29 carries x3 (12), and the Outro is one bar plus a fade where
the fixture carries four. 15 phantom bars — exactly the "~13 bars the
recording never plays". Whether the 10-29 snapshot matched an older
chart version is checkable in the app's chart history; either way the
fixture no longer describes the song. The corrected chart is committed
as corpus/mmkk-charts-eat-v131.json; the adjudication as
scripts/diag-eat71-2026-11-07.ts.

Mechanically adjudicated ($0): reader hints on the true grid score
65/71 against the live chart, UNIFORM across the song, vs 56/84 with
decay against the fixture; the DTW aligns eat's interior at 0.45 s
mean against a 71-bar reference; the Study 26c recipe then repairs its
ends to 0.01–0.45 s, all within a quarter bar. Study 25b (one fable
call, registered 13c0565) drafted 56/69 on the corrected chart vs the
hints' 65/69 — S25B-G1 FAIL as registered, and the same 81% the old
grid-given baseline scored: eat's drafting ceiling is song difficulty
(vocal-heavy, two-chord bars), not grid.

**Withdrawn or re-graded:**

1. "eat's chart is ~13 bars longer than its recording plays" (the
   first correction's finding 3, and Studies 25/26's framing) —
   withdrawn. The band's chart matches the recording; the fixture
   didn't.
2. Study 25's S25-G2 reading ("the arrangement mismatch extends into
   the played span") — an artifact of grading against the wrong chart.
3. Study 26's "forced, not seduced" — downgraded to OPEN. The
   trim-to-drums ablation was ill-posed as constructed (it removes
   audio the chart's first bars need), and with correct anchors the
   other three charts FIT their audio, so the "charts overrun the
   audio on every song" support is withdrawn. The recipe's measured
   results are unaffected; the cause of the end compression on
   letter-lands and peaceful-dreams is back on the table.

**Upgraded:** Study 26's refusal check caught exactly what it should:
a chart that disagrees with its recording. Its documented purpose is
now "wrong-chart detector", and it found the bench's own error before
the bench did. The fixture-vs-live audit of the other three songs
found no divergence (letter 76, peaceful 153, mop 140 bars, matching;
the alignment-ends ASK's "80-bar" Letter Lands figure is also off —
the live chart is 76). Studies 13–26's eat numbers stand as measured
against the superseded fixture, so marked.

## Study 27 — whole-grid re-phasing at fast tempos (recipe v5), and mop-heart's true anchor

Registered d883201 before the run; brief docs/BRIEF-STUDY27.md; $0.

**Arm A (anchor adjudication) moved the truth.** The incumbent mop
anchor, 0.315 s (Study 25's oracle, inherited by Study 26 as truth),
lost to the onset lattice: the v5 anchor from the MIX envelope and the
v5 anchor from the DRUMS-STEM envelope agree exactly at −0.066 s, two
independent envelopes naming the same lattice, 0.381 s (47% of a bar)
earlier than the oracle. The registered hint-root rule picked it
(115/140 vs 113/140 — a thin 2-root margin, disclosed; the hint
instrument pools chroma per bar and is phase-tolerant on this song's
long same-chord spans, so the decisive evidence is physical agreement
of the two combs plus Study 24's committed drafting split, 136/140 at
the comb phase vs 103/140 at the oracle). Consequence, registered in
the brief: 26c's mop row was measured against the superseded anchor —
its 0.42 s "middle offset" and 0.32 s "outro residual" were mostly the
ruler, not the map; the app-acceptance verdict stands. Third ruler
correction of the arc: first the DTW geometry, then the eat fixture,
now the oracle anchor at the one tempo where sub-bar error matters
most.

**Arm B (recipe v5): all gates PASS.**

| song | delta | first 4 / last 4 vs truth | middle mean | gate |
|---|---|---|---|---|
| letter-lands | −0.047 s | 0.05 / 0.07 s | 0.060 s | S27-G2 ok |
| peaceful-dreams | −0.037 s | 0.06 / 0.06 s | 0.064 s | S27-G2 ok |
| mop-heart | −0.014 s | 0.00 / 0.00 s | 0.000 s | S27-G1 ok (vs the refined truth v5 itself defines on this song — circular for the error numbers, disclosed; the non-circular content is the comb agreement, the hint win and app acceptance) |
| eat vs 86-bar fixture | — | REFUSED | — | S27-G3 ok (the wrong-chart detector survives v5) |
| eat vs corrected 71-bar chart | −0.030 s | 0.48 / 0.45 s | 0.468 s | S27-G3 ok (within the quarter-bar line, as in 26c) |

v5 = v3 with one added move: a single whole-grid combSlide of the
uniform line onto the onset lattice, fenced at ±0.5 beat
(period / meter beats), so sub-beat phase corrects and the slide can
never hop the lattice (tests/study27.test.ts proves the fence).
Letter and peaceful moved ~40 ms onto the lattice with no regression;
mop snapped exactly; the refusal is unchanged. v5 supersedes v3 as the
recommended worker recipe: same cost class (one extra comb slide).

Predictions: 1 right (A3 wins, though the margin was thinner and the
move larger than predicted — "within 150 ms" was wrong, it was 381 ms),
2–4 right. Spend $0.

## Study 28 — the capstone chartless draft: an honest FAIL that found the backbeat in the wild

Registered 523dde2; four fable calls, 65,474 in / 10,671 out tokens
(≈$0.25 of a $1 fence); brief docs/BRIEF-STUDY28.md.

**S28-G1 FAIL, and the failure is the finding: the onset comb's raw
PHASE is a beat detector, not a downbeat detector.** The chartless
grid (comb period + comb-lattice anchor near the first sound) anchored
letter-lands at +0.830 s (2.1 beats late — the backbeat lattice) and
peaceful-dreams at +0.770 s (2.15 beats), drafting 61/75 (81.3% vs the
94.7% reference) and 137/153 (89.5% vs 98.7%). mop-heart anchored one
beat late and still drafted 135/140, ABOVE its 93.6% reference (long
same-chord spans tolerate a beat), and eat-all-the-clocks anchored on
the downbeat (+0.015 s) and drafted 55/68 = 80.9% vs its 81.2%
reference. **S28-G2 PASS: the length leg is solid** — derived bar
counts 75/153/140/70 against charts 76/153/140/71, every song within
one bar from the audible span and the exact period alone. Predictions:
1 wrong on two songs (the gate), 2 right, 3 right on spend. The comb
PERIOD remains exact everywhere; what the auto-chart feature lacks is
downbeat disambiguation — named, not registered.

## Study 29 — can a backbeat-heavy mix pull recipe v5 off the downbeat? No, and here is the fence's catch map

Registered ea1fd3f before the run; source: the app's ASK
(bench-brief-v5-backbeat-2026-11-08.md); $0. Both gates PASS, and
Study 28's same-day specimen (above) is the untethered contrast case.

- **Arm 1 (catch map):** the downbeat is caught for x in roughly
  [−0.4, +0.45] beats at EVERY downbeat weight, including w = 0.1
  (downbeat ten times weaker than the backbeat), at 120 and 200 bpm.
  Within the half-beat fence no other beat is reachable, so weight
  cannot matter; the edges shave at 0.45 only by the 0.05-beat sweep
  grid and the 10 ms comb step. The ASK's fence arithmetic is
  confirmed.
- **Arm 2 (in-window competitors):** the knife-edge exists exactly
  where the ASK guessed. An eighth-note pickup (0.8 energy, half a
  beat before the bar) captures the slide against a 0.3-weight
  downbeat, and hi-hat off-eighths capture it at h ≥ w. Both are
  boundary ties at the fence edge on synthetic impulses; arm 3 tests
  whether real material gets near them.
- **Arm 3 (kick-removed mixes, the gated arm): all four songs PASS
  their Study 27 standards.** 150 Hz 4th-order high-pass on the drum
  stems, remixed: deltas −0.05 to −0.14 beats, letter 0.04–0.06 s
  ends / 0.051 s middle, peaceful 0.02–0.07 / 0.042, mop exact, eat-71
  at its usual quarter-bar edge. The snare-and-hats mix did not move
  the slide off the downbeat.
- **Arm 4 (real phase errors, in beats):** letter 0.10, peaceful 0.09,
  mop 0.05 (and its DTW-phase-to-lattice distance 0.05), eat 0.06 —
  all an order of magnitude inside the fence. The ASK's "0.38 s =
  1.4 beats" arithmetic was right and its premise was not: that number
  was the superseded TRUTH ANCHOR'S error (the ruler Study 27
  corrected), not the DTW's phase error, which is why v5 never
  strained the fence on mop.
- **S29-G2 (control): the full-mix runs reproduce Study 27's deltas
  within 2 ms.** The remedy arm did not run: it was registered
  conditional on an arm-3 failure and there was none.

**The combined verdict for the app:** v5 as shipped (DTW tether +
half-beat fence) is safe on everything measured, including
kick-removed mixes; the one theoretical capture needs a weak downbeat
AND a competitor at the fence edge, which no real arm produced. The
construction that DOES get captured is the untethered chartless
anchor (Study 28, the auto-chart grid leg), and the ASK's proposed
downbeat check is exactly the missing instrument there — the named
next remedy, for the auto-chart feature rather than the alignment.

Predictions: 1 right, 2 right in mechanism (the pickup sits at half a
beat, not a quarter — an eighth is half a beat, the brief's own units
caught the drafter), 3 right including the registered letter-lands
uncertainty resolving to pass, 4 right, 5 right ($0).

## Study 30 — downbeat disambiguation for the chartless grid: both gates FAIL, published as found

Registered f0e71e2; brief docs/BRIEF-STUDY30.md; two fable calls
(42,051 in / 6,237 out ≈ $0.15 of a $0.5 fence).

**S30-G1 FAIL: chroma novelty (D1, the registered primary) is not a
downbeat detector — 0 of 4.** The anatomy is in the committed scores:
on letter-lands the BACKBEAT outscores the true downbeat (0.0585 vs
0.0468); on mop-heart the two leading candidates tie to four decimals;
on peaceful-dreams the winning margin is 4 percent, noise; and on
eat-all-the-clocks the novelty moved the anchor OFF the already
correct base to shift 3. The same chroma smear that made the DTW
geometry wander (the 2026-11-07 correction) makes frame-to-frame
novelty mush at beat granularity. D2 (kick-band onsets, the reported
secondary) was right on 2 of 4 (letter, mop) and wrong the same two
ways available (kept a backbeat on peaceful, moved eat off a correct
base). **S30-G2 FAIL by consequence:** letter's re-draft repeated
Study 28's 81.3% and peaceful's got WORSE (61.4%, the novelty had
moved it to a different wrong beat). Predictions: 1 wrong decisively
(the primary scored zero), 2 wrong, 3 half (eat was the hard case,
but by derailment rather than near-miss), 4 right on spend.

**The standing read.** Two cheap chartless scorers are now measured
and dead: raw comb phase (Study 28) and chroma novelty (this study);
kick-band onsets are half-reliable and can also move a correct anchor.
One result cuts across all three: on every song, at least one scorer
preferred a wrong shift over the correct base, so any shipped
disambiguator needs the humility to keep the base — and nothing
measured so far earns the right to overrule it. Named candidate
remedies, none registered: the transcription's bass-note changes at
candidate bar lines (a downbeat witness the pipeline already
computes); the shipped reader's hint-change concentration per
candidate; or the product answer, which the measurements now make
precise — the period is exact, the lattice is known, and the only
missing information is a single bit of which beat is one, so a
one-tap bar-one gesture from the user resolves what three studies of
DSP could not, with zero risk. The honest summary for the auto-chart
feature: machine-exact tempo and length, human-disambiguated anchor.

## Study 31 / Correction 4 / 31b / 31c — the downbeat from witnesses the song already carries

Registered 7a821f4 (31), b90a3b6 (31b), b26da2d (31c); source: the
app's ASK (bench-brief-study31-downbeat-witnesses-2026-11-08.md),
amended per the bench's accepted review (categorical G1, corrected G3
numbers, the eat adjudication promoted to a named arm, harmonic rhythm
on the bench's own nchord per-beat as a disclosed substitution).
Family spend ≈ $0.39 of a $0.5 fence (six fable calls across three
runs; the gateway ignores temperature on this family, so re-draft
scores carry a few bars of sampling noise, disclosed in 31b's brief).

**Study 31 as registered: all three gates FAIL — and the failure
pattern was the finding.** Three independent witnesses (time zero,
harmonic rhythm with margin 35, all 20 section boundaries) agreed with
the truth exactly on letter, peaceful and mop, and agreed WITH EACH
OTHER on eat, one beat before the registered truth. G2, screening
against that truth, dropped all three and left an empty vote.

**CORRECTION 4 (2026-11-08): eat-all-the-clocks' truth anchor is
−0.085 s, not +0.415 s.** The registered +0.415 was Study 25's
hint-fit (55/84) made against the phantom-bars 86-bar chart, before
Correction 2, and never re-derived after it; the hint instrument is
measured flat across a two-beat range on this song (65/66/66 of 69 at
0/−1/−2 beats; 50 at +1), so it never had the power to pin the phase.
Four independent constructions put bar one at −0.06 to −0.07 s: the
chart-informed DTW grid — whose verdict sat in Studies 27 and 29's
committed numbers all along as the constant 0.474 s offset politely
misread as "eat's quarter-bar edge" — plus Study 31's chord-change
histogram, section boundaries and time zero. The non-drum stems sound
from the file's first sample: there is no one-beat pickup; the bar
line is at time zero, exactly the app's DAW-export argument.
Re-readings this forces, in place: v5 was RIGHT on eat all along
(ends ≈ 0.03–0.05 s from the corrected truth, not 0.47); Study 28's
"eat anchored on the downbeat" becomes one beat late like the ruler
it matched, making the comb phase wrong on all FOUR songs; Study 30's
scorers re-read classwise under the corrected ruler go 2/4 (novelty)
and 3/4 (kick band) rather than 0/4 and 2/4 — still unshippable, and
letter's backbeat-outscores-downbeat anatomy stands, but the
"moved a correct base" tally there leaned on a base that was not
correct. The published Study 30 conclusions carry a dated correction.

**Study 31b (corrected ruler; w2's fade measured against the final
bar line instead of the ring-out, a disclosed instrument fix):
S31B-G1 PASS — the vote finds the true class on all four songs
(5–1, 6–1, 3–1, 5–1), none undecided. A2: HARMONIC RHYTHM ALONE IS
4 OF 4 — the single witness the app's brief says it ships first. A1:
time zero 3 of 4 (mop abstains at 0.34 beat off the lattice; never
wrong).** S31B-G2 passes vacuously (no song's base is correct under
the corrected ruler; the app's fifth and sixth songs give it teeth).
Witness post-mortem: w5 crashes voted 1 of 4 (not a downbeat witness
as built); w6 stems self-vetoed on every song (drums and bass never
agreed); w3 abstained everywhere by design (every song shows an end
remainder); w2, fixed, still abstained everywhere (all four songs
measure a fade by the registered rule).

**S31B-G3 failed and exposed the family's second instrument defect:
whole-bar placement.** A beat class names a position modulo one bar,
and the runner placed voted anchors at base + shift — bar TWO on
letter and peaceful — so index-paired drafts collapsed (68.0%, 61.4%).
Study 30's peaceful 61.4% was the same defect wearing a different hat.
**Study 31c registered the placement rule (bar one contains the first
sound, fenced at one bar before it) and re-ran the re-draft arm:
S31C-G3 PASS — letter 71/75 = 94.7%, EXACTLY the chart-given
reference; peaceful 152/153 = 99.3%, ABOVE its 98.7% reference. The
first chartless drafts to reach reference parity.** Placements landed
as predicted: −0.079 s (truth −0.121) and −0.058 s (truth −0.119);
first sounds 0.010 s and 0.000 s — the DAW-export time-zero argument
holds on the whole corpus.

**The standing read for the auto-chart feature.** Everything is now
machine-measured on this corpus: period exact (Study 24), length
within one bar (Study 28), bar one from the witness vote with
harmonic rhythm 4-of-4 alone (31b), whole-bar placement by first
sound (31c), and drafts at chart parity on the result. The bar-one
tap retreats to the fallback behind an honest "undecided", as the
app's brief asked. Predictions: Study 31's P2 ("pickup") was wrong —
Correction 4 was the answer; P3 (time zero dropped by G2) was an
artifact of the broken ruler; P6 (G3) came true only after the
placement amendment; the rest held, including 31c's registered
prediction of first-ever reference parity.

## Study 31d — the app's review acted on: the 90-second cap and the lead-corrected time zero

Registered a545263 from the app's review of 31/31b (appended to its
brief, stem-shovel aa9cf5db); $0, no model calls. The review found a
real instrument defect the bench missed: extractFeatures caps at 90
seconds, so w2, w3 and w6 never saw the back half of letter (138 s) or
peaceful (254 s) — their 31/31b abstentions were unmeasured, not
measured. It also read w1's four committed distances (0.079, 0.058,
0.068, 0.070 s at four different tempos) as the onset envelope's
documented ~0.07 s lead, measured by a witness that does not read the
envelope — the ruler's uniform bias made visible.

Results: **S31D-G1 PASS — both vote variants (registered w1 and
lead-corrected w1) select the true class on all four songs, none
undecided.** The lead-corrected time zero is **4 of 4 with distances
0.02, 0.03, 0.008 and 0.000 beat** — the app's prediction exactly;
mop's 31b abstention was the 0.25-beat fence catching the lead, not
the song. Uncapped, the ends witnesses are now honestly dead on this
corpus: w2 abstains by ritardando on all four full songs, w3 by
remainder, and w6's drums and bass disagree on every song even with
the whole recording. The final roster for the app: time zero
(lead-corrected), harmonic rhythm and section scale are each 4 of 4
alone; crashes 1 of 4 and the ends and stems unusable as built; the
vote is 4 of 4 in every variant. The standing systematic: every truth
in the family (−0.121, −0.119, −0.066, −0.085) is the downbeat at or
near time zero read ~0.07 s early by the envelope — a disclosed,
uniform ruler bias that beat-class scoring is immune to.

## Study 32 / 32b — the downbeat vote against songs built to fool it

Registered 2026-11-08 (docs/BRIEF-STUDY32.md, commit 4981bbb; docs/
BRIEF-STUDY32B.md, commit b424c7c). The brief was the APP'S
(bench-brief-study32-downbeat-adversarial-2026-11-08.md), adopted whole
with six registered reconciliations. 37 items: five synthetic arms from
a committed mini-synth (correct bases at 100/132/180 bpm plus a
ritardando; five start variants; four harmonic-rhythm foolers; a
backbeat mix; 3/4 and 6/8 with pickups) and the four real songs re-cut
by 0.3/1.0/2.5-beat pads and a 1.0-beat trim against the Correction-4
truths shifted. Ship vote exactly as the app shipped it: lead-corrected
time zero (2), chord changes under a 1.2 top-to-runner-up ratio rule
(2), sections (1), 31b humility rule, full seven-witness vote reported
beside it. Spend 41,478 in / 6,976 out ≈ $0.16 of a $0.3 fence.

**Run one (results/study32.json): S32-G1 FAIL, S32-G2 FAIL, S32-G3
PASS, arm 7 PASS.** The G1 failure was the bench's fixture, not a
witness: the mini-synth's kick was a pure 65 Hz sine, nearly invisible
to the spectral-flux onset envelope, so every "correct base" render was
backbeat-dominant IN FLUX and the comb landed on beat 2 — the
construction never produced its premise. The real songs produced it
instead: letter-lands' original and two of its pads have correct bases
under the corrected ruler, and there the gate's teeth caught something
real — **w5 (crashes) voted to move a correct base all three times**.
w5 was already outside the ship vote; it is now formally dead. No
shipping witness ever moved a correct base. The G2 failures named two
cases: the two-chord-bar render (w4 and w7 both confidently wrong — but
see 32b: an artifact of the shifted base) and **mop-heart's 0.3-beat
pad**, where the fractional cut knocked out the lead-corrected time
zero (off-lattice) and the ratio-ruled chord witness at once, leaving a
lone wrong 1-point section vote holding the base. Uncorrected time zero
was RIGHT there: the 0.07 s lead correction hurts on cuts that do not
start on a beat. S32-G3 passed (all four originals keep their 31d
verdicts, 5-0, 5-0, 5-0, 5-0 by beat class) and arm 7 passed: drafts on
the 1.0-beat-pad cuts, bars placed by the voted class under the 31c
rule, scored 72/76 = 94.7% (letter, EXACTLY the chart-grid reference)
and 152/153 = 99.3% (peaceful, above it). Across the sixteen real
re-cuts: one wrong (mop pad 0.3), four undecided (base kept, honest),
eleven right. And w2 abstained "ritardando" on all 37 items — the
eighth-note artifact the app's note (stem-shovel 4d3b0f8b) had just
diagnosed: an eighth-note gap rounds to one beat and halves the local
beat.

**Study 32b (results/study32b.json): the fixture's correction plus the
app's w2 fix, $0.** The kick got a 6 ms broadband beater click
(committed, tested); w2 v2 skips sub-0.75-beat intervals before its
median (the app's fix, committed beside v1 with tests). Re-run, every
synthetic base is correct as constructed, and the picture inverts:

- **S32B-G2 PASS.** Across all eleven re-run adversarial synthetics
  the ship vote never decided a wrong class. The two-chord fooler—the
  run-one violation—resolved to UNDECIDED, base kept, base correct.
  The registered mechanism prediction was wrong in an instructive way:
  the ratio rule did NOT abstain w4 (its histogram favored one of the
  two change classes past 1.2); the HUMILITY MARGIN held the vote. The
  pickup, half-bar silence, 2 s silence and count-in all resolved
  correctly (the count-in self-defeating in 4/4, as predicted, twice);
  the anticipation render did NOT fool w4 (the chord model snapped the
  eighth-early changes to their bars) — that prediction was wrong too,
  in the vote's favor. 3/4 and 6/8 with pickups: all correct.
- **The backbeat case got tested in both directions across the two
  runs.** Run one (flux-weak kick): base WRONG on the backbeat render,
  vote moved it to the truth 5-0. Run two (clicky kick): base CORRECT,
  vote kept it 5-0. The vote neither chases the snare nor freezes.
- **S32B-G1 FAIL — by exactly one witness, and it is the applicant.**
  w2 v2, the new end witness being auditioned for a weight-1 seat,
  voted class 2 on the waltz's correct base (and scattershot
  elsewhere: these renders end on a beat-4 snare, and the witness
  faithfully votes the LAST ONSET'S class — the "songs end on the
  downbeat" assumption is false even on steady synthetics). The gate
  worked: teeth restored, and they bit the one witness not yet vetted.
- **S32B-G3 FAIL, and the real songs settle it.** Even with the
  eighth-note filter, w2 v2 abstains "ritardando" on all twelve
  real-song reads: letter's end runs 8% short of the lattice beat and
  mop's 22% (0.78-beat swing intervals pass the 0.75 filter and drag
  the median), so the abstention is now a measurement, not an
  artifact. **The end witness stays out.** The app's hoped-for
  weight-1 seat is declined on the evidence.

**The production answer.** Within everything measured: the ship vote
(lead-corrected time zero 2, ratio-ruled chord changes 2, sections 1,
humility rule) kept six of six correct bases at three tempos and three
meters, never decided a wrong class on any honest synthetic adversary,
moved a wrong backbeat base to the truth, and on the real re-cuts went
fifteen right, four undecided, one wrong. The one wrong names the
do-not-place rule: **a start that is not beat-aligned (the 0.3-beat
pad) silences the vote's strong witnesses and should keep the declared
grid or ask, not decide** — detectable in the app as time zero
off-lattice AND chord ratio under threshold at once. w5 and the end
witness stay out; the one-tap stays the fallback behind an honest
undecided. S32-G1+G2, the app's registered stand-in for the fifth and
sixth songs, resolves as: G1 passes for every shipping witness with the
honest fixture, G2 passes on synthetics and names one real do-not-place
case. The real fifth and sixth songs remain the confirmation when they
arrive.

### Dated note (2026-11-08, same day): the endings do not slow down

Kevin flagged the published phrase "every one ends in a ritardando or
an uneven tail": the band reports that NO corpus song slows at the end
(the one Badverbs song that does, Interbellum, is not in the corpus).
He is right, and the measurement agrees
(scripts/diag-endings-2026-11-08.ts, $0): the final-window onset gaps
are fills and running eighths at the click — eat's last bars are
metronome-exact eighths at 0.49–0.51 beat, letter and mop end in dense
sub-beat fills (gaps 0.39–0.84 beat), peaceful plays eighths, rests
5.4 beats, then lands its final hit 0.03 beat from the lattice — plus
0.2–0.4 s of ring-out above the 2% audibility floor. A true ritardando
would show gaps LONGER than a beat and growing; none exist. So the
31d/32b claim is corrected: "abstaining by ritardando" was the
instrument's label for BUSY endings, not a property of the music; the
recordings hold their click to the last bar, consistent with the
metronome-exactness correction of 2026-11-07. The end witness's
decline STANDS, with its reason corrected: w2's local-beat estimator
(v1 and v2 both) cannot distinguish a busy ending from a slowdown, and
these songs end busy. Kevin's lingering-sustain hypothesis is the
smaller, true remainder: every song rings 0.2–0.4 s past its last
strong onset.

## Study 33 (pilot) — the stereo file as two stems

Kevin's question (docs/BRIEF-STUDY33.md, reg 88fceeb): the app drafts a
barmark chart from a fresh song with stems — how well does that work on
a stereo file, and is it worth treating the stereo file as two stems?
The grid half was already settled (Studies 28–32 ran on mono downmixes
of these exact stereo mixes), so the study isolates the draft's
transcription input: five arms on letter-lands, one shared grid, vote,
placement and hint set, graded by rootScore against the chart.
Scoping measurement first: the four corpus mixes correlate L/R at
0.83–0.90 with the side channel 10–13 dB under the mid, weakest below
200 Hz — kick and bass centered, the separation in cymbals and width.

**The arms (letter-lands, frozen stems ref 72/76 = 94.7%).**

| arm | transcription input | notes | roots |
|---|---|---|---|
| R | non-drum stem sum (the stems pipeline) | 1,179 | 72/76 = 94.7% |
| A | mono mix (the naive stereo-file path) | 1,049 | 74/76 = 97.4% |
| B | L and R as two pseudo-stems | 2,049 | 73/76 = 96.1% |
| C | mid and side as two pseudo-stems | 1,824 | 75/76 = 98.7% |
| D | HPSS harmonic of the mono mix | 998 | 72/76 = 94.7% |

**Gates.** S33-G1 PASS: arm R reproduces the frozen ref exactly
(72/76). S33-G2 PASS — the registered answer confirmed: L/R-as-two-
stems (96.1%) does not beat the plain mono mix (97.4%); it doubles the
transcription for one bar less. S33-G3 **FAIL, published as found**:
HPSS cost two bars against the mono mix (94.7% vs 97.4%, under the
registered −0.02 tolerance by 0.7 points) — the median filter reads
real strummed attacks and vibrato as percussive and takes harmony with
them.

**The headline nobody registered: the mono mix drafts AT the stems
ceiling.** P1 predicted drum bleed would cost bars (A below R within 15
points); A landed ABOVE R, 97.4% vs 94.7%. Basic Pitch transcribes the
drums weakly (the mix yielded FEWER notes than the stems sum, 1,049 vs
1,179 — masking), and the draft model reads through what bleed remains.
On this pilot a fresh stereo file needs no stems at all to draft at
stems quality. P2 half right: B sat within noise below A; C came out
one bar ABOVE everything — all five arms span three bars, the
disclosed sampling-noise scale (the gateway ignores temperature on
fable-5-1), so C's edge is a matrix question, not a conclusion.

**The synthetic separation sweep ($0, chord-tone purity, ceiling
99.7%).** P3 right on its own terms: at width 0 the side channel is
silence (0 notes) and the mono sum reads 96.1%; at width 0.5 and 1.0
the side channel isolates the chords perfectly (99.7%, by
construction); HPSS sits at the ceiling (99.6–99.7%) at every width —
on synthetics. The left channel collapses to drums-only at full width
(0 notes). The sweep and G3 together name the finding: median-filter
HPSS is perfect on clean synthetic sustains and LOSES real harmony;
the side channel is pure harmony exactly when the mix pans harmony,
which these real mixes mostly do not (side −10 to −13 dB, lows
centered).

**The production answer (pilot).** A stereo upload with no stems can
go straight into the draft pipeline as its mono downmix: same grid,
same hints, stems-ceiling quality on this pilot. Do not split L/R (two
transcriptions for nothing), do not HPSS. Mid/side is the only
candidate that beat mono, by one bar inside sampling noise — the
registered matrix (peaceful-dreams × the five arms, fence $0.6,
Kevin's go) is the test of whether that edge is real.

Spend: 80,779 in / 12,005 out ≈ $0.30 — the pilot fence to the cent
(registered estimate $0.25; drafts 5, transcriptions 20, all else $0).

### Study 33 matrix (same day): peaceful-dreams settles it — the mono downmix is the whole answer

The matrix (peaceful-dreams × the five arms, reg 88fceeb, scope fix
c396220 disclosed below) answered the pilot's one open question and
re-confirmed everything else:

| arm | input | notes | roots |
|---|---|---|---|
| R | non-drum stem sum | 2,477 | 151/153 = 98.7% |
| A | mono mix | 2,673 | 152/153 = 99.3% |
| B | L/R pseudo-stems | 5,393 | 152/153 = 99.3% |
| C | mid/side pseudo-stems | 4,942 | 146/153 = 95.4% |
| D | HPSS harmonic | 2,314 | 152/153 = 99.3% |

**S33-G1 PASS again, to the bar:** arm R reproduced the frozen ref
exactly on both songs now (72/76 and 151/153). **S33-G2 PASS again —
the question is closed:** L/R-as-two-stems went one bar under mono on
letter and tied it on peaceful, at double the transcription both
times. Not worth it, on both songs, final. **The unregistered headline
held twice:** the plain mono mix drafted ABOVE the stems sum on both
songs (97.4% vs 94.7%; 99.3% vs 98.7%) — a fresh stereo file needs no
stems to draft at stems quality.

**Mid/side's pilot edge was noise, and worse: the side channel can
poison the draft.** The one arm that beat mono on letter (+1 bar)
crashed to 146/153 on peaceful, six bars under mono — the side
channel's ~2,270 extra notes (cymbals, reverb, width) read as harmony
in enough bars to hurt. The production answer sharpens: no mid/side
either.

**S33-G3 split honestly:** FAIL on the pilot (letter, −2.7 points),
PASS on the matrix (peaceful, D tied A); across both songs the mean
(−0.013) sits inside the registered −0.02. The finding stands as the
pilot published it: HPSS is inconsistent per song and never helps —
pure cost.

**The production answer, final:** a chartless stereo upload goes into
the pipeline as its mono downmix — same grid, same hints, same draft,
stems-ceiling quality on both songs measured. No channel splitting, no
mid/side, no source separation.

Disclosures. (1) The runner as registered re-ran the pilot song in
--matrix mode, outside the registered matrix scope; corrected to
peaceful-alone before any paid call (c396220), pilot untouched. (2)
**The matrix fence was exceeded:** 191,152 in / 21,321 out ≈ $0.68
against the registered $0.6. The estimate assumed stems-sum-sized
prompts; arms B and C carry nearly twice the notes (5,393 and 4,942),
and peaceful's bar lines grew the drafts to ≈38k tokens in each. Found
after the run completed; published as spent. Study 33 total ≈ $0.98.

## Study 34 (2026-11-09): the chartless draft outside MMKK

Registered 328f66b (docs/BRIEF-STUDY34.md), run same day, results
ba88e9c. Twelve rights-clear recordings through the Study 33 shared
pipeline on the mono downmix, graded against tiered truth
(docs/VALIDATION-STUDY34-INSTRUMENTS.md). 802 scored cells, $0.708 of
the $5.00 fence (131,699 in / 29,627 out). **S34-G1 FAIL. S34-G2 FAIL
(0 of 8 good).** The app's public signed-out upload tool does not ship
on this evidence.

Classes over the eight accuracy-graded slots: five confidently wrong
(dippermouth 46% roots, st-louis 8%, livery 64%, the hymn 0%, the
waltz 8% — every one with the bar count off by 22 to 57), one refusal
(interbellum, the clean DAW export with page declarations; the draft
returned no parseable answer, and the raw text was not persisted this
run), and the two Josh Woodward songs saved just below threshold
(sequence roots 86% and 89%, qualities 80% and 100%).

**Where it breaks: the declared-input stage, not the drafter.** Every
confidently-wrong slot got its tempo, meter or key prior wrong from
production `analyse()` before the grid ran: the hymn quartet read as
78.6 bpm C minor (truth ~105, Ab major), the 3/4 waltz as 77.9 bpm
4/4, dippermouth's grid landed at exactly half tempo (57 bars against
114), st-louis at the wrong tempo level entirely (6/75 roots after
midpoint pairing). On the two modern full-band recordings the priors
were right (121.0 bpm against the artist's declared 121) or absorbable
(123 against 93, a 4:3 confusion that sequence grading does not see),
and the drafts were nearly good. The control reproduced its ceiling
(eat 67/68 roots), so the harness is sound.

Secondary observations, registered graders, no re-thresholding:
- Section sensing survives grid failure: livery's draft placed 11 of
  11 section boundaries while its harmony timeline was wrong;
  dippermouth 5/6. Structure and harmony fail independently.
- The control's quality families scored 40/68 against near-perfect
  roots: eat's band chart is written in power chords, which the
  registered mapping classes as "other" while drafts write plain
  triads. Notation scope, not detection error; it lands on the
  excluded control only.
- The jig medley was declared 4/4 by the production meter detector
  (it cannot say 6/8), as the brief predicted.
- The class-only key checks behaved per their gates: sp-today's Eb
  matched at margin 0.010 (below gate, inconclusive); kitten's
  single-chord calibration is too weak an instrument and is reported
  as such.
- The app's requested bar-count column shows draftBars = gridN - 1
  uniformly across all eleven parsed drafts — a chords-channel
  artifact, not a differential signal. The draft step did NOT change
  bar counts differentially: the bar-count catastrophes happened at
  the grid stage, which the app's changed-bar-count hold compares
  AFTER, so that hold alone would not have caught these five wrong
  charts. Whether the unknown-share hold would catch them is not
  recoverable from this run (raw drafts were not persisted; the
  runner now persists rawDraft, barCountChanged and unknownShare for
  every future run).

## Study 34b (2026-11-09): declared priors do not make the chartless draft safe

Registered b8c1bf3 (docs/BRIEF-STUDY34B.md, adopting the app's
bench-brief-study34b-declared-priors whole with the Tier 2 form
reconciliation), Parts A and C e58f9f0, Part B a394aa2. 1,465 scored
cells, $0.408 of the $2.00 fence ($0.051 a draft, 51,682 in / 20,312
out). **S34b-G1 FAIL (all five confidently wrong with tempo and meter
declared). S34b-G2 FAIL (0 of 5 at 80 percent roots).** Study 34 said
the detector breaks first on this material; 34b says fixing it is not
enough — the pipeline fails twice.

**Two failure modes, cleanly separated by the declared grids.** The
drifting 78s fail at the comb: st-louis's grid settled 7.2 percent off
the declared 67 (49 bars against truth 53) and livery's 8.9 percent
off 164 (115 against 125) — a single fixed period cannot hold an
unevenly cut side, exactly the case the app's brief anticipated. The
other three landed their declared grids to the bar: dippermouth 114 of
114 at 0.8 percent off, the hymn 76 (the committed form expectation
exactly) at 1.0 percent, the waltz 149 (the published 118 plus the
repeated strain, exactly) at 0.8 percent — and the drafts were still
confidently wrong, because the transcription is starved: 2.2, 1.9 and
1.3 notes per bar against 10 or more on every modern recording the
program has drafted. Dippermouth with a perfect grid reached 66
percent roots (up from 46); the hymn 17 to 31 percent; the waltz 6 to
8 percent. The front end has almost nothing to read on acoustic-era
audio, and the draft fills the silence confidently: dippermouth's
unknown share was 0.000, the worst slots peaked at 0.36 — none would
trip the app's 0.5 hold, and draftBars = gridN − 1 on all eight (the
chords-channel artifact again), so the bar-count hold is blind too.

**S34b-G3, the price of the key:** declaring the truth key moved
st-louis 3→19 roots and the hymn 13→23 with qualities 22→30; the waltz
7→9. Real help, nowhere near safety.

**Part A: the detector half-knew.** On the v0.200 port's full
Detection over fifteen recordings, tempo confidence separates at ~0.84
with 2 errors of 12 — every detection above the line was right, every
wrong one below it, and both errors are right detections flagged (the
safe direction for a refuse-or-ask mode). Registered exploratory: six
recordings sit within 10 percent of the line. The ladder rungs carry
the truth for only 3 of 7 wrong tempos (dippermouth and livery at x2,
peaceful at x1.5); the hymn, the waltz and the 4:3 song are on no
rung, so re-rung picking cannot rescue them. Key confidence does NOT
separate — the waltz detected A minor at confidence 1.000, a maximally
confident wrong key. Meter confidence separates nothing. Port caveat
disclosed: v0.200 lacks the x3 rung the shipped 11c patch added, which
would carry mop-heart's truth.

**Part C: the half-bar pickup bound fires zero false positives.** No
corpus recording puts sound before the placed downbeat, and livery's
real 3.3-beat late entrance (the barnyard intro) sits outside the
bound — the sorting the app hoped for. PICKUP_MAX_BAR_FRACTION 0.5
stands unopposed by this corpus, which carries no true pickups.

**Exploratory, for the next registration, in hypothesis words only:**
the two failure modes are both visible before the model runs — grid
tempo off the declared by more than 4 percent catches the comb
failures, and a notes-per-bar floor (the three starved slots sit at or
under 2.2; every good draft at 10+) catches the transcription
failures. Together they would have flagged all five wrong charts and
none of the good ones on the recordings measured so far. A threshold
read off this corpus is a hypothesis for the next one.

One correction carried in the registration: the Study 34 report's
"~105" for the hymn's true tempo was an unlabeled estimate; the
committed self-similarity instrument (verse lag at three multiples
agreeing within 0.2 percent) puts it at 97.1 bpm. Study 34's 0/16
roots and its class are unaffected.

## Study 35 (2026-11-09): modern material mostly lands, compound meter is a units bug, and the confidence refusal inverts

Registration docs/BRIEF-STUDY35.md at 4f8f831, corpus frozen at
69ea88c before it: ten modern CC BY 4.0 recordings (Josh Woodward,
artist-published tempo/key/meter and chord charts as tier-3 sequence
truth), declared mode with the app's three holds and its 0.84 tempo
confidence refusal registered in advance. Nine paid drafts plus two
exploratory arm D drafts, $1.000 of the $3.00 fence ($0.091 per
draft). jw-let-it-in reused its Study 34 record (identical inputs,
disclosed in the registration).

**Gates: S35-G1 FAIL, S35-G2 FAIL (5/10 good), S35-G3 PASS, S35-G4
reported and damning.** But the texture is nothing like 34/34b.

**The comb holds modern material.** Every 4/4 grid lands 0.0 to 1.4
percent off declared, Basic Pitch feeds 11 to 50 notes per bar
(acoustic-era slots starved at 1.3 to 2.2), and unknownShare is 0.000
to 0.006 everywhere. Five slots grade good — afterglow 15/15 roots,
cherubs 28/28, goodbye-to-spring 43/43 at a declared 240 bpm,
california-lullabye 49/53, swansong 28/30 — and three more sit at 83
to 86 percent (let-it-in 18/21, same-boat 15/18, im-letting-go
28/33), just under the registered 90 percent bar. The product's
declared mode, on the material it will actually meet, drafts usable
charts most of the time. That sentence has never been writable in
this program before.

**Both compound-meter slots land confidently wrong AND saved — a
units bug, not a music bug.** gravity (6/8, page says 48 bpm) and
my-favorite-regret (6/8, 65 bpm) grade 16/26 and 26/42 roots while
their transposition-free quality scores sit at 12/12 and 13/17. The
cause is mechanical: the artist states compound tempo in dotted
quarters, and the product's declared path reads the typed tempo as
beats of the bar per minute (measures.ts: "6/8 at 120 = 120 eighth
notes a minute"), so the declared bar comes out exactly three times
too long (7.5 s against a true 2.5 s). The drift hold is blind by
construction — it compares the landed grid to the same misread
value, and lands 0.0 to 1.4 percent "right". This is the same
disease the app fixed on the chart-aligned path the same day
(1e120b2e, barmark PlayedBar.tempo), now measured on the chartless
declared path. S35-G1 and S35-G2 fail on these two slots alone.

**The 0.84 confidence refusal inverts out of sample.** On this
corpus the automatic detector's tempo is wrong on 8 of 10 (the
registered threshold came from acoustic-era recordings; modern full
mixes defeat it differently). The refusal fires on 8 of 10 —
including BOTH right detections (let-it-in 0.809, afterglow 0.797)
— and the only two detections it passes are wrong
(california-lullabye 88.0 bpm at 0.845, cherubs 82.5 at 0.860). The
registered prediction ("fires on every wrong detection and on at
most two right ones") is falsified in the worst direction: out of
sample the threshold keeps only mistakes. Tempo confidence as
currently computed does not transfer across eras and should not ship
as a refusal signal.

**The two 34b holds survive their first out-of-sample test only
half-vindicated.** As predicted they fire on nothing modern (G3
passes trivially, no good draft held), but they also catch neither
compound-meter failure — drift cannot see a units error and 33 to 50
notes per bar sails past the floor. Necessary, not sufficient,
again: the missing hold is a beat-unit adapter on declared input
(convert compound-meter tempo the way musicians state it), which is
an app fix, not a threshold.

**Arm D (exploratory, no gate): the tempo-following grid recovers
livery-stable-blues.** librosa's DP tracker seeded at the declared
tempo tracks 510 beats into 128 bars against 125 truth bars, and the
draft grades 112/125 roots (89.6 percent) with 99/113 qualities —
against 17 to 31 percent for every fixed-comb attempt in 34/34b on
this unevenly cut 78. Per the registered reading, a tempo-following
grid earns a design in @barmark/listen. st-louis-blues stays floored
(54 bars against 53 truth, 3/53 roots at the detected B-flat key)
— its bars land, so the limit there is transcription and key, as
34b's G3 already showed (declared key moves it 3 to 19, still
drowned).

**Pickup census (observational, registered as unmet):** no recording
in the corpus puts first sound after voted bar one, so the half-bar
bound fired nowhere and its catch rate stays unmeasured; three
recordings place voted bar one 2.5 to 3.5 beats before first sound.

**Defect and correction, same day, before publication:** the first
grading pass compared sounding roots to chart-shape roots without
applying the calibrated transposition — no earlier corpus had a
nonzero accepted value to expose it. Every misgraded slot was
exactly a nonzero-transpose slot with near-perfect quality scores.
The grader gained sequenceScoreTransposed with unit tests, the nine
persisted drafts were regraded at zero spend (the model was never
re-queried, no threshold moved), and both gradings sit in
results/study35.json. Classes moved on three slots:
california-lullabye 23/53 to 49/53 (good), im-letting-go 16/33 to
28/33 (saved below threshold), my-favorite-regret 21/42 to 26/42
(class unchanged); gravity 13/26 to 16/26 (unchanged). The
interval-invariant and transpose-0 slots reproduced exactly.

Spend: $1.000 (248,127 in, 33,575 out), 11 paid drafts.

## Study 36 (2026-11-10): the field's beat trackers find the bar production cannot, and madmom earns the automatic re-draft

**Question.** Does an off-the-shelf joint beat/downbeat tracker deliver
the bar (period, grouping, downbeat phase) on the material the program
has already graded, and does the small browser-deployable Beat This!
checkpoint keep the gain? Zero model spend; every system is local
inference. Registered in docs/BRIEF-STUDY36.md before any run.

**Corpus.** The Study 34 and 35 union, 23 recordings with bar-level
truth: five click-exact Badverbs mixes, three JAAH jazz 78s, the hymn
and the waltz, ten Josh Woodward songs (declared tempo and meter; a 6/8
bar is two dotted quarters), three meter-only slots.

**Systems.** production (the v0.200 detector port plus the shipped grid
placement, automatic mode as the product runs it); Beat This! final0 and
small0 with minimal peak-picking, and final0 with the madmom DBN
postprocessor; madmom RNN+DBN with bars of [3, 4] and, exploratory,
[3, 4, 6]; librosa's unseeded tracker as the classical tempo baseline.

**Result on the ten Woodward songs** (bar strict within 4 percent /
folded at some metrical ratio / meter class right): production 3 / 7 /
8; Beat This final0 6 / 9 / 8; small0 7 / 8 / 8; madmom-34 7 / 10 / 8;
madmom-346 7 / 10 / 9. Decision rule S36-D1 (strict 7, folded 10, meter
8) is met by madmom and by no Beat This variant, so the Study 38
automatic-mode re-draft runs on madmom's bar. Predictions: P1 (Beat
This strict 7, folded 10, one compound song right) FAIL on all three
clauses; P2 (small within one of final) PASS; P3 (madmom within one of
Beat This on strict) PASS; P5 (goodbye-to-spring, declared 240, read at
120) PASS for final0, dbn and madmom. P4 FAIL as a conjunction: every
neural tracker beats production on acoustic-era bar period (0 of 6
against 1 to 4), the hymn defeats everything, Beat This names the
waltz's 3 where madmom reads 4 at half tempo, but Beat This places
every downbeat on beat 3 of dippermouth's bars (downbeat F 0.00 against
madmom's 0.66), and small0 halves st-louis's bar (80 bars against 53).

**The 78s.** Livery stable blues: every neural tracker reads the 1.46 s
bar production reads as 2.71, and madmom places the downbeat within 70
ms on 96 percent of bars with 126 bars against 125 truth. Dippermouth
114/114 bars (madmom, final0). St-louis 52/53 (madmom), 53/53 (final0
with DBN). This is Study 34's arm D result (a tempo-following grid
recovers the uneven 78) with no declared tempo supplied.

**6/8.** Production's automatic mode gets gravity exactly (eighth-note
pulse 145.9, subdivision 3, bar 2.466 against 2.5); the Study 35
failure there was the declared-tempo units bug alone, and the fix stays
on the app's input adapter. Beat This has no compound class and reads
both 6/8 songs as three-beat bars (gravity as 3 eighths, half the bar;
my-favorite-regret as three beats of two per dotted quarter, no fold).
madmom with a 6 class names both but pays elsewhere (dippermouth and
st-louis become 6-beat bars).

**Disclosure.** On eat-all-the-clocks all five trackers sit 85 ms after
the registered grid, uniformly, which is the registered bar-one offset
itself; the 70 ms window turns that into F = 0.00 for every tracker
while production scores 0.99 from the same onset grid that made the
truth. Reported as registered; it is a fixture question and it treats
every tracker alike.

**Runtime.** 27 to 47 s per song for Beat This final0 on 16 CPU
threads, 32 to 40 s for madmom's RNN; the small checkpoint is not
reliably faster on CPU because the mel front end dominates. Browser
timing is a Study 38 matter.

**Next.** Study 36b (registered, running): the same systems over the
261-song Josh Woodward catalog against the artist's declared tempo and
meter, with 244 paired instrumental mixes to ask whether the voice is
what trips the trackers.

## Study 36b (2026-11-10): the catalog census, 261 songs against the artist's own numbers

**Question.** With the artist's declared tempo and meter on 261 modern
recordings (Josh Woodward, CC BY 4.0; the Epic Bundle Kevin purchased
plus the song pages he authorized the bench to fetch), how often does
the bar come out right automatically, by meter and feel, and is the
voice what trips the trackers? Zero model spend; registered in
docs/BRIEF-STUDY36B.md before any catalog run, corpus frozen one commit
earlier.

**Catalog.** 223 songs in 4/4 (177 straight, 46 swing), 37 in 6/8, one
in 3/4; declared tempos 40 to 280, median 105; 244 songs paired with an
instrumental mix. The bar is four quarters in 4/4 and two dotted
quarters in 6/8 at the declared tempo.

**Result** (bar period strict within 4 percent / folded at a metrical
ratio / meter class right, regular mixes): production 36 / 67 / 69
percent; Beat This final 70 / 90 / 85; Beat This small 69 / 90 / 87;
madmom 66 / 89 / 85. On 4/4 straight songs the trackers reach 73 to 76
strict and 91 to 93 folded against production's 38 and 64; madmom
names the 4/4 class on 100 percent of them. On 6/8 nobody is good:
strict 8 to 35 percent, and madmom (bars of 3 or 4 only) never
satisfies the compound class. The instrumental mixes change little:
Beat This fixes 10 of its 74 failures and breaks 11 of its 170 passes;
production's outcome moves on 14 percent of songs. The voice is not
the problem.

**Predictions.** Mostly wrong in the details, right in the shape. The
trackers landed four points under the registered 80 percent strict on
4/4 straight (76, Wilson interval 70 to 81) and two under the 95
percent folded line; swing cost them nothing (76 versus 76); the small
checkpoint beat the large one on swing meter by eight points. Neither
decision rule fired: no tracker reaches 80 / 95, and the instrumental
fix rate of 14 percent sends source separation back down the list.

**Production's largest error class is its own 6/8 call.** It names 6/8
on 63 of 223 4/4 songs, 56 of them straight, every one through
`subdivision` reading 3, and 59 of the 63 bars come out unfolded. That
is the Study 11b/11c peaceful-dreams confound at catalog scale: the
sub-beat test fires on straight running eighths and the ladder then
builds a bar nothing in the song has. When production does name 6/8
on a 6/8 song (21 of 37) the bar is strict on 2. Its tempo confidence
does not separate right from wrong on 261 songs (medians 0.762 against
0.685; at 0.84, 12 right and 11 wrong pass), so Study 35's "do not
ship the refusal" stands at scale.

**The fold direction is a convention, and it is collapse-safe.** Of
Beat This's 39 folded-but-not-strict 4/4 readings, 28 are a bar HALF
the declared length (median declared tempo 72) and 8 a bar twice it
(median declared 212). The trackers live in the 80 to 160 lane; the
artist's slow and fast declarations are session choices. A grid at
half the declared bar is a finer grid, which the chart can merge
without losing a chord; the coarser direction is the rarer one. Tier
D's policy (prefer the shorter bar, merge identical neighbours) covers
28 of 39.

**Ten songs disagree with their page by every tracker at once**, with
the three trackers agreeing with each other within 4 percent
(AThousandSkinsPart2 page 75 trackers 106; ShowMe 123 vs 132;
RollAwaytheStone 95 vs 89; TheBestSong 120 vs 130; Flypaper 124 vs
164; and five 6/8 songs). Listed, not re-graded.

**Labelling disclosure.** Q6 was written in tempo terms ("the 1/2 fold
(120)" for a 240 song) while the grader's fold ratio is on the bar,
where that reading is 2; the prediction is scored under its own words
and the brief says so.

**What changes.** The production detector's automatic bar is right on
about a third of modern songs and its 6/8 call is wrong more often
than right; an off-the-shelf tracker is right on about three quarters,
folded on nine in ten, with the voice irrelevant. The remaining
quarter splits into the octave convention (collapse-safe in the
common direction) and compound meter, which no system here reads
reliably. Studies 37 and 38 follow the proposal: a harmonic-rhythm
period witness and the collapse-safe policy on the folded remainder,
then the automatic re-draft on a tracker's bar.

## Study 37 (2026-11-10): the harmonic-rhythm witness does not ship, and the half bar costs the chart nothing

**Question.** Can chord-change times pick the right bar among the
tracker's metrical-octave candidates (part C, $0, 261 songs × 4 base
systems), and does drafting at the grid a tracker actually hands over
(half the declared bar in 4/4; the adapter's true bar in 6/8) cost chart
quality (part D, five drafts, $0.452 of a $0.60 fence)? Registered
3dc106b (docs/BRIEF-STUDY37.md).

**Part C: no.** On Beat This final0's 223 songs in 4/4 the witness fixes
1 of 34 folded readings and breaks 30 of 165 strict ones (74 → 61
percent strict); madmom 4 fixed, 33 broken; production 13 fixed, 16
broken. It abstains on two thirds of songs and, when it acts, votes for
the half bar: ChordMini emits 60 to 124 changes per song, mostly
inside-the-bar flicker, so a stability term punishes every longer bar.
Removing sub-beat segments (exploratory) leaves it net negative. The
one win is compound meter on madmom and production, where the 2/3 ratio
moves six 6/8 songs each from a double bar to the declared bar and
breaks none. Predictions C1 to C4, C6 and C7 wrong; C5 right. A first
pass of the runner measured the bar from the mean beat interval, failed
to reproduce Study 36b, and is preserved and disclosed
(results/study37c-defective-run1.json); the corrected median run is the
result.

**Part D: the half bar is free, and the 6/8 fix pays.** let-it-in,
same-boat and im-letting-go drafted at twice the declared bpm grade
20/21, 16/18 and 33/33 roots against 18/21, 15/18 and 28/33 at the
declared bar; two cross into the good class. gravity and
my-favorite-regret at the adapter's true 6/8 bar move from 16/26 and
26/42 (confidently-wrong in Study 35) to 23/26 and 40/42, one good.
Merged bar counts (98, 56, 51) fall under the declared-grid drafts (120,
74, 58) because merging also collapses genuine repeats. Predictions D2,
D3, D4 right; D1 wrong under its words (two drafts improved past the
two-root band and changed class upward).

**Decision.** Study 38 drafts on the tracker's bar as read, shorter bar
preferred when two candidates fold, no harmonic-rhythm correction, the
6/8 adapter fix in. Compound-meter detection itself (which songs ARE
6/8) remains the open problem for every system.

## Study 38 (2026-11-10): the fully automatic chart equals the typed one on modern songs, is three points off a perfect grid on acoustic guitar, and fails on free tempo

**Question.** With nothing typed (madmom's downbeats as bar lines, its
median beat as tempo, its beats per bar as meter, the detector's key),
how good is the chart on modern songs, on solo acoustic guitar, and on
free-tempo voice and piano? Registered 62c3d63
(docs/BRIEF-STUDY38.md); 106 drafts, $3.84 of an $8 fence, plus 168
metrical cells at $0.

**Modern (ten Josh Woodward songs, artist-chart truth).** Ten of ten
within two roots of the declared-grid draft or above; eight good; none
confidently-wrong. gravity 24/26 and my-favorite-regret 40/42 with no
meter typed (Study 35: 16/26 and 26/42 at the typed 6/8 tempo).
S38-D1 fires: automatic mode is the tracker's bar as read, shorter bar
preferred, no tempo-confidence refusal.

**Acoustic guitar (36 GuitarSet singer-songwriter excerpts, lead-sheet
truth).** Annotated bars: mean roots 99 %, 28 good. madmom's bars:
96 %, 24 good, 3 confidently-wrong (one dense sheet); paired cost 2.9
points. Qualities 86 to 89 % on both grids (sevenths the sheet does
not name). Without drums Beat This's bar beats madmom's (strict 86 vs
61 %, downbeat F 0.97 vs 0.69). S38-D2 fires: the chord reader is the
next target on acoustic material.

**Free tempo (24 Winterreise songs, SC06; HU33 trackers only).** All
24 drafts confidently-wrong: roots median 41 % against the chord
sequence, 67 % against the per-bar truth. The music changes chord 1.5
times per bar (a one-chord bar is bounded near 50 %) and madmom's DBN
does not follow rubato (downbeat F 0.39; Beat This 0.68, reversed from
the registered expectation, same on the 1933 recording). S38-D3: Study
39 is a tracker comparison on free-tempo material with Beat This's
downbeats as the lead, plus a two-chords-per-bar draft format.

**Disclosures.** SC06 audio is CC BY-NC-ND 3.0 (read after download;
measurement only, never redistributed; the public-domain HU33 added to
the metrical arm). Five of 72 guitar answers came back empty or cut
off; on an unregistered retry three were empty again with finish
reason `content-filter`, so the gateway's filter stops the chart draft
on three particular excerpts; labelled "refused" as registered.
Predictions: A1, A3, A4, B1, B2, B4 right; A2, B3, C3 half right; C1,
C2, C4 wrong (C4 reversed).

## Study 40 (2026-11-10): the detector's 6/8 call has no bar value to protect, and the ×2 rule is net negative

**Question.** The app asked (stem-shovel docs/bench-brief-study37-meter-witness-2026-11-10.md) which second witness before the detector's 6/8 call keeps the true calls and drops the false, whether the sub-beat test is a threshold away, and at what ×2-rung strength the automatic grid should take the finer bar. $0: one feature extraction per song, sweeps as arithmetic, probe pinned to the port on 261 of 261 songs. Registered 8ba7ec3 (docs/BRIEF-STUDY40.md).

**Result.** No witness separates true from false 6/8: the duple-bar witness drops the 21 true calls to 4 while 10 false remain (r 1.00), and the sub-beat grid's best cell keeps 13 true against 45 false. But the 6/8 call carries no bar value: its bar is strict on 2 of the 21 true songs, so removing it (witness at r 1.00, or never emitting 6/8) raises production's strict bar from 95 to 112 to 114, folded 176 to 200, meter right 180 to 214 to 217, with zero to two songs made wrong. The ×2 finer-bar rule is net negative at every strength (at s 1.00: 2 fixed, 17 broken) and no bpm cap rescues it: the fixable songs' detected tempos overlap the strict-right songs' (70 to 149 against 80 to 170).

**Predictions.** P2 and P3 right; P1, P4 wrong; P5 wrong by two points. S40-D1: no cell meets its floor, so the recommendation is Study 38's (a tracker's bar as read), plus the out-of-floor observation that the detector should stop naming 6/8 from the subdivision read while it remains in the scan offer. Instrument correction disclosed: two feature extractions failed the A0 pin (meter lean read on the wrong envelope at the unrounded tempo) and were discarded; the sweeps are from the pinned extraction.

## Study 39 (2026-11-10): no tracker follows a free tempo well enough to chart; Beat This keeps the beats and splits the bars, every DBN keeps the bar and loses the beats

**Question.** Which of eight downbeat systems (Beat This final0 and small0 with peak-picking, final0 with the DBN, madmom 3/4 at λ 100/30/10/3, madmom 3/4/6) follows a free tempo well enough that its bars could carry an automatic chart. 48 Winterreise performances (two editions, annotated bars) and three JAAH 78s, $0. Registered ca362ee (docs/BRIEF-STUDY39.md).

**Result.** Beat This final0 with peak-picking has the recall (0.86 at 70 ms on the lieder) but places a half bar on 14 of 48 and is strict on 6; every DBN system holds a bar length (Beat This + DBN strict on 24) and loses the beats (recall 0.54; madmom 0.37 at λ 100, 0.44 at λ 10, half the predicted gain). On the steadily drifting 78s madmom λ 100 is best (F 0.97 at 150 ms), as predicted. The 1933 edition costs the small model and the DBNs 0.10 to 0.16 of recall; the big model and madmom λ 100 are indifferent. No system is chartable (recall ≥ 0.8 at fold 1 or 1/2) on more than 11 of 48, against a 36-of-48 floor.

**Decision.** S39-D1 holds: no free-tempo tracker is adopted. The next study on this material is the draft format (two chords per bar) on Beat This final0's bars at the half-bar fold, disclosed as sub-threshold; Kevin's own demos replace the lieder proxy when available. Predictions P1, P3, P4 right; P2, P5 wrong.

## Study 41 (2026-11-11): Beat This small passes the app's one-tracker rule; the Study 10 ONNX export is the right weights at the wrong window

**Question.** The app wants to ship one tracker for the automatic chart and named Beat This small. Does the draft hold up on its bars; how does a tracker's reading become the chart's tempo and meter with nothing typed; which draft holds survive a tracker's bar; and what exactly did the bench measure. $2.01. Registered 2d3dd48 (docs/BRIEF-STUDY41.md).

**Result.** On the ten modern songs Beat This small0's drafts are within two roots of madmom's on 10 of 10 (seven identical, two better) with none confidently-wrong: the app's rule passes. final0 misses it on one song by three roots (still good). Two of small0's bars are half bars and cost nothing (42/42, 43/43), as Study 37 found. The label rule of Study 38 had a blind spot, now measured: six beats to the bar on a 6/8 song read as "4/4 at 143"; the bench's replacement labels from the modal count, 6 → 6/8 at the tempo divided by three, which lands on the declared 48. Of the app's three holds, with a tracker's bar: the detected-grid hold holds every automatic draft (not a filter), the drift hold holds 17 of 46 (12 good, 1 of 3 bad, 16 of 17 at a metrical fold) and comes out, the thin-transcription hold fires on nothing (minimum 5 notes a bar) and keeps its Study 34b evidence. The recipe is written down with checkpoint hashes. The Study 10 ONNX export of small0 has weights identical to the torch checkpoint (logits equal to 0.00 at 250-frame chunks) but its attention breaks past 300 frames, and at 5 s of context it is a different tracker (downbeat F 0.51 to 0.78 against the package, bar counts off by up to 82): Study 10's N-beat was that tracker.

**Predictions.** P1, P4, P5 right; P2 wrong (the all-ten rule passed; the bench expected one failure), P6 wrong (ONNX disagreed); P3 unscored. S41-D1: ship Beat This small0 alone on full-band material from the torch checkpoint or an export verified against it at 1500 frames. Spend overran the $2 fence by one cent on the last registered draft; disclosed.

## Study 42 (2026-11-11): the small0 export, produced, verified to the package and timed; the browser is feasible

**Question.** Study 41 found the bench's Beat This small0 ONNX export carried the right weights but broke past 300 frames. Can an export be made that is the measured system at the 30-second window, and how fast does it run on CPU and in WebAssembly, so the app can place it? $0. Registered 4792e1f (docs/BRIEF-STUDY42.md).

**Result.** The cause was the rotary position embedding's cache, baked at the traced length. Two exports fix it: one traced at exactly 1500 frames (TorchScript exporter, 9.9 MB, sha256 d57ae630…) and one with the cache disabled and a dynamic length (dynamo exporter, 10.5 MB). Both match the package's frame logits to 7e-5 or better, the dynamic one at 750 and 3000 frames too, and the static one run through the reference inference reproduces the package's beats and downbeats exactly on all ten modern songs (F 1.000, identical counts). Model time on a 30 s chunk: torch 0.56 s, ONNX Runtime CPU 0.54 s at four threads (0.85 at default), ONNX Runtime Web WebAssembly 4.5 s single-thread (the threaded build did not engage in Node). S42-D1: the export is handed over as the measured system and the browser is recommended, 9 to 10 s of model time per minute of audio on the bench core; the server path at about 1 s per minute is the fallback. Predictions P1, P2, P3, P5 right; P4 wrong (ONNX Runtime at default threads is 1.5× torch, at parity at four threads).

## Study 44 (2026-11-11): the app's two rules on the tracker's bars, measured at $0

**Question.** The app draws generated drafts on Beat This small0's downbeats with two unmeasured rules: adjacent half bars are joined, and a reading in which fewer than 60 % of bars hold the modal beat count is not used. Do they help? Registered f007124 (docs/BRIEF-STUDY44.md); the app's rules ported verbatim and pinned to its thirteen tests; 887 cells over the ten Woodward songs, the app's five dev recordings (already in the bench's Study 36 corpus), the twelve Study 43 guitar takes, the waltz and the 261-song census.

**Result.** Joining is a wash on the census bar count (73 songs toward the declared count, 61 away; 44 to 36 among songs read at the declared level) with one clear win, gravity (118 → 94 bars against 94 declared; a good draft that would otherwise fail the steadiness rule) and two losses by count. The steady share enriches for a wrong bar without separating: at the app's 0.6 it removes 35 census readings of which 22 have a right bar at some fold, and among the 22 drafts on small0 bars it removes two sound drafts and misses the one confidently-wrong one (share 0.93). No measure does better (fold share, beat CV swept). Mop heart is not a small0 weakness: final0 fails the same rule, and the DBN reads a steady 3/4 at half the declared tempo. The app's beats-per-bar counts match the package's on all five of its recordings. Predictions P2, P3, P5 right; P1, P4 wrong. S44-D2 by the registered criterion lands on 0.7; the bench's labelled judgment is 0.4, the least that keeps mop heart off the chart while keeping both good 6/8 drafts. Arm A2 (approved, $0.35): four Woodward drafts on the joined grid score identically to the as-read drafts in roots, qualities and class, so joining is free where it fires and the recommendation to keep it rests on the bar count alone. The port comparison ($0): the app's stored beats and downbeats for its five recordings equal the package's to the frame, 1,772 beats and 478 downbeats, F 1.000 on every song; the app's port is the measured system on real audio.

## Study 43 (2026-11-11): two cells a bar on fast-moving harmony; the dense guitar sheet was never a format problem

**Question.** Does giving the draft two cells a bar (the tracker's bar split at its middle beat), with nothing else changed, lift the sequence score on the material where the automatic chart still fails: the GuitarSet sheet that produced all three confidently-wrong guitar drafts, and the Winterreise lieder? Registered 8bfdacd (docs/BRIEF-STUDY43.md); $1.54 of a $3 fence; 40 drafts, 3 stopped by the gateway's content filter.

**Result.** On the guitar the premise was wrong: the dense sheet is one chord a bar with repeats, and on Beat This small0's bars as read its roots are already 14/14 on four of six takes (the Study 38 failures were madmom's bars). What keeps five of six below good is chord quality (7/11, once 2/11): a seventh and two minors the drafts write as plain roots. The half grid lifted 2 of 12 guitar takes and 5 of 8 lieder (roots median 0.36 → 0.58) and lowered 2; every lied is still confidently-wrong, so the format was part of the ceiling there and not all of it. Unlooked-for: D911-19 drafts good (37/41) on small0's bars as read, where madmom's bars gave 18/41, the first Winterreise song to reach good. S43-D1: no grid change recommended; two cells a bar cost 12 % more input and buy nothing where chords change by the bar. Predictions P4 right; P1, P2, P3 wrong (P3 by 0.02). Next on guitar: chord quality in the prompt and hints; next on the lieder: the audio and the truth.

## Study 45 (2026-11-11): chord quality on the one-chord-a-bar sheet; production's rock clause against a style-neutral one

**Question.** Study 43 left the dense GuitarSet sheet with its roots right and its qualities wrong: a half-diminished written as a minor, dominants as triads, two takes as power chords. Where is the quality lost, and does replacing the one clause of the production prompt that says "think like a rock musician … power chords (5) and sus chords are common here" with a style-neutral instruction about quality recover it without costing the modern songs? Registered cedaf0b (docs/BRIEF-STUDY45.md); Arm 0 $0, Arm 1 $1.46 of $2.50.

**Result.** Of the 40 quality positions lost on the dense sheet, 25 are bars where the ChordMini hint's quality was already wrong (its vocabulary has no half-diminished), 13 are power chords on one take, 2 are the model's own. The quality clause, differing from production in that clause only (pinned), lifted qualities on 6 of 10 paired takes and lowered 1, turned the one confidently-wrong draft on the shipped tracker's bars into a good one, spelled the half-diminished in 7 of 12 drafts where production spelled it in 3 of 10, and on the ten Woodward songs changed no class (one root pair 50 → 48). It did not stop power chords on thin takes (5 drafts of 12, from 3). Predictions P1, P3, P4 right; P2 wrong (good rose by one take, not two); P5 wrong. By the registered rule the outcome is reported without a recommendation; the bench's labelled judgment favours the clause, and names the hint model's missing half-diminished as the larger remaining gap.
