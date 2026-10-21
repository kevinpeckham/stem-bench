import { describe, expect, test } from "bun:test";
import { chordOf, chordsPerBar, describeBars, type Note } from "../src/fixture/chords.js";

/** A note sounding across one bar. */
const note = (pitch: number, start: number, end: number, amplitude = 0.7): Note => ({
	start,
	end,
	pitch,
	amplitude,
});

describe("chordOf (the production matcher, pinned)", () => {
	test("a D major profile with a D bass is D", () => {
		const profile = new Array(12).fill(0);
		profile[2] = 3; // D
		profile[6] = 2; // F#
		profile[9] = 2; // A
		expect(chordOf(profile, 2).chord).toBe("D");
	});
	test("an empty profile is N.C.", () => {
		expect(chordOf(new Array(12).fill(0), null).chord).toBe("N.C.");
	});
	test("the previous chord is kept when it fits nearly as well", () => {
		const profile = new Array(12).fill(0);
		profile[2] = 3;
		profile[6] = 2;
		profile[9] = 2;
		// Dsus2 explains E too; with a previous of D the matcher keeps D.
		profile[4] = 0.2;
		expect(chordOf(profile, 2, "D").chord).toBe("D");
	});
	test("the missing-tone penalty (v0.142.0): root and fifth is a power chord", () => {
		const profile = new Array(12).fill(0);
		profile[2] = 4; // D
		profile[9] = 3; // A
		expect(chordOf(profile, 2).chord).toBe("D5");
	});
	test("a sounding third keeps the triad", () => {
		const profile = new Array(12).fill(0);
		profile[2] = 3;
		profile[6] = 2; // F#
		profile[9] = 2;
		expect(chordOf(profile, 2).chord).toBe("D");
	});
	test("root, fourth and fifth is sus4", () => {
		const profile = new Array(12).fill(0);
		profile[2] = 3;
		profile[7] = 2; // G
		profile[9] = 2;
		expect(chordOf(profile, 2).chord).toBe("Dsus4");
	});
	test("a minor triad with no seventh sounding is m, not m7", () => {
		const profile = new Array(12).fill(0);
		profile[11] = 3; // B
		profile[2] = 2; // D
		profile[6] = 2; // F#
		expect(chordOf(profile, 11).chord).toBe("Bm");
	});
	test("a foreign bass under a confident chord names a slash", () => {
		const profile = new Array(12).fill(0);
		profile[7] = 3; // G
		profile[11] = 2.6; // B
		profile[2] = 2; // D
		const { chord } = chordOf(profile, 11);
		expect(chord).toBe("G/B");
	});
});

describe("chordsPerBar and describeBars (pinned on two bars)", () => {
	// Bar 1 (0–2 s): D major (D2 bass, D4 F#4 A4). Bar 2 (2–4 s): silence.
	const notes: Note[] = [
		note(38, 0.0, 1.8),
		note(62, 0.0, 0.5),
		note(66, 0.0, 0.5),
		note(69, 0.0, 0.5),
		note(62, 1.0, 1.5),
		note(66, 1.0, 1.5),
		note(69, 1.0, 1.5),
	];
	const starts = [0, 2, 4];

	test("one D segment, one N.C. segment", () => {
		const segments = chordsPerBar(notes, starts);
		expect(segments.map((s) => [s.bar, s.bars, s.chord])).toEqual([
			[1, 1, "D"],
			[2, 1, "N.C."],
		]);
	});
	test("the bar-notes line is production's format", () => {
		const bars = describeBars(notes, starts);
		expect(bars[0]!.notes.startsWith("D2×1.8@0.7 D4×0.5@0.7")).toBe(true);
		expect(bars[1]!.notes).toBe("(silence)");
	});
	test("notes under 150 ms are left out of the line", () => {
		const bars = describeBars([...notes, note(71, 0.0, 0.1)], starts);
		expect(bars[0]!.notes).not.toContain("B4");
	});
});
