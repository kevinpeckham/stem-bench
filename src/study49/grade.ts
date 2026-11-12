/**
 * Study 49 (docs/BRIEF-STUDY49.md): a whole line graded on Study 48's bars
 * and rules (src/study48/bassLine.ts, unchanged), and the attribution of
 * what is wrong: every extra onset and every missed onset classed by a
 * mechanical rule against the truth's notes.
 */
import { type Bar, type BarLine, gradeBar, type Note, quantizeBar } from "../study48/bassLine.js";

export interface TruthNote extends Note {
	vel?: number;
}

/** The graded span, as Study 48: the first to the last bar that holds a truth note. */
export function spanOf(truth: Note[], bars: Bar[]): Bar[] {
	const holds = (b: Bar) => truth.some((n) => n.start >= b.start && n.start < b.end);
	const first = bars.findIndex(holds);
	if (first < 0) return [];
	let last = bars.length - 1;
	while (last > first && !holds(bars[last]!)) last--;
	return bars.slice(first, last + 1);
}

export interface LineGrade {
	bars: number;
	right: number;
	oneError: number;
	wrong: number;
	truthOnsets: number;
	/** Truth onsets with a transcribed onset in their slot (same grid). */
	found: number;
	pitchRight: number;
	missing: number;
	extra: number;
	gridDiffers: number;
	/** `${bar index}:${slot}` of every found truth onset, to compare two pipelines. */
	foundKeys: Set<string>;
}

export function gradeLine(truthLines: BarLine[], est: Note[], span: Bar[]): LineGrade {
	const g: LineGrade = { bars: span.length, right: 0, oneError: 0, wrong: 0, truthOnsets: 0, found: 0, pitchRight: 0, missing: 0, extra: 0, gridDiffers: 0, foundKeys: new Set() };
	for (let i = 0; i < span.length; i++) {
		const tl = truthLines[i]!;
		const el = quantizeBar(est, span[i]!);
		const r = gradeBar(tl, el);
		if (r.cls === "right") g.right++;
		else if (r.cls === "one-error") g.oneError++;
		else g.wrong++;
		g.truthOnsets += tl.onsets.size;
		if (tl.mode !== el.mode) {
			if (tl.onsets.size || el.onsets.size) g.gridDiffers++;
			g.missing += tl.onsets.size;
			g.extra += el.onsets.size;
			continue;
		}
		g.pitchRight += r.pitchRight;
		for (const slot of tl.onsets.keys()) {
			if (el.onsets.has(slot)) {
				g.found++;
				g.foundKeys.add(`${i}:${slot}`);
			} else g.missing++;
		}
		for (const slot of el.onsets.keys()) if (!tl.onsets.has(slot)) g.extra++;
	}
	return g;
}

/** Truth onsets one pipeline found and another did not. */
export function lostBy(base: LineGrade, after: LineGrade): number {
	let n = 0;
	for (const k of base.foundKeys) if (!after.foundKeys.has(k)) n++;
	return n;
}

export type ExtraClass = "grid" | "shifted" | "retrigger" | "overOther" | "tail" | "silence";
export type MissClass = "grid" | "shifted" | "absorbed" | "late" | "otherPitch" | "nothing" | "other";
export const EXTRA_CLASSES: ExtraClass[] = ["retrigger", "overOther", "tail", "silence", "shifted", "grid"];
export const MISS_CLASSES: MissClass[] = ["absorbed", "late", "otherPitch", "nothing", "other", "shifted", "grid"];
export type Feature = "short" | "under130ms" | "repeated" | "legato" | "quiet";
export const FEATURES: Feature[] = ["short", "under130ms", "repeated", "legato", "quiet"];

export interface Attribution {
	extras: Record<ExtraClass, number>;
	misses: Record<MissClass, number>;
	/** Per feature: truth onsets with it and without it, and how many of each were missed. */
	features: Record<Feature, { with: number; withMissed: number; without: number; withoutMissed: number }>;
}

const pc = (p: number) => ((p % 12) + 12) % 12;

/**
 * Class every extra and every missed onset over the span.
 * Extras, in order: `grid` (the bar was read on the other subdivision),
 * `shifted` (an unmatched truth onset of the same pitch class sits in the
 * next slot either side: one note, one slot off), `retrigger` (a truth note
 * of the same pitch class is sounding), `overOther` (a truth note of another
 * class is sounding), `tail` (nothing sounding, and the last truth note to
 * end did so within a beat and has the same class), `silence`.
 * Misses, in order: `grid`, `shifted`, `absorbed` (a transcribed note of the
 * same class began more than half a sixteenth earlier and sounds past the
 * onset: two notes heard as one), `late` (a transcribed note of the same
 * class begins inside the truth note, later than its slot), `otherPitch`
 * (transcribed notes overlap it, none of its class), `nothing` (no
 * transcribed note overlaps it), `other` (the rest: a note of its class
 * overlaps it without fitting a class above).
 */
export function attribute(truth: TruthNote[], truthLines: BarLine[], est: Note[], span: Bar[], beatLen: (t: number) => number): Attribution {
	const extras = Object.fromEntries(EXTRA_CLASSES.map((c) => [c, 0])) as Record<ExtraClass, number>;
	const misses = Object.fromEntries(MISS_CLASSES.map((c) => [c, 0])) as Record<MissClass, number>;
	const features = Object.fromEntries(FEATURES.map((f) => [f, { with: 0, withMissed: 0, without: 0, withoutMissed: 0 }])) as Attribution["features"];
	const sortedTruth = [...truth].sort((a, b) => a.start - b.start);
	const prevOf = new Map<TruthNote, TruthNote | undefined>(sortedTruth.map((n, i) => [n, sortedTruth[i - 1]]));
	const vels = sortedTruth.map((n) => n.vel ?? 0).sort((a, b) => a - b);
	const medianVel = vels[Math.floor(vels.length / 2)] ?? 0;
	const tally = (t: TruthNote, missed: boolean) => {
		const prev = prevOf.get(t);
		const has: Record<Feature, boolean> = {
			short: t.end - t.start < beatLen(t.start) / 4,
			under130ms: t.end - t.start < 0.13,
			repeated: !!prev && prev.pitch === t.pitch,
			legato: !!prev && prev.end >= t.start - 0.03,
			quiet: (t.vel ?? 0) < medianVel,
		};
		for (const f of FEATURES) {
			const row = features[f];
			if (has[f]) {
				row.with++;
				if (missed) row.withMissed++;
			} else {
				row.without++;
				if (missed) row.withoutMissed++;
			}
		}
	};
	for (let i = 0; i < span.length; i++) {
		const tl = truthLines[i]!;
		const el = quantizeBar(est, span[i]!);
		if (tl.mode !== el.mode) {
			misses.grid += tl.onsets.size;
			extras.grid += el.onsets.size;
			for (const t of tl.onsets.values()) tally(t as TruthNote, true);
			continue;
		}
		const missedSlots = [...tl.onsets.keys()].filter((s) => !el.onsets.has(s));
		const extraSlots = [...el.onsets.keys()].filter((s) => !tl.onsets.has(s));
		for (const [slot, t] of tl.onsets) tally(t as TruthNote, !el.onsets.has(slot));
		// one note, one slot off: pair each extra with the nearest unmatched truth onset of its class in an adjacent slot
		const pairedMiss = new Set<number>();
		const pairedExtra = new Set<number>();
		for (const s of extraSlots) {
			const e = el.onsets.get(s)!;
			const near = [s - 1, s + 1].filter((m) => missedSlots.includes(m) && !pairedMiss.has(m) && pc(tl.onsets.get(m)!.pitch) === pc(e.pitch)).sort((a, b) => Math.abs(tl.onsets.get(a)!.start - e.start) - Math.abs(tl.onsets.get(b)!.start - e.start));
			if (near.length) {
				pairedMiss.add(near[0]!);
				pairedExtra.add(s);
			}
		}
		for (const s of extraSlots) {
			if (pairedExtra.has(s)) {
				extras.shifted++;
				continue;
			}
			const e = el.onsets.get(s)!;
			const sounding = sortedTruth.filter((t) => t.start < e.start && e.start < t.end);
			if (sounding.some((t) => pc(t.pitch) === pc(e.pitch))) extras.retrigger++;
			else if (sounding.length) extras.overOther++;
			else {
				let lastEnded: TruthNote | undefined;
				for (const t of sortedTruth) if (t.end <= e.start && (!lastEnded || t.end > lastEnded.end)) lastEnded = t;
				if (lastEnded && e.start - lastEnded.end <= beatLen(e.start) && pc(lastEnded.pitch) === pc(e.pitch)) extras.tail++;
				else extras.silence++;
			}
		}
		for (const s of missedSlots) {
			if (pairedMiss.has(s)) {
				misses.shifted++;
				continue;
			}
			const t = tl.onsets.get(s)!;
			const half = beatLen(t.start) / 8;
			const over = est.filter((e) => e.start < t.end && e.end > t.start);
			const same = over.filter((e) => pc(e.pitch) === pc(t.pitch));
			if (same.some((e) => e.start < t.start - half && e.end > t.start + half)) misses.absorbed++;
			else if (same.some((e) => e.start >= t.start + half)) misses.late++;
			else if (!over.length) misses.nothing++;
			else if (!same.length) misses.otherPitch++;
			else misses.other++;
		}
	}
	return { extras, misses, features };
}
