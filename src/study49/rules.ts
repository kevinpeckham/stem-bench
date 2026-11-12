/**
 * Study 49 (docs/BRIEF-STUDY49.md): what the app could do to a bass stem's
 * transcribed notes before writing them. The Basic Pitch configurations
 * swept, the bass constraint of Study 48 (ported from
 * scripts/study48-notes.py), and two filters on the notes: a merge of
 * same-pitch re-triggers and an amplitude floor.
 * Times are seconds; a note's `amp` is Basic Pitch's mean frame activation.
 */
import type { Bar, Note } from "../study48/bassLine.js";

export interface AmpNote extends Note {
	amp: number;
}

export interface BpConfig {
	id: string;
	/** Onset posterior threshold (the app: 0.5). */
	onset: number;
	/** Frame posterior threshold (the app: 0.3). */
	frame: number;
	/** A note must be longer than this many 11.6 ms frames (the app: 11). */
	minLen: number;
	/** Add onsets inferred from frame differences (the app: true). */
	infer: boolean;
	/** Make notes from leftover frame energy that has no onset (the app: true). */
	melodia: boolean;
}

export const APP_CONFIG: BpConfig = { id: "o50-f30-n11-i1-m1", onset: 0.5, frame: 0.3, minLen: 11, infer: true, melodia: true };

/** The registered grid: two values per knob, the app's first. 32 configurations, the app's is the first. */
export function bpConfigs(): BpConfig[] {
	const out: BpConfig[] = [];
	for (const onset of [0.5, 0.35])
		for (const frame of [0.3, 0.2])
			for (const minLen of [11, 6])
				for (const infer of [true, false])
					for (const melodia of [true, false]) out.push({ id: `o${Math.round(onset * 100)}-f${Math.round(frame * 100)}-n${minLen}-i${infer ? 1 : 0}-m${melodia ? 1 : 0}`, onset, frame, minLen, infer, melodia });
	return out;
}

export const BASS_LO = 28;
export const BASS_HI = 60;
export const MIN_NOTE = 0.06;
export const CLUSTER = 0.03;

/** Study 48's bass constraint: E1 to C4, none under 60 ms, and of notes starting within 30 ms of a cluster's first keep the lowest. */
export function bassConstrain<T extends Note>(notes: T[]): T[] {
	const kept = notes.filter((n) => n.pitch >= BASS_LO && n.pitch <= BASS_HI && n.end - n.start >= MIN_NOTE);
	kept.sort((a, b) => a.start - b.start);
	const out: T[] = [];
	let i = 0;
	while (i < kept.length) {
		let j = i;
		while (j + 1 < kept.length && kept[j + 1]!.start - kept[i]!.start <= CLUSTER) j++;
		let low = kept[i]!;
		for (let k = i + 1; k <= j; k++) if (kept[k]!.pitch < low.pitch) low = kept[k]!;
		out.push(low);
		i = j + 1;
	}
	return out;
}

/** The length of the beat a time falls in; outside every bar, the median beat. */
export function beatLengthAt(bars: Bar[]): (t: number) => number {
	const all = bars.flatMap((b) => b.beats.map((x) => x.end - x.start)).sort((a, b) => a - b);
	const median = all[Math.floor(all.length / 2)] ?? 0.5;
	return (t: number) => {
		for (const bar of bars) {
			if (t < bar.start || t >= bar.end) continue;
			for (const beat of bar.beats) if (t >= beat.start && t < beat.end) return beat.end - beat.start;
		}
		return median;
	};
}

/** Two notes of one pitch are one sounding note when the second starts no later than this after the first ends. */
export const SOUNDING_GAP = 0.05;
/** Merge windows, in beats, set between rhythmic values: under a sixteenth, a sixteenth, an eighth. */
export const MERGE_WINDOWS = [0.1875, 0.375, 0.75] as const;
/** Amplitude floors, as a share of the stem's median note amplitude. */
export const FLOORS = [0.6, 0.7, 0.8] as const;

/**
 * Merge re-triggers: a note that starts while the previous kept note of the
 * same pitch is still sounding (within SOUNDING_GAP of its end), and no
 * more than `window` beats after that note's onset, is joined to it.
 * The onset-to-onset distance is measured from the kept note's own onset,
 * so a run of re-triggers cannot chain past the window.
 */
export function mergeRetriggers<T extends Note>(notes: T[], beatLen: (t: number) => number, window: number): T[] {
	const sorted = [...notes].sort((a, b) => a.start - b.start);
	const out: T[] = [];
	const lastOfPitch = new Map<number, T>();
	for (const n of sorted) {
		const p = lastOfPitch.get(n.pitch);
		if (p && n.start - p.end <= SOUNDING_GAP && n.start - p.start <= window * beatLen(p.start)) {
			p.end = Math.max(p.end, n.end);
			continue;
		}
		const copy = { ...n };
		out.push(copy);
		lastOfPitch.set(n.pitch, copy);
	}
	return out;
}

/** Drop notes whose amplitude is under `share` of the median amplitude of the notes given. */
export function ghostFloor<T extends AmpNote>(notes: T[], share: number): T[] {
	if (!notes.length) return [];
	const amps = notes.map((n) => n.amp).sort((a, b) => a - b);
	const median = amps[Math.floor(amps.length / 2)]!;
	return notes.filter((n) => n.amp >= share * median);
}

/** The filters in their registered order: the floor, then the merge. `null` skips one. */
export function applyRules<T extends AmpNote>(notes: T[], beatLen: (t: number) => number, window: number | null, floor: number | null): T[] {
	const floored = floor === null ? notes : ghostFloor(notes, floor);
	return window === null ? floored.map((n) => ({ ...n })) : mergeRetriggers(floored, beatLen, window);
}
