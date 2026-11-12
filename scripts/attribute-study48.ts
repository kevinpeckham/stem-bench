/**
 * Study 48, post-hoc and labelled as such (docs/BRIEF-STUDY48.md Results):
 * what makes a bar not right. For each song and pipeline, over the graded
 * bars, every truth onset is classed as matched (same slot, same pitch),
 * octave (same slot, pitch class right, octave wrong), other pitch (same
 * slot, wrong class) or missing (no onset in its slot); every transcribed
 * onset with no truth onset in its slot is extra. Bars are then classed by
 * what they contain. $0; reads the note lists the pipelines wrote.
 *   bun scripts/attribute-study48.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { type Bar, barsOf, meantNotes, type Note, quantizeBar } from "../src/study48/bassLine.js";

const root = new URL("../", import.meta.url).pathname;
const PIPELINES = ["bp", "bp-bass", "pyin"] as const;
const manifest = JSON.parse(readFileSync(`${root}corpus/study48-manifest.json`, "utf8")) as { entries: Record<string, { raw: string }> };
const beats = {
	...(JSON.parse(readFileSync(`${root}corpus/study44-app-beats.json`, "utf8")) as Record<string, { beats: number[]; downbeats: number[]; duration: number }>),
	...(existsSync(`${root}corpus/study48-extra-beats.json`) ? (JSON.parse(readFileSync(`${root}corpus/study48-extra-beats.json`, "utf8")) as Record<string, { beats: number[]; downbeats: number[]; duration: number }>) : {}),
};
interface Tally {
	truthOnsets: number;
	matched: number;
	octave: number;
	otherPitch: number;
	missing: number;
	extra: number;
	bars: number;
	barsRight: number;
	barsOnlyExtra: number;
	barsOnlyMissing: number;
	barsOnlyPitch: number;
	barsMixed: number;
	barsGridDiffers: number;
}
const out: Record<string, Record<string, Tally>> = {};
for (const [slug, e] of Object.entries(manifest.entries)) {
	const dir = `${root}${e.raw.slice(0, e.raw.lastIndexOf("/"))}`;
	const g = beats[slug]!;
	const bars: Bar[] = barsOf(g.beats, g.downbeats, g.duration);
	const truthAll = meantNotes(JSON.parse(readFileSync(`${dir}/truth-mix.json`, "utf8")) as Note[], bars);
	const first = bars.findIndex((b) => truthAll.some((n) => n.start >= b.start && n.start < b.end));
	let last = bars.length - 1;
	while (last > first && !truthAll.some((n) => n.start >= bars[last]!.start && n.start < bars[last]!.end)) last--;
	const span = bars.slice(first, last + 1);
	out[slug] = {};
	for (const p of PIPELINES) {
		const est = meantNotes(JSON.parse(readFileSync(`${dir}/notes-${p}-mix.json`, "utf8")) as Note[], bars);
		const t: Tally = { truthOnsets: 0, matched: 0, octave: 0, otherPitch: 0, missing: 0, extra: 0, bars: span.length, barsRight: 0, barsOnlyExtra: 0, barsOnlyMissing: 0, barsOnlyPitch: 0, barsMixed: 0, barsGridDiffers: 0 };
		for (const bar of span) {
			const tl = quantizeBar(truthAll, bar);
			const el = quantizeBar(est, bar);
			if (tl.mode !== el.mode && (tl.onsets.size || el.onsets.size)) {
				t.barsGridDiffers++;
				t.truthOnsets += tl.onsets.size;
				t.missing += tl.onsets.size;
				t.extra += el.onsets.size;
				continue;
			}
			let miss = 0;
			let pitch = 0;
			let extra = 0;
			for (const [slot, n] of tl.onsets) {
				t.truthOnsets++;
				const m = el.onsets.get(slot);
				if (!m) {
					miss++;
					t.missing++;
				} else if (m.pitch === n.pitch) t.matched++;
				else {
					pitch++;
					if ((m.pitch - n.pitch) % 12 === 0) t.octave++;
					else t.otherPitch++;
				}
			}
			for (const slot of el.onsets.keys()) if (!tl.onsets.has(slot)) extra++;
			t.extra += extra;
			if (!miss && !pitch && !extra) t.barsRight++;
			else if (extra && !miss && !pitch) t.barsOnlyExtra++;
			else if (miss && !extra && !pitch) t.barsOnlyMissing++;
			else if (pitch && !miss && !extra) t.barsOnlyPitch++;
			else t.barsMixed++;
		}
		out[slug][p] = t;
		const pc = (a: number, b: number) => `${((100 * a) / Math.max(1, b)).toFixed(0)} %`;
		console.log(
			`${slug.padEnd(18)} ${p.padEnd(8)} truth onsets ${t.truthOnsets}: matched ${pc(t.matched, t.truthOnsets)}, octave ${pc(t.octave, t.truthOnsets)}, other pitch ${pc(t.otherPitch, t.truthOnsets)}, missing ${pc(t.missing, t.truthOnsets)}; extra onsets ${t.extra} (${pc(t.extra, t.truthOnsets)} of truth) | bars ${t.bars}: right ${t.barsRight}, only extras ${t.barsOnlyExtra}, only missing ${t.barsOnlyMissing}, only pitch ${t.barsOnlyPitch}, mixed ${t.barsMixed}, grid differs ${t.barsGridDiffers}`,
		);
	}
}
writeFileSync(`${root}results/study48-attribution.json`, `${JSON.stringify({ note: "post-hoc, labelled: what makes a bar not right", songs: out }, null, "\t")}\n`);
