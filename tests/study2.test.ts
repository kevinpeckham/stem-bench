import { describe, expect, test } from "bun:test";
import { runCheck, runChecks, type BeatCheck } from "../src/grading/beatChecks.js";
import { exampleRows } from "../src/study2/drums.js";
import { retryMessage, systemPrompt } from "../src/study2/prompt.js";
import { validateBeatReply, type ValidBeat } from "../src/study2/validate.js";
import beats from "../corpus/beats.json";

describe("exampleRows (production starting pattern, pinned)", () => {
	test("16 steps renders the four-on-the-floor opener", () => {
		expect(exampleRows(16)).toBe(
			'{"voice": "kick", "cells": "x...x...x...x..."}, {"voice": "snare", "cells": "....x.......x..."}, {"voice": "hat-closed", "cells": "x.x.x.x.x.x.x..."}, {"voice": "hat-open", "cells": "..............x."}',
		);
	});
	test("12 steps truncates, 32 repeats the bar", () => {
		expect(exampleRows(12)).toContain('{"voice": "kick", "cells": "x...x...x..."}');
		expect(exampleRows(32)).toContain('{"voice": "kick", "cells": "x...x...x...x...x...x...x...x..."}');
	});
});

describe("systemPrompt (production text, pinned)", () => {
	const p16 = systemPrompt({ meter: "4/4", steps: 16, voices: [] });
	test("anchor phrases are verbatim", () => {
		expect(p16).toContain("You are a drummer and producer with great taste");
		expect(p16).toContain("a bar of 4/4 in sixteenth notes: 16 steps, 4 to each beat");
		expect(p16).toContain('"." rest, "x" hit, "X" accent, "o" ghost note (quiet)');
		expect(p16).toContain("Use 3 to 7 rows. Do not put every drum on every step.");
		expect(p16).toContain('Reply with JSON only, no prose, no markdown, exactly like: {"bpm": 100,');
	});
	test("grid lines per meter and steps", () => {
		expect(systemPrompt({ meter: "4/4", steps: 8, voices: [] })).toContain(
			"a bar of 4/4 in eighth notes: 8 steps, 2 to each beat",
		);
		expect(systemPrompt({ meter: "4/4", steps: 32, voices: [] })).toContain(
			"two bars of 4/4 in sixteenth notes: 32 steps, 4 to each beat, 16 to each bar",
		);
		expect(systemPrompt({ meter: "3/4", steps: 12, voices: [] })).toContain(
			"a bar of 3/4: 12 steps, 4 to each beat",
		);
		expect(systemPrompt({ meter: "6/8", steps: 12, voices: [] })).toContain(
			"a bar of 6/8: 12 steps, 6 to each dotted-quarter beat (sixteenth notes; the beats fall on steps 1 and 7)",
		);
	});
	test("the retry message is production's", () => {
		expect(retryMessage("kick: 15 characters, but every row must be exactly 16", 16)).toBe(
			"That reply was rejected: kick: 15 characters, but every row must be exactly 16. Reply again with the JSON object only, every row exactly 16 characters.",
		);
	});
});

describe("validateBeatReply (production validity pipeline, pinned)", () => {
	const good = JSON.stringify({
		bpm: 120,
		swing: 0,
		kit: "acoustic",
		note: "test",
		rows: [
			{ voice: "kick", cells: "x...x...x...x..." },
			{ voice: "snare", cells: "....X.......o..." },
		],
	});
	test("a valid reply parses, prose and fences tolerated", () => {
		const beat = validateBeatReply(`Here you go:\n\`\`\`json\n${good}\n\`\`\``, 16);
		expect(beat.bpm).toBe(120);
		expect(beat.rows).toHaveLength(2);
	});
	test("no JSON throws production's message", () => {
		expect(() => validateBeatReply("sorry", 16)).toThrow("no JSON object in the reply");
	});
	test("a wrong row length names the voice and the rule", () => {
		const bad = JSON.stringify({ rows: [{ voice: "kick", cells: "x...x..." }] });
		expect(() => validateBeatReply(bad, 16)).toThrow(
			"kick: 8 characters, but every row must be exactly 16",
		);
	});
	test("bad cell characters fail the schema", () => {
		const bad = JSON.stringify({ rows: [{ voice: "kick", cells: "1...x...x...x..." }] });
		expect(() => validateBeatReply(bad, 16)).toThrow(/cells must be . o x X only/);
	});
	test("silent rows are dropped as production drops them", () => {
		const padded = JSON.stringify({
			rows: [
				{ voice: "kick", cells: "x...x...x...x..." },
				{ voice: "clap", cells: "................" },
			],
		});
		expect(validateBeatReply(padded, 16).rows.map((r) => r.voice)).toEqual(["kick"]);
	});
});

describe("beat checks", () => {
	const beat: ValidBeat = {
		bpm: 124,
		swing: 12,
		humanize: 3,
		kit: "electronic",
		note: "",
		fx: { delay: 35 },
		rows: [
			{ voice: "kick", cells: "x...x...x...x..." },
			{ voice: "hat-open", cells: "..x...x...x...x." },
			{ voice: "snare", cells: "....X.......o..." },
		],
	};
	const pass: BeatCheck[] = [
		{ kind: "bpmBetween", min: 123, max: 125 },
		{ kind: "hitsOnAll", voice: "kick", steps: [0, 4, 8, 12] },
		{ kind: "hitsOnSome", voice: "hat-open", steps: [2, 6, 10, 14], atLeast: 3 },
		{ kind: "silentOnAll", voice: "hat-open", steps: [0, 4, 8, 12] },
		{ kind: "swingBetween", min: 5, max: 35 },
		{ kind: "humanizeAtMost", max: 5 },
		{ kind: "kitIs", kit: "electronic" },
		{ kind: "ghostIn", voice: "snare" },
		{ kind: "fxAtLeast", key: "delay", min: 20 },
		{ kind: "accentOnlyAt", voice: "snare", steps: [4] },
		{ kind: "totalHitsAtMost", max: 12 },
	];
	test("passing checks pass", () => {
		for (const c of pass) expect(runCheck(beat, c)).toBe(true);
	});
	test("failing variants fail", () => {
		expect(runCheck(beat, { kind: "bpmBetween", min: 130, max: 140 })).toBe(false);
		expect(runCheck(beat, { kind: "voiceAbsent", voice: "kick" })).toBe(false);
		expect(runCheck(beat, { kind: "hitsOnAll", voice: "kick", steps: [0, 1] })).toBe(false);
		expect(runCheck(beat, { kind: "onlyVoices", voices: ["kick"] })).toBe(false);
		expect(runCheck(beat, { kind: "ghostShareAtLeast", share: 0.5 })).toBe(false);
		expect(runCheck(beat, { kind: "accentOnlyAt", voice: "snare", steps: [12] })).toBe(false);
	});
	test("an invalid reply fails every check", () => {
		const out = runChecks(null, pass);
		expect(out.passed).toBe(0);
		expect(out.total).toBe(pass.length);
	});
	test("every corpus check kind is implemented and every task has checks", () => {
		for (const task of beats.tasks) {
			expect(task.checks.length).toBeGreaterThan(0);
			const out = runChecks(beat, task.checks as BeatCheck[]);
			expect(out.total).toBe(task.checks.length);
		}
	});
});
