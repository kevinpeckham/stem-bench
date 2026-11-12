/**
 * Study 49 (docs/BRIEF-STUDY49.md): Basic Pitch's note creation under the
 * knobs the app owns. The model runs once per stem (its frame and onset
 * posteriors are cached beside the stem, gitignored), then
 * outputToNotesPoly is run once per configuration in <configs.json> and
 * each note list is written to <outDir>/<id>.json as
 * [startSec, durationSec, pitchMidi, amplitude] rows in stem time.
 * Same model files and the same call as scripts/transcribe-child.mjs.
 *   node scripts/study49-transcribe.mjs <model.json> <weights.json> <in.raw> <configs.json> <outDir>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [modelJson, weightsJson, inFile, configsFile, outDir] = process.argv.slice(2);
const { BasicPitch, noteFramesToTime, outputToNotesPoly } = await import("@spotify/basic-pitch");
const BINS = 88;
const cache = `${outDir}/posteriors.f32`;
mkdirSync(outDir, { recursive: true });

let frames;
let onsets;
if (existsSync(cache)) {
	const buf = readFileSync(cache);
	const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
	const n = all.length / (2 * BINS);
	const rows = (offset) => Array.from({ length: n }, (_, i) => Array.from(all.subarray(offset + i * BINS, offset + (i + 1) * BINS)));
	frames = rows(0);
	onsets = rows(n * BINS);
} else {
	const tf = await import("@tensorflow/tfjs");
	await tf.setBackend("cpu");
	await tf.ready();
	const raw = readFileSync(inFile);
	const audio = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
	const spec = JSON.parse(readFileSync(modelJson, "utf8"));
	const weights = Buffer.from(JSON.parse(readFileSync(weightsJson, "utf8")).base64, "base64");
	const artifacts = {
		modelTopology: spec.modelTopology,
		weightSpecs: spec.weightsManifest.flatMap((g) => g.weights),
		weightData: weights.buffer.slice(weights.byteOffset, weights.byteOffset + weights.byteLength),
		format: spec.format,
		generatedBy: spec.generatedBy,
		convertedBy: spec.convertedBy,
	};
	const model = new BasicPitch(tf.loadGraphModel(tf.io.fromMemory(artifacts)));
	frames = [];
	onsets = [];
	await model.evaluateModel(
		audio,
		(f, o) => {
			frames.push(...f);
			onsets.push(...o);
		},
		() => {},
	);
	const all = new Float32Array(frames.length * BINS * 2);
	frames.forEach((row, i) => all.set(row, i * BINS));
	onsets.forEach((row, i) => all.set(row, (frames.length + i) * BINS));
	writeFileSync(cache, Buffer.from(all.buffer));
}

const configs = JSON.parse(readFileSync(configsFile, "utf8"));
for (const c of configs) {
	// outputToNotesPoly zeroes its inputs outside the frequency range; the range is the app's for every configuration, so the copies only guard against any other mutation
	const f = frames.map((r) => r.slice());
	const o = onsets.map((r) => r.slice());
	const notes = noteFramesToTime(outputToNotesPoly(f, o, c.onset, c.frame, c.minLen, c.infer, 3000, 40, c.melodia, 11));
	writeFileSync(`${outDir}/${c.id}.json`, JSON.stringify(notes.map((e) => [e.startTimeSeconds, e.durationSeconds, e.pitchMidi, e.amplitude])));
}
process.stdout.write(`${configs.length} configurations, ${frames.length} frames\n`);
