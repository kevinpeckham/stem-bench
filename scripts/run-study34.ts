/**
 * Study 34 (docs/BRIEF-STUDY34.md): breadth of the chartless draft
 * outside MMKK. One run, 12 recordings, the Study 33 shared pipeline
 * on the mono downmix. Fence $5.00 with the registered kill rule: if
 * the first two drafts together exceed $0.80, stop, commit partials,
 * disclose. Grading per truth tier; results committed raw to
 * results/study34.json.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import eatV131 from "../corpus/mmkk-charts-eat-v131.json";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { chromagram } from "../src/study12/chroma.js";
import { barmarkChartBars } from "../src/study16/barmarkChartBars.js";
import { expandChords, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { classOf, mod, w1TimeZero, w4Harmonic, w7Section, weightedVote } from "../src/study31/witnesses.js";
import { applyRatioRule } from "../src/study32/corpus32.js";
import { peakNorm } from "../src/study33/stereo.js";
import {
	familyOf,
	pairBarsByTime,
	qualityScore,
	rootOf,
	sectionScore,
	sequenceScore,
	sequenceScoreIntervals,
	slashScore,
} from "../src/study34/grade34.js";
import { calibrateKeyGlobal } from "../src/study34/seqalign.js";
import { analyse, extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench34-"));
// fable-5-1 gateway pricing per 1M tokens
const USD_IN = 2;
const USD_OUT = 15;

function readEnvLocal(): string | null {
	try {
		const m = readFileSync(`${root}.env.local`, "utf8").match(/AI_GATEWAY_API_KEY\s*=\s*"?([^"\n]+)/);
		return m?.[1]?.trim() ?? null;
	} catch {
		return null;
	}
}

function loadRaw(path: string): Float32Array {
	const buf = readFileSync(path);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function transcribe(samples: Float32Array, name: string): Note[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const proc = Bun.spawnSync(
		["node", `${root}scripts/transcribe-child.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, rawFile],
		{ maxBuffer: 256 * 1024 * 1024 },
	);
	if (proc.exitCode !== 0) throw new Error(`transcription failed (${name}): ${proc.stderr.toString().slice(0, 400)}`);
	return (JSON.parse(proc.stdout.toString()) as [number, number, number, number][]).map(
		([start, duration, pitch, amplitude]) => ({ start, end: start + duration, pitch, amplitude }),
	);
}

function nchordPerBar(samples: Float32Array, barStarts: number[], name: string): string[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const barsFile = `${rawFile}.bars.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], {
		maxBuffer: 64 * 1024 * 1024,
	});
	if (np.exitCode !== 0) throw new Error(`nchord failed (${name})`);
	return (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
}

/** The shipped grid, vote and placement on the mono mix (run-study33 verbatim). */
function placeGrid(mono: Float32Array, beats: number, beatSec: number, slug: string) {
	const feat = extractFeatures(asBuffer(mono, RATE), UNCAPPED);
	const declared = beats * beatSec;
	const grid = chartlessGrid(feat.onset, feat.fps, declared, mono, RATE);
	const span = audibleSpan(mono, RATE);
	const beat = grid.period / beats;
	const w1lead = w1TimeZero(grid.anchor + LEAD, beat, beats);
	const nBeats = grid.n * beats;
	const beatStarts = Array.from({ length: nBeats }, (_, j) => grid.anchor + j * beat);
	const labels = nchordPerBar(mono, beatStarts, `${slug}-beats`);
	const w4ship = applyRatioRule(w4Harmonic(labels, beats));
	const ch = chromagram(mono);
	const j0 = Math.max(0, Math.ceil((0 - grid.anchor) / beat));
	const beatChroma: Float32Array[] = [];
	for (let j = j0; j < nBeats; j++) {
		const f0 = Math.max(0, Math.floor((grid.anchor + j * beat) / ch.hopSec));
		const f1 = Math.min(ch.frames.length, Math.floor((grid.anchor + (j + 1) * beat) / ch.hopSec));
		const acc = new Float32Array(12);
		for (let f = f0; f < f1; f++) for (let k = 0; k < 12; k++) acc[k]! += ch.frames[f]![k]!;
		let norm = 0;
		for (let k = 0; k < 12; k++) norm += acc[k]! * acc[k]!;
		norm = Math.sqrt(norm) || 1;
		for (let k = 0; k < 12; k++) acc[k]! /= norm;
		beatChroma.push(acc);
	}
	const raw7 = w7Section(beatChroma, beats);
	const w7 = raw7.cls === null ? raw7 : { cls: mod(raw7.cls + j0, beats), detail: raw7.detail };
	const ship = weightedVote(
		[
			{ cls: w1lead.cls, weight: 2 },
			{ cls: w4ship.cls, weight: 2 },
			{ cls: w7.cls, weight: 1 },
		],
		beats,
	);
	const cls = ship.undecided ? 0 : ship.decided;
	let anchor = grid.anchor + cls * beat;
	while (anchor > span.first + 0.25 * beat) anchor -= grid.period;
	if (anchor < span.first - grid.period) anchor += grid.period;
	const barStarts = Array.from({ length: grid.n }, (_, i) => anchor + i * grid.period);
	return { grid, beat, cls, anchor, barStarts, truthCls: classOf(0, grid.anchor, beat, beats) };
}

interface Truth {
	tier: number | "class-only";
	sections?: Record<string, string[]> | { name: string; bar: number }[];
	bars?: string[][];
	barsAligned?: { start: number; chords: string[] }[];
	transposition?: { value: number | null };
	expected?: { meter?: string; key?: string };
	metre?: string;
}

interface Slot {
	slug: string;
	raw: string;
	declared: { bpm: number; meter: string; key: string } | "dsp";
	tier: 1 | 2 | 3 | 0; // 0 = class-only
	control?: boolean;
	truthFile?: string;
}

const SLOTS: Slot[] = [
	{ slug: "eat-control", raw: "corpus-mmkk/eat-all-the-clocks/mix.mp3.22050.f32le.raw", declared: { bpm: 120, meter: "4/4", key: "Em" }, tier: 1, control: true },
	{ slug: "interbellum", raw: "corpus-mmkk/interbellum/mix.mp3.22050.f32le.raw", declared: { bpm: 115, meter: "4/4", key: "C" }, tier: 1 },
	{ slug: "dippermouth-blues", raw: "corpus-study34/dippermouth-blues.mp3.22050.f32le.raw", declared: "dsp", tier: 1, truthFile: "dippermouth-blues" },
	{ slug: "st-louis-blues", raw: "corpus-study34/st-louis-blues.mp3.22050.f32le.raw", declared: "dsp", tier: 1, truthFile: "st-louis-blues" },
	{ slug: "livery-stable-blues", raw: "corpus-study34/livery-stable-blues.mp3.22050.f32le.raw", declared: "dsp", tier: 1, truthFile: "livery-stable-blues" },
	{ slug: "roll-called-up-yonder", raw: "corpus-study34/roll-called-up-yonder.mp3.22050.f32le.raw", declared: "dsp", tier: 2, truthFile: "roll-called-up-yonder" },
	{ slug: "three-oclock-waltz", raw: "corpus-study34/three-oclock-waltz.mp3.22050.f32le.raw", declared: "dsp", tier: 2, truthFile: "three-oclock-waltz" },
	{ slug: "jw-let-it-in", raw: "corpus-study34/jw-let-it-in.mp3.22050.f32le.raw", declared: "dsp", tier: 3, truthFile: "jw-let-it-in" },
	{ slug: "jw-same-boat", raw: "corpus-study34/jw-same-boat.mp3.22050.f32le.raw", declared: "dsp", tier: 3, truthFile: "jw-same-boat" },
	{ slug: "kitten-on-the-keys", raw: "corpus-study34/kitten-on-the-keys.flac.22050.f32le.raw", declared: "dsp", tier: 0, truthFile: "kitten-on-the-keys" },
	{ slug: "sp-today-live", raw: "corpus-study34/sp-today-live.mp3.22050.f32le.raw", declared: "dsp", tier: 0, truthFile: "sp-today-live" },
	{ slug: "irish-jigs-medley", raw: "corpus-study34/irish-jigs-medley.mp3.22050.f32le.raw", declared: "dsp", tier: 0, truthFile: "irish-jigs-medley" },
];

const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });
let tokensIn = 0;
let tokensOut = 0;
const spent = () => (tokensIn * USD_IN + tokensOut * USD_OUT) / 1e6;

const results: Record<string, unknown> = {};
let draftsDone = 0;

for (const slot of SLOTS) {
	const mono = peakNorm(loadRaw(`${root}${slot.raw}`));
	const truth: Truth | null = slot.truthFile
		? (JSON.parse(readFileSync(`${root}corpus/study34-truth/${slot.truthFile}.truth.json`, "utf8")) as Truth)
		: null;

	// declared inputs: page for the Badverbs slots, production DSP otherwise
	let declared: { bpm: number; meter: string; key: string };
	if (slot.declared === "dsp") {
		const det = analyse(extractFeatures(asBuffer(mono, RATE)));
		declared = { bpm: det.tempo.bpm, meter: det.meter.value, key: det.key.value };
	} else {
		declared = slot.declared;
	}
	const beats = declared.meter === "3/4" ? 3 : 4;
	const beatSec = 60 / declared.bpm;
	console.log(`\n[${slot.slug}] declared ${declared.bpm.toFixed(1)} bpm ${declared.meter} ${declared.key}${slot.declared === "dsp" ? " (dsp)" : " (page)"}`);

	const placed = placeGrid(mono, beats, beatSec, slot.slug);
	console.log(`[${slot.slug}] grid period ${placed.grid.period.toFixed(3)}s n ${placed.grid.n} | bar one ${placed.anchor.toFixed(3)}s`);
	const hints = nchordPerBar(mono, placed.barStarts, `${slot.slug}-bars`).map((c) => (c === "" ? "N.C." : c));
	const notes = transcribe(mono, slot.slug);
	console.log(`[${slot.slug}] ${notes.length} transcribed notes`);

	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: slot.slug.replace(/-/g, " "),
			bpm: declared.bpm,
			key: declared.key,
			meter: declared.meter,
			barNotes: describeBars(notes, placed.barStarts),
			hintPerBar: hints,
		}),
		temperature: 0,
		maxOutputTokens: 8000,
		maxRetries: 4,
		providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } },
	} as Parameters<typeof generateText>[0]);
	tokensIn += result.totalUsage?.inputTokens ?? 0;
	tokensOut += result.totalUsage?.outputTokens ?? 0;
	draftsDone++;
	console.log(`[${slot.slug}] draft done | running spend $${spent().toFixed(3)}`);
	// registered kill rule
	if (draftsDone === 2 && spent() > 0.8) {
		writeFileSync(`${root}results/study34.json`, `${JSON.stringify({ aborted: "kill rule", results, tokensIn, tokensOut, spend: spent() }, null, "\t")}\n`);
		throw new Error(`KILL RULE: first two drafts spent $${spent().toFixed(2)} > $0.80 — stopping per registration`);
	}

	const json = result.text.match(/\{[\s\S]*\}/)?.[0];
	let parsed: v.SafeParseResult<typeof ChartDraftAnswerSchema> | null = null;
	try {
		parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	} catch {
		parsed = null;
	}
	if (!parsed?.success) {
		console.log(`[${slot.slug}] REFUSED / no valid answer`);
		results[slot.slug] = {
			class: "refused",
			declared,
			placed: { n: placed.grid.n, anchor: placed.anchor },
			noteCount: notes.length,
			rawDraft: result.text,
		};
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const draftSections = parsed.output.sections.map((s) => ({ name: s.name, bar: s.bar - 1 }));
	// The app's two verdict inputs (app brief, "two more columns per song",
	// 2026-11-09): the draft step's bar count against the grid's, and the
	// share of bars with no named chord. Raw draft text kept so any later
	// column can be computed without re-spending. NOTE: the first Study 34
	// run predates these fields; its results file lacks rawDraft and
	// unknownShare, disclosed in the report.
	const unknownShare =
		expanded.length > 0 ? expanded.filter((c) => c === "?" || c === "N.C." || c === "").length / expanded.length : null;
	const record: Record<string, unknown> = {
		declared,
		placed: { n: placed.grid.n, anchor: placed.anchor, cls: placed.cls },
		noteCount: notes.length,
		draftBars: expanded.length,
		barCountChanged: expanded.length !== placed.grid.n,
		unknownShare,
		draftSections,
		rawDraft: result.text,
	};

	if (slot.tier === 1) {
		// time truth: JAAH barsAligned, or the band chart on its registered grid
		let truthBars: { start: number; chords: string[] }[];
		let truthSectionBars: number[] = [];
		if (truth?.barsAligned) {
			truthBars = truth.barsAligned;
			truthSectionBars = (truth.sections as { name: string; bar: number }[]).map((s) => s.bar);
		} else {
			const isEat = slot.slug === "eat-control";
			const chartBars: string[][] = [];
			if (isEat) {
				const chart = (eatV131.songs as { sections: { bars: string[][] }[] }[])[0]!;
				for (const s of chart.sections) for (const b of s.bars) chartBars.push(b);
			} else {
				const read = barmarkChartBars(readFileSync(`${root}corpus/badverbs-charts/interbellum.chart.md`, "utf8"), {
					tempo: 115,
					meter: "4/4",
				});
				if (!read) throw new Error("interbellum chart refused");
				for (const b of read.bars) chartBars.push(b.chords);
			}
			const anchor0 = isEat ? -0.085 : 0;
			const period = (60 / (isEat ? 120 : 115)) * 4;
			truthBars = chartBars.map((chords, i) => ({ start: anchor0 + i * period, chords }));
		}
		const { answers, truth: truthPaired } = pairBarsByTime(placed.barStarts, expanded, truthBars);
		const roots = rootScore(answers, truthPaired);
		const quals = qualityScore(answers, truthPaired);
		const slash = slashScore(answers, truthPaired);
		const barCountOff = Math.abs(placed.grid.n - truthBars.length);
		const sections = truthSectionBars.length > 0 ? sectionScore(truthSectionBars.map((b) => Math.round((truthBars[b]!.start - placed.anchor) / placed.grid.period)), draftSections.map((s) => s.bar)) : null;
		const barOneErr = Math.abs(placed.anchor - truthBars[0]!.start);
		Object.assign(record, { roots, quals, slash, barCountOff, sections, barOneErr, truthBarCount: truthBars.length });
	} else if (slot.tier === 2) {
		const truthBars = truth!.bars!;
		const n = Math.min(expanded.length, truthBars.length);
		const answers = expanded.slice(0, n);
		const tslice = truthBars.slice(0, n);
		const roots = rootScore(answers, tslice);
		const quals = qualityScore(answers, tslice);
		const barCountOff = Math.abs(placed.grid.n - truthBars.length);
		Object.assign(record, { roots, quals, barCountOff, truthBarCount: truthBars.length });
	} else if (slot.tier === 3) {
		const published = Object.values(truth!.sections as Record<string, string[]>).flat();
		const invariant = truth?.transposition?.value === null;
		const roots = invariant ? sequenceScoreIntervals(expanded, published) : sequenceScore(expanded, published, rootOf);
		const quals = sequenceScore(expanded, published, familyOf);
		Object.assign(record, { roots, quals, sequenceInvariant: invariant, publishedLen: published.length });
	} else {
		// class-only: meter plausibility + gated key calibration vs expected
		const expected = truth?.expected ?? {};
		const { frames } = chromagram(mono);
		const key = expected.key ? calibrateKeyGlobal([expected.key], frames) : null;
		Object.assign(record, {
			meterDeclared: declared.meter,
			meterExpected: expected.meter ?? null,
			keyExpected: expected.key ?? null,
			keyCheck: key ? { transpose: key.transpose, margin: key.score - key.runnerUp } : null,
		});
	}

	// class per the registered wording
	const r = record.roots as { right: number; bearing: number } | undefined;
	const rootPct = r && r.bearing > 0 ? r.right / r.bearing : null;
	const q = record.quals as { right: number; bearing: number } | undefined;
	const qualPct = q && q.bearing > 0 ? q.right / q.bearing : null;
	const barOff = (record.barCountOff as number | undefined) ?? 0;
	let cls = "saved";
	if (slot.tier !== 0 && rootPct !== null) {
		const wrong = rootPct < 0.8 || (slot.tier !== 3 && barOff > 1);
		const good = rootPct >= 0.9 && (qualPct ?? 0) >= 0.8 && (slot.tier === 3 || barOff <= 1);
		cls = wrong ? "confidently-wrong" : good ? "good" : "saved-below-threshold";
	}
	record.class = cls;
	results[slot.slug] = record;
	console.log(
		`[${slot.slug}] tier ${slot.tier || "class-only"}: roots ${r ? `${r.right}/${r.bearing}` : "-"} quals ${q ? `${q.right}/${q.bearing}` : "-"} barOff ${record.barCountOff ?? "-"} -> ${cls}`,
	);
}

// gates over the 8 accuracy-graded non-control slots
const graded = SLOTS.filter((s) => s.tier !== 0 && !s.control).map((s) => s.slug);
const classes = graded.map((s) => (results[s] as { class?: string } | undefined)?.class ?? "refused");
const g1 = classes.every((c) => c !== "confidently-wrong");
const g2 = classes.filter((c) => c === "good").length >= 6;
console.log(`\nS34-G1 (no accuracy-graded slot confidently wrong): ${g1 ? "PASS" : "FAIL"} [${classes.join(", ")}]`);
console.log(`S34-G2 (>=6 of 8 good): ${g2 ? "PASS" : "FAIL"} (${classes.filter((c) => c === "good").length}/8)`);
console.log(`spend: $${spent().toFixed(3)} (${tokensIn} in, ${tokensOut} out) of the $5.00 fence`);

writeFileSync(
	`${root}results/study34.json`,
	`${JSON.stringify({ model: MODEL, results, gates: { g1, g2, classes }, tokensIn, tokensOut, spend: spent() }, null, "\t")}\n`,
);
console.log("results/study34.json written");
