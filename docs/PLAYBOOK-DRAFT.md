# A music app builder's playbook (draft)

**Analyst synthesis, 2026-10-29 — not a registered study.** This
document interprets; the registered numbers live in REPORT.md and the
cited literature in docs/LANDSCAPE-2026-10-29.md (source keys [A*],
[M*], [P*] refer to its bibliography). Written after Studies 1–10
including the MMKK real-recordings amendment.

## 1. The capability map

Three families of tools analyze music today, and after eleven studies
the clearest finding is that they fail differently — the failure MODE
matters more to a product than the failure rate.

### LLMs

**What they do at or near ceiling:**

- **Read music as text or image.** Chord recall 98.8 % from engraved
  PNGs (Study 3), 99.3 % from clean PDFs (Study 5 correction), 100 %
  section detection with a marked chart (Study 8). Independently:
  near-perfect chord quality from MIDI, a "clear perceptual gap" from
  audio (Carone et al. [A5]).
- **Follow textual evidence with extreme fidelity** — which is a
  capability and a hazard at once. The program's recurring law, "text
  beats instruction," appeared in four costumes (hint beats notes,
  Study 1; provider beats off-switch, Study 2; candidates beat audio,
  Study 4; fact line beats instruction, Study 7: settings echoed
  47/47). The literature found the same thing independently: MM-SHAP
  attribution shows accuracy leaning on text [A9]; DEAF: predictions
  "predominantly driven by textual inputs" [A10]; models side with a
  user's claim against the audio [A11].
- **Hear coarse texture.** Arrangement-contrast boundaries 7–8/8 blind
  (Study 8) — the program's one genuine listening result. Real-music
  coarse structure is actually decent: Gemini 2.5 Pro hits 0.813
  within 3 s on HarmonixSet, better than the specialist SongFormer —
  but only 0.423 within 0.5 s against the specialist's 0.70 [A6].
  Instruments and mood, similarly: 76–91 % instrument sets [A2].
- **Reason over symbols someone else produced** (Roman numerals over
  chord labels [P3], key from a chord sequence as text [P8]).

**What they cannot do, with numbers:**

- **Hear tempo, beat, pitch or key.** Study 4 blind: 1–2/12 at
  confidence 1.0 — a genre prior, not a measurement. CMI-Bench: best
  open audio-LLM key score 9.5 vs a specialist's 74.3; best beat
  F-measure 23.7 vs 88.3, most under 5 [A1]. Stem isolation does not
  help (Study 9 Q4: hurt twice, helped nowhere); spectrogram images do
  not either (no published evidence of pitch/key/structure from
  spectrograms [A14] — we dropped that arm on the review's evidence).
- **Fine timing.** Gemini's audio path is 32 tokens/second with
  documented drift to −16 s over 12 minutes [P23][P18]. Mechanically
  incapable of beat-accurate placement; anchor to bars or align
  elsewhere.
- **Know when they don't know.** Confidence 1.0 on wrong blind answers
  (Study 4); 3–6 invented boundaries per uniform loop (Study 8); the
  chart's SILENCE does not beat the form prior (~1 invention per loop
  even chart-anchored).
- **Judge raw numbers.** ≈ 60–65 % as a judge of MIR output [A13].

**Failure mode: confident, plausible, text-anchored.** An LLM's wrong
answer arrives in fluent prose at full confidence, often echoing
whatever text was nearby. This is the worst failure shape a product
can ship, and it is why every production system we found — Cyanite,
ChordMini's app, StemSense, Logic Pro 12 [P1–P8] — keeps the LLM away
from the signal and lets it reason over labels.

### Neural MIR models

**What they do better than everything else:**

- **Per-beat grids.** Beat This! small: beat F 0.892 at ±70 ms on our
  bench, 89–96 published [M1] — a capability DSP autocorrelation
  simply does not have (it produces one scalar).
- **Real-music structure.** LinkSeg found 29/33 of the band's declared
  boundaries at ±4 s on real recordings (one song 8/9 with zero false
  boundaries), where our grid-anchored activity detector collapsed.
- **Graceful degradation.** On real songs the trained tracker's misses
  were small (214.3 vs a declared 224) where DSP failed in gross
  classes (exactly half, exactly 2/3). Trained models also carry an
  honest null: near-silence on pulseless material.
- **Deployable sizes.** 1.5–17 MB ONNX, phone-WebGPU latencies [M13–16].

**What they cannot do:**

- **Survive out-of-domain input.** LinkSeg invented 54 boundaries on
  22 structureless synthetic songs — the loop-invention disease is not
  cured by graph attention. ChordMini collapsed to 4/28 on one
  synthetic song it misread wholesale, and lost extended chords
  in-domain to a tuned template matcher (38/64 vs 59/64).
- **Exact values.** Frame-grid tempo quantization (142.9 for a true
  140); 6/8 named correctly on 1 of 4 compound-meter items.

**Failure mode: the domain cliff.** Excellent inside the training
distribution, silently catastrophic outside it, with no visible edge.
You cannot enumerate a neural model's failure classes in advance; you
can only test your actual material.

### Plain code (DSP, templates, parsers)

**What it does better than expected:**

- Production's summed-envelope autocorrelation was exact 29/33 at
  ±1 bpm and survived every deliberately misleading stem (Study 9);
  the sharpest-single-stem "improvement" lost 18 points — cross-stem
  reinforcement IS the tempo signal.
- Krumhansl–Kessler templates beat BOTH literature profile sets on
  real recordings, 4/6 vs 1/6 each (Study 10 amendment) — fifty-year-
  old psychology outperforming corpus-derived numbers because the
  bass-tiebreak pipeline was tuned around it.
- The Basic Pitch + template matcher read 483/504 bars full-vocabulary
  against ChordMini's 418 — on material it was tuned for.
- Zero bytes of weights, ~1 s per 90 s of audio, fully auditable, and
  improvable by a one-line finding (Study 1's missing-tone penalty:
  matcher 90.5 % → 96.4 % within hours of the brief).

**What it cannot do:** escape its failure classes. The 3:2
dotted-pulse confusion and half-time errors appeared on synthetic 6/8
AND on real recordings (exactly half of a declared 224, exactly 2/3
of a declared 145). No null path (it always answers, even on a
pulseless pad). No per-beat grid. No real-music structure.

**Failure mode: class-shaped and enumerable — the best kind.** You
can name DSP's failures in advance (octave family, 3:2 family,
relative-key family), which means you can guard them with cheap
verifiers, UI hedges, or a second opinion. Engineering can work with
this; it cannot work with a cliff.

## 2. The division of labor that survived eleven studies

1. **Signal → code or specialist models; symbols → LLM; never swap.**
   Every production system the landscape pass found converged on this
   independently [P1–P8].
2. **Parse, don't ask.** Anything mechanically extractable from text
   (tempo marks, section names, counts, keys-in-force) must be parsed;
   the model is asked only for what text cannot supply — and even then,
   prefer anchoring to bars over asking for seconds.
3. **Every datum handed to a model carries its scope and provenance.**
   A fact line without a scope label becomes the answer (Study 7;
   StemSense's case study found the same [P4]).
4. **Curate the model's text like an attack surface.** Models defer to
   text over audio AND over instructions; a wrong fact in context is
   functionally an injection (Studies 1/2/4/7; [A10][A11]).
5. **Confidence must come from a mechanism, never from the model — and
   mechanisms need validation too.** The LLM's confidence 1.0 was
   fiction; but so was our own per-stem agreement score, which gave its
   maximum to the study's only wrong key answer (Study 9). Production's
   correlation margin, which ranked that answer 3rd-lowest, earned its
   place by construction.
6. **Prefer enumerable failure classes at equal accuracy.** A guarded
   DSP beats an unguarded neural model that scores the same, because
   the guard is writable. (And validate the guard: our registered
   octave-disagreement flag fired on 10/21 items including clean ones —
   a hazard signal that fires on normal music is not a signal.)
7. **Test both domains, always.** The synthetic corpus flattered
   templates; real recordings flattered the trained models; neither arm
   alone told the truth (Study 10's two-arm flip, predicted by the
   review's "synthesized pop is kind to template methods" warning).
8. **Ship null paths.** The detector that cannot say "I can't tell"
   will confidently label silence (production's forced tempo on
   pulseless pads vs Beat This!'s honest near-silence).
9. **Validate rules on data they were not designed on** (Study 6 → 6b:
   the key-in-force warning passed 48 unseen reads only after its
   author refused to trust the designed-on-data version).
10. **Mechanical graders and registered gates, even internally.** Half
    this program's value came from gates failing by letter in
    instructive ways; a benchmark that can't embarrass you can't
    inform you.

## 3. Opportunity gaps (where everyone fails)

- **The 3:2 / compound-meter family.** DSP reads 6/8 at 1.5×, Beat
  This! tracks eighths and votes 4/4, LLMs hear nothing. The octave
  problem has a name in the literature [A19]; the 3:2 problem is its
  neglected sibling. Plausibly a representation gap, not a model gap:
  **tempo-as-scalar is the wrong API.** A grid of beat times plus a
  (pulse, subdivision, grouping) tuple makes "120 vs 240 vs 80" a
  display choice instead of an error class. Nobody ships this.
- **Calibrated confidence, anywhere.** LLM confidence is fiction,
  neural logits are uncalibrated off-domain, DSP margins are
  heuristic. A detector that outputs "60 % it's 112, 40 % it's 224"
  would change product UX more than 5 points of accuracy. Open gap
  across the entire field.
- **"Is there structure at all?"** Every structure detector — LLM,
  LinkSeg, our activity detector — invents form on structureless
  material rather than returning "none." A null-structure gate is
  trivial to pose and absent from the literature.
- **Stem-native models.** Everything published trains on mixes or
  Demucs output; true no-bleed stems are better input and essentially
  unstudied ([M18–M21] show demixed input helps; nobody has clean-stem
  training data at scale). Platforms that hold true stems are sitting
  on the field's scarcest training asset.
- **Extended-chord recognition on clean sources.** The field plateaued
  at 80–83 maj-min WCSR [M9]; sevenths lag ~15 points behind. The one
  published fix that works is hybrid: stems + chord model + LLM
  consistency pass over symbols, sevenths 67.2 → 74.6 [A16].
- **An open-license DBN.** madmom's Böck-style DBN post-processing is
  the standard that would fix exactly the beat-seam noise and meter
  votes we measured — and its pretrained models are CC BY-NC-SA. It is
  "just" an HMM; an MIT implementation would unlock the whole category
  for commercial browser apps.

## 4. What we might still be missing

**Categories that exist and we have not tested:**

- **Score-to-audio alignment.** Possibly our biggest practical miss.
  Chroma-DTW alignment (Müller's synctoolbox lineage) is mature,
  classical, open — and it answers exactly the question Study 8
  concluded the model should answer ("where, in seconds, does the
  chart's section start?") with no model at all. Chart names + DTW
  placement could replace chart names + model placement. A Study 11
  candidate with a clear ship path.
- **Self-supervised music embeddings + tiny probes.** MERT, CLAP and
  kin, with small trained heads over bench truth. Sits between "plain
  NN" and "LLM"; strong published MIR-probe results; server-side cheap
  though not browser-trivial. Untested here — partly because it needs
  training data, which the synthetic bench could generate without
  licensing pain.
- **The LLM as consistency checker over detected symbols** — the
  ISMIR 2025 shape (detect chords/key/beats mechanically, let the
  model reconcile them as TEXT, +1–3 MIREX, sevenths +7 [A16]). This
  is the one place the literature shows an LLM IMPROVING hearing, and
  it works precisely because the model never touches audio. The
  drafted Study 11.
- **Agentic tool orchestration** (AudioToolAgent [A20]): the LLM
  routing between MIR tools. Our division-of-labor rules, automated.
  Early, but it is the architecture our findings point at.
- **Source separation as preprocessing** for mix-only uploads
  (htdemucs/BS-RoFormer; All-In-One calls demixing essential [M2]).
  Untested here only because stem-shovel's users upload true stems —
  for any builder whose users upload mixes, this is the published
  winning recipe.
- **Full-MIDI transcription → symbolic analysis** (MT3-class models
  feeding the LLM's near-ceiling symbolic path). We tested chart text;
  we never tested transcribed MIDI as the LLM's input at scale.

**Categories that are proprietary and visibly ahead:**

- **Commercial-grade polyphonic transcription.** Melodyne's polyphonic
  pitch editing has been shipping for 15 years; open Basic Pitch is
  usable but far behind it (our Study 1 synthesis had to be tuned so
  Basic Pitch could hear it at all). Logic's Smart Tempo and Ableton's
  warp detection similarly outclass open beat tools on messy real
  takes. The gap between shipping proprietary DSP and open tooling is
  largest exactly at transcription and tempo-following.
- **Analysis APIs are a market hole.** Spotify deprecated its audio-
  features API; Moises/Music.ai and AudioShake sell separation and
  some analysis, but no one sells calibrated tempo/key/chords/structure
  as a boring reliable API. For app builders that is both a risk
  (nothing to buy) and an opening.

**Categories that may simply not exist yet:** calibrated MIR;
stem-native foundation models; meter-aware tempo representations as a
product API; null-structure detection; an open DBN. None of these is
blocked on new science — they are engineering and data-access gaps,
which is what makes them opportunities rather than research bets.

## 5. Combinations we have not tried

The program tested tools mostly one at a time (and one chain: Beat
This! beats feeding LinkSeg). The composition space is nearly
untouched, and several combinations follow directly from measured
strengths:

- **Tempo by arithmetic: chart bars × audio duration.** The chart
  declares the bar count; the audio file declares its duration;
  division yields seconds-per-bar and hence tempo — no hearing at
  all, and it cannot make an octave error (the error classes DSP and
  NN both carry). Repeats and rubato are the edge cases. Nobody in
  our stack or the literature pass does this, and it would have
  disambiguated both real-recording tempo misses (112-vs-224,
  96.7-vs-145) for free.
- **Disagreement as confidence.** We now hold two independent tempo
  engines whose failure classes barely overlap (DSP: octave/3:2
  families; NN: small drift). Agreement → high confidence; octave-
  family disagreement → show both readings. Same for key (template
  margin × per-stem agreement × an NN's logit) and for structure
  (below). We measured every component separately and never fused
  them — fusion is where the field's missing calibration could
  actually come from, cheaply.
- **Structure by intersection.** The two-arm flip showed LinkSeg and
  D-activity fail on DIFFERENT domains (synthetic loops vs real
  dynamics). A boundary both propose is near-certain; either alone is
  a candidate. Precision from the activity detector, recall from the
  neural segmenter, and a natural "no structure" answer when neither
  fires — the null-structure gap closed by composition instead of new
  models.
- **Beat-synchronous everything.** Beat This! grids feeding
  production's OWN chroma and key segmentation (beat-aligned frames
  instead of fixed 256-sample hops) — the standard MIR trick LinkSeg
  already uses internally, never applied to our detector. Also the
  measured-but-unshipped meter route: downbeat spacing from the grid
  instead of the 3-vs-4 lean vote.
- **Stem-role routing.** Study 9 ran the SAME detector per stem. The
  untried version routes stems to specialists: drums → beat tracker,
  bass → root line, harmonic stems → chord model, with the bass root
  CONSTRAINING the chord matcher's candidates (the literature's
  sevenths fix leans on exactly this [A16][M21]). Likewise Basic
  Pitch per clean stem with merged note lists, instead of
  transcription of a blended render — true stems should transcribe
  with far less masking.
- **Synthesize-and-align.** The bench already owns a deterministic
  synthesizer. Render the chart badly-but-in-time, DTW-align the
  render to the real recording (chroma DTW, synctoolbox lineage), and
  every bar — hence every section mark and chord — gets a timestamp
  mechanically. This composes two things we already have into the
  exact deliverable Study 8 wanted from the model (placement in
  seconds), with no model.
- **Chart-vs-audio verification as symbol comparison.** Production
  asks the model to confirm by EAR that a chart matches the recording
  (the "same piece" clause). The untried combo: detect chords from
  audio mechanically, compare the SEQUENCES as text — an LLM-optional
  string-alignment problem in the model's near-ceiling symbolic
  domain rather than its blind audio domain.
- **The reconciler** (drafted as Study 11): detector outputs → one
  LLM pass over symbols only, reconciling chords against key, bass
  and beat grid — the single published combination where an LLM
  improves hearing (+1–3 MIREX, sevenths 67 → 75 [A16]), and the
  natural last stage after any of the above.

The pattern across all of these: the wins come from composing
strengths across families (arithmetic + declaration, grid + template,
NN recall + DSP precision, detection + symbolic reasoning), not from
picking a family. The program has validated the components; the
compositions are the cheapest unexplored shelf.

## 6. Honest limits of this synthesis

Our real-recording evidence is one band, 4–7 songs, one genre
neighborhood; the synthetic corpus is additive-tone pop that favors
templates; tempo grading at ±1 bpm penalizes frame-grid outputs
(registration lesson 5); no vocal-heavy material was scored; and every
LLM result is two model families (Gemini audio, plus the Study 1–3
matrix). The capability map's shape matches the independent literature
everywhere we can check it, which is the main reason to trust it
beyond n.
