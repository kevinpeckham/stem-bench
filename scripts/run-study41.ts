/**
 * Study 41 arm A (docs/BRIEF-STUDY41.md): Study 38's arm A again with
 * Beat This's bars in place of madmom's. run-study38.ts verbatim from
 * the bar lines on (Basic Pitch notes, ChordMini per-bar hints,
 * system23 + question23, sequence grading, Study 35 class rule); the
 * bar lines are the tracker's downbeats as read from the committed
 * Study 36 readings (results/study36-trackers.json), the tempo its
 * median beat, the meter its beats per bar, the key the v0.200
 * detector's. Ten modern songs × two checkpoints (small0 first, then
 * final0); each cell carries Study 38's madmom draft of the same song
 * for the paired rule S41-D1. Fence $2.00, hard stop before the next
 * draft; results written after every draft to results/study41.json.
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
const dir = mkdtempSync(join(tmpdir(), "stem-bench41-"));
const USD_IN = 2;
const USD_OUT = 15;
const FENCE = 2.0;
const MIN_NOTES_PER_BAR = 3;
const OUT = `${root}results/study41.json`;
const SYSTEMS = ["beatthis-small0", "beatthis-final0"] as const;
/** Study 38's madmom draft of the same song: the comparator for S41-D1. */
interface RefCell {
	typed: { bpm: number; meter: string };
	barSecMedian: number;
	roots: { right: number; bearing: number };
	quals: { right: number; bearing: number };
	class: string;
}
const study38 = (JSON.parse(readFileSync(`${root}results/study38.json`, "utf8")) as { results: Record<string, RefCell> }).results;
function madmomRef(slug: string): RefCell {
	const c = study38[`${slug}|madmom-34`];
	if (!c) throw new Error(`no Study 38 madmom draft for ${slug}`);
	return { typed: c.typed, barSecMedian: c.barSecMedian, roots: c.roots, quals: c.quals, class: c.class };
}

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
	grid: (typeof SYSTEMS)[number];
}
const jobs: Job[] = [];
// registered order: small0 on all ten, then final0 on all ten (the fence stops final0 first)
for (const system of SYSTEMS) {
	for (const [slug, e] of Object.entries(manifest.entries)) {
		if (e.arm !== "A") continue;
		jobs.push({ key: `${slug}|${system}`, slug, e, grid: system });
	}
}

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
	// the tracker's reading as read: bars = downbeats, tempo = median beat, meter = beats per bar (Study 38's rule)
	const t = trackerOf(e, slug, job.grid);
	const s = summarizeTracker(t.beats, t.downbeats);
	barStarts = t.downbeats;
	bpm = s.bpm ?? 120;
	beatsPerBar = s.beatsPerBar ?? 4;
	meter = beatsPerBar === 3 ? "3/4" : "4/4";
	// for Ask B: how the count of beats to the bar varies across the song (beats strictly inside each bar, plus one)
	const beatsPerBarCounts: Record<string, number> = {};
	for (let i = 1; i < t.downbeats.length; i++) {
		const n = t.beats.filter((b) => b > t.downbeats[i - 1]! && b < t.downbeats[i]!).length + 1;
		beatsPerBarCounts[String(n)] = (beatsPerBarCounts[String(n)] ?? 0) + 1;
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
		finishReason: result.finishReason,
		arm: e.arm,
		grid: job.grid,
		typed: { bpm: Math.round(bpm), meter, key, beatsPerBar },
		beatsPerBarCounts,
		beatSecMedian: s.beatSec,
		madmom: madmomRef(slug),
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

// S41-D1 and P1 to P4, from the cells
interface Cell41 {
	typed: { bpm: number; meter: string };
	barSecMedian: number;
	beatSecMedian: number | null;
	madmom: RefCell;
	roots?: { right: number; bearing: number };
	class: string;
}
for (const system of SYSTEMS) {
	console.log(`\n${system} against Study 38's madmom drafts (the app's rule: within two roots on every song, none confidently-wrong):`);
	let within = 0;
	let wrong = 0;
	let n = 0;
	const failing: string[] = [];
	for (const [slug, e] of Object.entries(manifest.entries)) {
		if (e.arm !== "A") continue;
		const c = results[`${slug}|${system}`] as Cell41 | undefined;
		if (!c) continue;
		n++;
		const mm = c.madmom;
		const ok = c.roots !== undefined && c.roots.right >= mm.roots.right - 2;
		if (ok) within++;
		else failing.push(slug);
		if (c.class === "confidently-wrong") wrong++;
		const barRatio = c.barSecMedian / mm.barSecMedian;
		const beatRatio = c.beatSecMedian && mm.typed.bpm ? c.beatSecMedian / (60 / mm.typed.bpm) : null;
		console.log(
			`  ${slug.padEnd(24)} roots ${c.roots ? `${c.roots.right}/${c.roots.bearing}` : "-"} vs madmom ${mm.roots.right}/${mm.roots.bearing} ${ok ? "ok" : "SHORT"} | ${c.class} (madmom ${mm.class}) | bar ${c.barSecMedian.toFixed(2)} s vs ${mm.barSecMedian.toFixed(2)} (ratio ${barRatio.toFixed(2)}) | ${c.typed.bpm} bpm ${c.typed.meter} vs ${mm.typed.bpm} ${mm.typed.meter}${beatRatio ? ` (beat ratio ${beatRatio.toFixed(2)})` : ""}`,
		);
	}
	console.log(`  within two roots ${within}/${n}, confidently-wrong ${wrong} -> rule ${within === n && wrong === 0 && n === 10 ? "PASSES" : "FAILS"}${failing.length ? ` (short: ${failing.join(", ")})` : ""}`);
}
