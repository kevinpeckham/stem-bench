/**
 * Per-bar chord labeling for MIDI-derived truth (Study 34 Tier 2).
 * Each bar's duration-weighted pitch-class mass is matched against
 * every (root, quality) template from grading/symbols INTERVALS:
 * score = covered mass minus uncovered mass, bass note breaking ties
 * toward templates whose root is the bar's lowest long note. Bars with
 * no mass label "". Mechanical; the derived truth is committed and the
 * extraction is reproducible from the committed MIDI.
 */
import { INTERVALS } from "../grading/symbols.js";
import { type MidiNote, type MidiScore, barPitchClasses } from "./midi.js";

const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
/** Qualities a hymn/waltz-era setting can state; richer colors collapse later in grading. */
const QUALITIES = ["", "m", "7", "dim", "aug", "m7", "maj7", "6", "m6"];
const EXTRA_INTERVALS: Record<string, number[]> = { m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], "6": [0, 4, 7, 9], m6: [0, 3, 7, 9] };

/** Fraction of the bar's mass covered by the named chord's template, minus the uncovered rest. */
export function coverScore(mass: Float32Array, symbol: string): number {
	const root = NAMES.indexOf(symbol.match(/^[A-G][#b]?/)?.[0] ?? "");
	const q = symbol.replace(/^[A-G][#b]?/, "");
	const intervals = EXTRA_INTERVALS[q] ?? INTERVALS[q];
	if (root < 0 || !intervals) return 0;
	const member = new Set(intervals.map((i) => (root + i) % 12));
	let covered = 0;
	let total = 0;
	for (let c = 0; c < 12; c++) {
		total += mass[c]!;
		if (member.has(c)) covered += mass[c]!;
	}
	return total > 0 ? (2 * covered - total) / total : 0;
}

export function labelBar(mass: Float32Array, bassPc: number | null): string {
	let total = 0;
	for (let c = 0; c < 12; c++) total += mass[c]!;
	if (total <= 0) return "";
	let best = { score: -Infinity, symbol: "" };
	for (let root = 0; root < 12; root++) {
		for (const q of QUALITIES) {
			const intervals = EXTRA_INTERVALS[q] ?? INTERVALS[q];
			if (!intervals) continue;
			const member = new Set(intervals.map((i) => (root + i) % 12));
			let covered = 0;
			for (let c = 0; c < 12; c++) if (member.has(c)) covered += mass[c]!;
			let score = (2 * covered - total) / total - intervals.length * 0.01;
			if (bassPc !== null && bassPc === root) score += 0.05;
			if (score > best.score) best = { score, symbol: `${NAMES[root]}${q}` };
		}
	}
	return best.symbol;
}

export interface MidiBar {
	bar: number;
	/** One chord when both halves of the bar agree, else [first half, second half]. */
	chords: string[];
}

/** Slice the score into bars from its time signature(s) and label each. */
export function midiBarChords(score: MidiScore): { bars: MidiBar[]; barsTotal: number; num: number; den: number } {
	const sig = score.timeSigs[0] ?? { tick: 0, num: 4, den: 4 };
	for (const s of score.timeSigs.slice(1))
		if (s.num !== sig.num || s.den !== sig.den) throw new Error("metre change mid-file not supported");
	const ticksPerBeat4 = (score.ticksPerBeat * 4) / sig.den;
	const ticksPerBar = ticksPerBeat4 * sig.num;
	const firstTick = score.notes.length > 0 ? Math.min(...score.notes.map((n) => n.startTick)) : 0;
	const lastTick = score.notes.reduce((m, n) => Math.max(m, n.endTick), 0);
	// A pickup shifts every bar line, so the origin is chosen mechanically:
	// among the `num` beat offsets after the first note, keep the slicing
	// whose bars the chord templates cover best (mass-weighted).
	const slice = (origin: number): { bars: MidiBar[]; cover: number } => {
		const barsTotal = Math.ceil((lastTick - origin) / ticksPerBar);
		const bars: MidiBar[] = [];
		let cover = 0;
		const labelSpan = (from: number, to: number): { chord: string; total: number } => {
			const mass = barPitchClasses(score.notes, from, to);
			let total = 0;
			for (let c = 0; c < 12; c++) total += mass[c]!;
			const sounding = score.notes.filter((n) => Math.min(n.endTick, to) - Math.max(n.startTick, from) > (to - from) / 4);
			const bass = sounding.length > 0 ? sounding.reduce((m, n) => (n.pitch < m.pitch ? n : m)).pitch % 12 : null;
			return { chord: labelBar(mass, bass), total };
		};
		for (let b = 0; b < barsTotal; b++) {
			const from = origin + b * ticksPerBar;
			const to = from + ticksPerBar;
			// half-bar granularity: settings of this era change harmony mid-bar
			const h1 = labelSpan(from, from + ticksPerBar / 2);
			const h2 = labelSpan(from + ticksPerBar / 2, to);
			const whole = labelSpan(from, to);
			const chords = h1.chord === h2.chord || h2.chord === "" ? [whole.chord] : h1.chord === "" ? [h2.chord] : [h1.chord, h2.chord];
			bars.push({ bar: b, chords });
			for (const [half, f, t] of [
				[h1, from, from + ticksPerBar / 2],
				[h2, from + ticksPerBar / 2, to],
			] as const) {
				if (half.total > 0 && half.chord !== "")
					cover += coverScore(barPitchClasses(score.notes, f, t), half.chord) * half.total;
			}
		}
		return { bars, cover };
	};
	const base = Math.floor(firstTick / ticksPerBar) * ticksPerBar;
	let best: { bars: MidiBar[]; cover: number } | null = null;
	for (let o = 0; o < sig.num; o++) {
		const candidate = slice(base + o * ticksPerBeat4);
		if (!best || candidate.cover > best.cover) best = candidate;
	}
	const bars = best!.bars.filter((b, i) => b.chords.some((c) => c !== "") || (i > 0 && i < best!.bars.length - 1));
	return { bars: bars.map((b, i) => ({ bar: i, chords: b.chords })), barsTotal: bars.length, num: sig.num, den: sig.den };
}

export type { MidiNote };
