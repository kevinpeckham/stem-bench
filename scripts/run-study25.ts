/**
 * Study 25 (docs/BRIEF-STUDY25.md): the corrected end-to-end. Grid =
 * declared period (exact, per the 2026-11-07 correction) anchored at
 * the in-run best-shift chart bar one (oracle construction). One fable
 * call per song (arm B4), gates S25-G1 (three matched songs vs the
 * grid-given baseline) and S25-G2 (eat's playable prefix), plus the
 * corrected anchor shootout, reported only.
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
import { phaseFromOnset } from "../src/study22/grid.js";
import { expandChords, isDialectBar, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import {
	anchorError,
	bassCombAnchor,
	changeCombAnchor,
	musicStartAnchor,
} from "../src/study23b/downbeat.js";
import { bestShiftAnchor } from "../src/study25/anchor.js";
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
const MATCHED = new Set(["letter-lands", "peaceful-dreams", "mop-heart"]);

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

const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];
const dir = mkdtempSync(join(tmpdir(), "stem-bench25-"));
const gateway = createGateway({ apiKey });
const beatsOf = (meter: string) => (meter === "3/4" ? 3 : 4);
const out: Record<string, unknown> = {};
let g1 = true;
let g2 = true;

function runNchord(mixRawPath: string, slug: string, tag: string, barStarts: number[]): string[] {
	const barsFile = join(dir, `${slug}-${tag}-bars.json`);
	const outFile = join(dir, `${slug}-${tag}-nchord.json`);
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", mixRawPath, "--out", outFile, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord (${tag}) failed for ${slug}`);
	return (JSON.parse(readFileSync(outFile, "utf8")) as { perBar: string[] }).perBar;
}

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
	const period = (beatsOf(chart.meter) * 60) / chart.bpm;

	const mixRawPath = `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`;
	const mix = loadRaw(mixRawPath);
	const durationSec = mix.length / RATE;

	// Anchor derivation: DTW start seeds the uniform grid; the best
	// whole-bar shift against the chart's hints resolves bar one.
	const ref = renderReference(refBars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const dtwStart = aligned.mapSeconds(ref.barStarts[0]!);
	const nU = Math.max(1, Math.floor((durationSec - dtwStart) / period));
	const uniformStarts = Array.from({ length: nU }, (_, i) => dtwStart + i * period);
	const hintsU = runNchord(mixRawPath, chart.slug, "uniform", uniformStarts);
	const fit = bestShiftAnchor(hintsU, truth, dtwStart, period);
	console.log(
		`  declared period ${period.toFixed(4)}s | dtw start ${dtwStart.toFixed(2)}s | anchor ${fit.anchor.toFixed(3)}s (shift ${fit.shift}, hint roots ${fit.right}/${fit.bearing})`,
	);

	// B4 grid: n chart bars from the anchor, bar 0 clamped to t >= 0.
	const barStarts = Array.from({ length: n }, (_, i) => fit.anchor + i * period);
	barStarts[0] = Math.max(0, barStarts[0]!);
	const playable = Math.max(1, Math.floor((durationSec - fit.anchor) / period));

	// Production transcription for bar notes + the shootout's note-based estimators.
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

	// Side measurement: the corrected anchor shootout (reported only).
	const feat = extractFeatures(asBuffer(mix, RATE));
	const plainFile = join(dir, `${chart.slug}-plain.json`);
	const np0 = Bun.spawnSync([PY, NCHORD, "--raw", mixRawPath, "--out", plainFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np0.exitCode !== 0) throw new Error(`nchord (plain) failed for ${chart.slug}`);
	const plain = JSON.parse(readFileSync(plainFile, "utf8")) as { segments: { start: number }[] };
	const changeTimes = plain.segments.map((s) => s.start).filter((t) => t > 0);
	const e1 = phaseFromOnset(feat.onset, feat.fps, period);
	const e2 = bassCombAnchor(notes, period, durationSec);
	const e3 = changeCombAnchor(changeTimes, period);
	const e4 = musicStartAnchor(notes);
	const circMs = (est: number) => Math.round(anchorError(est, fit.anchor, period) * 1000);
	const shootout = {
		e1: { phase: e1, circularMs: circMs(e1) },
		e2: { phase: e2, circularMs: circMs(e2) },
		e3: { phase: e3, circularMs: circMs(e3) },
		e4:
			e4 === null
				? null
				: { start: e4, circularMs: circMs(e4), barOneErrSec: Math.round(Math.abs(e4 - fit.anchor) * 100) / 100 },
	};
	console.log(
		`  shootout vs true anchor: E1 ${circMs(e1)}ms E2 ${circMs(e2)}ms E3 ${circMs(e3)}ms | E4 bar-one |err| ${shootout.e4 ? shootout.e4.barOneErrSec : "n/a"}s`,
	);

	// Baseline: Study 23's grid-given JSON channel, regraded here.
	const baseAnswer = study23.songs[chart.slug]?.answer?.chords;
	if (!baseAnswer) throw new Error(`no Study 23 baseline answer for ${chart.slug}`);
	const basePerBar = expandChords(baseAnswer);
	const basePadded = Array.from({ length: n }, (_, i) => basePerBar[i] ?? "");
	const baseline = rootScore(basePadded, truth);

	// B4 inputs and the one fable call.
	const hintsRaw = runNchord(mixRawPath, chart.slug, "b4", barStarts);
	const hintPerBar = hintsRaw.map((c) => (c === "" ? "N.C." : c));
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
	let b4: Record<string, unknown>;
	if (!parsed?.success) {
		b4 = { outcome: "parse-error", barsOffered: n, text: result.text.slice(0, 1500) };
		console.log(`  B4: NO VALID ANSWER (${n} bars offered)`);
		if (MATCHED.has(chart.slug)) g1 = false;
		else g2 = false;
	} else {
		const expandedRaw = expandChords(parsed.output.chords);
		const perBar = Array.from({ length: n }, (_, i) => expandedRaw[i] ?? "");
		const roots = rootScore(perBar, truth);
		const dialect = truth
			.map((t, i) => ({ t, a: perBar[i]! }))
			.filter(({ t }) => isDialectBar(t))
			.filter(({ t, a }) => t.some((x) => x !== "" && strictSame(x, a))).length;
		b4 = {
			outcome: "answered",
			barsOffered: n,
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
		if (MATCHED.has(chart.slug)) {
			const ok = roots.right / roots.bearing >= baseline.right / baseline.bearing - 0.05;
			if (!ok) g1 = false;
			console.log(
				`  B4 (${n} bars): roots ${roots.right}/${roots.bearing} vs baseline ${baseline.right}/${baseline.bearing} -> S25-G1 ${ok ? "ok" : "MISS"} | dialect ${dialect}`,
			);
		} else {
			const pfx = Math.min(n, playable);
			const prefixRoots = rootScore(perBar.slice(0, pfx), truth.slice(0, pfx));
			const prefixBase = rootScore(basePadded.slice(0, pfx), truth.slice(0, pfx));
			const ok =
				prefixRoots.right / prefixRoots.bearing >= prefixBase.right / prefixBase.bearing - 0.05;
			if (!ok) g2 = false;
			b4 = { ...b4, playable, prefixRoots, prefixBaseline: prefixBase };
			console.log(
				`  B4 (${n} bars, ${playable} playable): roots ${roots.right}/${roots.bearing} (full baseline ${baseline.right}/${baseline.bearing}) | prefix ${prefixRoots.right}/${prefixRoots.bearing} vs prefix baseline ${prefixBase.right}/${prefixBase.bearing} -> S25-G2 ${ok ? "ok" : "MISS"} | dialect ${dialect}`,
			);
		}
	}

	out[chart.slug] = {
		declared: { bpm: chart.bpm, meter: chart.meter, period },
		bars: n,
		durationSec: Math.round(durationSec * 10) / 10,
		dtwStart: Math.round(dtwStart * 1000) / 1000,
		anchor: { time: Math.round(fit.anchor * 1000) / 1000, shift: fit.shift, hintRoots: { right: fit.right, bearing: fit.bearing } },
		playable,
		shootout,
		baseline,
		B4: b4,
	};
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(`${root}results/study25.json`, `${JSON.stringify({ version: 1, model: MODEL, songs: out }, null, "\t")}\n`);
console.log(
	`\nS25-G1 (B4 roots within 5pp of the grid-given baseline on the three matched songs): ${g1 ? "PASS" : "FAIL"}`,
);
console.log(`S25-G2 (eat's playable-prefix roots within 5pp of the prefix baseline): ${g2 ? "PASS" : "FAIL"}`);
