# Study candidates after the ladder thread (2026-10-30)

Analyst memo, not a registration. Fourteen studies in; the ladder
thread closed. What to measure next, in three tiers, with the outside
research that informed each (links in the bench conversation record;
key anchors named inline).

## Tier 1 — extensions of threads already paying off

**A. Score-to-audio alignment (chart → seconds, mechanically).** The
playbook's best unexplored idea, and the only remaining job Study 8
left to the model (boundary placement in seconds). Chroma-DTW
alignment of a chart-driven render against the recording gives every
bar a timestamp with no model. The validation truth EXISTS: MMKK's
declared section starts scored N-seg and D-activity in Study 10 and
can score alignment the same way; synthetic truth is by construction.
Zero spend. Ship surface: section placement, chord-in-time display,
and the settings-versus-chart warning's placement half.

**B. The reconciler (LLM over detected symbols).** The one published
shape where an LLM improves hearing: detector chords + key + beats
reconciled as TEXT (ISMIR 2025: +1–3 WCSR, sevenths 67.2 → 74.6 —
cited in the landscape review [A16]). Study 1's matcher is the
baseline, Study 3's near-ceiling symbol reading is the mechanism, and
the production chord-hint path is the ship surface. Small spend
(~$1–2, pilot-fenced).

**C. Session intelligence (the flagship new direction).** stem-shovel
stores whole rehearsal recordings (45-minute FLACs, the sessions
feature) and knows each band's catalog — the exact inputs of the
ISMIR setlist-identification task (Sinica/ISMIR 2014) and the
version-identification literature, which has fresh 2026 benchmarks
(Unified Music Identification for Tracks and Versions, arXiv
2608.19919; Robust Version Identification in the Wild, arXiv
2608.04543). Questions: which songs were played, where each take
starts and ends, how many takes. Fixture: synthesized "sessions"
(concatenated renders + noise + gaps, truth by construction) plus any
real session the MMKK account holds. Candidate instruments:
chroma/fingerprint matching against the band's own stems (classical,
zero weights) vs a version-ID embedding model if a deployable one
exists. Product value is the highest on this list: an unlabeled
45-minute recording becoming a navigable set list is a feature no
band tool ships.

**D. The tempo map (the beat grid's real consumer).** Study 10 deferred
Beat This! because no consumer existed; drifting session takes are the
consumer (the tempo-grid plan said so). Measure drift curves per take
("the chorus rushed 6 bpm") against the synthesis grid on constructed
drifting renders + descriptively on real takes. The timing-feedback
literature says this is pedagogically real (computer-aided timing
training; real-world sensorimotor timing studies).

**E. The swing flag (micro).** 11b's sweep data largely exists:
register the 0.46–0.50 share band as "swung 4/4," validate against
the sweep + straight + compound corpora, ship as a label. Study
6-sized.

## Tier 2 — new directions on existing features

**F. Upload-time mix QA (plain code, Study 6 shape).** Clipping, LUFS,
dual-mono, left-only (the app already shipped a repair for that class),
length mismatch, DC offset, silent stems, inter-stem bleed. The
industry numbers argue it matters (a mastering service reports
clipping in 31 % of 7M mixes); open tools (StemCheck's bleed matrix,
EBU R128 meters) define the measurable surface. Zero model spend,
pure DSP, high ship value as upload warnings.

**G. Lyrics alignment (vox stems → word timestamps).** WhisperX-style
CTC forced alignment is mature (93 % word timing on speech), and
singing-specific frameworks exist (STARS, arXiv 2507.06670). stem-
shovel holds lyrics docs and (some) vocal stems. Feasibility study
first: alignment accuracy on the MMKK vox material against the stored
lyrics. Ship: chart/lyrics following the recording in practice view.

**H. Idea-recorder matching.** A hummed or strummed voice memo filed
to the song it belongs to: melody/chroma matching against the catalog
(query-by-humming lite; the version-ID embeddings above may transfer).
Fixture: renders of each song's melody fragments + noise.

## Tier 3 — exploratory / capability

**I. Foundation-embedding probes.** MERT under the MARBLE probing
protocol (frozen backbone + tiny head) on the bench's own truth — the
category between plain NN and LLM the program has never touched. Key
and beat are MARBLE tasks, so published numbers exist to compare
against. Server-side only (90M+ params).

**J. Text-to-beat round 2: groove match.** Study 2 measured
reasoning; unmeasured is whether a generated beat MATCHES a reference
feel — swing ratio and density now being measurable with Study 11's
committed instruments.

**K. ai_request telemetry (observational).** Still blocked on
production DB access from Kevin; unchanged.

## Recommendation

Next registration: **A (alignment)** — zero spend, truth in hand, and
it retires the model's last hearing job, completing the program's
arc. Then **C (sessions)** as the new flagship (it opens a feature,
not just a validation), with **F (mix QA)** as the cheap ship-win to
run alongside either. B (the reconciler) whenever a stem-shovel brief
wants the chord-hint path improved; D and E piggyback on the first
real session data A or C brings in.

## Update (2026-10-30, after Studies 12 and 13)

- **C (sessions intelligence) is PARKED by Kevin**, with reasoning the
  bench endorses: practice recordings diverge from references in
  arrangement, key, instrumentation and tempo, and their structure is
  non-linear (sections looped and worked at length) — the exact
  conditions under which version matching and subsequence alignment
  both fail (Study 12's own lesson: alignment dies where the recording
  stops following the reference, and a rehearsal is mostly that). A
  narrow fragment survives unparked for some future day: silence-gap
  take splitting needs no matching at all.
- **New candidate from Study 13, now ranked first: the transcription
  successor.** Study 13 named the note transcription on real timbres
  as the chord feature's binding constraint (38.2 % with Basic Pitch).
  The study: MT3-class / newer open transcription models against Basic
  Pitch, scored through the SAME committed pipeline (matcher + Study
  12 bar grid) on the same real bars — the Study 10 shape, pointed at
  the measured bottleneck, with real-audio truth already in hand.
- A and B are done (Studies 12 and 13). The standing queue: the
  transcription successor, mix QA (F), MERT probes scoped to
  stem-role labeling + key + octave-class (I — its sessions synergy is
  moot now, so it stands alone on the stem-labeling product case),
  the tempo map (D, weakened without sessions), the swing flag (E),
  lyrics alignment (G).
