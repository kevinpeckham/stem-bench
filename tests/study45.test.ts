import { describe, expect, it } from "bun:test";
import { system } from "../src/harness/prompt.js";
import { QUALITY_CLAUSE, ROCK_CLAUSE, system45 } from "../src/study45/prompt45.js";
import { attributeQualities } from "../src/study45/attribute.js";

describe("Study 45 prompt", () => {
	it("differs from production's system prompt only in the one clause", () => {
		const prod = system("A-matcher");
		const variant = system45();
		expect(prod).toContain(ROCK_CLAUSE);
		expect(variant).not.toContain(ROCK_CLAUSE);
		expect(variant).toContain(QUALITY_CLAUSE);
		expect(variant.replace(QUALITY_CLAUSE, ROCK_CLAUSE)).toBe(prod);
		expect(prod.split(ROCK_CLAUSE)).toHaveLength(2);
	});
	it("keeps the hint sentence and the JSON contract", () => {
		const v = system45();
		expect(v).toContain("A simple template matcher's guess follows each bar in brackets");
		expect(v).toContain('Reply with JSON only');
	});
});

describe("quality attribution", () => {
	it("classes each quality-bearing truth position by what the hint and the draft did", () => {
		// truth families: min dom maj dim dom min; hint right on 1,2,3,6; draft right on 1,2,3; power chord on 4;
		// a third family where the hint was wrong on 5; a wrong family where the hint was right on 6
		const out = attributeQualities(
			["C#m", "F#7", "B", "Bbm7b5", "Eb7", "Abm"],
			["C#m", "F#7", "B", "E", "Eb", "Abm"],
			["C#m", "F#7", "B", "Bb5", "Ebm", "Ab"],
		);
		expect(out.bearing).toBe(6);
		expect(out.draftRight).toBe(3);
		expect(out.hintRight).toBe(4);
		expect(out.lost).toEqual({ hintWrongDraftFollowed: 0, hintWrongDraftOtherWrong: 1, hintRightDraftWrong: 1, powerChord: 1 });
		const followed = attributeQualities(["C7"], ["C"], ["C"]);
		expect(followed.lost.hintWrongDraftFollowed).toBe(1);
	});
	it("ignores positions whose truth does not parse and counts N.C. hints as wrong", () => {
		const out = attributeQualities(["X", "C7"], ["N.C.", "C"], ["C", "C"]);
		expect(out.bearing).toBe(1);
		expect(out.hintRight).toBe(0);
		expect(out.lost.hintWrongDraftFollowed).toBe(1);
	});
});
