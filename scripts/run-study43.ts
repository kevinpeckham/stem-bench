/**
 * Study 43 (docs/BRIEF-STUDY43.md): the draft format on fast-moving
 * harmony. Study 41's pipeline verbatim (Basic Pitch notes, ChordMini
 * per-cell hints, system23 + question23, sequence grading, Study 35
 * class rule) on Beat This small0's bars, each item drafted twice: on
 * the tracker's bar as read, and on the bar split at the beat nearest
 * its midpoint (two cells a bar, Study 37 Part D's half-bar convention,
 * typed tempo scaled so the declared bar equals the median cell). Twelve
 * dense GuitarSet excerpts and the eight shortest Winterreise songs.
 * Fence $3.00, hard stop before the next draft; results written after
 * every draft to results/study43.json.
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
const dir = mkdtempSync(join(tmpdir(), "stem-bench43-"));
const USD_IN = 2;
const USD_OUT = 15;
const FENCE = 3.0;
const MIN_NOTES_PER_BAR = 3;
const OUT = `${root}results/study43.json`;
/** The grid resolutions: the tracker's bar as read, and the bar split at the tracker beat nearest its midpoint
 *  (two cells a bar, so the one-chord-per-cell draft can carry two chords a bar). A "beat" grid is implemented
 *  but not registered for this study (cost); it stays here for a later one. */
const GRIDS = ["bar", "half"] as const;
type Grid = "bar" | "half" | "beat";
const TRACKER = "beatthis-small0";
/** The tracker's downbeats as bar lines, refined to the requested grid; beats missing between downbeats fall back to even division. */
function gridStarts(grid: Grid, beats: number[], downbeats: number[]): number[] {
	if (grid === "bar") return downbeats;
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
	group: "guitar" | "winterreise";
	seconds: number;
}
const manifest = JSON.parse(readFileSync(`${root}corpus/study43-manifest.json`, "utf8")) as { entries: Record<string, Entry> };
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
const ordered = Object.entries(manifest.entries).sort((a, b) => (a[1].group === b[1].group ? a[1].seconds - b[1].seconds : a[1].group === "guitar" ? -1 : 1));
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

// S43-D1 and P1 to P4, from the cells
interface Cell43 {
	group: "guitar" | "winterreise";
	roots?: { right: number; bearing: number };
	quals?: { right: number; bearing: number };
	class: string;
	bars: number;
	tokens?: { in: number; out: number };
}
const pct = (r?: { right: number; bearing: number }) => (r && r.bearing ? r.right / r.bearing : null);
const cellOf = (slug: string, grid: string) => results[`${slug}|${grid}`] as Cell43 | undefined;
console.log("\nroots right/bearing by grid (class):");
const tally = { guitar: { n: 0, lifted: 0, lowered: 0, equal: 0, bar: [] as number[], half: [] as number[] }, winterreise: { n: 0, lifted: 0, lowered: 0, equal: 0, bar: [] as number[], half: [] as number[] } };
const goodDense = { bar: 0, half: 0 };
let halfGoodWinterreise = 0;
for (const [slug, e] of ordered) {
	const bar = cellOf(slug, "bar");
	const half = cellOf(slug, "half");
	if (!bar || !half) continue;
	const fmt = (c: Cell43) => `${c.roots ? `${c.roots.right}/${c.roots.bearing}` : "-"} ${c.class}${c.bars ? ` (${c.bars} cells)` : ""}`;
	console.log(`  ${slug.padEnd(26)} bar ${fmt(bar).padEnd(34)} half ${fmt(half)}`);
	const g = tally[e.group];
	g.n++;
	const pb = pct(bar.roots);
	const ph = pct(half.roots);
	if (pb !== null) g.bar.push(pb);
	if (ph !== null) g.half.push(ph);
	if (pb !== null && ph !== null) {
		if (ph > pb) g.lifted++;
		else if (ph < pb) g.lowered++;
		else g.equal++;
	}
	if (slug.includes("SS2-107")) {
		if (bar.class === "good") goodDense.bar++;
		if (half.class === "good") goodDense.half++;
	}
	if (e.group === "winterreise" && half.class === "good") halfGoodWinterreise++;
}
const med = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[xs.length >> 1]! : null);
for (const g of ["guitar", "winterreise"] as const) {
	const t = tally[g];
	console.log(`${g}: n ${t.n}; roots median bar ${med(t.bar)?.toFixed(2)} half ${med(t.half)?.toFixed(2)}; half lifts ${t.lifted}, lowers ${t.lowered}, equal ${t.equal}`);
}
const dense = ordered.filter(([s]) => s.includes("SS2-107")).length;
console.log(`dense sheet SS2-107-Ab good: bar ${goodDense.bar}, half ${goodDense.half} (of ${dense})`);
console.log(`P1 (dense sheet: half grid good on >= 4 of 6): ${goodDense.half >= 4 ? "PASS" : "FAIL"}`);
console.log(`P2 (guitar: half grid lifts roots on >= 8 of 12): ${tally.guitar.lifted >= 8 ? "PASS" : "FAIL"} (${tally.guitar.lifted})`);
const mh = med(tally.winterreise.half);
console.log(`P3 (winterreise: half grid roots median >= 0.60, no song good): ${mh !== null && mh >= 0.6 && halfGoodWinterreise === 0 ? "PASS" : "FAIL"} (median ${mh?.toFixed(2)}, good ${halfGoodWinterreise})`);
const lowered = tally.guitar.lowered + tally.winterreise.lowered;
console.log(`P4 (the half grid lowers roots on no more than 2 of 20 items): ${lowered <= 2 ? "PASS" : "FAIL"} (${lowered})`);
const lifted = tally.guitar.lifted + tally.winterreise.lifted;
const n = tally.guitar.n + tally.winterreise.n;
console.log(`S43-D1: half grid lifts roots on ${lifted}/${n}, lowers ${lowered} -> ${lifted >= 0.6 * n && lowered <= 2 ? "recommend the half-bar grid for the automatic draft" : lowered > lifted ? "recommend the bar grid (half hurts)" : "no grid change recommended (mixed)"}`);
const toks = (grid: string) => ordered.map(([s]) => cellOf(s, grid)?.tokens?.in ?? 0).reduce((a, b) => a + b, 0);
console.log(`input tokens: bar ${toks("bar")}, half ${toks("half")} (${(toks("half") / Math.max(1, toks("bar"))).toFixed(2)}x)`);
