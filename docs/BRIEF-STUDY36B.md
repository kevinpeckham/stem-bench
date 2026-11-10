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
