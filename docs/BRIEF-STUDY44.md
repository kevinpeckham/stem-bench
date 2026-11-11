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
