# Study 41: one tracker for the automatic chart

Registered 2026-11-10 before any scored run. Answers the app's brief
`stem-shovel/docs/bench-brief-one-tracker-2026-11-10.md` (Asks A to D).
Kevin approved the spend on 2026-11-10 ("approved").

## Question

The app wants to ship one tracker for the automatic chart on full-band
material and names Beat This small (a 10 MB checkpoint with a browser
port). Study 38 drafted the ten modern songs on madmom's bars only.
Does the draft hold up on Beat This small's bars; how should the
tracker's reading become the chart's tempo and meter with nothing
typed; which of the app's three draft holds earn their place when the
bar is a tracker's; and what exactly was the system the bench measured.

One correction to the brief's premise, stated before the run: Study
38's downbeat numbers (F 0.97 on GuitarSet, 0.68 on Winterreise) and
Study 39's are Beat This **final0**, the 81 MB checkpoint. Beat This
small0 appears in the census (Study 36b: strict 180 of 261 against
final0's 182) and in Study 39, where it trails final0 by 0.11 of recall
on the lieder and loses 0.16 on the 1933 edition where final0 loses
0.03. So Arm A drafts on both checkpoints' bars; the app asked for
small0 and the fence covers both.

## Arms

- **A, $ (fence $2.00, hard stop before the next draft):** Study 38's
  arm A pipeline verbatim (scripts/run-study41.ts from run-study38.ts:
  Basic Pitch notes, ChordMini per-bar hints, system23 + question23,
  temperature 0, sequence grading against the artist's charts, the
  Study 35 class rule) on the same ten Josh Woodward songs, with the
  bar lines a tracker's downbeats as read, the tempo its median beat,
  the meter its beats per bar (3 → "3/4", else "4/4", Study 38's rule),
  the key the v0.200 detector's. Tracker readings are the committed
  results/study36-trackers.json (Study 36, same audio): first
  `beatthis-small0` on all ten, then `beatthis-final0` on all ten.
  Paired against Study 38's madmom drafts (results/study38.json) and
  the declared-grid baselines by root and quality counts. Per draft the
  distribution of beats per bar across the song is recorded for Ask B.
- **B, $0 (prose):** the policy for one tracker with nothing typed,
  stated from what Study 38's pipeline did and Arm A's cells.
- **C, $0 (scripts/run-study41-zero.ts, holds):** over Study 38's 46
  drafts on a tracker's bars (ten modern on madmom, 36 GuitarSet on
  madmom; the four empty answers are counted as drafts the hold would
  or would not have held, with no grade), how many each hold would have
  held and how many of those are the three confidently-wrong drafts:
  - detected-grid hold: fires on every automatic draft by definition;
  - drift hold: the tracker's median bar more than 4 % off the declared
    bar (declared meter's beats × 60 / declared bpm; 6/8 as two dotted
    quarters at the declared tempo; GuitarSet from the filename tempo,
    4/4);
  - thin-transcription hold: fewer than 3 transcribed notes a bar.
  The 35 annotated-grid GuitarSet drafts are reported beside them as a
  secondary (drift 0 by construction).
- **D, $0 (scripts/onnx-study41.py + run-study41-zero.ts):** the
  recipe, written down from the installed package and the scripts that
  ran it; plus the one measurement the recipe needs: the Study 10 ONNX
  export of small0 (models/study10/small0.onnx, scripts/study10/nbeat.py,
  the front end and postprocessor translated to numpy) against the
  torch package's small0 on the same ten songs, downbeat F at 70 ms and
  bar count, so the app knows whether the browser port is the measured
  system.

## Predictions

- P1: no song is confidently-wrong on Beat This small0's bars.
- P2: at least 8 of 10 small0 drafts are within two roots of madmom's
  (right count ≥ madmom's − 2), and the app's all-ten rule FAILS: at
  least one song is short by more than two. (small0's downbeat counts
  differ from madmom's by 1.2× to 1.8× on four of the ten, which is not
  a metrical fold.)
- P3: on every song that fails P2's per-song test, the loss is the bar
  level: small0's median bar is more than 4 % off madmom's at ratio 1
  while its median beat is within 4 % of madmom's or at a fold of it.
- P4: final0's drafts are within two roots of madmom's on at least 9 of
  10 and none is confidently-wrong.
- P5: the drift hold holds at least 10 of the 46 tracker-bar drafts and
  catches at most 1 of the 3 confidently-wrong; the thin hold holds 0
  of 46.
- P6: the ONNX small0 agrees with the torch small0 at downbeat F ≥ 0.95
  (70 ms) on all ten songs, with bar counts within 2.

## Decision rule

S41-D1 (the app's, verbatim): if Beat This small0's drafts are within
two roots of madmom's on every song and no song turns
confidently-wrong, the app ships Beat This small0 alone for full-band
material, with no per-song tracker choice. If the rule fails, the bench
names the songs and whether the loss is the bar or the tempo level,
and reports whether final0 passes the same rule; the size trade (10 MB
against 81 MB) is the app's.

S41-D2 (holds, the app's rule): a hold that catches none of the bad
drafts and holds good ones comes out; one that catches the bad ones
stays; a hold that fires on nothing in this set is neither confirmed
nor refuted here and keeps its Study 34b evidence.

## Disclosures

- The small0 and final0 readings were computed in Study 36 and are
  public; their bar counts were read before the predictions were
  written (P2 cites them). The drafts are new.
- Study 38's madmom drafts are the comparator, run on a different day;
  temperature 0 and the committed prompts make the pipeline
  deterministic up to the gateway's own variation, which Study 35
  measured as small.
- Spend is recorded as spent.
