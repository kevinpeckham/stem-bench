/**
 * Study 21's primary grade (docs/BRIEF-STUDY21.md): Study 13's grade
 * with the power allowance extended to truth quality "5(7)" — a power
 * chord with an optional seventh declares no third either, so the
 * registered rationale applies verbatim. Nothing else changes, and the
 * pin test proves this grader equals gradeBars wherever no "5(7)" truth
 * exists, so no prior study's number can shift.
 */
import { parseChord, sameChord } from "../grading/symbols.js";
import type { BarGrade } from "../study13/grading13.js";

const POWER_QUALITIES = ["5", "5(7)"];

export function chordRight21(answer: string, truthChords: string[]): boolean {
	if (truthChords.every((t) => t === "")) return answer === "N.C." || answer === "";
	for (const truth of truthChords) {
		if (truth === "") continue;
		if (sameChord(truth, answer)) return true;
		const t = parseChord(truth);
		const a = parseChord(answer);
		if (
			t.ok &&
			a.ok &&
			POWER_QUALITIES.includes(t.quality) &&
			t.pc !== null &&
			a.pc === t.pc &&
			["", "m", "5"].includes(a.quality)
		) {
			return true;
		}
	}
	return false;
}

export function gradeBars21(answers: string[], truth: string[][]): BarGrade {
	let right = 0;
	let strict = 0;
	let power = 0;
	for (const [b, truthChords] of truth.entries()) {
		const a = answers[b] ?? "";
		if (chordRight21(a, truthChords)) {
			right++;
			const viaSame = truthChords.some((t) => t !== "" && sameChord(t, a));
			const hasPower = truthChords.some((t) =>
				POWER_QUALITIES.includes(parseChord(t).quality),
			);
			if (!viaSame && hasPower && truthChords.some((t) => t !== "")) power++;
		}
		const first = truthChords.find((t) => t !== "") ?? "";
		if (first === "" ? a === "N.C." : sameChord(first, a)) strict++;
	}
	return { bars: truth.length, right, strictFirstRight: strict, powerAllowance: power };
}
