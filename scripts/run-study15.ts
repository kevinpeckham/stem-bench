/**
 * Study 15 run (docs/BRIEF-STUDY15.md): the v0.201.2 patch validated at
 * bc683871 (the 1.6 constant, audibleSpan, both edge rules,
 * chartBarSeconds) over THREE gated real songs — Peaceful Dreams, with
 * its band-revised machine-true chart, joins letter-lands; eat stays
 * exploratory — plus the six real wrong cross-pairs and the local-cost
 * distributions that state the requested second same-piece clause by
 * number. Zero spend.
 */
import { readFileSync, writeFileSync } from "node:fs";
import fixture10 from "../corpus/fixture10.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import peacefulRev from "../corpus/mmkk-peaceful-rev.json";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import mixes10 from "../corpus/mixes10.json";
import { renderMix, type MixSpec } from "../src/study4/synth4.js";
import { renderParts, type MixSpec9 } from "../src/study9/parts.js";
import { renderMix10, type MixSpec10 } from "../src/study10/synth10.js";
import { chordChartBars } from "../src/study14/chordChartBars.js";
import type { ChartBar } from "../src/study14/chartBars.js";
import { alignChart } from "../src/study15/chartAlignment.js";
import { alignedPlacements } from "../src/study15/alignedPlacements.js";

const root = new URL("../", import.meta.url).pathname;
const bandSpecs = new Map<string, MixSpec9 & MixSpec10>();
for (const m of [...mixes.mixes, ...mixes9.mixes, ...mixes10.mixes] as (MixSpec9 & MixSpec10)[]) {
	bandSpecs.set(m.id, m);
}
function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
function renderBand(id: string): Float32Array {
	const item = (fixture10.bandItems as { id: string; renderer: string; seed: number }[]).find((i) => i.id === id)!;
	const spec = bandSpecs.get(id)!;
	if (item.renderer === "synth4") return renderMix(spec as MixSpec, item.seed);
	if (item.renderer === "parts9") return renderParts(spec as MixSpec9, item.seed).mix;
	return renderMix10(spec as MixSpec10, item.seed);
}
function specPadBars(spec: MixSpec): ChartBar[] {
	const bars: ChartBar[] = [];
	for (const s of spec.sections) {
		for (const chord of s.bars) {
			bars.push({ measure: bars.length + 1, chords: [chord], bpm: s.bpm, meter: spec.meter, key: null, section: null });
		}
	}
	return bars;
}
const median = (xs: number[]) => {
	const s = [...xs].sort((a, b) => a - b);
	return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};

const SONGS: { slug: string; gated: boolean; declared: { name: string; start: number }[] }[] = [
	{ slug: "letter-lands", gated: true, declared: (manifestMmkk.songs as { slug: string; sections: { name: string; start: number }[] | null }[]).find((s) => s.slug === "letter-lands")!.sections! },
	{ slug: "peaceful-dreams", gated: true, declared: (peacefulRev as { sections: { name: string; start: number }[] }).sections },
	{ slug: "eat-all-the-clocks", gated: false, declared: (manifestMmkk.songs as { slug: string; sections: { name: string; start: number }[] | null }[]).find((s) => s.slug === "eat-all-the-clocks")!.sections! },
];
const audioOf = new Map<string, Float32Array>();
const barsOf = new Map<string, ChartBar[]>();
for (const s of SONGS) {
	audioOf.set(s.slug, loadRaw(`${root}corpus-mmkk/${s.slug}/mix.mp3.22050.f32le.raw`));
	const md = readFileSync(`${root}corpus/mmkk-chart-texts/${s.slug}.md`, "utf8");
	const parsed = chordChartBars(md, { tempo: null, meter: null });
	if (!parsed || parsed.warnings.length) throw new Error(`${s.slug}: parse ${parsed?.warnings.join("; ")}`);
	barsOf.set(s.slug, parsed.bars);
}

// ---- Real arm: right charts with the edge rules, and the 6 wrong cross-pairs ----
const real: unknown[] = [];
const localStats: unknown[] = [];
for (const s of SONGS) {
	const alignment = alignChart(barsOf.get(s.slug)!, audioOf.get(s.slug)!, 22050);
	const placements = alignedPlacements(barsOf.get(s.slug)!, alignment);
	const errs = placements.sections.map((p, k) => (s.declared[k] ? Math.round((p.start - s.declared[k]!.start) * 100) / 100 : null));
	real.push({
		slug: s.slug,
		gated: s.gated,
		ratio: placements.ratio,
		samePiece: placements.samePiece,
		firstSound: alignment.firstSound,
		lastSound: alignment.lastSound,
		sections: placements.sections.map((p, k) => ({ name: p.name, placed: Math.round(p.start * 100) / 100, declared: s.declared[k]?.start ?? null, err: errs[k], hedged: p.hedged })),
	});
	localStats.push({ itemId: s.slug, kind: "right-real", medianLocal: median(alignment.localCost), ratio: placements.ratio });
	console.log(
		`${s.slug}${s.gated ? " (GATED)" : " (expl)"}: ratio ${placements.ratio.toFixed(2)} samePiece ${placements.samePiece} | errs ${errs.map((e) => (e === null ? "—" : e.toFixed(2))).join(",")}`,
	);
}
for (const rec of SONGS) {
	for (const chart of SONGS) {
		if (rec.slug === chart.slug) continue;
		const a = alignChart(barsOf.get(chart.slug)!, audioOf.get(rec.slug)!, 22050);
		const p = alignedPlacements(barsOf.get(chart.slug)!, a);
		localStats.push({ itemId: `${rec.slug}⊗${chart.slug}`, kind: "wrong-real", medianLocal: median(a.localCost), ratio: p.ratio });
		console.log(`wrong-real ${rec.slug} vs ${chart.slug}: ratio ${p.ratio.toFixed(2)} samePiece ${p.samePiece} medianLocal ${median(a.localCost).toFixed(3)}`);
	}
}

// ---- Synthetic local-cost context (the Study 12/14 probe pairs) ----
const PROBE_PAIRS: [string, string][] = [
	["drift-4a", "waltz-b"],
	["waltz-b", "drift-4a"],
	["contrast-b", "mod-a"],
	["mod-a", "contrast-b"],
	["swing-x", "oct-low-a"],
	["oct-low-a", "swing-x"],
];
for (const [recId, wrongId] of PROBE_PAIRS) {
	const audio = renderBand(recId);
	const right = alignChart(specPadBars(bandSpecs.get(recId)! as MixSpec), audio, 22050);
	const wrong = alignChart(specPadBars(bandSpecs.get(wrongId)! as MixSpec), audio, 22050);
	localStats.push(
		{ itemId: recId, kind: "right-synth", medianLocal: median(right.localCost), ratio: right.controlCost / Math.max(right.cost, 1e-6) },
		{ itemId: `${recId}⊗${wrongId}`, kind: "wrong-synth", medianLocal: median(wrong.localCost), ratio: wrong.controlCost / Math.max(wrong.cost, 1e-6) },
	);
}
console.log("\nlocal-cost medians by class:");
for (const kind of ["right-real", "wrong-real", "right-synth", "wrong-synth"]) {
	const xs = (localStats as { kind: string; medianLocal: number }[]).filter((l) => l.kind === kind).map((l) => l.medianLocal);
	console.log(`  ${kind.padEnd(12)} ${xs.map((x) => x.toFixed(3)).join(", ")}`);
}

writeFileSync(`${root}results/study15.json`, `${JSON.stringify({ version: 1, pin: "bc683871", real, localStats }, null, "\t")}\n`);
console.log("\nstudy15.json written");
