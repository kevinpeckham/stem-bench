/**
 * Study 34b Part B (docs/BRIEF-STUDY34B.md): the five confidently wrong
 * Study 34 slots re-run with tempo and meter declared from the
 * registered truth, key detected (arm 1) or declared (arm 2, the three
 * slots whose detected key was wrong). Eight drafts, fence $2.00 with a
 * hard stop before the next draft. Pipeline, prompt, model and graders
 * are Study 34's exactly; the Tier 2 class reconciliation is registered
 * in the brief. Results committed raw to results/study34b.json.
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
import { expandChords, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { mod, w1TimeZero, w4Harmonic, w7Section, weightedVote } from "../src/study31/witnesses.js";
import { applyRatioRule } from "../src/study32/corpus32.js";
import { peakNorm } from "../src/study33/stereo.js";
import { pairBarsByTime, qualityScore, sectionScore, slashScore } from "../src/study34/grade34.js";
import { extractFeatures } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench34b-"));
const USD_IN = 2;
const USD_OUT = 15;
const FENCE = 2.0;

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

/** The shipped grid, vote and placement on the mono mix (run-study34 verbatim). */
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
	return { grid, beat, cls, anchor, barStarts };
}

interface Slot {
	id: string;
	slug: string;
	arm: 1 | 2;
	bpm: number;
	meter: string;
	key: string; // arm 1: Study 34's detected key verbatim; arm 2: the truth key
	tier: 1 | 2;
}

const study34 = JSON.parse(readFileSync(`${root}results/study34.json`, "utf8")) as {
	results: Record<string, { declared?: { bpm: number; meter: string; key: string } }>;
};
const det = (slug: string): string => {
	const k = study34.results[slug]?.declared?.key;
	if (!k) throw new Error(`no Study 34 detected key for ${slug}`);
	return k;
};

const SLOTS: Slot[] = [
	{ id: "dippermouth-blues", slug: "dippermouth-blues", arm: 1, bpm: 186, meter: "4/4", key: det("dippermouth-blues"), tier: 1 },
	{ id: "st-louis-blues", slug: "st-louis-blues", arm: 1, bpm: 67, meter: "4/4", key: det("st-louis-blues"), tier: 1 },
	{ id: "livery-stable-blues", slug: "livery-stable-blues", arm: 1, bpm: 164, meter: "4/4", key: det("livery-stable-blues"), tier: 1 },
	{ id: "roll-called-up-yonder", slug: "roll-called-up-yonder", arm: 1, bpm: 97, meter: "4/4", key: det("roll-called-up-yonder"), tier: 2 },
	{ id: "three-oclock-waltz", slug: "three-oclock-waltz", arm: 1, bpm: 142, meter: "3/4", key: det("three-oclock-waltz"), tier: 2 },
	{ id: "st-louis-blues-key", slug: "st-louis-blues", arm: 2, bpm: 67, meter: "4/4", key: "D", tier: 1 },
	{ id: "roll-called-up-yonder-key", slug: "roll-called-up-yonder", arm: 2, bpm: 97, meter: "4/4", key: "Ab", tier: 2 },
	{ id: "three-oclock-waltz-key", slug: "three-oclock-waltz", arm: 2, bpm: 142, meter: "3/4", key: "C", tier: 2 },
];

interface Truth {
	bars?: string[][];
	barsAligned?: { start: number; chords: string[] }[];
	sections?: { name: string; bar: number }[];
}

const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });
let tokensIn = 0;
let tokensOut = 0;
const spent = () => (tokensIn * USD_IN + tokensOut * USD_OUT) / 1e6;

const results: Record<string, unknown> = {};

for (const slot of SLOTS) {
	if (spent() > FENCE) {
		console.log(`FENCE: $${spent().toFixed(3)} > $${FENCE.toFixed(2)} — stopping before ${slot.id} per registration`);
		break;
	}
	const mono = peakNorm(loadRaw(`${root}corpus-study34/${slot.slug}.mp3.22050.f32le.raw`));
	const truth = JSON.parse(readFileSync(`${root}corpus/study34-truth/${slot.slug}.truth.json`, "utf8")) as Truth;
	const beats = slot.meter === "3/4" ? 3 : 4;
	console.log(`\n[${slot.id}] declared ${slot.bpm} bpm ${slot.meter} key ${slot.key} (arm ${slot.arm})`);

	const placed = placeGrid(mono, beats, 60 / slot.bpm, slot.id);
	const gridBpm = (beats * 60) / placed.grid.period;
	const gridOffPct = Math.abs(gridBpm - slot.bpm) / slot.bpm;
	console.log(
		`[${slot.id}] grid period ${placed.grid.period.toFixed(3)}s n ${placed.grid.n} (${gridBpm.toFixed(1)} bpm, ${(gridOffPct * 100).toFixed(1)}% off declared) | bar one ${placed.anchor.toFixed(3)}s`,
	);
	const hints = nchordPerBar(mono, placed.barStarts, `${slot.id}-bars`).map((c) => (c === "" ? "N.C." : c));
	const notes = transcribe(mono, slot.id);

	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: slot.slug.replace(/-/g, " "),
			bpm: slot.bpm,
			key: slot.key,
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
	console.log(`[${slot.id}] draft done | running spend $${spent().toFixed(3)}`);

	const json = result.text.match(/\{[\s\S]*\}/)?.[0];
	let parsed: v.SafeParseResult<typeof ChartDraftAnswerSchema> | null = null;
	try {
		parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	} catch {
		parsed = null;
	}
	if (!parsed?.success) {
		console.log(`[${slot.id}] REFUSED / no valid answer`);
		results[slot.id] = {
			class: "refused",
			arm: slot.arm,
			declared: { bpm: slot.bpm, meter: slot.meter, key: slot.key },
			placed: { n: placed.grid.n, anchor: placed.anchor, gridBpm, gridOffPct },
			rawDraft: result.text,
		};
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const draftSections = parsed.output.sections.map((s) => ({ name: s.name, bar: s.bar - 1 }));
	const unknownShare =
		expanded.length > 0 ? expanded.filter((c) => c === "?" || c === "N.C." || c === "").length / expanded.length : null;
	const record: Record<string, unknown> = {
		arm: slot.arm,
		declared: { bpm: slot.bpm, meter: slot.meter, key: slot.key },
		placed: { n: placed.grid.n, anchor: placed.anchor, cls: placed.cls, gridBpm, gridOffPct },
		noteCount: notes.length,
		draftBars: expanded.length,
		barCountChanged: expanded.length !== placed.grid.n,
		unknownShare,
		draftSections,
		rawDraft: result.text,
	};

	let structuralWrong: boolean;
	if (slot.tier === 1) {
		const truthBars = truth.barsAligned!;
		const truthSectionBars = (truth.sections ?? []).map((s) => s.bar);
		const { answers, truth: truthPaired } = pairBarsByTime(placed.barStarts, expanded, truthBars);
		const roots = rootScore(answers, truthPaired);
		const quals = qualityScore(answers, truthPaired);
		const slash = slashScore(answers, truthPaired);
		const barCountOff = Math.abs(placed.grid.n - truthBars.length);
		const sections =
			truthSectionBars.length > 0
				? sectionScore(
						truthSectionBars.map((b) => Math.round((truthBars[b]!.start - placed.anchor) / placed.grid.period)),
						draftSections.map((s) => s.bar),
					)
				: null;
		const barOneErr = Math.abs(placed.anchor - truthBars[0]!.start);
		Object.assign(record, { roots, quals, slash, barCountOff, sections, barOneErr, truthBarCount: truthBars.length });
		structuralWrong = barCountOff > 1;
	} else {
		// Tier 2 per the registered reconciliation: hymn cyclic mod 16,
		// waltz index-aligned over min(n, 118); the structural clause is
		// the grid abandoning the declared prior by more than 4 %.
		const truthBars = truth.bars!;
		let answers: string[];
		let tslice: string[][];
		if (slot.slug === "roll-called-up-yonder") {
			answers = expanded;
			tslice = expanded.map((_, j) => truthBars[j % truthBars.length]!);
		} else {
			const n = Math.min(expanded.length, truthBars.length);
			answers = expanded.slice(0, n);
			tslice = truthBars.slice(0, n);
		}
		const roots = rootScore(answers, tslice);
		const quals = qualityScore(answers, tslice);
		Object.assign(record, { roots, quals, grading: slot.slug === "roll-called-up-yonder" ? "cyclic mod 16" : "index min(n,118)", truthBarCount: truthBars.length });
		structuralWrong = gridOffPct > 0.04;
	}

	const r = record.roots as { right: number; bearing: number };
	const rootPct = r.bearing > 0 ? r.right / r.bearing : null;
	const q = record.quals as { right: number; bearing: number };
	const qualPct = q.bearing > 0 ? q.right / q.bearing : null;
	const wrong = (rootPct !== null && rootPct < 0.8) || structuralWrong;
	const good = rootPct !== null && rootPct >= 0.9 && (qualPct ?? 0) >= 0.8 && !structuralWrong;
	record.class = wrong ? "confidently-wrong" : good ? "good" : "saved-below-threshold";
	results[slot.id] = record;
	console.log(
		`[${slot.id}] roots ${r.right}/${r.bearing} quals ${q.right}/${q.bearing} | barCountChanged ${record.barCountChanged} unknownShare ${unknownShare === null ? "-" : unknownShare.toFixed(3)} -> ${record.class}`,
	);
}

// gates over the five arm-1 slots
const arm1 = SLOTS.filter((s) => s.arm === 1).map((s) => s.id);
const classes = arm1.map((id) => (results[id] as { class?: string } | undefined)?.class ?? "not-run");
const rootsPct = arm1.map((id) => {
	const r = (results[id] as { roots?: { right: number; bearing: number } } | undefined)?.roots;
	return r && r.bearing > 0 ? r.right / r.bearing : null;
});
const g1 = classes.every((c) => c !== "confidently-wrong" && c !== "not-run");
const g2 = rootsPct.filter((p) => p !== null && p >= 0.8).length >= 3;
console.log(`\nS34b-G1 (none of the five confidently wrong, declared tempo+meter): ${g1 ? "PASS" : "FAIL"} [${classes.join(", ")}]`);
console.log(`S34b-G2 (>=3 of 5 roots >= 80%): ${g2 ? "PASS" : "FAIL"} (${rootsPct.filter((p) => p !== null && p >= 0.8).length}/5)`);
// G3: arm-2 deltas
for (const s of SLOTS.filter((x) => x.arm === 2)) {
	const a = results[s.id] as { roots?: { right: number; bearing: number }; quals?: { right: number; bearing: number } } | undefined;
	const b = results[s.slug] as { roots?: { right: number; bearing: number }; quals?: { right: number; bearing: number } } | undefined;
	if (a?.roots && b?.roots)
		console.log(
			`S34b-G3 ${s.slug}: roots ${b.roots.right}/${b.roots.bearing} -> ${a.roots.right}/${a.roots.bearing}, quals ${b.quals!.right}/${b.quals!.bearing} -> ${a.quals!.right}/${a.quals!.bearing} from declaring the key`,
		);
}
console.log(`spend: $${spent().toFixed(3)} (${tokensIn} in, ${tokensOut} out) of the $${FENCE.toFixed(2)} fence | per draft $${(spent() / Math.max(1, Object.keys(results).length)).toFixed(3)}`);

writeFileSync(
	`${root}results/study34b.json`,
	`${JSON.stringify({ model: MODEL, results, gates: { g1, g2, classes, rootsPct }, tokensIn, tokensOut, spend: spent() }, null, "\t")}\n`,
);
console.log("results/study34b.json written");
