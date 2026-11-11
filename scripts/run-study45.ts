/**
 * Study 45 Arm 1 (docs/BRIEF-STUDY45.md): Study 43's pipeline with one
 * registered prompt deviation, system45 (src/study45/prompt45.ts: the
 * production step-0 "rock musician" clause replaced by a style-neutral
 * clause about chord quality), on Beat This small0's bars as read: the
 * twelve GuitarSet SS2 takes (against Study 43's bar-grid drafts) and the
 * ten Woodward songs (against Study 41's small0 drafts). Fence $2.50,
 * hard stop before the next draft. Derived from run-study43.ts; the
 * grid, transcription, hints, grading and class rule are unchanged.
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
 * every draft to results/study45.json.
 */
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import * as v from "valibot";
import type { Note } from "../src/fixture/chords.js";
import { describeBars } from "../src/fixture/chords.js";
import { ChartDraftAnswerSchema } from "../src/harness/runner.js";
import { expandChords } from "../src/study23/grade23.js";
import { question23 } from "../src/study23/prompt23.js";
import { system45 } from "../src/study45/prompt45.js";
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
const dir = mkdtempSync(join(tmpdir(), "stem-bench45-"));
const USD_IN = 2;
const USD_OUT = 15;
const FENCE = 2.5;
const MIN_NOTES_PER_BAR = 3;
const OUT = `${root}results/study45.json`;
/** The grid resolutions: the tracker's bar as read, and the bar split at the tracker beat nearest its midpoint
 *  (two cells a bar, so the one-chord-per-cell draft can carry two chords a bar). A "beat" grid is implemented
 *  but not registered for this study (cost); it stays here for a later one. */
const GRIDS = ["bar"] as const;
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
	group: "guitar" | "winterreise" | "woodward";
	seconds: number;
}
const m43 = JSON.parse(readFileSync(`${root}corpus/study43-manifest.json`, "utf8")) as { entries: Record<string, Entry> };
const m38 = JSON.parse(readFileSync(`${root}corpus/study38-manifest.json`, "utf8")) as { entries: Record<string, Entry> };
const manifest: { entries: Record<string, Entry> } = { entries: {} };
for (const [slug, e] of Object.entries(m43.entries)) if (e.group === "guitar") manifest.entries[slug] = e;
for (const [slug, e] of Object.entries(m38.entries)) if (e.arm === "A") manifest.entries[slug] = { ...e, group: "woodward", seconds: statSync(`${root}${e.raw}`).size / 4 / RATE };
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
// registered order: the twelve guitar takes (shortest first), then the ten Woodward songs (shortest first)
const ordered = Object.entries(manifest.entries).sort((a, b) => (a[1].group === b[1].group ? a[1].seconds - b[1].seconds : a[1].group === "guitar" ? -1 : 1));
for (const [slug, e] of ordered) {
	for (const grid of GRIDS) jobs.push({ key: `${slug}|quality`, slug, e, grid });
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
		system: system45(),
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

// S45-D1 and P2 to P5, from the cells against the baselines
interface Base {
	roots?: { right: number; bearing: number };
	quals?: { right: number; bearing: number };
	class: string;
	rawDraft?: string;
}
const s43 = (JSON.parse(readFileSync(`${root}results/study43.json`, "utf8")) as { results: Record<string, Base> }).results;
const s41 = (JSON.parse(readFileSync(`${root}results/study41.json`, "utf8")) as { results: Record<string, Base> }).results;
const pct = (r?: { right: number; bearing: number }) => (r && r.bearing ? r.right / r.bearing : null);
const fmt = (c?: Base) => (c ? `${c.roots ? `${c.roots.right}/${c.roots.bearing}` : "-"} q ${c.quals ? `${c.quals.right}/${c.quals.bearing}` : "-"} ${c.class}` : "-");
const hasPower = (c?: Base) => !!c?.rawDraft && /\b[A-G][#b]?5\b/.test(c.rawDraft.match(/"chords"\s*:\s*"([^"]*)"/)?.[1] ?? "");
const tally = { guitar: { n: 0, qualUp: 0, qualDown: 0, rootDown: 0, goodBefore: 0, goodAfter: 0, powerBefore: 0, powerAfter: 0 }, woodward: { n: 0, qualUp: 0, qualDown: 0, rootDown: 0, classDown: 0, goodBefore: 0, goodAfter: 0 } };
console.log("\nagainst the production prompt on the same bars:");
for (const [slug, e] of ordered) {
	const after = results[`${slug}|quality`] as Base | undefined;
	const before = e.group === "guitar" ? s43[`${slug}|bar`] : s41[`${slug}|beatthis-small0`];
	if (!after || !before) continue;
	console.log(`  ${slug.padEnd(26)} production ${fmt(before).padEnd(36)} quality clause ${fmt(after)}${e.group === "guitar" ? ` | power chords ${hasPower(before)} -> ${hasPower(after)}` : ""}`);
	if (!before.roots || !after.roots) continue;
	const t = tally[e.group === "guitar" ? "guitar" : "woodward"];
	t.n++;
	const qb = pct(before.quals) ?? 0;
	const qa = pct(after.quals) ?? 0;
	if (qa > qb) t.qualUp++;
	if (qa < qb) t.qualDown++;
	if ((pct(after.roots) ?? 0) < (pct(before.roots) ?? 0)) t.rootDown++;
	if (before.class === "good") t.goodBefore++;
	if (after.class === "good") t.goodAfter++;
	if (e.group === "guitar") {
		if (hasPower(before)) tally.guitar.powerBefore++;
		if (hasPower(after)) tally.guitar.powerAfter++;
	} else if (before.class === "good" && after.class !== "good") tally.woodward.classDown++;
}
const g = tally.guitar;
const w = tally.woodward;
console.log(`guitar (${g.n} paired): qualities up ${g.qualUp}, down ${g.qualDown}; roots down ${g.rootDown}; good ${g.goodBefore} -> ${g.goodAfter}; drafts with a power chord ${g.powerBefore} -> ${g.powerAfter}`);
console.log(`woodward (${w.n} paired): qualities up ${w.qualUp}, down ${w.qualDown}; roots down ${w.rootDown}; good ${w.goodBefore} -> ${w.goodAfter}; class lowered ${w.classDown}`);
console.log(`P2 (guitar: qualities up on >= 6 of 12 and good +2 or more): ${g.qualUp >= 6 && g.goodAfter >= g.goodBefore + 2 ? "PASS" : "FAIL"}`);
console.log(`P3 (guitar: roots down on none): ${g.rootDown === 0 ? "PASS" : "FAIL"}`);
console.log(`P4 (woodward: roots down on <= 1, class lowered on none): ${w.rootDown <= 1 && w.classDown === 0 ? "PASS" : "FAIL"}`);
console.log(`P5 (guitar: no draft under the quality clause writes a power chord): ${g.powerAfter === 0 ? "PASS" : "FAIL"}`);
console.log(`S45-D1: ${g.qualUp >= 6 && g.rootDown === 0 && w.classDown === 0 ? "recommend the quality clause to the app" : g.qualDown > g.qualUp || w.classDown > 0 ? "keep production's clause" : "mixed: report, no recommendation"}`);
