# Proposal: breaking the automatic-mode barrier on tempo and meter

Written 2026-11-10 at Kevin's request after Study 35. Goal: a fully
automatic chart (no visitor-typed tempo or meter) rather than the
assisted tool Study 35 showed to be nearly shippable. This is a
proposal for studies, not a registration; nothing here is run yet.

## 1. Where the program actually stands on this

The whole metrical front end of the production pipeline, as ported in
src/study11b/analysis200.ts, is two autocorrelation reads of one onset
envelope:

- **Tempo**: a comb over the onset envelope with a rung ladder (×2,
  ×1.5, ×3) and a subdivision guess. Study 35 automatic mode: wrong on
  8 of 10 modern recordings. Four of those eight are exact halvings
  (california-lullabye 88 for 176, swansong 85 for 170, cherubs 82.5
  for 165, goodbye-to-spring 120 for 240); one is "right in eighths"
  (gravity 145.9 ≈ 3 × 48 dotted quarters); three are odd ratios.
- **Meter**: `meterLean`, the autocorrelation at lags of 3 and 6 beats
  minus lags of 4 and 8 beats, with a 4/4 prior (3/4 needs lean >
  0.03) and 6/8 emitted only when the beat subdivides in three. It
  inherits the tempo, so a wrong octave makes the meter read nonsense;
  Study 34b found its confidence non-separating.
- **Downbeat**: the 31c/32 witness vote (time-zero lead, harmonic
  change at bar lines, section boundaries), which works well when the
  bar length is right and cannot help when it is not.

Nothing in that stack is learned, nothing uses harmony or bass for
the period, and nothing has ever been compared against the field.
That last point is the opportunity: joint beat/downbeat tracking is a
decade-deep, well-benchmarked MIR problem with MIT-licensed models
that run in a browser, and the bench has never run one.

## 2. The reframing that matters

The product does not need "the tempo". It needs the **bar**: a bar
period, a downbeat phase, and a grouping (3, 4, or 2 dotted beats).
Three consequences:

1. **Octave errors are partly a labeling convention, not a hearing
   error.** The field has measured this for twenty years: tempo
   estimators score roughly 0.76–0.80 strict (Accuracy1) and 0.89–0.91
   when factor-2/3 errors are forgiven (Accuracy2); human listeners
   split the same way on the same tracks. goodbye-to-spring at a
   declared 240 is a legitimate double-time reading of 120. The
   automatic system should target the bar period at the metrical
   level that makes a good chart, not match a label.
2. **The finer grid is the safe grid.** Under the program's own
   graders a chart drafted at half the true bar length loses nothing
   (repeated chords collapse away), while a chart drafted at double
   the bar length loses every alternating chord irrecoverably. That
   asymmetry is already visible in the data: the two 6/8 failures were
   3× too long. So when hypotheses tie, prefer the shorter bar and
   merge identical neighbors afterwards. This is a policy, costs
   nothing, and has never been registered.
3. **Downbeat tracking subsumes meter.** Count beats between tracked
   downbeats and the meter falls out, including compound meter as
   "six beats grouped in twos". No separate meter classifier needed.

## 3. Techniques, ranked by expected payoff per dollar

### Tier 1: run the field's trackers (all $0 in model spend)

**A. Neural joint beat/downbeat tracking bake-off.** Candidates:

- *Beat This!* (Foscarin, Schlüter, Widmer, ISMIR 2024; CPJKU,
  MIT-licensed code and weights). Transformer, outputs beat and
  downbeat logits at 50 fps, no DBN required. Trained on 16 datasets
  including solo instruments, time-signature changes and classical
  with high tempo variation. Variants: `final` (~78 MB) and `small`
  (~8 MB). Multiple community ONNX exports exist, including one
  wired to onnxruntime-web on WebGPU (WASM also works, ~12× slower):
  input 22050 Hz mono → 128-mel log spectrogram, 1500-frame (30 s)
  windows, overlap-aggregated. This is the same deployment shape as
  Basic Pitch in the browser today. A 2025 follow-up (arXiv
  2510.14391, latent grid points with downbeat/beat/none classes)
  improves downbeat continuity by 3.6 points and makes "a downbeat
  is a beat" hold by construction.
- *madmom* RNN + DBN (Böck, Krebs, Widmer, ISMIR 2016): the
  reference DBN; `beats_per_bar=[3,4]` selects meter jointly with
  beats; still the postprocessor other systems borrow.
- *BeatNet* (Heydari, ISMIR 2021; CC-BY-4.0): CRNN + particle filter,
  advertises joint beat, downbeat, tempo and meter; online-capable.
- *Beat Transformer* (Zhao, Xia, Wang, ISMIR 2022) and *All-In-One*
  (Kim & Nam, WASPAA 2023): both take demixed (source-separated)
  spectrograms and report gains from it; All-In-One also emits
  section boundaries and labels, which the pipeline draws today from
  chroma.

Corpus: the 25-recording union (Study 34's fifteen plus Study 35's
ten), which already carries bar-level truth: JAAH beats and downbeats
for the three jazz 78s, the 34b declared values for the rest of the
acoustic-era set, and the artist's declared tempo and meter for the
ten modern songs (converted to bar seconds with the dotted-quarter
convention for 6/8). Grading is mechanical and registered: bar period
within 4 % (strict) and octave-folded; downbeat phase within half a
beat where time truth exists; meter class (3 / 4 / compound); and for
the two unevenly cut 78s, tracked bar count against truth, since a
tracker is tempo-following by construction and arm D already showed
that recovers livery (112/125 roots).

Registered prediction to be wrong about: Beat This! gets the bar
period octave-folded within 4 % on at least 9 of 10 modern songs and
the strict bar on at least 7; meter right on at least 8 of 10; on the
acoustic-era set it does better than the production detector but
still fails the hymn and the waltz (see the ceiling in §4).

**B. The Josh Woodward census.** The artist's sitemap lists about
262 song pages, each stating tempo, key and meter, all CC BY 4.0,
most with a chord chart. That is a 250-song, rights-clear, labeled
tempo-and-meter corpus the bench can grade for $0 in model spend
(detection is DSP or local inference), and it is 25× the size of
anything the program has measured. Run the production detector and
the Tier-1 trackers over all of it. Three readings fall out: (i) the
out-of-sample accuracy of each system on modern material; (ii) the
**metrical-convention census** — how often the artist's declared
tempo is 2×, ½× or 3× what any tracker says, which tells the product
how to interpret and label tempo, not just how to detect it; (iii)
confidence calibration on a sample large enough to mean something
(Study 34b's 0.84 came from fifteen recordings and inverted on the
next ten). Limits: one artist's production style; declared tempos
may be rounded; 6/8 units as learned in Study 35.

### Tier 2: harmony as a meter witness (the pipeline's own asset)

**C. Harmonic-rhythm period selection.** The literature has used
harmony for downbeats for fifteen years (Papadopoulos & Peeters,
IEEE TASLP 2011, joint chords-and-downbeats HMM on the Beatles;
Durand, Bello, David & Richard, TASLP 2017, a chroma CNN tuned to
"instantaneous harmonic change around downbeats" as one of four
feature streams, 16.8 points over the next system). The pipeline
already computes beat-level chroma and already votes downbeat phase
from harmonic change (w4). Extend the same witness from phase to
**period**: for each candidate bar length on the comb's rung ladder ×
grouping {3, 4, 6}, score within-bar chroma stability against
across-bar change and chord-change alignment to bar lines, with a
harmonic-rhythm prior (most bars in popular music carry one or two
chords). Pure TypeScript, no model, in-browser today. Known blind
spot: a one-chord vamp gives no signal, so it is a witness to combine
with A, not a replacement. Registered prediction: C alone resolves
the four Study 35 halvings and neither 6/8 unit error (those need the
dotted-quarter convention, which C can only see if 6 is a candidate).

**D. The collapse-safe octave policy.** Register the "prefer the
shorter bar, merge identical neighbors" rule from §2 and test it
where it costs money: re-draft the Study 35 near-misses and the two
6/8 slots at the next finer grid (≈5 drafts, ≈$0.50) and grade both
ways. Also measure the readability cost: how many bars the merged
chart carries versus the artist's chart.

### Tier 3: signals the program has not used

**E. Band-split percussive accent patterns.** On band recordings the
strongest meter cue is the drum pattern (kick on 1 and 3, snare on 2
and 4; 3/4 and 6/8 accent differently). Take the percussive component
(Study 33's HPSS exists), split kick and snare bands, autocorrelate
each at bar multiples and read the accent asymmetry. Classic
(Klapuri et al. 2006 three-level metrical analysis; Gouyon &
Herrera duple/triple classification). Cheap DSP; useless on
acoustic-era material with no drums, which is the same blind spot
the field reports.

**F. A perceptual tempo-octave prior.** Schreiber & Müller (ICASSP
2014) showed a single global feature, mean spectral novelty over a
3.8 s kernel, predicts slow-versus-fast at 85 % and resolves the
octave of a standard pulse detector to parity with the best systems
(the rule: double or halve the pulse until it lands within 0.75–1.5×
the rough perceptual estimate). Later single-step CNNs (TempoCNN
2018, MGANet 2021) do this end to end. Test as an octave corrector on
the Study 35 halvings with goodbye-to-spring as the registered
counter-case (a 240 that a perceptual prior will call 120, and
should: see §2).

**G. Multi-hypothesis, late binding.** Do not commit to one grid
before the model. Carry the top two metrical hypotheses through hints
($0: hints are nchord, not the model) and let a mechanical criterion
(C) pick; the 2026 SMC failure analysis names multi-hypothesis tempo
as the field's priority too. Exploratory variant with small spend:
the draft model as metrical judge, shown both segmentations of a 30 s
excerpt. LLMs are weak at rhythm from symbolic input; register that
as the prediction and let the data say.

### Tier 4: adjacent to meter, needed for "any song"

**H. Source separation front end.** Beat Transformer and All-In-One
both report gains from demixed input; the SMC paper recommends
drum-removed training to force non-percussive cues. Demucs-class
separation is server-side only and Study 33 showed cheap HPSS is
not worth it for harmony, so this ranks below A for modern material.

**I. Neural chord recognition as primary harmonic evidence on thin
audio.** The starved-transcription wall (1.3–2.2 notes per bar) is not
a meter problem but it is the other half of "any song". ChordMini
(MIT) has a third-party ONNX export running in-browser on WebGPU;
madmom ships CNN chord features and a CRF decoder; Chordino's NNLS
chroma is the classic. ChordMiniApp pairs Beat Transformer with a
Chord-CNN-LSTM, which makes it an external yardstick: a bake-off of
"an existing open pipeline on our corpora" would tell us whether the
gap is ours or the field's.

**Resource note.** Meter2800 (Abimbola, Kostrzewa, Kasprowski, Data
in Brief 2023, CC0 labels) is 2,800 clips labeled 3/4, 4/4 and a
4-class variant with 5 and 7; a 2024 ResNet18 is the published
baseline. Its audio is drawn from GTZAN, FMA and others, so bench use
needs a rights pass on the audio even though the labels are CC0.

## 4. The honest ceiling

The field has not solved fully automatic beat tracking on hard
material either. "The SMC Blind Spot" (arXiv 2605.12287, 2026)
analyzes Beat This! on the 217-excerpt SMC set, chosen to be
rhythmically hard: F = 0.627 overall against 0.8+ on standard sets;
29 % good, 8 % octave errors, 18 % continuity errors, 5 % total
failures, 41 % moderate degradation. Weak beat cues (no drums,
expressive timing) dominate and the paper locates the bottleneck in
the network's activations, not the DBN: substituting ground-truth
activations lifts F from 0.585 to 0.924. That is our acoustic-era
wall described by someone else, and it says the hymn and the waltz
will not be rescued by swapping trackers. It also says the gap
between our detector (2 of 10 modern tempos right) and the field
(downbeat F around 0.8–0.9 on modern sets) is large and ours to
close.

## 5. Proposed sequence

- **Study 36 ($0 model spend): A + B.** Tracker bake-off on the
  25-recording union with bar-level grading, plus the Josh Woodward
  census over the full catalog. Compute only; the heaviest cost is
  installing PyTorch CPU in the study venv and fetching ~250 MP3s
  (never committed, hashes only, as in Study 35). Deliverables: a
  per-system bar-period/downbeat/meter table, the metrical-convention
  census, and a shipping recommendation with the browser ONNX path
  spelled out.
- **Study 37 ($0 then ≈$0.50): C + D.** The harmonic-rhythm period
  witness and the collapse-safe policy, registered against the same
  corpus; the half-dollar is the finer-grid re-drafts.
- **Study 38 (≈$1): automatic mode re-run.** Re-draft the Study 34 and
  35 corpora under the best automatic grid from 36/37, under the
  app's S35 gates unchanged, and report automatic mode's class table
  beside declared mode's. This is the study that answers Kevin's
  question with a number.
- Tier 3 and 4 items register afterwards as the data points.

## Sources

- Beat This!: https://github.com/CPJKU/beat_this ; paper
  https://arxiv.org/abs/2407.21658 ; browser ONNX
  https://huggingface.co/musetric/beat-this-onnx ; small ONNX
  https://github.com/perminder-klair/subwave/releases/tag/beat-this-small0-v1
- Latent grid-point follow-up: https://arxiv.org/abs/2510.14391
- SMC Blind Spot failure analysis: https://arxiv.org/abs/2605.12287
- madmom downbeats: https://madmom.readthedocs.io/en/v0.16/modules/features/downbeats.html
- BeatNet: https://github.com/mjhydri/BeatNet ; BeatNet+:
  https://transactions.ismir.net/articles/10.5334/tismir.198
- Beat Transformer: https://arxiv.org/abs/2209.07140 ; All-In-One:
  https://arxiv.org/abs/2307.16425
- Papadopoulos & Peeters 2011: https://hal.archives-ouvertes.fr/hal-00525172
- Durand et al. 2017: https://arxiv.org/abs/1605.08396
- Schreiber & Müller 2014 tempo octave:
  https://www.audiolabs-erlangen.com/content/05_fau/professor/00_mueller/03_publications/2014_SchreiberMueller_TempoEstimation_ICASSP.pdf
- Tempo Accuracy1/Accuracy2 reports: https://tempoeval.github.io/tempo_eval_report/giantsteps_tempo.html ;
  MGANet https://arxiv.org/abs/2109.01607
- Meter2800: https://www.sciencedirect.com/science/article/pii/S2352340923008053 ;
  ResNet18 baseline https://link.springer.com/article/10.1186/s13636-024-00346-6
- ChordMini browser export: https://huggingface.co/musetric/chordmini-onnx
- Essentia.js (RhythmExtractor2013, TempoCNN in WASM/TF.js): https://mtg.github.io/essentia.js/docs/api
