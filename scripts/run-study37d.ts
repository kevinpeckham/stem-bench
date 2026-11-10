/**
 * Study 37 part D (docs/BRIEF-STUDY37.md): the collapse-safe octave
 * policy where it costs money. Five re-drafts of Study 35 slots at the
 * grid an automatic tracker would hand the product: the three 4/4
 * near-misses at HALF the declared bar (4/4 at twice the declared bpm,
 * the tracker's common fold) and the two 6/8 slots at the
 * dotted-quarter-corrected bar (6/8 at three times the declared
 * dotted-quarter bpm, the input adapter's reading). Pipeline, prompt,
 * holds and grading are run-study35.ts verbatim; the only new measure
 * is the merged bar count. Fence $0.60, hard stop before the next draft.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { chromagram } from "../src/study12/chroma.js";
import { expandChords } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { mod, w1TimeZero, w4Harmonic, w7Section, weightedVote } from "../src/study31/witnesses.js";
import { applyRatioRule } from "../src/study32/corpus32.js";
import { peakNorm } from "../src/study33/stereo.js";
import { familyOf, sequenceScore, sequenceScoreIntervals, sequenceScoreTransposed } from "../src/study34/grade34.js";
import { mergeIdentical } from "../src/study37/harmonic.js";
import { analyse as analyse9, extractFeatures as extract9 } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench37-"));
const USD_IN = 2;
const USD_OUT = 15;
const FENCE = 0.6;
const MAX_GRID_DRIFT = 0.04;
const MIN_NOTES_PER_BAR = 3;

function readEnvLocal(): string | null {
	try {
		const m = readFileSync(`${root}.env.local`, "utf8").match(/^AI_GATEWAY_API_KEY=(.*)$/m);
		return m ? m[1]!.trim().replace(/^["']|["']$/g, "") : null;
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
	const proc = Bun.spawnSync(["node", `${root}scripts/transcribe-child.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, rawFile], {
		maxBuffer: 256 * 1024 * 1024,
	});
	if (proc.exitCode !== 0) throw new Error(`transcription failed (${name}): ${proc.stderr.toString().slice(0, 400)}`);
	return (JSON.parse(proc.stdout.toString()) as [number, number, number, number][]).map(([start, duration, pitch, amplitude]) => ({
		start,
		end: start + duration,
		pitch,
		amplitude,
	}));
}
function nchordPerBar(samples: Float32Array, barStarts: number[], name: string): string[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const barsFile = `${rawFile}.bars.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], { maxBuffer: 64 * 1024 * 1024 });
	if (np.exitCode !== 0) throw new Error(`nchord failed (${name})`);
	return (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar;
}
/** run-study35 placeGrid verbatim. */
function placeGrid(mono: Float32Array, beats: number, beatSec: number, slug: string) {
	const feat = extract9(asBuffer(mono, RATE), UNCAPPED);
	const grid = chartlessGrid(feat.onset, feat.fps, beats * beatSec, mono, RATE);
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
	return { grid, beat, cls, anchor, span, barStarts };
}

interface Truth {
	sections: Record<string, string[]>;
	transposition: { value: number | null };
}
interface Slot {
	slug: string;
	typedBpm: number;
	meter: string;
	declaredBpm: number;
	arm: "half-bar" | "adapter-x3";
	raw: string;
	truth: string;
	baseline: { roots: string; quals: string; draftBars: number; class: string; source: string };
}
const SLOTS: Slot[] = [
	{ slug: "jw-let-it-in", typedBpm: 242, meter: "4/4", declaredBpm: 121, arm: "half-bar", raw: "corpus-study34/jw-let-it-in.mp3.22050.f32le.raw", truth: "corpus/study34-truth/jw-let-it-in.truth.json", baseline: { roots: "18/21", quals: "20/25", draftBars: 120, class: "saved-below-threshold", source: "Study 34 ba88e9c" } },
	{ slug: "jw-same-boat", typedBpm: 186, meter: "4/4", declaredBpm: 93, arm: "half-bar", raw: "corpus-study34/jw-same-boat.mp3.22050.f32le.raw", truth: "corpus/study34-truth/jw-same-boat.truth.json", baseline: { roots: "15/18", quals: "11/11", draftBars: 74, class: "saved-below-threshold", source: "Study 35 7ac06f6" } },
	{ slug: "jw-im-letting-go", typedBpm: 152, meter: "4/4", declaredBpm: 76, arm: "half-bar", raw: "corpus-study35/jw-im-letting-go.mp3.22050.f32le.raw", truth: "corpus/study35-truth/jw-im-letting-go.truth.json", baseline: { roots: "28/33", quals: "15/15", draftBars: 58, class: "saved-below-threshold", source: "Study 35 7ac06f6" } },
	{ slug: "jw-gravity", typedBpm: 144, meter: "6/8", declaredBpm: 48, arm: "adapter-x3", raw: "corpus-study35/jw-gravity.mp3.22050.f32le.raw", truth: "corpus/study35-truth/jw-gravity.truth.json", baseline: { roots: "16/26", quals: "12/12", draftBars: 30, class: "confidently-wrong", source: "Study 35 7ac06f6" } },
	{ slug: "jw-my-favorite-regret", typedBpm: 195, meter: "6/8", declaredBpm: 65, arm: "adapter-x3", raw: "corpus-study35/jw-my-favorite-regret.mp3.22050.f32le.raw", truth: "corpus/study35-truth/jw-my-favorite-regret.truth.json", baseline: { roots: "26/42", quals: "13/17", draftBars: 47, class: "confidently-wrong", source: "Study 35 7ac06f6" } },
];

const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });
let tokensIn = 0;
let tokensOut = 0;
const spent = () => (tokensIn * USD_IN + tokensOut * USD_OUT) / 1e6;
const results: Record<string, unknown> = {};

for (const slot of SLOTS) {
	if (spent() > FENCE) {
		console.log(`FENCE: $${spent().toFixed(3)} > $${FENCE.toFixed(2)}: stopping before ${slot.slug} per registration`);
		break;
	}
	const mono = peakNorm(loadRaw(`${root}${slot.raw}`));
	const truth = JSON.parse(readFileSync(`${root}${slot.truth}`, "utf8")) as Truth;
	const beats = slot.meter === "6/8" ? 6 : 4;
	const key = analyse9(extract9(asBuffer(mono, RATE))).key.value;
	console.log(`\n[${slot.slug}] ${slot.arm}: typed ${slot.typedBpm} ${slot.meter} (declared ${slot.declaredBpm}) | key ${key}`);
	const placed = placeGrid(mono, beats, 60 / slot.typedBpm, slot.slug);
	const gridBpm = (beats * 60) / placed.grid.period;
	const gridDriftPct = Math.abs(gridBpm - slot.typedBpm) / slot.typedBpm;
	const notes = transcribe(mono, slot.slug);
	const notesPerBar = notes.length / placed.grid.n;
	const holds = { gridDrift: gridDriftPct > MAX_GRID_DRIFT, thinNotes: notesPerBar < MIN_NOTES_PER_BAR, gridDriftPct, notesPerBar };
	console.log(`[${slot.slug}] grid ${gridBpm.toFixed(1)} (${(gridDriftPct * 100).toFixed(1)}% off) n ${placed.grid.n} bars of ${placed.grid.period.toFixed(3)} s | ${notes.length} notes (${notesPerBar.toFixed(1)}/bar)`);
	const hints = nchordPerBar(mono, placed.barStarts, `${slot.slug}-bars`).map((c) => (c === "" ? "N.C." : c));

	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: slot.slug.replace(/^jw-/, "").replace(/-/g, " "),
			bpm: slot.typedBpm,
			key,
			meter: slot.meter,
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
	console.log(`[${slot.slug}] draft done | running spend $${spent().toFixed(3)}`);

	const json = result.text.match(/\{[\s\S]*\}/)?.[0];
	let parsed: v.SafeParseResult<typeof ChartDraftAnswerSchema> | null = null;
	try {
		parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	} catch {
		parsed = null;
	}
	if (!parsed?.success) {
		console.log(`[${slot.slug}] REFUSED / no valid answer`);
		results[slot.slug] = { arm: slot.arm, class: "refused", verdict: "refused", typed: { bpm: slot.typedBpm, meter: slot.meter, key }, holds, baseline: slot.baseline, rawDraft: result.text };
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const unknownShare = expanded.length > 0 ? expanded.filter((c) => c === "?" || c === "N.C." || c === "").length / expanded.length : null;
	const invariant = truth.transposition.value === null;
	const published = Object.values(truth.sections).flat();
	const roots = invariant ? sequenceScoreIntervals(expanded, published) : sequenceScoreTransposed(expanded, published, truth.transposition.value ?? 0);
	const quals = sequenceScore(expanded, published, familyOf);
	const rootPct = roots.bearing > 0 ? roots.right / roots.bearing : null;
	const qualPct = quals.bearing > 0 ? quals.right / quals.bearing : null;
	const cls = rootPct !== null && rootPct < 0.8 ? "confidently-wrong" : rootPct !== null && rootPct >= 0.9 && (qualPct ?? 0) >= 0.8 ? "good" : "saved-below-threshold";
	const held = holds.gridDrift || holds.thinNotes;
	const merged = mergeIdentical(expanded);
	results[slot.slug] = {
		arm: slot.arm,
		typed: { bpm: slot.typedBpm, meter: slot.meter, key },
		declaredBpm: slot.declaredBpm,
		placed: { n: placed.grid.n, anchor: placed.anchor, gridBpm, barSec: placed.grid.period },
		holds,
		noteCount: notes.length,
		draftBars: expanded.length,
		mergedBars: merged.length,
		unknownShare,
		sequenceInvariant: invariant,
		roots,
		quals,
		class: cls,
		verdict: held ? "held" : "saved",
		baseline: slot.baseline,
		rawDraft: result.text,
	};
	console.log(
		`[${slot.slug}] roots ${roots.right}/${roots.bearing} quals ${quals.right}/${quals.bearing} | draft ${expanded.length} bars, merged ${merged.length} (baseline draft ${slot.baseline.draftBars}, roots ${slot.baseline.roots}) -> ${cls} (${held ? "HELD" : "saved"})`,
	);
}

writeFileSync(`${root}results/study37d.json`, `${JSON.stringify({ model: MODEL, fence: FENCE, results, tokensIn, tokensOut, spend: spent() }, null, "\t")}\n`);
console.log(`\nspend $${spent().toFixed(3)} (${tokensIn} in, ${tokensOut} out) | results/study37d.json written`);
