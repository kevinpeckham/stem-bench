# Study 42: the Beat This small0 export, produced, verified and timed

Registered 2026-11-11 before any run. Zero model spend. Answers the
app's follow-up to Study 41 (relayed by Kevin): the bench has torch and
the checkpoint, so it should produce the export, verify it against the
package, and measure its speed so the app can decide where it runs.

## Question

Study 41 found the Study 10 ONNX export of Beat This small0 carries the
right weights but breaks past about 300 frames, so it ran at a
5-second window and tracked differently from the package at 30 s. The
cause is now read from the code: `rotary_embedding_torch` caches its
position frequencies in a buffer and slices `cached_freqs[:seq_len]`
on each call; a tracer bakes that slice at the traced length, so any
longer input gets the wrong rotations. Can an export be made that is
the measured system at 1500 frames, and how fast does it run under
ONNX Runtime on CPU and under ONNX Runtime Web (WebAssembly), the
app's browser runtime?

## Instrument (scripts/export-study42.py, scripts/time-study42.mjs)

Two exports from the package's small0 checkpoint (sha256 6074be2c…,
Study 41), input (1, T, 128) log-mel frames, outputs beat and downbeat
logits (1, T):

- `static1500`: traced at T = 1500 with the rotary cache as is (the
  cache then holds exactly the 1500 positions the reference inference
  uses);
- `dynamic`: the rotary cache disabled (`cache_if_possible = False`) so
  frequencies are computed from the input length, exported with T
  dynamic.

Exports go to models/study42/ (gitignored like models/study10/; hashes
and sizes recorded in results/study42.json). The exporter used (torch
dynamo or TorchScript) and the opset are recorded.

Verification, all against the torch package in the same process:
1. frame logits at T = 1500 on three songs' first chunk (max absolute
   difference, Pearson);
2. the dynamic export also at T = 750 and T = 3000;
3. the full reference inference (split 1500 / border 6 / keep_first,
   minimal postprocessor, numpy, from scripts/study10/nbeat.py) over
   the ten modern songs with the static export, against the package's
   own beats and downbeats (results/study36-trackers.json): beat and
   downbeat F at 70 ms, counts.

Timing, model only, on a (1, 1500, 128) chunk (30 s of audio):
4. ONNX Runtime CPU in Python, default threads and one thread, seconds
   per chunk, against the package's torch forward on the same chunk;
5. ONNX Runtime Web 1.31.1 (the app's version) WebAssembly backend in
   Node, one thread and four threads, seconds per chunk. Reported as
   seconds per minute of audio (chunk × 2).

## Predictions

- P1: static1500 matches the torch logits at 1500 frames with max
  absolute difference ≤ 1e-3 on all three songs.
- P2: through the reference inference on the ten songs, static1500's
  downbeats match the package's at F ≥ 0.99 on every song, with equal
  beat and downbeat counts on at least 8 of 10.
- P3: the dynamic export matches at 750 and 3000 frames to the same
  tolerance (the cache was the whole cause).
- P4: ONNX Runtime CPU, default threads, is no slower than the torch
  forward (≤ 1.0×).
- P5: ONNX Runtime Web, four threads, runs a 30 s chunk in ≤ 15 s (≤ 30
  s per minute of audio); one thread in ≤ 45 s.

## Decision rule

S42-D1. If P2 holds, static1500 is the measured system and the bench
hands it to the app with its hash. Placement, from the measured
speed: if the four-thread WebAssembly time is ≤ 15 s per minute of
audio (a four-minute song in about a minute, behind the lazy load the
transcriber already uses), the bench recommends the browser; if it is
above 60 s per minute, the server (jobs function with ONNX Runtime
Node or the Python package); between, the bench reports both and the
app decides on its own latency budget. If P2 fails, the export is not
handed over and the measured path stays the Python package.

## Disclosures

- The cause (the rotary cache) was read from the code before this
  brief; P3 is the test of that reading, not a guess.
- Wall times are on the bench VM (16 vCPU AMD EPYC 9554P) and are
  upper bounds for a laptop only in the loose sense; the browser
  figure is Node's WebAssembly, not a browser's, with the same engine.
- The exports are not committed (binary, reproducible from the script
  and the checkpoint); their hashes are.
