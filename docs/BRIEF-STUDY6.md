# BRIEF — stem-bench Study 6 (micro): the warning heuristic, validated

**Pre-registration, committed before the evaluation runs.** Zero model
spend: every input already exists.

stem-shovel shipped `chartReadWarnings` (utils/chartReadWarnings.ts,
v0.19x, from the Study 3 correction + Study 5 briefs): a chart-read
summary whose key signature calls for ≥ 2 accidentals while none of
its ≥ 8 chord symbols carries one is flagged as accidental-dropping
PDF generation. The heuristic has never been measured. The bench holds
the perfect corpus: model reads of the SAME engraved pages in
corrupted form (the archived pre-correction PDFs, accidentals
silently dropped) and clean form (the corrected re-runs) — Studies 3
and 5, reader texts on disk.

## Instruments (committed, pinned by test)

- **H-shipped** — the production heuristic, ported verbatim.
- **H-letters** — a registered refinement to test alongside: flag when
  ≥ 2 chord tokens are rooted on one of the key signature's OWN
  altered letters (the first n of F C G D A E B for sharps, B E A D G
  C F for flats) yet carry no accidental, with the same ≥ 8-chord
  floor. Rationale: in E♭ major an "E", "A" or "B" chord is alien —
  those letters are what the signature flattens — while D major's
  natural chords (D, G, A, Bm, Em) are honest. The shipped rule's
  all-or-nothing accidental count cannot tell those cases apart.

## Corpus and expected labels (mechanical, from the committed specs)

Reader texts, grouped by page condition:

- **Corrupted**: results/archive/study3-dpdf-accidentals-confounded/
  (10 readable items × 4 models) and
  results/archive/study5-pdf-accidentals/reader-dpdf.json (12 items,
  fable).
- **Clean**: the current study3 D-pdf cells (10 × 4 models), the
  study5 reader D-pdf cells (12, fable), plus every D-image cell
  (clean by construction) as additional quiet-side data.

Per item the truth spec decides detectability: a corrupted page is
**detectable** iff its maximum key signature is ≥ 2 accidentals AND
its true chords include ≥ 2 rooted on altered letters (otherwise
nothing chord-visible was corrupted and silence is correct, counted
separately). Primary analysis on the production reader (fable);
other models' reads reported as robustness.

## Registered measures

Per heuristic: **hit rate** on detectable corrupted reads, **silence
rate** on undetectable corrupted reads, **false-positive rate** on
clean reads (the number that matters for product trust), per-model
robustness, and the named false-positive anatomy. No gate — this is a
validation whose output is a measured recommendation either way.

## Predictions (registered before evaluation)

1. H-shipped catches most detectable corrupted reads (≥ 80%) but
   false-positives on clean reads of natural-chord sharp-key items
   (copper-line and drift-4a class: D major, ≥ 8 chords, zero
   accidentals honestly) — the comment in the production source
   already worries about exactly this.
2. H-letters matches H-shipped's hit rate and removes those clean
   false positives (its altered-letter condition is what those items
   honestly lack).
3. Haiku's stub reads defeat both heuristics' 8-chord floor (silent,
   neither hit nor false alarm) — a floor effect worth one sentence
   in the brief-back.

## Disclosure

Analyst Claude Fable 5. Zero new model calls; all inputs are committed
or archived reader texts from Studies 3 and 5. Both instruments and
the expected-label derivation are committed and tested before the
evaluation script first runs over the real texts.
