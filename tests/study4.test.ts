import { describe, expect, test } from "bun:test";
import { deference, gradeListen, keyEqual } from "../src/grading/listen.js";
import { parseAnswer, question4, system4 } from "../src/study4/prompt4.js";
import { barSeconds, truthOf, type MixSpec } from "../src/study4/synth4.js";
import fixture from "../corpus/fixture4.json";

describe("system4/question4 (production text, pinned)", () => {
	test("anchor phrases verbatim", () => {
		const s = system4(false);
		expect(s).toContain("You are a musician with perfect time and pitch.");
		expect(s).toContain("answer null — that is a valid and common answer; do not invent a number.");
		expect(s).toContain('Reply with JSON only, no prose, exactly: {"tempo": 128,');
		expect(system4(true)).toContain("The song's own chart comes with the recording");
		expect(system4(true)).toContain("Take the keys from the chart");
		expect(system4(false)).not.toContain("chart");
	});
	test("question branches match production", () => {
		expect(question4(null, null)).toBe(
			"What are the tempo (or none), any tempo shifts, the time signature, the key and any key changes?",
		);
		expect(question4({ tempo: "120", key: "D major", meter: "4/4" }, null)).toBe(
			"A detector estimated: tempo 120 bpm, key D major, time signature 4/4. Confirm or correct each from what you hear; it cannot tell a free tempo or a tempo shift from a steady one, so check those yourself.",
		);
		expect(question4(null, { filename: "x.musicxml", text: "m1: D" })).toContain(
			"The chart, from x.musicxml:\nm1: D",
		);
	});
	test("parseAnswer uses production's error strings", () => {
		expect(parseAnswer("no json").error).toBe("The model did not answer in the expected form");
		expect(parseAnswer('{"tempo": 5000}').error).toBe("The model's answer did not make sense");
		const good = parseAnswer(
			'{"tempo": 120, "meter": "4/4", "key": "D major", "confidence": 0.9}',
		);
		expect(good.answer?.tempo).toBe(120);
		expect(good.answer?.tempoChanges).toEqual([]);
	});
});

describe("truthOf", () => {
	const spec: MixSpec = {
		id: "t",
		title: "T",
		meter: "4/4",
		sections: [
			{ bpm: 100, key: "C major", bars: ["C", "F", "G", "C"] },
			{ bpm: 140, key: "D major", bars: ["D", "G", "A", "D"] },
		],
	};
	test("section boundaries become changes with exact seconds", () => {
		const truth = truthOf(spec);
		expect(truth.tempo).toBe(100);
		expect(truth.tempoChanges).toEqual([{ at: 4 * barSeconds("4/4", 100), bpm: 140 }]);
		expect(truth.keyChanges).toHaveLength(1);
		expect(truth.keyChanges[0]!.key).toBe("D major");
	});
	test("pulseless truth is null tempo, free meter", () => {
		const truth = truthOf({ ...spec, pulseless: true });
		expect(truth.tempo).toBeNull();
		expect(truth.meter).toBe("free");
		expect(truth.tempoChanges).toEqual([]);
	});
});

describe("gradeListen", () => {
	const truth = {
		tempo: 100,
		meter: "4/4" as const,
		key: "C major",
		tempoChanges: [{ at: 9.6, bpm: 140 }],
		keyChanges: [],
		durationSec: 30,
	};
	const answer = (over: object) => ({
		tempo: 100,
		tempoChanges: [],
		meter: "4/4",
		key: "C major",
		keyChanges: [],
		confidence: 0.8,
		notes: "",
		...over,
	});
	test("tolerances", () => {
		expect(gradeListen(answer({ tempo: 102 }), truth).tempoCorrect).toBe(true);
		expect(gradeListen(answer({ tempo: 50 }), truth).octaveError).toBe(true);
		expect(gradeListen(answer({ tempo: 200 }), truth).octaveError).toBe(true);
		expect(gradeListen(answer({ key: "B# major" }), truth).keyCorrect).toBe(true);
	});
	test("6/8 accepts the eighth-note reading", () => {
		const t68 = { ...truth, meter: "6/8" as const, tempo: 60 };
		expect(gradeListen(answer({ tempo: 180, meter: "6/8" }), t68).tempoCorrect).toBe(true);
		expect(gradeListen(answer({ tempo: 62, meter: "6/8" }), t68).tempoCorrect).toBe(true);
	});
	test("changes place within ±4 s", () => {
		const g = gradeListen(answer({ tempoChanges: [{ at: 12, bpm: 141 }] }), truth);
		expect(g.tempoChangesFound).toBe(1);
		const far = gradeListen(answer({ tempoChanges: [{ at: 20, bpm: 140 }] }), truth);
		expect(far.tempoChangesFound).toBe(0);
		expect(far.falseTempoChanges).toBe(1);
	});
	test("invented tempo on a pulseless truth", () => {
		const still = { ...truth, tempo: null, meter: "free" as const, tempoChanges: [] };
		expect(gradeListen(answer({ tempo: 120, meter: "free" }), still).inventedTempo).toBe(true);
		expect(gradeListen(answer({ tempo: null, meter: "free" }), still).inventedTempo).toBe(false);
	});
	test("deference to wrong candidates", () => {
		const d = deference(answer({ tempo: 200, key: "F major", meter: "3/4" }), {
			tempo: "200",
			key: "F major",
			meter: "3/4",
		});
		expect(d).toEqual({ tempo: true, key: true, meter: true });
	});
	test("keyEqual handles enharmonics and rejects mode swaps", () => {
		expect(keyEqual("Eb major", "D# major")).toBe(true);
		expect(keyEqual("C major", "C minor")).toBe(false);
		expect(keyEqual("C major", "atonal")).toBe(false);
	});
});

describe("the committed fixture", () => {
	test("17 items (Study 8 added three contrast mixes): 15 metered with charts, 2 pulseless without", () => {
		const items = fixture.items;
		expect(items).toHaveLength(17);
		expect(items.filter((i) => i.pulseless)).toHaveLength(2);
		for (const i of items) {
			expect(i.pulseless ? i.chart === null : typeof i.chart === "string").toBe(true);
			expect(i.wrong.tempo).toBeTruthy();
		}
	});
	test("wrong candidates never equal the truth", () => {
		for (const i of fixture.items) {
			if (i.truth.tempo !== null) expect(Number(i.wrong.tempo)).not.toBe(i.truth.tempo);
			expect(keyEqual(i.wrong.key, i.truth.key)).toBe(false);
			expect(i.wrong.meter).not.toBe(i.truth.meter);
		}
	});
});
