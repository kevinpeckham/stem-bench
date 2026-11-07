# Study 20b — the power hint on held-out songs: the frozen rule meets charts the bench has never seen

**Registered before any run AND before the bench has looked at the
held-out truth.** Date: 2026-11-07. Kevin confirms every public Badverbs
song in Stem Shovel has a chart with bar-level truth; the charts for the
two held-out songs (peaceful-dreams, mop-heart) will be fetched from the
app ONLY AFTER this brief, the instruments and the runner are committed,
then committed verbatim as received (provenance recorded), converted
mechanically to the chart-JSON shape, and graded. No constant, gate or
rule may change after the charts are seen. Kevin's direction: Design A
(held-out truth) with the variant as a disclosed secondary arm.

## The question

Study 20 refuted `colorChord`, but its anatomy left one measured asset:
the power call — model quality maj or min, and the bar's note profile
showing third, fourth AND second all absent with the fifth present (the
12 % line) — was right 22 of 23 firings on letter-lands and 7 of 12 on
eat (29/35 = 83 % combined; 29/32 = 91 % when the model's root was
right). Those numbers were observed post hoc, so they prove nothing by
themselves. This study freezes the rule exactly as measured and asks
whether its precision survives on songs whose truth the bench has never
seen — the only form of evidence that can license the app to ship it as
a HINT ("likely a power chord") beside the model's symbol. A hint, never
a recoloring: Study 20 measured what recoloring costs.

## Arms ($0, no model-API calls)

- **A (frozen, gated)**: the Study 20 power rule verbatim — implemented
  as `colorChord(root, quality, evidence, SHIPPED20).rule === "power"`,
  the committed and tested Study 20 instrument, untouched. Fires only
  when the model's reduced quality is maj or min. The hint symbol is
  root + "5"; right means strict-any against the bar's chart chords
  (barmark grade, Study 20's G1 comparator).
- **B (blind variant, disclosed secondary arm)**: the same rule with the
  ABSENCE tests (third, fourth, second) computed on a pitch-floored
  profile — only notes at MIDI pitch ≥ 45 (A2, 110 Hz) — while the
  fifth-present test and the firing preconditions stay on the full
  profile. Rationale, fixed blind: Study 20's failure cause was phantom
  thirds and fourths from low-pitch harmonic smear (the Study 13 class);
  the floor is set from first principles at the top of the bass range,
  BEFORE any held-out data is seen, and is not swept. A bar with no
  notes at or above the floor does not fire (no evidence). The synthetic
  fixture cannot tune this variant (clean synthesis has no smear), which
  is exactly why it is registered blind.
- **Anchors**: letter-lands and eat-all-the-clocks re-run through the
  full pipeline (re-transcription included); arm A must reproduce
  Study 20's firing record exactly.

Notes channel: the bench's standard (non-drum stems summed,
peak-normalized, Basic Pitch) — on mop-heart that includes the Vox stem,
on peaceful-dreams the Ambient Layers stem; disclosed, no per-song
exceptions. Model roots: nchord perBarRaw, as Study 20.

## The held-out protocol

1. This commit (brief, src/study20b/, tests, runner) lands first.
2. The charts for peaceful-dreams and mop-heart are then fetched from
   the app's public pages, committed VERBATIM (file + URL + retrieval
   time), and converted to corpus/mmkk-charts-20b.json (slug, bpm,
   meter, sections of per-bar chord arrays — mmkk-charts.json's shape).
   The conversion is mechanical transcription of the chart; any
   judgment call it needs is written down in that commit.
3. The run follows. Nothing in steps 1's files changes after step 2.
4. Alignment sanity (registered now): a held-out song enters the grade
   only if its DTW bar grid is strictly monotone and spans at least
   60 % of its mix; a song failing that is reported UNALIGNABLE and
   excluded, with the gate evaluated on the remaining fires. A meter
   the pipeline does not support (not 4/4-shaped Meter4) is the same
   exclusion.

## Gates

- **S20B-G1 (the point)**: arm A's combined strict precision over the
  held-out songs is at least **0.75**, evaluated only if A fires at
  least **10 times** there. Fewer than 10 fires is a registered outcome
  of its own: INSUFFICIENT EVIDENCE — the study completes, reports, and
  makes no ship recommendation in either direction.
- **S20B-G2 (anchors)**: the full-pipeline re-run reproduces Study 20's
  arm-A record exactly: letter-lands 23 fires / 22 right, eat 12 / 7.

Registered decision rules: if G1 passes, the app may ship the hint with
the measured held-out precision as the card's number. Arm B is
recommended over A only if B's combined held-out precision is at least
A's AND B fires at least as often; otherwise A stands and B is reported.
No constant of either arm changes in this study under any outcome.

## Spend fence

**$0.** Local CPU (~5 minutes of transcription per song, four songs).

## Predictions (scored in the report)

1. G2 reproduces exactly.
2. Arm A fires 10 to 35 times combined on the held-out songs.
3. G1 passes, precision 0.75–0.95.
4. Arm B fires at least as often as A (the floor removes phantom
   evidence, so absences are easier to satisfy) at precision within
   0.10 of A's.
5. Root-conditioned precision on the held-out fires is ≥ 0.85.

## Disclosure

Analyst Claude Fable 5. Zero model-API calls; every grade mechanical and
committed before the run; the held-out truth is unseen at registration
and its retrieval is recorded. The bench fetches the charts from the
app's public pages (public by URL) and does not touch the app's
database. The frozen rule is Study 20's committed instrument, called,
not copied.
