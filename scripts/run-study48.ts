/**
 * Study 48 (docs/BRIEF-STUDY48.md), Asks C and D, $0: each transcription's
 * notes and the MIDI truth on the app's own beats (corpus/study44-app-beats.json),
 * quantized bar by bar (src/study48/bassLine.ts), graded, and written as a
 * barmark `Bs` line that barmark 0.17 must read without error.
 * Needs scripts/study48-notes.py to have written the note lists first.
 *   bun scripts/run-study48.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseChart } from "barmark-0-17";
import { type Bar, type BarLine, barsOf, gradeBar, meantNotes, type Note, quantizeBar, writeLines } from "../src/study48/bassLine.js";

const root = new URL("../", import.meta.url).pathname;
const PIPELINES = ["bp", "bp-bass", "pyin"] as const;
/** The registered bar for a written line to help more than it misleads. */
const HELPS = { right: 0.7, wrong: 0.1 };
const manifest = JSON.parse(readFileSync(`${root}corpus/study48-manifest.json`, "utf8")) as { entries: Record<string, { raw: string; label: string; midiToMixSec: number | null }> };
const appBeats = JSON.parse(readFileSync(`${root}corpus/study44-app-beats.json`, "utf8")) as Record<string, { beats: number[]; downbeats: number[]; duration: number }>;
const notesScores = existsSync(`${root}results/study48-notes.json`) ? (JSON.parse(readFileSync(`${root}results/study48-notes.json`, "utf8")) as { songs: Record<string, Record<string, { exact: { f: number }; octave: { rate: number | null; up: number; down: number }; byRegister: Record<string, { matchedClass: number; octaveWrong: number }> }>> }) : null;
const linesDir = `${root}results/study48-lines`;
mkdirSync(linesDir, { recursive: true });

interface Summary {
	bars: number;
	right: number;
	oneError: number;
	wrong: number;
	rhythmExact: number;
	truthNotes: number;
	rhythmRight: number;
	pitchClassRight: number;
	pitchRight: number;
	tripletBarsTruth: number;
	tripletBarsEst: number;
	barmarkErrors: number;
}

function chartOf(slug: string, label: string, lines: BarLine[], bars: Bar[], bpm: number): string {
	const text = writeLines(
		lines,
		bars.map((b) => b.beats.length),
	);
	return `# ${slug} (${label})\ntime: 4/4\ntempo: ${Math.round(bpm)}\npart: Bs = Bass, instrument: electric bass\n\n## Bass\n${text}\n`;
}
function barmarkErrors(chart: string): number {
	const p = parseChart(chart) as { diagnostics: { severity: string }[] };
	return p.diagnostics.filter((d) => d.severity === "error").length;
}

const out: Record<string, Record<string, Summary>> = {};
for (const [slug, e] of Object.entries(manifest.entries)) {
	const dir = `${root}${e.raw.slice(0, e.raw.lastIndexOf("/"))}`;
	const grid = appBeats[slug];
	if (!grid) throw new Error(`no app beats for ${slug}`);
	if (!existsSync(`${dir}/truth-mix.json`)) throw new Error(`run scripts/study48-notes.py first (${slug})`);
	const bars = barsOf(grid.beats, grid.downbeats, grid.duration);
	const bpm = 60 / (grid.beats.slice(1).map((b, i) => b - grid.beats[i]!).sort((a, b) => a - b)[Math.floor(grid.beats.length / 2)] ?? 0.5);
	const truthAll = meantNotes(JSON.parse(readFileSync(`${dir}/truth-mix.json`, "utf8")) as Note[], bars);
	const first = bars.findIndex((b) => truthAll.some((n) => n.start >= b.start && n.start < b.end));
	let last = bars.length - 1;
	while (last > first && !truthAll.some((n) => n.start >= bars[last]!.start && n.start < bars[last]!.end)) last--;
	const span = bars.slice(first, last + 1);
	const truthLines = span.map((b) => quantizeBar(truthAll, b));
	writeFileSync(`${linesDir}/${slug}-truth.chart.md`, chartOf(slug, "MIDI truth", truthLines, span, bpm));
	out[slug] = {};
	console.log(`\n${slug}: ${span.length} bars graded (bars ${first + 1} to ${last + 1} of the mix's ${bars.length}), ${truthAll.length} truth notes, ${bpm.toFixed(1)} bpm`);
	for (const p of PIPELINES) {
		const est = meantNotes(JSON.parse(readFileSync(`${dir}/notes-${p}-mix.json`, "utf8")) as Note[], bars);
		const estLines = span.map((b) => quantizeBar(est, b));
		const s: Summary = { bars: span.length, right: 0, oneError: 0, wrong: 0, rhythmExact: 0, truthNotes: 0, rhythmRight: 0, pitchClassRight: 0, pitchRight: 0, tripletBarsTruth: 0, tripletBarsEst: 0, barmarkErrors: 0 };
		for (let i = 0; i < span.length; i++) {
			const g = gradeBar(truthLines[i]!, estLines[i]!);
			if (g.cls === "right") s.right++;
			else if (g.cls === "one-error") s.oneError++;
			else s.wrong++;
			if (g.rhythmExact) s.rhythmExact++;
			s.truthNotes += g.truthNotes;
			s.rhythmRight += g.rhythmRight;
			s.pitchClassRight += g.pitchClassRight;
			s.pitchRight += g.pitchRight;
			if (truthLines[i]!.mode === "triplet") s.tripletBarsTruth++;
			if (estLines[i]!.mode === "triplet") s.tripletBarsEst++;
		}
		const chart = chartOf(slug, `${e.label}, ${p}`, estLines, span, bpm);
		s.barmarkErrors = barmarkErrors(chart);
		writeFileSync(`${linesDir}/${slug}-${p}.chart.md`, chart);
		out[slug][p] = s;
		const pc = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(0)} %` : "-");
		console.log(`  ${p.padEnd(8)} bars right ${pc(s.right, s.bars).padStart(5)}  one error ${pc(s.oneError, s.bars).padStart(5)}  wrong ${pc(s.wrong, s.bars).padStart(5)} | rhythm exact ${pc(s.rhythmExact, s.bars).padStart(5)} | notes on the right slot ${pc(s.rhythmRight, s.truthNotes)}, right class ${pc(s.pitchClassRight, s.truthNotes)}, right pitch ${pc(s.pitchRight, s.truthNotes)} | triplet bars truth ${s.tripletBarsTruth} est ${s.tripletBarsEst} | barmark errors ${s.barmarkErrors}`);
	}
}

// predictions and the decision
const songs = Object.keys(out);
const share = (s: Summary, k: "right" | "wrong" | "rhythmRight") => (k === "rhythmRight" ? s.rhythmRight / Math.max(1, s.truthNotes) : s[k] / Math.max(1, s.bars));
const best = (slug: string) => PIPELINES.reduce((a, b) => (share(out[slug]![b]!, "right") > share(out[slug]![a]!, "right") ? b : a));
console.log("\n== predictions");
if (notesScores) {
	const ns = notesScores.songs;
	const p1 = songs.every((s) => (ns[s]!.bp!.octave.rate ?? 0) >= 0.3 && ns[s]!.bp!.octave.up > ns[s]!.bp!.octave.down);
	console.log(`P1 (Basic Pitch: octave error rate >= 30 % on every song, mostly upward): ${songs.map((s) => `${s} ${((ns[s]!.bp!.octave.rate ?? 0) * 100).toFixed(0)} % (up ${ns[s]!.bp!.octave.up}, down ${ns[s]!.bp!.octave.down})`).join("; ")} -> ${p1 ? "PASS" : "FAIL"}`);
	const p2 = songs.every((s) => {
		const r = ns[s]!.bp!.byRegister;
		const rate = (k: string) => (r[k]!.matchedClass ? r[k]!.octaveWrong / r[k]!.matchedClass : -1);
		return Object.keys(r).every((k) => rate("E1-A1") >= rate(k));
	});
	console.log(`P2 (the E1-A1 register has the highest octave error rate on every song): ${p2 ? "PASS" : "FAIL"}`);
	const p3 = songs.every((s) => ns[s]!["bp-bass"]!.exact.f - ns[s]!.bp!.exact.f >= 0.15);
	console.log(`P3 (the bass constraint lifts octave-exact F by >= 0.15 on every song): ${songs.map((s) => `${s} ${ns[s]!.bp!.exact.f.toFixed(3)} -> ${ns[s]!["bp-bass"]!.exact.f.toFixed(3)}`).join("; ")} -> ${p3 ? "PASS" : "FAIL"}`);
	const p4 = songs.every((s) => ns[s]!.pyin!.exact.f > ns[s]!["bp-bass"]!.exact.f);
	console.log(`P4 (pYIN's octave-exact F above the constrained Basic Pitch's on every song): ${songs.map((s) => `${s} pyin ${ns[s]!.pyin!.exact.f.toFixed(3)}`).join("; ")} -> ${p4 ? "PASS" : "FAIL"}`);
}
const p5 = songs.every((s) => share(out[s]![best(s)]!, "rhythmRight") >= 0.8);
console.log(`P5 (best pipeline: >= 80 % of truth notes on the right slot on every song): ${songs.map((s) => `${s} ${best(s)} ${(share(out[s]![best(s)]!, "rhythmRight") * 100).toFixed(0)} %`).join("; ")} -> ${p5 ? "PASS" : "FAIL"}`);
const p6 = !PIPELINES.some((p) => songs.every((s) => share(out[s]![p]!, "right") >= 0.7));
console.log(`P6 (no pipeline reaches 70 % bars entirely right on every song): ${p6 ? "PASS" : "FAIL"}`);
const clears = PIPELINES.filter((p) => songs.every((s) => share(out[s]![p]!, "right") >= HELPS.right && share(out[s]![p]!, "wrong") <= HELPS.wrong));
const verdict = clears.length === 0 ? "no: no pipeline clears the bar on every song" : clears.includes("bp") || clears.includes("bp-bass") ? `yes: ${clears.filter((p) => p !== "pyin").join(", ")} clears it` : "only with a monophonic tracker: pyin alone clears it";
console.log(`S48-D1 (${HELPS.right * 100} % bars right and <= ${HELPS.wrong * 100} % wrong, every song): ${verdict}`);
writeFileSync(`${root}results/study48.json`, `${JSON.stringify({ registered: "docs/BRIEF-STUDY48.md", spend: 0, helps: HELPS, songs: out, verdict }, null, "\t")}\n`);
console.log(`\nresults/study48.json written (${songs.length} songs, $0)`);
