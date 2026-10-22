/**
 * Port of the stem-shovel drum-machine pieces the Text-to-Beat prompt and
 * validator depend on (Apache-2.0, Lightning Jar; src/lib/constants/
 * drumMachine.ts, src/lib/utils/startingDrumProject.ts and
 * resizeDrumPattern.ts, at v0.143.0). Only what the system prompt and the
 * reply validation touch is ported; values are verbatim and pinned by
 * tests/study2.test.ts so drift from production is caught.
 */

export const DRUM_VOICES = [
	{ id: "kick", label: "Kick" },
	{ id: "snare", label: "Snare" },
	{ id: "hat-closed", label: "Closed hat" },
	{ id: "hat-open", label: "Open hat" },
	{ id: "clap", label: "Clap" },
	{ id: "rim", label: "Rim" },
	{ id: "tom-low", label: "Low tom" },
	{ id: "tom-mid", label: "Mid tom" },
	{ id: "tom-high", label: "High tom" },
	{ id: "ride", label: "Ride" },
	{ id: "crash", label: "Crash" },
	{ id: "cowbell", label: "Cowbell" },
] as const;
export type DrumVoiceId = (typeof DRUM_VOICES)[number]["id"];
export const DRUM_VOICE_IDS = DRUM_VOICES.map((v) => v.id) as DrumVoiceId[];

export const DRUM_STEP_CHOICES = [8, 16, 32, 12, 24] as const;
export type DrumSteps = (typeof DRUM_STEP_CHOICES)[number];
export const DRUM_METER_IDS = ["4/4", "3/4", "6/8"] as const;
export type DrumMeterId = (typeof DRUM_METER_IDS)[number];

export const DRUM_DELAY_TIMES = [
	{ steps: 2, label: "1/8" },
	{ steps: 3, label: "1/8 dotted" },
	{ steps: 4, label: "1/4" },
	{ steps: 6, label: "1/4 dotted" },
	{ steps: 8, label: "1/2" },
] as const;

/** Cell velocities render as the preset row strings: 0 rest, 1 ghost, 2 hit, 3 accent. */
export const CELL_CHAR = [".", "o", "x", "X"] as const;

/** A starting-project row: the steps it plays on at normal velocity (startingDrumProject). */
const STARTING_ROWS: { voice: DrumVoiceId; on: number[] }[] = [
	{ voice: "kick", on: [0, 4, 8, 12] },
	{ voice: "snare", on: [4, 12] },
	{ voice: "hat-closed", on: [0, 2, 4, 6, 8, 10, 12] },
	{ voice: "hat-open", on: [14] },
	{ voice: "clap", on: [] },
	{ voice: "rim", on: [] },
	{ voice: "tom-low", on: [] },
	{ voice: "tom-high", on: [] },
];
const STARTING_STEPS = 16;

/**
 * The example rows the production system prompt shows: the starting
 * project's first four rows, resized to the pattern's steps
 * (resizeDrumPattern semantics: growing repeats the bar, shrinking cuts),
 * rendered as `{"voice": "kick", "cells": "x...x...x...x..."}`.
 */
export function exampleRows(steps: DrumSteps): string {
	return STARTING_ROWS.slice(0, 4)
		.map((r) => {
			const base = Array.from({ length: STARTING_STEPS }, (_, i) => (r.on.includes(i) ? 2 : 0));
			const cells = Array.from({ length: steps }, (_, i) =>
				steps > STARTING_STEPS ? (base[i % STARTING_STEPS] ?? 0) : (base[i] ?? 0),
			);
			return `{"voice": "${r.voice}", "cells": "${cells.map((c) => CELL_CHAR[c]).join("")}"}`;
		})
		.join(", ");
}
