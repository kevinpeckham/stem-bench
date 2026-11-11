/**
 * Study 46 (docs/BRIEF-STUDY46.md): the hint's ceiling. Per bar, the
 * ChordMini hint against the truth chord: root right (pitch class) and
 * quality family right (Study 34's families: maj, min, dom, dim, sus,
 * other), tallied by the truth's family with a family confusion table.
 * Bars whose truth does not parse or is N.C. are not scored; a hint of
 * N.C. or "" on a scored bar counts as root wrong and family wrong.
 */
import { parseChord } from "../grading/symbols.js";
import { familyOf, qualityFamily } from "../study34/grade34.js";

export interface HintScore {
	bars: number;
	rootRight: number;
	familyRight: number;
	/** Both the root and the family right. */
	chordRight: number;
	byFamily: Record<string, { n: number; rootRight: number; familyRight: number }>;
	/** confusion[truthFamily][hintFamily] = bars; "none" for an unparsable or N.C. hint. */
	confusion: Record<string, Record<string, number>>;
}

export function emptyScore(): HintScore {
	return { bars: 0, rootRight: 0, familyRight: 0, chordRight: 0, byFamily: {}, confusion: {} };
}

export function addScore(into: HintScore, more: HintScore): void {
	into.bars += more.bars;
	into.rootRight += more.rootRight;
	into.familyRight += more.familyRight;
	into.chordRight += more.chordRight;
	for (const [fam, v] of Object.entries(more.byFamily)) {
		const t = (into.byFamily[fam] ??= { n: 0, rootRight: 0, familyRight: 0 });
		t.n += v.n;
		t.rootRight += v.rootRight;
		t.familyRight += v.familyRight;
	}
	for (const [tf, row] of Object.entries(more.confusion)) {
		const r = (into.confusion[tf] ??= {});
		for (const [hf, n] of Object.entries(row)) r[hf] = (r[hf] ?? 0) + n;
	}
}

export function hintScore(truthPerBar: string[], hintPerBar: string[]): HintScore {
	const out = emptyScore();
	for (let i = 0; i < truthPerBar.length; i++) {
		const t = parseChord(truthPerBar[i] ?? "");
		if (!t.ok || t.pc === null) continue;
		const tf = qualityFamily(t.quality);
		const h = parseChord(hintPerBar[i] ?? "");
		const hf = h.ok && h.pc !== null ? familyOf(hintPerBar[i]!) ?? "none" : "none";
		const rootRight = h.ok && h.pc === t.pc;
		const familyRight = hf === tf;
		out.bars++;
		if (rootRight) out.rootRight++;
		if (familyRight) out.familyRight++;
		if (rootRight && familyRight) out.chordRight++;
		const fam = (out.byFamily[tf] ??= { n: 0, rootRight: 0, familyRight: 0 });
		fam.n++;
		if (rootRight) fam.rootRight++;
		if (familyRight) fam.familyRight++;
		const row = (out.confusion[tf] ??= {});
		row[hf] = (row[hf] ?? 0) + 1;
	}
	return out;
}
