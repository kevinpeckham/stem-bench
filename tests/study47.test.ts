import { describe, expect, it } from "bun:test";
import { system } from "../src/harness/prompt.js";
import { QUALITY_CLAUSE, system45 } from "../src/study45/prompt45.js";
import { ADVISORY_SENTENCE, MATCHER_SENTENCE, system47 } from "../src/study47/prompt47.js";

describe("Study 47 prompt", () => {
	it("differs from Study 45's quality-clause prompt only in the hint sentence", () => {
		const base = system45();
		const variant = system47();
		expect(base).toContain(MATCHER_SENTENCE);
		expect(base.split(MATCHER_SENTENCE)).toHaveLength(2);
		expect(variant).not.toContain(MATCHER_SENTENCE);
		expect(variant).toContain(ADVISORY_SENTENCE);
		expect(variant.replace(ADVISORY_SENTENCE, MATCHER_SENTENCE)).toBe(base);
	});
	it("keeps the quality clause (v0.262.1) and the JSON contract, and production's sentence is the one it replaces", () => {
		const v = system47();
		expect(v).toContain(QUALITY_CLAUSE);
		expect(v).toContain("Reply with JSON only");
		expect(system("A-matcher")).toContain(MATCHER_SENTENCE);
	});
	it("writes no em dash into the new sentence and names both halves of the finding", () => {
		expect(ADVISORY_SENTENCE).not.toContain("—");
		expect(ADVISORY_SENTENCE).toContain("root is reliable");
		expect(ADVISORY_SENTENCE).toContain("quality is advisory");
	});
});
