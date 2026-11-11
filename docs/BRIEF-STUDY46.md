# Study 46: the hint's ceiling on acoustic guitar

Registered 2026-11-11 before the run. $0 model spend (ChordMini runs
locally; no gateway call). Kevin approved on 2026-11-11 ("Yes, let's run
the hint ceiling study").

## Question

Study 45 put most of the chord quality lost on the dense GuitarSet sheet
on bars where the ChordMini hint's quality was already wrong, and
(after a same-day correction) found that ChordMini's vocabulary does
carry every quality the sheet uses, half-diminished included. So the
question is the model's accuracy, quality by quality: across all of
GuitarSet, how often does the per-bar hint the drafts see name the right
root, and how often the right quality family, for each family the sheets
use? That bounds what any drafting prompt can recover from the hint, and
says whether the next move on acoustic material is a different hint, a
different use of the hint, or neither.

## Corpus (corpus/study46-manifest.json, scripts/build-study46-manifest.py)

All 360 GuitarSet excerpts (CC BY 4.0; Xi, Bittner, Pauwels, Ye, Bello
2018): 6 players × 5 styles (Rock, Singer-Songwriter, Bossa Nova, Jazz,
Funk) × 2 progressions × 3 tempi × comp and solo, 20 to 45 s each, the
mono microphone recording decoded to 22050 Hz f32le (gitignored, as
Study 38's 36 were). Truth from each JAMS: the **instructed** chord
annotation (the lead sheet the player was given; the primary truth, as
in Study 38) and the **performed** annotation (what the player played;
secondary), and the annotated bars (beat_position 1). Study 38 and 43
used 36 of these excerpts (the SS comp takes).

## Instrument ($0)

- The hint: scripts/study10/nchord.py, the ChordMini majority vote per
  bar on the annotated bars (with the audio's end as the closing bar
  line), exactly the per-bar hint Studies 23 to 45's drafts saw, via the
  bench's label mapping (scripts/study10/chordmini-vocab.json, 170
  labels; hdim7 and dim7 write as dim, min6 and minmaj7 as m, maj6 as the
  plain triad). Hints cached per excerpt in results/study46-hints.json.
- The truth per bar: the sheet's chord sounding at the bar start
  (src/study38/truth.ts chordAtBars, Harte → house symbols).
- The score (src/study46/score.ts, tests/study46.test.ts): per bar whose
  truth parses and is not N.C., root right (pitch class) and quality
  family right (Study 34's families: maj, min, dom, dim, sus, other),
  tallied by the truth's family with a confusion table of hint families;
  aggregated over all excerpts, by mode (comp, solo), by style and by
  style × mode; the performed truth as a secondary aggregate.

## Predictions

- P1: on the comp excerpts the hint's root is right on at least 85 % of
  bars.
- P2: over all excerpts the hint's quality family is right on at least
  70 % of bars.
- P3: on bars whose sheet chord is diminished or half-diminished (the
  dim family) the hint's family is right on fewer than 25 %.
- P4: on dominant-seventh bars (the dom family) the hint's family is
  right on fewer than 60 % (sevenths heard as triads).
- P5: the solo excerpts' root accuracy is at least ten points under the
  comp excerpts' (a single line implies its chord less than comping
  does).
- P6: against the performed chords the family accuracy is at least three
  points higher than against the sheet (the player's deviations are
  what the model hears).

## Decision rule

S46-D1. For every quality family with at least 50 bars in the sheets, if
the hint's family is right under 50 % of the time, the bench recommends
the app treat the hint's quality as advisory for that family: the prompt
says the hint's root is reliable and its quality is not (the exact
sentence to be tested in a later study, not written here). If no family
is under 50 %, the hint's quality stands as the drafts use it. The
per-family table is the deliverable either way; the root figure (P1)
says whether the hint's root deserves the trust Study 1 gave it.

## Disclosures

- No model call; the gateway is not touched. The run is ChordMini on
  360 excerpts, about an hour on the VM.
- The instructed sheet is what a chart would show, so it is the primary
  truth; where the player departed from it the hint may be "wrong"
  against the sheet and right against the sound, which P6 measures.
- The confusion table is on quality families, not exact qualities; the
  mapping's collapses (hdim7 → dim, min6 → m, maj6 → plain) are
  family-preserving for the grader's purposes except maj6 → maj, which
  it already was.
- The 36 SS comp excerpts are in both this corpus and Studies 38, 43
  and 45; the study is over the hint, not the drafts, and reuses no
  draft.

## Results (2026-11-11, registration 3bcaa68; $0; 360 excerpts, 5,280 scored bars, 23 minutes)

### The hint against the lead sheet

| excerpts | bars | root right | family right | both right | empty hint (N.C.) |
|---|---|---|---|---|---|
| all 360 | 5,280 | 44.3 % | 44.0 % | 36.2 % | 32.2 % |
| comp, 180 | 2,640 | 77.5 % | 66.9 % | 64.6 % | 8.2 % |
| solo, 180 | 2,640 | 11.1 % | 21.1 % | 7.8 % | 56.2 % |
| comp, Rock + Singer-Songwriter | 1,056 | 95.1 % | 83.1 % | 82.4 % | |
| comp, Jazz + Bossa Nova + Funk | 1,584 | 65.8 % | 56.1 % | 52.7 % | |
| comp Rock / SS / BN / Jazz / Funk, root | 528 each | 96.2 / 93.9 / 78.8 / 61.0 / 57.8 % | | | |

Against the performed chords instead of the sheet: all 46.3 % family
(+2.3), comp 71.7 % (+4.8), solo 20.8 % (−0.3).

### By the sheet's quality family

| family | bars (all) | family right, all | bars (comp) | root right, comp | family right, comp | what the hint said instead (comp) |
|---|---|---|---|---|---|---|
| maj | 3,360 | 51.9 % | 1,680 | 81.3 % | 76.8 % | none 135, dom 124, min 123 |
| min | 1,200 | 38.5 % | 600 | 76.3 % | 62.8 % | maj 159, none 48 |
| dom | 480 | 23.8 % | 240 | 73.8 % | 40.8 % | maj 83, min 36, none 22 |
| dim | 240 | 1.7 % | 120 | 38.3 % | 1.7 % | min 54, maj 31, dom 21 |

On the Rock and Singer-Songwriter comp excerpts the hint has the root of
a dominant bar 93.8 % of the time and the family 43.8 %, and the root of
a diminished bar 47.9 % with the family never (0 of 48; it hears a minor
or a major). On Jazz, Bossa Nova and Funk comping, roots fall to the
sixties and every family falls with them.

### Predictions

- P1 (comp roots ≥ 85 %): **wrong**, 77.5 %. Rock and Singer-Songwriter
  comping clear it (96 %, 94 %); Bossa Nova (79 %), Jazz (61 %) and Funk
  (58 %) do not. Study 1's trust in the hint's root was earned on a
  rock-shaped corpus and holds there.
- P2 (family ≥ 70 % overall): **wrong**, 44.0 %; the solos (21 %) sink
  it, and comping alone is 66.9 %.
- P3 (dim family < 25 %): right, 1.7 %. ChordMini can name a diminished
  chord and in 240 bars did so four times.
- P4 (dom family < 60 %): right, 23.8 % (40.8 % on comping).
- P5 (solo roots ≥ 10 points under comp): right, by 66 points. On a
  single line the hint is mostly absent: 56 % of solo bars vote N.C.
- P6 (performed truth ≥ 3 points above the sheet): **wrong** over all
  (+2.3), right on comping alone (+4.8). The players' departures from the
  sheet are a small part of the disagreement.

### Decision (S46-D1)

By the registered rule (every family with 50 or more bars, over all
excerpts): **min, dom and dim are under 50 %**, so the bench recommends
the app treat the hint's quality as advisory for those families. The
rule was registered over all excerpts; the labelled comp-only view, which
is the shape of the app's inputs (a mix or a strummed demo, not a single
line), puts min at 62.8 % and keeps dom (40.8 %) and dim (1.7 %) under
the line. The bench's reading, labelled: the hint's root is worth the
trust it gets on strummed material (95 % on rock-shaped comping, 66 % on
jazz-shaped), its major and minor are usable, and its sevenths and
diminished qualities are not; the prompt should say so, and the exact
sentence is a later study's. On a single melodic line the hint is
absent more often than present and the model should not be asked to
follow it.

### Disclosures

- $0; no gateway call. 23 minutes, not the hour estimated.
- The by-family table on comp excerpts alone and the Rock + SS / Jazz +
  BN + Funk split are post-hoc cuts of the registered score, labelled as
  such; the registered rule is scored over all excerpts as written.
- Hints cached in results/study46-hints.json (per excerpt, per bar); a
  rerun reproduces the tables without ChordMini.
- The solo excerpts are a single line over the same progressions and were
  included to measure the hint's floor; they are not what the app
  receives, and no recommendation rests on them.
