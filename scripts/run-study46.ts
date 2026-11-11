/**
 * Study 46 (docs/BRIEF-STUDY46.md), $0: the ChordMini hint's ceiling over
 * the whole of GuitarSet. For each of the 360 excerpts the per-bar hint
 * is the same ChordMini vote the drafts see (scripts/study10/nchord.py on
 * the annotated bars), the truth per bar is the lead sheet's chord at the
 * bar start (and, secondarily, the player's performed chord), scored by
 * src/study46/score.ts. Hints are cached per excerpt in
 * results/study46-hints.json so a rerun costs nothing; aggregates go to
 * results/study46.json.
 *   bun scripts/run-study46.ts
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { peakNorm } from "../src/study33/stereo.js";
import { chordAtBars, type TimedChord } from "../src/study38/truth.js";
import { addScore, emptyScore, type HintScore, hintScore } from "../src/study46/score.js";

const root = new URL("../", import.meta.url).pathname;
const RATE = 22050;
const PY = `${root}.venv-study10/bin/python`;
const NCHORD = `${root}scripts/study10/nchord.py`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench46-"));
interface Entry {
	raw: string;
	seconds: number;
	player: string;
	style: string;
	sheet: string;
	mode: "comp" | "solo";
	bpm: number;
	key: string;
	meter: string;
	instructed: TimedChord[];
	performed: TimedChord[] | null;
	annotatedBars: number[];
}
const manifest = JSON.parse(readFileSync(`${root}corpus/study46-manifest.json`, "utf8")) as { entries: Record<string, Entry> };
const HINTS = `${root}results/study46-hints.json`;
const hints: Record<string, { barStarts: number[]; perBar: string[] }> = existsSync(HINTS) ? JSON.parse(readFileSync(HINTS, "utf8")) : {};

function nchordPerBar(samples: Float32Array, barStarts: number[], name: string): string[] {
	const rawFile = join(dir, `${name}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	const barsFile = `${rawFile}.bars.json`;
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const np = Bun.spawnSync([PY, NCHORD, "--raw", rawFile, "--out", `${barsFile}.out`, "--bars", barsFile], { maxBuffer: 64 * 1024 * 1024 });
	if (np.exitCode !== 0) throw new Error(`nchord failed (${name}): ${np.stderr.toString().slice(0, 300)}`);
	return (JSON.parse(readFileSync(`${barsFile}.out`, "utf8")) as { perBar: string[] }).perBar.map((c) => (c === "" ? "N.C." : c));
}

const per: Record<string, { style: string; mode: string; sheet: string; player: string; bars: number; instructed: HintScore; performed: HintScore | null }> = {};
let done = 0;
const t0 = Date.now();
for (const [slug, e] of Object.entries(manifest.entries)) {
	let barStarts = e.annotatedBars;
	if (barStarts.length && barStarts[barStarts.length - 1]! < e.seconds - 0.25) barStarts = [...barStarts, e.seconds];
	if (!hints[slug] || hints[slug].barStarts.length !== barStarts.length) {
		const buf = readFileSync(`${root}${e.raw}`);
		const mono = peakNorm(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
		hints[slug] = { barStarts, perBar: nchordPerBar(mono, barStarts, slug) };
		if (++done % 10 === 0) {
			writeFileSync(HINTS, JSON.stringify(hints));
			console.log(`  ${done} excerpts hinted, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
		}
	}
	const cellStarts = barStarts.slice(0, -1);
	const truth = chordAtBars(e.instructed, cellStarts);
	const inst = hintScore(truth, hints[slug].perBar);
	const perf = e.performed ? hintScore(chordAtBars(e.performed, cellStarts), hints[slug].perBar) : null;
	per[slug] = { style: e.style, mode: e.mode, sheet: e.sheet, player: e.player, bars: cellStarts.length, instructed: inst, performed: perf };
}
writeFileSync(HINTS, JSON.stringify(hints));

// --- aggregates ----------------------------------------------------------
const groups: Record<string, HintScore> = {};
const add = (k: string, s: HintScore) => addScore((groups[k] ??= emptyScore()), s);
for (const [, p] of Object.entries(per)) {
	add("all|instructed", p.instructed);
	add(`mode:${p.mode}|instructed`, p.instructed);
	add(`style:${p.style}|instructed`, p.instructed);
	add(`style:${p.style}:${p.mode}|instructed`, p.instructed);
	if (p.performed) {
		add("all|performed", p.performed);
		add(`mode:${p.mode}|performed`, p.performed);
	}
}
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)} %` : "-");
console.log("\n== the hint against the lead sheet, per bar");
for (const [k, g] of Object.entries(groups).sort()) console.log(`  ${k.padEnd(28)} bars ${String(g.bars).padStart(5)}  root ${pct(g.rootRight, g.bars).padStart(7)}  family ${pct(g.familyRight, g.bars).padStart(7)}  chord ${pct(g.chordRight, g.bars).padStart(7)}`);
const all = groups["all|instructed"]!;
console.log("\n== by the sheet's quality family (instructed, all excerpts)");
for (const [fam, v] of Object.entries(all.byFamily).sort((a, b) => b[1].n - a[1].n)) console.log(`  ${fam.padEnd(6)} bars ${String(v.n).padStart(5)}  root ${pct(v.rootRight, v.n).padStart(7)}  family ${pct(v.familyRight, v.n).padStart(7)}  hint families: ${Object.entries(all.confusion[fam] ?? {}).sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h} ${n}`).join(", ")}`);
const comp = groups["mode:comp|instructed"]!;
const solo = groups["mode:solo|instructed"]!;
const fam = (k: string) => all.byFamily[k] ?? { n: 0, rootRight: 0, familyRight: 0 };
const r = (v: { n: number; familyRight: number }) => (v.n ? v.familyRight / v.n : 0);
console.log("\n== predictions");
console.log(`P1 (comp excerpts: root right >= 85 %): ${pct(comp.rootRight, comp.bars)} ${comp.rootRight / comp.bars >= 0.85 ? "PASS" : "FAIL"}`);
console.log(`P2 (all: family right >= 70 %): ${pct(all.familyRight, all.bars)} ${all.familyRight / all.bars >= 0.7 ? "PASS" : "FAIL"}`);
console.log(`P3 (dim family right < 25 %): ${pct(fam("dim").familyRight, fam("dim").n)} ${r(fam("dim")) < 0.25 ? "PASS" : "FAIL"}`);
console.log(`P4 (dom family right < 60 %): ${pct(fam("dom").familyRight, fam("dom").n)} ${r(fam("dom")) < 0.6 ? "PASS" : "FAIL"}`);
console.log(`P5 (solo root right at least 10 points under comp): comp ${pct(comp.rootRight, comp.bars)} solo ${pct(solo.rootRight, solo.bars)} ${comp.rootRight / comp.bars - solo.rootRight / solo.bars >= 0.1 ? "PASS" : "FAIL"}`);
const perfAll = groups["all|performed"];
if (perfAll) console.log(`P6 (performed truth: family right at least 3 points above instructed): ${pct(perfAll.familyRight, perfAll.bars)} vs ${pct(all.familyRight, all.bars)} ${perfAll.familyRight / perfAll.bars - all.familyRight / all.bars >= 0.03 ? "PASS" : "FAIL"}`);
const under50 = Object.entries(all.byFamily).filter(([, v]) => v.n >= 50 && r(v) < 0.5).map(([k]) => k);
console.log(`S46-D1: families (>= 50 bars) with the hint's family right under 50 %: ${under50.join(", ") || "none"} -> ${under50.length ? "recommend the app treat the hint's quality as advisory for these families" : "the hint's quality stands as it is"}`);
writeFileSync(`${root}results/study46.json`, `${JSON.stringify({ registered: "docs/BRIEF-STUDY46.md", spend: 0, excerpts: Object.keys(per).length, groups, per }, null, "\t")}\n`);
console.log(`\nresults/study46.json written (${Object.keys(per).length} excerpts, $0)`);
