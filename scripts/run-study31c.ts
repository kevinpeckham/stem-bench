/**
 * Study 31c (docs/BRIEF-STUDY31C.md): the A4 re-draft arm on the
 * corrected whole-bar placement of the 31b voted classes.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import charts20b from "../corpus/mmkk-charts-20b.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { expandChords, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { audibleSpan } from "../src/study26/recipe.js";
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

const study31b = JSON.parse(readFileSync(`${root}results/study31b.json`, "utf8")) as {
	decisions: Record<string, { decided: number }>;
};

interface ChartSong {
	slug: string;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

const SONGS = [
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
];

const dir = mkdtempSync(join(tmpdir(), "stem-bench31c-"));
let g3 = true;
let tokensIn = 0;
let tokensOut = 0;
const out: Record<string, unknown> = {};
for (const song of SONGS) {
	const { chart } = song;
	const beats = 4;
	const declared = (beats * 60) / chart.bpm;
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const feat = extractFeatures(asBuffer(mix, RATE));
	const grid = chartlessGrid(feat.onset, feat.fps, declared, mix, RATE);
	const span = audibleSpan(mix, RATE);
	const beat = grid.period / beats;
	const cls = study31b.decisions[chart.slug]!.decided;
	// The amendment's placement rule: bar one contains the first sound.
	let anchor = grid.anchor + cls * beat;
	while (anchor > span.first + 0.25 * beat) anchor -= grid.period;
	if (anchor < span.first - grid.period) anchor += grid.period;
	const barStarts = Array.from({ length: grid.n }, (_, i) => anchor + i * grid.period);
	console.log(`${chart.slug}: class ${cls} placed at ${anchor.toFixed(3)}s (first sound ${span.first.toFixed(3)}s)`);

	const truthBars: string[][] = [];
	for (const s of chart.sections) for (const b of s.bars) truthBars.push(b);
	const nGrade = Math.min(grid.n, truthBars.length);
	const barsFile = join(dir, `bars-${chart.slug}.json`);
	const outFile = `${barsFile}.out.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync(
		[PY, NCHORD, "--raw", `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`, "--out", outFile, "--bars", barsFile],
		{ maxBuffer: 64 * 1024 * 1024 },
	);
	if (np.exitCode !== 0) throw new Error(`nchord failed (${chart.slug})`);
	const hintsRaw = (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;
	const manifest = (manifestMmkk.songs as { slug: string; stems: { name: string; url: string }[] }[]).find(
		(x) => x.slug === chart.slug,
	)!;
	const stems = manifest.stems
		.filter((st) => !/drum/i.test(st.name))
		.map((st) => loadRaw(`${root}corpus-mmkk/${chart.slug}/${st.url.split("/").pop()}.22050.f32le.raw`));
	const len = Math.max(...stems.map((x) => x.length));
	const sum = new Float32Array(len);
	for (const x of stems) for (let i = 0; i < x.length; i++) sum[i]! += x[i]!;
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
		console.log(`${chart.slug}: NO VALID ANSWER -> S31C-G3 MISS`);
		g3 = false;
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const perBar = Array.from({ length: nGrade }, (_, i) => expanded[i] ?? "");
	const roots = rootScore(perBar, truthBars.slice(0, nGrade));
	const pct = roots.right / roots.bearing;
	const ok = pct >= song.refPct - 0.05;
	if (!ok) g3 = false;
	out[chart.slug] = { anchor, cls, roots, pct, refPct: song.refPct };
	console.log(
		`  re-draft: roots ${roots.right}/${roots.bearing} = ${(pct * 100).toFixed(1)}% (ref ${(song.refPct * 100).toFixed(1)}%) -> S31C-G3 ${ok ? "ok" : "MISS"}`,
	);
}
console.log(`\nS31C-G3: ${g3 ? "PASS" : "FAIL"}`);
console.log(`tokens ${tokensIn} in / ${tokensOut} out`);
writeFileSync(
	`${root}results/study31c.json`,
	`${JSON.stringify({ version: 1, model: MODEL, songs: out, gates: { "S31C-G3": g3 ? "PASS" : "FAIL" }, tokensIn, tokensOut }, null, "\t")}\n`,
);
rmSync(dir, { recursive: true, force: true });
