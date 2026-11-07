/**
 * Study 21 instrument proofs (docs/BRIEF-STUDY21.md): the extended
 * allowance credits 5(7) truth exactly as 5 truth, and the grader is
 * PINNED to Study 13's wherever no 5(7) quality appears — both anchor
 * charts, mop-heart, and the whole synthetic fixture vocabulary.
 */
import { describe, expect, test } from "bun:test";
import fixture from "../corpus/fixture.json";
import charts20b from "../corpus/mmkk-charts-20b.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { chordRight, gradeBars } from "../src/study13/grading13.js";
import { chordRight21, gradeBars21 } from "../src/study21/grading21.js";

describe("the 5(7) allowance", () => {
	test("a right-rooted maj, m or 5 answer credits on 5(7) truth", () => {
		expect(chordRight21("G", ["G5(7)"])).toBe(true);
		expect(chordRight21("Gm", ["G5(7)"])).toBe(true);
		expect(chordRight21("G5", ["G5(7)"])).toBe(true);
		expect(chordRight21("Gsus4", ["G5(7)"])).toBe(false); // sus is not in the allowance
		expect(chordRight21("A", ["G5(7)"])).toBe(false); // wrong root
		expect(chordRight("G", ["G5(7)"])).toBe(false); // the Study 13 grade does not credit it
	});
	test("everything else is Study 13's grade", () => {
		expect(chordRight21("G", ["G5"])).toBe(chordRight("G", ["G5"]));
		expect(chordRight21("D7sus4", ["D7sus4"])).toBe(true);
		expect(chordRight21("D", ["D7sus4"])).toBe(false);
		expect(chordRight21("N.C.", ["", ""])).toBe(true);
	});
});

describe("the pin: identical wherever 5(7) is absent", () => {
	const answers = ["C", "Cm", "C5", "Csus4", "C7", "N.C.", "F#", "Bb", "G/B", ""];
	test("both anchor charts and mop-heart", () => {
		const songs = [
			...(mmkkCharts.songs as { slug: string; sections: { bars: string[][] }[] }[]),
			...(charts20b.songs as { slug: string; sections: { bars: string[][] }[] }[]).filter(
				(s) => s.slug === "mop-heart",
			),
		];
		for (const song of songs) {
			const truth = song.sections.flatMap((s) => s.bars);
			for (const a of answers) {
				const perBar = truth.map(() => a);
				expect(gradeBars21(perBar, truth)).toEqual(gradeBars(perBar, truth));
			}
		}
	});
	test("the whole fixture vocabulary", () => {
		const truth = (fixture as unknown as { songs: { truth: string[] }[] }).songs.flatMap((s) =>
			s.truth.map((t) => [t]),
		);
		for (const a of answers) {
			const perBar = truth.map(() => a);
			expect(gradeBars21(perBar, truth)).toEqual(gradeBars(perBar, truth));
		}
	});
	test("and on peaceful-dreams the two grades differ only through 5(7) bars", () => {
		const song = (charts20b.songs as { slug: string; sections: { bars: string[][] }[] }[]).find(
			(s) => s.slug === "peaceful-dreams",
		)!;
		const truth = song.sections.flatMap((s) => s.bars);
		const answerRoots = truth.map((t) => t[0]!.match(/^[A-G][#b]?/)![0]);
		const g13 = gradeBars(answerRoots, truth);
		const g21 = gradeBars21(answerRoots, truth);
		const parenBars = truth.filter((t) => /\(7\)$/.test(t[0]!)).length;
		expect(g21.right - g13.right).toBe(parenBars);
		expect(parenBars).toBe(32);
	});
});
