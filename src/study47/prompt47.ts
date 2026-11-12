/**
 * Study 47 (docs/BRIEF-STUDY47.md): Study 45's quality-clause prompt
 * (the clause the app shipped in v0.262.1) with one further registered
 * deviation. Production's hint sentence says the bracketed guess is "a
 * hint, not an answer", treating the hint as one thing. Study 46 measured
 * it as two: a root right on 95 % of strummed rock-shaped bars and a
 * quality that is right for major and minor, wrong for sevenths more
 * often than right, and almost never right for a diminished or
 * half-diminished chord. This variant replaces that one sentence with
 * what Study 46 found and leaves every other character as it is. Pinned
 * by tests/study47.test.ts: the two prompts differ only in that sentence.
 */
import { system45 } from "../study45/prompt45.js";

export const MATCHER_SENTENCE = " A simple template matcher's guess follows each bar in brackets — a hint, not an answer.";

export const ADVISORY_SENTENCE =
	" A chord reader's guess follows each bar in brackets. Its root is reliable: keep it unless the notes plainly contradict it. Its quality is advisory: it hears major and minor well, hears a seventh as a plain triad more often than not, and almost never hears a diminished or half-diminished chord, so decide the quality from the notes and the key.";

/** Study 45's quality-clause prompt with the hint sentence replaced by the advisory sentence. */
export function system47(): string {
	const base = system45();
	if (!base.includes(MATCHER_SENTENCE)) throw new Error("the prompt no longer carries production's hint sentence; re-register");
	return base.replace(MATCHER_SENTENCE, ADVISORY_SENTENCE);
}
