/**
 * Study 40 (docs/BRIEF-STUDY40.md), $0: one feature extraction per
 * regular mix of the Study 36b catalog; stores the detector's own reading
 * (analyse200) beside the probe's numbers (src/study40/probe.ts) so the
 * threshold sweeps in run-study40.ts are arithmetic on a committed file.
 * Writes results/study40-features.json, resumable.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { analyse as analyse200, extractFeatures as extract200 } from "../src/study11b/analysis200.js";
import { peakNorm } from "../src/study33/stereo.js";
import { probe, type TempoProbe } from "../src/study40/probe.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const OUT = `${root}results/study40-features.json`;
interface Entry {
	bpm: number | null;
	meter: string | null;
	feel: string | null;
	regular?: { file: string };
}
const manifest = JSON.parse(readFileSync(`${root}corpus/study36b-manifest.json`, "utf8")) as { entries: Record<string, Entry> };
interface Row {
	declared: { bpm: number; meter: string; feel: string | null };
	detector: { bpm: number; confidence: number; subdivision: number; meter: string; alternates: { factor: number; bpm: number; strength: number }[] };
	probe: TempoProbe | null;
}
const rows: Record<string, Row> = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")) as { rows: Record<string, Row> }).rows : {};
let n = 0;
for (const [slug, e] of Object.entries(manifest.entries)) {
	if (!e.bpm || !e.meter || !e.regular || rows[slug]) continue;
	const buf = readFileSync(`${root}corpus-study36/regular/${e.regular.file}.22050.f32le.raw`);
	const mono = peakNorm(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
	const f = extract200(asBuffer(mono, RATE));
	const det = analyse200(f);
	rows[slug] = {
		declared: { bpm: e.bpm, meter: e.meter, feel: e.feel },
		detector: { bpm: det.tempo.bpm, confidence: det.tempo.confidence, subdivision: det.tempo.subdivision, meter: det.meter.value, alternates: det.tempo.alternates },
		probe: probe(f),
	};
	if (++n % 20 === 0) {
		writeFileSync(OUT, `${JSON.stringify({ rows }, null, "\t")}\n`);
		console.log(`${n} extracted`);
	}
}
writeFileSync(OUT, `${JSON.stringify({ rows }, null, "\t")}\n`);
console.log(`${Object.keys(rows).length} rows -> ${OUT}`);
