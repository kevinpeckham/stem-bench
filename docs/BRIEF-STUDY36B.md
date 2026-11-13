# Study 36b: a 261-song census of tempo and meter against the artist's own numbers

Registered 2026-11-10, before any scored run over the catalog. Part B of
docs/PROPOSAL-AUTOMATIC-METER-2026-11-10.md. Zero model spend; local
inference only (Beat This!, madmom, the production detector port).

## Why

Every tempo and meter number the program has reported so far rests on
at most ten modern songs. The Josh Woodward catalog gives 261 modern
recordings whose author states tempo, meter and feel on each song page,
under CC BY 4.0, with a paired instrumental mix for 244 of them. That is
enough to put a confidence interval on "how often does the bar come out
right automatically," to split it by meter and feel, and to ask whether
the voice is what trips the trackers, without running a source
separator.

## Corpus (frozen in commit ba8b277, before this registration)

- corpus/study36b-census.json: the 262 song pages fetched 2026-11-10
  (Kevin's authorization for the scripted fetch); 261 have a declared
  tempo and meter. Meters as declared: 4/4 × 223 (177 straight, 46
  swing), 6/8 × 37 (17 straight, 20 swing), 3/4 × 1 ("The Maze").
  "Preludes" has no tempo and is excluded. The parse reproduces all ten
  Study 35 slot values exactly.
- corpus/study36b-manifest.json: the purchased Epic Bundle (Regular MP3,
  Instrumental MP3, Alternate MP3 zips; sha256 of each zip and of every
  MP3 recorded). 262 regular files matched to pages by normalized title
  (12 unmatched are covers and parodies without an original-song page,
  listed in the manifest); 244 songs paired with an instrumental mix.
  The alternate bundle (229 files: short cuts, loops, unmastered) is
  hashed and held for later studies; it is not scored here.
- Audio lives in corpus-study36/ (gitignored); decoded to 22050 Hz mono
  f32le with ffmpeg, as in every prior study.

## Truth

Declared tempo and meter from the artist's page. Bar in seconds: four
quarters in 4/4, three in 3/4, and two dotted quarters in 6/8 at the
declared tempo (the convention Study 35 established and checked against
the audio on two songs). Declared values are the artist's statement
about his own session grid; they are not beat-aligned time truth, so
there is no downbeat phase score in this study.

## Systems and compute plan

Regular mixes (261): beatthis-final0, beatthis-small0 (minimal
peak-picking), madmom-34 (RNN + DBN, beats per bar [3, 4]), production
(the v0.200-port detector: tempo, meter string, confidence; bar =
pipeline beats-of-meter × 60 / bpm, 6 eighths in 6/8). Instrumental
mixes (244): beatthis-final0, beatthis-small0, production. About 14
hours of CPU on this VM; resumable.

## Graders (src/study36/metrical.ts, unchanged from Study 36)

Bar period strict (≤ 4 %) and folded (some fold in {1/3, 1/2, 2/3, 1,
3/2, 2, 3} within 4 %); meter satisfied (4/4 by 4 or 8 beats per bar,
3/4 by 3, compound by 2 or 6; production by its meter string). Tallies
by meter and feel; the paired arm counts, per system, regular-mix strict
failures the instrumental fixes and regular passes it breaks; the fold
direction (half / double) is tabulated against declared tempo.

## Registered predictions

- Q1 production, 4/4 straight: strict ≤ 45 %, folded ≥ 75 %. On 6/8:
  names 6/8 on ≤ 30 % of the 37; names 6/8 falsely on ≤ 5 % of 4/4.
  Names 3/4 falsely (the ±0.03 lean) on ≥ 5 % of 4/4 songs.
- Q2 beatthis-final0, 4/4 straight: strict ≥ 80 %, folded ≥ 95 %,
  meter ≥ 85 %. 4/4 swing lands at least 10 points below straight on
  strict. 6/8: meter satisfied (2 or 6) on ≥ 50 %; strict ≥ 40 %
  (compound bars at these tempos fall at the 3/2 and 2/3 folds often).
- Q3 beatthis-small0 lands within 5 points of final0 on every rate with
  n ≥ 40.
- Q4 madmom-34 lands within 8 points of final0 on 4/4 strict; on 6/8 it
  satisfies meter less often than final0 (its bar classes are 3 and 4).
- Q5 paired arm (the separation question): of final0's strict failures
  on regular mixes, the instrumental fixes ≤ 25 %; of its passes, the
  instrumental breaks ≤ 5 %. Production's outcome changes on ≤ 15 % of
  paired songs. If the fix rate is instead ≥ 50 %, the voice is the
  problem and Tier H (separation) moves up.
- Q6 fold direction: among 4/4 songs final0 reads at the 1/2 fold, the
  median declared tempo is ≥ 150; at the 2 fold, ≤ 80. Trackers prefer
  the 80–160 lane; the declared tempo is a session convention.
- Q7 interval: the 95 % Wilson interval on final0's 4/4 strict rate is
  no wider than ±7 points (n ≈ 223).

## Decision rules

- S36b-D1: if final0 or small0 reaches 4/4 strict ≥ 80 % and folded
  ≥ 95 %, the automatic-mode re-draft (Study 38) uses that tracker's
  bar as the grid, with the collapse-safe octave policy of Tier D for
  the folded-but-not-strict remainder.
- S36b-D2: if Q5's fix rate is ≥ 50 %, separation (Tier H) is scheduled
  before harmonic-rhythm witnesses (Tier C).

## Disclosures

- The ten Study 35 songs and the two Study 34 Woodward songs are in
  this corpus; their trackers' outputs were seen in Study 36 before
  this registration (final0 read california-lullabye at the strict
  octave; the hymn and waltz are not Woodward songs). Twelve of 261 is
  not enough to move a rate, and no prediction here was tuned to them.
- The artist's tempo is the session click; a few songs may have been
  recorded freely or with tempo changes, and nothing here detects that.
  Songs where every system agrees with each other and disagrees with
  the page are reported as a list, not re-graded.
- Covers and parodies (12 files) have no original-song page and are
  excluded; "Preludes" has no tempo.
- Compute only; no fence needed.

## Results (2026-11-10, results/study36b.json; raw in results/study36b-trackers.json)

The run took five hours, not fourteen (Beat This final0 median 13 s per
recording, small0 8 s, madmom 27 s; the Study 36 figures were measured
while the Study 36 grading and three decodes shared the CPU).

Regular mixes, bar strict / folded / meter right (n):

| system | all (261) | 4/4 straight (177) | 4/4 swing (46) | 6/8 (37) |
|---|---|---|---|---|
| production | 36 / 67 / 69 | 38 / 64 / 68 | 54 / 85 / 83 | 8 / 62 / 57 |
| beatthis-final0 | 70 / 90 / 85 | 76 / 93 / 92 | 76 / 96 / 85 | 32 / 68 / 57 |
| beatthis-small0 | 69 / 90 / 87 | 75 / 92 / 91 | 76 / 96 / 93 | 35 / 70 / 59 |
| madmom-34 | 66 / 89 / 85 | 73 / 91 / 100 | 76 / 96 / 96 | 16 / 68 / 0 |

Instrumental mixes (244): production 42 / 74 / 72; final0 69 / 91 / 88;
small0 69 / 89 / 84. The one 3/4 song: every tracker names 3, none has
the bar strict (all read it at a fold), production reads 4/4.

Predictions. Q1 production: 4/4 straight strict 38 % (≤ 45 predicted,
right), folded 64 % (≥ 75 predicted, WRONG); names 6/8 on 21 of 37 6/8
songs = 57 % (≤ 30 predicted, WRONG, in the detector's favour); names
6/8 FALSELY on 63 of 223 4/4 songs = 28 % (≤ 5 predicted, WRONG by a
wide margin: 56 of the 63 are straight songs where `subdivision` reads
3 and the resulting bar is unfolded, the Study 11b/11c confound at
catalog scale); names 3/4 falsely on 1 of 223 (≥ 5 % predicted, WRONG).
Q2 final0 4/4 straight: strict 76 % (≥ 80 predicted, WRONG by 4),
folded 93 % (≥ 95, WRONG by 2), meter 92 % (≥ 85, right); swing is NOT
10 points below straight (76 vs 76, WRONG); 6/8 meter 57 % (≥ 50,
right), strict 32 % (≥ 40, WRONG). Q3 small0 within 5 points of final0
on every n ≥ 40 rate: WRONG by one cell, 4/4 swing meter 93 vs 85 (the
small model is better there). Q4 madmom within 8 points on 4/4 strict
(74 vs 76) and worse on 6/8 meter (0 vs 57): RIGHT. Q5 paired arm:
instrumental fixes 10 of final0's 74 regular failures = 14 % (≤ 25
predicted, right) and breaks 11 of 170 passes = 6.5 % (≤ 5 predicted,
WRONG by 1.5); production's outcome changes on 35 of 244 = 14 % (≤ 15,
right). The voice is not the problem; S36b-D2 does not fire. Q6 fold
direction: RIGHT under the prediction's own words (half-tempo readings,
bar fold 2, median declared 212; double-tempo readings, bar fold 0.5,
median declared 72), with a labelling disclosure: the brief wrote
"1/2 fold" meaning half TEMPO while the grader's fold ratio is on the
BAR, where the same reading is ratio 2. Q7: final0 4/4 strict 170/223 =
76.2 %, Wilson 95 % 70.2 to 81.3, half-width 5.6 (≤ 7, right).

Decision rules. S36b-D1 (4/4 strict ≥ 80 % and folded ≥ 95 %) is met by
no tracker; the nearest is final0 at 76 / 94. S36b-D2 does not fire
(fix rate 14 %).

Anatomy worth keeping.
- Of final0's 4/4 readings that fold but are not strict (39), 28 are at
  bar fold 0.5 (the tracker's bar is half the declared bar, a finer
  grid, the collapse-safe direction of Tier D) and 8 at fold 2 (a
  coarser grid, where merging would be needed). The 0.5 cases sit at a
  median declared tempo of 72; the 2 cases at 212. Trackers live in
  the 80 to 160 lane and the declared tempo is a session convention
  outside it.
- 6/8 is the unsolved class for everyone. final0 reads 6/8 songs as
  6 beats per bar on 18, 3 on 12, 4 on 3, 2 on 3; strict on 12 of 37,
  at the 3/2 fold on 8 (a 4/4 bar laid over a 6/8 song), unfolded on
  12. madmom with bars of [3, 4] reads 6/8 as 3 on 25 and 4 on 12 and
  never satisfies the class. Production names 6/8 on 21 of 37 but has
  the bar strict on only 2 of those 21.
- Production's false 6/8 on 4/4 is the catalog's largest single error
  class: 63 songs, 56 of them straight, every one with `subdivision`
  3, 59 with an unfolded bar. On instrumentals it is 42 of 208, so the
  voice contributes but is not the cause.
- Production's tempo confidence does not separate right from wrong
  at catalog scale: strict-right median 0.762 (n = 95), not-strict
  median 0.685 (n = 166); at the Study 34b line of 0.84, 12 of 95
  right and 11 of 166 wrong pass. Study 35's "do not ship the
  refusal" stands on 261 songs.
- Ten songs are unfolded against the page by all three trackers while
  the three agree with each other within 4 %: AThousandSkinsPart2 (page
  75, trackers 106), ShowMe (123 vs 132), RollAwaytheStone (95 vs 89),
  TheBestSong (120 vs 130), Flypaper (124 swing vs 164), and five 6/8 songs (Corrected 2026-11-13: first written as six; five are named and the ten are five and five) (MotionlessLand, SpaceCamp, FollowtheRoad, TheRivalWithin,
  DontCloseYourEyes) where the trackers' bar is 1.26 to 2.24 s against
  the page's dotted-quarter convention. These are listed, not
  re-graded; some may be page errors, some tempo changes, some the
  trackers agreeing on a wrong reading.
- The 12 Study 35/34 songs inside this corpus: nothing here was tuned
  to them and they move no rate.
