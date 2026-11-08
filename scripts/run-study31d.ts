/**
 * Study 31d (docs/BRIEF-STUDY31D.md): w2/w3/w6 re-run with the
 * 90-second envelope cap lifted; w1 reported lead-corrected (+0.07 s)
 * beside the registered variant; the vote recombined with the 31b
 * classes of w4/w5/w7. $0.
 */
import { readFileSync, writeFileSync } from "node:fs";
import charts20b from "../corpus/mmkk-charts-20b.json";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { highpass4 } from "../src/study29/backbeat.js";
import { lowpass4 } from "../src/study30/downbeat.js";
import {
	classOf,
	strongOnsets,
	type Vote,
	w1TimeZero,
	w2LastOnset,
	w3BothEnds,
	w6Decide,
	weightedVote,
} from "../src/study31/witnesses.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const WEIGHTS: Record<string, number> = { w1: 2, w2: 1, w3: 1, w4: 2, w5: 1, w6: 2, w7: 1 };
const study31b = JSON.parse(readFileSync(`${root}results/study31b.json`, "utf8")) as {
	songs: Record<string, { votes: Record<string, { cls: number | null }> }>;
};

interface ChartSong {
	slug: string;
	bpm: number;
	meter: string;
}
const beatsOf = (m: string) => (m === "3/4" ? 3 : 4);
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
function histOf(times: number[], anchor: number, beat: number, beats: number): number[] {
	const h = new Array(beats).fill(0) as number[];
	for (const t of times) h[classOf(t, anchor, beat, beats)]!++;
	return h;
}

const SONGS: { chart: ChartSong; truth: number }[] = [
	{ chart: (mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "letter-lands")!, truth: -0.121 },
	{ chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "peaceful-dreams")!, truth: -0.119 },
	{ chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "mop-heart")!, truth: -0.066 },
	{ chart: { ...(eatV131.songs as ChartSong[])[0]!, slug: "eat-all-the-clocks" }, truth: -0.085 },
];

let g1 = true;
let a1Lead = 0;
const out: Record<string, unknown> = {};
for (const song of SONGS) {
	const { chart } = song;
	const beats = beatsOf(chart.meter);
	const declared = (beats * 60) / chart.bpm;
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	// The grid stays the registered Study 28 construction (90 s features).
	const gridFeat = extractFeatures(asBuffer(mix, RATE));
	const grid = chartlessGrid(gridFeat.onset, gridFeat.fps, declared, mix, RATE);
	const span = audibleSpan(mix, RATE);
	const beat = grid.period / beats;
	const truthCls = classOf(song.truth, grid.anchor, beat, beats);
	const gridEnd = grid.anchor + grid.n * grid.period;

	const w1 = w1TimeZero(grid.anchor, beat, beats);
	const w1lead = w1TimeZero(grid.anchor + LEAD, beat, beats);
	if (w1lead.cls !== null && w1lead.cls === truthCls) a1Lead++;

	const feat = extractFeatures(asBuffer(mix, RATE), UNCAPPED);
	const pk = strongOnsets(feat.onset, feat.fps, beat, span);
	const w2 = w2LastOnset(pk, grid.anchor, beat, beats, { first: span.first, last: gridEnd });
	const w3 = w3BothEnds(pk, grid.anchor, beat, beats);

	const manifest = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === chart.slug,
	)!;
	const stemRaw = (s: { url: string }) =>
		loadRaw(`${root}corpus-mmkk/${chart.slug}/${s.url.split("/").pop()}.22050.f32le.raw`);
	const drumStem = manifest.stems.find((s) => /drum/i.test(s.name));
	const bassStem = manifest.stems.find((s) => /bass/i.test(s.name));
	let snareHist: number[] | null = null;
	let kickHist: number[] | null = null;
	let bassCls: number | null = null;
	if (drumStem) {
		const drum = stemRaw(drumStem);
		const sf = extractFeatures(asBuffer(lowpass4(highpass4(drum, RATE, 150), RATE, 2000), RATE), UNCAPPED);
		const kf = extractFeatures(asBuffer(lowpass4(drum, RATE, 150), RATE), UNCAPPED);
		snareHist = histOf(strongOnsets(sf.onset, sf.fps, beat, span), grid.anchor, beat, beats);
		kickHist = histOf(strongOnsets(kf.onset, kf.fps, beat, span), grid.anchor, beat, beats);
	}
	if (bassStem) {
		const bf = extractFeatures(asBuffer(stemRaw(bassStem), RATE), UNCAPPED);
		const h = histOf(strongOnsets(bf.onset, bf.fps, beat, span), grid.anchor, beat, beats);
		bassCls = h.indexOf(Math.max(...h));
	}
	const w6 = w6Decide(snareHist, kickHist, bassCls, beats);

	const prior = study31b.songs[chart.slug]!.votes;
	const combined: Record<string, Vote> = { w1, w2, w3, w4: prior.w4 as Vote, w5: prior.w5 as Vote, w6, w7: prior.w7 as Vote };
	const voteOf = (w1v: Vote) =>
		weightedVote(
			Object.entries({ ...combined, w1: w1v }).map(([name, vv]) => ({ cls: vv.cls, weight: WEIGHTS[name]! })),
			beats,
		);
	const vReg = voteOf(w1);
	const vLead = voteOf(w1lead);
	const ok =
		!vReg.undecided && vReg.decided === truthCls && !vLead.undecided && vLead.decided === truthCls;
	if (!ok) g1 = false;
	out[chart.slug] = { truthCls, w1, w1lead, w2, w3, w6, voteRegistered: vReg, voteLead: vLead };
	const f = (vv: Vote) => (vv.cls === null ? `abstain(${vv.detail.abstain ?? "?"})` : String(vv.cls));
	console.log(
		`${chart.slug}: truth ${truthCls} | w1 ${f(w1)} d${w1.detail.distBeats} | w1+lead ${f(w1lead)} d${w1lead.detail.distBeats} | w2 ${f(w2)} | w3 ${f(w3)} | w6 ${f(w6)} | vote reg [${vReg.scores}] -> ${vReg.undecided ? "undecided" : vReg.decided} | vote lead [${vLead.scores}] -> ${vLead.undecided ? "undecided" : vLead.decided} -> ${ok ? "ok" : "MISS"}`,
	);
}
console.log(`\nS31D-G1 (both vote variants find the true class on all four): ${g1 ? "PASS" : "FAIL"}`);
console.log(`A1 time zero, lead-corrected: ${a1Lead}/4`);
writeFileSync(
	`${root}results/study31d.json`,
	`${JSON.stringify({ version: 1, lead: LEAD, songs: out, a1Lead, gates: { "S31D-G1": g1 ? "PASS" : "FAIL" } }, null, "\t")}\n`,
);
