import { describe, expect, it } from "bun:test";
import { barsOf, quantizeBar } from "../src/study48/bassLine.js";
import { trusts52, trusts52b } from "../src/study52/second.js";

const bar = barsOf([10, 10.5, 11, 11.5], [10], 12)[0]!;
const n = (start: number, pitch = 40) => ({ start, end: start + 0.2, pitch });
const line = (notes: { start: number; end: number; pitch: number }[]) => quantizeBar(notes, bar, "straight");

describe("Study 52 rules", () => {
	const shown = line([n(10), n(10.5), n(11, 43)]);
	const other = line([n(10), n(10.5)]);
	it("shows a bar by agreement with Basic Pitch, with pYIN, with either, with both", () => {
		expect(trusts52(shown, shown, shown)).toEqual({ everyBar: true, bp: true, pyin: true, either: true, both: true });
		expect(trusts52(shown, shown, other)).toEqual({ everyBar: true, bp: true, pyin: false, either: true, both: false });
		expect(trusts52(shown, other, shown)).toEqual({ everyBar: true, bp: false, pyin: true, either: true, both: false });
		expect(trusts52(shown, other, other)).toEqual({ everyBar: true, bp: false, pyin: false, either: false, both: false });
	});
	it("arm 2 adds agreement with the first arm's reader", () => {
		expect(trusts52b(shown, other, other, shown)).toEqual({ everyBar: true, bp: false, pyin: false, either: false, both: false, hfbass: true });
		expect(trusts52b(shown, shown, other, other)).toMatchObject({ bp: true, hfbass: false });
	});
});
