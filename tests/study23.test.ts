/**
 * Study 23 instrument proofs (docs/BRIEF-STUDY23.md): the prompt is the
 * Study 1 production builder wherever the meter is 4/4, the expansion
 * and root grades behave, the dialect census is exactly 62, and the
 * production adapter path reads a known-good chart.
 */
import { describe, expect, test } from "bun:test";
import charts20b from "../corpus/mmkk-charts-20b.json";
import { question, system } from "../src/harness/prompt.js";
import { chartPerBar, expandChords, isDialectBar, rootScore } from "../src/study23/grade23.js";
import { hintMarks, question23, system23 } from "../src/study23/prompt23.js";

describe("the prompt pins", () => {
	test("system is production's A-matcher system, verbatim", () => {
		expect(system23()).toBe(system("A-matcher"));
	});
	test("question23 at 4/4 is byte-identical to the Study 1 builder", () => {
		const song = {
			id: "s",
			title: "Pin Song",
			key: "D major",
			bpm: 132,
			truth: ["D", "D", "G", "A"],
			barNotes: [1, 2, 3, 4].map((bar) => ({ bar, notes: `D3×1.0@0.8` })),
			matcherSegments: [
				{ bar: 1, bars: 2, chord: "D" },
				{ bar: 3, bars: 1, chord: "G" },
				{ bar: 4, bars: 1, chord: "A" },
			],
			matcherPerBar: ["D", "D", "G", "A"],
		};
		expect(
			question23({
				title: song.title,
				bpm: song.bpm,
				key: song.key,
				meter: "4/4",
				barNotes: song.barNotes,
				hintPerBar: ["D", "D", "G", "A"],
			}),
		).toBe(question(song, "A-matcher"));
	});
	test("the registered adaptation: the meter interpolates", () => {
		const q = question23({
			title: "Waltz",
			bpm: 224,
			key: "A major",
			meter: "3/4",
			barNotes: [{ bar: 1, notes: "A2×0.5@0.9" }],
			hintPerBar: ["A"],
		});
		expect(q).toContain("224 bpm, A major, 3/4");
	});
	test("hint segments: equal neighbors become %", () => {
		const m = hintMarks(["D", "D", "G", "G", "D"]);
		expect([...m.values()]).toEqual(["D", "%", "G", "%", "D"]);
	});
});

describe("expandChords", () => {
	test("% repeats the previous chord", () => {
		expect(expandChords("D7sus4 % % C5 G5 %")).toEqual([
			"D7sus4",
			"D7sus4",
			"D7sus4",
			"C5",
			"G5",
			"G5",
		]);
	});
	test("a leading % is empty and stays empty", () => {
		expect(expandChords("% D")).toEqual(["", "D"]);
	});
});

describe("rootScore and the dialect census", () => {
	const peaceful = (charts20b.songs as { slug: string; sections: { bars: string[][] }[] }[]).find(
		(s) => s.slug === "peaceful-dreams",
	)!;
	const truth = peaceful.sections.flatMap((s) => s.bars);
	test("peaceful-dreams has exactly 62 dialect bars", () => {
		expect(truth.filter(isDialectBar).length).toBe(62);
	});
	test("roots: enharmonics equal, wrong roots not", () => {
		expect(rootScore(["D", "A#"], [["D5"], ["Bb"]])).toEqual({ right: 2, bearing: 2 });
		expect(rootScore(["E", ""], [["D5"], ["A"]])).toEqual({ right: 0, bearing: 2 });
		expect(rootScore(["D"], [[""], []]).bearing).toBe(0);
	});
});

describe("the production adapter path", () => {
	test("reads a known-good mini chart to per-bar chords", () => {
		const md = `# Mini\n\n## Verse\n\n| D | G | A | D |\n`;
		expect(chartPerBar(md, { tempo: 120, meter: "4/4" })).toEqual(["D", "G", "A", "D"]);
	});
	test("refuses an empty document", () => {
		expect(chartPerBar("just words, no bars", { tempo: 120, meter: "4/4" })).toBeNull();
	});
});
