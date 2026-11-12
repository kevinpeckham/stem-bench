/**
 * Study 48 (docs/BRIEF-STUDY48.md): a bass line on the tracker's beats.
 * Notes (truth or a transcriber's) are put on the app's beat grid at a
 * sixteenth or an eighth-note triplet per beat, graded bar by bar, and
 * written as a barmark part line (`Bs | {E1} / {G1}_{A1} -- |`).
 * All times are seconds on the app's mix timeline.
 */

export interface Note {
	start: number;
	end: number;
	/** MIDI pitch, sounding. */
	pitch: number;
}

export interface Beat {
	start: number;
	end: number;
}

export interface Bar {
	start: number;
	end: number;
	beats: Beat[];
}

export type Mode = "straight" | "triplet";
/** Divisions of a beat: sixteenths, or eighth-note triplets. */
export const DIV: Record<Mode, number> = { straight: 4, triplet: 3 };
/** A note shorter than this share of a sixteenth (at its beat) is not meant and is dropped. */
export const MIN_SIXTEENTH_SHARE = 0.4;
/** The triplet grid is chosen only when it fits the bar's onsets this much better than the straight grid. */
export const TRIPLET_MARGIN = 0.8;

/** The tracker's bars: consecutive downbeats, each holding its beats; the last bar closes at the last beat's end. */
export function barsOf(beats: number[], downbeats: number[], duration: number): Bar[] {
	const sortedBeats = [...beats].sort((a, b) => a - b);
	const bars: Bar[] = [];
	for (let i = 0; i < downbeats.length; i++) {
		const start = downbeats[i]!;
		const end = downbeats[i + 1] ?? duration;
		if (end <= start) continue;
		const inside = sortedBeats.filter((b) => b >= start - 1e-6 && b < end - 1e-6);
		if (!inside.length || Math.abs(inside[0]! - start) > 1e-6) inside.unshift(start);
		const bb: Beat[] = inside.map((b, k) => ({ start: b, end: inside[k + 1] ?? end }));
		bars.push({ start, end, beats: bb });
	}
	return bars;
}

/** The slot a time falls in: the beat index and the nearest division; the time of that slot; the residual. */
export function slotOf(t: number, bar: Bar, mode: Mode): { slot: number; time: number; residual: number } | null {
	const div = DIV[mode];
	let best: { slot: number; time: number; residual: number } | null = null;
	for (let b = 0; b < bar.beats.length; b++) {
		const beat = bar.beats[b]!;
		const len = beat.end - beat.start;
		for (let k = 0; k < div; k++) {
			const time = beat.start + (len * k) / div;
			const residual = Math.abs(t - time);
			if (!best || residual < best.residual) best = { slot: b * div + k, time, residual };
		}
	}
	// the next bar's downbeat is also a candidate: an onset just before it belongs there, not to the last slot
	if (best && Math.abs(t - bar.end) < best.residual) return null;
	return best;
}

/** Drop notes too short to be meant, by the sixteenth of the beat they start in. */
export function meantNotes(notes: Note[], bars: Bar[]): Note[] {
	return notes.filter((n) => {
		const bar = bars.find((b) => n.start >= b.start && n.start < b.end);
		if (!bar) return false;
		const beat = bar.beats.find((b) => n.start >= b.start && n.start < b.end) ?? bar.beats[bar.beats.length - 1]!;
		return n.end - n.start >= MIN_SIXTEENTH_SHARE * ((beat.end - beat.start) / 4);
	});
}

/** Straight unless the triplet grid fits the bar's onsets better by the registered margin (two onsets at least). */
export function chooseMode(onsets: number[], bar: Bar): Mode {
	if (onsets.length < 2) return "straight";
	const mean = (mode: Mode) => {
		const rs = onsets.map((t) => slotOf(t, bar, mode)?.residual ?? 0);
		return rs.reduce((a, b) => a + b, 0) / rs.length;
	};
	const s = mean("straight");
	const tr = mean("triplet");
	return tr < s * TRIPLET_MARGIN ? "triplet" : "straight";
}

export interface BarLine {
	mode: Mode;
	/** slot index -> the note starting there (the lowest, if two). */
	onsets: Map<number, Note>;
	/** slot index -> the slot its note ends at (exclusive), at least one slot after the onset. */
	ends: Map<number, number>;
}

/** The bar's notes on its grid: the mode chosen from the onsets, then each onset and its end quantized. */
export function quantizeBar(notes: Note[], bar: Bar, mode?: Mode): BarLine {
	const inBar = notes.filter((n) => n.start >= bar.start - 1e-6 && n.start < bar.end - 1e-6);
	const m = mode ?? chooseMode(inBar.map((n) => n.start), bar);
	const onsets = new Map<number, Note>();
	const ends = new Map<number, number>();
	const total = bar.beats.length * DIV[m];
	for (const n of inBar.sort((a, b) => a.start - b.start)) {
		const s = slotOf(n.start, bar, m);
		if (!s) continue;
		const prev = onsets.get(s.slot);
		if (prev && prev.pitch <= n.pitch) continue;
		onsets.set(s.slot, n);
		const e = slotOf(Math.min(n.end, bar.end - 1e-6), bar, m);
		const endSlot = Math.max(s.slot + 1, Math.min(total, e ? e.slot : total));
		ends.set(s.slot, n.end >= bar.end - 1e-6 ? total : endSlot);
	}
	return { mode: m, onsets, ends };
}

export type BarClass = "right" | "one-error" | "wrong";

/** Bar against bar: positions and pitches; a bar with no notes in either is right. */
export function gradeBar(truth: BarLine, est: BarLine): { cls: BarClass; errors: number; rhythmExact: boolean; rhythmRight: number; pitchClassRight: number; pitchRight: number; truthNotes: number } {
	if (truth.mode !== est.mode) {
		// a different grid is a different rhythm for every note in the bar
		const empty = !truth.onsets.size && !est.onsets.size;
		return { cls: empty ? "right" : "wrong", errors: truth.onsets.size + est.onsets.size, rhythmExact: empty, rhythmRight: 0, pitchClassRight: 0, pitchRight: 0, truthNotes: truth.onsets.size };
	}
	const rhythmExact = truth.onsets.size === est.onsets.size && [...truth.onsets.keys()].every((s) => est.onsets.has(s));
	let errors = 0;
	let rhythmRight = 0;
	let pitchClassRight = 0;
	let pitchRight = 0;
	for (const [slot, n] of truth.onsets) {
		const e = est.onsets.get(slot);
		if (!e) {
			errors++;
			continue;
		}
		rhythmRight++;
		if ((e.pitch - n.pitch) % 12 === 0) pitchClassRight++;
		if (e.pitch === n.pitch) pitchRight++;
		else errors++;
	}
	for (const slot of est.onsets.keys()) if (!truth.onsets.has(slot)) errors++;
	return { cls: errors === 0 ? "right" : errors === 1 ? "one-error" : "wrong", errors, rhythmExact, rhythmRight, pitchClassRight, pitchRight, truthNotes: truth.onsets.size };
}

const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
/** MIDI to barmark's sounding pitch with octave: 28 is E1, 60 is C4. */
export function noteName(midi: number): string {
	return `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

/** One bar of a barmark part line from its grid: a slot per beat, members joined by `_`, `/` holds, `--` rests. */
export function writeBar(line: BarLine, beatsPerBar: number): string {
	const div = DIV[line.mode];
	const total = beatsPerBar * div;
	const members: string[] = [];
	let soundingUntil = 0;
	for (let i = 0; i < total; i++) {
		const n = line.onsets.get(i);
		if (n) {
			members.push(`{${noteName(n.pitch)}}`);
			soundingUntil = line.ends.get(i) ?? i + 1;
		} else members.push(i < soundingUntil ? "/" : "--");
	}
	const beats: string[] = [];
	for (let b = 0; b < beatsPerBar; b++) {
		const ms = members.slice(b * div, (b + 1) * div);
		if (ms.every((x) => x === ms[0]) && (ms[0] === "/" || ms[0] === "--")) beats.push(ms[0]!);
		else if (ms[0]!.startsWith("{") && ms.slice(1).every((x) => x === "/")) beats.push(ms[0]!);
		else if (div === 4 && ms[0]!.startsWith("{") && ms[1] === "/" && ms[2] === "/" && ms[3]!.startsWith("{")) beats.push(`${ms[0]}._${ms[3]}`);
		else beats.push(ms.join("_"));
	}
	if (beats.every((x) => x === "--")) return "--";
	return beats.join(" ");
}

/** A whole part line: `Bs | … | … |`, four bars to a line. */
export function writeLines(bars: BarLine[], beatsPerBar: number[], label = "Bs"): string {
	const cells = bars.map((b, i) => writeBar(b, beatsPerBar[i] ?? 4));
	const rows: string[] = [];
	for (let i = 0; i < cells.length; i += 4) rows.push(`${label} | ${cells.slice(i, i + 4).join(" | ")} |`);
	return rows.join("\n");
}
