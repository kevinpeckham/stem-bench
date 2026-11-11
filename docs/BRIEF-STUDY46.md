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
