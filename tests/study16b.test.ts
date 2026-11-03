import { describe, expect, test } from "bun:test";
import {
	ALIGNMENT_SAME_PIECE_LOCAL_COST,
	ALIGNMENT_SAME_PIECE_RATIO,
} from "../src/study16b/constants.js";
import { alignedPlacements } from "../src/study16b/alignedPlacements.js";
import type { Alignment } from "../src/study15/chartAlignment.js";
import type { ChartBar } from "../src/study14/chartBars.js";

const bar = (over: Partial<ChartBar>): ChartBar => ({
	measure: 1,
	chords: ["C"],
	bpm: 120,
	meter: "4/4",
	key: null,
	section: null,
	...over,
});
const alignment = (over: Partial<Alignment>): Alignment =>
	({
		barStarts: [0, 2],
		cost: 1,
		controlCost: 2,
		localCost: [0.2, 0.2],
		firstSound: 0,
		lastSound: 4,
		hopSec: 0.09287981859410431,
		...over,
	}) as Alignment;
const BARS = [bar({ section: "A" }), bar({ measure: 2 })];

describe("the 2d585b75 port, pinned", () => {
	test("the constants are the bench-recommended pair", () => {
		expect(ALIGNMENT_SAME_PIECE_RATIO).toBe(1.6);
		expect(ALIGNMENT_SAME_PIECE_LOCAL_COST).toBe(0.3);
	});
	test("samePiece needs BOTH clauses: the Study 16 escapee shape (ratio 1.74, median 0.323) is rejected", () => {
		const escapee = alignedPlacements(BARS, alignment({ cost: 1, controlCost: 1.74, localCost: [0.323, 0.323] }));
		expect(escapee.ratio).toBeCloseTo(1.74, 9);
		expect(escapee.samePiece).toBe(false);
		const ratioFail = alignedPlacements(BARS, alignment({ cost: 1, controlCost: 1.5, localCost: [0.2, 0.2] }));
		expect(ratioFail.samePiece).toBe(false);
		const bothPass = alignedPlacements(BARS, alignment({ cost: 1, controlCost: 2.0, localCost: [0.21, 0.21] }));
		expect(bothPass.samePiece).toBe(true);
	});
	test("the boundary is inclusive at 0.30 and exclusive above it", () => {
		expect(alignedPlacements(BARS, alignment({ localCost: [0.3, 0.3] })).samePiece).toBe(true);
		expect(alignedPlacements(BARS, alignment({ localCost: [0.301, 0.301] })).samePiece).toBe(false);
	});
});
