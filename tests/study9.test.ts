import { describe, expect, test } from "bun:test";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import { renderMix, barSeconds, type MixSpec } from "../src/study4/synth4.js";
import { extractFeatures } from "../src/study9/analysis.js";
import {
	asBuffer,
	dActivity,
	dProd,
	dStemTempo,
	isRelative,
} from "../src/study9/instruments.js";
import { renderParts, stemOrder, type MixSpec9 } from "../src/study9/parts.js";

describe("renderParts sum contract (byte identity of the committed fixtures)", () => {
	// Every committed Study 4/7/8 spec: the parts' float sum must match
	// renderMix within 1e-6 per sample, so all existing truth carries over
	// and corpus/mixes/*.mp3 stay what they were.
	for (const [i, spec] of (mixes.mixes as MixSpec[]).entries()) {
		test(spec.id, () => {
			const reference = renderMix(spec, 4000 + i);
			const { parts, mix } = renderParts(spec as MixSpec9, 4000 + i);
			expect(parts.map((p) => p.role)).toEqual(["drums", "bass", "comp"]);
			expect(mix.length).toBe(reference.length);
			let worst = 0;
			for (let s = 0; s < mix.length; s++) {
				worst = Math.max(worst, Math.abs(mix[s]! - reference[s]!));
			}
			expect(worst).toBeLessThan(1e-6);
		});
	}
	test("mislead specs add exactly one extra part and the mix is the parts' sum", () => {
		for (const [i, spec] of (mixes9.mixes as MixSpec9[]).entries()) {
			const { parts, mix } = renderParts(spec, 9000 + i);
			expect(parts.map((p) => p.role)).toEqual(["drums", "bass", "comp", "extra"]);
			let energy = 0;
			let worst = 0;
			for (let s = 0; s < mix.length; s += 97) {
				const sum = parts.reduce((acc, p) => acc + p.samples[s]!, 0);
				worst = Math.max(worst, Math.abs(mix[s]! - sum));
				energy += parts[3]!.samples[s]! ** 2;
			}
			expect(worst).toBeLessThan(1e-6);
			expect(energy).toBeGreaterThan(0); // the extra actually sounds
		}
	});
});

describe("stemOrder", () => {
	test("is a deterministic permutation", () => {
		expect(stemOrder(4, 9001)).toEqual(stemOrder(4, 9001));
		expect([...stemOrder(4, 9001)].sort()).toEqual([0, 1, 2, 3]);
		expect(stemOrder(3, 4014)).not.toEqual(stemOrder(3, 4015));
	});
});

describe("the port runs at the bench rate (registered deviation: 22050 Hz vs production 32 kHz)", () => {
	test("extractFeatures derives fps from the buffer's sampleRate", () => {
		const quiet = new Float32Array(22050 * 5);
		const f = extractFeatures(asBuffer(quiet));
		expect(f.fps).toBeCloseTo(22050 / 256, 6);
	});
});

describe("instruments on the disclosed smoke item (contrast-b, seed 4015)", () => {
	// Smoke-tested once during development before registration (zero model
	// spend, disclosed in the brief); pinned so the port cannot drift.
	const spec = (mixes.mixes as MixSpec9[]).find((m) => m.id === "contrast-b")!;
	const seed = 4000 + (mixes.mixes as MixSpec9[]).findIndex((m) => m.id === "contrast-b");
	const { parts } = renderParts(spec, seed);
	const stems = parts.map((p) => p.samples);
	test("D-prod hears the truth on a clean item", () => {
		const d = dProd(stems);
		expect(d.tempo.bpm).toBe(120);
		expect(d.meter.value).toBe("4/4");
		expect(d.key.value).toBe("E minor");
	});
	test("D-stem-tempo picks the sharpest stem and flags the bass's half-time octave", () => {
		const r = dStemTempo(stems);
		expect(r.tempo.bpm).toBe(120);
		expect(r.perStem.map((p) => p.bpm)).toEqual([120, 60, 120]);
		expect(r.octaveFlag).toBe(true);
	});
	test("D-activity on the truth grid finds exactly the contrast boundaries", () => {
		let t = 0;
		const starts: number[] = [];
		for (const s of spec.sections) {
			for (let b = 0; b < s.bars.length; b++) {
				starts.push(t);
				t += barSeconds(spec.meter, s.bpm);
			}
		}
		starts.push(t);
		expect(dActivity(stems, starts).boundaries).toEqual([8, 24, 32]);
	});
});

describe("isRelative", () => {
	test("relative pairs in both directions and spellings", () => {
		expect(isRelative("E minor", "G major")).toBe(true);
		expect(isRelative("G major", "E minor")).toBe(true);
		expect(isRelative("Bb major", "G minor")).toBe(true);
		expect(isRelative("F# minor", "A major")).toBe(true);
	});
	test("non-relatives and same-mode pairs are not", () => {
		expect(isRelative("E minor", "E major")).toBe(false);
		expect(isRelative("C major", "G major")).toBe(false);
		expect(isRelative("A minor", "D minor")).toBe(false);
		expect(isRelative("C major", "A major")).toBe(false);
	});
});
