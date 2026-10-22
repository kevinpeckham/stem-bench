import { describe, expect, test } from "bun:test";
import { chordKey, chordScore, classRecall, honesty, parseSummary } from "../src/grading/summary.js";
import { chordSpecOf, scoreXml } from "../src/study3/musicxml.js";
import { musicXmlSummary } from "../src/study3/musicXmlSummary.js";
import { SYSTEM_3 } from "../src/study3/runner.js";
import fixture from "../corpus/fixture3.json";

describe("generator → production summary round trip (pinned)", () => {
	const xml = scoreXml({
		id: "t",
		title: "Test Tune",
		partName: "Lead",
		measures: [
			{
				key: { fifths: 2, mode: "major" },
				time: { beats: 4, beatType: 4 },
				tempo: 120,
				mark: "A",
				chords: [chordSpecOf("D")],
			},
			{ chords: [chordSpecOf("A7")] },
			{ repeat: "forward", chords: [chordSpecOf("Bm7")] },
			{ ending: 1, repeat: "backward", chords: [chordSpecOf("G/B")] },
			{ chords: [] },
		],
	});
	const summary = musicXmlSummary(xml);
	test("the summary carries every element class", () => {
		expect(summary).toContain("Title: Test Tune");
		expect(summary).toContain("Part: Lead (1 part)");
		expect(summary).toContain('m1 key D major 4/4 tempo 120 [A] "120 bpm": D');
		expect(summary).toContain("m2: A7");
		expect(summary).toContain("m3 |:: Bm7");
		expect(summary).toContain("m4 :| ending 1: G/B");
		expect(summary).toContain("m5: N.C.");
	});
	test("the generated XML names chords the way charts do", () => {
		expect(xml).toContain("<root-step>G</root-step>");
		expect(xml).toContain("<bass-step>B</bass-step>");
		expect(xml).toContain('<kind text="N.C.">none</kind>');
	});
});

describe("chordKey (extended equivalence)", () => {
	test("verovio's capitalized Maj7 equals maj7, unicode flats read", () => {
		expect(chordKey("GMaj7")).toBe(chordKey("Gmaj7"));
		expect(chordKey("B♭maj7")).toBe(chordKey("Bbmaj7"));
		expect(chordKey("Dm7♭5")).toBe(chordKey("Dm7b5"));
	});
	test("slash bass ignored, N.C. normalized", () => {
		expect(chordKey("E♭/G")).toBe(chordKey("Eb"));
		expect(chordKey("N.C.")).toBe("NC");
	});
	test("roots and qualities both matter", () => {
		expect(chordKey("D")).not.toBe(chordKey("D7"));
		expect(chordKey("D")).not.toBe(chordKey("E"));
	});
});

describe("parseSummary and scoring", () => {
	const gt = parseSummary(
		'Title: X\nPart: Y\nm1 key D major 4/4 tempo 120 [A] "120 bpm": D\nm2: A7\nm3 |:: Bm7\nm4 :| ending 1: G/B\nm5: N.C.',
	);
	test("GT parses every class", () => {
		expect(gt.measures.get(1)?.keys).toEqual(["D major"]);
		expect(gt.measures.get(1)?.times).toEqual(["4/4"]);
		expect(gt.measures.get(1)?.tempos).toContain(120);
		expect(gt.measures.get(1)?.rehearsals).toEqual(["A"]);
		expect(gt.measures.get(3)?.repeats).toEqual(["|:"]);
		expect(gt.measures.get(4)?.endings).toEqual([1]);
		expect(gt.measures.get(5)?.chords).toEqual(["NC"]);
	});
	test("exact and ±1 recall", () => {
		const model = parseSummary("m1 key D major 4/4: D\nm3: A7\nm3 |:: Bm7");
		expect(classRecall(gt, model, "keys").exact).toBe(1);
		const chords = chordScore(gt, model);
		expect(chords.exact).toBe(2); // D at m1, Bm7 at m3
		expect(chords.near).toBe(3); // A7 found at m3, one off from m2
	});
	test("the words class never counts tempo words", () => {
		expect(gt.measures.get(1)?.words ?? []).toHaveLength(0);
	});
	test("honesty reads the Note line and counts fabrication", () => {
		const honest = honesty(parseSummary("Note: the page is unreadable at this resolution."));
		expect(honest.declaredUnreadable).toBe(true);
		expect(honest.fabricatedChordLines).toBe(0);
		const liar = honesty(parseSummary("m1 key G major 4/4: G\nm2: C"));
		expect(liar.declaredUnreadable).toBe(false);
		expect(liar.fabricatedChordLines).toBe(2);
	});
});

describe("the committed fixture", () => {
	test("11 items, one probe, two multi-page, summaries non-empty", () => {
		const items = fixture.items;
		expect(items).toHaveLength(11);
		expect(items.filter((i) => i.unreadable)).toHaveLength(1);
		expect(items.filter((i) => i.pages > 1)).toHaveLength(2);
		for (const i of items) expect(i.summary.split("\n").length).toBeGreaterThan(i.measures);
	});
	test("the production system prompt anchors are verbatim", () => {
		expect(SYSTEM_3).toContain("You read music notation.");
		expect(SYSTEM_3).toContain("one line per measure that carries anything of note");
		expect(SYSTEM_3).toContain('say so on a final line beginning "Note:"');
	});
});
