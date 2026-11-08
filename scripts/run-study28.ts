/**
 * Study 28 (docs/BRIEF-STUDY28.md): the capstone chartless draft —
 * one grid recipe (comb period + comb lattice anchor + audible-span
 * length), one fable call per song, graded against the corrected
 * charts. Fence $1.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import charts20b from "../corpus/mmkk-charts-20b.json";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { expandChords, isDialectBar, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { strictSame } from "../src/study20/strict20.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;

function readEnvLocal(): string | null {
	try {
		const m = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/);
		return m?.[1]?.trim() ?? null;
	} catch {
		return null;
	}
}
const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });

interface ChartSong {
	slug: string;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}
const beatsOf = (m: string) => (m === "3/4" ? 3 : 4);
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
function bars(chart: ChartSong): string[][] {
	const out: string[][] = [];
	for (const s of chart.sections) for (const b of s.bars) out.push(b);
	return out;
}

const SONGS: { chart: ChartSong; key: string; refPct: number }[] = [
	{
		chart: (mmkkCharts.songs as ChartSong[]).find((s) => s.slug === "letter-lands")!,
		key: "F#",
		refPct: 72 / 76,
	},
	{
		chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "peaceful-dreams")!,
		key: "D",
		refPct: 151 / 153,
	},
	{
		chart: (charts20b.songs as ChartSong[]).find((s) => s.slug === "mop-heart")!,
		key: "A",
		refPct: 131 / 140,
	},
	{
		chart: { ...(eatV131.songs as ChartSong[])[0]!, slug: "eat-all-the-clocks" },
		key: "Em",
		refPct: 56 / 69,
	},
];

const dir = mkdtempSync(join(tmpdir(), "stem-bench28-"));
const out: Record<string, unknown> = {};
let g1 = true;
let g2 = true;
let tokensIn = 0;
let tokensOut = 0;

for (const song of SONGS) {
	const { chart } = song;
	const declared = (beatsOf(chart.meter) * 60) / chart.bpm;
	const truth = bars(chart);
	const mixRaw = `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`;
	const mix = loadRaw(mixRaw);
	const feat = extractFeatures(asBuffer(mix, RATE));
	const grid = chartlessGrid(feat.onset, feat.fps, declared, mix, RATE);
	const countOk = Math.abs(grid.n - truth.length) <= 1;
	if (!countOk) g2 = false;
	const nGrade = Math.min(grid.n, truth.length);
	const barStarts = Array.from({ length: grid.n }, (_, i) => grid.anchor + i * grid.period);

	// Hints on the derived grid.
	const barsFile = join(dir, `bars-${chart.slug}.json`);
	const outFile = `${barsFile}.out.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", mixRaw, "--out", outFile, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord failed (${chart.slug})`);
	const hintsRaw = (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;

	// Transcription (non-drum stems sum, production parity as Studies 25/25b).
	const m = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === chart.slug,
	)!;
	const stems = m.stems
		.filter((s) => !/drum/i.test(s.name))
		.map((s) => loadRaw(`${root}corpus-mmkk/${chart.slug}/${s.url.split("/").pop()}.22050.f32le.raw`));
	const len = Math.max(...stems.map((s) => s.length));
	const sum = new Float32Array(len);
	for (const s of stems) for (let i = 0; i < s.length; i++) sum[i]! += s[i]!;
	let peak = 0;
	for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(sum[i]!));
	if (peak > 0) for (let i = 0; i < len; i++) sum[i]! /= peak;
	const rawFile = join(dir, `${chart.slug}.raw`);
	writeFileSync(rawFile, Buffer.from(sum.buffer, sum.byteOffset, sum.byteLength));
	const proc = Bun.spawnSync(
		["node", `${root}scripts/transcribe-child.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, rawFile],
		{ maxBuffer: 256 * 1024 * 1024 },
	);
	if (proc.exitCode !== 0) throw new Error(`transcription failed (${chart.slug})`);
	const rows = JSON.parse(proc.stdout.toString()) as [number, number, number, number][];
	const notes: Note[] = rows.map(([start, duration, pitch, amplitude]) => ({
		start,
		end: start + duration,
		pitch,
		amplitude,
	}));

	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: chart.slug.replace(/-/g, " "),
			bpm: chart.bpm,
			key: song.key,
			meter: chart.meter,
			barNotes: describeBars(notes, barStarts),
			hintPerBar: hintsRaw.map((c) => (c === "" ? "N.C." : c)),
		}),
		temperature: 0,
		maxOutputTokens: 8000,
		maxRetries: 4,
		providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } },
	} as Parameters<typeof generateText>[0]);
	tokensIn += result.totalUsage?.inputTokens ?? 0;
	tokensOut += result.totalUsage?.outputTokens ?? 0;
	const json = result.text.match(/\{[\s\S]*\}/)?.[0];
	const parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	if (!parsed?.success) {
		console.log(`${chart.slug}: NO VALID ANSWER -> S28-G1 MISS`);
		g1 = false;
		out[chart.slug] = { grid, outcome: "no-valid-answer" };
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const perBar = Array.from({ length: nGrade }, (_, i) => expanded[i] ?? "");
	const truthPrefix = truth.slice(0, nGrade);
	const roots = rootScore(perBar, truthPrefix);
	const dialect = truthPrefix
		.map((t, i) => ({ t, a: perBar[i]! }))
		.filter(({ t }) => isDialectBar(t))
		.filter(({ t, a }) => t.some((x) => x !== "" && strictSame(x, a))).length;
	const pct = roots.right / roots.bearing;
	const ok = pct >= song.refPct - 0.05;
	if (!ok) g1 = false;
	out[chart.slug] = {
		grid,
		chartBars: truth.length,
		roots,
		pct,
		refPct: song.refPct,
		dialectStrict: dialect,
		answer: parsed.output,
	};
	console.log(
		`${chart.slug}: grid anchor ${grid.anchor.toFixed(3)}s period ${grid.period.toFixed(4)}s n ${grid.n} (chart ${truth.length}${countOk ? ", ok" : ", S28-G2 MISS"}) | draft roots ${roots.right}/${roots.bearing} = ${(pct * 100).toFixed(1)}% (ref ${(song.refPct * 100).toFixed(1)}%) | dialect ${dialect} -> S28-G1 ${ok ? "ok" : "MISS"}`,
	);
}

console.log(`\nS28-G1 (draft within 5 points of each reference): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S28-G2 (derived bar count within 1 of the chart): ${g2 ? "PASS" : "FAIL"}`);
console.log(`tokens ${tokensIn} in / ${tokensOut} out`);
writeFileSync(
	`${root}results/study28.json`,
	`${JSON.stringify(
		{
			version: 1,
			model: MODEL,
			songs: out,
			gates: { "S28-G1": g1 ? "PASS" : "FAIL", "S28-G2": g2 ? "PASS" : "FAIL" },
			tokensIn,
			tokensOut,
		},
		null,
		"\t",
	)}\n`,
);
rmSync(dir, { recursive: true, force: true });
