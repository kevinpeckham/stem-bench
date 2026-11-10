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

## Results (2026-11-10, registration 62c3d63; 106 drafts, $3.84 of the $8 fence)

### Arm A: the fully automatic chart lands on all ten modern songs

madmom's bar as read, its tempo and beats per bar, the detector's key,
nothing typed. Roots (sequence, Study 34/35 graders) against the
declared-grid baselines:

| song | madmom read | automatic | baseline (declared grid) |
|---|---|---|---|
| let-it-in | 120, 4 | 18/21, saved-below-threshold | 18/21, saved-below-threshold |
| same-boat | 92, 4 | 16/18, saved-below-threshold | 15/18, saved-below-threshold |
| gravity (6/8) | 73, 3 (the dotted-quarter bar) | 24/26, good | 16/26, confidently-wrong |
| my-favorite-regret (6/8) | 65, 3 | 40/42, good | 26/42, confidently-wrong |
| california-lullabye | 176, 4 | 48/53, good | 49/53, good |
| swansong | 171, 4 | 29/30, good | 28/30, good |
| afterglow | 98, 4 | 15/15, good | 15/15, good |
| cherubs | 167, 4 | 28/28, good | 28/28, good |
| goodbye-to-spring | 120, 4 (double bar) | 43/43, good | 43/43, good |
| im-letting-go | 150, 4 (half bar) | 33/33, good | 28/33, saved-below-threshold |

Ten of ten within two roots of the baseline or above (eight above or
equal, two one root under); eight good; none confidently-wrong. The two
6/8 songs that Study 35 charted three bars long per bar are good with
no meter typed, because madmom's three-beat bar at the dotted quarter
IS the bar. my-favorite-regret's tracker bar did not misalign as A2
feared: 2.77 s is three dotted quarters, but the song's phrases are six
dotted quarters long, so every other tracker bar line is a true bar
line and the chords change there. Merged charts are 44 to 89 bars.

Predictions: A1 right (10 of 10); A2 half right (gravity 92 %; the
my-favorite-regret clause wrong, 40/42 equals the Study 37 adapter
draft); A3 right (goodbye-to-spring 43/43 at the double bar); A4 right
(none). S38-D1 FIRES: stem-shovel's automatic mode is specified as the
tracker's bar as read, shorter bar preferred, no confidence refusal.

### Arm B: on solo acoustic guitar the bar is nearly free and the reader is the remaining cost

36 GuitarSet singer-songwriter comping excerpts, truth the player's lead
sheet. Oracle grid (annotated bars): 35 graded, mean roots 99.0 %,
median 100 %, qualities 89 %, 28 good, 7 saved-below-threshold, none
wrong. madmom's grid: 32 graded, mean roots 96.1 %, median 100 %,
qualities 86 %, 24 good, 5 saved-below-threshold, 3 confidently-wrong.
Paired over the 32 excerpts graded on both grids: madmom minus oracle
−2.9 points mean; worse on 9, equal on 21, better on 1. All three
confidently-wrong drafts are one lead sheet (SS2-107-Ab, 14 chords in
16 bars, two per bar in places), and on one of the three madmom's bar
was a half bar.

Metrical ($0): madmom's bar strict on 22 of 36 (61 %), folded on 36
(the 14 misses are all half bars), downbeat F median 0.69, bar count
within 10 % on 22. Beat This final0: strict 31 of 36 (86 %), folded 35,
downbeat F median 0.97, within 10 % on 29. Without drums, Beat This's
downbeats are the better bar lines by a wide margin.

Five answers (one on the oracle grid, four on madmom's) came back from
the gateway empty or cut off mid-JSON and are recorded as "refused" per
the pipeline (no retry fires on an empty text). They are excluded from
the means above and disclosed here; an exploratory re-draft of the five
is reported below and does not enter any prediction.

Predictions: B1 right (99 %, 28 good); B2 right (2.9 points under the
oracle); B3 half right (madmom 61 % strict and 100 % folded as
predicted; the "Beat This within 10 points" clause wrong because Beat
This is 25 points BETTER); B4 right (0.69). S38-D2 FIRES: on acoustic
material the chord reader (qualities 86 to 89 %, sevenths the sheet does
not name) is the next target, not the bar.

### Arm C: free tempo defeats madmom's bar and the one-chord-per-bar chart

24 Winterreise songs (SC06), truth the audio-time chord annotation.
Every draft confidently-wrong: roots median 41 % (mean 41 %) against the
chord sequence, 67 % against the per-bar truth (the chord sounding at
each annotated bar start). Best 49/65, 37/57, 26/44. No draft refused.
The material changes chord 1.5 times per tracker bar (median; 74
published chords against 53 drafted bars), so a one-chord-per-bar chart
is bounded near 50 % on the sequence truth before any error, and the
remaining third against the per-bar truth is the bar itself:

Metrical ($0), SC06: madmom bar strict 8 of 24, folded 13, downbeat F
median 0.39, F ≥ 0.6 on 8, bar count within 10 % on 12. Beat This:
strict 3, folded 10, downbeat F median 0.68, F ≥ 0.6 on 17, bar count
within 10 % on 1 (it emits bars at half the written length on most
songs, so its downbeats are right and its bar count is double). HU33
(1933, public domain, trackers only): madmom F 0.38, Beat This 0.61,
the same picture on a different recording of the same music.

Predictions: C1 wrong (0.39, 12 of 24); C2 wrong (41 %, none good); C3
half right (none refused; 24 confidently-wrong, not ≤ 6); C4 wrong, and
reversed: Beat This follows the rubato (0.68) and madmom's DBN, built
for steady tempo, does not (0.39). S38-D3: C1 fails, so Study 39 is a
tracker comparison on free-tempo material before any more drafts, with
Beat This's downbeats at the written bar as the lead and a chart format
that carries two chords per bar as the second question.

### What Study 38 settles

A visitor who uploads a modern recording and types nothing gets a chart
at least as good as one who types the artist's own tempo and meter; the
compound-meter failure is gone with it. On solo acoustic guitar at a
steady tempo the same pipeline is within three points of a perfect
grid. On free-tempo material neither the bar nor the one-chord-per-bar
format survives, and the tracker that follows rubato is not the one
that won on modern songs.

### Disclosures added at results time

- The SC06 audio license (CC BY-NC-ND 3.0) was read after download and
  is disclosed above; the HU33 public-domain performance was added to
  the metrical arm before the registration commit for that reason.
- The five empty gateway answers are a pipeline failure mode the
  registration did not anticipate; "refused" is the pipeline's label
  for them and is kept.

### Exploratory addendum: the five empty answers (unregistered, $0.07)

Re-drafting the five slots once more with the finish reason recorded:
two returned a chart (one good, 6/6; one confidently-wrong, 11/14, the
same dense lead sheet as the registered three) and three came back
empty again with finish reason `content-filter`. The empty answers are
therefore not transport failures but the gateway's content filter
stopping the response on three particular guitar excerpts (two players
on SS1-100-C#, one on SS1-68-E), reproducibly. Nothing in those prompts
differs in kind from the 67 that passed; the input is note lists and
chord hints. The registered results stand as labelled ("refused");
production needs to treat a content-filter stop on a chart draft as a
retryable, visible outcome rather than a silent empty chart.
