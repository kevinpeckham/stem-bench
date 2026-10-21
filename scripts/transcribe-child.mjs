/**
 * Transcribes one f32le mono 22050 Hz raw file with Basic Pitch under Node
 * (tfjs CPU) — stem-shovel's server transcription (src/lib/server/notes.ts)
 * with the same model files and the same outputToNotesPoly thresholds, so
 * the fixture's notes are what production would hear. Run by
 * scripts/build-fixture.ts; argv: <model.json> <weights.json> <in.raw>.
 */
import { readFileSync } from "node:fs";

const [modelJson, weightsJson, inFile] = process.argv.slice(2);
const tf = await import("@tensorflow/tfjs");
await tf.setBackend("cpu");
await tf.ready();
const { BasicPitch, noteFramesToTime, outputToNotesPoly } = await import("@spotify/basic-pitch");

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
const frames = [];
const onsets = [];
await model.evaluateModel(
	audio,
	(f, o) => {
		frames.push(...f);
		onsets.push(...o);
	},
	() => {},
);
// stem-shovel's thresholds: "chords want confident notes, not every flicker".
const notes = noteFramesToTime(
	outputToNotesPoly(frames, onsets, 0.5, 0.3, 11, true, 3000, 40, true, 11),
);
process.stdout.write(
	JSON.stringify(notes.map((e) => [e.startTimeSeconds, e.durationSeconds, e.pitchMidi, e.amplitude])),
);
