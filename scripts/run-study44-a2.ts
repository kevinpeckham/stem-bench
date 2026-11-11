/**
 * Study 44 Arm A2 (docs/BRIEF-STUDY44.md, approved by Kevin 2026-11-11):
 * Study 41's pipeline on Beat This small0's bars with the app's Rule 1
 * applied (adjacent half bars joined, src/study44/gridRules.ts) for the
 * four Woodward songs where joining changes four or more bars, against
 * Study 41's drafts on the same bars as read. Fence $0.80, hard stop.
 * Derived from run-study43.ts; everything below the grid is Study 43's.
 * ORIGINAL HEADER FOLLOWS.
 * Study 43 (docs/BRIEF-STUDY43.md): the draft format on fast-moving
 * harmony. Study 41's pipeline verbatim (Basic Pitch notes, ChordMini
 * per-cell hints, system23 + question23, sequence grading, Study 35
 * class rule) on Beat This small0's bars, each item drafted twice: on
 * the tracker's bar as read, and on the bar split at the beat nearest
 * its midpoint (two cells a bar, Study 37 Part D's half-bar convention,
 * typed tempo scaled so the declared bar equals the median cell). Twelve
 * dense GuitarSet excerpts and the eight shortest Winterreise songs.
 * Fence $3.00, hard stop before the next draft; results written after
 * every draft to results/study44-a2.json.
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
import { barCounts, joinHalfBars, modalOf } from "../src/study44/gridRules.js";

const root = new URL("../", import.meta.url).pathname;
const MODEL = "anthropic/claude-fable-5-1";
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench44a2-"));
const USD_IN = 2;
const USD_OUT = 15;
const FENCE = 0.8;
const MIN_NOTES_PER_BAR = 3;
const OUT = `${root}results/study44-a2.json`;
/** The grid resolutions: the tracker's bar as read, and the bar split at the tracker beat nearest its midpoint
 *  (two cells a bar, so the one-chord-per-cell draft can carry two chords a bar). A "beat" grid is implemented
 *  but not registered for this study (cost); it stays here for a later one. */
const GRIDS = ["joined"] as const;
type Grid = "bar" | "half" | "beat" | "joined";
const TRACKER = "beatthis-small0";
/** The tracker's downbeats as bar lines, refined to the requested grid; beats missing between downbeats fall back to even division. */
function gridStarts(grid: Grid, beats: number[], downbeats: number[]): number[] {
	if (grid === "bar") return downbeats;
	if (grid === "joined") return joinHalfBars(beats, downbeats, modalOf(barCounts(beats, downbeats)) ?? 4);
	const out: number[] = [];
	for (let i = 0; i < downbeats.length; i++) {
		const from = downbeats[i]!;
		out.push(from);
		const to = downbeats[i + 1];
		if (to === undefined) break;
		const inside = beats.filter((b) => b > from + 1e-6 && b < to - 1e-6);
		if (grid === "beat") {
			if (inside.length) out.push(...inside);
			else out.push((from + to) / 2);
		} else {
			const mid = (from + to) / 2;
			if (inside.length) out.push(inside.reduce((best, b) => (Math.abs(b - mid) < Math.abs(best - mid) ? b : best), inside[0]!));
			else out.push(mid);
		}
	}
	return out;
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
	group?: string;
	seconds?: number;
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
	grid: (typeof GRIDS)[number];
}
const jobs: Job[] = [];
// registered order: the guitar excerpts, then the Winterreise songs shortest first; within an item the two
// grids in turn (bar, then half), so the fence leaves complete items behind it, not complete grids
const A2 = ["jw-same-boat", "jw-goodbye-to-spring", "jw-im-letting-go", "jw-gravity"];
const ordered = A2.map((slug) => [slug, { ...manifest.entries[slug]!, group: "woodward" as const, seconds: 0 }] as const);
for (const [slug, e] of ordered) {
	for (const grid of GRIDS) jobs.push({ key: `${slug}|${grid}`, slug, e, grid });
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
	// the tracker's reading as read (Study 38's rule: tempo = median beat, meter = beats per bar), then the grid:
	// the cells handed to the pipeline as "bars" are the tracker's bars, their halves, or its beats. The typed
	// tempo is scaled so that beatsPerBar × 60 / bpm equals the median cell (Study 37 Part D's half-bar convention).
	const t = trackerOf(e, slug, TRACKER);
	const s = summarizeTracker(t.beats, t.downbeats);
	beatsPerBar = s.beatsPerBar ?? 4;
	meter = beatsPerBar === 3 ? "3/4" : "4/4";
	barStarts = gridStarts(job.grid, t.beats, t.downbeats);
	const cellSec = barStarts.length > 1 ? median(barStarts.slice(1).map((b, i) => b - barStarts[i]!)) : (s.barSec ?? 2);
	bpm = (beatsPerBar * 60) / cellSec;
	const trackerBpm = s.bpm ?? null;
	const trackerBars = t.downbeats.length;
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
		tokens: { in: result.totalUsage?.inputTokens ?? 0, out: result.totalUsage?.outputTokens ?? 0 },
		arm: e.arm,
		grid: job.grid,
		typed: { bpm: Math.round(bpm), meter, key, beatsPerBar },
		group: e.group,
		tracker: { bpm: trackerBpm, bars: trackerBars, barSecMedian: s.barSec },
		cellsPerBar: trackerBars > 1 ? Math.round(((barStarts.length - 1) / (trackerBars - 1)) * 100) / 100 : null,
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

// Arm A2 against Study 41's drafts on the same bars as read
const s41 = (JSON.parse(readFileSync(`${root}results/study41.json`, "utf8")) as { results: Record<string, { roots: { right: number; bearing: number }; quals: { right: number; bearing: number }; class: string; bars: number }> }).results;
let moved = 0;
for (const [slug] of ordered) {
	const a = s41[`${slug}|beatthis-small0`];
	const j = results[`${slug}|joined`] as { roots?: { right: number; bearing: number }; quals?: { right: number; bearing: number }; class: string; bars: number } | undefined;
	if (!a || !j) continue;
	if (j.class !== a.class || j.roots?.right !== a.roots.right) moved++;
	console.log(`  ${slug.padEnd(22)} as read ${a.roots.right}/${a.roots.bearing} q ${a.quals.right}/${a.quals.bearing} ${a.class} (${a.bars} bars) | joined ${j.roots ? `${j.roots.right}/${j.roots.bearing}` : "-"} q ${j.quals ? `${j.quals.right}/${j.quals.bearing}` : "-"} ${j.class} (${j.bars} bars)`);
}
console.log(`Arm A2: joining changed the root count or the class on ${moved} of ${ordered.length} drafts`);
