/**
 * Study 35 (docs/BRIEF-STUDY35.md): the chartless draft on modern
 * recordings, declared mode, with the app's three holds and the 0.84
 * confidence refusal registered in advance. Nine paid drafts
 * (jw-let-it-in reuses its Study 34 record, inputs identical) + arm D
 * (two tempo-following drafts on the 34b comb-drift recordings).
 * Fence $3.00, hard stop before the next draft. Results committed raw
 * to results/study35.json.
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
import { analyse as analyse200, extractFeatures as extract200 } from "../src/study11b/analysis200.js";
import { chromagram } from "../src/study12/chroma.js";
import { expandChords, rootScore } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { audibleSpan } from "../src/study26/recipe.js";
import { chartlessGrid } from "../src/study28/grid.js";
import { mod, w1TimeZero, w4Harmonic, w7Section, weightedVote } from "../src/study31/witnesses.js";
import { applyRatioRule } from "../src/study32/corpus32.js";
import { peakNorm } from "../src/study33/stereo.js";
import {
	familyOf,
	pairBarsByTime,
	qualityScore,
	rootOf,
	sequenceScore,
	sequenceScoreIntervals,
	sequenceScoreTransposed,
} from "../src/study34/grade34.js";
import { analyse as analyse9, extractFeatures as extract9 } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const UNCAPPED = 600;
const LEAD = 0.07;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const BEATS35 = `${root}scripts/beats-study35.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench35-"));
const USD_IN = 2;
const USD_OUT = 15;
const FENCE = 3.0;
const MAX_GRID_DRIFT = 0.04;
const MIN_NOTES_PER_BAR = 3;
const CONF_REFUSE = 0.84;

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
	const feat = extract9(asBuffer(mono, RATE), UNCAPPED);
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
	return { grid, beat, cls, anchor, span, barStarts };
}

interface Truth35 {
	sections: Record<string, string[]>;
	transposition: { value: number | null };
	declared: { key: string; bpm: number; meter: string };
}

const SLOTS: { slug: string; bpm: number; meter: string }[] = [
	{ slug: "jw-same-boat", bpm: 93, meter: "4/4" },
	{ slug: "jw-gravity", bpm: 48, meter: "6/8" },
	{ slug: "jw-my-favorite-regret", bpm: 65, meter: "6/8" },
	{ slug: "jw-california-lullabye", bpm: 176, meter: "4/4" },
	{ slug: "jw-swansong", bpm: 170, meter: "4/4" },
	{ slug: "jw-afterglow", bpm: 98, meter: "4/4" },
	{ slug: "jw-cherubs", bpm: 165, meter: "4/4" },
	{ slug: "jw-goodbye-to-spring", bpm: 240, meter: "4/4" },
	{ slug: "jw-im-letting-go", bpm: 76, meter: "4/4" },
];
const rawOf = (slug: string): string =>
	slug === "jw-same-boat" ? `${root}corpus-study34/jw-same-boat.mp3.22050.f32le.raw` : `${root}corpus-study35/${slug}.mp3.22050.f32le.raw`;
const truthOf = (slug: string): Truth35 =>
	JSON.parse(
		readFileSync(
			slug === "jw-same-boat" ? `${root}corpus/study34-truth/jw-same-boat.truth.json` : `${root}corpus/study35-truth/${slug}.truth.json`,
			"utf8",
		),
	) as Truth35;

const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });
let tokensIn = 0;
let tokensOut = 0;
const spent = () => (tokensIn * USD_IN + tokensOut * USD_OUT) / 1e6;
const results: Record<string, unknown> = {};

// jw-let-it-in reused from Study 34 (registered: detected inputs equal declared; disclosed)
{
	const s34 = JSON.parse(readFileSync(`${root}results/study34.json`, "utf8")) as { results: Record<string, Record<string, unknown>> };
	const r = s34.results["jw-let-it-in"]!;
	const n = (r.placed as { n: number }).n;
	const notes = r.noteCount as number;
	results["jw-let-it-in"] = {
		reused: "Study 34 record (ba88e9c): detected 121.0/4/4/D minor equals the declared values, prompt identical",
		declared: { bpm: 121, meter: "4/4", key: "D minor (detected)" },
		holds: { gridDrift: false, thinNotes: notes / n < MIN_NOTES_PER_BAR, notesPerBar: notes / n },
		roots: r.roots,
		quals: r.quals,
		unknownShare: null,
		class: "saved-below-threshold",
		verdict: "saved",
	};
}

for (const slot of SLOTS) {
	if (spent() > FENCE) {
		console.log(`FENCE: $${spent().toFixed(3)} > $${FENCE.toFixed(2)} — stopping before ${slot.slug} per registration`);
		break;
	}
	const mono = peakNorm(loadRaw(rawOf(slot.slug)));
	const truth = truthOf(slot.slug);
	const beats = slot.meter === "3/4" ? 3 : slot.meter === "6/8" ? 6 : 4;
	const det9 = analyse9(extract9(asBuffer(mono, RATE)));
	const key = det9.key.value; // 34b arm-1 rule: a visitor taps a tempo, few name a key
	console.log(`\n[${slot.slug}] declared ${slot.bpm} bpm ${slot.meter} | detected key ${key}`);

	const placed = placeGrid(mono, beats, 60 / slot.bpm, slot.slug);
	const gridBpm = (beats * 60) / placed.grid.period;
	const gridDriftPct = Math.abs(gridBpm - slot.bpm) / slot.bpm;
	const notes = transcribe(mono, slot.slug);
	const notesPerBar = notes.length / placed.grid.n;
	const holds = {
		gridDrift: gridDriftPct > MAX_GRID_DRIFT,
		thinNotes: notesPerBar < MIN_NOTES_PER_BAR,
		gridDriftPct,
		notesPerBar,
	};
	const pickupBeats = (placed.anchor - placed.span.first) / placed.beat;
	console.log(
		`[${slot.slug}] grid ${gridBpm.toFixed(1)} (${(gridDriftPct * 100).toFixed(1)}% off) n ${placed.grid.n} | ${notes.length} notes (${notesPerBar.toFixed(1)}/bar) | holds drift=${holds.gridDrift} thin=${holds.thinNotes} | pickup ${pickupBeats.toFixed(2)} beats`,
	);
	const hints = nchordPerBar(mono, placed.barStarts, `${slot.slug}-bars`).map((c) => (c === "" ? "N.C." : c));

	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: slot.slug.replace(/^jw-/, "").replace(/-/g, " "),
			bpm: slot.bpm,
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
		results[slot.slug] = {
			class: "refused",
			verdict: "refused",
			declared: { bpm: slot.bpm, meter: slot.meter, key },
			holds,
			pickupBeats,
			rawDraft: result.text,
		};
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const unknownShare =
		expanded.length > 0 ? expanded.filter((c) => c === "?" || c === "N.C." || c === "").length / expanded.length : null;
	const invariant = truth.transposition.value === null;
	const published = Object.values(truth.sections).flat();
	const roots = invariant
		? sequenceScoreIntervals(expanded, published)
		: sequenceScoreTransposed(expanded, published, truth.transposition.value ?? 0);
	const quals = sequenceScore(expanded, published, familyOf);
	const rootPct = roots.bearing > 0 ? roots.right / roots.bearing : null;
	const qualPct = quals.bearing > 0 ? quals.right / quals.bearing : null;
	const cls =
		rootPct !== null && rootPct < 0.8 ? "confidently-wrong" : rootPct !== null && rootPct >= 0.9 && (qualPct ?? 0) >= 0.8 ? "good" : "saved-below-threshold";
	const held = holds.gridDrift || holds.thinNotes;
	results[slot.slug] = {
		declared: { bpm: slot.bpm, meter: slot.meter, key },
		placed: { n: placed.grid.n, anchor: placed.anchor, gridBpm },
		holds,
		pickupBeats,
		noteCount: notes.length,
		draftBars: expanded.length,
		barCountChanged: expanded.length !== placed.grid.n,
		unknownShare,
		sequenceInvariant: invariant,
		roots,
		quals,
		class: cls,
		verdict: held ? "held" : "saved",
		rawDraft: result.text,
	};
	console.log(
		`[${slot.slug}] roots ${roots.right}/${roots.bearing} quals ${quals.right}/${quals.bearing} unknownShare ${unknownShare?.toFixed(3) ?? "-"} -> ${cls} (${held ? "HELD" : "saved"})`,
	);
}

// automatic mode, $0: the v0.200 detector per modern slot, for S35-G4
const auto: Record<string, unknown> = {};
for (const slug of ["jw-let-it-in", ...SLOTS.map((s) => s.slug)]) {
	const rawPath = slug === "jw-let-it-in" ? `${root}corpus-study34/jw-let-it-in.mp3.22050.f32le.raw` : rawOf(slug);
	const mono = peakNorm(loadRaw(rawPath));
	const det = analyse200(extract200(asBuffer(mono, RATE)));
	const declared = slug === "jw-let-it-in" ? 121 : SLOTS.find((s) => s.slug === slug)!.bpm;
	const tempoRight = Math.abs(det.tempo.bpm - declared) / declared <= 0.04;
	auto[slug] = {
		tempo: det.tempo.bpm,
		confidence: det.tempo.confidence,
		tempoRight,
		refused: det.tempo.confidence < CONF_REFUSE,
		meter: det.meter.value,
		key: det.key.value,
		keyConfidence: det.key.confidence,
	};
	console.log(
		`[auto] ${slug}: ${det.tempo.bpm.toFixed(1)} bpm conf ${det.tempo.confidence.toFixed(3)} ${tempoRight ? "right" : "WRONG"} -> ${det.tempo.confidence < CONF_REFUSE ? "REFUSE" : "pass"}`,
	);
}

// arm D: tempo-following grid on the 34b comb-drift recordings
const ARM_D: { slug: string; bpm: number; anchor34b: number }[] = [
	{ slug: "st-louis-blues", bpm: 67, anchor34b: -0.15077611940300306 },
	{ slug: "livery-stable-blues", bpm: 163.8, anchor34b: -1.016829268292683 },
];
for (const d of ARM_D) {
	if (spent() > FENCE) {
		console.log(`FENCE before arm D ${d.slug}`);
		break;
	}
	const rawPath = `${root}corpus-study34/${d.slug}.mp3.22050.f32le.raw`;
	const mono = peakNorm(loadRaw(rawPath));
	const monoFile = join(dir, `${d.slug}-armd.raw`);
	writeFileSync(monoFile, Buffer.from(mono.buffer, mono.byteOffset, mono.byteLength));
	const out = `${monoFile}.beats.json`;
	const bp = Bun.spawnSync([PY, BEATS35, "--raw", monoFile, "--start-bpm", String(d.bpm), "--out", out], {
		maxBuffer: 16 * 1024 * 1024,
	});
	if (bp.exitCode !== 0) throw new Error(`beat tracker failed (${d.slug}): ${bp.stderr.toString().slice(0, 300)}`);
	const { beats: beatTimes } = JSON.parse(readFileSync(out, "utf8")) as { beats: number[] };
	let i0 = 0;
	for (let i = 0; i < beatTimes.length; i++) if (Math.abs(beatTimes[i]! - d.anchor34b) < Math.abs(beatTimes[i0]! - d.anchor34b)) i0 = i;
	const barStarts: number[] = [];
	for (let i = i0; i < beatTimes.length; i += 4) barStarts.push(beatTimes[i]!);
	const truth = JSON.parse(readFileSync(`${root}corpus/study34-truth/${d.slug}.truth.json`, "utf8")) as {
		barsAligned: { start: number; chords: string[] }[];
	};
	const notes = transcribe(mono, `${d.slug}-armd`);
	const hints = nchordPerBar(mono, barStarts, `${d.slug}-armd-bars`).map((c) => (c === "" ? "N.C." : c));
	console.log(`\n[armD ${d.slug}] ${beatTimes.length} tracked beats -> ${barStarts.length} bars (truth ${truth.barsAligned.length})`);
	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: d.slug.replace(/-/g, " "),
			bpm: d.bpm,
			key: d.slug === "st-louis-blues" ? "B♭ major" : "E♭ major", // the Study 34 detected keys, as arm 1
			meter: "4/4",
			barNotes: describeBars(notes, barStarts),
			hintPerBar: hints,
		}),
		temperature: 0,
		maxOutputTokens: 8000,
		maxRetries: 4,
		providerOptions: { anthropic: { thinking: { type: "adaptive" }, effort: "low" } },
	} as Parameters<typeof generateText>[0]);
	tokensIn += result.totalUsage?.inputTokens ?? 0;
	tokensOut += result.totalUsage?.outputTokens ?? 0;
	console.log(`[armD ${d.slug}] draft done | running spend $${spent().toFixed(3)}`);
	const json = result.text.match(/\{[\s\S]*\}/)?.[0];
	let parsed: v.SafeParseResult<typeof ChartDraftAnswerSchema> | null = null;
	try {
		parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	} catch {
		parsed = null;
	}
	if (!parsed?.success) {
		results[`armD-${d.slug}`] = { class: "refused", barCount: barStarts.length, rawDraft: result.text };
		console.log(`[armD ${d.slug}] REFUSED`);
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const { answers, truth: truthPaired } = pairBarsByTime(barStarts, expanded, truth.barsAligned);
	const roots = rootScore(answers, truthPaired);
	const quals = qualityScore(answers, truthPaired);
	results[`armD-${d.slug}`] = {
		trackedBeats: beatTimes.length,
		barCount: barStarts.length,
		truthBarCount: truth.barsAligned.length,
		roots,
		quals,
		rawDraft: result.text,
	};
	console.log(`[armD ${d.slug}] bars ${barStarts.length} vs truth ${truth.barsAligned.length} | roots ${roots.right}/${roots.bearing} quals ${quals.right}/${quals.bearing}`);
}

// gates over the ten declared-mode slots
const tenSlugs = ["jw-let-it-in", ...SLOTS.map((s) => s.slug)];
const recOf = (s: string) => results[s] as { class?: string; verdict?: string; roots?: { right: number; bearing: number } } | undefined;
const g1 = tenSlugs.every((s) => {
	const r = recOf(s);
	return !(r?.class === "confidently-wrong" && r?.verdict === "saved");
});
const goodCount = tenSlugs.filter((s) => recOf(s)?.class === "good").length;
const g2 = goodCount >= 7;
const heldGood = tenSlugs.filter((s) => {
	const r = recOf(s);
	const pct = r?.roots && r.roots.bearing > 0 ? r.roots.right / r.roots.bearing : null;
	return r?.verdict === "held" && pct !== null && pct >= 0.8;
}).length;
const g3 = heldGood <= 1;
const autoRows = Object.entries(auto) as [string, { tempoRight: boolean; refused: boolean }][];
const wrongPassed = autoRows.filter(([, a]) => !a.tempoRight && !a.refused).map(([s]) => s);
const refuseRate = autoRows.filter(([, a]) => a.refused).length;
console.log(`\nS35-G1 (no confidently-wrong-and-saved): ${g1 ? "PASS" : "FAIL"} [${tenSlugs.map((s) => `${recOf(s)?.class ?? "?"}/${recOf(s)?.verdict ?? "?"}`).join(", ")}]`);
console.log(`S35-G2 (>=7 of 10 good): ${g2 ? "PASS" : "FAIL"} (${goodCount}/10)`);
console.log(`S35-G3 (holds hold at most one good/near-good): ${g3 ? "PASS" : "FAIL"} (${heldGood} held)`);
console.log(`S35-G4 (reported): confidence refusal refuses ${refuseRate}/10; wrong detections passing: ${wrongPassed.length === 0 ? "none" : wrongPassed.join(", ")}`);
console.log(`spend: $${spent().toFixed(3)} (${tokensIn} in, ${tokensOut} out) of the $${FENCE.toFixed(2)} fence | per paid draft $${(spent() / 11).toFixed(3)}`);

writeFileSync(
	`${root}results/study35.json`,
	`${JSON.stringify({ model: MODEL, results, auto, gates: { g1, g2, g3, goodCount, heldGood, refuseRate, wrongPassed } , tokensIn, tokensOut, spend: spent() }, null, "\t")}\n`,
);
console.log("results/study35.json written");
