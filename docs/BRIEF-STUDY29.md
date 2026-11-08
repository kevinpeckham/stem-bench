# Study 29 — can a backbeat-heavy mix pull recipe v5 off the downbeat?

Registered 2026-11-08, before any scored measurement. Source: the
app's ASK (stem-shovel/docs/bench-brief-v5-backbeat-2026-11-08.md),
cued by Kevin. $0: all arms mechanical. The app is porting v5 as its
chart placement and wants the failure study before users' recordings
find it.

## Arms (as the ASK specifies, with constructions pinned here)

**Arm 1 — synthetic catch map.** 4/4 lattices at 120 and 200 bpm, 60
bars; onset energy 1.0 on beats 2 and 4, w ∈ {1.0, 0.6, 0.3, 0.1} on
beats 1 and 3; a synthetic "DTW" grid at phase error x swept −1.0 to
+1.0 beat in 0.05-beat steps; envelope at 125 fps with 1-frame
impulses. Record v5's delta and classify the slid grid: downbeat
(within 0.1 beat), backbeat (within 0.1 beat of beat 2 or 4), or
elsewhere. Deliverable: for each w, the x-range that lands on the
downbeat. Reported as ranges, not gated (per the ASK).

**Arm 2 — in-window competitors.** The same lattice (120 bpm, w = 0.3
downbeats, backbeats 1.0) plus hi-hat energy h ∈ {0.3, 0.6, 1.0} on
every off-beat eighth, and a 0.8-energy pickup one eighth before each
downbeat, swept with and without the pickup, x = 0. Report what the
slide chooses and at what h the hi-hat beats the downbeat. Reported,
not gated.

**Arm 3 — real stems made backbeat-heavy (the gated arm).** Each
song's drum stem high-passed at 150 Hz (RBJ biquad, Q = 0.7071,
applied twice for a 4th-order skirt — the kick goes, snare and hats
stay), remixed with the untouched other stems, peak-normalized. v5 run
against the corrected charts (eat = the 71-bar chart). Gate
**S29-G1:** every song keeps its Study 27 gate standard on the
kick-removed mix (letter/peaceful: ends ≤ 0.25 period of truth, middle
mean ≤ 0.10 s; mop: ends ≤ 0.25 period of the refined truth, middle
mean ≤ 0.15 s, app acceptance; eat-71: ends ≤ 0.25 period). A failure
ships with the delta in beats and the per-bar confidence split, as the
ASK requests.

**Arm 4 — the DTW's real phase error, in beats.** Computed from the
committed Study 27 run: the per-song |delta| the whole-grid slide
actually applied, divided by the beat, plus mop's DTW-phase-vs-lattice
distance. This also answers the ASK's arithmetic check on "0.38 s =
1.4 beats at 224 bpm": the arithmetic is right, the premise is not —
that 0.381 s was the TRUTH ANCHOR'S error (Study 25's oracle vs the
onset lattice, the ruler), not the DTW's phase error; the DTW's own
phase sat about 0.014 s (0.05 beat) from the lattice on mop, which is
why the fence never strained. Registered as the expected answer,
verified mechanically from the committed numbers in the run.

**Remedy arm (conditional, registered now, runs only if S29-G1
fails):** the ASK's downbeat check — score the slid grid against
itself shifted by ±1 and ±2 beats; if a shifted grid scores ≥ 1.2× the
chosen one, compare policy (a) refuse re-phase, ship v3 ends-only, vs
policy (b) move to the best beat and re-check, on the failing songs.

## Gates

- **S29-G1** (arm 3), as above.
- **S29-G2** (no-change control): v5 on the untouched full mixes
  reproduces Study 27's deltas within 2 ms (same code, same data; a
  drift means an instrument changed and the study stops).

## Predictions

1. Arm 1: the downbeat is chosen for |x| < 0.5 beat at every w, beat 2
   for x beyond it when backbeats outweigh downbeats, "elsewhere"
   never.
2. Arm 2: the pickup (0.25 beat inside the window, 0.8 energy) beats a
   0.3 downbeat and drags the grid an eighth early — the first real
   in-window failure; the hi-hat flips it only at the fence edge.
3. Arm 3 (S29-G1): all four songs still pass — the bass and guitar
   onsets keep the downbeat the lattice's attractor without the kick.
   Registered genuinely uncertain on letter-lands (its drums enter at
   3.63 s and its intro lattice is guitar-only already).
4. Arm 4: every real |x| ≤ 0.10 beat; the 1.4-beat figure was the
   ruler, not the map.
5. Spend $0.

## Spend fence

$0. Instruments in src/study29/ with unit tests; runner
scripts/run-study29.ts; results in results/study29.json.
