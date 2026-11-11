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

## Results (2026-11-11, registration 4792e1f; $0)

### The exports

| export | exporter | bytes | sha256 |
|---|---|---|---|
| static1500 | torch.onnx TorchScript exporter (opset 17; the dynamo exporter failed to decompose the graph with the rotary cache in place) | 9,932,033 | d57ae630f0daa290f558d076d963d2216b4c447d72695e691a79e3c792447124 |
| dynamic (rotary cache off) | torch.onnx dynamo exporter (opset 18) | 10,478,769 | 8c009d908992c6552e5d739deb941524ba78f35c47f0f59bcf2fede51ea23782 |

Both at models/study42/ on the bench VM (not committed; reproducible
by scripts/export-study42.py from the package's small0 checkpoint,
sha256 6074be2c…, torch 2.15.0).

### Verification against the torch package

Frame logits, three songs: static1500 at 1500 frames, max absolute
difference 2.7e-5 to 3.7e-5 (beat) and 2.2e-5 to 3.4e-5 (downbeat);
dynamic at 1500, 750 and 3000 frames, 1.5e-5 to 6.9e-5 throughout.
Float32 noise; P1 and P3 right. The rotary cache was the whole cause of
the Study 10 export's failure.

The reference inference (1500-frame chunks, 6-frame border,
keep_first, minimal postprocessor in numpy) with static1500 over the
ten modern songs against the package's own readings (Study 36): beat F
1.000 and downbeat F 1.000 at 70 ms on all ten, with identical beat and
downbeat counts on all ten (for example cherubs 655 beats and 169
downbeats on both; the Study 10 export had read 87 downbeats). P2
right. **static1500 is the measured system.**

### Timing, one 30 s chunk, model only

| runtime | threads | s per chunk | s per minute of audio |
|---|---|---|---|
| torch (package) | 16 (default) | 0.56 | 1.1 |
| torch | 1 | 1.64 | 3.3 |
| ONNX Runtime CPU (Python) | default | 0.85 | 1.7 |
| ONNX Runtime CPU | 4 | 0.54 | 1.1 |
| ONNX Runtime CPU | 1 | 1.31 | 2.6 |
| ONNX Runtime Web 1.31.1, WebAssembly, Node 22 | 1 | 4.46 | 8.9 |
| ONNX Runtime Web, WebAssembly | 4 requested | 4.86 | 9.7 |

The two WebAssembly rows are the same speed: the threaded build did
not engage under Node's plain import (it needs the worker-backed
build and cross-origin isolation in a browser), so 4.5 s per chunk is
the single-thread floor and a browser with SIMD and threads should do
better, not worse. Session load 0.6 to 0.8 s. The front end (log mel
spectrogram) and the postprocessor are not in these numbers; both are
cheap next to the model (the whole ten-song verification ran at 2.8 to
5.5 s a song in Python, front end included).

P4 wrong as written: ONNX Runtime at its default thread count is 1.5×
the torch forward (0.85 against 0.56 s), though at four threads it is
at parity (0.54). P5 right: 4.5 s per chunk against a 15 s floor (four
threads) and a 45 s floor (one thread).

### Decision (S42-D1)

P2 holds, so static1500 is handed to the app as the measured system,
with its hash. The four-thread WebAssembly figure (9.7 s per minute of
audio, single-thread in practice) is under the 15 s browser threshold:
**the bench recommends the browser**, behind the same lazy load the
transcriber uses. A four-minute song is about 36 s of model time on the
bench VM's core, before the front end; a laptop core will be slower by
its own factor. The server path (ONNX Runtime Node at four threads,
about 1.1 s per minute of audio) remains the fallback where that
latency is too long.

### What the app needs to port, exactly

1. The log mel front end: 22050 Hz mono, n_fft 1024, hop 441, Hann
   window, magnitude (power 1) normalised by frame length, 128 slaney
   mel bands from 30 to 11000 Hz, log1p(1000 · x). Study 10's numpy
   translation (scripts/study10/nbeat.py) is verified identical to
   torchaudio's (Study 41 addendum: logits equal to 0.00 through it).
2. Chunking: 1500-frame windows stepping by 1488 (border 6), the last
   window aligned to the end, predictions stitched keep_first with the
   6-frame borders dropped; a piece shorter than 1500 frames is padded.
3. The minimal postprocessor: beat (downbeat) where the logit is the
   maximum over 7 frames and above 0; adjacent peaks merged; downbeats
   moved to the nearest beat.
4. The derivations of Study 41 Ask B: tempo 60 / median beat interval;
   label from the modal beats per bar (6 → 6/8 at tempo ÷ 3).

### Disclosures

- The static export came from the TorchScript exporter after the
  dynamo exporter failed on that graph; the dynamic export came from
  the dynamo exporter. Both are verified above; which exporter made
  them does not enter any result.
- Timings are single measurements (mean of 5 runs after a warm-up) on
  a shared 16-vCPU VM.
- `bun add -d onnxruntime-web@1.31.1` was added to the bench's dev
  dependencies for the WebAssembly timing (the app's pinned version).
