/**
 * Study 52 (docs/BRIEF-STUDY52.md): a second transcriber's line, and the
 * bars of it to show when another reading writes them identically.
 * `sameLine` and the scoring are Study 51's; the bar grade is Study 48's.
 */
import type { BarLine } from "../study48/bassLine.js";
import { sameLine } from "../study51/trust.js";

export const RULES52 = ["everyBar", "bp", "pyin", "either", "both"] as const;
export type Rule52 = (typeof RULES52)[number];

/** Which rules show this bar of the reader's line: when Basic Pitch's line (Study 49's selected configuration) is the same, when pYIN's is, when either or both are. */
export function trusts52(shown: BarLine, bp: BarLine, pyin: BarLine): Record<Rule52, boolean> {
	const b = sameLine(shown, bp);
	const p = sameLine(shown, pyin);
	return { everyBar: true, bp: b, pyin: p, either: b || p, both: b && p };
}
