/**
 * Study 52, post-hoc and labelled as such (docs/BRIEF-STUDY52.md Results):
 * the truth's very short notes. The grader drops truth notes under 0.4 of a
 * sixteenth as not meant (Study 48's rule). The corrected MIDI still holds
 * such notes on two songs (4 to 7 ms long). This asks how much they matter:
 * each bar is graded again with a transcribed onset forgiven, whatever its
 * pitch, when it falls in a slot where a dropped truth note starts.
 *   bun scripts/sensitivity-study52.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { type BarLine, barsOf, gradeBar, meantNotes, type Note, quantizeBar, slotOf } from "../src/study48/bassLine.js";
import { spanOf } from "../src/study49/grade.js";
import { bassConstrain } from "../src/study49/rules.js";

const root = new URL("../", import.meta.url).pathname;
const read = <T>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
type Grid = { beats: number[]; downbeats: number[]; duration: number };
const manifest = read<{ entries: Record<string, { raw: string; midiToMixSec: number; appStemOffset: { offsetSec: number } }> }>(`${root}corpus/study48-manifest.json`);
const grids: Record<string, Grid> = { ...read<Record<string, Grid>>(`${root}corpus/study44-app-beats.json`), ...read<Record<string, Grid>>(`${root}corpus/study48-extra-beats.json`) };
const PIPES = { bp: "study49/o50-f30-n11-i0-m0.json", hfbass: "study52/hfbass.json" };
const out: Record<string, unknown> = {};
for (const [slug, e] of Object.entries(manifest.entries)) {
	const dir = `${root}${e.raw.slice(0, e.raw.lastIndexOf("/"))}`;
	const g = grids[slug]!;
	const bars = barsOf(g.beats, g.downbeats, g.duration);
	const off = e.appStemOffset.offsetSec;
	const truthRaw: Note[] = read<{ notes: { start: number; end: number; pitch: number }[] }>(`${dir}/midi-notes.json`).notes.map((n) => ({ start: n.start + e.midiToMixSec, end: n.end + e.midiToMixSec, pitch: n.pitch - 12 }));
	const truth = meantNotes(truthRaw, bars);
	const kept = new Set(truth);
	const dropped = truthRaw.filter((n) => !kept.has(n));
	const span = spanOf(truth, bars);
	const row: Record<string, unknown> = { droppedTruthNotes: dropped.length };
	for (const [name, file] of Object.entries(PIPES)) {
		const est = meantNotes(bassConstrain(read<[number, number, number, number][]>(`${dir}/${file}`).map(([s, d, p]) => ({ start: s + off, end: s + d + off, pitch: p }))), bars);
		let right = 0;
		let rightForgiven = 0;
		let forgiven = 0;
		for (const bar of span) {
			const tl = quantizeBar(truth, bar);
			const el = quantizeBar(est, bar);
			if (gradeBar(tl, el).cls === "right") right++;
			const drop = dropped.filter((n) => n.start >= bar.start && n.start < bar.end).map((n) => slotOf(n.start, bar, el.mode)?.slot);
			const el2: BarLine = { mode: el.mode, onsets: new Map(el.onsets), ends: new Map(el.ends) };
			for (const s of drop)
				if (s !== undefined && el2.onsets.has(s) && !tl.onsets.has(s)) {
					el2.onsets.delete(s);
					forgiven++;
				}
			if (gradeBar(tl, el2).cls === "right") rightForgiven++;
		}
		row[name] = { bars: span.length, right, rightForgiven, onsetsForgiven: forgiven };
		console.log(`${slug.padEnd(18)} ${name.padEnd(7)} dropped truth notes ${dropped.length}; bars right ${right} of ${span.length} (${((100 * right) / span.length).toFixed(0)} %) -> ${rightForgiven} (${((100 * rightForgiven) / span.length).toFixed(0)} %) with ${forgiven} onsets forgiven`);
	}
	out[slug] = row;
}
writeFileSync(`${root}results/study52-sensitivity.json`, `${JSON.stringify({ note: "post-hoc, labelled: transcribed onsets forgiven where a truth note the grader dropped as too short begins", songs: out }, null, "\t")}\n`);
