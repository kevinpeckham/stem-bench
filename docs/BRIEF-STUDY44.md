# Study 44: two rules on the tracker's bars, measured

Registered 2026-11-11 before the run. $0 model spend (one optional arm
of about $0.60 is written down below and is NOT run without Kevin's
approval). Answers the app's brief
`stem-shovel/docs/bench-brief-tracker-grid-rules-2026-11-11.md` (Asks A
to C and the port comparison).

## Question

The app now draws a generated draft on Beat This small0's downbeats with
two rules of its own on top, both from five dev recordings and neither
measured: (1) two adjacent half bars are joined into one bar; (2) a
reading in which fewer than 60 % of the bars (after joining) hold the
modal count of beats is not used and the draft keeps the declared grid.
Does Rule 1 move the bar count toward the song's, and could it ever
join two real bars? Does Rule 2's share predict a bad draft, where is
the threshold, and is 0.6 defensible? And is the one song it rejected
(a 3/4 at 224 bpm) a weakness of the small checkpoint that the big one
does not share?

## What the bench already holds

Every one of the app's five dev recordings is in the bench's Study 36
corpus (corpus-mmkk/*, the same mixes), with Beat This small0, final0,
final0 + DBN and madmom readings committed in
results/study36-trackers.json. The app's beats-per-bar table in its
brief is compared with those readings (count by count) as the first
form of the port comparison; the F-measure form needs the app's beats
in seconds (asked for in the reply).

## Instrument ($0)

- `src/study44/gridRules.ts`: the app's `joinHalfBars`, `steadyShare`,
  `trackerBarGrid`, `barCounts`, modal count, meter label and tempo
  ported verbatim from stem-shovel dev 36e7a919, pinned by
  `tests/study44.test.ts` to the app's own thirteen test cases; plus two
  candidate measures of the bench's own: the **fold share** (bars at the
  modal count or at its double or half) and the **beat CV** (coefficient
  of variation of the inter-beat interval).
- `scripts/run-study44.ts` profiles every Beat This small0 reading the
  bench holds, with final0, final0 + DBN and madmom beside it where they
  exist:
  - the ten Josh Woodward songs (Study 36 readings; drafts and grades
    from Study 41),
  - the five MMKK songs (Study 36 readings; the app's five),
  - the twelve GuitarSet takes of Study 43 (readings committed there;
    their bar-grid drafts and grades from results/study43.json when
    the run has written them, else reported as ungraded),
  - three-oclock-waltz (Study 36, the program's other 3/4),
  - the 261-song census (Study 36b readings and grades: bar strict,
    folded, meter right, against the artist's declared numbers).
  Declared bar count = seconds / declared bar (Study 36b's convention:
  four quarters, three quarters, two dotted quarters). Per reading:
  joins, bars as read and joined, the share as read and after joining,
  the fold share, the beat CV, whether the reading stands at the app's
  rule.
- **Ask A:** per set, how many readings have joins, how many pairs, and
  whether joining moves the bar count toward or away from the declared
  count; the census songs it moves away are listed (the candidates for
  "two half-count bars that were really two bars").
- **Ask B:** the 22 drafts on small0 bars (Studies 41 and 43) sorted by
  share with their grades; then a threshold sweep (0.3 to 0.9) of the
  share, the fold share and the beat CV over those drafts (bad = Study
  35's confidently-wrong) and over the census (bad = bar wrong at every
  fold), counting what each threshold removes and how much of it was
  bad. Study 38's 70 madmom drafts are reported as the DBN leaves them:
  share 1.0 by construction, so the share cannot separate them.
- **Ask C:** mop heart and the waltz under every system; the census's
  3/4 songs and its songs declared at 180 bpm or faster.

### Optional arm ($, not run without approval)

Ask A's "does joining change any draft's grade" needs drafts on the
joined grid. On the ten Woodward songs joining changes the grid by four
or more bars on four songs (same-boat, goodbye-to-spring, im-letting-go,
gravity); four Study 41 drafts on the joined grid cost about $0.60.
Written down here so it can run as registered if Kevin approves; its
result would be appended as Arm A2 with its spend.

## Seen before registration (disclosed)

This is a descriptive study of committed data, and the bench looked at
some of it while deciding what to register. Numbers seen: the
beats-per-bar counts and shares of the ten Woodward, five MMKK and
twelve guitar small0 readings; that Study 41's two 6/8 songs (gravity
0.46, my-favorite-regret 0.54) fall under 0.6 while their drafts are
good; that mop heart fails under small0 (0.30) and final0 (0.33) and is
read as a steady 3/4 at 111 by final0 + DBN and madmom; and a first
census pass: share < 0.6 on 61 of 261 small0 readings, 44 of them
folded right, against 18 and 10 for the fold share. The predictions
below are about what was not computed: the joining direction, the
sweeps, the guitar drafts, the waltz and the fast songs.

## Predictions

- P1 (Ask A): on the census, joining moves the bar count toward the
  declared count on at least three times as many songs as it moves
  away; fewer than 10 % of census songs have four or more joins.
- P2 (Ask A): no guitar reading has a join (the takes are steady 4/4),
  so Rule 1 cannot touch Study 43's grades there.
- P3 (Ask B, drafts): among the 22 small0 drafts, every reading the
  app's rule removes (share after joining < 0.6) is a draft that is NOT
  confidently-wrong; the one guitar reading with a broken bar octave
  (01_SS2-88-F, share 0.35) is removed and its Study 43 draft is not
  confidently-wrong either.
- P4 (Ask B, census): at the threshold that removes at least half of
  the readings whose bar is wrong at every fold, the fold share removes
  fewer right readings than the app's share does, by at least half.
- P5 (Ask C): the waltz (3/4 at 141.6) stands under small0 (share ≥
  0.6); among census songs declared at 180 bpm or faster, small0's
  share is under 0.6 on no more than a third.

## Decision rule

- S44-D1 (Rule 1): if P1 holds, the bench endorses joining as the app
  wrote it; if joining moves more census songs away than toward, the
  bench recommends dropping it. Either way the "really two bars" list
  is reported for the app to judge.
- S44-D2 (Rule 2): the bench recommends the measure and threshold that,
  on the census, remove at least half of the wrong-at-every-fold
  readings while removing the fewest right ones, and reports the app's
  0.6 share beside it. If the app's 0.6 removes more right readings
  than wrong ones, 0.6 on the raw share is not defensible and the bench
  says so.
- S44-D3 (Ask C): mop heart is called a small0 weakness only if final0
  reads it steadily (share ≥ 0.6); the two cases are told apart from
  the small0 output by whichever of fold share and beat CV separates
  mop heart from every good Woodward and MMKK reading, if either does.

## Disclosures

- The app's rules are ported, not re-derived; the port is pinned to the
  app's own tests so a divergence would fail a test.
- The draft grades on small0 bars are 22 (Study 41's ten, Study 43's
  twelve bar-grid cells), too few for a threshold on their own; the
  census (261 readings with bar truth) carries the threshold question
  and the drafts check it.
- The census's "bad" is a wrong bar at every fold, not a bad draft; the
  two are linked by Studies 38 and 41 (a bar right at some fold drafts
  well), not identical.
- Study 43's bar-grid drafts are read from results/study43.json as it
  stands when the script runs; if the run is still writing, the script
  reports which guitar items are graded.

## Results (2026-11-11, registration f007124; $0, 887 cells)

### Ask A: joining adjacent half bars (Rule 1)

| set | readings | with joins | pairs joined | 4+ joins | bar count toward declared | away |
|---|---|---|---|---|---|---|
| Woodward (10) | 10 | 7 | 41 | 4 | 4 | 3 |
| MMKK (the app's five) | 5 | 4 | 21 | 4 | 2 | 2 |
| GuitarSet SS2 (12) | 12 | 0 | 0 | 0 | 0 | 0 |
| waltz | 1 | 0 | 0 | 0 | 0 | 0 |
| census (261) | 261 | 134 | 849 | 81 | 73 | 61 |

On the census, joining moves the bar count toward the declared count on
73 songs and away on 61, and 81 songs (31 %) have four or more joins.
**P1 wrong** on both clauses. P2 right: no guitar reading has a join.

The declared count is a weak yardstick (constant tempo over the whole
file, and the artist's tempo is sometimes at another metrical level:
goodbye-to-spring declares 240 and the tracker reads 125). Post hoc,
disclosed as such: among the 180 census songs the tracker reads at the
declared level (a count within 15 %), 85 have joins, 44 move toward and
36 away, mean count error 8.7 % → 6.1 %. A modest net gain, not the
clear one the app's intro suggested. On the five MMKK songs: eat all the
clocks 80 → 72 (declared 74), interbellum 70 → 66 (65), letter lands
73 → 69 (78), peaceful dreams 149 → 144 (155). The last two were already
under the declared count as read, so their joined pairs were, by count,
real bars.

"Really two bars": the 61 census songs moved away are listed in
results/study44.json (askA.censusMovedAway); 24 of them are one or two
joins, the rest are songs the tracker reads at a half-bar for long
stretches (SpaceCamp 30 joins, AlmostNoRegrets 21, FlickeringFlame 19,
Perfect 17, BlowingGoingGone 17), where joining halves a passage the
declared count says was bars.

Gravity is the case for joining: read as 49 bars of 3 and 54 of 6, the
app's modal count is 6 and joining turns the 3s into 6s: 118 → 94 bars
against a declared 94.2, share 0.46 → 0.84. Without joining this good
Study 41 draft would fail Rule 2.

Arm A2 (drafts on the joined grid): not run, no approval sought yet.

### Ask B: the steady share (Rule 2)

The 22 drafts on small0 bars (Study 41's ten, Study 43's twelve bar-grid
cells; two of the twelve refused), sorted by the app's share after
joining. The app's rule removes two: my-favorite-regret (0.54, draft
42/42 good) and 01_SS2-88-F (0.35, the broken-octave reading, draft
14/14 saved-below-threshold). The one confidently-wrong draft on small0
bars (04_SS2-107-Ab, 11/14) has share 0.93. **P3 right**: the share
removes no bad draft and two sound ones. No threshold of any measure
isolates the bad draft (beat CV at 0.05 or 0.10 removes it with ten or
eleven others).

Census, 261 small0 readings, 27 with the bar wrong at every fold:

| measure | threshold | removed | wrong among them | right among them |
|---|---|---|---|---|
| share after joining (the app's) | < 0.6 | 35 | 13 | 22 |
| share after joining | < 0.7 | 57 | 17 | 40 |
| share as read | < 0.6 | 62 | 17 | 45 |
| fold share | < 0.6 | 19 | 8 | 11 |
| fold share | < 0.8 | 59 | 17 | 42 |
| beat CV | > 0.3 | 61 | 12 | 49 |

The app's 0.6 removes 22 right readings to catch 13 wrong (a wrong bar
is 37 % of what it removes against 10 % overall, so it enriches but does
not separate). By declared meter: 4/4 removes 19 of 223 (13 right), 6/8
removes 16 of 37 (9 right). final0 at the same rule: 40 removed, 25
right. **P4 wrong**: at the first threshold that removes half the wrong
readings (17), the fold share (0.8: 42 right) is no better than the
app's share (0.7: 40 right). The 14 wrong readings the rule keeps have
shares 0.60 to 1.00 (ShowMe at 1.00; GoodbyeToSpring at 0.75, whose
Study 41 draft was 43/43). Study 38's 68 madmom drafts all have share
1.0 (the DBN admits no other bar), 28 of them confidently-wrong: the
share says nothing about a draft on a DBN tracker.

### Ask C: mop heart

| system | bars (declared 142) | meter at tempo | share | fold share | beat CV | stands |
|---|---|---|---|---|---|---|
| small0 | 106 | 3/4 at 231 | 0.30 | 0.39 | 0.28 | no |
| final0 | 97 | 6/8 at 231 | 0.47 | 0.55 | 0.06 | no |
| final0 + DBN | 71 | 3/4 at 111 | 1.00 | 1.00 | 0.02 | yes |
| madmom | 71 | 3/4 at 111 | 1.00 | 1.00 | 0.01 | yes |

Not a small0 weakness: final0 fails the same rule (0.47) with the same
beat (231) and a different modal bar (6). Both raw checkpoints hear the
beat and lose the bar. The DBN postprocessor and madmom read a steady
3/4 at 111, bars twice the declared (a fold of 2; the declared 224 is in
the beat the raw trackers hear). The waltz (3/4 at 141.6): small0 0.62,
stands narrowly; final0 0.89; both read the declared level (144 and 135
bars of 151). Census: the one 3/4 (The Maze, 50) small0 0.88, folded
right; the 17 songs declared at 180 or faster have median share 0.88,
two under 0.6, 15 folded right. **P5 right.** Fast is not the problem;
mop heart's bar is.

Telling the two cases apart from small0's output alone: the **fold
share** does it on this corpus (mop heart 0.39; every good Woodward and
MMKK reading ≥ 0.65, my-favorite-regret the lowest); the **beat CV**
does not (mop heart 0.28; goodbye-to-spring 0.34 and gravity 0.32 are
good drafts). The app's own share after joining also separates
(0.30 against ≥ 0.54) but at 0.6 takes my-favorite-regret with it.

### The port against the package

The app's beats-per-bar table for its five dev recordings equals the
bench's package readings count for count on all five (eat all the
clocks 2: 17, 3: 1, 4: 61 … mop heart 1: 1, 2: 22, 3: 32, 4: 29, 5: 10,
6: 9, 8: 2). The port agrees with the package on real audio at the bar
level; the beat-level F-measure needs the app's beats in seconds.

### Decisions

- **S44-D1 (joining):** P1 did not hold and joining did not move more
  songs away than toward, so the rule as registered neither endorses
  nor drops it. Measured: a wash on the census count (73 toward, 61
  away; 44 to 36 at the declared level), a clear gain on gravity and on
  eat all the clocks, a loss by count on letter lands and peaceful
  dreams. The bench's reading: keep it, because its failure mode (a
  real two-bar passage drawn as one bar) is cheaper than its success
  mode is valuable (a 6/8 song kept on the tracker's bars), and offer
  Arm A2 (four drafts, about $0.60) to see whether any grade moves.
- **S44-D2 (the threshold):** by the registered criterion the pair is
  the app's own share after joining at **0.7**, removing 57 readings
  (17 wrong, 40 right); the bench reports it and does not like it. The
  app's 0.6 removes more right readings than wrong (22 to 13), so 0.6 is
  not defensible as a predictor of a wrong bar; neither is any other
  threshold of any measure here, because the share enriches without
  separating. Judgment, labelled as such: since Studies 41 and 43 show
  that readings under 0.6 still draft well (my-favorite-regret 42/42,
  01_SS2-88-F 14/14) and a wrong bar at every fold did not make a bad
  draft (goodbye-to-spring 43/43), the rule's job is only to keep a
  reading like mop heart (0.30) off the chart. **0.4** does that at the
  least cost: census 12 removed (5 wrong, 7 right), one draft removed
  (01_SS2-88-F), both 6/8 Study 41 drafts kept.
- **S44-D3 (mop heart):** not a small0 weakness; both raw checkpoints
  fail it and the DBN reads it. The fold share tells the case apart on
  this corpus; the beat CV does not.

### Disclosures

- Numbers seen before registration are listed above; P1, P4 and P5 were
  about unseen quantities, P2 and P3 partly about seen ones (the guitar
  joins, the two 6/8 shares) and partly about unseen (the Study 43
  grades, which arrived during the run).
- The "declared level" view of Ask A (within 15 %) is post hoc and
  reported beside the registered measure, which it does not replace.
- The Study 36 corpus rows that are neither Woodward, MMKK nor the waltz
  (four JAAH sides, kitten, sp-today, the jigs) were profiled as
  "other36" and reported in results/study44.json; no ask was registered
  on them.
- Study 43's bar-grid grades were read mid-run (ten graded, two refused
  at the time); its own results section is the record of them.

## Arm A2, registered 2026-11-11 after Kevin's approval ("yes to both")

scripts/run-study44-a2.ts: Study 43's pipeline (Study 41's from the bar
lines on) with the grid `joined` = the app's joinHalfBars over small0's
downbeats at the modal count, for the four Woodward songs where joining
changes four or more bars (same-boat 85 → 80, goodbye-to-spring 159 →
154, im-letting-go 119 → 115, gravity 118 → 94). Compared with Study
41's small0 drafts on the same bars as read (results/study41.json).
Fence $0.80, hard stop (Kevin approved "about $0.60"; the fence leaves
room for gravity's long prompt). Prediction P6: joining changes the
class of no draft and the root count of at most one; the measure is
whether the chart's bar count moves, not its chords.

### Arm A2 results (2026-11-11; $0.35 of the $0.80 fence, 4 drafts)

| song | as read (Study 41) | joined grid |
|---|---|---|
| same-boat | 16/18, q 11/11, saved (85 bars) | 16/18, q 11/11, saved (80 bars) |
| goodbye-to-spring | 43/43, q 22/23, good (159 bars) | 43/43, q 22/23, good (154 bars) |
| im-letting-go | 33/33, q 15/15, good (119 bars) | 33/33, q 15/15, good (115 bars) |
| gravity | 24/26, q 12/12, good (118 bars) | 24/26, q 12/12, good (94 bars) |

Joining changed neither the root count nor the class on any of the four;
the quality counts are identical too. P6 right. Rule 1 is about the
chart's bar count, not its chords: on gravity it removes 24 bar lines
and the chord sequence does not move. That settles the chord side of
S44-D1: joining is free where it fires, and the bench's recommendation
to keep it stands on the bar count alone.
