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

/**
 * Tier 1 (time truth): pair each draft bar with the truth bar whose
 * span contains the draft bar's midpoint, then grade roots and quality
 * families on the pairs. Robust to the draft grid finding a different
 * bar count than the annotation.
 */
export function pairBarsByTime(
	draftStarts: number[],
	draftChords: string[],
	truthBars: { start: number; chords: string[] }[],
): { answers: string[]; truth: string[][] } {
	const answers: string[] = [];
	const truth: string[][] = [];
	const spans = truthBars.map((b, i) => ({
		from: b.start,
		to: i + 1 < truthBars.length ? truthBars[i + 1]!.start : b.start + (b.start - (truthBars[i - 1]?.start ?? b.start - 2)),
		chords: b.chords,
	}));
	for (const [i, start] of draftStarts.entries()) {
		const end = i + 1 < draftStarts.length ? draftStarts[i + 1]! : start + (start - (draftStarts[i - 1] ?? start - 2));
		const mid = (start + end) / 2;
		const hit = spans.find((s) => mid >= s.from && mid < s.to);
		if (!hit) continue;
		answers.push(draftChords[i] ?? "");
		truth.push(hit.chords);
	}
	return { answers, truth };
}

/**
 * Tier 3 (sequence truth): the draft chart's collapsed chord sequence
 * against the published progression, as the longest common subsequence
 * over pitch-class roots (and separately over quality families).
 * Score = LCS length / published length.
 */
export function sequenceScore(
	draftChords: string[],
	published: string[],
	project: (symbol: string) => string | null,
): FamilyScore {
	const collapse = (list: string[]): string[] => {
		const out: string[] = [];
		for (const raw of list) {
			const p = project(raw);
			if (p === null) continue;
			if (out[out.length - 1] !== p) out.push(p);
		}
		return out;
	};
	const a = collapse(draftChords);
	const b = collapse(published);
	const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			dp[i]![j] = a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
	return { right: dp[a.length]![b.length]!, bearing: b.length };
}

/**
 * Transposition-invariant variant for a slot whose absolute key failed
 * the calibration gate (jw-same-boat): the collapsed root sequences are
 * reduced to successive pitch-class intervals before the LCS, which no
 * capo or transfer-pitch shift can disturb.
 */
export function sequenceScoreIntervals(draftChords: string[], published: string[]): FamilyScore {
	const roots = (list: string[]): number[] => {
		const out: number[] = [];
		for (const raw of list) {
			const p = parseChord(raw);
			if (!p.ok || p.pc === null) continue;
			if (out[out.length - 1] !== p.pc) out.push(p.pc);
		}
		return out;
	};
	const deltas = (pcs: number[]): string[] => pcs.slice(1).map((pc, i) => String((pc - pcs[i]! + 12) % 12));
	const a = deltas(roots(draftChords));
	const b = deltas(roots(published));
	const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			dp[i]![j] = a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
	return { right: dp[a.length]![b.length]!, bearing: b.length };
}

/** Root projection for sequenceScore: pitch class as a string, or null for unparsable. */
export function rootOf(symbol: string): string | null {
	const p = parseChord(symbol);
	return p.ok && p.pc !== null ? String(p.pc) : null;
}

/** Quality-family projection for sequenceScore. */
export function familyOf(symbol: string): string | null {
	const p = parseChord(symbol);
	return p.ok && p.pc !== null ? qualityFamily(p.quality) : null;
}
