# stem-bench: measuring the AI features of stem-shovel

Lightning Jar's third research program (after barkup-bench and aeo-bench).
stem-shovel — the music collaboration app at stemshovel.com — uses language
models in six features: a listening second opinion on tempo/key/meter, a
section detector, a score reader, a chord-chart drafter fed by Basic Pitch
transcription, and text-to-beat / text-to-chords generators. The app's code
embeds empirical decisions made from informal observation (which model
drafts charts best, whether reasoning helps a drum pattern, whether a
template matcher's hint helps the chart draft). This program measures those
decisions with pre-registered studies, deterministic fixtures and
mechanical graders, so the product choices rest on published numbers.

The discipline is barkup-bench's, as amended by its registration lessons:
briefs committed before scored runs, gates never re-thresholded, spend
fences with explicit matrix authorization, no-harm conditions registered
comparatively, acceptance criteria never authored solo where judgment is
involved (none is: every grader in this program is mechanical).

## Studies

- **Study 1 — the hint-following study** (docs/BRIEF-STUDY1.md): when the
  chart-draft prompt carries the template matcher's per-bar chord hint,
  does the model read the transcribed notes or copy the hint? Ground truth
  by construction: hand-authored progressions, synthesized, transcribed by
  the production Basic Pitch pipeline, hint ablated across four arms.

Candidates for later studies, in the order proposed on 2026-10-21:
reasoning-on vs reasoning-off for text-to-beat (the claim is hard-coded in
production and unmeasured); structured music notation validity across
model tiers; a score-reading round trip through Verovio; the listening
layer against synthesized ground truth; and the free observational read of
the production `ai_request` table.
