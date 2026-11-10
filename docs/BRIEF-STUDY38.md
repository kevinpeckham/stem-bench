# Study 38: the fully automatic chart, on modern songs, acoustic guitar and free-tempo voice-and-piano

Registered 2026-11-10 before any paid draft, on Kevin's "proceed with
your recommendations for Study 38, spend approved" (2026-11-10). Fence
$8.00 over about 106 drafts; hard stop before the next draft if
exceeded; results committed as spent.

## Why

Studies 36 to 37 settled the bar: a published tracker finds it on three
modern songs in four and the common error, a bar half the written
length, costs the chart nothing. Nothing has yet drafted a chart with NO
visitor input at all, end to end, and nothing in the program has
measured the target Kevin named on 2026-11-10 after hymns were taken
off the list: "acoustic live performances ... often demos without
fixed tempo", where a tempo-following grid is the only grid there is.
This study does both, and, because no rights-clear acoustic-demo corpus
with chord truth exists yet (search of 2026-11-10: artist sites, Free
Music Archive, the Live Music Archive, open datasets), it uses two
proxies and reports them as proxies: solo acoustic guitar at a steady
tempo with the player's lead sheet as truth (GuitarSet), and voice with
piano at a free tempo with measure-level chord annotations as truth
(Schubert Winterreise, SC06). Kevin's own demos replace the proxies as
the tier-1 slot when he has them.

## The automatic pipeline (scripts/run-study38.ts)

Bar lines are madmom's downbeats as read (RNNDownBeatProcessor +
DBNDownBeatTrackingProcessor, beats per bar 3 or 4, the Study 36
S36-D1 winner; scripts/trackers-study36.py and -study38.py). Tempo is
the tracker's median beat; meter "3/4" or "4/4" from its beats per bar;
key the v0.200 detector's. From the bar lines on, the pipeline is
run-study35's verbatim: Basic Pitch notes described per bar, ChordMini
per-bar hints, system23 + question23, the sequence graders of Study 34
with Study 35's class rule (roots < 80 % confidently-wrong; roots ≥ 90 %
and qualities ≥ 80 % good; else saved-below-threshold), plus Study 37's
merged bar count. No harmonic-rhythm correction (Study 37 C). A bar
half the written length is accepted as read (Study 37 D). The title is
a neutral phrase; nothing from the truth reaches the prompt.

## Arms and truth (corpus/study38-manifest.json, scripts/build-study38-manifest.py)

A. Ten modern songs with artist-chart truth (Josh Woodward, CC BY 4.0;
   Studies 34/35 truth files, transpositions as calibrated there),
   drafted once on madmom's bars from results/study36-trackers.json.
   Baselines: the Study 34/35 drafts at the DECLARED grid (18/21,
   15/18, 16/26, 26/42, 49/53, 28/30, 15/15, 28/28, 43/43, 28/33).
   Known from Study 36 (public, $0): madmom's bar is strict on seven,
   half on im-letting-go, double on goodbye-to-spring, and three
   dotted quarters on my-favorite-regret (a 3/2 ratio, not a fold).
B. GuitarSet v1.1.0 (CC BY 4.0, Zenodo 3371780): the 36
   singer-songwriter comping excerpts (6 lead sheets × 6 players, about
   42 s each, solo acoustic guitar on the reference microphone, played
   to a backing track the recording does not contain). Truth = the
   instructed chord annotation (the lead sheet the player was given),
   as the ordered chord sequence (src/study38/truth.ts: Harte → house
   symbols, no-chord dropped, identical neighbours merged). Drafted
   twice: on the ANNOTATED bars (oracle grid: the chord-reading
   ceiling) and on madmom's bars (the automatic chart). Tempo and key
   are in the file name and are used only for grading.
C. Schubert Winterreise Dataset v2.1 (CC BY 3.0, Zenodo 3968389), the
   SC06 performance (Scarlata/Denk, 24 songs, voice and piano, free
   tempo). Truth = ann_audio_chord for SC06 as the ordered chord
   sequence; bars = ann_audio_measure. Drafted once on madmom's bars.
   The $0 metrical arm (scripts/run-study38-metrical.ts) grades madmom
   and Beat This bars against the annotated measures on B and C: bar
   period strict/folded, downbeat F at 70 ms, bar-count ratio.

Chord truth in B and C is a SEQUENCE (every chord in order), while a
draft carries one chord per bar; where the truth changes chord inside a
bar the draft can at best catch one of them, so sequence roots on dense
material are bounded below 100 %. This is the same convention as
Studies 34/35 and is kept for comparability; the bound is reported from
the truth itself (chords per bar) beside each score.

## Predictions

A1. At least eight of the ten modern drafts grade within two roots of
    their declared-grid baseline or above.
A2. gravity ≥ 80 % roots on madmom's three-beat bar (which Study 36
    showed is the true dotted-quarter bar); my-favorite-regret grades
    more than two roots BELOW its Study 37 adapter draft (40/42),
    because a bar of three dotted quarters misaligns every other bar.
A3. goodbye-to-spring stays good (≥ 90 % roots) at madmom's double
    bar: merging in the coarser direction loses only chords that
    change every written bar.
A4. At most one modern draft is confidently-wrong.
B1. On the annotated (oracle) grid, mean roots over the 36 excerpts
    ≥ 85 %, and at least 24 of 36 grade good.
B2. On madmom's grid the mean roots are within 10 points of the oracle
    grid's.
B3. madmom's bar is strict on ≥ 60 % of the 36 solo-guitar excerpts
    and folded on ≥ 85 %; Beat This within 10 points of madmom on
    both.
B4. Median downbeat F (70 ms) ≥ 0.6 for madmom on arm B.
C1. On the free-tempo songs madmom's downbeat F median ≥ 0.5 and its
    bar count is within 10 % of the annotated measures on ≥ 16 of 24.
C2. Median roots ≥ 70 % over the 24 drafts, with at least 6 of 24
    good; the lower bound from chords-per-bar explains the shortfall
    on the rest (reported, not scored).
C3. No Winterreise draft is refused; at most 6 are confidently-wrong.
C4. Beat This's downbeat F median on arm C is below madmom's (the DBN
    follows rubato; peak-picking does not).

## Decision rules

S38-D1. If A1 and A4 hold, stem-shovel's automatic mode is specified as
  "tracker's bar as read, shorter bar preferred, no refusal on tempo
  confidence", and the Study 35 confidence refusal is retired.
S38-D2. If B2 holds (tracker grid within 10 points of the oracle on
  solo guitar), the chord reader, not the bar, is the next target on
  acoustic material; if it fails, the tracker on drumless audio is.
S38-D3. If C1 and C2 hold, the free-tempo demo path is specified as
  the same pipeline with no fixed period; if C1 fails, Study 39 is a
  tracker comparison on free-tempo material before any more drafts.

## Disclosures

- Spend: about 106 drafts; estimated $0.09 per modern song, $0.02 per
  GuitarSet excerpt, $0.15 per Winterreise song, about $6 in all;
  fence $8.
- Arm B's audio is solo guitar played to a backing track the player
  heard but the microphone did not record: steady tempo with human
  timing, not a drum kit. It is the acoustic-guitar proxy, not the demo
  corpus.
- Arm C is classical lieder, not the target genre; it is the only
  voice-plus-accompaniment free-tempo material with chord truth the
  search found. LICENSE: the dataset's annotations are CC BY 3.0, but
  the SC06 audio itself carries CC BY-NC-ND 3.0
  (03_ExtraMaterial/license_SC06.txt, read after download; the Zenodo
  page states only the dataset license). It is used unmodified, for
  measurement only, never redistributed, never committed, and never
  named on the public dashboard beyond the dataset's own citation; it
  does not meet the program's CC BY convention and is disclosed as
  such. The dataset's other included performance, HU33 (Hüsch, 1933,
  Public Domain Mark 1.0), is added to the $0 metrical arm (arm
  C-metrical: trackers against the annotated measures, no drafts) so
  the free-tempo bar result rests on rights-clear audio too.
- Where annotations give bar lines (B, C) the runner also reports a
  secondary score against the per-bar truth (the chord sounding at
  each annotated bar start, neighbours merged); it is reported beside
  the registered sequence score and does not enter any prediction.
- Beat This is run on B and C for the metrical arm only ($0); drafts
  are on madmom's bars per the Study 36 decision.
- Study 36's per-song madmom readings on arm A were public when A1 to
  A4 were written.
- Temperature 0 is requested and ignored by the gateway on this model
  family (standing disclosure).
- If the Winterreise annotation format differs from the builder's
  assumptions (semicolon CSV with start, end, shorthand columns), the
  builder is corrected before the registration commit and the
  correction noted here; no score depends on it.
