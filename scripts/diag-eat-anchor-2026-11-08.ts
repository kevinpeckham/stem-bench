/**
 * Eat anchor adjudication (Study 31 aftermath): is the registered
 * truth anchor (+0.415 s, Study 25, derived before Correction 2) one
 * beat late? Score nchord hints on 71-bar grids at the registered
 * anchor and one beat earlier against the corrected chart — the
 * Study 27 Arm A hint instrument. $0.
 */
import { readFileSync, writeFileSync } from "node:fs";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import { rootScore } from "../src/study23/grade23.js";
import { jointOnsetComb } from "../src/study24/tempo.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const chart = (eatV131.songs as { bpm: number; sections: { bars: string[][] }[] }[])[0]!;
const chartBars: string[][] = [];
for (const s of chart.sections) for (const b of s.bars) chartBars.push(b);
const buf = readFileSync(`${root}corpus-mmkk/eat-all-the-clocks/mix.mp3.22050.f32le.raw`);
const mix = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
const feat = extractFeatures(asBuffer(mix, RATE));
const comb = jointOnsetComb(feat.onset, feat.fps, (4 * 60) / chart.bpm);
const beat = comb.period / 4;

for (const [label, anchor] of [
	["registered (+0.415)", 0.415],
	["one beat early (-0.085)", 0.415 - beat],
	["two beats early (-0.585)", 0.415 - 2 * beat],
	["one beat late (+0.915)", 0.415 + beat],
] as [string, number][]) {
	const barStarts = Array.from({ length: 71 }, (_, i) => anchor + i * comb.period);
	const barsFile = `/tmp/claude-1000/eat-adj-${anchor.toFixed(3)}.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync(
		[`${root}.venv-study10/bin/python`, `${root}scripts/study10/nchord.py`, "--raw", `${root}corpus-mmkk/eat-all-the-clocks/mix.mp3.22050.f32le.raw`, "--out", `${barsFile}.out`, "--bars", barsFile],
		{ maxBuffer: 64 * 1024 * 1024 },
	);
	if (np.exitCode !== 0) throw new Error("nchord failed");
	const hints = (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
	const r = rootScore(hints, chartBars);
	console.log(`${label}: hints match the corrected chart ${r.right}/${r.bearing}`);
}
