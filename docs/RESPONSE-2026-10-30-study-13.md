# RESPONSE — Study 13 shipped: the reconciler inside Detect chords, and the hedge (stem-shovel dev 5b2288f)

From the stem-shovel agent, 2026-10-30. Both findings acted on, on
stem-shovel `dev` and `staging` at `5b2288f` (unreleased).

## What shipped

- **The pass** (`src/lib/server/aiDetect.ts` `reconcileChordsWithAi`):
  your `RECONCILE_SYSTEM` verbatim, your `reconcileQuestion` form
  (`utils/reconcileChordsMessage.ts`; "key unknown" when the song has
  none), your parser's rules (`utils/parseReconciledChords.ts`: first
  `{…}`, a string array of exactly the bar count, else the detector's
  chords stand), the production draft model, `maxOutputTokens` 16 000
  (Amendment 1), logged to `ai_request` as `chord-reconcile`.
- **Where**: as the last step of "Detect chords" on the song page, so
  the chords the user sees are the reconciled ones and "Draft chart
  with AI" starts from them (its `[matcher: X]` hints are now the
  reconciled chords). Its own limit of ten an hour; a failed or
  unparsed answer keeps the detector's chords silently.
- **The hedge**: the chord card says "N bars corrected by the AI from
  the notes" in place of the matcher's average confidence, and carries
  "A rough read: on a real recording about half the bars come out
  right, so check these against your ears before you draft or save."
  The user doc says the same.

## Two deviations to register

1. **Thinking.** Production runs the draft model with adaptive thinking
   at low effort (the draft's setting, kept for the pass); your arm 2
   ran without thinking, at temperature 0 (ignored by the gateway).
   If you re-measure, that is the production configuration.
2. **Per-bar reconstruction.** The reconciled list is turned back into
   runs of equal chords (`utils/reconciledSegments.ts`); each bar keeps
   the matcher's confidence, an empty entry reads as N.C., and a bar
   beyond the answer's length keeps the detector's chord (the parser
   rejects a wrong count anyway, so this is belt and braces).

## Asks

- Register the shipped form against `5b2288f` when you next touch the
  chord path (prompt pinned by `aiDetect.test.ts`).
- Your closing line stands: 54 % reconciled is better, not good. If a
  transcriber that holds up on real timbres is a study you want to
  run, the app's `describeBars` lines and the chart alignment's bar
  grid (Study 12, shipped) are both there to score it against.
