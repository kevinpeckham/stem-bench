/**
 * Study 49, post-hoc and labelled as such (docs/BRIEF-STUDY49.md Results):
 * the registered attribution (src/study49/grade.ts) repeated under the
 * selected configuration, to see which classes of extra onset the melodia
 * pass and the inferred onsets were making, and each bar classed by what
 * fails it (only extras, only misses, only pitch, the grid, mixed), under
 * the app's configuration and the selected one. $0.
 *   bun scripts/attribute-study49.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { barsOf, meantNotes, quantizeBar } from "../src/study48/bassLine.js";
import { attribute, EXTRA_CLASSES, MISS_CLASSES, spanOf, type TruthNote } from "../src/study49/grade.js";
import { APP_CONFIG, bassConstrain, beatLengthAt } from "../src/study49/rules.js";

const root = new URL("../", import.meta.url).pathname;
const read = <T>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
type Grid = { beats: number[]; downbeats: number[]; duration: number };
const manifest = read<{ entries: Record<string, { raw: string; midiToMixSec: number; appStemOffset: { offsetSec: number } }> }>(`${root}corpus/study48-manifest.json`);
const grids: Record<string, Grid> = { ...read<Record<string, Grid>>(`${root}corpus/study44-app-beats.json`), ...read<Record<string, Grid>>(`${root}corpus/study48-extra-beats.json`) };
const selected = read<{ partC: { selected: string } }>(`${root}results/study49.json`).partC.selected;
const out: Record<string, Record<string, unknown>> = {};
const totals: Record<string, { extras: Record<string, number>; misses: Record<string, number>; bars: Record<string, number> }> = {};
for (const [slug, e] of Object.entries(manifest.entries)) {
	const dir = `${root}${e.raw.slice(0, e.raw.lastIndexOf("/"))}`;
	const g = grids[slug]!;
	const bars = barsOf(g.beats, g.downbeats, g.duration);
	const truth = meantNotes(
		read<{ notes: { start: number; end: number; pitch: number; vel: number }[] }>(`${dir}/midi-notes.json`).notes.map((n) => ({ start: n.start + e.midiToMixSec, end: n.end + e.midiToMixSec, pitch: n.pitch - 12, vel: n.vel })),
		bars,
	) as TruthNote[];
	const span = spanOf(truth, bars);
	const truthLines = span.map((b) => quantizeBar(truth, b));
	out[slug] = {};
	for (const id of [APP_CONFIG.id, selected]) {
		const est = meantNotes(
			bassConstrain(read<[number, number, number, number][]>(`${dir}/study49/${id}.json`).map(([s, d, p, a]) => ({ start: s, end: s + d, pitch: p, amp: a }))).map((n) => ({ ...n, start: n.start + e.appStemOffset.offsetSec, end: n.end + e.appStemOffset.offsetSec })),
			bars,
		);
		const a = attribute(truth, truthLines, est, span, beatLengthAt(bars));
		const barClass = { right: 0, onlyExtras: 0, onlyMisses: 0, onlyPitch: 0, grid: 0, mixed: 0 };
		for (let i = 0; i < span.length; i++) {
			const tl = truthLines[i]!;
			const el = quantizeBar(est, span[i]!);
			if (tl.mode !== el.mode) {
				if (tl.onsets.size || el.onsets.size) barClass.grid++;
				else barClass.right++;
				continue;
			}
			let miss = 0;
			let pitch = 0;
			let extra = 0;
			for (const [slot, n] of tl.onsets) {
				const m = el.onsets.get(slot);
				if (!m) miss++;
				else if (m.pitch !== n.pitch) pitch++;
			}
			for (const slot of el.onsets.keys()) if (!tl.onsets.has(slot)) extra++;
			if (!miss && !pitch && !extra) barClass.right++;
			else if (extra && !miss && !pitch) barClass.onlyExtras++;
			else if (miss && !extra && !pitch) barClass.onlyMisses++;
			else if (pitch && !miss && !extra) barClass.onlyPitch++;
			else barClass.mixed++;
		}
		out[slug]![id] = { extras: a.extras, misses: a.misses, bars: barClass };
		totals[id] ??= { extras: {}, misses: {}, bars: {} };
		for (const c of EXTRA_CLASSES) totals[id]!.extras[c] = (totals[id]!.extras[c] ?? 0) + a.extras[c];
		for (const c of MISS_CLASSES) totals[id]!.misses[c] = (totals[id]!.misses[c] ?? 0) + a.misses[c];
		for (const [k, v] of Object.entries(barClass)) totals[id]!.bars[k] = (totals[id]!.bars[k] ?? 0) + v;
		console.log(`${slug.padEnd(18)} ${id}: extras ${EXTRA_CLASSES.map((c) => `${c} ${a.extras[c]}`).join(", ")} | misses ${MISS_CLASSES.map((c) => `${c} ${a.misses[c]}`).join(", ")} | bars ${Object.entries(barClass).map(([k, v]) => `${k} ${v}`).join(", ")}`);
	}
}
for (const [id, t] of Object.entries(totals)) console.log(`TOTAL ${id}: extras ${JSON.stringify(t.extras)} | misses ${JSON.stringify(t.misses)} | bars ${JSON.stringify(t.bars)}`);
writeFileSync(`${root}results/study49-posthoc.json`, `${JSON.stringify({ note: "post-hoc, labelled: the registered attribution under the selected configuration, and bars by what fails them", selected, songs: out, totals }, null, "\t")}\n`);
