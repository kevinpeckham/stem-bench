/**
 * Study 24 (docs/BRIEF-STUDY24.md): true-tempo estimation. P1/P2 joint
 * combs per song ($0), the in-run uniform ceiling, gate S24-G1 on the
 * fitted grid's shifted index hits, one fable call per song on the
 * P1-fitted grid (arm B3, Study 23b's B1 construction with the fitted
 * period), gate S24-G2 on the JSON chords channel vs the Study 23
 * grid-given baseline. Plus the $0 music-start start-rule variant,
 * reported only.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
import { gradeBars21 } from "../src/study21/grading21.js";
import { fitUniformGrid, uniformGrid } from "../src/study22/grid.js";
import { expandChords, isDialectBar, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { musicStartAnchor } from "../src/study23b/downbeat.js";
import { jointChangeComb, jointOnsetComb, shiftedIndexHits } from "../src/study24/tempo.js";
import { gradeStrict, strictSame } from "../src/study20/strict20.js";
import type { Meter4 } from "../src/study4/synth4.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const MODEL_JSON = `${root}src/fixture/model.json`;
const WEIGHTS_JSON = `${root}src/fixture/weights.json`;
const CHILD = `${root}scripts/transcribe-child.mjs`;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const RATE = 22050;

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

const study13 = JSON.parse(readFileSync(`${root}results/study13-arm1.json`, "utf8")) as {
	songs: { slug: string; declaredKey: string | null }[];
};
function keyOf(slug: string): string {
	const fromCharts: Record<string, string> = { "peaceful-dreams": "D", "mop-heart": "A" };
	const k = fromCharts[slug] ?? study13.songs.find((s) => s.slug === slug)?.declaredKey;
	if (!k) throw new Error(`no declared key for ${slug}`);
	return k;
}

const study23 = JSON.parse(readFileSync(`${root}results/study23.json`, "utf8")) as {
	songs: Record<string, { answer?: { chords: string } }>;
};
const study23b = JSON.parse(readFileSync(`${root}results/study23b.json`, "utf8")) as {
	songs: Record<string, { B1?: { roots?: { right: number; bearing: number } } }>;
};

const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];
const dir = mkdtempSync(join(tmpdir(), "stem-bench24-"));
const gateway = createGateway({ apiKey });
const beatsOf = (meter: string) => (meter === "3/4" ? 3 : 4);
const out: Record<string, unknown> = {};
let g1 = true;
let g2 = true;

for (const chart of songs) {
	console.log(`\n${chart.slug}:`);
	const refBars: RefBar[] = [];
	const truth: string[][] = [];
	for (const s of chart.sections)
		for (const chords of s.bars) {
			refBars.push({ chords: chords.map((c) => c.replace(/\(.*\)$/, "")), bpm: chart.bpm });
			truth.push(chords);
		}
	const n = truth.length;
	const declaredPeriod = (beatsOf(chart.meter) * 60) / chart.bpm;

	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const durationSec = mix.length / RATE;
	const ref = renderReference(refBars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const truthStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const medianBar = (() => {
		const d = truthStarts
			.slice(1)
			.map((t, i) => t - truthStarts[i]!)
			.sort((a, b) => a - b);
		return d[Math.floor(d.length / 2)]!;
	})();
	const tol = 0.15 * medianBar;

	// The in-run uniform ceiling (Study 20b lesson): the least-squares fit
	// to the truth itself, index-paired against the truth.
	const ceilFit = fitUniformGrid(truthStarts);
	const ceilGrid = uniformGrid(ceilFit, n);
	let ceilHits = 0;
	for (let i = 0; i < n; i++) if (Math.abs(ceilGrid[i]! - truthStarts[i]!) <= tol) ceilHits++;

	// Transcription (production path) for bar notes + the music-start variant.
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

	// P1 input: the shipped reader's segment boundaries, grid-free.
	const mixRawPath = `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`;
	const plainFile = join(dir, `${chart.slug}-plain.json`);
	const np0 = Bun.spawnSync([PY, NCHORD, "--raw", mixRawPath, "--out", plainFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np0.exitCode !== 0) throw new Error(`nchord (plain) failed for ${chart.slug}`);
	const plain = JSON.parse(readFileSync(plainFile, "utf8")) as { segments: { start: number }[] };
	const changeTimes = plain.segments.map((s) => s.start).filter((t) => t > 0);

	const p1 = jointChangeComb(changeTimes, declaredPeriod);
	const feat = extractFeatures(asBuffer(mix, RATE));
	const p2 = jointOnsetComb(feat.onset, feat.fps, declaredPeriod);
	const periodErrPct = (p: number) => Math.round((Math.abs(p - ceilFit.period) / ceilFit.period) * 10000) / 100;
	console.log(
		`  changes ${changeTimes.length} | declared ${declaredPeriod.toFixed(4)}s | truth-fit ${ceilFit.period.toFixed(4)}s | P1 ${p1.period.toFixed(4)}s (${periodErrPct(p1.period)}% off fit) | P2 ${p2.period.toFixed(4)}s (${periodErrPct(p2.period)}% off fit) | ceiling ${ceilHits}/${n}`,
	);

	// B3 grid: P1's fit, Study 23b's B1 construction with the fitted period.
	const nB3 = Math.max(1, Math.floor((durationSec - p1.phase) / p1.period));
	const barStarts = Array.from({ length: nB3 }, (_, i) => p1.phase + i * p1.period);
	const b3Geom = shiftedIndexHits(barStarts, truthStarts, tol);
	const geomOk = b3Geom.hits / n >= ceilHits / n - 0.1;
	if (!geomOk) g1 = false;
	console.log(
		`  B3 grid: shifted index-hits ${b3Geom.hits}/${n} at shift ${b3Geom.shift} (mean |err| ${b3Geom.meanAbsMs}ms) vs ceiling ${ceilHits}/${n} -> S24-G1 ${geomOk ? "ok" : "MISS"}`,
	);

	// Reported variant: the music-start start-rule ($0, no model call).
	const ms = musicStartAnchor(notes);
	let variant: Record<string, unknown> | null = null;
	if (ms !== null) {
		const target = ms - 0.25 * p1.period;
		const k = Math.ceil((target - p1.phase) / p1.period);
		const vStart = p1.phase + k * p1.period;
		const nV = Math.max(1, Math.floor((durationSec - vStart) / p1.period));
		const vGrid = Array.from({ length: nV }, (_, i) => vStart + i * p1.period);
		let vHits = 0;
		for (let i = 0; i < n; i++) {
			const g = vGrid[i];
			if (g !== undefined && Math.abs(g - truthStarts[i]!) <= tol) vHits++;
		}
		variant = { musicStart: Math.round(ms * 100) / 100, firstBar: Math.round(vStart * 100) / 100, unshiftedIndexHits: vHits, of: n };
	}

	// Baseline: Study 23's grid-given JSON channel, regraded here.
	const baseAnswer = study23.songs[chart.slug]?.answer?.chords;
	if (!baseAnswer) throw new Error(`no Study 23 baseline answer for ${chart.slug}`);
	const basePerBar = expandChords(baseAnswer);
	const baseline = rootScore(
		Array.from({ length: n }, (_, i) => basePerBar[i] ?? ""),
		truth,
	);
	const baselinePct = baseline.right / baseline.bearing;

	// Hints: the shipped reader over the B3 grid.
	const barsFile = join(dir, `${chart.slug}-b3-bars.json`);
	const nchordFile = join(dir, `${chart.slug}-b3-nchord.json`);
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", mixRawPath, "--out", nchordFile, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord (bars) failed for ${chart.slug}`);
	const nchordOut = JSON.parse(readFileSync(nchordFile, "utf8")) as { perBar: string[] };
	const hintPerBar = nchordOut.perBar.map((c) => (c === "" ? "N.C." : c));

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
	let b3: Record<string, unknown>;
	let b3Pct = 0;
	if (!parsed?.success) {
		b3 = { outcome: "parse-error", barsOffered: nB3, text: result.text.slice(0, 1500) };
		console.log(`  B3: NO VALID ANSWER (${nB3} bars offered)`);
	} else {
		const expandedRaw = expandChords(parsed.output.chords);
		const perBar = Array.from({ length: n }, (_, i) => expandedRaw[i] ?? "");
		const roots = rootScore(perBar, truth);
		const dialect = truth
			.map((t, i) => ({ t, a: perBar[i]! }))
			.filter(({ t }) => isDialectBar(t))
			.filter(({ t, a }) => t.some((x) => x !== "" && strictSame(x, a))).length;
		b3Pct = roots.right / roots.bearing;
		b3 = {
			outcome: "answered",
			barsOffered: nB3,
			barsAnswered: expandedRaw.length,
			roots,
			dialectStrict: dialect,
			strict: gradeStrict(perBar, truth),
			allowance21: gradeBars21(perBar, truth),
			answer: parsed.output,
			tokensIn: result.totalUsage?.inputTokens ?? 0,
			tokensOut: result.totalUsage?.outputTokens ?? 0,
			latencyMs,
		};
		const b1Roots = study23b.songs[chart.slug]?.B1?.roots;
		console.log(
			`  B3 (${nB3} bars offered, ${expandedRaw.length} answered): roots ${roots.right}/${roots.bearing} (baseline ${baseline.right}/${baseline.bearing}, 23b B1 ${b1Roots?.right}/${b1Roots?.bearing}) | dialect ${dialect}`,
		);
	}
	if (b3Pct < baselinePct - 0.05) g2 = false;

	out[chart.slug] = {
		declared: { bpm: chart.bpm, meter: chart.meter, period: declaredPeriod },
		bars: n,
		changeTimes: changeTimes.length,
		truthFit: { period: ceilFit.period, phase: ceilFit.phase, indexHits: ceilHits, of: n, tolMs: Math.round(tol * 1000) },
		p1: { ...p1, periodErrPct: periodErrPct(p1.period) },
		p2: { ...p2, periodErrPct: periodErrPct(p2.period) },
		b3Grid: b3Geom,
		musicStartVariant: variant,
		baseline,
		B3: b3,
	};
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(`${root}results/study24.json`, `${JSON.stringify({ version: 1, model: MODEL, songs: out }, null, "\t")}\n`);
console.log(`\nS24-G1 (fitted grid within 10pp of the in-run uniform ceiling, shifted pairing, every song): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S24-G2 (B3 roots within 5pp of the grid-given baseline, every song): ${g2 ? "PASS" : "FAIL"}`);
