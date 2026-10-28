import { describe, expect, test } from "bun:test";
import {
	alteredLetters,
	chartReadWarnings,
	chartReadWarningsLetters,
	keySignatureSharps,
} from "../src/study6/warnings.js";

const summary = (key: string, chords: string[]) =>
	`Title: T\nPart: P\nm1 key ${key} 4/4: ${chords[0]}\n${chords
		.slice(1)
		.map((c, i) => `m${i + 2}: ${c}`)
		.join("\n")}`;

describe("keySignatureSharps (production port, pinned)", () => {
	test("majors, minors, both accidental spellings", () => {
		expect(keySignatureSharps("D major")).toBe(2);
		expect(keySignatureSharps("Eb major")).toBe(-3);
		expect(keySignatureSharps("E♭ major")).toBe(-3);
		expect(keySignatureSharps("B minor")).toBe(2);
		expect(keySignatureSharps("C minor")).toBe(-3);
		expect(keySignatureSharps("H major")).toBeNull();
	});
});

describe("chartReadWarnings (the shipped heuristic, pinned)", () => {
	test("fires on an accidental-stripped flat-key read", () => {
		const corrupted = summary("Eb major", ["E", "A", "B7", "E", "Cm", "A", "B7", "E", "A", "B7"]);
		expect(chartReadWarnings(corrupted).some((w) => w.includes("lost its accidentals"))).toBe(true);
	});
	test("quiet when any chord carries an accidental", () => {
		const clean = summary("Eb major", ["Eb", "Ab", "Bb7", "Eb", "Cm", "Ab", "Bb7", "Eb", "Ab", "Bb7"]);
		expect(chartReadWarnings(clean)).toHaveLength(0);
	});
	test("the documented blind spot: fires on an HONEST natural-chord sharp-key chart", () => {
		const honestD = summary("D major", ["D", "G", "A", "D", "Bm", "G", "A", "D", "G", "A"]);
		expect(chartReadWarnings(honestD).length).toBeGreaterThan(0);
	});
	test("surfaces Note lines", () => {
		expect(chartReadWarnings("Note: the page is unreadable.")[0]).toContain("The reader notes:");
	});
	test("floors: under 2 accidentals or under 8 chords stays quiet", () => {
		expect(chartReadWarnings(summary("G major", ["G", "C", "D", "G", "Em", "C", "D", "G"]))).toHaveLength(0);
		expect(chartReadWarnings(summary("D major", ["D", "G", "A"]))).toHaveLength(0);
	});
});

describe("chartReadWarningsLetters (the refinement under test)", () => {
	test("altered letters follow the circle", () => {
		expect([...alteredLetters(2, 0)].sort()).toEqual(["C", "F"]);
		expect([...alteredLetters(0, 3)].sort()).toEqual(["A", "B", "E"]);
	});
	test("fires on the stripped flat-key read (E, A, B on the flattened letters)", () => {
		const corrupted = summary("Eb major", ["E", "A", "B7", "E", "Cm", "A", "B7", "E", "A", "B7"]);
		expect(chartReadWarningsLetters(corrupted)).toHaveLength(1);
	});
	test("quiet on the honest natural-chord D major chart (no F or C chords)", () => {
		const honestD = summary("D major", ["D", "G", "A", "D", "Bm", "G", "A", "D", "G", "A"]);
		expect(chartReadWarningsLetters(honestD)).toHaveLength(0);
	});
	test("quiet on the clean flat-key read", () => {
		const clean = summary("Eb major", ["Eb", "Ab", "Bb7", "Eb", "Cm", "Ab", "Bb7", "Eb", "Ab", "Bb7"]);
		expect(chartReadWarningsLetters(clean)).toHaveLength(0);
	});
});
