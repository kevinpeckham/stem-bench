/**
 * Study 38 (docs/BRIEF-STUDY38.md): the fully automatic chart. No typed
 * tempo, meter or key: the bar lines are a beat tracker's downbeats as
 * read (madmom RNN + DBN, bars of 3 or 4, the Study 36 S36-D1 winner),
 * the tempo the tracker's median beat, the meter its beats per bar, the
 * key the v0.200 detector's. Three arms over corpus/study38-manifest.json:
 *   A  ten modern songs with artist-chart truth (declared-grid baselines
 *      from Studies 34/35);
 *   B  36 GuitarSet singer-songwriter comping excerpts, drafted twice:
 *      on the annotated bars (oracle grid) and on madmom's bars;
 *   C  24 Winterreise songs (SC06, voice and piano, free tempo) on
 *      madmom's bars.
 * Pipeline per draft is run-study35's verbatim from the bar lines on
 * (Basic Pitch notes, ChordMini per-bar hints, system23 + question23,
 * sequence grading, Study 35 class rule) plus the merged bar count.
 * Fence $8.00, hard stop before the next draft; results written after
 * every draft to results/study38.json.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { expandChords } from "../src/study23/grade23.js";
import { question23, system23 } from "../src/study23/prompt23.js";
import { peakNorm } from "../src/study33/stereo.js";
import { familyOf, sequenceScore, sequenceScoreIntervals, sequenceScoreTransposed } from "../src/study34/grade34.js";
import { median, summarizeTracker } from "../src/study36/metrical.js";
import { mergeIdentical } from "../src/study37/harmonic.js";
import { chordAtBars, chordSequence, type TimedChord } from "../src/study38/truth.js";
import { analyse as analyse9, extractFeatures as extract9 } from "../src/study9/analysis.js";
import { asBuffer } from "../src/study9/instruments.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench38-"));
const USD_IN = 2;
const USD_OUT = 15;
const FENCE = 8.0;
const MIN_NOTES_PER_BAR = 3;
const OUT = `${root}results/study38.json`;
const ONLY = process.argv[2]; // optional arm filter: A, B, C

interface Entry {
	arm: "A" | "B" | "C";
	raw: string;
	title: string;
	declared: { bpm?: number; meter?: string; key?: string } | null;
	truth: { published: string[] | null; timedChords?: TimedChord[]; transposition: number | null };
	baseline?: { study: string; roots: { right: number; bearing: number }; quals: { right: number; bearing: number }; draftBars: number | null; class: string | null };
	annotatedBars?: number[];
	annotatedBeats?: number[];
	trackers: string;
}
const manifest = JSON.parse(readFileSync(`${root}corpus/study38-manifest.json`, "utf8")) as { entries: Record<string, Entry> };
const trackerFiles = new Map<string, Record<string, Record<string, { beats: number[]; downbeats: number[] }>>>();
function trackerOf(e: Entry, slug: string, system: string): { beats: number[]; downbeats: number[] } {
	if (!trackerFiles.has(e.trackers)) trackerFiles.set(e.trackers, JSON.parse(readFileSync(`${root}${e.trackers}`, "utf8")));
	const t = trackerFiles.get(e.trackers)![slug]?.[system];
	if (!t) throw new Error(`no ${system} tracking for ${slug} in ${e.trackers}`);
	return t;
}

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

const apiKey = process.env.AI_GATEWAY_API_KEY ?? readEnvLocal();
if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not configured");
const gateway = createGateway({ apiKey });

const prior = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, "utf8")) as { results: Record<string, unknown>; tokensIn: number; tokensOut: number }) : null;
const results: Record<string, unknown> = prior?.results ?? {};
let tokensIn = prior?.tokensIn ?? 0;
let tokensOut = prior?.tokensOut ?? 0;
const spent = () => (tokensIn * USD_IN + tokensOut * USD_OUT) / 1e6;
const save = () => writeFileSync(OUT, `${JSON.stringify({ model: MODEL, fence: FENCE, results, tokensIn, tokensOut, spend: spent() }, null, "\t")}\n`);

interface Job {
	key: string;
	slug: string;
	e: Entry;
	grid: "madmom-34" | "annotated";
}
const jobs: Job[] = [];
for (const [slug, e] of Object.entries(manifest.entries)) {
	if (ONLY && e.arm !== ONLY) continue;
	if (e.arm !== "A" && e.arm !== "B" && e.arm !== "C") continue; // C-metrical (HU33) is tracked, never drafted
	if (e.arm === "B") jobs.push({ key: `${slug}|annotated`, slug, e, grid: "annotated" });
	jobs.push({ key: `${slug}|madmom-34`, slug, e, grid: "madmom-34" });
}
// registered order: A, then B on the annotated grid, then B on madmom, then C
const armOrder = (j: Job) => (j.e.arm === "A" ? 0 : j.e.arm === "B" ? (j.grid === "annotated" ? 1 : 2) : 3);
jobs.sort((a, b) => armOrder(a) - armOrder(b));

for (const job of jobs) {
	if (results[job.key]) continue;
	if (spent() > FENCE) {
		console.log(`FENCE: $${spent().toFixed(3)} > $${FENCE.toFixed(2)}: stopping before ${job.key} per registration`);
		break;
	}
	const { slug, e } = job;
	const mono = peakNorm(loadRaw(`${root}${e.raw}`));
	const duration = mono.length / RATE;
	let barStarts: number[];
	let bpm: number;
	let meter: string;
	let beatsPerBar: number;
	if (job.grid === "annotated") {
		barStarts = e.annotatedBars!;
		const beats = e.annotatedBeats ?? [];
		bpm = beats.length > 1 ? 60 / median(beats.slice(1).map((b, i) => b - beats[i]!)) : (e.declared?.bpm ?? 120);
		meter = e.declared?.meter ?? "4/4";
		beatsPerBar = Number(meter.split("/")[0]);
	} else {
		const t = trackerOf(e, slug, "madmom-34");
		const s = summarizeTracker(t.beats, t.downbeats);
		barStarts = t.downbeats;
		bpm = s.bpm ?? 120;
		beatsPerBar = s.beatsPerBar ?? 4;
		meter = beatsPerBar === 3 ? "3/4" : "4/4";
	}
	// a closing bar line at the audio end so the last bar is described
	if (barStarts.length && barStarts[barStarts.length - 1]! < duration - 0.25) barStarts = [...barStarts, duration];
	const key = analyse9(extract9(asBuffer(mono, RATE))).key.value;
	const nBars = Math.max(0, barStarts.length - 1);
	console.log(`\n[${job.key}] arm ${e.arm}: ${nBars} bars, ${bpm.toFixed(1)} bpm, ${meter}, key ${key}, ${duration.toFixed(0)} s`);
	if (nBars < 2) {
		results[job.key] = { arm: e.arm, grid: job.grid, verdict: "no-grid", bars: nBars };
		save();
		continue;
	}
	const notes = transcribe(mono, job.key.replace("|", "-"));
	const notesPerBar = notes.length / nBars;
	const hints = nchordPerBar(mono, barStarts, `${job.key.replace("|", "-")}-bars`).map((c) => (c === "" ? "N.C." : c));
	const result = await generateText({
		model: gateway(MODEL),
		system: system23(),
		prompt: question23({
			title: e.title,
			bpm: Math.round(bpm),
			key,
			meter,
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

	const published = e.truth.published ?? chordSequence(e.truth.timedChords ?? []);
	const json = result.text.match(/\{[\s\S]*\}/)?.[0];
	let parsed: v.SafeParseResult<typeof ChartDraftAnswerSchema> | null = null;
	try {
		parsed = json ? v.safeParse(ChartDraftAnswerSchema, JSON.parse(json)) : null;
	} catch {
		parsed = null;
	}
	const common = {
		arm: e.arm,
		grid: job.grid,
		typed: { bpm: Math.round(bpm), meter, key, beatsPerBar },
		declared: e.declared,
		bars: nBars,
		barSecMedian: median(barStarts.slice(1).map((b, i) => b - barStarts[i]!)),
		noteCount: notes.length,
		notesPerBar,
		thinNotes: notesPerBar < MIN_NOTES_PER_BAR,
		publishedLength: published.length,
		baseline: e.baseline ?? null,
	};
	if (!parsed?.success) {
		console.log(`[${job.key}] REFUSED / no valid answer | spend $${spent().toFixed(3)}`);
		results[job.key] = { ...common, class: "refused", verdict: "refused", rawDraft: result.text };
		save();
		continue;
	}
	const expanded = expandChords(parsed.output.chords);
	const invariant = e.truth.transposition === null;
	const roots = invariant ? sequenceScoreIntervals(expanded, published) : sequenceScoreTransposed(expanded, published, e.truth.transposition ?? 0);
	const quals = sequenceScore(expanded, published, familyOf);
	const rootPct = roots.bearing > 0 ? roots.right / roots.bearing : null;
	const qualPct = quals.bearing > 0 ? quals.right / quals.bearing : null;
	const cls = rootPct !== null && rootPct < 0.8 ? "confidently-wrong" : rootPct !== null && rootPct >= 0.9 && (qualPct ?? 0) >= 0.8 ? "good" : "saved-below-threshold";
	const merged = mergeIdentical(expanded);
	// secondary, per-bar truth where the annotations allow it: the chord sounding at each annotated
	// bar start, neighbours merged (the fair bound for a one-chord-per-bar draft; reported, not scored)
	let atBars: { published: number; roots: { right: number; bearing: number }; quals: { right: number; bearing: number } } | null = null;
	if (e.truth.timedChords && e.annotatedBars && e.annotatedBars.length > 1) {
		const perBar = mergeIdentical(chordAtBars(e.truth.timedChords, e.annotatedBars).filter((c) => c !== "N.C."));
		atBars = {
			published: perBar.length,
			roots: sequenceScoreTransposed(expanded, perBar, 0),
			quals: sequenceScore(expanded, perBar, familyOf),
		};
	}
	results[job.key] = {
		atBars,
		...common,
		draftBars: expanded.length,
		mergedBars: merged.length,
		unknownShare: expanded.length ? expanded.filter((c) => c === "?" || c === "N.C." || c === "").length / expanded.length : null,
		sequenceInvariant: invariant,
		roots,
		quals,
		class: cls,
		verdict: "saved",
		rawDraft: result.text,
	};
	save();
	console.log(
		`[${job.key}] roots ${roots.right}/${roots.bearing} quals ${quals.right}/${quals.bearing} | draft ${expanded.length} bars, merged ${merged.length}${e.baseline ? ` (baseline ${e.baseline.roots.right}/${e.baseline.roots.bearing}, ${e.baseline.draftBars} bars)` : ""} -> ${cls} | spend $${spent().toFixed(3)}`,
	);
}
save();
console.log(`\nspend $${spent().toFixed(3)} (${tokensIn} in, ${tokensOut} out) | ${OUT} written`);
