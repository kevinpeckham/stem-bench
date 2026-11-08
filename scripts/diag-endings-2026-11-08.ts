/**
 * Ending anatomy ($0): what the "ritardando" abstentions actually
 * measure. The band reports NO tempo slowdown on any corpus song
 * (Interbellum, which does slow, is not in the corpus), so the
 * question is what the ends witness's short "local beats" are:
 * sub-beat musical onsets (fills, eighths), lattice drift, or the
 * ring-out of lingering sustain.
 */
import { readFileSync } from "node:fs";
import charts20b from "../corpus/mmkk-charts-20b.json";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { strongOnsets } from "../src/study31/witnesses.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
interface ChartSong { slug: string; bpm: number; meter: string }
const SONGS: ChartSong[] = [
	(mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "letter-lands")!,
	(charts20b.songs as ChartSong[]).find((s) => s.slug === "peaceful-dreams")!,
	(charts20b.songs as ChartSong[]).find((s) => s.slug === "mop-heart")!,
	{ ...(eatV131.songs as ChartSong[])[0]!, slug: "eat-all-the-clocks" },
];
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;

for (const song of SONGS) {
	const beats = song.meter === "3/4" ? 3 : 4;
	const buf = readFileSync(`${root}corpus-mmkk/${song.slug}/mix.mp3.22050.f32le.raw`);
	const mix = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
	const feat = extractFeatures(asBuffer(mix, RATE), 600);
	const span = audibleSpan(mix, RATE);
	const grid = chartlessGrid(feat.onset, feat.fps, (beats * 60) / song.bpm, mix, RATE);
	const beat = grid.period / beats;
	const pk = strongOnsets(feat.onset, feat.fps, beat, span);
	const last = pk[pk.length - 1]!;
	const ringOut = span.last - last;
	// the last 8 beats of strong onsets before the final one
	const win = pk.filter((t) => t >= last - 8 * beat);
	const gaps = win.slice(1).map((t, i) => (t - win[i]!) / beat);
	// do the window's onsets still sit ON the lattice? (steady tempo test)
	const snaps = win.map((t) => {
		const d = (t - grid.anchor) / beat;
		return Math.abs(d - Math.round(d));
	});
	// same test over the whole song for contrast
	const snapsAll = pk.map((t) => {
		const d = (t - grid.anchor) / beat;
		return Math.abs(d - Math.round(d));
	});
	console.log(`\n${song.slug} (${song.bpm} bpm, beat ${beat.toFixed(3)}s)`);
	console.log(`  last strong onset ${last.toFixed(2)}s, audible span ends ${span.last.toFixed(2)}s -> RING-OUT ${ringOut.toFixed(2)}s = ${(ringOut / beat).toFixed(1)} beats of lingering sustain`);
	console.log(`  final-window onset gaps (in beats): ${gaps.map((g) => g.toFixed(2)).join(" ")}`);
	console.log(`  lattice snap, final window: median ${median(snaps).toFixed(3)} beat | whole song: ${median(snapsAll).toFixed(3)} beat`);
	const sub = gaps.filter((g) => g < 0.75).length;
	console.log(`  sub-beat gaps ${sub}/${gaps.length} -> the short 'local beat' is ${sub > 0 ? "busy onsets (fills/eighths), not tempo" : "NOT from sub-beat onsets"}`);
}
