/**
 * Study 42 (docs/BRIEF-STUDY42.md), $0: time the static small0 export under
 * ONNX Runtime Web's WebAssembly backend in Node (the app's runtime,
 * version pinned to stem-shovel's), one thread and four threads, on the
 * 30 s chunk export-study42.py saved. Appends to results/study42.json.
 *   node scripts/time-study42.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import * as ort from "onnxruntime-web";

const root = new URL("../", import.meta.url).pathname;
const model = readFileSync(`${root}models/study42/beat_this-small0-static1500.onnx`);
const raw = readFileSync(`${root}models/study42/chunk-1500x128.f32`);
const data = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
const results = JSON.parse(readFileSync(`${root}results/study42.json`, "utf8"));
results.timing ??= {};

async function timeAt(threads) {
	ort.env.wasm.numThreads = threads;
	ort.env.wasm.simd = true;
	const t0 = performance.now();
	const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
	const load = (performance.now() - t0) / 1000;
	const input = new ort.Tensor("float32", data, [1, 1500, 128]);
	await session.run({ spectrogram: input });
	const n = 3;
	const t1 = performance.now();
	for (let i = 0; i < n; i++) await session.run({ spectrogram: input });
	const per = (performance.now() - t1) / 1000 / n;
	await session.release();
	return { threads, loadSeconds: load, secondsPerChunk: per };
}

for (const threads of [1, 4]) {
	const r = await timeAt(threads);
	results.timing[`wasm${threads}Thread${threads > 1 ? "s" : ""}`] = { ...r, runtime: `onnxruntime-web ${ort.env.versions?.web ?? "1.31.1"} wasm, node ${process.version}` };
	console.log(`wasm ${threads} thread(s): ${r.secondsPerChunk.toFixed(2)} s per 30 s chunk (${(2 * r.secondsPerChunk).toFixed(1)} s per audio minute), session load ${r.loadSeconds.toFixed(2)} s`);
}
writeFileSync(`${root}results/study42.json`, `${JSON.stringify(results, null, "\t")}\n`);
