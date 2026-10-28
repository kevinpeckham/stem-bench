import { describe, expect, test } from "bun:test";
import mixes from "../corpus/mixes.json";
import { chordChart } from "../src/study7/chordChart.js";
import {
	chartStatedAnswer,
	chartNote7,
	parseAnswer7,
	question7,
	system7,
} from "../src/study7/prompt7.js";
import { grade7 } from "../src/study7/runner7.js";
import type { MixSpec } from "../src/study4/synth4.js";

describe("system7/question7 (v0.192.0 production text, pinned)", () => {
	test("the redesigned anchors are verbatim", () => {
		const s = system7(false);
		expect(s).toContain("reading a song's chart while its recording plays");
		expect(s).toContain("Do not estimate a tempo by ear.");
		expect(s).toContain('null when the chart has no tempo mark');
		expect(s).not.toContain("confidence");
		expect(system7(true)).toContain("as the band wrote it");
		expect(system7(true)).toContain("read each part's key from the chords it moves through");
	});
	test("settings ride as bar-following facts, never confirm/correct", () => {
		const q = question7({ tempo: "120", meter: "4/4" }, "m1: D");
		expect(q).toContain("The song's settings say: tempo 120 bpm, time signature 4/4; use them to follow the bars.");
		expect(q).not.toContain("Confirm or correct");
		expect(question7({ tempo: null, meter: null }, "m1: D")).not.toContain("settings say");
	});
	test("chartNote7 branches match production", () => {
		expect(chartNote7(false)).toContain("measure-by-measure summary");
		expect(chartNote7(true)).toContain('repeats as "x2"');
	});
});

describe("chartStatedAnswer (verbatim port, pinned)", () => {
	const answer = { tempo: 120, tempoChanges: [{ at: 10, bpm: 140 }], meter: "4/4" as string | null };
	test("keeps tempo/meter when the chart states them", () => {
		const kept = chartStatedAnswer(answer, 'm1 key D major 4/4 tempo 120 "120 bpm": D');
		expect(kept.tempo).toBe(120);
		expect(kept.meter).toBe("4/4");
	});
	test("nulls tempo/meter on a chord-only chart", () => {
		const trimmed = chartStatedAnswer(answer, "# T\n## Section A\n| D | G | A | D |");
		expect(trimmed.tempo).toBeNull();
		expect(trimmed.tempoChanges).toEqual([]);
		expect(trimmed.meter).toBeNull();
	});
	test("a band chart saying '120 bpm' keeps tempo", () => {
		expect(chartStatedAnswer(answer, "play it at 120 bpm").tempo).toBe(120);
	});
});

describe("chordChart (the band-chart generator)", () => {
	const specs = mixes.mixes as MixSpec[];
	test("no generated chart ever states tempo or meter (the structural guarantee)", () => {
		for (const spec of specs.filter((s) => !s.pulseless)) {
			const text = chordChart(spec);
			expect(/\btempo \d|\b\d{2,3} ?bpm\b|[♩♪] ?= ?\d{2,3}/i.test(text)).toBe(false);
			expect(/(^|\s)\d{1,2}\/\d{1,2}(?=\s|$|:)/m.test(text)).toBe(false);
			expect(text).toContain("## Section A");
			expect(text).toContain("| ");
		}
	});
});

describe("grade7", () => {
	const item = {
		id: "t", title: "T", pulseless: false,
		truth: { tempo: 120, meter: "4/4" as const, key: "D major", tempoChanges: [], keyChanges: [], durationSec: 30 },
		mp3: "x", chart: null, wrong: { tempo: "240", key: "G major", meter: "3/4" },
	};
	const raw = (over: object) => ({ tempo: 120, tempoChanges: [], meter: "4/4", key: "D major", keyChanges: [], notes: "", ...over });
	test("score arm: truth-matching raw and applied", () => {
		const g = grade7(raw({}), { tempo: 120, tempoChanges: [], meter: "4/4" }, item as never, "R-true");
		expect(g.rawTempoCorrect && g.rawMeterCorrect && g.appliedTempoCorrect && g.appliedMeterCorrect).toBe(true);
	});
	test("chord arm: null tempo and free meter are correct; a number is invented", () => {
		const good = grade7(raw({ tempo: null, meter: "free" }), { tempo: null, tempoChanges: [], meter: null }, item as never, "R-chord");
		expect(good.rawTempoCorrect && good.rawMeterCorrect && good.appliedTempoCorrect && good.appliedMeterCorrect).toBe(true);
		expect(good.rawInventedTempo).toBe(false);
		const bad = grade7(raw({ tempo: 118, meter: "free" }), { tempo: null, tempoChanges: [], meter: null }, item as never, "R-chord");
		expect(bad.rawInventedTempo).toBe(true);
	});
	test("wrong arm: echo and applied-wrong detection", () => {
		const g = grade7(raw({ tempo: 240, meter: "3/4" }), { tempo: 240, tempoChanges: [], meter: "3/4" }, item as never, "R-wrong");
		expect(g.echoedWrongTempo && g.echoedWrongMeter).toBe(true);
		expect(g.appliedWrongTempo && g.appliedWrongMeter).toBe(true);
	});
});

describe("parseAnswer7", () => {
	test("confidence is gone from the schema; production error strings stand", () => {
		const good = parseAnswer7('{"tempo": null, "meter": "free", "key": "D major"}');
		expect(good.answer?.tempo).toBeNull();
		expect(parseAnswer7("nope").error).toBe("The model did not answer in the expected form");
	});
});
