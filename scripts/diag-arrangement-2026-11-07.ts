/**
 * $0 diagnostic: where does the recording's arrangement depart from the
 * chart? Grade the shipped reader's per-bar labels against the chart's
 * bars under (a) the DTW truth grid and (b) the TRUE uniform grid
 * (declared period, comb phase anchored near the DTW start), per
 * 8-bar window, best single shift for (b).
 */
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import charts20b from "/home/exedev/projects/stem-bench/corpus/mmkk-charts-20b.json";
import mmkkCharts from "/home/exedev/projects/stem-bench/corpus/mmkk-charts.json";
import { chromagram } from "/home/exedev/projects/stem-bench/src/study12/chroma.js";
import { dtwAlign } from "/home/exedev/projects/stem-bench/src/study12/dtw.js";
import { type RefBar, renderReference } from "/home/exedev/projects/stem-bench/src/study12/reference.js";
import { rootScore } from "/home/exedev/projects/stem-bench/src/study23/grade23.js";
import type { Meter4 } from "/home/exedev/projects/stem-bench/src/study4/synth4.js";

const root = "/home/exedev/projects/stem-bench/";
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const RATE = 22050;
const TRUE_PERIOD: Record<string, number> = {
	"letter-lands": 60 * 4 / 132,
	"eat-all-the-clocks": 60 * 4 / 120,
	"peaceful-dreams": 60 * 4 / 145,
	"mop-heart": 60 * 3 / 224,
};
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
interface ChartSong { slug: string; bpm: number; meter: string; sections: { name: string; bars: string[][] }[]; }
const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];
const dir = mkdtempSync(join(tmpdir(), "diag-arr-"));

function hintsFor(slug: string, barStarts: number[]): string[] {
	const barsFile = join(dir, `${slug}-${barStarts.length}-${Math.round(barStarts[0]! * 100)}.json`);
	const outFile = `${barsFile}.out.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", `${root}corpus-mmkk/${slug}/mix.mp3.22050.f32le.raw`, "--out", outFile, "--bars", barsFile], { maxBuffer: 64 * 1024 * 1024 });
	if (np.exitCode !== 0) throw new Error(`nchord failed`);
	return (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;
}

for (const chart of songs) {
	const truth: string[][] = [];
	const refBars: RefBar[] = [];
	for (const s of chart.sections) for (const chords of s.bars) {
		refBars.push({ chords: chords.map((c) => c.replace(/\(.*\)$/, "")), bpm: chart.bpm });
		truth.push(chords);
	}
	const n = truth.length;
	const p = TRUE_PERIOD[chart.slug]!;
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const dur = mix.length / RATE;
	const ref = renderReference(refBars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, { subsequence: true });
	const ts = ref.barStarts.map((s) => aligned.mapSeconds(s));

	// (a) hints on the DTW grid
	const hintsDtw = hintsFor(chart.slug, ts);
	const scoreDtw = rootScore(hintsDtw.map((c) => c ?? ""), truth);

	// (b) hints on the TRUE uniform grid anchored at the DTW start
	const start = ts[0]!;
	const nU = Math.max(1, Math.floor((dur - start) / p));
	const uniform = Array.from({ length: nU }, (_, i) => start + i * p);
	const hintsU = hintsFor(chart.slug, uniform);
	// best shift in [-4, +4]
	let best = { shift: 0, right: -1, bearing: 0 };
	for (let shift = -4; shift <= 4; shift++) {
		const per = Array.from({ length: n }, (_, i) => hintsU[i + shift] ?? "");
		const s = rootScore(per, truth);
		if (s.right > best.right) best = { shift, ...s };
	}
	console.log(`\n${chart.slug}: DTW-grid hints ${scoreDtw.right}/${scoreDtw.bearing} | TRUE-grid hints (best shift ${best.shift}) ${best.right}/${best.bearing}`);
	// per-16-bar window at the best shift
	const per = Array.from({ length: n }, (_, i) => hintsU[i + best.shift] ?? "");
	let line = "  true-grid by 16-bar window: ";
	for (let w = 0; w < n; w += 16) {
		const tw = truth.slice(w, w + 16);
		const aw = per.slice(w, w + 16);
		const s = rootScore(aw, tw);
		line += `[${w}-${Math.min(n, w + 16) - 1}] ${s.right}/${s.bearing}  `;
	}
	console.log(line);
	const lineD = (() => {
		let out = "  dtw-grid  by 16-bar window: ";
		for (let w = 0; w < n; w += 16) {
			const s = rootScore(hintsDtw.slice(w, w + 16).map((c) => c ?? ""), truth.slice(w, w + 16));
			out += `[${w}-${Math.min(n, w + 16) - 1}] ${s.right}/${s.bearing}  `;
		}
		return out;
	})();
	console.log(lineD);
}
rmSync(dir, { recursive: true, force: true });
