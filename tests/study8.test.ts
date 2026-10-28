import { describe, expect, test } from "bun:test";
import mixes from "../corpus/mixes.json";
import {
	grade8,
	markedChart,
	parseSections,
	question8,
	sectionTruth,
	system8,
} from "../src/study8/sections.js";
import type { MixSpec } from "../src/study4/synth4.js";

describe("system8/question8 (v0.192.0 production text, pinned)", () => {
	test("anchors verbatim, confidence gone", () => {
		const s = system8(false);
		expect(s).toContain("You are a musician with perfect time who knows song form.");
		expect(s).toContain("precise to the tenth of a second");
		expect(s).not.toContain("confidence");
		expect(system8(true)).toContain("Take the sections from the chart where it marks them");
	});
	test("question branches: facts, vocabulary, chart", () => {
		const q = question8({ tempo: "100", meter: "4/4", vocabulary: ["Verse", "Chorus"] }, "m1 [Verse]: C");
		expect(q).toContain("The song's settings say: tempo 100 bpm, time signature 4/4.");
		expect(q).toContain("This band names its sections with words like: Verse, Chorus.");
		expect(q).toContain("The chart, from the song:\nm1 [Verse]: C");
		expect(question8({ tempo: null, meter: null, vocabulary: [] }, null)).toBe(
			"Where does each section of this song begin, and what is it?",
		);
	});
});

describe("sectionTruth and markedChart", () => {
	const spec = (mixes.mixes as MixSpec[]).find((m) => m.id === "contrast-b")!;
	test("boundaries at exact seconds with names", () => {
		const t = sectionTruth(spec);
		expect(t.sections).toHaveLength(4);
		expect(t.sections[0]).toEqual({ at: 0, name: "Intro" });
		expect(t.sections[1]!.at).toBeCloseTo(8, 5); // 4 bars at 120 bpm 4/4
		expect(t.sections[1]!.name).toBe("Verse");
	});
	test("the marked chart carries each section's rehearsal mark", () => {
		const chart = markedChart(spec);
		for (const mark of ["[Intro]", "[Verse]", "[Bridge]", "[Chorus]"]) expect(chart).toContain(mark);
	});
	test("unnamed sections mark with letters", () => {
		const shift = (mixes.mixes as MixSpec[]).find((m) => m.id === "shift-a")!;
		const chart = markedChart(shift);
		expect(chart).toContain("[A]");
		expect(chart).toContain("[B]");
	});
});

describe("grade8", () => {
	const truth = { sections: [{ at: 0, name: "Verse" as string | null }, { at: 19.2, name: "Chorus" }, { at: 38.4, name: "Verse" }] };
	test("boundaries within ±4 s, names by prefix, false boundaries counted", () => {
		const g = grade8(
			{ sections: [{ at: 0, name: "Verse" }, { at: 21, name: "Chorus 1" }, { at: 10, name: "Lift" }], notes: "" },
			truth,
		);
		expect(g.boundariesFound).toBe(1);
		expect(g.boundariesTotal).toBe(2);
		expect(g.namesCorrect).toBe(1);
		expect(g.falseBoundaries).toBe(1);
		expect(g.sectionCountDelta).toBe(0);
	});
	test("a single-section answer on a single-section truth is clean", () => {
		const g = grade8({ sections: [{ at: 0, name: "Verse" }], notes: "" }, { sections: [{ at: 0, name: null }] });
		expect(g.boundariesTotal).toBe(0);
		expect(g.falseBoundaries).toBe(0);
	});
});

describe("parseSections", () => {
	test("parses and errors with production strings", () => {
		expect(parseSections('{"sections":[{"at":0,"name":"Intro"}]}').answer?.sections).toHaveLength(1);
		expect(parseSections("nope").error).toBe("The model did not answer in the expected form");
	});
});
