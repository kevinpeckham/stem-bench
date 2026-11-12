/**
 * Study 50 (docs/BRIEF-STUDY50.md): the grid under the written bass line.
 * Three grids (the tracker's as stored, the tracker's with its
 * double-length beats split, and the composer's own from the session
 * MIDI's tempo and signature map) and two rules for choosing sixteenths
 * or triplets (per bar, as Study 48; once for the song). Grading is
 * Study 48's bar grade, unchanged.
 */
import { type Bar, type BarLine, gradeBar, type Mode, type Note, quantizeBar, slotOf, TRIPLET_MARGIN } from "../study48/bassLine.js";

export interface Grid {
	beats: number[];
	downbeats: number[];
	duration: number;
}

/**
 * The composer's grid: quarter-note beats from the MIDI's tempo map and
 * bar lines from its signature map, moved onto the mix timeline by
 * `offset`. MIDI time zero is the session's bar 1. Signatures must be in
 * quarters; each signature starts a new bar at the beat nearest its time.
 */
export function composerGrid(tempos: { sec: number; bpm: number }[], sigs: { sec: number; sig: string }[], endSec: number, offset: number): Grid {
	if (!tempos.length || !sigs.length) throw new Error("a tempo and a signature are needed");
	const beats: number[] = [];
	let t = 0;
	let i = 0;
	while (t < endSec) {
		beats.push(t);
		while (i + 1 < tempos.length && tempos[i + 1]!.sec <= t + 1e-6) i++;
		t += 60 / tempos[i]!.bpm;
	}
	const nearest = (sec: number) => beats.reduce((best, b, k) => (Math.abs(b - sec) < Math.abs(beats[best]! - sec) ? k : best), 0);
	const downbeats: number[] = [];
	for (let s = 0; s < sigs.length; s++) {
		const [num, den] = sigs[s]!.sig.split("/").map(Number) as [number, number];
		if (den !== 4 || !(num > 0)) throw new Error(`signature ${sigs[s]!.sig} is not in quarters`);
		const from = nearest(sigs[s]!.sec);
		const to = s + 1 < sigs.length ? nearest(sigs[s + 1]!.sec) : beats.length;
		for (let k = from; k < to; k += num) downbeats.push(beats[k]!);
	}
	return { beats: beats.map((b) => b + offset), downbeats: downbeats.map((b) => b + offset), duration: endSec + offset };
}

/** The tracker's beats with every gap of about k median beats (k of 2 or more) split into k equal beats. Bar lines are not touched. */
export function fillBeats(grid: Grid): Grid {
	const b = [...grid.beats].sort((x, y) => x - y);
	const gaps = b.slice(1).map((x, i) => x - b[i]!).sort((x, y) => x - y);
	const median = gaps[Math.floor(gaps.length / 2)];
	if (!median) return grid;
	const out: number[] = [];
	for (let i = 0; i < b.length; i++) {
		out.push(b[i]!);
		if (i + 1 === b.length) break;
		const gap = b[i + 1]! - b[i]!;
		const k = Math.round(gap / median);
		for (let j = 1; j < k; j++) out.push(b[i]! + (gap * j) / k);
	}
	return { ...grid, beats: out };
}

/** One choice for the song: triplets only if they fit all the line's onsets, each against its own bar, better than sixteenths by Study 48's margin. */
export function songMode(notes: Note[], bars: Bar[]): Mode {
	let s = 0;
	let tr = 0;
	let n = 0;
	for (const bar of bars) {
		for (const note of notes) {
			if (note.start < bar.start || note.start >= bar.end) continue;
			s += slotOf(note.start, bar, "straight")?.residual ?? 0;
			tr += slotOf(note.start, bar, "triplet")?.residual ?? 0;
			n++;
		}
	}
	if (n < 2) return "straight";
	return tr < s * TRIPLET_MARGIN ? "triplet" : "straight";
}

export type Rule = "bar" | "song";

/** A line's bars on the grid under a rule: per bar from the bar's own onsets (Study 48), or one mode for the song. */
export function linesOf(notes: Note[], span: Bar[], rule: Rule): BarLine[] {
	if (rule === "bar") return span.map((b) => quantizeBar(notes, b));
	const mode = songMode(notes, span);
	return span.map((b) => quantizeBar(notes, b, mode));
}

export interface Grade50 {
	bars: number;
	right: number;
	oneError: number;
	wrong: number;
	truthOnsets: number;
	estOnsets: number;
	/** Truth onsets with a transcribed onset in their slot. */
	found: number;
	/** Truth onsets with a transcribed onset of the same pitch in their slot. */
	matched: number;
	extra: number;
	gridDiffers: number;
	truthTriplet: number;
	estTriplet: number;
	/** Slot-level F: matched over transcribed onsets and over truth onsets. */
	slotF: number;
}

export function gradeLines(truthLines: BarLine[], estLines: BarLine[]): Grade50 {
	const g: Grade50 = { bars: truthLines.length, right: 0, oneError: 0, wrong: 0, truthOnsets: 0, estOnsets: 0, found: 0, matched: 0, extra: 0, gridDiffers: 0, truthTriplet: 0, estTriplet: 0, slotF: 0 };
	for (let i = 0; i < truthLines.length; i++) {
		const tl = truthLines[i]!;
		const el = estLines[i]!;
		const r = gradeBar(tl, el);
		if (r.cls === "right") g.right++;
		else if (r.cls === "one-error") g.oneError++;
		else g.wrong++;
		g.truthOnsets += tl.onsets.size;
		g.estOnsets += el.onsets.size;
		if (tl.mode === "triplet") g.truthTriplet++;
		if (el.mode === "triplet") g.estTriplet++;
		if (tl.mode !== el.mode) {
			if (tl.onsets.size || el.onsets.size) g.gridDiffers++;
			g.extra += el.onsets.size;
			continue;
		}
		for (const [slot, n] of tl.onsets) {
			const e = el.onsets.get(slot);
			if (!e) continue;
			g.found++;
			if (e.pitch === n.pitch) g.matched++;
		}
		for (const slot of el.onsets.keys()) if (!tl.onsets.has(slot)) g.extra++;
	}
	const p = g.matched / Math.max(1, g.estOnsets);
	const r = g.matched / Math.max(1, g.truthOnsets);
	g.slotF = p + r ? (2 * p * r) / (p + r) : 0;
	return g;
}

/** How the tracker's grid sits on the composer's: truth and tracker only, no transcription. */
export function gridAgreement(tracker: Grid, composer: Grid, tolerance = 0.05) {
	const near = (x: number, arr: number[]) => arr.reduce((d, y) => Math.min(d, Math.abs(x - y)), Number.POSITIVE_INFINITY);
	const lo = Math.max(tracker.beats[0] ?? 0, composer.beats[0] ?? 0);
	const hi = Math.min(tracker.beats.at(-1) ?? 0, composer.beats.at(-1) ?? 0);
	const tb = tracker.beats.filter((x) => x >= lo - tolerance && x <= hi + tolerance);
	const cb = composer.beats.filter((x) => x >= lo - tolerance && x <= hi + tolerance);
	const td = tracker.downbeats.filter((x) => x >= lo - tolerance && x <= hi + tolerance);
	const cd = composer.downbeats.filter((x) => x >= lo - tolerance && x <= hi + tolerance);
	return {
		trackerBeats: tb.length,
		composerBeats: cb.length,
		trackerBeatsOnABeat: tb.filter((x) => near(x, composer.beats) <= tolerance).length,
		composerBeatsUntracked: cb.filter((x) => near(x, tracker.beats) > tolerance).length,
		trackerDownbeats: td.length,
		composerDownbeats: cd.length,
		trackerDownbeatsOnADownbeat: td.filter((x) => near(x, composer.downbeats) <= tolerance).length,
		composerDownbeatsTracked: cd.filter((x) => near(x, tracker.downbeats) <= tolerance).length,
	};
}
