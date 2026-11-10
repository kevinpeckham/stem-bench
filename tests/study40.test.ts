import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { analyse as analyse200, extractFeatures as extract200 } from "../src/study11b/analysis200.js";
import { peakNorm } from "../src/study33/stereo.js";
import { DEFAULTS, detectionFrom, probe, subdivisionFrom, type TempoProbe } from "../src/study40/probe.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
// Local audio only (gitignored): the pin runs where the corpus is decoded and is skipped elsewhere.
const PIN = ["corpus-study35/jw-gravity.mp3.22050.f32le.raw", "corpus-study34/jw-let-it-in.mp3.22050.f32le.raw", "corpus-study35/jw-swansong.mp3.22050.f32le.raw"].filter((p) => existsSync(`${root}${p}`));

function loadRaw(path: string): Float32Array {
	const buf = readFileSync(path);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

describe("study 40 detector probe", () => {
	test.skipIf(PIN.length === 0)("reproduces analyse200's bpm, subdivision and meter from stored numbers", () => {
		for (const p of PIN) {
			const f = extract200(asBuffer(peakNorm(loadRaw(`${root}${p}`)), RATE));
			const det = analyse200(f);
			const t = probe(f);
			expect(t).not.toBeNull();
			const d = detectionFrom(t as TempoProbe, DEFAULTS);
			expect(d.bpm).toBe(det.tempo.bpm);
			expect(subdivisionFrom(t as TempoProbe, DEFAULTS).subdivision).toBe(det.tempo.subdivision);
			expect(d.meter).toBe(det.meter.value);
		}
	}, 120_000);

	test("subdivisionFrom follows the two tests and their thresholds", () => {
		const base: TempoProbe = {
			fps: 100,
			lag0: 50,
			confidence: 0.5,
			lag1: 75,
			ac0: { "0.333": 0.3, "0.5": 0.4, "1": 1, "1.5": 0.5, "2": 0.6, "3": 0.5, "4": 0.7, "6": 0.4, "8": 0.6 },
			ac1: { "1": 0.5, "1.5": 0.4, "2": 0.5, "3": 0.4, "4": 0.5, "6": 0.3, "8": 0.4 },
			lean0: 0,
			lean1: 0,
		};
		expect(subdivisionFrom(base).branch).toBe("none");
		// sub-beat: third beats half by the margin and carries the share
		expect(subdivisionFrom({ ...base, ac0: { ...base.ac0, "0.333": 0.6 } }).branch).toBe("sub");
		expect(subdivisionFrom({ ...base, ac0: { ...base.ac0, "0.333": 0.6 } }, { ...DEFAULTS, tripletShare: 0.7 }).branch).toBe("none");
		// super-beat: dotted beats double by the margin
		expect(subdivisionFrom({ ...base, ac0: { ...base.ac0, "1.5": 0.7 } }).branch).toBe("super");
		expect(subdivisionFrom({ ...base, ac0: { ...base.ac0, "1.5": 0.7 } }).lag).toBe(75);
		expect(detectionFrom({ ...base, ac0: { ...base.ac0, "1.5": 0.7 } }).bpm).toBe(80);
		expect(detectionFrom({ ...base, lean0: 0.1 }).meter).toBe("3/4");
		expect(detectionFrom({ ...base, ac0: { ...base.ac0, "0.333": 0.6 } }).meter).toBe("6/8");
	});
});
