/**
 * Study 23b (docs/BRIEF-STUDY23B.md): does the draft survive a
 * chartless-song grid? Arms B2 (tap: true first downbeat, declared
 * period) and B1 (blind: onset-comb phase), everything downstream of
 * each arm's own grid; gates on the JSON chords channel against the
 * Study 23 grid-given baselines recomputed in-run. Plus the $0 downbeat
 * shootout (E1 onset comb, E2 bass comb, E3 chord-change comb, E4
 * music-start anchor) graded by circular anchor error.
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
import { gradeStrict, strictSame } from "../src/study20/strict20.js";
import type { Meter4 } from "../src/study4/synth4.js";
import { analyse, extractFeatures } from "../src/study9/analysis.js";
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

// The Study 23 grid-given baselines, recomputed in-run by the same functions.
const study23 = JSON.parse(readFileSync(`${root}results/study23.json`, "utf8")) as {
	songs: Record<string, { answer?: { chords: string } }>;
};

const songs = [...(mmkkCharts.songs as ChartSong[]), ...(charts20b.songs as ChartSong[])];
const dir = mkdtempSync(join(tmpdir(), "stem-bench23b-"));
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
	const period = (beatsOf(chart.meter) * 60) / chart.bpm;

	const mix = loadRaw(`${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`);
	const durationSec = mix.length / RATE;
	const ref = renderReference(refBars, chart.meter as Meter4);
	const rec = chromagram(mix);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, {
		subsequence: true,
	});
	const truthStarts = ref.barStarts.map((s) => aligned.mapSeconds(s));
	const truthStart = truthStarts[0]!;

	// Transcription: the production path (harmonic stems, Basic Pitch child).
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
	console.log(`  ${rows.length} notes | truth starts ${truthStart.toFixed(2)}s | declared period ${period.toFixed(3)}s`);

	const feat = extractFeatures(asBuffer(mix, RATE));
	const combPhase = phaseFromOnset(feat.onset, feat.fps, period);

	// Baseline: Study 23's grid-given JSON channel, regraded here.
	const baseAnswer = study23.songs[chart.slug]?.answer?.chords;
	if (!baseAnswer) throw new Error(`no Study 23 baseline answer for ${chart.slug}`);
	const basePerBar = expandChords(baseAnswer);
	const baseline = rootScore(
		Array.from({ length: n }, (_, i) => basePerBar[i] ?? ""),
		truth,
	);
	const baselinePct = baseline.right / baseline.bearing;

	const arms: Record<string, { phase: number }> = {
		B2: { phase: truthStart },
		B1: { phase: combPhase },
	};
	const armOut: Record<string, unknown> = {};
	const armPct: Record<string, number> = {};
	for (const [name, arm] of Object.entries(arms)) {
		const nArm = Math.max(1, Math.floor((durationSec - arm.phase) / period));
		const barStarts = Array.from({ length: nArm }, (_, i) => arm.phase + i * period);

		// Hints: the shipped reader over this arm's grid.
		const barsFile = join(dir, `${chart.slug}-${name}-bars.json`);
		const nchordFile = join(dir, `${chart.slug}-${name}-nchord.json`);
		writeFileSync(barsFile, JSON.stringify({ barStarts }));
		const mixRawPath = `${root}corpus-mmkk/${chart.slug}/mix.mp3.22050.f32le.raw`;
		const np = Bun.spawnSync([PY, NCHORD, "--raw", mixRawPath, "--out", nchordFile, "--bars", barsFile], {
			maxBuffer: 64 * 1024 * 1024,
		});
		if (np.exitCode !== 0) throw new Error(`nchord failed for ${chart.slug} ${name}`);
		const nchordOut = JSON.parse(readFileSync(nchordFile, "utf8")) as {
			perBar: string[];
			segments: { start: number }[];
		};
		const hintPerBar = nchordOut.perBar.map((c) => (c === "" ? "N.C." : c));
		if (name === "B2") {
			// The shootout rides the first nchord run's segments (grid-independent).
			const changeTimes = nchordOut.segments.map((s) => s.start).filter((t) => t > 0);
			const tol = 0.15 * period;
			const e1 = combPhase;
			const e2 = bassCombAnchor(notes, period, durationSec);
			const e3 = changeCombAnchor(changeTimes, period);
			const e4 = musicStartAnchor(notes);
			const grade = (anchor: number | null) =>
				anchor === null
					? { anchor: null, errorMs: null, hit: false }
					: {
							anchor: Math.round(anchor * 100) / 100,
							errorMs: Math.round(anchorError(anchor, truthStart, period) * 1000),
							hit: anchorError(anchor, truthStart, period) <= tol,
						};
			const shootout = { tolMs: Math.round(tol * 1000), e1: grade(e1), e2: grade(e2), e3: grade(e3), e4: grade(e4), e4RawOffsetSec: e4 === null ? null : Math.round((e4 - truthStart) * 100) / 100 };
			armOut.shootout = shootout;
			console.log(
				`  shootout (tol ±${shootout.tolMs}ms): E1 onset ${shootout.e1.errorMs}ms${shootout.e1.hit ? " HIT" : ""} | E2 bass ${shootout.e2.errorMs}ms${shootout.e2.hit ? " HIT" : ""} | E3 changes ${shootout.e3.errorMs}ms${shootout.e3.hit ? " HIT" : ""} | E4 start ${shootout.e4.errorMs}ms${shootout.e4.hit ? " HIT" : ""} (raw offset ${shootout.e4RawOffsetSec}s)`,
			);
		}

		// Mechanical grid anatomy: this grid against the aligned truth, index-paired.
		const tol = 0.15 * period;
		let gridHits = 0;
		let gridErr = 0;
		for (let i = 0; i < n; i++) {
			const err = Math.abs((barStarts[i] ?? Number.POSITIVE_INFINITY) - truthStarts[i]!);
			if (Number.isFinite(err)) gridErr += err;
			if (err <= tol) gridHits++;
		}

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
			armOut[name] = { outcome: "parse-error", bars: nArm, text: result.text.slice(0, 1500) };
			armPct[name] = 0;
			console.log(`  ${name}: NO VALID ANSWER (${nArm} bars offered)`);
			continue;
		}
		const expandedRaw = expandChords(parsed.output.chords);
		const perBar = Array.from({ length: n }, (_, i) => expandedRaw[i] ?? "");
		const roots = rootScore(perBar, truth);
		const dialect = truth
			.map((t, i) => ({ t, a: perBar[i]! }))
			.filter(({ t }) => isDialectBar(t))
			.filter(({ t, a }) => t.some((x) => x !== "" && strictSame(x, a))).length;
		armPct[name] = roots.right / roots.bearing;
		armOut[name] = {
			outcome: "answered",
			phase: Math.round(arm.phase * 100) / 100,
			barsOffered: nArm,
			barsAnswered: expandedRaw.length,
			grid: { indexHits: gridHits, of: n, meanAbsMs: Math.round((gridErr / n) * 1000) },
			roots,
			dialectStrict: dialect,
			strict: gradeStrict(perBar, truth),
			allowance21: gradeBars21(perBar, truth),
			answer: parsed.output,
			tokensIn: result.totalUsage?.inputTokens ?? 0,
			tokensOut: result.totalUsage?.outputTokens ?? 0,
			latencyMs,
		};
		console.log(
			`  ${name} (phase ${arm.phase.toFixed(2)}s, ${nArm} bars offered, ${expandedRaw.length} answered): roots ${roots.right}/${roots.bearing} (baseline ${baseline.right}/${baseline.bearing}) | grid index-hits ${gridHits}/${n}, mean |err| ${Math.round((gridErr / n) * 1000)}ms | dialect ${dialect}`,
		);
	}
	if ((armPct.B2 ?? 0) < baselinePct - 0.05) g1 = false;
	if ((armPct.B1 ?? 0) < (armPct.B2 ?? 0) - 0.05) g2 = false;
	out[chart.slug] = { declared: { bpm: chart.bpm, meter: chart.meter, period }, bars: n, truthStart: Math.round(truthStart * 100) / 100, baseline, ...armOut };
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(`${root}results/study23b.json`, `${JSON.stringify({ version: 1, model: MODEL, songs: out }, null, "\t")}\n`);
console.log(`\nS23B-G1 (tap arm within 5pp of grid-given baseline, every song): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S23B-G2 (blind arm within 5pp of tap arm, every song): ${g2 ? "PASS" : "FAIL"}`);
