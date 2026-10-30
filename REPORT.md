# stem-bench REPORT

## Study 14 — the shipped alignment and reconciler validated; the same-piece constant caught before release (2026-10-30)

All four asks from the stem-shovel responses, on verbatim ports at
their pins (the alignment set at 39c25b5, the reconciler utils at
5b2288f8), registered at 3cfd698 with one amendment. ≈ $0.40.

**G1 PASS, exact.** Their parsers round-trip the bench's material
perfectly: `chordChartBars` reproduces both MMKK transcriptions bar
for bar and section for section from the band-markdown conventions
(76/76, 86/86), `chartBars` reads a Study 8 marked measure summary to
its spec (24/24, marks, tempo, meter), and the 6/8-in-eighths
convention renders exactly the app's bar seconds (2.000 s at 180).
Future bench studies can feed production's own parsers.

**G2 FAIL — and this is the study's reason to exist: the shipped
same-piece constant rejects the band's own correct charts.** The
tritone-ratio landscape: right charts score 24–49 on synthetic audio
but **2.04 and 2.53 on the real recordings — both below the shipped
threshold of 3** — so `samePiece` comes back false on correct charts,
every placement gets hedged, and the song-check's card would tell the
band their own chart "does not seem to match." Amendment 1 added the
missing measurement, the real-domain wrong pairs: **1.17 and 1.24.**
So on real audio — the only domain production sees — the control DOES
separate (wrongs ≤ 1.24, rights ≥ 2.04), just not at 3.
**Recommendation: ALIGNMENT_SAME_PIECE_RATIO ≈ 1.6** (the real-domain
midpoint), with the honest caveats attached: n = 2 per class, one
band, and the margin is a factor of ~1.6 rather than Study 12's order
of magnitude — worth a second check (the local-cost median is already
computed and separates further) before trusting it at scale. The
synthetic numbers that inspired the 3 were real but belong to a
domain production never sees — the home-field lesson, third
appearance.

**G3 FAIL by letter, via that same constant and nothing else.** The
shipped aligner itself, fed through its own parser from the markdown:
six of eight non-edge boundaries within 0.11 s of the band's declared
starts (Study 12's precision reproduced through the production code
path), edges hedged as designed, 1.1 s to align a 141 s song in Bun.
The only failing clause is `samePiece` — the constant again.

**G4 PASS, and production's configuration is strictly better than the
bench's.** The reconciler under the shipped `thinking: adaptive,
effort: low`: letter-lands **44/76 (fixes 15, breaks 0)** against the
bench's thinking-off 41/76 (12/0), in half the output tokens — the
thinking mode eats the per-bar narration that forced Study 13's cap
amendment. The exploratory song improved too (28/86, 4/0). Zero
breaks across every reconciler run in two studies.

**Arm D — the edge fixes, measured (their ask 3).** The FIRST-ONSET
snap repairs both real intros outright (letter-lands' first section
placed 7.15 s with the declared start at 0 and first audible energy
at 0.00; eat 2.41 → 0.00). The LAST-SOUND rule, stated as "the final
section starts at the last audible sound minus the chart's final-
section duration," repairs letter-lands' 9.11 s outro miss to
**0.03 s** — but would worsen eat (whose outro length the bench's
transcription guessed wrong), so it must ship gated on samePiece and
hedged like the rest. Both are one-line additions to
`alignedPlacements`.

Prediction scorecard: 1 right; 2 WRONG in the direction that matters
(the real-domain collapse of the tritone ratio was not predicted —
the amendment exists because the registered pairs couldn't see it);
3 half (the aligner clause passed; samePiece failed); 4 right; 5
half-right (the last-sound rule exceeded expectations on the clean
chart and inherits chart quality exactly as feared).

### Verdict delivered

Do not release the alignment with the constant at 3 — it hedges
everything on real audio and mislabels correct charts as mismatched.
Set it near 1.6 (or add the local-cost check) and both real behaviors
come right: correct charts place with sub-tenth mid-song precision,
wrong charts still refuse. Ship the two edge rules behind the
samePiece gate. The reconciler needs nothing: the production config
out-performs the bench's measurement of it.

### Spend

≈ $0.40 of the $2 fence (arm E's two calls). Program spend since
Study 9: ≈ $1.10.

### Disclosure

Analyst Claude Fable 5; arm E measures claude-fable-5-1 (family
disclosure as before; mechanical grades committed first). Ten files
ported verbatim; one amendment, registered before any verdict.

## Study 13 — the chord path meets real audio, and the reconciler earns its keep (2026-10-30)

The reconciler question ("would it still have value?") answered as a
registered two-arm conditional (e932906): first measure what it would
improve, then run it only if there is headroom. Study 12's artifacts
made the measurement possible — the bar grid in recording seconds and
bar-aligned chord truth on real audio.

**Arm 1 — the finding that matters most: production's chord path
scores 38.2 % on a real recording.** Basic Pitch + the v0.142 matcher
— 95.8 % at home on the synthetic bench, the Study 10 winner over
ChordMini — reads the real letter-lands at 29/76 bars (strict-first
20/76; the registered power-chord allowance did real work, 9 bars),
and the exploratory eat-all-the-clocks at 27.9 %. The home-field gap
is not the predicted 15–30 points; it is nearly 60. Real synth pads,
guitar voicings and sustained textures are what Study 1's fixture
gotcha warned about (rich harmonics defeat the transcription), now
measured instead of suspected. The 80–83 literature plateau was never
the matcher's to claim. The registered trigger (< 90 %) fired without
drama.

**Amendment 1, our recurring own-harness lesson:** all four pilot
cells truncated at the registered 4000-token output cap — the models
narrate per-bar before the JSON — the exact budget-conflates-with-
failure class Study 8's Amendment 1 hit. Cap to 16000, re-run under
the fence; the truncated run stays in history. (Fable also ignores
the temperature-0 deviation — the gateway says unsupported —
disclosed.)

**Arm 2 — S13-G2 PASS for both models, and the agreement-trap clause
came back spotless.** One text-only pass over the key, the detected
chords and production's own per-bar note lines:

| model | reconciled | baseline | fixes | breaks |
|---|---|---|---|---|
| claude-fable-5-1 (production) | **41/76 (53.9 %)** | 29/76 | **12** | **0** |
| gemini-3.5-flash | 36/76 (47.4 %) | 29/76 | 7 | 0 |

+15.7 points for the production model with ZERO right-answers broken
across 27 changed bars — the double-fix gate (fixes ≥ 2× breaks),
registered against Study 9's agreement trap, passed at infinity. The
exploratory song moved the same direction (fable +3, 0 breaks);
gemini burned the full 16k budget narrating 86 bars and never reached
the JSON there — the budget failure mode of that family (Studies 2
and 8), not the over-editing one I predicted for it.

Prediction scorecard: 1 right in direction, wrong in magnitude (the
real gap is far larger than the 60s–80s guess); 2 right (fable
passes; changed 27/76 just over the "under a third" sub-claim); 3
wrong in the instructive direction (gemini passed the gate cleanly on
the gated song and failed by budget, not by over-editing, on the
other); 4 right.

### What production does with this

Two findings, in order of weight. First: **chord drafts on real user
audio are far weaker than any synthetic number suggested** — 38 %,
with the transcription (not the matcher, not the model) as the
binding constraint; that reframes the chord-hint feature's honest
quality bar and is worth a UI hedge regardless of anything else.
Second: the reconciler is real and cheap — a text-only pass by the
model production already runs for chart drafts lifts the real-audio
number 16 points with zero breaks for about a cent a song. Ship shape:
reconcile inside the chart-draft job (symbols in, symbols out), keep
the detector's chord when the model's answer parses to nothing, and
cap output generously (Amendment 1's lesson). The ceiling remains the
transcription: 54 % reconciled is better, not good — if the chord
feature matters, the next investment is Basic Pitch's successor on
real timbres, not more model.

### Spend

≈ $0.60 of the $3 fence (including the truncated first pilot). The
program's model spend since Study 9: ≈ $0.70.

### Disclosure

Analyst Claude Fable 5; arm 2 measures claude-fable-5-1 (same family),
tolerable as in Study 1 because every grade is mechanical, committed
and tested before any call. One registered trigger, one amendment,
truncated run preserved.

## Study 12 — chart-to-seconds by synthesize-and-align: code takes the model's last job, and the edges talk back (2026-10-30)

The candidates memo's recommendation A, registered by the bench
(e431bf6): render the chart as sustained chord pads at the declared
tempo, chroma-DTW the render against the recording, and every bar —
hence every section mark and chord — gets a timestamp with no model.
This was the one hearing job Study 8 had left to the LLM (boundary
placement in seconds). Zero spend: a 92.9 ms chromagram on the port's
own fft, DTW with non-stalling reference steps and a subsequence mode
for count-ins and tails, and a pad renderer that knows nothing the
chart doesn't state. Real-arm truth: the bench's disclosed
transcriptions of the public MMKK charts (letter-lands gated —
unambiguous, duration cross-checks; eat-all-the-clocks exploratory
with a disclosed −26 s reading mismatch; peaceful-dreams excluded as
untranscribable — a real-world limit of chart-driven anything).

### Results

**G1a PASS at exactly the letter: 532/560 bar starts (95.0 %) within
±0.25 s.** By class the errors live where physics says: reverb tails
(worst 1.32–1.44 s) and dense mixes; the mediant modulations were
perfect to the hop. **G1b PASS 8/8 — the headline.** Every contrast
section boundary within ±0.5 s, the precision metric every listener
failed (Study 8's models ≈ 0/8 there, Study 10's neural segmenter
0/8, the literature's best model reader 0.423 at ±0.5 on real music).
Reported beside it: **7/8 tempo/key-change boundaries at ±0.5 s** —
boundaries that are structurally invisible to stem activity and that
blind models found half the time. DTW does not care that the tempo
moved; that is the method.

**The wrong-chart probe: 6/6, separations 8.6–16.3×.** The right
chart's path cost sits an order of magnitude under the wrong one on
every registered pair. The "is this chart this recording?" question —
which production currently asks the model to answer by ear — is a
number.

**G2 FAIL by one boundary, and the anatomy is the finding.** On the
real letter-lands recording: 8/9 boundaries at ±4 s (parity with the
neural segmenter), 6/9 at ±0.5 s against the registered ≥ 7/9. But
look at where: the SIX mid-song boundaries landed at **0.02–0.11
seconds** — precision no listener in eleven studies has approached on
a real recording — while the three misses are the edges: the first
boundary (3.6 s, the subsequence start absorbing the real intro), the
second-to-last (1.9 s) and the outro (9.1 s, where the chart's 8-bar
outro reading meets a 3-second performance tail). Alignment is
sub-tenth-second wherever the performance follows the chart and fails
exactly where the chart stops describing the performance. The
neural segmenter edges it 7/9-to-6/9 at ±0.5 on this one song by
being merely mediocre everywhere instead of perfect in the middle and
lost at the ends. eat-all-the-clocks behaved exactly as predicted:
clean until the bench's uncertain Bridge reading (0.07–0.24 s), then
2.0 → 8.0 s adrift, re-anchoring at the outro — a wrong transcription
degrades placement locally and visibly, which is what a shipping
path-cost/edge-confidence gate would catch.

Prediction scorecard: 1 right (including the tempo-change tracking);
2 half — the error SHAPE was predicted ("where the performance
departs from the chart, the outro tail") but the gate count missed by
one; 3 right in full; 4 right in full.

### What production does with this

Ship guidance: alignment takes placement, behind two mechanical
gates — the path cost (the probe's 8.6× floor separates right from
wrong charts) and an edge flag (first/last boundaries carry the
chart-fidelity risk; show them hedged, as the rung picker does for
tempo). The model's remaining role in this feature, if the edge flag
is accepted as UI: nothing. The probe ships separately as the
same-piece check, replacing the by-ear clause in `askAiAboutMix`.
Real-arm honesty: the method is only as good as the chart and the
transcription — peaceful-dreams could not even be transcribed — so
chart-quality is now the binding constraint, which is a data problem,
not a hearing problem. The program's arc completes: every hearing
task measured across twelve studies now has a code-or-data answer
that beats or matches the model, except the one thing the models
genuinely hear (texture contrast, Study 8) — and code took that too
(Study 9's activity detector on stems; this study's alignment from
charts).

### Spend

$0.

### Disclosure

Analyst Claude Fable 5. No model measured or consulted; the MMKK
transcriptions were committed before any alignment ran; declared
starts touched scoring only.

## Study 11c — the declared-meter gate validated; the bench's own rule retired on the record (2026-10-30)

The three validations stem-shovel requested for its patch at 2cf70cb
(the ×3 rung; the 3:2 and ×3 gates moved to the DECLARED meter, off
the detector's flag entirely; alternates labels fixed). Verbatim port
pinned; zero spend; arms 1 and 3 are pure functions over Study 11b's
stored reads, arm 2 renders three new items. The bench registered the
prediction of its own proposed rule's defeat before running.

**C1 PASS, perfectly.** The declared-meter gate over the full 11b
corpus: 0 of 332 corrected wrong rows accepted, no true-count match
lost, and THREE gained over the shipped v0.200.0 rule — lilt-a and
verb-y match at ⅔ through their declared 6/8 (data where the acoustic
margin missed), and mop-heart matches at ×3 through its declared 3/4:
"224, counted three to the bar." peaceful-dreams stays loud, now by
data instead of by luck.

**C2: the mirror did its job twice over.** The bench's declared-lag
rule accepted **3 of 3** wrong values, exactly as the registered
prediction traced — on straight running eighths, a ⅔-wrong declared
tempo puts its lag's third on the eighth grid and every clause of the
bench's amended rule (BEAT_FLOOR included: the declared lag sits on
the grid too, r̂ 0.64–0.66) licenses the rung. **The bench's rule is
retired on the record, by the measurement its proposer registered.**
The gate verdict is FAIL by letter, though, on its other half: the
declared-meter gate accepted 1 of 3 — and the anatomy matters. On
mirror-138 the DETECTOR itself misread the straight eighths at 92
with a compound flag (at 92, a third of the lag IS the 138 eighth —
the peaceful-dreams confound, now reproduced on synthetic material),
and the wrong declared 92 matched the wrong detection DIRECTLY at
rung 1, which no gate governs. A ladder cannot reject
declared-equals-detected; the failure class is Study 11's lesson 6
again (wrongness defined against truth, compared against a wrong
detection), not a gate leak — the gates themselves never opened.

**C3 PASS.** The ×3 rung opens nowhere but triple-declared meters
(0 leaks, 0 off-tolerance accepts); the exact-3× rows are accepted on
all 5 triple-declared items — the ×2-class count ambiguity, now
quantified, living where it belongs: in the rung picker.

**The bonus finding: mirror-138.** The mirror fixture incidentally
built the first SYNTHETIC reproduction of the detection-side ⅔+false-
compound confound (truth 138, detected 92 "6/8", the true tempo on
the alternates at strength 0.96). stem-shovel gains a regression
fixture for the detector confound that previously existed only on one
real recording — and the patched comparison surface already contains
it correctly: the declared-meter gate refuses to call 138-vs-92 a
count, so the warning stays loud.

Prediction scorecard: 1 right in full; 2 half — the declared-lag 3/3
exactly as traced, the declared-meter 0/3 missed (1/3 via the
collision class the prediction did not anticipate); 3 right in full.

Verdict to stem-shovel: ship the patch to production as is. The
declared-meter gate strictly dominates both its predecessors on
everything a gate controls; the one C2 accept is detection-side and
pre-existing, with mirror-138 as its new regression fixture.

### Spend

$0. The ladder thread closes at five studies (10, its amendment, 11,
11b, 11c) for ~$0.08 total, all of it Study 9's pilot.

### Disclosure

Analyst Claude Fable 5; verbatim port pinned at 2cf70cb; no model
measured or consulted; the registered predictions included the
bench's own rule losing.

## Study 11b — the shipped tempo ladder: the margins are honest, the confound shipped (2026-10-29)

Requested by the stem-shovel side and run on their shipped v0.200.0
(verbatim port at 79ed4def): the sub-beat test (1.15 margin, 0.55
triplet share), the super-beat test (1.05 margin, 0.2 floor, pulse
re-picked at 1.5L), and the shipped tempoLadderMatch, over the
Study 11 corpus, a new 15-item swing-stress sweep (ratios 0.60–0.70 ×
three tempi, the addendum's request) and the lesson-6-corrected
wrong-tempo set. Zero spend. One disclosed pre-registration smoke
shaped the predictions.

**V3 PASS, 15/15 — the triplet-share argument is validated.** Not one
swing item at any ratio or tempo read compound; every tempo exact.
TRIPLET_SHARE 0.55 (their AM-GM "swing cannot exceed 0.5" argument)
holds across the full sweep, including 0.67 triplet swing where
Study 11's sketch rule had read 3. **V4 PASS, 0/332** false accepts
through the shipped ladder with the corrected generator — the
generator fix retro-confirms Study 11's read that its by-letter
failures were collisions, not ladder defects.

**V1 FAIL 2/4, and the margin numbers say why it cannot simply be
tuned up.** lilt-b and contrast-c now detect their 6/8 EXACTLY (76,
subdivision 3 — two of Study 10's octave-family misses fixed at the
detector level by the super-beat re-pick). But lilt-a's super-beat
ratio is 1.029 against the 1.05 margin (their own fixtures measured
1.02–1.12 — the bench's lighter accents land at the bottom of that
band), and verb-y's reverb smears it to **0.991 — below 1.0, the straight
envelope's theoretical ceiling** (their own AM-GM bound; measured
straight items sit just under at 0.91–0.97), so no margin that is
safe by construction can reach it. [Corrected 2026-10-30: this
originally read "inside the 0.91–0.97 band," which 0.991 is not —
the operative claim is the ceiling, caught in the downstream's
sourcing pass.] The save is complete, though: on all 4
compound items the true dotted tempo sits ON the shipped alternates
ladder (strengths 0.97–1.07, top rung) — the rung-picker UI surfaces
the right count everywhere the 6/8 call misses.

**V2 FAIL — and this is the finding that matters: both scorable real
recordings flipped to 6/8.** mop-heart re-picked to 74.7 = 224/3, the
BAR pulse of a fast waltz counted in one. The hearing is musically
defensible (a bar of three IS a group of three) but the consequence
is a regression: declared 224 sat on the old detection's ladder at ×2
and sits on the new one's at ×3 — a rung the ladder does not have.
And peaceful-dreams' sub-beat test fired at the detector's own
⅔-wrong pulse — **Study 11 Amendment 1's confound, now in shipped
code**: at 96.7, L/3 IS the true eighth of the 145 grid, the
subdivision call is structurally unable to tell "compound here" from
"straight at 1.5× of here," and the shipped ladder then matched the
declared 145 at ×1.5 ON THE DETECTOR'S OWN CONFOUNDED FLAG — the
warning that Study 11's G1 required to stay loud goes silent, for the
wrong reason.

### Verdict delivered

Keep TRIPLET_SHARE and the ladder util as shipped (V3/V4 clean); keep
the super-beat re-pick (it fixed two items exactly). Two fixes named:
(1) the compound flag that EXCUSES a declared/detected 3:2 gap must be
evaluated at the DECLARED tempo's lag, not the detector's own —
Study 11 Amendment 1's rule, which separates lilt-a (compound at
declared 60, r̂ 0.72) from peaceful-dreams (straight at declared 145,
0.03); (2) fast triple meter needs either a ×3 rung or a
3/4-in-one expression — mop-heart's 74.7 is a defensible hearing with
no rung to land on. The 6/8 OUTPUT is not a stop-ship (false fires on
declared-straight real songs are contained by fix 1 at the warning
surface; the alternates carry the truth); the margin itself should
not be lowered (verb-y proves the bands overlap).

Prediction scorecard: 1 half-right (predicted 0–1 of 4, got 2 — the
re-pick works more often than the smoke suggested); 2 WRONG in the
instructive direction (predicted real recordings stay straight; both
flipped — the named false-6/8 risk materialized exactly where the
addendum said to stress); 3 and 4 right in full.

### Spend

$0. The program's four ladder-thread studies (10, Amendment, 11, 11b)
total ~$0.08, all of it Study 9's Q4 pilot.

### Disclosure

Analyst Claude Fable 5; verbatim port pinned at 79ed4def; the
development smoke disclosed in the brief; no model measured or
consulted.

## Study 11 — the tempo ladder rule: two gates pass, two fail by letter on their own measuring stick (2026-10-29)

Specified by the stem-shovel agent (its response to the playbook and
tempo-grid plan, c970245), finished and registered by the bench with
three disclosed restatements (18002cd): ratio tolerance (production's
shipped 2 % rule) instead of absolute ±3; verb-y replacing the dense
item in the six-miss list (that was N-beat's miss, not D-prod's); G4
redefined off Study 7's cells, whose registered wrong settings are
×2/÷2 by construction and would have failed the dry-run vacuously.
Zero spend: two pure functions — tempoLadderMatch (L-gated / L-open)
and a subdivision test at a named tempo hypothesis — over the stored
Study 10 detections, 37 items, 255 mechanically wrong declared values.

**Two instrument defects were caught by the first runs and fixed by
registered amendment before any result was accepted** — both now part
of the finding:

- *Amendment 1:* the slower-of-pair subdivision hypothesis is
  mathematically confounded — a straight song misread at ⅔ maps its
  true duple eighths exactly onto the slower pulse's thirds, so the
  license test read "compound" on the one item it exists to reject
  (peaceful-dreams). The hypothesis became the DECLARED tempo: the
  declaration is the claim under test, and there lilt-a's 60 is
  genuinely compound (r̂(L/3) = 0.72) while peaceful-dreams' 145 is
  straight (0.03).
- *Amendment 2:* at a bogus hypothesis tempo there is no beat peak at
  all (r̂(L) ≈ 0.0007 vs 0.36–0.75 for real pulses), the relative
  floor goes vacuous, and "r̂(L/3) > r̂(L/2)" degenerates to the
  autocorrelation main lobe — 22 of 33 wrong ×1.5 rows were licensed.
  A subdivision-3 read now requires the hypothesis pulse to exist
  (BEAT_FLOOR 0.1; three orders of magnitude of separation). A
  compound-count claim about a pulse that does not exist is no claim.

### Results

**G1 PASS, 5/5 + the rejection that matters.** Every count-class miss
from Study 10 recovers at its correct rung — both lilts, contrast-c
and verb-y at ⅔ on genuine compound evidence, mop-heart at 2 — and
peaceful-dreams, the true hearing error the review insisted must stay
an error, is correctly NOT accepted by L-gated (L-open accepts it:
the measured cost of ungated 3:2 rungs, exactly as the gate design
predicted).

**G3 PASS, clean.** Subdivision 3 on 4/4 compound items, 2 on all 31
straight items outside the swing pair; swing split honestly (swing-x
at 0.67 reads 3 — triplet swing IS a 3-feel; swing-y at 0.62 reads
2). The derived meter names 6/8 on all four compound items — the
first time the detector's vocabulary can say it — at the registered
cost of one swing item, confirming the review's "swing needs its own
flag" caveat.

**G2 FAIL by letter, 1/33 — and the 1 is a true value.** The one
accepted ×1.5 row is shift-b: declared 108 built as "wrong" from
section 1's 72 — but 108 IS the song's own second-section tempo,
matching the detection at rung 1. The wrong-value generator respected
only the first truth label of multi-tempo items. Across all 255 rows,
L-gated accepted zero genuinely wrong values; L-open accepted 30/33
of the ×1.5 rows — the measured justification for gating, exactly as
predicted.

**G4 FAIL by letter, 1/221 — an artifact of pairing.** The silenced
row is peaceful-dreams declared 192.9 (truth × 1.33) against the
already-wrong detection 96.7: 192.9 is the double rung OF THE WRONG
GRID. Wrongness was defined against truth while the comparison runs
against the detection; on the one item where the detection itself was
3:2-off, those diverge. Reported context: all 15 of Study 7's
registered wrong settings sit on the always-accepted rungs (they were
built as ×2/÷2) — the ladder reads them as "same grid, counted
differently," the ambiguity the rung-picker UI exists to absorb.

Sixth registration lesson, earned twice in one study: **a mechanical
wrong-value generator must respect every true label of an item, and
define wrongness against the value actually being compared** — truth-
anchored wrongness collides with multi-tempo songs and with wrong
detections, and both collisions score as false accepts that aren't.

Prediction scorecard: 1 right (5/5 + rejection); 2 right in direction
(L-open 30/33 ≈ the predicted ≥ 80 %), wrong by letter (gate 0 missed
via the collision); 3 right in full including the swing split; 4
wrong by letter via the pairing artifact it did not anticipate.

### The shipping question

By the response's own decision rule, a full pass ships build items
1–4 and a G2 failure drops the 3:2 rungs. Neither branch matches what
happened: the gates that failed, failed on defects of the measuring
stick, not of the ladder — zero genuine false accepts in 255 rows.
The bench's read: the evidence supports the full build list, and the
by-letter failures transfer to the generator, not the rule. Per
program discipline the gates are not re-thresholded; the call is
stem-shovel's, with this analysis on the table (and a corrected
generator is a one-line registered follow-up if wanted).

### Spend

$0. Two amendments, three runs, all local arithmetic.

### Disclosure

Analyst Claude Fable 5. No model measured or consulted; SUB3_FLOOR
and BEAT_FLOOR were set from disclosed development values; superseded
runs remain in git history (7ddce82 and the pre-amendment run).

## Study 10 — neural MIR baselines: the classical detector holds its ground (2026-10-29)

Drafted by the stem-shovel agent on its landscape review's evidence
(docs/LANDSCAPE-2026-10-29.md), finished and registered by the bench
(5e8913d): four published neural-MIR candidates — Beat This! small
(MIT), LinkSeg 7-class (CC-BY 4.0), ChordMini (MIT), and two
literature key-profile swaps — against production's hand-rolled
detector and template matcher, on 35 band items (the Study 4/8/9
corpus plus a 12-item hard set: swing, octave-boundary tempi, reverb,
dense, mediant modulations) and 20 chord songs (Study 1's 16 plus 4
extended-chord progressions). All weights hash-pinned and verified
against published tables; runners are vendored reference code; zero
LLM spend; three one-item development smokes disclosed in the brief.

### Results: all five gates FAIL — each in production's favor

**G-beat FAIL, with the study's most instructive nuance.** At the
registered ±1 bpm, D-prod is exact 29/33 to N-beat's 18/33. But
N-beat derives tempo from the median inter-beat interval on a 20 ms
frame grid, so its answers land at 142.9 for 140, 111.1 for 110 —
musically right, numerically outside the registered letter. A
disclosed, unregistered sensitivity read at Study 4's model-grade ±3
is a dead tie, 29/33 each — with different misses: both engines drop
the three 3:2 compound-meter items; N-beat alone halves one dense
item (the registered octave flag case) and smears two tempo-shift
items; D-prod alone misses the 6/8 reverb item. Fifth registration
lesson of the program: an absolute tolerance at DSP precision
measures the candidate's output quantization, not its hearing. What
the gate letter cannot take away: N-beat's beat F-measure at ±70 ms
is **0.892** (downbeats 0.867) — a per-beat grid production simply
does not have — and on the two pulseless pads it emitted 3 and 1
beats (tempo null), the honest answer D-prod structurally cannot give.

**G-meter FAIL.** On 4/4 and 3/4 items N-beat's downbeat-vote meter
is 21/29 against D-prod's 27/29, and it named 6/8 on only 1 of the 4
compound items (it tracks the eighth-note pulse there, so its
downbeat spacing votes 6 only once). The draft's hope that the
neural tracker brings 6/8 for free is dead on this corpus.

**G-key FAIL, exactly as predicted.** Krumhansl 29/33,
Albrecht–Shanahan 29/33, Temperley 30/33 (+1, gate needed +3, zero
new confusions — Temperley's win is mod-c's modulation target). All
four shared misses are modulating items where the global key is a
blend by construction. On synthetic diatonic pop the profile tables
are interchangeable; the literature's gap lives on real recordings —
deferred to the MMKK amendment.

**G-seg FAIL, decisively — the loop-invention disease is not cured
by graph attention.** LinkSeg placed **54 false boundaries across the
22 single-section items** (~2.5/item), worse than the chart-anchored
LLM's ~1.2/loop in Study 8, and found 5/8 contrast boundaries at ±4 s
(0/8 at ±0.5 s) against the Study 8 chart arm's 8/8 and Study 9
D-activity's 8/8 with zero inventions. The published operating point
(8 s peak window, tau 0) trades everything for recall on real-music
form and still misses a third of the bench's plainest boundaries. On
this fixture the free stem-activity detector from Study 9 beats the
published neural segmenter outright.

**G-chord FAIL overall; the hard set splits it.** Full-vocabulary:
the production matcher 483/504 bars to ChordMini's 418 — the neural
model hears triads where the truth says maj7/m7 (full-vocab 38/64 on
the hard progressions vs the matcher's 59/64). Maj-min: matcher
490/504 vs 470/504 overall, but on the hard progressions ChordMini
edges it 61/64 to 59/64, and one song is a catastrophe worth naming:
static-bloom (the N.C.-bar song) collapsed to 4/28 under ChordMini
while the matcher read 27/28. Basic Pitch + templates, tuned on this
synth, is simply the stronger chord reader here; the matcher's
weakest clause (sevenths) was already fixed by Study 1's
missing-tone penalty.

**Budget:** every candidate fits (N-beat 8.3 s per 90 s of audio on
this CPU — inflated by the registered export-defect workaround of
250-frame chunks — N-seg 5.4 s, N-chord 3.7 s, all ≤ 10 s; D-prod
1.2 s and 0 MB). Deployment was never the blocker; accuracy was.

Prediction scorecard: 3 right (G-key, including the
Temperley-mod-c detail); 1 wrong at the registered letter and right
at the disclosed ±3 read; 2 wrong in both clauses; 4 wrong except the
hard-set maj-min edge; 5 half-right (contrast recall failed as
predicted, but the 0-false clause failed much harder than predicted);
6 wrong in the happy direction (N-chord fit the time budget).

### What production does with this

Nothing ships. The question the landscape review raised — "is the
app hearing with obsolete code?" — closes with a measured answer: on
truth-by-construction material, production's summed-envelope
autocorrelation, per-stem meter vote, Krumhansl templates and Basic
Pitch + v0.142 matcher beat or match every published candidate tried,
at zero weight bytes. Honest boundary: this corpus is synthetic
additive-tone pop, the material templates were born on; the review's
neural-model gaps were measured on real recordings. The registered
MMKK real-recordings amendment (pending Kevin's credentials) is where
these models get their home-field rematch — and where N-beat's ±3
tie, its 0.89 beat grid, and its honest pulseless nulls suggest the
beat tracker, alone among the candidates, could still earn a place.

### Amendment 1 — the home-field rematch on MMKK's real recordings (2026-10-29, same day)

Kevin authorized the fetch and the catalog turned out fully public —
no credentials needed. The amendment (registered 2ed4d15 before its
run) scored the instruments against the band's own declarations on 7
real songs (4 full-band with stems, settings and DECLARED section
start times; 3 single-stem sketches, blank labels unscored). The
synthetic gates stand; this table answers the domain question the
synthetic arm could not.

**The domain warning was real — in both directions.**

- **Sections flip.** LinkSeg, which invented 54 boundaries on
  synthetic loops, finds real form: 29/33 declared boundaries at ±4 s
  (letter-lands 8/9 with ZERO false boundaries; mop-heart 7/7 +1),
  consistent with its published ~78 % at 3 s. Study 9's D-activity,
  perfect on synthetic arrangements, drops to 25/33 with 19 false on
  real stems (its detected-grid anchoring and real dynamics don't
  mix). For songs without charts, the 1.5 MB CC-BY segmenter is now a
  measured candidate; with a chart, Study 8's chart-anchored model
  still holds the names.
- **Tempo: production's failure classes are real-world classes.** At
  ±1, D-prod 2/4 vs N-beat 1/4 — but D-prod's two misses are GROSS:
  exactly half of mop-heart's declared 224, and exactly 2/3 of
  peaceful-dreams' declared 145 (the 3:2 confusion, now on a real
  recording). At the registered ±3 read N-beat leads 3/4 to 2/4, its
  one miss being 214.3 vs the declared 224 (4 %; the disagreement
  flag notes D-prod's exact-half supports the declaration, so this
  one is scored a real miss, not a disputed label). n=4 — direction,
  not proof: the trained tracker degrades gracefully where the
  autocorrelation fails in octave classes.
- **Meter holds for production** (4/4 vs N-beat's 3/4 — N-beat read
  the real 3/4 waltz as 4/4).
- **Key: the profile question closes hard.** Krumhansl 4/6 against
  Albrecht–Shanahan 1/6 and Temperley 1/6 — the literature profiles
  collapse into parallel-minor and subdominant flips on real mixes
  (F# major → F# minor, F → Bb). The synthetic arm said
  "interchangeable"; the real arm says production's choice is the
  right one. G-key's FAIL is now a confirmed keep-KK.

Amended ship guidance to stem-shovel: keep the detector exactly as
is for tempo (the 3:2/half classes are known, and the neural
alternative isn't ±1-accurate on real material either), keep
Krumhansl without a second thought, and consider LinkSeg — not the
synthetic-corpus winner D-activity — as the no-chart section
fallback, behind the chart when one exists.

### Spend

$0 in both arms. Model downloads ~30 MB hash-pinned; the MMKK fetch
~800 MB of public audio into a gitignored folder (hashes committed);
everything else local CPU.

### Disclosure

Analyst Claude Fable 5. No language model measured or consulted;
every grade mechanical, committed and tested before the full run; the
±1→±3 tempo sensitivity read is disclosed as unregistered analysis,
clearly separated from the registered gate verdicts.

## Study 9 — stem-aware analysis: the stems name the form, the sum keeps the time (2026-10-29)

Drafted by the stem-shovel agent, finished and registered by the bench
(c36f7fe): does reading the uploaded stems individually beat the summed
mix that production's browser detector and both AI features actually
use? Four zero-spend instruments over 21 items (the 15 pulsed Study
4/8 specs plus 6 new misleading-stem specs whose fourth part — rubato
lead, off-grid pad, noise/room track, double-time comp — is designed to
pollute the summed onset envelope), stems shuffled so nothing knows
which is the drums; plus a 12-call AI side arm. D-prod is a verbatim
port of stem-shovel analysis.ts at a99fb18, rate-parametric and pinned
at the bench's 22050 Hz (registered deviation).

### Results

**S9-G1 PASS, perfectly, on both grids.** D-activity (per-bar RMS per
stem; boundary = the active-stem set changes and holds 2 bars) found
**8/8** contrast boundaries with **0** false boundaries on the loops
AND on the change items — identically on the truth bar grid and on the
production-portable detected grid. The models' Study 8 blind score on
the same items was 7-8/8 with 3-6 inventions per uniform loop; the
chart-anchored production model still invented ~1 boundary per loop.
The activity detector cannot invent structure on a loop *by
construction* — the active set never changes. Its blindness is equally
structural: all 6 tempo/key-change boundaries (arrangement unchanged)
are invisible, as predicted — those belong to the chart. One honest
caveat the mislead class surfaced: a noise/room track with slow swells
toggles its own activity bit (+2 false on mislead-noise), so a shipped
version wants the atonal-stem guard the brief's Q2/Q3 outputs provide.

**S9-G2 FAIL, decisively — and the failure is the finding.** The draft
asked whether keeping the sharpest single stem's tempo beats the sum.
It does not: D-prod exact **18/21**, D-stem-tempo exact **11/21**, with
7 regressions (5 of them octave errors) and 0 rescues. The sum was
robust to ALL six misleading extras — pad, noise, rubato and both
double-time comps left it exact — while the sharpest-single-stem rule
repeatedly picked a bass or comp whose own autocorrelation is cleanest
at half time. Summing the stems' onset envelopes is not a compromise
production settled for; the cross-stem reinforcement at the true period
IS the tempo signal. D-prod's only misses are a shared systematic: the
two 6/8 lilts and 3/4 contrast-c read at 1.5× (the dotted-pulse 3:2
confusion), which no stem-aware variant fixed either. The registered
octave-disagreement flag fired on 10/21 items including clean ones
(a half-time bass is normal music, not a hazard signal) — useless as
shipped, reported as measured.

**S9-G3 UNEVALUABLE (registered fallback), with a descriptive warning.**
Production's key detection was right 20/21, so there is nothing to
separate — but the one wrong answer (mod-a's global key on a modulating
item) carried stem agreement **1.00** while production's own
correlation margin ranked it 3rd-lowest of 21. On this corpus the
agreement score is not just unproven, it pointed the wrong way on the
only error available.

**Q4 pilot (gemini-3-flash, 12 cells, ~$0.08):** giving the model the
isolated bass+comp stem instead of the mix helped nowhere and hurt
twice (waltz-a and mislead-rubato flipped right→wrong; one stem cell
unparseable). Tempo answers were the familiar 120/126/128 genre prior
in both conditions — Study 4's reading-not-hearing, unchanged by stem
isolation. Prediction 4 said ≤1 item changes; 2 changed, both for the
worse — the direction (no help) held, the count missed.

Prediction scorecard: 1 right in full; 2 refuted in both halves (the
sum survived the double-time comps, and sharpest-stem regressed); 3
right (near-ceiling keys, G3 unevaluable) except that it guessed the
agreement floor would sit on mislead items — the real floor was
indifference to the one actual error; 4 right in direction, wrong in
count.

### What production should do with this

Ship nothing for tempo and key: the summed-envelope detector beat every
stem-aware variant tried against it, and its one weakness (3:2 on
compound meters) is not fixed by stems. Consider shipping D-activity as
a browser-side section detector: zero model cost, structurally immune
to the loop-invention failure that survived even chart anchoring in
Study 8, with the model kept for names and the chart for harmonic
boundaries; guard it against sustained-noise stems. The Q4 matrix
(84 calls, ~$1, fenced) remains open if closing the stem-to-model
question across both Study 8 models is wanted.

### Spend

Zero for the gates; Q4 pilot ~$0.08 of the $8 cap. Matrix not run
(awaiting go-ahead; the gates did not need it).

### Disclosure

Analyst Claude Fable 5; the Q4 model is Google's, outside the
analyst's family. Every grade mechanical and committed before any
scored result; one pre-registration smoke of the instruments on
contrast-b disclosed in the brief and pinned in tests.

## Study 6b — the key-in-force warning, registered and validated on unseen pages (2026-10-29)

**Registered by the stem-shovel agent, run by the bench** — the
program's first study authored by the production side. stem-shovel
shipped Study 6's exploratory key-in-force rule (their commit
b2452d6) and then declined to trust it: a rule designed on the data
it is scored on fits that data. Study 6b gave it reads it had never
seen: 24 new charts engraved clean AND corrupted through a registered
generator option reproducing the accidental-dropping path, with each
of Study 6's named false-positive classes represented 8 items strong
(honest bare-chord sharp/flat keys, modulating charts, and
accidental-carrying charts whose corrupted pages are detectable).
Verbatim port pinned at their commit; a TESTED only-quieter property
between the shipped rule and the bench's exploratory variant; a
zero-spend reproduction check gating the run (it reproduced Study 6
exactly: 10/10, 0/12, 1/42). 48 reads by the production reader,
pilot-fenced; ~$1.60 of the $6 cap.

**Both gates PASS with a perfect sheet.** H-prod on the production
reader: detectable corrupted reads **8/8** caught, undetectable
corrupted reads **16/16** silent, clean reads **0/24** flagged —
zeros in every false-positive class including the modulating charts
where the pooled rule failed and the honest sharp-key charts where
the shipped-before-refinement rule failed. The extra condition
stem-shovel added when productionizing (no flag if any chord carries
an accidental) cost nothing: not one read where the bench's variant
flagged and theirs stayed silent. Predictions 1–4 all held, with
prediction 2's allowed miss (a reader restoring an accidental from
context) never materializing.

The shipped warning is now validated on data it was not designed on:
100% hit, 100% silence, 0% false alarm, on the production reader.
The loop this closes is the program's longest: Study 5's anatomy
found the corruption class → Study 3's correction described it →
stem-shovel shipped a heuristic → Study 6 measured it and suggested
the refinement → stem-shovel shipped the refinement and registered
its own validation → Study 6b confirms it. Four hand-offs, each side
checking the other.

Disclosure: analyst Claude Fable 5; the reader is claude-fable-5-1;
every instrument, label and page committed before the first read, by
the agent whose rule was under test — and the bench ran it without
adjustment.

## Study 8 — section detection: they hear texture, not form (2026-10-28)

**Question.** The last unmeasured AI feature, and the loophole test:
Studies 4/7 showed the listening layer reads rather than hears, but
what it DID register blind were gross structural events — and section
boundaries are gross structural events. Registered in
docs/BRIEF-STUDY8.md: the v0.192.0 `detectSectionsWithAi` ported
verbatim, Study 4's mixes plus three new sparse/dense contrast mixes
(boundaries a human hears instantly, names and seconds true by
construction), arms blind / +vocabulary / +marked chart, 90 cells,
two models, ~$0.60. Amendment 1 before publication: the bench's own
2000-token cap truncated the rambling production model mid-JSON in 16
cells — the budget-conflates-with-failure shape Study 2 caught in
kimi, this time in our own harness — cap raised, failed cells re-run.

**The loophole is real: models hear texture.** Blind, on the contrast
mixes, the production model found 7/8 section boundaries and
3.5-flash 8/8 — the program's first genuine listening result after
four studies of text-reading verdicts. But the hearing is texture,
not form: harmonic and tempo-change boundaries landed only 3/6 blind,
and uniform single-section loops were subdivided into invented
verse/chorus structure at 3–6 false boundaries per item (production
blind noise 3.3/item overall; 3.5-flash notably cleaner at 1.0 —
Study 4's generational equality does NOT extend to structural
hearing). Prediction 2 substantially right; prediction 4 wrong in the
instructive direction.

**Gate S8-G1 FAILS by half a boundary.** The chart arm detected
14/14 boundaries (100%) on the production model with every placement
within ±4 s — but mean false boundaries landed at 0.53/item against
the registered ≤ 0.50: eight false boundaries across fifteen items
where the bound allowed seven and a half. 3.5-flash passes (0.47).
The noise's source is itself the finding's sharpest nuance: even
CHART-ANCHORED, uniform loops get subdivided (~1.2 false/item on
loops, 0.0 on contrast and change items) — the chart's single [A]
mark does not stop the form prior from inventing a chorus. Study 7
found explicit chart text beats wrong settings; Study 8's corollary
is that the chart's SILENCE does not beat the model's priors. Names
complete the pattern: 8/8 from the chart, ≤ 3/8 without — names come
from text, as everything always has.

Ship guidance briefed: section detection should ship chart-gated like
the song-check; blind mode is honest ONLY for arrangement-contrast
boundaries and should be labeled so; and the parse-don't-ask rule
extends here — take the section COUNT and NAMES from the chart's
rehearsal marks mechanically, and ask the model only for what
measured perfect and text cannot supply: the boundaries' placement in
seconds. That applied-layer rule would zero the loop subdivision and
pass the gate by construction.

Scorecard: 1 wrong by letter (100% detection, gate lost on half a
false boundary); 2 substantially right; 3 mixed (vocabulary moved
nothing much); 4 wrong instructively. Two production-model cells
remained unanswered even at the raised cap (rambling persists),
counted as misses, disclosed.

Disclosure: analyst Claude Fable 5; no Anthropic model measured;
every grade mechanical, committed and tested before any scored run;
Amendment 1 preceded publication and changed only the output budget.

## Study 7 — the redesigned song-check, re-measured (2026-10-28)

**Question.** stem-shovel rebuilt the song-check in response to Study 4
(chart-reader framing, "Do not estimate a tempo by ear", bar-following
facts instead of confirm/correct candidates, the `chartStatedAnswer`
application gate). Study 7 measured the replacement: the v0.192.0 call
ported verbatim and pinned, four arms over Study 4's metered mixes
(score summary vs band chart × true vs wrong settings), two models,
96 cells, ~$0.40 of the $5 fence. Grading at two levels: the RAW
answer (chart obedience) and the APPLIED answer (what the gate lets
through).

**S7-G1 PASS, decisively: the deference failure is closed where it
counts.** Zero wrong settings survived to application on the
production model (0/24 per field; anchor: the retired design echoed
wrong candidates 10–12/12 straight into the answer). Better still,
the RAW echo under a truth-stating chart is also zero: told "the
song's settings say tempo 240" while the chart's mark reads 120, the
model follows the chart, 12/12. The chart-transcription framing
works when there is a chart statement to transcribe.

**S7-G2 FAILS at 24/24 — and the values convict the mechanism.** On
chord-only charts (no tempo mark anywhere; the registered correct
answer is null), the model NEVER answered null — but it did not
estimate by ear either. Every single invented tempo equals the
SETTINGS value verbatim: 120 when the settings said 120, 60 when they
lied and said 60, both models, 47/47 cells. "Use them to follow the
bars" reads, to the model, as "this is the tempo"; the instruction
and the facts contradict, and the facts win. Meter identically. The
harm is fully contained — `chartStatedAnswer` nulls both fields on a
chart that states neither, 24/24 correct refusals — so the study gate
fails by letter while no wrong value can reach a song. The recurring
shape, fourth appearance: text beats instruction (Studies 1, 2, 4
each found a costume for it).

Reads: key from chords alone is perfect (12/12 both models — the band
chart path's actual job works); keyChange placement under wrong-tempo
bar-following degrades exactly as predicted (3/3 → 1/3 production,
0/3 on 3.5-flash: the arithmetic inherits the lie); and 3.5-flash
shows the guard's design limit — it echoed a wrong setting once under
a truth-stating chart, and the presence-based gate (the chart SAYS a
tempo, so keep the model's) passed the wrong value through, 1/22. The
production model never did; the gate is production-scoped and PASSES.

Ship guidance delivered: (1) never display the raw tempo/meter from
chord-path answers (the applied nulls are the real result); (2) the
deeper fix — `chartStatedAnswer` filters by PRESENCE when it could
substitute by VALUE: the chart summary's tempo marks and time
signature are machine-readable text, so tempo and meter need no model
at all; parse them straight from the chart and reserve the model for
what measured perfect — keys from chords and placement in seconds.

Prediction scorecard: 1 half-right (G1 yes, G2 no at 24/24);
2 wrong in both directions at once (score-chart echo fell to zero,
chord-chart echo rose to twelve-twelfths — the prediction missed that
the split IS the finding); 3 right in both halves; 4 wrong
(production out-resisted 3.5-flash under the new prompt).

Disclosure: analyst Claude Fable 5; no Anthropic model measured (no
audio on the gateway); every grade mechanical, committed and tested
before any scored run; the band-chart generator's
no-tempo/no-meter property is asserted by test.

## Study 6 (micro) — the warning heuristic, validated (2026-10-28)

**Question.** stem-shovel shipped `chartReadWarnings` from the Study 3
correction brief (the dropped-accidentals signature) without
measurement. The bench holds model reads of the SAME pages corrupted
and clean, so the validation cost zero model calls: 148 existing
reader texts (52 corrupted, 96 clean), expected labels mechanical from
the committed specs. Registered in docs/BRIEF-STUDY6.md (commit
4fe27d3) before the evaluation ran.

| Instrument (production reader) | detectable hit | undetectable fired | clean false positives |
|---|---|---|---|
| H-shipped (as in production) | **10/10** | 2/12 | **4/42** |
| H-letters (registered refinement) | 10/10 | 0/12 | 2/42 |
| H-scoped (EXPLORATORY, post-hoc) | 10/10 | 0/12 | 1/42 |

**The shipped heuristic works where it matters** — every detectable
corrupted read fired — and its false-positive class is exactly the one
its own source comment worries about, now measured: honest
natural-chord sharp-key charts (copper-line, drift-4a: D major, many
chords, zero accidentals legitimately) trip the all-or-nothing rule at
~10% of clean production-reader cells. The registered refinement
(count only accidental-less chords on the signature's OWN altered
letters) removes that class and introduces a new one the registration
did not predict: modulating charts, because pooling signatures across
sections makes one key's honest naturals look suspicious against
another key's letters. The post-hoc key-IN-FORCE variant (chords
judged against the signature active at their measure — disclosed as
unregistered exploratory) fixes that too, and its single residual
flag is the best result in the study: it fires on a read whose
MODULATION IS PLACED AT THE WRONG MEASURE (the image-arm mod-c read
put the key change three bars late, leaving F-section chords under
D-major scope) — a genuine read defect that deserves review, flagged
for the wrong stated reason. All-model robustness: misses are floor
effects (haiku's stub reads never reach 8 chords; two short opus
reads), per prediction 3.

Prediction scorecard: 1 right to the named items; 2 half-right (the
predicted fix worked, the modulation class was not predicted);
3 right. Recommendation delivered to stem-shovel: adopt key-in-force
scoping (re-validating it on their side or on a registered extension,
since here it is exploratory), and soften the warning's stated cause
to cover both file corruption and a doubtful read — the evidence says
the flag earns trust in both roles.

Disclosure: analyst Claude Fable 5; both registered instruments and
the label derivation committed and tested before evaluation; the
scoped variant is explicitly post-hoc. Zero model spend.

## Study 5 — the composed pipeline: when the reader feeds the listener (2026-10-24)

**Question.** Studies 3 and 4 measured chart-read and the song-check
separately; production composes them — the chart beside the mix is
chart-read's imperfect output, not truth. Registered in
docs/BRIEF-STUDY5.md: Study 4's 12 metered mixes, their matching lead
sheets engraved by Study 3's pipeline, read by production's chart-read
(fable, PNG and PDF arms), the output fed to production's song-check in
place of truth; Study 4's frozen L-chart cells as the ceiling; a
committed propagation classifier (pass / listener-added / propagated /
rescued / mutated over five fields). Total spend ≈ $3.4 of the $6
fence.

**The study's biggest result is what its first run caught: a
cross-study confound.** The C5-pdf reader reported chords printed
without flats, and the mechanism check proved pdfkit's WinAnsi fonts
silently drop the SMuFL accidental glyphs Verovio writes into chord
text — every "Eb" in every committed PDF rendered as "E" (see Study
3's Correction below; the fix, ASCII accidentals, is committed and all
affected cells across both studies were discarded and re-run).

**Final verdicts (corrected fixture): S5-G1 PASS in both arms at zero
listener-added errors.** The reader made exactly one error across both
arms and 38 facts per arm (it omitted mod-b's relative-major
modulation line from the summary), and the listener RESCUED it both
times, placing the C-major change at 20.2 s against a 20.21 s truth —
by reading the chart's chord content (the progression turns to C
material), not by hearing: Study 4's blind arm found 0/6 changes. The
propagation table is 37 pass + 1 rescued per arm; nothing propagated,
nothing mutated, nothing listener-added. With a competent reader the
composed chain equals its ceiling.

The first (confounded) run earns its own record: its PDF arm showed
the chain faithfully TRANSMITTING upstream damage — a reader
reasonably naming D major for a B-minor sheet whose F#7 printed as F7,
the listener propagating it 1:1; and reader positional errors (a
modulation read at m12 instead of m9) converting to confidently wrong
second-placements downstream. The corrected run shows none of these
because the pages are no longer lying. Both runs together give the
honest composition story: **the chain adds nothing of its own — it is
exactly as good as the page its reader is shown.** Ship guidance
accordingly: the song-check inherits chart-read's accuracy 1:1, so
surfacing the chart summary for user correction protects everything
downstream; and upstream PDF corruption is detectable (fable flagged
the key-vs-chords inconsistency unprompted in a Note) but not
recoverable.

Disclosure: analyst Claude Fable 5; the reader is claude-fable-5-1,
every grade mechanical and committed before any scored run; the
ceiling cells are reused frozen records; Amendment 1 (the confound and
the classifier's positional-attribution note) preceded the corrected
run.

## Study 4 — the listening layer: the second opinion reads, it does not hear (2026-10-23)

**Question.** stem-shovel's song-check has a model LISTEN to a mix and
confirm or correct the DSP detector's tempo, key and meter. Registered
in docs/BRIEF-STUDY4.md: 14 synthesized MP3 mixes with truth by
construction (three meters, tempo shifts, modulations, two pulseless
pads), production's `askAiAboutMix` call ported verbatim, candidates
ablated across four arms (blind / correct / wrong / chart-beside-mix,
the chart generated by Study 3's committed code). Two amendments: the
fixture-health stop rule fired twice, so the fixture itself was tried —
a committed onset-autocorrelation instrument proves the pulse is
physically in all 12 metered MP3s (12/12), and a disclosed one-cell
second-listener diagnostic reproduced the failure — discharging the
rule's premise and reclassifying the result as a model-class finding.
Total spend ≈ $1.2 of the $13 fences.

### Results (metered items; tempo incl. the 6/8 rule)

| Arm | 3-flash (production): tempo / meter / key | 3.5-flash: tempo / meter / key |
|---|---|---|
| L-blind | 2/12 · 7/12 · 1/12 | 1/12 · 7/12 · 2/12 |
| L-correct | 11/12 · 8/12 · 12/12 | 10/11 · 8/11 · 9/11 |
| L-wrong | 2/12 · 2/12 · 0/12 | 5/11 · 5/11 · 0/11 |
| L-chart | **12/12 · 12/12 · 12/12** | **12/12 · 12/12 · 12/12** |

Change detection: 0/6 blind for both models; 6/6 found AND placed
within ±4 s in the chart arm, both models. Deference under wrong
candidates: production echoes 10–12/12 per field; 3.5-flash pushes
back on tempo and meter (4/11 and 3/11 deference) but still swallows
the wrong key 10/11. `openai/gpt-4o-audio-preview` is not on the
gateway (the registered availability probe's result): the swap space
for this surface is gemini-only.

**Gate S4-H1 FAILS by letter** for the production model: one invented
tempo on a pulseless pad (blind: "60") — while, against prediction, it
RESISTED the false "120 bpm" authority on all four pulseless
wrong-candidate cells. It invents unprompted, not under pressure.
3.5-flash ran the probe clean (0/6).

### The findings

1. **The listening layer reads; it does not hear.** Blind, both
   gemini generations pin tempo to a 120–180 genre prior at
   confidence 1.0, name wrong keys (1–2/12), and find zero changes —
   on mixes whose pulse is mechanically verified and carries explicit
   kick, snare and hats. Given text, they transcribe it: correct
   candidates in, correct answers out; wrong candidates in, wrong
   answers out (production: 10–12/12 echoed); the chart in, perfection
   out — every field, every change, placed to the second, both models.
   The "second opinion" is a text channel wearing headphones.
2. **What they DO hear**: harmonic texture loosely (relative-key
   confusions, real chord motions occasionally named) and gross
   structural events (a tempo double noticed in prose but never
   quantified). Absolute tempo, meter and key extraction are not in
   the current audio stack — consistent across two model generations
   on physically verified pulses.
3. **The chart arm is the product**: with the lead sheet beside the
   mix, the song-check nails everything including the change
   placements the product actually wants (where does the modulation
   land, in seconds). Ship guidance: treat the song-check as a
   chart-anchoring tool, not a detector-checker; never let its
   "second opinion" override the DSP detector on tempo/meter; and the
   confidence field is uninformative (1.0 on fabricated answers).
4. Prediction scorecard: 1 wrong in the instructive direction (the
   invented tempo came unprompted, not under false authority);
   2 half-right (meter weak blind, candidates only partially fix it);
   3 wrong (deference was highest for key, not meter, and production
   deferred on everything); 4 right (the chart lifts change detection
   to 6/6 placed); 5 wrong (one octave error, not two — the misses
   were prior-pinning, not octave confusion).

### Disclosure

Analyst Claude Fable 5; no Anthropic model measured (none takes audio
on the gateway). Every grade mechanical, committed and tested before
any scored run; the fixture's pulse is verified by a committed
instrument; the one diagnostic cell is disclosed and excluded from
scored claims.

## Study 3 — can a model read sheet music? (2026-10-23)

**Question.** stem-shovel's chart-read has a model read an engraved
score into production's per-measure summary format; its model choice
and modality claim rested on one informal test. Registered in
docs/BRIEF-STUDY3.md: 11 Verovio-engraved scores (268 readable
measures, every element class, two 2-page items, an unreadable probe),
ground truth from the ported production `musicXmlSummary`, per-class
measure-exact and ±1 recall, arms D-pdf vs D-image, production's prompt
verbatim. Two pre-matrix amendments, both committed with anatomy:
transparent PNGs composited to black-on-black at the model, and the
probe needed re-calibration twice (vector PDFs stay crisp at any zoom;
150 px was still readable in fact — the pilot model read 7/8 chords
from a smear a human cannot, so unreadability probes must be calibrated
by model behavior, not eyesight). Total spend ≈ $2.1 of the $34 fences.

### Results (readable items; chord recall exact / keys ±1 pooled)

| Model | D-image chords | D-pdf chords | keys ±1 (gate read) | measure drift | probe |
|---|---|---|---|---|---|
| fable-5-1 (production) | **98.8%** | 76.0% | **91.7%** | 0.0 | honest ×2 |
| gemini-3.5-flash | 97.1% | 70.4% | 91.7% | 0.1 | **1 fabricated line** |
| opus-4.8 | 62.2% | 82.5% | 70.8% | 1.6 | honest, 1 format miss |
| haiku-4.5 | 1.2% | 0.0% | 70.8% | 14.9 | honest ×2 |

**Gate accounting: S3-H1 PASS, S3-H2 FAIL by letter — the study gate
fails via its every-model clause.** The production model passes
everything it is gated on: keys at exactly the registered 91.7% ≥ 90%,
near-perfect image reading (98.8% chord recall at 100% precision, zero
measure drift), and honest declines on the probe in both arms. S3-H2's
wording — "zero fabricated lines, EVERY model, both arms" — fails via
the pilot model: shown the 80 px smear as an image, gemini wrote
`m1 key C major 4/4` under an invented title instead of the Note
declaration (its PDF arm declined honestly; the archived 150 px run
also holds its full fabrication signature, a confident 0/8 progression).
The registration lesson, now recurring: a gate quantified over every
model makes the weakest model the gate — the AR/S2 lesson in a third
costume. Published as failed.

### The findings

1. **Frontier vision models read sheet music.** Fable reads engraved
   notation from a clean PNG at 98.8% exact chord recall with perfect
   precision and zero measure-count drift, at roughly $0.06 a score.
   The production anecdote ("read as text, the keys are plain") is
   upheld under measurement, and chart-read's model choice is validated
   against two tiers and a competitor.
2. **The PDF ingestion path, not notation reading, is the bottleneck.**
   Three of four models lose 20+ points of chord recall moving from
   PNG to PDF of the identical page (fable 98.8 → 76.0); repeats
   collapse hardest. Ship guidance: chart-read should rasterize PDFs
   itself and send images, rather than trusting each provider's
   internal PDF pipeline. (Opus is the odd one out — better on PDF —
   so the effect is per-provider-pipeline, not intrinsic to PDFs.)
3. **Haiku cannot do this job**: 1.2% chord recall, 15-measure drift,
   ~120 output tokens per score — it reads the signatures and writes a
   stub. The sharpest tier cliff the program has measured.
4. **The honesty map**: anthropic models decline the unreadable page
   (opus once declined without the registered Note form — a format
   miss, not a fabrication, per the registered distinction); gemini
   fabricates under image input. Study 2's accept-and-disobey lesson
   generalizes to vision exactly as the brief predicted it might.
5. Prediction scorecard: 1 right (fable keys, to the decimal of the
   bar); 2 half-right (chords above the predicted band in images);
   3 wrong in an instructive way (repeats weak, but endings 100%
   everywhere answered — the volta brackets read fine; it is the
   repeat DOTS that get lost, and only in PDFs); 4 right in substance
   (one model fabricated, and it was not an anthropic one); 5 right
   for gemini and fable, refuted by opus.

### Correction (2026-10-24, found by Study 5): the PDF arm measured corrupted pages

Study 5's anatomy exposed that pdfkit's WinAnsi fonts cannot encode
the SMuFL accidental glyphs Verovio writes into chord text, so every
PDF chord accidental in this study's fixture silently rendered as its
natural ("Eb" as "E", "F#7" as "F7"). The decisive split: fable's
D-pdf chord recall was ~94% on sharp/natural-key items and ~55% on
flat-key items. The PDFs were re-rendered with chart-ASCII accidentals
and every readable D-pdf cell re-run (archived originals in
results/archive/study3-dpdf-accidentals-confounded/). Corrected D-pdf
chord recall: **fable 76.0% → 99.3%, gemini 70.4% → 99.3%**, opus
82.5% → 74.2% (its better-on-PDF oddity shrinks into re-run noise),
haiku unchanged (0%, the stub behavior). Keys, repeats and specials
rose to 100% for fable.

Finding 2 as first published is therefore WITHDRAWN in its mechanism
and magnitude: for frontier models the PDF ingestion path is NOT a
bottleneck — they read a clean PDF as well as a clean PNG. The models
in the confounded arm were not failing to read; they were correctly
reading pages whose flats genuinely were not drawn. What replaces it:
**PDF text generation is the hazard** — font encodings of the
WinAnsi class silently drop music accidentals at authoring time, the
corruption survives any ingestion path including rasterization, and it
is detectable (the key signature disagreeing with chord spellings —
fable flagged exactly this unprompted) but not recoverable. The
"rasterize PDFs app-side" ship guidance is withdrawn as unnecessary
for clean PDFs and useless for corrupt ones; the replacement guidance
is a key-vs-chords consistency check on chart-read output. Gates
unchanged (S3-H1 was pooled keys, still 91.7% PASS; S3-H2 unchanged).

### Disclosure

Analyst Claude Fable 5; the matrix includes claude-fable-5-1. Every
grade is mechanical, committed and tested before any scored run; the
ground-truth instrument is production's own summary code, ported
verbatim. Amendments 1–2 preceded all matrix cells; the Correction
above postdates first publication and is mirrored on the dashboard and
the article.

## Study 2 — does reasoning help a model write a drum beat? (2026-10-22)

**Question.** stem-shovel's Text-to-Beat hard-codes reasoning OFF on an
unmeasured claim (textToBeat.ts: a thinking model takes minutes and
"gets it no better"). Registered in docs/BRIEF-STUDY2.md (commit
c4e7a1d) before any scored run: the production call ported verbatim and
pinned (system prompt, validator with production's exact error
messages, retry-with-reason, the REST endpoint), 25 tasks with 49
mechanical checks tied only to explicit prompt text, two arms — R-off
(production verbatim: effort none, 1500-token cap) and R-default (the
reasoning field omitted, 8000-token cap, the registered asymmetry).
Combined score: 0 without a valid reply, else checks passed/total.
Total spend ≈ $4.85 of the $28 fences.

| Model | R-off score | R-default score | valid (off→def) | latency × | out-tokens × |
|---|---|---|---|---|---|
| kimi-k2.6 (production) | **95.0%** | 44.0% | 24/25 → 11/25 | 20.3 | 29.7 |
| fable-5-1 | 100.0% | 100.0% | 25/25 → 25/25 | 1.2 | 1.4 |
| haiku-4.5 | 92.0% | 92.0% | 23/25 → 23/25 | 1.0 | 1.0 |
| gpt-oss-120b | 77.0% | 92.0% | 21/25 → 24/25 | 2.7 | 2.8 |
| gemini-3.5-flash | **0.0%** | 99.0% | 0/25 → 25/25 | 0.7 | 1.0 |

**Gate S2-H1 PASS — the first gate in this program to pass by letter.**
For the production model the claim is upheld beyond its own wording:
R-default is not merely "no better," it is 51 points WORSE (p = .0015).
Kimi's default reasoning exhausted even the 8,000-token budget (5.3×
production's cap) on 14/25 tasks and returned no content — and the
production retry cannot rescue an empty reply (a conversation with an
empty assistant turn is a 400). On the 11 tasks where its reasoning
finished, checks were perfect: completed thinking helps slightly and
completes less than half the time.

**The finding that outranks the gate: "reasoning off" is not a portable
call shape.** gemini-3.5-flash does not honor `effort: "none"` — it
thinks ~3,000 tokens regardless, so under production's 1500-token cap
it burned exactly to the cap and returned nothing, twice per request,
0/25 valid; with room to think it is 25/25 at 99%. stem-shovel's
TEXT_TO_BEAT_MODEL is swappable by env var precisely so models can be
compared without a deploy — and this measurement shows the swap would
silently break the feature for a model that ignores the reasoning
field. The registered fallback (Amendment-1 rule) covered a model that
REJECTS effort none with an API error; gemini instead accepts and
disobeys, a failure class the registration did not anticipate —
published as measured. Meanwhile anthropic models are indifferent
(fable ×1.4 tokens with adaptive thinking, haiku identical arms), and
gpt-oss is the one model where reasoning buys quality (+15 points,
p = .14, not significant, at 2.8× cost — mostly by fixing its weak
first-try format validity: 13/25 first-try off, with the retry
rescuing 8).

Prediction scorecard: 1 right (upheld for kimi, economics ≥ 5×);
2 wrong (R-default first-try validity 40%, not ≥ 85%); 3 refuted by
letter via gemini's +99 — though by call-shape breakage, not reasoning
quality; 4 half-wrong (gpt-oss ×2.8 not ≥ 5×, and gemini's off arm is
SLOWER than its reasoning arm, 26 s vs 16 s medians, because cap
exhaustion runs the clock twice).

Ship guidance recorded for stem-shovel: the hard-coded choice is now a
measured one for the shipped model; the env-var swap path needs either
a per-model output budget or a one-request smoke test, and
reasoning-capable swaps (gpt-oss class) want the retry's rejected-reply
path checked against empty completions. Corrections before any result
was read, both dated in the brief: the analyzer's scoring brought to
the registered rule (budget-exhausted cells score 0; only
first-attempt API failures drop), and the brief's prose corrected to
the committed corpus counts (25 tasks, 49 checks).

Disclosure unchanged: analyst Claude Fable 5, matrix includes
fable-5-1, every grade mechanical (the validity grader is production's
own validator, ported and pinned).

## Study 1 — the hint-following study (2026-10-21)

**Question.** stem-shovel's chart draft shows the model each bar's Basic
Pitch transcription plus a free template matcher's chord guess — "a hint,
not an answer." Does the model read the notes or copy the hint?

**Method.** Registered in docs/BRIEF-STUDY1.md (commit c22a1ba) before any
scored run. 16 hand-authored songs, 440 bars, synthesized and transcribed
by the production pipeline; production prompt texts pinned by test; four
arms varying only the hint: none, the production matcher's, the truth,
and a systematically wrong transform (root up a fourth, quality kept).
Mechanical per-bar grading (same root pitch class + canonical quality).
Template-matcher baseline, known at registration: **398/440 (90.5%)** —
with a caveat it earns itself: on the power-chord song its "5"-template
penalty scores 3/28.

**Amendment 1** (committed 8c4201b, before any scored haiku/kimi cell):
haiku-4.5 rejects production's adaptive-thinking option (64 API errors);
kimi-k2.6 spent the full 8000-token output budget reasoning in 62/64
cells and returned no JSON — independently reproducing the production
text-to-beat lesson at $8.70 of reasoning tokens. Amended call shapes:
haiku on provider defaults; kimi on production's own kimi path (gateway
REST, reasoning off). Failed runs archived in results/archive/.

### Results (bar accuracy; 64 cells per model)

| Model | A-none | A-matcher | A-correct | A-wrong | copy rate | flip rate |
|---|---|---|---|---|---|---|
| fable-5-1 (production) | 92.3%* | **99.8%** | 100.0% | 99.3% | **0.0%** | **0.0%** |
| gemini-3.5-flash (pilot) | 94.1% | 94.3% | 99.5% | 99.5% | **0.0%** | **0.0%** |
| gpt-oss-120b | 65.9% | 85.9% | 96.1% | 77.7% | 15.3% | 22.6% |
| haiku-4.5 | 49.5% | 87.5% | 94.5% | 30.9% | 42.7% | 49.5% |
| kimi-k2.6 | 28.2% | 75.5% | 95.7% | 11.4% | 56.2% | **69.1%** |

*Includes one reproducibly empty completion (morning-fuse, 5976 tokens
in, 0 out, twice) scored 0/28 per the registered no-retry rule;
excluding it fable's A-none is 98.5%.

Copy rate: bars answered with the wrong hint, of 438 hintable. Flip
rate (the registered headline): bars the model got RIGHT with no hint
that it answered with the wrong hint when one was shown.

### The findings

1. **Hint-following is a capability gradient, not a universal.** The
   frontier models never copied a wrong root — 0 of ~850 opportunities
   between them — while kimi flipped 69% of bars it could read correctly
   on its own, haiku 50%, gpt-oss 23% (gpt-oss bimodally: two songs
   surrendered wholesale, the rest read clean). The registered
   prediction (flips > 50% for small models, production model least) was
   right about the shape and wrong about the universality: wrong hints
   did not hurt the strong models at all.
2. **Hints carry notation, not just pitch.** The pilot model at ceiling
   still gained from WRONG hints (94.1% → 99.5%): on the power-chord
   song it wrote the right roots as plain majors without a hint, and
   wrong-rooted "5"-suffix hints fixed the spelling while the notes
   fixed the pitches. Hint influence in strong models operates at the
   notation-style layer, never the chord-identity layer. (A design note
   rides along: A-correct/A-wrong hints inherit the truth's segment
   boundaries, so part of their lift is alignment, an advantage the
   production A-matcher arm does not have.)
3. **The production design is validated — and is what rescues cheap
   models.** A-matcher beat A-none for every model: +7.4 pts for fable
   (99.8%, the best shipped-configuration number in the study), +39 for
   haiku, +47 for kimi. But no cheap substitution exists: in the shipped
   configuration haiku (87.5%) and kimi (75.5%) sit BELOW the free
   matcher's own 90.5%, while fable adds +9.3 pts over it at about
   $0.10 a draft. The DRAFT_MODEL choice is measured, not vibes.
4. **Only the frontier models beat the free matcher reading notes
   alone** (gemini 94.1%, fable 98.5% on answered cells vs 90.5%) —
   registered prediction 1 ("every model beats the baseline") is
   refuted: haiku, kimi and gpt-oss fall far short.
5. **Disclosure tracks capability.** Shown wrong hints, fable flagged
   the matcher disagreement in its notes in 11/16 songs; gpt-oss 7,
   gemini 4, haiku 2, kimi 0. The registered prediction (rare
   everywhere, < 20%) is refuted in the best direction for the
   production model: it both ignores a wrong hint and says so.

### Gate accounting (registered wording, never re-thresholded)

S1-H1 read "A-correct beats A-none, p < .05 for the pilot model AND for
the pooled matrix." Pooled matrix: Δ +37.7 pts over 64 pairs,
p < 0.00005 — decisive. Pilot model: Δ +5.4 pts but p = 1.0, because
every song except one is at ceiling in both arms and a paired
permutation with one informative pair cannot reach significance at any
effect size. **The conjunct gate therefore FAILS by letter** via the
pilot clause — the fourth registration lesson of the research program:
a gate clause about a model at ceiling measures the fixture, not the
mechanism. The fixture-health stop rule (A-correct ≥ 70%) passed for
every model (94.5–100%).

Prediction scorecard: 2 and 4 right; 1, 5 and half of 3 refuted —
recorded above.

### Spend

Pilot $0.74 (fence $3). Matrix ≈ $17.4 including the archived kimi
reasoning burn ($8.70) and reruns (fence $30). Total ≈ $18.1.

### Production response and Amendment 2 (same day)

stem-shovel v0.142.0 (commit 69e015d6) adopted the finding within hours:
the matcher's flat "5" penalty became a missing-tone penalty (a template
tone carrying under 5% of the bar's profile costs 0.08), and the chart
draft now retries an empty completion (the morning-fuse case). The bench
re-ported the matcher verbatim, pinned the new behavior, recomputed the
hints over the STORED notes (nothing re-transcribed; the v0.141 fields
kept for reproducibility), and re-ran the shipped-configuration arm as
registered Amendment 2 (80 cells, $2 of the $6 fence, zero errors).
Note on cross-checking: stem-shovel's own re-score said 397→423; the
bench says 398→424 — the one-bar difference is static-bloom's silent
bar (truth N.C., matcher N.C.), which the registered equivalence counts
correct.

Hint accuracy 90.5% → **96.4%** (42 wrong-hint bars → 16). The shipped
arm under each matcher:

| Model | v0.141 hints | v0.142 hints | propagated wrong hints (old → new) |
|---|---|---|---|
| fable-5-1 | 99.8% | 99.3% | 0/42 → 0/16 (rescues 100% of both) |
| gemini-3.5-flash | 94.3% | 98.2% | 14 → 7 |
| gpt-oss-120b | 85.9% | 92.0% | 35 → 13 |
| haiku-4.5 | 87.5% | 92.5% | 9 → 9 |
| kimi-k2.6 | 75.5% | **94.8%** | 26 → 10 |

Reads against the amendment's registered predictions: the hint-followers
rose toward their A-correct ceilings as predicted (kimi +19.3 pts to
94.8% vs its 95.7% ceiling; haiku +5.0), and fable is unchanged within
noise, still propagating zero wrong hints. The flip rate — the Study 1
headline — is a wrong-hint-arm metric that does not involve the matcher
and is unchanged by construction.

The substitution conclusion SHARPENS with the better matcher: haiku
(92.5%), kimi (94.8%) and gpt-oss (92.0%) now sit below the bare
v0.142 matcher's own 96.4% — in the shipped configuration those models
subtract value from the free matcher — while fable (99.3%) and gemini
(98.2%) still add to it. The cheapest configuration that beats
everything upstream of it remains the shipped one.

### Disclosure

The analyst model is Claude Fable 5; the matrix includes
claude-fable-5-1. Every grade is mechanical, committed and tested before
any scored run; no model output was judged by any model or person.
