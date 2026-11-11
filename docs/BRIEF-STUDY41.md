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

## Results (2026-11-11, registration 2d3dd48; $2.01)

### Arm A: the draft on Beat This's bars (ten modern songs)

Roots right / bearing against the artist's chart; class by the Study 35
rule. "Declared" is the Study 34/35 draft on the typed grid.

| song | declared grid | madmom (Study 38) | Beat This small0 | Beat This final0 |
|---|---|---|---|---|
| let it in | 18/21 saved | 18/21 saved | 18/21 saved | 18/21 saved |
| same boat | 15/18 saved | 16/18 saved | 16/18 saved | 16/18 saved |
| gravity (6/8) | 16/26 wrong | 24/26 good | 24/26 good | 24/26 good |
| my favorite regret (6/8) | 26/42 wrong | 40/42 good | 42/42 good | 41/42 good |
| california lullabye | 49/53 good | 48/53 good | 50/53 good | 48/53 good |
| swansong | 28/30 good | 29/30 good | 29/30 good | 29/30 good |
| afterglow | 15/15 good | 15/15 good | 15/15 good | 15/15 good |
| cherubs | 28/28 good | 28/28 good | 28/28 good | 28/28 good |
| goodbye to spring | 43/43 good | 43/43 good | 43/43 good | 43/43 good |
| i'm letting go | 28/33 saved | 33/33 good | 33/33 good | 30/33 good |

**Beat This small0 passes the app's rule: within two roots of madmom on
10 of 10, none confidently-wrong.** Seven songs identical to madmom,
two better by two roots, one (none) worse; 8 good, 2 saved, the same
two as on every grid. final0 fails the rule on one song, i'm letting
go, 30/33 against madmom's 33/33 (still good); its beats-per-bar
distribution there is the most fragmented of the twenty cells (48 bars
of 4, 23 of 2, 16 of 3, 15 of 1), so the loss is the bar level, not the
tempo (150 bpm on both). final0 is otherwise identical to small0 within
one root.

The bars behind those drafts (median bar; the app's Ask B question):
small0 reads the true bar on eight songs and the half bar on two (my
favorite regret: 1.38 s, half of madmom's 2.77 s three-dotted-quarter
bar; goodbye to spring: 1.48 s, a 3/4 label on a 4/4 song where the
tracker's bar lengths were 109 of 4 beats and 46 shorter). final0 reads
the true bar on eight and the half bar on gravity and my favorite
regret. Neither half bar cost a root: the drafts on half bars graded
42/42 and 43/43, as Study 37 Part D found.

### Ask B: the policy for one tracker, nothing typed

What Study 38 and this arm actually did, per song: bar lines = the
tracker's downbeats as read, with a closing bar at the audio end; tempo
= 60 / median inter-beat interval of the tracker's beats, rounded to a
whole bpm; beats per bar = round(median bar / median beat); label
"3/4" when that is 3, otherwise "4/4". Every tracker bar becomes a
chart bar; identical neighbours are merged afterwards.

1. "Two fold" compares nothing when nothing is declared. In automatic
   mode the bar is the tracker's as read, with no merge of bar pairs
   and no comparison; Study 37 Part D (half-bar drafts 20/21, 16/18,
   33/33 against 18/21, 15/18, 28/33 on full bars) and this arm (42/42
   and 43/43 on the two half-bar readings) are the evidence that the
   shorter bar is safe. "Shorter bar preferred" applies only when a
   declared bar exists and the tracker's bar sits at half of it: keep
   the tracker's bar.
2. Beats per bar varies on every song (the distributions are in
   results/study41.json, `beatsPerBarCounts`). The pipeline used the
   single number round(median bar / median beat) and never a per-bar
   count; the chart's bars are the tracker's regardless of their
   length. The label rule had one blind spot, now measured: on gravity
   small0's modal count is 6 (54 bars of 6, 49 of 3) and Study 38's rule
   labelled it "4/4 at 143 bpm" on a bar that is the true 6/8 bar
   (2.43 s against the declared 2.50). The draft did not suffer (24/26)
   because the bars were right; the label was wrong. Recommendation:
   label from the modal count, 4 → "4/4", 3 → "3/4", 6 → "6/8" with the
   tempo divided by three (dotted quarters, the app's own convention
   since v0.258.0: 143 / 3 = 48, the declared tempo exactly), 2 → "2/4"
   at the beat tempo (or "4/4" at half the tempo with bars paired, a
   product choice the bench has not measured), anything else → "4/4".
   On the two 6/8 songs Study 38 labelled madmom's three-beat bar at the
   doubled eighth "3/4 at 73" and "3/4 at 65"; that is a legitimate
   re-notation of 6/8 and the drafts graded good; a 6/8 label needs a
   beat at the eighth (Beat This) or a ×2 of madmom's beat.
3. The tempo is the median beat interval, not the tracker's own tempo
   estimate (Beat This has none; madmom's DBN tempo is the same median
   in practice). Store it in the beat the tracker found; when the label
   is 6/8 by the rule above, store the dotted-quarter tempo (beat ÷ 3),
   so the chart's `tempo:` line reads as the app counts it.

### Ask C: the three holds on the 46 tracker-bar drafts

| hold | would hold | good among them | catches of the 3 confidently-wrong |
|---|---|---|---|
| detected grid (automatic mode: every draft) | 46 | 32 | 3 |
| drift > 4 % off the declared bar | 17 | 12 | 1 |
| fewer than 3 notes a bar | 0 | 0 | 0 |

The detected-grid hold is not a filter in automatic mode: it holds
everything, good and bad alike. The drift hold holds 17 of 46, twelve
of them good; 16 of the 17 sit at a metrical fold of the declared bar
(half, two-thirds or double), which is the "shorter bar" the policy
keeps, and the one bad draft it catches (gs-03 SS2-107-Ab, a half bar)
is the half-bar sibling of two bad drafts at drift 0 %. It comes out
for automatic mode by the app's own rule; it needs a declared tempo
anyway. The thin-transcription hold fires on nothing here (minimum 5.1
notes a bar, median 20.4), so this set neither confirms nor refutes it
(S41-D2); its evidence remains Study 34b's starved 78s at 1.3 to 2.2
notes a bar, which this corpus does not contain. The bench agrees it is
the likely survivor and has no measurement against it. The three
confidently-wrong drafts are all one excerpt (SS2-107-Ab, the dense
sheet, 14 chords in 16 bars) and no signal measured before the model
ran marks them: drift 0, 0 and 50 %, 22, 15 and 11 notes a bar.

### Ask D: the recipe, and the ONNX export

What "Beat This" was in Studies 36, 36b, 38, 39 and here:

- Package `beat_this` 1.1.0 (CPJKU, MIT; pip), torch 2.15.0+cpu,
  torchaudio 2.11.1, CPU, float32. Checkpoints fetched by the package
  from `https://cloud.cp.jku.at/public.php/dav/files/7ik4RrBKTS273gp/<name>.ckpt`:
  small0 8,451,101 bytes, sha256
  `6074be2c4d490c5f6101fcc374a1ec72ae93456e23bb6019783b849f5dc7d47b`;
  final0 81,058,141 bytes, sha256
  `8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331`.
- Input: the mix decoded to mono float32 at 22050 Hz (ffmpeg, channels
  averaged), fed as decoded with no normalisation
  (scripts/trackers-study36.py and successors, `np.fromfile` → model).
- Front end (the package's `LogMelSpect`): n_fft 1024, hop 441 (50
  frames a second), 30 to 11000 Hz, 128 mel bands (slaney), magnitude
  normalised by frame length (power 1), then log1p(1000 · x).
- Inference: chunks of 1500 frames (30 s) with a 6-frame border,
  overlap mode keep_first, the short last chunk avoided by aligning it
  to the end (`split_predict_aggregate`).
- Postprocessor "minimal" (no DBN): a frame is a beat (downbeat) when
  its logit is the maximum over a 7-frame window and above 0; adjacent
  peaks de-duplicated; each downbeat moved to the nearest beat.
- The bench's derivations on top: tempo = 60 / median inter-beat
  interval; beats per bar = round(median bar / median beat).
- Wall time on this VM (16 vCPU of an AMD EPYC 9554P, torch default
  threads): small0 5.5 to 6.5 s per minute of audio, final0 8.7 s
  uncontended (Study 36) and 18 to 20 s when other work shared the CPU
  (Studies 38, 39); madmom RNN + DBN 9 to 11 s.

The ONNX export (models/study10/small0.onnx, 10,401,044 bytes, sha256
`c462b064a4033050ca6a5354bf866ff4610ab1fd8f1dec1e494b20b22d870aea`,
from `ashudesai/songbird-models` via scripts/fetch-models10.sh) is NOT
the measured system, and P6 fails: against the torch small0 on the ten
songs its downbeat F at 70 ms is 0.51 to 0.78 and its bar counts differ
by up to 82 (cherubs 87 against 169). The cause is pinned (exploratory
addendum, scripts/explore-study41-onnx-*.py, results/study41-onnx-diag.txt):
fed the same spectrogram in 250-frame chunks, the ONNX model's frame
logits equal the torch model's exactly (Pearson 1.000, max difference
0.00, identical peak counts on three songs), so the weights are the
same; but the export's attention breaks past about 300 frames (Study
10's runner already recorded this and worked around it with 5 s
chunks), and the model at 5 s of context is a different tracker from
the model at 30 s (torch-250 against torch-1500: r 0.68 to 0.83, 87
downbeat peaks against 169 on cherubs). Study 10's N-beat numbers were
that 5-second tracker. For the browser: export the checkpoint yourself
(or fix this export's sequence handling) so it runs at 1500 frames, and
verify by comparing frame logits with the torch package at 1500 on a
few songs before trusting any census number. Until then the measured
path is the Python package in the jobs function.

### Predictions

P1 right (no small0 draft confidently-wrong). P2 wrong (10 of 10 within
two roots; the all-ten rule passes; the non-metrical downbeat-count
ratios did not cost roots because merged identical neighbours absorb
split bars). P3 not scored (no small0 song failed). P4 right (final0 9
of 10 within two roots, none confidently-wrong). P5 right (drift hold
17 of 46, catches 1 of 3; thin 0). P6 wrong (ONNX F 0.51 to 0.78, bar
counts off by up to 82).

### Decision

S41-D1: the rule passes for Beat This small0. The bench's
recommendation to the app: ship Beat This small0 alone for full-band
material, the bar as read, with the label rule of Ask B item 2, from
the torch checkpoint (or an export verified against it at 1500
frames), not the Study 10 ONNX file. final0 misses the rule by one
song and adds nothing on this material; Study 39 is where it is better
(0.11 of recall on rubato, 0.13 on a 1933 recording), which is not the
full-band case. S41-D2: the detected-grid hold is not a filter in
automatic mode; the drift hold comes out; the thin hold keeps its Study
34b evidence.

### Disclosures

- Spend $2.010 against a $2.00 fence: the fence is a pre-draft check
  (hard stop before the next draft) and stood at $1.929 before the
  twentieth draft; the overrun is the last draft's own cost. All twenty
  registered drafts ran.
- The gateway reports temperature as unsupported on claude-fable-5-1
  and ignores it (Study 36 gotcha; the brief's "temperature 0" is the
  pipeline's request, not the gateway's behaviour).
- The ONNX cause analysis is exploratory and ran after P6 failed; it
  changes no registered number.
- The first draft ran while the Study 39 trackers and the ONNX
  comparison shared the CPU; wall time, not results, was affected.
