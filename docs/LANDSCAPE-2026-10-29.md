# Landscape: LLMs and music analysis, checked against the program (2026-10-29)

Three web-research passes (academic literature and benchmarks; classical
and neural MIR tooling; products, developer write-ups and forums),
commissioned by the stem-shovel side to answer one question: with eight
studies behind us, are we missing something? Sources at the end; every
number below is cited there, and anything a pass could not verify is
marked. This is reference material for Studies 9 and later, not a
registered study.

## 1. The split is right, and the literature says so with numbers

Stem-shovel's design, DSP hears and the model reads the chart, is what
every published product and pipeline does, and the benchmarks agree:

- **Audio LLMs do not hear tempo, beat or key.** CMI-Bench (ISMIR 2025)
  scored eleven open audio LLMs with mir_eval metrics: best GiantSteps
  key score 9.5 against a specialist's 74.3; best GTZAN beat F-measure
  23.7 against 88.3, most under 5; on downbeats Qwen-Audio "simply
  copies the input example" [A1]. Music Flamingo's expert review has
  Gemini and GPT-4o 30–50 bpm off and in the wrong key on real tracks
  [A2]. No controlled Gemini 3.x tempo/key study exists (gap).
- **Text beats audio inside these models.** Text-only LLMs score up to
  56.4 % on MuChoMusic and noising the audio barely moves audio LLMs
  [A8]; MM-SHAP attribution shows the more accurate model leans more on
  text [A9]; DEAF (2026): predictions "predominantly driven by textual
  inputs" [A10]; SYAUDIO (2026): models side with the user's claim
  against the audio [A11]. That is Study 4's hint echo and Study 7's
  47/47 settings echo, independently found.
- **Symbolic input is near ceiling.** Carone et al. (2025): Gemini 2.5
  and Qwen2.5-Omni near-perfect on chord quality from MIDI, a "clear
  perceptual gap" from audio, reasoning prompts help little [A5]. That
  is Study 4's chart arm.
- **Texture and instruments are what they hear.** Music Flamingo 76–91 %
  on instrument sets [A2]; mood correlates 0.46–0.64 with humans while
  measurement tools track spectral defects at ρ≈1.0 and LLMs at ≤ 0.31
  [P5]. Study 8's contrast result sits here.
- **Nobody ships an LLM that hears.** Cyanite analyzes once with
  specialist models and lets the LLM reason over stored tags [P1];
  ChordMini runs chord, beat and SongFormer models and uses Gemini only
  for Roman numerals and spelling over the labels [P2][P3]; StemSense
  separates with Demucs, measures with Essentia, and has one LLM write
  findings and another the reply [P4]; music-perception-mcp keeps
  measurement tools apart from a single "subjective" Gemini tool [P5];
  Logic Pro 12 derives the key from the detected chord series [P8].

One nuance for Study 8's reading: on real songs (HarmonixSet) Gemini
2.5 Pro places section boundaries within 3 s at 0.813, better than
SongFormer (0.78) and All-In-One (0.73), but within 0.5 s only 0.423
against 0.70 and 0.60; labels 0.748 vs 0.807 [A6]. The model is a fair
coarse structure reader of real music; the bench's uniform loops are a
harder, ill-posed case, and the chart remains the way to pin boundaries.

## 2. What we are missing: our hearing is the classical baseline

The DSP in `src/lib/audio/analysis.ts` is the method family the neural
models replaced, and the gaps are measurable:

| Task | stem-shovel today | State of the art | Gap |
|---|---|---|---|
| Key | Krumhansl–Kessler templates + bass tiebreak | madmom CNN 73.1, S-KEY 73.2 MIREX on FMAKv2; Krumhansl 53.4 on the same set [M4] | ≈ 15–20 points (estimate; the tiebreak narrows it, unverified) |
| Tempo | onset autocorrelation, octave prior, multi-lag refinement | TempoCNN 85 % exact on GiantSteps vs 65 % for a three-detector vote and 42 % for one detector [P12]; Beat This! beat F1 89.1 GTZAN, 95.8 Harmonix, no DBN, any meter [M1] | octave errors are the named dominant failure [A19] |
| Meter | per-stem 3-vs-4 vote | a downbeat tracker gives beats per bar directly (Beat This! downbeat F1 78–94) [M1] | — |
| Sections | model, chart-anchored | SongFormer HR.5F 0.703 / HR3F 0.784; LinkSeg 0.630 / 0.762; Foote novelty 0.292 / 0.540 [M11][M12] | no audio structure detector in the app |
| Chords | Basic Pitch + template matcher | BTC maj-min 82.7 [M7]; the field has plateaued near 80–83 [M9]; ChordMini 170 classes, 17 MB ONNX, MIT [M16] | unverified head-to-head |

Browser-deployable today: **Beat This! small**, ≈ 2 M parameters,
≈ 10 MB ONNX, an onnxruntime-web port exists (MIT) [M13][M14];
**LinkSeg** 1.5 MB ONNX taking beats as input (CC-BY 4.0) [M15];
**ChordMini** 17 MB ONNX, ≈ 98 ms per 16 windows on a phone with WebGPU
(MIT) [M16]; for key, swapping Krumhansl for Albrecht–Shanahan profiles
alone moved a GiantSteps MIREX score from 0.58–0.60 to 0.668 in one
non-peer-reviewed report [M5], and madmom's key CNN would need an ONNX
export of our own (no port found).

Licensing matters for a commercial app (verified at the sources on
2026-10-29): madmom's source is BSD but its pretrained model and data
files are CC BY-NC-SA 4.0, with commercial use by arrangement with
Gerhard Widmer (github.com/CPJKU/madmom README); a "patented DBN"
claim from the practitioner pass could not be verified and is
withdrawn. Essentia's library is AGPLv3 for non-commercial use and its
pretrained models CC BY-NC-ND 4.0, with a commercial license from the
MTG on request (essentia.upf.edu/licensing_information.html). Music
Flamingo is non-commercial [A2]. Beat This! and ChordMini are MIT;
LinkSeg is CC-BY 4.0.

## 3. Stems: the literature supports the idea and has not done our version

- Demixed input helps **downbeats** more than beats: Beat Transformer up
  to +4 points downbeat from demixed spectrograms [M18]; a drum-aware
  percussive/non-percussive ensemble beat its no-separation baseline on
  four test sets [M19]; All-In-One's ablation calls demixing essential
  to all four of its tasks [M2].
- **Chords**: HT-Demucs + a 301-class chord model + local key + Beat
  This!, then GPT-4o correcting against key, bass and beats: +1 to +3
  MIREX points, sevenths 67.2 → 74.6 (ISMIR 2025) [A16]; the bass stem
  for roots [M21]; boosting harmonic stems corrected 2,000+ frames from
  a 75.5 % baseline [M20].
- **Key and tempo per stem then fused**: no study found, either way.
  Study 9's D-stem-tempo and D-key-agree are new ground.
- Every model above was trained on mixes or Demucs output. stem-shovel
  holds true stems with no bleed, plausibly better and untested; Beat
  This!'s GuitarSet (92.0) and Groove drums (93.7) scores suggest
  single-instrument input stays in distribution [M1].

## 4. Spectrogram images to a vision model: drop it

The only evidence is environmental-sound classification (GPT-4o 59 %
few-shot, 27.5 % zero-shot on ESC-10; on speech the gain vanishes when
the image is removed) [A14]. No study reads pitch, key or structure
from a spectrogram image. Study 9's optional Q5 should be dropped
rather than funded.

## 5. Design lessons worth adopting

- **A scope label on every piece of evidence.** StemSense's LLM
  presented the whole track's key and tempo as a selected window's
  until each datum carried its scope [P4]. Our analogue is Study 7's
  settings echo; `chartStatedValues` fixed it for tempo and meter, and
  any future evidence handed to a model should name what it is about.
- **The model is a mediocre judge of raw MIR numbers** (≈ 60–65 %) [A13]:
  keep its checks grounded in chart text, never free-judging detector
  output.
- **Key from the chord sequence as text** is the strength we measured
  (Logic 12 does it; ChordMini has Gemini do Roman numerals over labels)
  [P8][P3]: once chords come from a stronger detector, the chart path can
  take the detected progression as its chart.
- **Gemini's audio path** downmixes to mono at 16 kbps, 32 tokens per
  second, timestamps in MM:SS, with documented drift to −16 s over 12
  minutes [P23][P18]: a mechanical reason to never ask it for fine
  timing, and to keep placement anchored to bars.

## 6. What this suggests for the program

1. **Study 9 as drafted, without Q5.** Stem-activity sections and
   per-stem tempo/key are unstudied; the texture result and the demixing
   literature both say stems should help.
2. **Study 10: neural baselines against D-prod on the existing fixture.**
   Beat This! small (tempo, beats, downbeats, hence meter), LinkSeg
   (sections, fed Beat This! beats), Albrecht–Shanahan profiles then a
   key CNN, ChordMini against Basic Pitch + templates; measured on the
   bench's synthesized truth AND a small real-recording set if the
   program admits one (synthesized pop is kind to template methods).
   Browser size and latency recorded per model. This is the study most
   likely to change what ships.
3. **Study 11, if 10 pays: the model as consistency checker** over the
   detected chord sequence, key and beats (the ISMIR 2025 shape), the
   LLM reading symbols, which is where it is near ceiling.

## Sources

Academic pass (A): A1 CMI-Bench arXiv 2506.12285; A2 Music Flamingo
arXiv 2511.10289; A3 LLark arXiv 2310.07160; A5 Carone et al. arXiv
2510.22455; A6 SongFormer arXiv 2510.02797; A7 MMAU-Pro arXiv
2508.13992; A8 "Are you really listening?" arXiv 2504.00369; A9 MM-SHAP
arXiv 2509.20641; A10 DEAF arXiv 2603.18048; A11 SYAUDIO arXiv
2601.23149; A12 Kruspe arXiv 2409.05521; A13 GPT as judge arXiv
2501.13261; A14 VLMs on spectrograms arXiv 2411.12058; A15 All-In-One
arXiv 2307.16425; A16 ACR + LLM CoT arXiv 2509.18700; A17 Beat This!
ISMIR 2024; A18 drum-aware ensemble arXiv 2106.08685; A19 tempo octave
metrics ISMIR 2017 paper 137; A20 AudioToolAgent arXiv 2510.02995.

MIR pass (M): M1 Beat This! arXiv 2407.21658; M2 All-In-One arXiv
2307.16425; M3 tempo_eval GiantSteps report; M4 S-KEY arXiv 2501.12907;
M5 github.com/akoita/resonate/issues/2018 (not peer-reviewed); M7 BTC
arXiv 1907.02698; M9 Mackenzie arXiv 2512.22621; M11 SongFormer arXiv
2510.02797; M12 barwise CBM arXiv 2311.18604; M13
huggingface.co/ashudesai/songbird-models; M14
huggingface.co/musetric/beat-this-onnx; M15
huggingface.co/elicwhite/linkseg-7c-onnx; M16
huggingface.co/musetric/chordmini-onnx; M18 Beat Transformer arXiv
2209.07140; M19 arXiv 2106.08685; M20 APSIPA 2025 P307; M21
openreview.net/pdf?id=nSJIbFEpHr.

Practitioner pass (P): P1 cyanite.ai/blog/llm-music-search; P2 dev.to
ChordMini write-up (2025-09); P3 github.com/ptnghia-j/ChordMiniApp; P4
stem-sense.pages.dev/case-study; P5 glama.ai music-perception-mcp; P8
Logic Pro 12 Chord ID (logicstudiotraining.com, weraveyou.com 2026-01);
P12 dev.to "BPM detection from 42 to 85 % with a pretrained model"; P18
discuss.ai.google.dev timestamp-drift threads (Gemini 2.5, 3); P23
ai.google.dev/gemini-api/docs/audio; P24 pypi.org/project/beat-this.
