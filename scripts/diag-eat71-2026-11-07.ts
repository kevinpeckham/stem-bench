/**
 * $0 adjudication: does eat-all-the-clocks' recording match the live
 * 71-bar chart (chartVersion 131) or the bench's 86-bar fixture?
 * (1) reader hints on the true uniform grid, root-graded against both;
 * (2) the DTW alignment re-run against a reference rendered from the
 * 71-bar chart, ends measured; (3) the Study 26c recipe on it.
 */
import { readFileSync } from "node:fs";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromagram } from "/home/exedev/projects/stem-bench/src/study12/chroma.js";
import { dtwAlign } from "/home/exedev/projects/stem-bench/src/study12/dtw.js";
import { type RefBar, renderReference } from "/home/exedev/projects/stem-bench/src/study12/reference.js";
import { rootScore } from "/home/exedev/projects/stem-bench/src/study23/grade23.js";
import { jointOnsetComb } from "/home/exedev/projects/stem-bench/src/study24/tempo.js";
import { audibleSpan, repairEndsV2 } from "/home/exedev/projects/stem-bench/src/study26/recipe.js";
import { extractFeatures } from "/home/exedev/projects/stem-bench/src/study9/analysis.js";
import { asBuffer } from "/home/exedev/projects/stem-bench/src/study9/instruments.js";
import charts from "/home/exedev/projects/stem-bench/corpus/mmkk-charts.json";

const root = "/home/exedev/projects/stem-bench/";
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const mixPath = `${root}corpus-mmkk/eat-all-the-clocks/mix.mp3.22050.f32le.raw`;
const buf = readFileSync(mixPath);
const mix = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
const dur = mix.length / RATE;
const P = 2.0;
const ANCHOR = 0.415;

// The live chart, chartVersion 131, expanded bar by bar.
const chorus = [["D5"], ["A7"], ["E5"], ["E5"]];
const verse = [["E5"], ["Am7", "G5"]];
const live71: string[][] = [
	...Array.from({ length: 14 }, () => ["Em", "Am"]),
	["D5"], ["A7"], ["Em7"], ["Em7"], ["C"], ["D"], ["A"], ["A"],
	...verse, ...verse, ...verse,
	...chorus, ...chorus,
	["E5"], ["E5"], ["A5"], ["A5"], ["E5"], ["E5"], ["A5"], ["A5"],
	["N.C."], ["N.C."], ["A5"], ["A5"],
	...verse, ...verse, ...verse,
	...chorus, ...chorus,
	...chorus, ...chorus,
	["Em"],
];
console.log("live chart bars:", live71.length);

// Bench fixture truth (86 bars).
const fixture = (charts.songs as { slug: string; sections: { bars: string[][] }[] }[]).find(
	(s) => s.slug === "eat-all-the-clocks",
)!;
const bench86: string[][] = [];
for (const sec of fixture.sections) for (const b of sec.bars) bench86.push(b.map((c) => c.replace(/\(.*\)$/, "")));

// (1) hints on the true uniform grid (anchor 0.415, period 2.0, 71 bars).
const dir = mkdtempSync(join(tmpdir(), "eat71-"));
function hintsFor(barStarts: number[]): string[] {
	const barsFile = join(dir, `bars-${barStarts.length}.json`);
	const outFile = `${barsFile}.out.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", mixPath, "--out", outFile, "--bars", barsFile], { maxBuffer: 64 * 1024 * 1024 });
	if (np.exitCode !== 0) throw new Error("nchord failed");
	return (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;
}
const grid71 = Array.from({ length: 71 }, (_, i) => ANCHOR + i * P);
const h = hintsFor(grid71);
const s71 = rootScore(Array.from({ length: 71 }, (_, i) => h[i] ?? ""), live71);
const s86 = rootScore(Array.from({ length: 86 }, (_, i) => h[i] ?? ""), bench86);
console.log(`hints vs LIVE 71-bar chart: ${s71.right}/${s71.bearing}`);
console.log(`hints vs BENCH 86-bar fixture: ${s86.right}/${s86.bearing}`);
// per-16 windows for the live chart
let line = "live by 16-bar window: ";
for (let w = 0; w < 71; w += 16) {
	const sc = rootScore(h.slice(w, w + 16).map((c) => c ?? ""), live71.slice(w, w + 16));
	line += `[${w}-${Math.min(71, w + 16) - 1}] ${sc.right}/${sc.bearing}  `;
}
console.log(line);

// (2) DTW against a reference rendered from the LIVE chart.
const refBars: RefBar[] = live71.map((chords) => ({ chords: chords.filter((c) => c !== "N.C."), bpm: 120 }));
for (const r of refBars) if (r.chords.length === 0) r.chords = ["A5"]; // N.C. bars carry the bridge's A5 wash
const ref = renderReference(refBars, "4/4");
const rec = chromagram(mix);
const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, { subsequence: true });
const ts = ref.barStarts.map((s) => aligned.mapSeconds(s));
const trueGrid = grid71;
const e = (i: number) => Math.abs(ts[i]! - trueGrid[i]!);
const mid = Array.from({ length: 71 }, (_, i) => i).slice(14, 57).map(e);
console.log(`DTW vs 71-bar reference: first4 ${[0,1,2,3].map(e).map((x) => x.toFixed(2)).join("/")} | middle mean ${(mid.reduce((a,b)=>a+b,0)/mid.length).toFixed(2)}s | last4 ${[67,68,69,70].map(e).map((x) => x.toFixed(2)).join("/")}`);

// (3) the 26c recipe on this alignment.
const feat = extractFeatures(asBuffer(mix, RATE));
const comb = jointOnsetComb(feat.onset, feat.fps, P);
const out = repairEndsV2(ts, feat.onset, feat.fps, comb.period, 0.25);
if (!out) {
	console.log("recipe: REFUSED");
} else {
	const er = (i: number) => Math.abs(out.barStarts[i]! - trueGrid[i]!);
	const span = audibleSpan(mix, RATE);
	const durs = out.barStarts.slice(1).map((t, i) => t - out.barStarts[i]!);
	const median = [...durs].sort((a, b) => a - b)[Math.floor((durs.length - 1) / 2)]!;
	console.log(
		`recipe: trusted ${out.iFirst}..${out.iLast} | first4 ${[0,1,2,3].map(er).map((x) => x.toFixed(2)).join("/")} | last4 ${[67,68,69,70].map(er).map((x) => x.toFixed(2)).join("/")} | bar1 ${Math.abs(out.barStarts[0]! - span.first) <= P ? "ok" : "FAIL"} | median ${median.toFixed(3)} (${((Math.abs(median - P) / P) * 100).toFixed(1)}% off)`,
	);
}
rmSync(dir, { recursive: true, force: true });
