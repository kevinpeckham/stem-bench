/**
 * Study 16 graders (docs/BRIEF-STUDY16.md) — all mechanical.
 *
 * Chord normalization (registered): accidentals fold to ASCII (♯→#,
 * ♭→b) and a Logic-style parenthetical folds by position — dropped when
 * it follows a power chord's `5` (F#5(7) → F#5: the bench truth
 * vocabulary names the power chord), spliced in place otherwise
 * (C#(7) → C#7, D(7)sus4 → D7sus4). Bars compare RUN-LENGTH COLLAPSED
 * (["F#5","F#5","F#5","Esus4"] ≡ ["F#5","Esus4"]): beat-level placement
 * refinements the band made in migration are not content changes; a
 * wrong harmony, order or boundary still is.
 */
import type { ChartBar } from "../study14/chartBars.js";
import { chartBarSeconds } from "../study15/chartBarSeconds.js";

export function normalizeChord(sym: string): string {
	const ascii = sym.replace(/♯/g, "#").replace(/♭/g, "b").trim();
	return ascii.replace(/\(([^)]*)\)/g, (_m, inner: string, off: number, s: string) =>
		s[off - 1] === "5" ? "" : inner,
	);
}

/** A bar's chords, normalized and run-length collapsed. */
export function collapsedBar(chords: string[]): string[] {
	const out: string[] = [];
	for (const c of chords.map(normalizeChord)) {
		if (out.at(-1) !== c) out.push(c);
	}
	return out;
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Arm A cross-parser agreement: every difference between two ChartBar
 * readings of the same music, as one line each (empty = agreement).
 * Compared per bar: collapsed chords, bpm, meter, the section a bar
 * begins (trimmed), the key in force (normalized). Lengths first.
 */
export function barsAgreement(a: ChartBar[], b: ChartBar[]): string[] {
	const diffs: string[] = [];
	if (a.length !== b.length) diffs.push(`bar count ${a.length} vs ${b.length}`);
	const n = Math.min(a.length, b.length);
	for (let i = 0; i < n; i++) {
		const x = a[i]!;
		const y = b[i]!;
		if (!sameList(collapsedBar(x.chords), collapsedBar(y.chords)))
			diffs.push(`bar ${i + 1} chords [${collapsedBar(x.chords)}] vs [${collapsedBar(y.chords)}]`);
		if (x.bpm !== y.bpm) diffs.push(`bar ${i + 1} bpm ${x.bpm} vs ${y.bpm}`);
		if (x.meter !== y.meter) diffs.push(`bar ${i + 1} meter ${x.meter} vs ${y.meter}`);
		if ((x.section?.trim() ?? null) !== (y.section?.trim() ?? null))
			diffs.push(`bar ${i + 1} section ${x.section} vs ${y.section}`);
		const kx = x.key ? normalizeChord(x.key) : null;
		const ky = y.key ? normalizeChord(y.key) : null;
		if (kx !== ky) diffs.push(`bar ${i + 1} key ${kx} vs ${ky}`);
	}
	return diffs;
}

export interface GridError {
	name: string;
	declared: number;
	grid: number;
	err: number;
}

/**
 * Arm B structure: each declared section start against the chart's own
 * grid (cumulative chartBarSeconds to the bar that begins the k-th
 * chart section), matched by order. Null when the chart does not have
 * exactly as many sections as the band declared — that is a fail, not
 * a partial score.
 */
export function sectionGridErrors(
	bars: ChartBar[],
	declared: { name: string; start: number }[],
): GridError[] | null {
	const starts: { name: string; grid: number }[] = [];
	let t = 0;
	for (const b of bars) {
		if (b.section !== null) starts.push({ name: b.section, grid: t });
		t += chartBarSeconds(b.meter, b.bpm);
	}
	if (starts.length !== declared.length) return null;
	return starts.map((s, k) => ({
		name: s.name,
		declared: declared[k]!.start,
		grid: s.grid,
		err: s.grid - declared[k]!.start,
	}));
}

export interface TruthSection {
	name: string;
	bars: string[][];
}

/**
 * Arm B content: the migrated chart's bars against a verified truth
 * list, section by section in play order. Every truth bar must match
 * (collapsed, normalized) in sequence; the FINAL chart section may
 * carry up to `allowTrailing` extra bars beyond its truth (the
 * grammar's unmeasured ring-out convention writes the final attack as
 * its own bar, which post-dates the verified lists); extra bars
 * anywhere else, a missing bar or a different reading is a difference.
 */
export function contentDiffs(
	truth: TruthSection[],
	bars: ChartBar[],
	allowTrailing: number,
): string[] {
	const diffs: string[] = [];
	const sections: { name: string; bars: ChartBar[] }[] = [];
	for (const b of bars) {
		if (b.section !== null) sections.push({ name: b.section.trim(), bars: [] });
		if (sections.length === 0) {
			diffs.push(`bar ${b.measure} before any section`);
			continue;
		}
		sections.at(-1)!.bars.push(b);
	}
	if (sections.length !== truth.length) {
		diffs.push(`section count ${sections.length} vs truth ${truth.length}`);
		return diffs;
	}
	for (const [k, t] of truth.entries()) {
		const s = sections[k]!;
		const extra = s.bars.length - t.bars.length;
		const allowed = k === truth.length - 1 ? allowTrailing : 0;
		if (extra < 0 || extra > allowed)
			diffs.push(`section ${k + 1} (${s.name}) has ${s.bars.length} bars, truth ${t.bars.length}`);
		const n = Math.min(s.bars.length, t.bars.length);
		for (let i = 0; i < n; i++) {
			const got = collapsedBar(s.bars[i]!.chords);
			const want = collapsedBar(t.bars[i]!);
			if (!sameList(got, want))
				diffs.push(`section ${k + 1} (${s.name}) bar ${i + 1}: [${got}] vs truth [${want}]`);
		}
	}
	return diffs;
}

export const median = (xs: number[]): number => {
	const s = [...xs].sort((a, b) => a - b);
	return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};
