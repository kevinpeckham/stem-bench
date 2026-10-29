# A music app builder's playbook (draft)

**Analyst synthesis — not a registered study.** Written 2026-10-29
after Studies 1–10 including the real-recordings amendment; revised
the same day after the stem-shovel side's review
(docs/RESPONSE-2026-10-29-playbook-and-tempo-grid.md). The registered
numbers live in REPORT.md; literature citations give paper names and
arXiv ids, with full sourcing in docs/LANDSCAPE-2026-10-29.md.

**How these things were measured.** Every bench number below comes
from pre-registered studies: ground truth synthesized by construction
(plus one real-recording set, a single band's public catalog scored
against its own declared settings), mechanical graders committed and
tested before any scored run, gates and predictions registered by
commit before data existed. Sample sizes are small — 4 to 35 items
per comparison — so treat each number as a direction confirmed or
denied, not a population estimate; where the independent literature
measured the same thing at scale, it is cited beside ours.

## 1. The rules

Eleven rules, each earned by at least one measured failure.

1. **Signal → code or specialist models; symbols → LLM; never swap.**
   Every production system the landscape pass examined — Cyanite,
   ChordMini's app, StemSense, Logic Pro 12 — converged on this split
   independently. And price the families honestly as part of the same
   rule: plain code is free per song, neural models are priced in
   megabytes and seconds, an LLM call is priced per call and is never
   free. The bench's zero-spend instruments won partly because they
   cost nothing per song.
2. **Parse, don't ask.** Anything mechanically extractable from text
   (tempo marks, section names, counts, keys-in-force) must be parsed;
   the model is asked only for what text cannot supply — and even
   then, prefer anchoring to bars over asking for seconds.
3. **Every datum handed to a model carries its scope and provenance.**
   A fact line without a scope label becomes the answer (Study 7, the
   song-check redesign: settings values echoed 47/47; StemSense's
   case study hit the same wall with window-scoped data).
4. **Curate the model's text like an attack surface.** Models defer to
   text over audio AND over instructions; a wrong fact in context is
   functionally an injection. Measured four ways on the bench
   (Studies 1, 2, 4, 7) and independently in the literature (DEAF,
   arXiv 2603.18048; SYAUDIO, arXiv 2601.23149).
5. **Confidence must come from a mechanism, never from the model — and
   mechanisms need validation too.** The LLM's confidence 1.0 on wrong
   answers was fiction; but so was our own per-stem agreement score,
   which gave its maximum to the study's only wrong key answer
   (Study 9). Production's correlation margin, which ranked that
   answer 3rd-lowest, earned its place by construction.
6. **The user is the verifier.** The shipped answer to the
   calibration gap is not a better confidence number but UI: amber
   warnings, a "Use these" button, the chart shown beside the answer.
   A rung picker beats a verdict; a hedged suggestion beats a silent
   wrong value. Treat calibration as an interface problem first and a
   modeling problem second.
7. **Prefer enumerable failure classes at equal accuracy.** A guarded
   DSP beats an unguarded neural model that scores the same, because
   the guard is writable. (And validate the guard: our registered
   octave-disagreement flag fired on 10/21 items including clean ones
   — a hazard signal that fires on normal music is not a signal.)
8. **Test both domains, always.** The synthetic corpus flattered
   templates; real recordings flattered the trained models; neither
   arm alone told the truth (Study 10's two-arm flip, predicted by the
   landscape review's "synthesized pop is kind to template methods"
   warning).
9. **Ship null paths, and gate on them.** The bench's detector
   returns bpm 0 at confidence 0 only for short or empty input; on
   pulseless material it emits a number with low confidence — and no
   production surface gates on that confidence, so the number gets
   shown. The trained tracker's near-silence on the same material was
   the honest answer. A null path that the UI ignores is not a null
   path.
10. **Validate rules on data they were not designed on** (Study 6 →
    6b: the key-in-force warning passed 48 unseen reads only after
    its author refused to trust the designed-on-data version).
11. **Mechanical graders and registered gates, even internally.** Half
    this program's value came from gates failing by letter in
    instructive ways; a benchmark that can't embarrass you can't
    inform you.

## 2. How the three families fail

Three families of tools analyze music, and the clearest finding of
ten studies is that they fail differently — the failure MODE matters
more to a product than the failure rate.

**LLMs read music; they do not hear it.** Reading symbols is at or
near ceiling: chord recall 98.8 % from engraved PNGs (Study 3), 99.3 %
from clean PDFs (Study 5), 100 % section detection with a marked
chart (Study 8); the literature finds near-perfect chord quality from
MIDI with a "clear perceptual gap" from audio (Carone et al., arXiv
2510.22455). Hearing is close to absent: blind tempo/key 1–2 of 12 at
confidence 1.0 on the bench (Study 4) — a genre prior, not a
measurement — and at scale, CMI-Bench (arXiv 2506.12285) scores the
best open audio-LLM at 9.5 on key against a specialist's 74.3 and
23.7 on beat F-measure against 88.3. Stem isolation does not help
(Study 9); spectrogram images do not either (no published evidence of
pitch, key or structure read from spectrograms; arXiv 2411.12058).
Fine timing is mechanically out of reach for current audio
tokenizers (Gemini: 32 tokens/second, documented drift to −16 s over
12 minutes). What they DO hear is coarse texture: arrangement
contrast 7–8 of 8 blind (Study 8), and on real music Gemini 2.5 Pro
places section boundaries within 3 s at 0.813 — above the specialist
SongFormer — while losing 0.423 to 0.70 at ±0.5 s (arXiv
2510.02797). The failure mode: **confident, plausible, and
text-anchored** — wrong answers arrive in fluent prose at full
confidence, often echoing nearby text. That is among the hardest
failure shapes for a product to catch, and it is why the production
systems above keep the LLM on labels, never on signal.

**Neural MIR models hear well inside their training domain and fall
off a cliff outside it.** They produce things the other families
cannot: per-beat grids (Beat This! small: F 0.892 at ±70 ms on the
bench; 89–96 published, arXiv 2407.21658), real-music structure
(LinkSeg: 29/33 of a band's declared boundaries at ±4 s, one song 8/9
with zero false), graceful degradation (small drift where DSP failed
by exact halves), honest near-silence on pulseless material, all in
1.5–17 MB browser-deployable packages. But out of domain they fail
silently and big: 54 invented boundaries on 22 structureless
synthetic songs, one wholesale chord collapse (4/28), extended chords
lost in-domain to a tuned template matcher (38/64 vs 59/64). The
failure mode: **the domain cliff** — no visible edge, not enumerable
in advance; the only defense is testing on your actual material.

**Plain code (DSP, templates, parsers) is better than its reputation
and fails in nameable classes.** Production's summed-envelope
autocorrelation was exact 29/33 at ±1 bpm and survived every
deliberately misleading stem (Study 9: picking the sharpest single
stem instead lost 18 points — cross-stem reinforcement is the tempo
signal). Krumhansl–Kessler templates beat both literature profile
sets on real recordings, 4/6 against 1/6 each — though that is six
songs from one band, a direction rather than a law. The Basic Pitch +
template matcher read 483/504 bars against ChordMini's 418 on
material it was tuned for, costs zero bytes of weights and ~1 s per
90 s of audio, and improved 90.5 % → 96.4 % from a one-line finding
within hours. What it cannot do: escape its failure classes — the 3:2
dotted-pulse confusion and half-time errors appeared on synthetic 6/8
AND on real recordings (exactly half of a declared 224, exactly 2/3
of a declared 145) — produce a per-beat grid, or find real-music
structure. The failure mode: **class-shaped and enumerable — the best
kind.** You can name the octave family, the 3:2 family, the
relative-key family in advance, which means you can guard them with
cheap verifiers, UI hedges, or a second opinion. Engineering can work
with this; a cliff gives it much less to hold on to.

## 3. Opportunity gaps (where everyone fails)

- **The 3:2 / compound-meter family.** DSP reads 6/8 at 1.5×, Beat
  This! tracks eighths and votes 4/4, LLMs hear nothing. The octave
  problem is named in the literature (tempo octave metrics, ISMIR
  2017); the 3:2 problem is its neglected sibling. Plausibly a
  representation gap, not a model gap: **tempo-as-scalar is the wrong
  API.** A grid of beat times plus a (pulse, subdivision, grouping)
  tuple makes "120 vs 240 vs 80" a display choice instead of an error
  class. Logic's Smart Tempo and Ableton's warp analysis ship beat
  grids inside DAWs; no one ships this as an analysis API or a data
  model for app builders.
- **Calibrated confidence, anywhere.** LLM confidence is fiction,
  neural logits are uncalibrated off-domain, DSP margins are
  heuristic. A detector that outputs "60 % it's 112, 40 % it's 224"
  would change product UX more than 5 points of accuracy. Open gap
  across the field.
- **"Is there structure at all?"** Every structure detector we
  measured — LLM, LinkSeg, our activity detector — invents form on
  structureless material rather than returning "none." A
  null-structure gate is trivial to pose and absent from the
  literature.
- **Stem-native models.** The published models train on mixes or
  Demucs output; true no-bleed stems are better input and essentially
  unstudied (demixed input measurably helps downbeats and chords:
  Beat Transformer, arXiv 2209.07140; All-In-One, arXiv 2307.16425).
  Platforms that hold true stems hold scarce data — with the
  essential caveat that users' stems are not training data without
  their consent. The bench's real-recording set was usable because
  its owner authorized it under a registered exception; that is the
  exception, not the platform's asset.
- **Extended-chord recognition on clean sources.** The field
  plateaued at 80–83 maj-min WCSR (survey, arXiv 2512.22621);
  sevenths lag ~15 points behind. The one published fix that works is
  hybrid: stems + chord model + an LLM consistency pass over symbols,
  sevenths 67.2 → 74.6 (ISMIR 2025, arXiv 2509.18700).
- **A browser port of the beat-tracking DBN.** madmom's Böck-style
  DBN post-processing is the standard that would fix exactly the
  beat-seam noise and meter votes we measured. Its source — the HMM
  included — is BSD; only the trained model weights are CC BY-NC-SA,
  and Beat This! already offers the DBN as an optional
  post-processor. The gap is a TypeScript or ONNX port of that HMM
  for the browser: engineering, not licensing.

## 4. What we might still be missing

**Categories that exist and we have not tested:**

- **Score-to-audio alignment.** Possibly our biggest practical miss.
  Chroma-DTW alignment (the synctoolbox lineage) is mature,
  classical, open — and it answers exactly the question Study 8
  concluded the model should answer ("where, in seconds, does the
  chart's section start?") with no model at all. Chart names + DTW
  placement could replace chart names + model placement. Production
  already holds per-frame chroma and the chart's bar structure, and
  the Study 7 settings-versus-chart warning is the exact seam where a
  DTW placement would slot in. A clear study candidate with a clear
  ship path.
- **Self-supervised music embeddings + tiny probes.** MERT, CLAP and
  kin, with small trained heads over bench truth. Sits between "plain
  NN" and "LLM"; strong published MIR-probe results; server-side
  cheap though not browser-trivial. Untested here — partly because it
  needs training data, which a synthetic bench can generate without
  licensing pain.
- **The LLM as consistency checker over detected symbols** — detect
  chords, key and beats mechanically, let the model reconcile them as
  TEXT (+1–3 MIREX points, sevenths +7; ISMIR 2025, arXiv
  2509.18700). The one place the literature shows an LLM IMPROVING
  hearing, and it works precisely because the model never touches
  audio.
- **Agentic tool orchestration** (AudioToolAgent, arXiv 2510.02995):
  the LLM routing between MIR tools. Our division-of-labor rules,
  automated. Early, but it is the architecture these findings point
  at.
- **Source separation as preprocessing** for mix-only uploads
  (htdemucs / BS-RoFormer; All-In-One's ablation calls demixing
  essential). Untested here only because stem-shovel's users upload
  true stems — for a builder whose users upload mixes, this is the
  published winning recipe.
- **Full-MIDI transcription → symbolic analysis** (MT3-class models
  feeding the LLM's near-ceiling symbolic path). We tested chart
  text; we never tested transcribed MIDI as the LLM's input at scale.

**Categories that are proprietary and visibly ahead:**

- **Commercial-grade polyphonic transcription.** Melodyne's
  polyphonic pitch editing has shipped for 15 years; open Basic Pitch
  is usable but far behind it (our Study 1 synthesis had to be tuned
  so Basic Pitch could hear it at all). Logic's Smart Tempo and
  Ableton's warp detection similarly outclass open beat tools on
  messy real takes. The proprietary-versus-open gap is largest
  exactly at transcription and tempo-following.
- **Analysis APIs are a market hole.** Spotify deprecated its
  audio-features API; Moises/Music.ai and AudioShake sell separation
  and some analysis, but no one sells calibrated
  tempo/key/chords/structure as a boring reliable API. For app
  builders that is both a risk (nothing to buy) and an opening.

**Categories that may not exist yet:** calibrated MIR; stem-native
foundation models; meter-aware tempo representations as a product
API; null-structure detection; a browser-grade DBN port. None of
these looks blocked on new science — they are engineering and
data-access gaps, which is what makes them opportunities rather than
research bets.

## 5. Combinations we have not tried

The program tested tools mostly one at a time (and one chain: Beat
This! beats feeding LinkSeg). The composition space is nearly
untouched, and several combinations follow directly from measured
strengths:

- **Octave disambiguation by arithmetic: chart bars × audio
  duration.** The chart declares a bar count and the audio declares
  its duration; their ratio pins which RUNG of the tempo ladder the
  song is on, because bar-count arithmetic cannot be off by 2×. It is
  not a tempo source — count-ins, uncharted intros and outros,
  repeats and fades mean the chart's bars rarely equal the
  recording's exactly, and Study 7 already takes the tempo value
  itself from the chart where one is marked — but as an octave-class
  check it would have disambiguated both real-recording tempo misses
  (112-vs-224, 96.7-vs-145) for free.
- **Disagreement as confidence.** We now hold two independent tempo
  engines whose failure classes barely overlap (DSP: octave/3:2
  families; NN: small drift). Agreement → high confidence;
  octave-family disagreement → show both readings. Same for key
  (template margin × an NN's logit) and for structure (below). We
  measured every component separately and never fused them — fusion
  is where the field's missing calibration could come from, cheaply.
- **Structure by intersection.** The two-arm flip showed LinkSeg and
  the stem-activity detector fail on DIFFERENT domains (synthetic
  loops vs real dynamics). A boundary both propose is near-certain;
  either alone is a candidate. Precision from the activity detector,
  recall from the neural segmenter, and a natural "no structure"
  answer when neither fires — the null-structure gap closed by
  composition instead of new models.
- **Beat-synchronous everything.** Beat This! grids feeding
  production's OWN chroma and key segmentation (beat-aligned frames
  instead of fixed hops) — the standard MIR trick LinkSeg already
  uses internally, never applied to our detector. Also the
  measured-but-unshipped meter route: downbeat spacing from the grid
  instead of the 3-vs-4 lean vote.
- **Stem-role routing.** Study 9 ran the SAME detector per stem. The
  untried version routes stems to specialists: drums → beat tracker,
  bass → root line, harmonic stems → chord model, with the bass root
  CONSTRAINING the chord matcher's candidates (the literature's
  sevenths fix leans on exactly this). Likewise Basic Pitch per clean
  stem with merged note lists, instead of transcription of a blended
  render — true stems should transcribe with far less masking.
- **Synthesize-and-align.** The bench already owns a deterministic
  synthesizer. Render the chart badly-but-in-time, DTW-align the
  render to the real recording, and every bar — hence every section
  mark and chord — gets a timestamp mechanically. This composes two
  things we already have into the exact deliverable Study 8 wanted
  from the model (placement in seconds), with no model.
- **Chart-vs-audio verification as symbol comparison.** Production
  asks the model to confirm by EAR that a chart matches the recording
  (the "same piece" clause). The untried combo: detect chords from
  audio mechanically, compare the SEQUENCES as text — an LLM-optional
  string-alignment problem in the model's near-ceiling symbolic
  domain rather than its weak audio domain.
- **The reconciler**: detector outputs → one LLM pass over symbols
  only, reconciling chords against key, bass and beat grid — the
  single published combination where an LLM improves hearing, and the
  natural last stage after any of the above.

The pattern across all of these: the wins come from composing
strengths across families (arithmetic + declaration, grid + template,
NN recall + DSP precision, detection + symbolic reasoning), not from
picking a family. The program has validated the components; the
compositions are the cheapest unexplored shelf.

## 6. Honest limits of this synthesis

Our real-recording evidence is one band, 4–7 songs, one genre
neighborhood; the synthetic corpus is additive-tone pop that favors
templates; tempo grading at ±1 bpm penalizes frame-grid outputs (a
tolerance set at DSP precision measures a candidate's output
quantization, not its hearing — the program learned this as a
registration lesson); no vocal-heavy material was scored; and every
LLM result is two model families (Gemini audio, plus the Study 1–3
matrix). The capability map's shape matches the independent
literature everywhere we can check it, which is the main reason to
trust it beyond n.
