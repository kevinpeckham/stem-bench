# Study 36: the field's beat and downbeat trackers against the production detector, at the bar

Registered 2026-11-10, before any scored run. Kevin's "proceed" on
docs/PROPOSAL-AUTOMATIC-METER-2026-11-10.md §5. Zero model spend: every
system here is local inference or DSP. Part B of the proposal (the
Josh Woodward catalog census) is NOT registered here; its bulk page
fetch was blocked by the harness as bot-check circumvention and waits
on Kevin's decision (see §6).

## Question

Does an off-the-shelf joint beat/downbeat tracker deliver the bar
(period, grouping, downbeat phase) that the production detector cannot,
on the material the program has already graded, and does the small
browser-deployable variant keep that gain?

## Corpus (corpus/study36-corpus.json, 23 recordings, frozen before this registration)

The Study 34 and 35 union with bar-level truth: five click-exact
Badverbs mixes (uniform downbeat grids from registered bar one), three
JAAH jazz 78s (beat-aligned downbeats, bar counts), the hymn and the
waltz (tempo from the 34b self-similarity instrument, meter, no time
truth), ten Josh Woodward songs (artist's declared tempo and meter; a
6/8 bar is two dotted quarters at the declared tempo), and three
meter-only slots (kitten 4/4, sp-today 4/4, irish jigs 6/8). The union
of Study 34a's fifteen and Study 35's eight new songs is 23 recordings
(the proposal's "25" double-counted the two Woodward songs both
studies share).

## Systems

- **production**: the v0.200-port detector (src/study11b/analysis200.ts)
  for tempo and meter, then the shipped grid/vote/placement at its own
  values (run-study34/35 placeGrid verbatim). Bar = beats-of-the-meter
  × 60 / bpm, the pipeline's own convention (6 eighths in 6/8). Its
  downbeats are the placed grid. This is automatic mode as the product
  would run it today.
- **beatthis-final0**: Beat This! (Foscarin, Schlüter, Widmer, ISMIR
  2024; MIT) main checkpoint, minimal peak-picking, no DBN.
- **beatthis-small0**: the ~8 MB checkpoint, same postprocessing — the
  browser-deployable candidate.
- **beatthis-final0-dbn** (exploratory): final0 with madmom's DBN
  postprocessor, as a continuity variant.
- **madmom-34**: madmom RNNDownBeatProcessor + DBNDownBeatTrackingProcessor,
  beats_per_bar [3, 4] (the field's default configuration).
- **madmom-346** (exploratory): beats_per_bar [3, 4, 6], to let the DBN
  name a six-beat bar.
- **librosa**: librosa.beat.beat_track defaults (Ellis dynamic
  programming, unseeded). Beats only; graded on tempo as a classical
  baseline.
- Excluded: BeatNet (hard-requires PortAudio at import on this VM) and
  Beat Transformer / All-In-One (demixing front end out of scope for a
  $0 bake-off). Disclosed; may register later.

For trackers: beat period = median inter-beat interval, bar period =
median inter-downbeat interval, beats per bar = round(bar / beat),
downbeats = the tracker's own.

## Graders (src/study36/metrical.ts, tests/study36.test.ts)

- **Bar period, strict**: |est / truth − 1| ≤ 4 %.
- **Bar period, folded**: within 4 % at some fold in {1/3, 1/2, 2/3, 1,
  3/2, 2, 3}; the fold is reported.
- **Meter**: 4/4 satisfied by 4 or 8 beats per bar; 3/4 by 3; compound
  by 6 or 2. For production, the detector's meter string is classed
  directly.
- **Downbeat F-measure** (mir_eval convention, ±70 ms, one-to-one) on
  the eight recordings with time truth, references restricted to the
  audible span; the ~0.07 s ruler bias on three Badverbs grids is
  disclosed and may cost those slots a few points for every system
  alike.
- **Bar count** against truth on the three JAAH slots (the uneven-78
  reading).

## Registered predictions

- P1: beatthis-final0 gets the bar period strict on ≥ 7 of the ten
  Woodward songs and folded on all ten; meter right on ≥ 8 of ten
  including at least one of the two compound slots.
- P2: beatthis-small0 lands within one song of final0 on each of those
  three counts.
- P3: madmom-34 lands within one song of final0 on strict bar period
  over the ten.
- P4: on the acoustic-era set, every neural tracker beats production
  on bar-period strict and on downbeat F for livery and dippermouth
  (F ≥ 0.5 both), and st-louis's tracked bar count lands within 3 of
  53; the hymn fails strict for every system (the SMC-type case), and
  at least one neural tracker names the waltz's 3.
- P5 (the counter-case): goodbye-to-spring (declared 240) is read at
  the 1/2 fold (120) by at least one neural tracker; that is the
  convention question, not an error, and is reported as such.
- Baseline, not a prediction: production's numbers on these
  recordings are largely known from Studies 34, 34b and 35 (tempo
  wrong on 8 of the 10 Woodward songs in automatic mode).

## Decision rule S36-D1 (not a pass/fail gate)

A tracker earns the Study 38 automatic-mode re-draft if, on the ten
Woodward songs, bar period is strict on ≥ 7, folded on 10, and meter is
right on ≥ 8. More than one may qualify; the report then recommends by
browser deployability.

## Disclosures

- One pre-registration smoke run on jw-california-lullabye validated
  the environment (final0, small0 and madmom-34 all read 176.5 bpm, 4
  beats, 1.360 s bar; production had read 88). It is quoted here and
  counts as known, not predicted.
- Runtime on this VM (16 CPU threads): ~45 s per song for final0, ~37 s
  for small0 and for madmom's RNN. Browser timings are a Study 38
  matter.
- Beat This! training data includes copyrighted and limited-CC audio
  (the repository's own note); the model weights are MIT. No training
  set overlaps this corpus's recordings as far as the bench can tell
  (JAAH is not among the sixteen sets named in the paper; the Badverbs
  and Woodward material is unreleased or self-published).
- No model spend; no fence needed.

## §6. Part B, the Josh Woodward census — pending

The proposal's 250-song census needs 262 page fetches and ~250 MP3
downloads from joshwoodward.com, whose Cloudflare front rejects plain
curl. The single-page fetches for Studies 34 and 35 used a browser
User-Agent; a 262-page loop with the same header was refused by the
harness's classifier as bot-check circumvention, and the bench did not
work around it. Options for Kevin: (a) the artist offers whole-catalog
downloads on his site, which would be the clean path; (b) Kevin fetches
the pages and audio from his own machine; (c) an explicit permission
for the scripted fetch. Part B registers separately once the corpus
exists.

## Results (2026-11-10, results/study36.json; raw beats in results/study36-trackers.json)

Ten Woodward songs (strict / folded / meter, of 10): production 3 / 7 /
8; beatthis-final0 6 / 9 / 8; beatthis-small0 7 / 8 / 8;
beatthis-final0-dbn 6 / 9 / 8; madmom-34 7 / 10 / 8; madmom-346 7 / 10
/ 9; librosa (tempo only) 4 / 10. Acoustic-era six (strict): production
0, final0 4, small0 3, dbn 4, madmom-34 3, madmom-346 1. Meter right on
all 23: production 16, final0 19, small0 17, dbn 20, madmom-34 19,
madmom-346 17.

Per song, the ten (S strict, f = fold ratio, X unfolded):
production: let-it-in S, same-boat X, gravity S, my-favorite-regret X,
california f2, swansong f2, afterglow S, cherubs f2, goodbye f2,
im-letting-go X. final0: S S f0.5 X S S S S f2 f0.5. small0: S S S X S S
S S X f0.5. madmom-34: S S S f1.5 S S S S f2 f0.5.

Predictions: P1 FAIL (final0 strict 6 not 7, folded 9 not 10, compound
0 of 2). P2 PASS (small0 within one of final0 on all three counts). P3
PASS (madmom-34 strict 7 vs 6). P4 FAIL as a conjunction: every neural
tracker beats production on acoustic strict (0 vs 1 to 4) and the hymn
fails for all and Beat This names the waltz's 3 (madmom does not, it has
no 3 at that tempo and reads 4 at 78), but downbeat F on dippermouth is
0.00 for all three Beat This variants (half-bar phase: downbeats land on
beat 3 of every JAAH bar, 1.8 beats early with a 35 ms spread) against
madmom-34's 0.66; livery F is 0.83 to 0.96 for all. St-louis bar count:
dbn 53/53, madmom-34 52, final0 57, small0 80 (it halved the bar), 346
35. P5 PASS: goodbye-to-spring (declared 240) read at 120 by final0,
dbn and madmom-34; small0 instead read a 3-beat bar of 1.27 s there,
the one clean failure on a straight 4/4 song in the set.

S36-D1: madmom-34 and madmom-346 qualify (strict 7, folded 10, meter 8
and 9); no Beat This variant does (final0 folded 9, small0 folded 8).
The Study 38 re-draft therefore uses madmom's bar, with Beat This as the
browser candidate to be re-tested after the census.

What the acoustic-era set says: on the three 78s every neural tracker
finds the bar period production cannot (livery 1.46 s vs production
2.71; dippermouth 1.28 vs 2.56; st-louis 3.53 to 3.58 vs 6.12) and
madmom-34 places the downbeat within 70 ms on 66 to 96 % of bars; the
bar counts 114/114, 52/53, 126/125 are the Study 34 arm D result
(tempo-following recovers the uneven 78) without the declared tempo.
The hymn remains unsolved by everything: 2.30 (Beat This), 3.01
(madmom), 3.33 (production) against 2.47 declared.

6/8: production's automatic mode gets gravity's bar exactly (145.9
eighth-bpm, subdivision 3, 6/8, bar 2.466 vs 2.5); the Study 35 failure
on that song was the declared-tempo units bug alone. On
my-favorite-regret production reads 3/4 at 136.8 (bar 1.385, no fold).
Beat This reads both 6/8 songs as three-beat bars: gravity as 3 eighths
(half the bar, fold 0.5), my-favorite-regret as three beats of 0.467 s,
i.e. two beats per dotted quarter grouped in threes (bar 1.40, no
fold). It has no compound class and this is how its absence shows.
madmom-346 names a 6 on gravity (strict) and on my-favorite-regret at
the 3/2 fold, but pays for the extra class elsewhere (dippermouth and
st-louis read as 6-beat bars, waltz as 6).

Downbeat F disclosure: on eat-all-the-clocks all five trackers place
every downbeat 85 ms after the registered grid (spread 10 to 20 ms),
which is the registered bar-one offset (-0.085 s) itself; the 70 ms
window makes that F = 0.00 for all of them while production (anchored by
the same onset grid that produced the truth) scores 0.99. The number is
reported as registered. Whether the Badverbs click grid or the audible
attacks are 85 ms apart on that mix is a question for the fixture, not
for this study, and it affects every tracker equally.

Runtime per song on this VM: final0 27 to 47 s, small0 5 to 44 s
(the small model is not reliably faster on CPU because the mel front
end dominates), madmom RNN 32 to 40 s, librosa 1 s.
