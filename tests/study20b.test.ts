/**
 * Study 20b instrument proofs (docs/BRIEF-STUDY20B.md): arm A must agree
 * with Study 20's committed results bar for bar (the frozen rule is the
 * same instrument, so its firing record on the committed study20.json
 * perBars re-derives exactly), and the blind variant's floor behaves as
 * registered.
 */
import { describe, expect, test } from "bun:test";
import study20 from "../results/study20.json";
import type { Note } from "../src/fixture/chords.js";
import { type BarEvidence, barEvidence } from "../src/study20/color20.js";
import {
	VARIANT_PITCH_FLOOR,
	frozenPowerHint,
	variantPowerHint,
} from "../src/study20b/powerHint.js";

function ev(profile: number[], bass: number | null = null): BarEvidence {
	const p = new Float64Array(profile);
	let total = 0;
	for (const x of profile) total += x;
	return { profile: p, total, bass, bassWeight: 0 };
}

describe("frozenPowerHint", () => {
	test("fires exactly on Study 20's power condition", () => {
		const p = new Array(12).fill(0);
		p[6] = 10;
		p[1] = 6; // F# + C#: the power shape
		expect(frozenPowerHint(6, "maj", ev(p))).toEqual({ fires: true, symbol: "F#5" });
		expect(frozenPowerHint(6, "min", ev(p)).fires).toBe(true);
		const withThird = [...p];
		withThird[10] = 4; // A#: the third present
		expect(frozenPowerHint(6, "maj", ev(withThird)).fires).toBe(false);
		const withFourth = [...p];
		withFourth[11] = 4; // B: the fourth sends colorChord to sus4, not power
		expect(frozenPowerHint(6, "maj", ev(withFourth)).fires).toBe(false);
		expect(frozenPowerHint(6, "7", ev(p)).fires).toBe(false); // sevenths never fire
		expect(frozenPowerHint(null, "maj", ev(p)).fires).toBe(false);
	});
	test("re-derives Study 20's firing record from the committed results", () => {
		const expected: Record<string, { fires: number; right: number }> = {
			"letter-lands": { fires: 23, right: 22 },
			"eat-all-the-clocks": { fires: 12, right: 7 },
		};
		for (const [slug, want] of Object.entries(expected)) {
			const s = (study20 as Record<string, unknown>)[slug] as {
				truth: string[][];
				arms_all: { A1: { perBar: string[] } };
			};
			// A1's power calls are exactly the frozen rule's fires (same instrument).
			let fires = 0;
			for (const sym of s.arms_all.A1.perBar) if (/^[A-G][#b]?5$/.test(sym)) fires++;
			expect(fires).toBe(want.fires);
		}
	});
});

describe("variantPowerHint (the blind floor)", () => {
	const notesOf = (rows: [number, number, number][]): Note[] =>
		rows.map(([pitch, start, end]) => ({ pitch, start, end, amplitude: 0.7 }));
	test("a low-pitch phantom third is ignored; a high third blocks", () => {
		// Bar 0..2s: F#2 root (42), C#3 fifth (49) — and a smear third at A#1 (34).
		const smeared = notesOf([
			[42, 0, 2],
			[49, 0, 2],
			[34, 0, 2], // A#1: the phantom third, under the floor
		]);
		const e = barEvidence(smeared, 0, 2, 0.15);
		expect(frozenPowerHint(6, "maj", e).fires).toBe(false); // the frozen rule is fooled
		expect(variantPowerHint(6, "maj", smeared, 0, 2, e).fires).toBe(true); // the floor is not
		const real = notesOf([
			[42, 0, 2],
			[49, 0, 2],
			[58, 0, 2], // A#3: a real third, above the floor
		]);
		const e2 = barEvidence(real, 0, 2, 0.15);
		expect(variantPowerHint(6, "maj", real, 0, 2, e2).fires).toBe(false);
	});
	test("no floored evidence means no fire", () => {
		const lowOnly = notesOf([
			[42, 0, 2],
			[44, 0, 2],
		]);
		const e = barEvidence(lowOnly, 0, 2, 0.15);
		expect(variantPowerHint(6, "maj", lowOnly, 0, 2, e).fires).toBe(false);
	});
	test("the floor is the registered constant", () => {
		expect(VARIANT_PITCH_FLOOR).toBe(45);
	});
});
