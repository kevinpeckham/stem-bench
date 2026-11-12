import { describe, expect, it } from "bun:test";
import { barsOf, quantizeBar } from "../src/study48/bassLine.js";
import { addBar, coverage, emptyScore, precision, sameLine, trusts, wrongShare } from "../src/study51/trust.js";

const bars = barsOf([10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5], [10, 12], 14);
const bar = bars[0]!;
const n = (start: number, pitch = 40) => ({ start, end: start + 0.2, pitch });
const line = (notes: { start: number; end: number; pitch: number }[], mode?: "straight" | "triplet") => quantizeBar(notes, bar, mode);

describe("Study 51 same line", () => {
	const a = line([n(10), n(10.5), n(11, 43)]);
	it("is the same with the same pitches in the same slots, whatever the note lengths", () => {
		expect(sameLine(a, line([n(10.01), { start: 10.49, end: 11, pitch: 40 }, n(11.02, 43)]))).toBe(true);
	});
	it("differs on a missing, an extra, a moved or a repitched note", () => {
		expect(sameLine(a, line([n(10), n(10.5)]))).toBe(false);
		expect(sameLine(a, line([n(10), n(10.5), n(11, 43), n(11.5)]))).toBe(false);
		expect(sameLine(a, line([n(10), n(10.625), n(11, 43)]))).toBe(false);
		expect(sameLine(a, line([n(10), n(10.5), n(11, 55)]))).toBe(false);
	});
	it("differs across subdivisions unless both are empty", () => {
		expect(sameLine(line([n(10), n(10.5)], "straight"), line([n(10), n(10.5)], "triplet"))).toBe(false);
		expect(sameLine(line([], "straight"), line([], "triplet"))).toBe(true);
	});
});

describe("Study 51 rules", () => {
	const shown = line([n(10), n(10.5), n(11, 43)]);
	const extra = line([n(10), n(10.5), n(11, 43), n(11.5, 43)]);
	it("trusts by each kind of agreement, and `all` only by every one", () => {
		expect(trusts({ shown, app: shown, frame: shown, short: shown, pyin: shown })).toEqual({ everyBar: true, configs: true, loosened: true, pyin: true, all: true });
		expect(trusts({ shown, app: extra, frame: shown, short: shown, pyin: shown })).toEqual({ everyBar: true, configs: false, loosened: true, pyin: true, all: false });
		expect(trusts({ shown, app: shown, frame: shown, short: extra, pyin: shown })).toMatchObject({ loosened: false, pyin: true, all: false });
		expect(trusts({ shown, app: shown, frame: shown, short: shown, pyin: extra })).toMatchObject({ configs: true, loosened: true, pyin: false, all: false });
	});
});

describe("Study 51 score", () => {
	it("counts shown bars by grade, rests apart, and the notes written right", () => {
		const truth = line([n(10), n(10.5), n(11, 43)]);
		const s = emptyScore();
		addBar(s, truth, line([n(10), n(10.5), n(11, 43)]), true); // right, shown
		addBar(s, truth, line([n(10), n(10.5), n(11, 55)]), true); // one error, shown
		addBar(s, truth, line([n(10)]), true); // wrong, shown
		addBar(s, truth, line([n(10), n(10.5), n(11, 43)]), false); // right, not trusted
		addBar(s, line([]), line([]), true); // a rest the truth also has
		addBar(s, truth, line([]), true); // a rest where the part plays
		addBar(s, truth, line([]), false); // an untrusted empty bar counts nowhere but the truth's onsets
		expect(s).toEqual({ bars: 4, shown: 3, right: 1, oneError: 1, wrong: 1, rests: 2, restsRight: 1, truthOnsets: 18, notesShownRight: 6 });
		expect(precision(s)).toBeCloseTo(1 / 3, 9);
		expect(wrongShare(s)).toBeCloseTo(1 / 3, 9);
		expect(coverage(s)).toBeCloseTo(3 / 4, 9);
		expect(precision(emptyScore())).toBe(0);
	});
});
