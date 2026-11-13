/**
 * Study 52 (docs/BRIEF-STUDY52.md), $0: another transcriber for the bass
 * stems, as the line itself and as the second reader Study 51 lacked.
 * Needs scripts/study52-<reader>.py to have written each reader's notes and
 * scripts/study52-notes.py to have scored them. Grading is Study 48's bar
 * grade with Study 50's line grade and Study 51's trusted-bar scoring.
 *   bun scripts/run-study52.ts            # preflight, then every reader present
 *   bun scripts/run-study52.ts --check    # preflight only: no new score is computed
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { type BarLine, barsOf, meantNotes, type Note, quantizeBar } from "../src/study48/bassLine.js";
import { spanOf } from "../src/study49/grade.js";
import { bassConstrain } from "../src/study49/rules.js";
import { type Grade50, gradeLines } from "../src/study50/grid.js";
import { addBar, coverage, emptyScore, precision, type TrustScore, wrongShare } from "../src/study51/trust.js";
import { RULES52, RULES52B, trusts52, trusts52b } from "../src/study52/second.js";

const root = new URL("../", import.meta.url).pathname;
const checkOnly = process.argv.includes("--check");
const read = <T>(p: string) => JSON.parse(readFileSync(p, "utf8")) as T;
type Grid = { beats: number[]; downbeats: number[]; duration: number };
const manifest = read<{ entries: Record<string, { raw: string; midiToMixSec: number; appStemOffset: { offsetSec: number } }> }>(`${root}corpus/study48-manifest.json`);
const grids: Record<string, Grid> = { ...read<Record<string, Grid>>(`${root}corpus/study44-app-beats.json`), ...read<Record<string, Grid>>(`${root}corpus/study48-extra-beats.json`) };
const study49 = read<{ partC: { selected: string; configs: Record<string, Record<string, { bars: number; right: number; oneError: number; wrong: number; found: number; extra: number }>> } }>(`${root}results/study49.json`);
const BP = study49.partC.selected;
const READERS = ["hfbass", "muscriptor"] as const;
type Reader = (typeof READERS)[number];
const HELPS = { right: 0.7, wrong: 0.1 };
const D2 = { gain: 0.1, worst: -0.02 };
const TRUST = { right: 0.7, wrong: 0.1, coverage: 0.25 };

const slugs = Object.keys(manifest.entries);
const rulesOf = (r: string): readonly string[] => (r === "hfbass" ? RULES52 : RULES52B);
const dirOf = (slug: string) => `${root}${manifest.entries[slug]!.raw.slice(0, manifest.entries[slug]!.raw.lastIndexOf("/"))}`;
const readers = READERS.filter((r) => slugs.every((s) => existsSync(`${dirOf(s)}/study52/${r}.json`)));
if (!readers.length) throw new Error("no reader's notes found: run scripts/study52-hfbass.py first");

interface SongCells {
	bp: Grade50;
	lines: Record<string, Grade50>;
	trust: Record<string, Record<string, TrustScore>>;
}
const cells: Record<string, SongCells> = {};
const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;
for (const slug of slugs) {
	const e = manifest.entries[slug]!;
	const dir = dirOf(slug);
	const g = grids[slug]!;
	const bars = barsOf(g.beats, g.downbeats, g.duration);
	const off = e.appStemOffset.offsetSec;
	const truth = meantNotes(
		read<{ notes: { start: number; end: number; pitch: number }[] }>(`${dir}/midi-notes.json`).notes.map((n) => ({ start: n.start + e.midiToMixSec, end: n.end + e.midiToMixSec, pitch: n.pitch - 12 })),
		bars,
	);
	const span = spanOf(truth, bars);
	const linesOf = (notes: Note[]): BarLine[] => {
		const meant = meantNotes(notes, bars);
		return span.map((b) => quantizeBar(meant, b));
	};
	const truthLines = span.map((b) => quantizeBar(truth, b));
	const shift = (rows: [number, number, number, number][]): Note[] => rows.map(([s, d, p]) => ({ start: s + off, end: s + d + off, pitch: p }));
	const bpLines = linesOf(bassConstrain(shift(read<[number, number, number, number][]>(`${dir}/study49/${BP}.json`))));
	const pyinLines = linesOf(read<Note[]>(`${dir}/notes-pyin-mix.json`));
	const bp = gradeLines(truthLines, bpLines);
	// preflight: Basic Pitch's selected configuration through this runner is Study 49's, bar for bar
	const s49 = study49.partC.configs[BP]![slug]!;
	if (bp.bars !== s49.bars || bp.right !== s49.right || bp.oneError !== s49.oneError || bp.wrong !== s49.wrong || bp.found !== s49.found || bp.extra !== s49.extra) throw new Error(`${slug}: Basic Pitch through this runner does not reproduce Study 49`);
	cells[slug] = { bp, lines: {}, trust: {} };
	let hfLines: BarLine[] | null = null;
	for (const r of readers) {
		const raw = shift(read<[number, number, number, number][]>(`${dir}/study52/${r}.json`));
		const constrained = bassConstrain(raw);
		// preflight: the two ports of the bass constraint agree on this reader's notes (the Python one wrote its list when it scored them)
		const py = `${dir}/notes-${r}-bass-mix.json`;
		if (existsSync(py)) {
			const theirs = read<Note[]>(py);
			if (theirs.length !== constrained.length || theirs.some((n, i) => !close(n.start, constrained[i]!.start) || !close(n.end, constrained[i]!.end) || n.pitch !== constrained[i]!.pitch)) throw new Error(`${slug} ${r}: the bass constraint's two ports disagree`);
		} else if (!checkOnly) throw new Error(`run scripts/study52-notes.py first (${slug} ${r})`);
		const shownLines = linesOf(constrained);
		cells[slug]!.lines[r] = gradeLines(truthLines, linesOf(raw));
		cells[slug]!.lines[`${r}-bass`] = gradeLines(truthLines, shownLines);
		// arm 2's readers are also compared with arm 1's (the amendment of 2026-11-13)
		const rules = rulesOf(r);
		const scores = Object.fromEntries(rules.map((k) => [k, emptyScore()])) as Record<string, TrustScore>;
		if (r === "hfbass") hfLines = shownLines;
		for (let i = 0; i < span.length; i++) {
			const t: Record<string, boolean> = r === "hfbass" ? trusts52(shownLines[i]!, bpLines[i]!, pyinLines[i]!) : trusts52b(shownLines[i]!, bpLines[i]!, pyinLines[i]!, hfLines![i]!);
			for (const k of rules) addBar(scores[k]!, truthLines[i]!, shownLines[i]!, t[k]!);
		}
		cells[slug]!.trust[r] = scores;
	}
}
console.log(`preflight: ${slugs.length} songs; Basic Pitch (${BP}) through this runner reproduces Study 49; readers present: ${readers.join(", ")}`);
if (checkOnly) process.exit(0);

const notesScores = read<{ songs: Record<string, Record<string, { exact: { f: number }; pitchClass: { f: number }; onsetOnly: { f: number }; octave: { rate: number | null } }>> }>(`${root}results/study52-notes.json`).songs;
const pct = (x: number) => `${(100 * x).toFixed(0)} %`;
const pts = (x: number) => `${x >= 0 ? "+" : ""}${(100 * x).toFixed(1)}`;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const right = (g: Grade50) => g.right / Math.max(1, g.bars);
const wrong = (g: Grade50) => g.wrong / Math.max(1, g.bars);
const out: Record<string, unknown> = {};
for (const r of readers as Reader[]) {
	const primary = `${r}-bass`;
	console.log(`\n==== ${r}`);
	console.log("-- the line (bars right / wrong of the graded bars, slot F, found and extra onsets), beside Basic Pitch");
	for (const s of slugs) {
		const c = cells[s]!;
		const row = (name: string, g: Grade50) => `${name} ${pct(right(g))}/${pct(wrong(g))} F ${g.slotF.toFixed(3)} found ${pct(g.found / Math.max(1, g.truthOnsets))} extra ${g.extra}`;
		const ns = notesScores[s]![primary]!;
		console.log(`${s.padEnd(18)} ${row("bp", c.bp)} | ${row(r, c.lines[r]!)} | ${row(primary, c.lines[primary]!)} | notes: exact F ${ns.exact.f.toFixed(3)}, class ${ns.pitchClass.f.toFixed(3)}, onset ${ns.onsetOnly.f.toFixed(3)}, octave errors ${pct(ns.octave.rate ?? 0)}`);
	}
	const gain = slugs.map((s) => right(cells[s]!.lines[primary]!) - right(cells[s]!.bp));
	console.log(`mean bars right: Basic Pitch ${(100 * mean(slugs.map((s) => right(cells[s]!.bp)))).toFixed(1)} %, ${r} ${(100 * mean(slugs.map((s) => right(cells[s]!.lines[r]!)))).toFixed(1)} %, ${primary} ${(100 * mean(slugs.map((s) => right(cells[s]!.lines[primary]!)))).toFixed(1)} %; gain ${slugs.map((s, i) => `${s} ${pts(gain[i]!)}`).join(", ")}; mean ${pts(mean(gain))}`);

	const rules = rulesOf(r);
	const pooled = Object.fromEntries(
		rules.map((k) => {
			const t = emptyScore();
			for (const s of slugs) for (const f of Object.keys(t) as (keyof TrustScore)[]) t[f] += cells[s]!.trust[r]![k]![f];
			return [k, t];
		}),
	) as Record<string, TrustScore>;
	console.log(`-- bars of the ${primary} line shown when another reading agrees`);
	for (const k of rules) {
		console.log(`${k}:`);
		for (const s of [...slugs, "pooled"]) {
			const t = s === "pooled" ? pooled[k]! : cells[s]!.trust[r]![k]!;
			console.log(`  ${s.padEnd(18)} shows ${String(t.shown).padStart(3)} of ${String(t.bars).padStart(3)} (${pct(coverage(t)).padStart(5)}): right ${pct(precision(t)).padStart(5)}, wrong ${pct(wrongShare(t)).padStart(5)} | rests ${t.rests}, ${t.restsRight} right | part written right ${pct(t.notesShownRight / Math.max(1, t.truthOnsets))}`);
		}
	}
	const meets = (k: string) => slugs.every((s) => precision(cells[s]!.trust[r]![k]!) >= TRUST.right && wrongShare(cells[s]!.trust[r]![k]!) <= TRUST.wrong && coverage(cells[s]!.trust[r]![k]!) >= TRUST.coverage);
	const qualifying = rules.filter((k) => k !== "everyBar" && meets(k)).sort((a, b) => coverage(pooled[b]!) - coverage(pooled[a]!));
	const clears = slugs.filter((s) => right(cells[s]!.lines[primary]!) >= HELPS.right && wrong(cells[s]!.lines[primary]!) <= HELPS.wrong);

	if (r === "hfbass") {
		console.log("-- predictions");
		const better = slugs.filter((_, i) => gain[i]! > 0).length;
		console.log(`P1 (more bars right than Basic Pitch on at least five of six songs): ${better} of 6 -> ${better >= 5 ? "PASS" : "FAIL"}`);
		const m = mean(slugs.map((s) => right(cells[s]!.lines[primary]!)));
		console.log(`P2 (mean bars right at least 60 %): ${(100 * m).toFixed(1)} % -> ${m >= 0.6 ? "PASS" : "FAIL"}`);
		console.log(`P3 (clears Study 48's bar on at most three songs): ${clears.length} (${clears.join(", ") || "none"}) -> ${clears.length <= 3 ? "PASS" : "FAIL"}`);
		const oct = slugs.map((s) => notesScores[s]![primary]!.octave.rate ?? 0);
		console.log(`P4 (octave errors at most 3 % on every song): ${slugs.map((s, i) => `${s} ${pct(oct[i]!)}`).join(", ")} -> ${oct.every((x) => x <= 0.03) ? "PASS" : "FAIL"}`);
		const cov = slugs.filter((s) => coverage(cells[s]!.trust[r]!.bp!) >= 0.25).length;
		console.log(`P5 (agreement with Basic Pitch shows a quarter of the bars on at least five songs, and those bars are at least 80 % right pooled): ${cov} of 6, ${pct(precision(pooled.bp!))} -> ${cov >= 5 && precision(pooled.bp!) >= 0.8 ? "PASS" : "FAIL"}`);
		console.log(`P6 (no agreement rule meets Study 51's bar on every song): ${qualifying.length ? qualifying.join(", ") : "none"} -> ${qualifying.length === 0 ? "PASS" : "FAIL"}`);
	}
	if (r === "muscriptor") {
		console.log("-- predictions (written at the first registration, before arm 1 ran)");
		const better = slugs.filter((_, i) => gain[i]! > 0).length;
		console.log(`M1 (more bars right than Basic Pitch on at least five of six songs): ${better} of 6 -> ${better >= 5 ? "PASS" : "FAIL"}`);
		const mine = mean(slugs.map((s) => right(cells[s]!.lines[primary]!)));
		const hf = mean(slugs.map((s) => right(cells[s]!.lines["hfbass-bass"]!)));
		console.log(`M2 (mean bars right below hfbass's): ${(100 * mine).toFixed(1)} % against ${(100 * hf).toFixed(1)} % -> ${mine < hf ? "PASS" : "FAIL"}`);
		console.log(`M3 (bars where hfbass and MuScriptor write the same line are at least 85 % right pooled): ${pct(precision(pooled.hfbass!))} of ${pooled.hfbass!.shown} bars (${pct(coverage(pooled.hfbass!))} shown) -> ${precision(pooled.hfbass!) >= 0.85 ? "PASS" : "FAIL"}`);
	}
	console.log("-- decisions");
	console.log(`S52-D1 (the line is shown: 70 % of bars right and at most 10 % wrong on every song): cleared on ${clears.length ? clears.join(", ") : "no song"} -> ${clears.length === slugs.length ? "yes" : "no"}`);
	const d2 = mean(gain) >= D2.gain && Math.min(...gain) >= D2.worst;
	console.log(`S52-D2 (a better first reader than Basic Pitch: mean gain of 10 points, no song down more than 2): mean ${pts(mean(gain))}, worst ${pts(Math.min(...gain))} -> ${d2 ? "yes" : "no"}`);
	for (const k of rules) console.log(`  ${k.padEnd(9)} songs at 70 % right ${slugs.filter((s) => precision(cells[s]!.trust[r]![k]!) >= TRUST.right).length}, at 10 % wrong or under ${slugs.filter((s) => wrongShare(cells[s]!.trust[r]![k]!) <= TRUST.wrong).length}, showing a quarter or more ${slugs.filter((s) => coverage(cells[s]!.trust[r]![k]!) >= TRUST.coverage).length}; all three ${slugs.filter((s) => precision(cells[s]!.trust[r]![k]!) >= TRUST.right && wrongShare(cells[s]!.trust[r]![k]!) <= TRUST.wrong && coverage(cells[s]!.trust[r]![k]!) >= TRUST.coverage).length} of ${slugs.length}`);
	console.log(`S52-D3 (trusted bars: Study 51's bar on every song): ${qualifying.length ? `recommend ${qualifying[0]}` : "no rule recommended"}`);
	out[r] = { lines: Object.fromEntries(slugs.map((s) => [s, { bp: cells[s]!.bp, [r]: cells[s]!.lines[r], [primary]: cells[s]!.lines[primary] }])), trust: Object.fromEntries(slugs.map((s) => [s, cells[s]!.trust[r]])), pooled, gain: Object.fromEntries(slugs.map((s, i) => [s, gain[i]])), decisions: { d1: clears.length === slugs.length, clears, d2, d3: qualifying[0] ?? null } };
}
writeFileSync(`${root}results/study52.json`, `${JSON.stringify({ registered: "docs/BRIEF-STUDY52.md", spend: 0, basicPitch: BP, bounds: { helps: HELPS, d2: D2, trust: TRUST }, readers: out }, null, "\t")}\n`);
console.log(`\nresults/study52.json written (${slugs.length} songs, readers ${readers.join(", ")}, $0)`);
