/**
 * Study 45 (docs/BRIEF-STUDY45.md): the production system prompt with
 * one registered deviation. Production's step 0 tells the model to
 * "think like a rock musician reading a chart — simple, plausible
 * progressions in the key over exotic spellings; power chords (5) and
 * sus chords are common here." Study 43 found that on a ii–V–I sheet
 * with a half-diminished and dominant sevenths the drafts write plain
 * roots and power chords where the notes carry the colour. This variant
 * replaces that one clause with a style-neutral instruction about chord
 * quality and leaves every other character of the prompt as it is.
 * Pinned by tests/study45.test.ts: the two prompts differ only in that
 * clause.
 */
import { system } from "../harness/prompt.js";

export const ROCK_CLAUSE =
	"think like a rock musician reading a chart — simple, plausible progressions in the key over exotic spellings; power chords (5) and sus chords are common here.";

export const QUALITY_CLAUSE =
	"name the quality the notes support — a seventh (7, m7, maj7, m7b5) when the seventh sounds, a plain triad when it does not, and a power chord (5) only when neither third sounds; prefer plausible progressions in the key over exotic spellings.";

/** Production's system prompt with the hint sentence (Study 1 arm A-matcher), the rock clause replaced by the quality clause. */
export function system45(): string {
	const base = system("A-matcher");
	if (!base.includes(ROCK_CLAUSE)) throw new Error("production prompt no longer carries the rock clause; re-register");
	return base.replace(ROCK_CLAUSE, QUALITY_CLAUSE);
}
