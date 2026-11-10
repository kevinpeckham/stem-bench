/**
 * Study 38 (docs/BRIEF-STUDY38.md), $0: the trackers' bars against the
 * annotated bars on arms B (GuitarSet, steady tempo, beat-aligned
 * annotations) and C (Winterreise SC06, free tempo, measure annotations).
 * Bar period strict/folded (Study 36 graders), downbeat F at 70 ms, and
 * the bar-count ratio. Writes results/study38-metrical.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { downbeatF, foldCompare, median, summarizeTracker } from "../src/study36/metrical.js";

const root = new URL("../", import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(`${root}corpus/study38-manifest.json`, "utf8")) as {
	entries: Record<string, { arm: string; annotatedBars?: number[]; declared: { bpm?: number; meter?: string } | null; trackers: string }>;
};
const trackers = JSON.parse(readFileSync(`${root}results/study38-trackers.json`, "utf8")) as Record<string, Record<string, { beats: number[]; downbeats: number[] }>>;

const SYSTEMS = ["madmom-34", "beatthis-final0"];
const cells: Record<string, Record<string, unknown>> = {};
const summary: Record<string, Record<string, unknown>> = {};
for (const arm of ["B", "C", "C-metrical"]) {
	for (const sys of SYSTEMS) {
		let n = 0, strict = 0, folded = 0, half = 0, dbl = 0;
		const fs: number[] = [];
		const ratios: number[] = [];
		for (const [slug, e] of Object.entries(manifest.entries)) {
			if (e.arm !== arm || !e.annotatedBars || e.annotatedBars.length < 2) continue;
			const t = trackers[slug]?.[sys];
			if (!t) continue;
			const truthBar = median(e.annotatedBars.slice(1).map((b, i) => b - e.annotatedBars![i]!));
			const s = summarizeTracker(t.beats, t.downbeats);
			if (!s.barSec) continue;
			const fc = foldCompare(s.barSec, truthBar, 0.04);
			const first = e.annotatedBars[0]!;
			const last = e.annotatedBars[e.annotatedBars.length - 1]!;
			const f = downbeatF(t.downbeats, e.annotatedBars, 0.07, first - 0.5, last + 0.5).f;
			const ratio = t.downbeats.filter((d) => d >= first - 0.5 && d <= last + 0.5).length / e.annotatedBars.length;
			n++;
			if (fc.strict) strict++;
			if (fc.folded) folded++;
			if (!fc.strict && fc.ratio === 0.5) half++;
			if (!fc.strict && fc.ratio === 2) dbl++;
			fs.push(f);
			ratios.push(ratio);
			cells[slug] ??= {};
			cells[slug][sys] = { truthBar, barSec: s.barSec, beatsPerBar: s.beatsPerBar, strict: fc.strict, folded: fc.folded, ratio: fc.ratio, downbeatF: +f.toFixed(3), barCountRatio: +ratio.toFixed(3) };
		}
		const within10 = ratios.filter((r) => Math.abs(r - 1) <= 0.1).length;
		summary[`${arm}|${sys}`] = { n, strict, folded, half, double: dbl, downbeatFMedian: fs.length ? +median(fs).toFixed(3) : null, downbeatFAtLeast06: fs.filter((x) => x >= 0.6).length, barCountWithin10pct: within10 };
		console.log(`arm ${arm} ${sys} (n=${n}): bar strict ${strict}, folded ${folded} (half ${half}, double ${dbl}) | downbeat F median ${fs.length ? median(fs).toFixed(2) : "-"}, >=0.6 on ${fs.filter((x) => x >= 0.6).length} | bar count within 10% on ${within10}`);
	}
}
writeFileSync(`${root}results/study38-metrical.json`, `${JSON.stringify({ summary, cells }, null, "\t")}\n`);
console.log("results/study38-metrical.json written");
