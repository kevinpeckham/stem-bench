/**
 * Interbellum truth anchor (Study 34 pre-registration): the band page
 * declares C 4/4 115 and the mix is a DAW export, so bar one should sit
 * at 0:00. Adjudicate the same way eat's anchor was (scripts/
 * diag-eat-anchor-2026-11-08.ts): score nchord hints on declared-grid
 * bars at candidate anchors against the band chart. $0, committed
 * before any scored run.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { barmarkChartBars } from "../src/study16/barmarkChartBars.js";
import { rootScore } from "../src/study23/grade23.js";
import { jointOnsetComb } from "../src/study24/tempo.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const chartText = readFileSync(`${root}corpus/badverbs-charts/interbellum.chart.md`, "utf8");
const read = barmarkChartBars(chartText, { tempo: 115, meter: "4/4" });
if (!read) throw new Error("chart refused");
const chartBars = read.bars.map((b) => b.chords);
console.log(`chart: ${chartBars.length} bars`);

const buf = readFileSync(`${root}corpus-mmkk/interbellum/mix.mp3.22050.f32le.raw`);
const mix = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
const feat = extractFeatures(asBuffer(mix, 22050));
const comb = jointOnsetComb(feat.onset, feat.fps, (4 * 60) / 115);
const beat = comb.period / 4;
console.log(`comb period ${comb.period.toFixed(4)}s (declared ${((4 * 60) / 115).toFixed(4)})`);

for (const [label, anchor] of [
	["at zero (DAW export)", 0],
	["one beat late", beat],
	["two beats late", 2 * beat],
	["half beat late", beat / 2],
] as [string, number][]) {
	const barStarts = Array.from({ length: chartBars.length }, (_, i) => anchor + i * comb.period);
	const barsFile = `/tmp/claude-1000/interbellum-anchor-${anchor.toFixed(3)}.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync(
		[
			`${root}.venv-study10/bin/python`,
			`${root}scripts/study10/nchord.py`,
			"--raw",
			`${root}corpus-mmkk/interbellum/mix.mp3.22050.f32le.raw`,
			"--out",
			`${barsFile}.out`,
			"--bars",
			barsFile,
		],
		{ maxBuffer: 64 * 1024 * 1024 },
	);
	if (np.exitCode !== 0) throw new Error("nchord failed");
	const hints = (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
	const r = rootScore(hints, chartBars);
	console.log(`${label}: hints match the band chart ${r.right}/${r.bearing}`);
}
