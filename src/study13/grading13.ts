/**
 * Study 13 instruments (docs/BRIEF-STUDY13.md): the real-recording
 * chord grade, the reconciler prompt and its parser. All registered
 * before any run; the prompt is pinned by test.
 *
 * Grading: a bar is right when the answer matches the chart's chord
 * under sameChord, with two registered allowances: (1) a bar carrying
 * TWO chart chords counts on either (the matcher emits one chord per
 * bar; strict-first is reported beside it); (2) when the chart chord
 * is a POWER CHORD (quality "5"), any answer with the same root and a
 * major or minor or power quality counts — a power chord declares no
 * third, so the detector cannot be wrong about one (reported apart).
 * A rest bar ("" in the transcription) is right only on "N.C.".
 */
import { parseChord, sameChord } from "../grading/symbols.js";

export function chordRight(answer: string, truthChords: string[]): boolean {
	if (truthChords.every((t) => t === "")) return answer === "N.C." || answer === "";
	for (const truth of truthChords) {
		if (truth === "") continue;
		if (sameChord(truth, answer)) return true;
		const t = parseChord(truth);
		const a = parseChord(answer);
		if (t.ok && a.ok && t.quality === "5" && t.pc !== null && a.pc === t.pc && ["", "m", "5"].includes(a.quality)) {
			return true;
		}
	}
	return false;
}

export interface BarGrade {
	bars: number;
	right: number;
	strictFirstRight: number;
	powerAllowance: number;
}

export function gradeBars(answers: string[], truth: string[][]): BarGrade {
	let right = 0;
	let strict = 0;
	let power = 0;
	for (const [b, truthChords] of truth.entries()) {
		const a = answers[b] ?? "";
		if (chordRight(a, truthChords)) {
			right++;
			const viaSame = truthChords.some((t) => t !== "" && sameChord(t, a));
			const hasPower = truthChords.some((t) => parseChord(t).quality === "5");
			if (!viaSame && hasPower && truthChords.some((t) => t !== "")) power++;
		}
		const first = truthChords.find((t) => t !== "") ?? "";
		if (first === "" ? a === "N.C." : sameChord(first, a)) strict++;
	}
	return { bars: truth.length, right, strictFirstRight: strict, powerAllowance: power };
}

/** Fixes and breaks of a corrected sheet against a baseline sheet. */
export function fixesAndBreaks(
	baseline: string[],
	corrected: string[],
	truth: string[][],
): { fixes: number; breaks: number; changed: number } {
	let fixes = 0;
	let breaks = 0;
	let changed = 0;
	for (const [b, truthChords] of truth.entries()) {
		const was = chordRight(baseline[b] ?? "", truthChords);
		const is = chordRight(corrected[b] ?? "", truthChords);
		if ((baseline[b] ?? "") !== (corrected[b] ?? "")) changed++;
		if (!was && is) fixes++;
		if (was && !is) breaks++;
	}
	return { fixes, breaks, changed };
}

/** The registered reconciler system prompt (no production counterpart exists; pinned). */
export const RECONCILE_SYSTEM = `You are a careful music copyist. A chord detector produced one chord per bar for a song, from machine-transcribed notes. Correct the detector's mistakes using only the evidence given: the song's key, the transcribed notes in each bar, and the detected chord. Change a chord only when the notes clearly support a different one; prefer the detected chord when the evidence is ambiguous. If a bar's notes are silent or purely percussive, answer "N.C." for that bar; never invent harmony. Use plain chord symbols (C, Cm, C7, Cmaj7, Cm7, Csus4, C5 and the like). Reply with JSON only, exactly: {"chords": ["...", one entry per bar in order]}`;

export function reconcileQuestion(
	key: string,
	meter: string,
	bpm: number,
	detected: string[],
	barNotes: { bar: number; notes: string }[],
): string {
	const notesOf = new Map(barNotes.map((b) => [b.bar, b.notes]));
	const lines = detected.map(
		(chord, b) => `Bar ${b + 1}: detected ${chord || "N.C."}; notes: ${notesOf.get(b + 1) || "(none)"}`,
	);
	return `The song: key ${key}, ${meter}, ${bpm} bpm, ${detected.length} bars.\n${lines.join("\n")}\nReturn the corrected chord for every bar, in order.`;
}

export function parseReconciled(text: string, bars: number): { chords: string[] | null; error: string | null } {
	const json = text.match(/\{[\s\S]*\}/)?.[0];
	if (!json) return { chords: null, error: "no JSON in the answer" };
	try {
		const parsed = JSON.parse(json) as { chords?: unknown };
		if (!Array.isArray(parsed.chords) || !parsed.chords.every((c) => typeof c === "string")) {
			return { chords: null, error: "chords is not a string array" };
		}
		if (parsed.chords.length !== bars) {
			return { chords: null, error: `expected ${bars} bars, got ${parsed.chords.length}` };
		}
		return { chords: parsed.chords as string[], error: null };
	} catch {
		return { chords: null, error: "JSON parse failed" };
	}
}
