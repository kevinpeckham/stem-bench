/**
 * Study 5 propagation analysis (docs/BRIEF-STUDY5.md, "Grading"): which
 * facts the READER's summary carried, whether each was right, and how
 * each listening answer relates to both the truth and the reader —
 * classifying every field into pass / listener-added / propagated /
 * rescued / mutated. Committed and tested before any scored run.
 */
import { keyEqual } from "./listen.js";
import { parseSummary } from "./summary.js";
import type { AiAnswer } from "../study4/prompt4.js";
import type { MixTruth } from "../study4/synth4.js";

export interface ReaderFacts {
	key: string | null;
	meter: string | null;
	tempo: number | null;
	/** Keys stated after measure 1 (the chart's modulations). */
	changeKeys: string[];
	/** Tempos stated after measure 1. */
	changeTempos: number[];
}

/** The musical facts a chart-read summary asserts, by position. */
export function readerFacts(summaryText: string): ReaderFacts {
	const parsed = parseSummary(summaryText);
	const numbers = [...parsed.measures.keys()].sort((a, b) => a - b);
	const facts: ReaderFacts = { key: null, meter: null, tempo: null, changeKeys: [], changeTempos: [] };
	for (const n of numbers) {
		const m = parsed.measures.get(n)!;
		for (const k of m.keys) {
			if (facts.key === null) facts.key = k;
			else if (n > 1) facts.changeKeys.push(k);
		}
		for (const t of m.times) if (facts.meter === null) facts.meter = t;
		for (const t of m.tempos) {
			if (facts.tempo === null) facts.tempo = t;
			else if (n > 1 && t !== facts.tempo) facts.changeTempos.push(t);
		}
	}
	return facts;
}

export type Field = "tempo" | "meter" | "key" | "tempoChange" | "keyChange";
export type PropClass = "pass" | "listener-added" | "propagated" | "rescued" | "mutated";

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

/** Whether the reader asserted the truth for a field (null = the field does not apply to this item). */
export function readerRight(facts: ReaderFacts, truth: MixTruth, field: Field): boolean | null {
	switch (field) {
		case "tempo":
			return truth.tempo === null ? null : facts.tempo !== null && near(facts.tempo, truth.tempo, 3);
		case "meter":
			return truth.meter === "free" ? null : facts.meter === truth.meter;
		case "key":
			return facts.key !== null && keyEqual(facts.key, truth.key);
		case "tempoChange":
			return truth.tempoChanges.length === 0
				? null
				: truth.tempoChanges.every((c) => facts.changeTempos.some((t) => near(t, c.bpm, 5)));
		case "keyChange":
			return truth.keyChanges.length === 0
				? null
				: truth.keyChanges.every((c) => facts.changeKeys.some((k) => keyEqual(k, c.key)));
	}
}

/** Whether the listener answered the truth for a field. */
export function listenerRight(answer: AiAnswer, truth: MixTruth, field: Field): boolean | null {
	switch (field) {
		case "tempo":
			return truth.tempo === null
				? null
				: answer.tempo !== null &&
						(near(answer.tempo, truth.tempo, 3) ||
							(truth.meter === "6/8" && near(answer.tempo, truth.tempo * 3, 3)));
		case "meter":
			return truth.meter === "free" ? null : answer.meter === truth.meter;
		case "key":
			return keyEqual(answer.key, truth.key);
		case "tempoChange":
			return truth.tempoChanges.length === 0
				? null
				: truth.tempoChanges.every((c) =>
						answer.tempoChanges.some((x) => near(x.at, c.at, 4) && near(x.bpm, c.bpm, 5)),
					);
		case "keyChange":
			return truth.keyChanges.length === 0
				? null
				: truth.keyChanges.every((c) =>
						answer.keyChanges.some((x) => near(x.at, c.at, 4) && keyEqual(x.key, c.key)),
					);
	}
}

/** Whether the listener's wrong answer MATCHES the reader's wrong assertion (1:1 propagation). */
export function matchesReader(answer: AiAnswer, facts: ReaderFacts, field: Field): boolean {
	switch (field) {
		case "tempo":
			return facts.tempo !== null && answer.tempo !== null && near(answer.tempo, facts.tempo, 3);
		case "meter":
			return facts.meter !== null && answer.meter === facts.meter;
		case "key":
			return facts.key !== null && keyEqual(answer.key, facts.key);
		case "tempoChange":
			return facts.changeTempos.some((t) => answer.tempoChanges.some((x) => near(x.bpm, t, 5)));
		case "keyChange":
			return facts.changeKeys.some((k) => answer.keyChanges.some((x) => keyEqual(x.key, k)));
	}
}

export function classify(
	facts: ReaderFacts,
	answer: AiAnswer,
	truth: MixTruth,
	field: Field,
): PropClass | null {
	const rr = readerRight(facts, truth, field);
	const lr = listenerRight(answer, truth, field);
	if (rr === null || lr === null) return null;
	if (rr && lr) return "pass";
	if (rr && !lr) return "listener-added";
	if (!rr && lr) return "rescued";
	return matchesReader(answer, facts, field) ? "propagated" : "mutated";
}
