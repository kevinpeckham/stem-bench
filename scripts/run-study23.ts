/**
 * Study 23 pilot (docs/BRIEF-STUDY23.md): recording -> chart through the
 * production composition, grid-given. One fable call per song ($2 fence);
 * transcription, alignment, prompts and the chart adapter are the pinned
 * ports. Gates printed; everything written to results/study23.json.
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import charts20b from "../corpus/mmkk-charts-20b.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { type RefBar, renderReference } from "../src/study12/reference.js";
import { gradeBars } from "../src/study13/grading13.js";
import { gradeStrict } from "../src/study20/strict20.js";
import { gradeBars21 } from "../src/study21/grading21.js";
import { chartPerBar, expandChords, isDialectBar, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import type { Meter4 } from "../src/study4/synth4.js";
import { strictSame } from "../src/study20/strict20.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const MODEL_JSON = `${root}src/fixture/model.json`;
const WEIGHTS_JSON = `${root}src/fixture/weights.json`;
const CHILD = `${root}scripts/transcribe-child.mjs`;

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

/** Keys the app holds: the chart headers (20b sources) and study13's declared metadata (anchors). */
const study13 = JSON.parse(readFileSync(`${root}results/study13-arm1.json`, "utf8")) as {
	songs: { slug: string; declaredKey: string | null }[];
};
function keyOf(slug: string): string {
	const fromCharts: Record<string, string> = { "peaceful-dreams": "D", "mop-heart": "A" };
	const k = fromCharts[slug] ?? study13.songs.find((s) => s.slug === slug)?.declaredKey;
	if (!k) throw new Error(`no declared key for ${slug}`);
	return k;
}

const study21 = JSON.parse(readFileSync(`${root}results/study21.json`, "utf8")) as {
	songs: Record<string, { perBar: string[] }>;
};

const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];
const dir = mkdtempSync(join(tmpdir(), "stem-bench23-"));
const gateway = createGateway({ apiKey });
const out: Record<string, unknown> = {};
let g1 = true;
let g2misses = 0;
let g3 = true;
let g4count = -1;

for (const chart of songs) {
	console.log(`\n${chart.slug}:`);
	const bars: RefBar[] = [];
	const truth: string[][] = [];
	for (const s of chart.sections)
		for (const chords of s.bars) {
			bars.push({ chords: chords.map((c) => c.replace(/\(.*\)$/, "")), bpm: chart.bpm });
			truth.push(chords);
		}
	const n = truth.length;

	// Bar grid (Study 12) and notes (production transcription path).
	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const ref = renderReference(bars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const barStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));

	// The harmonic evidence, exactly as Studies 13 and 20b: every stem whose label is not drums.
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
	const proc = Bun.spawnSync(["node", CHILD, MODEL_JSON, WEIGHTS_JSON, rawFile], {
		maxBuffer: 256 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) throw new Error(`transcription failed for ${chart.slug}`);
	const rows = JSON.parse(proc.stdout.toString()) as [number, number, number, number][];
	const notes: Note[] = rows.map(([start, duration, pitch, amplitude]) => ({
		start,
		end: start + duration,
		pitch,
		amplitude,
	}));
	console.log(`  ${rows.length} notes transcribed`);

	const hintPerBar = study21.songs[chart.slug]!.perBar;
	if (hintPerBar.length !== n) throw new Error(`hint length ${hintPerBar.length} != ${n}`);
	const song = {
		title: chart.slug.replace(/-/g, " "),
		bpm: chart.bpm,
		key: keyOf(chart.slug),
		meter: chart.meter,
		barNotes: describeBars(notes, barStarts),
		hintPerBar,
	};

	const started = performance.now();
	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23(song),
		temperature: 0,
		maxOutputTokens: 8000,
		maxRetries: 4,
		providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } },
	} as Parameters<typeof generateText>[0]);
	const latencyMs = Math.round(performance.now() - started);
	const json = result.text.match(/\{[\s\S]*\}/)?.[0];
	const parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	if (!parsed?.success) {
		console.log("  NO VALID ANSWER");
		out[chart.slug] = { outcome: "parse-error", text: result.text.slice(0, 2000), latencyMs };
		g1 = false;
		g3 = false;
		continue;
	}
	const answer = parsed.output;

	// The chart channel (primary) and the chords channel, graded alike.
	const chartBars = chartPerBar(answer.chart, { tempo: chart.bpm, meter: chart.meter });
	if (!chartBars) g1 = false;
	if (!chartBars || chartBars.length !== n) g2misses++;
	const hintRoot = rootScore(hintPerBar, truth);
	const channels: Record<string, string[] | null> = {
		chart: chartBars,
		chords: expandChords(answer.chords),
	};
	const graded: Record<string, unknown> = {};
	for (const [name, perBarRaw] of Object.entries(channels)) {
		if (!perBarRaw) {
			graded[name] = null;
			continue;
		}
		const perBar = Array.from({ length: n }, (_, i) => perBarRaw[i] ?? "");
		const roots = rootScore(perBar, truth);
		const dialect = truth
			.map((t, i) => ({ t, a: perBar[i]! }))
			.filter(({ t }) => isDialectBar(t))
			.filter(({ t, a }) => t.some((x) => x !== "" && strictSame(x, a))).length;
		graded[name] = {
			bars: perBarRaw.length,
			roots,
			dialectStrict: dialect,
			strict: gradeStrict(perBar, truth),
			allowance21: gradeBars21(perBar, truth),
			verbatim13: gradeBars(perBar, truth),
		};
	}
	const chartGrade = graded.chart as { roots: { right: number; bearing: number }; dialectStrict: number; bars: number } | null;
	if (chartGrade) {
		if (chartGrade.roots.right / chartGrade.roots.bearing < hintRoot.right / hintRoot.bearing - 0.05)
			g3 = false;
		if (chart.slug === "peaceful-dreams") g4count = chartGrade.dialectStrict;
	} else {
		g3 = false;
		if (chart.slug === "peaceful-dreams") g4count = 0;
	}
	console.log(
		`  chart channel: ${chartGrade ? `${chartGrade.bars} bars, roots ${chartGrade.roots.right}/${chartGrade.roots.bearing} (hint ${hintRoot.right}/${hintRoot.bearing}), dialect strict ${chartGrade.dialectStrict}` : "UNPARSEABLE"} | tokens ${result.totalUsage?.inputTokens ?? 0}/${result.totalUsage?.outputTokens ?? 0} | ${latencyMs}ms`,
	);
	out[chart.slug] = {
		outcome: "answered",
		noteCount: rows.length,
		hintRoot,
		channels: graded,
		answer,
		tokensIn: result.totalUsage?.inputTokens ?? 0,
		tokensOut: result.totalUsage?.outputTokens ?? 0,
		latencyMs,
	};
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(`${root}results/study23.json`, `${JSON.stringify({ version: 1, model: MODEL, songs: out }, null, "\t")}\n`);

console.log(`\nS23-G1 (every chart parses through the production adapter): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S23-G2 (bar count exact on >= 3 of 4): ${g2misses <= 1 ? "PASS" : "FAIL"} (${4 - g2misses}/4 exact)`);
console.log(`S23-G3 (chart roots >= hint roots - 5pp, every song): ${g3 ? "PASS" : "FAIL"}`);
console.log(`S23-G4 (peaceful dialect strict >= 10/62): ${g4count >= 10 ? "PASS" : "FAIL"} (${g4count})`);
