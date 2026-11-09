/**
 * Study 34 graders (the app's brief, docs/bench-brief-study34-*): chord
 * QUALITY per bar in five families with extensions ignored, slash bass
 * as its own column, and section-boundary agreement. Roots stay with
 * Study 23's rootScore. All mechanical, registered before any run.
 */
import { parseChord } from "../grading/symbols.js";

export type QualityFamily = "maj" | "min" | "dom" | "dim" | "sus" | "other";

/** Canonical quality (grading/symbols.ts) → the brief's five families. */
export function qualityFamily(quality: string): QualityFamily {
	if (/sus/.test(quality)) return "sus";
	if (/^(dim7?|m7b5)$/.test(quality)) return "dim";
	if (/^m(?!aj)/.test(quality)) return "min";
	if (/^(7|9|11|13)/.test(quality)) return "dom";
	if (quality === "" || /^(maj|6|add)/.test(quality)) return "maj";
	return "other";
}

/** The slash bass letter's pitch class, or null when the symbol has none. */
export function bassPc(symbol: string): number | null {
	const m = symbol.match(/\/([A-Ga-g][#b♯♭]?)\s*$/);
	if (!m) return null;
	const p = parseChord(m[1]!);
	return p.ok ? p.pc : null;
}

export interface FamilyScore {
	right: number;
	bearing: number;
}

/** Quality families over bars whose truth chord parses; answer must match the family. */
export function qualityScore(answers: string[], truth: string[][]): FamilyScore {
	let right = 0;
	let bearing = 0;
	for (const [b, truthChords] of truth.entries()) {
		const first = truthChords.find((t) => t !== "");
		if (!first) continue;
		const t = parseChord(first);
		if (!t.ok || t.pc === null) continue;
		bearing++;
		const a = parseChord(answers[b] ?? "");
		if (a.ok && a.pc !== null && qualityFamily(a.quality) === qualityFamily(t.quality)) right++;
	}
	return { right, bearing };
}

/** Slash basses over bars whose truth writes one; the answer's bass must land the same pitch class. */
export function slashScore(answers: string[], truth: string[][]): FamilyScore {
	let right = 0;
	let bearing = 0;
	for (const [b, truthChords] of truth.entries()) {
		const first = truthChords.find((t) => t !== "");
		if (!first) continue;
		const tb = bassPc(first);
		if (tb === null) continue;
		bearing++;
		if (bassPc(answers[b] ?? "") === tb) right++;
	}
	return { right, bearing };
}

/** Truth boundaries matched by a draft boundary within one bar. */
export function sectionScore(truthBars: number[], draftBars: number[]): FamilyScore {
	let right = 0;
	for (const t of truthBars) if (draftBars.some((d) => Math.abs(d - t) <= 1)) right++;
	return { right, bearing: truthBars.length };
}
