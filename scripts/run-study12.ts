/**
 * Study 12 run (docs/BRIEF-STUDY12.md): chart-to-seconds by
 * synthesize-and-align. Synthetic arm: every pulsed fixture item's
 * chart (its spec bars at declared tempi) rendered as a pad reference,
 * chroma-DTW aligned to the committed render, every bar start mapped
 * to seconds and scored against the exact grid. Wrong-chart probe: six
 * registered mismatched pairs, path costs reported. Real arm: the
 * transcribed MMKK charts aligned to the real mixes (subsequence DTW),
 * section starts scored against the band's declared times. Zero spend.
 */
import { readFileSync, writeFileSync } from "node:fs";
import fixture10 from "../corpus/fixture10.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mmkkCharts from "../corpus/mmkk-charts.json";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import mixes10 from "../corpus/mixes10.json";
import { renderMix, type Meter4, type MixSpec } from "../src/study4/synth4.js";
import { renderParts, type MixSpec9 } from "../src/study9/parts.js";
import { renderMix10, type MixSpec10 } from "../src/study10/synth10.js";
import { chromagram } from "../src/study12/chroma.js";
import { dtwAlign } from "../src/study12/dtw.js";
import { renderReference, type RefBar } from "../src/study12/reference.js";

const root = new URL("../", import.meta.url).pathname;
const bandSpecs = new Map<string, MixSpec9 & MixSpec10>();
for (const m of [...mixes.mixes, ...mixes9.mixes, ...mixes10.mixes] as (MixSpec9 & MixSpec10)[]) {
	bandSpecs.set(m.id, m);
}

function renderBand(item: { id: string; renderer: string; seed: number }): Float32Array {
	const spec = bandSpecs.get(item.id)!;
	if (item.renderer === "synth4") return renderMix(spec as MixSpec, item.seed);
	if (item.renderer === "parts9") return renderParts(spec as MixSpec9, item.seed).mix;
	return renderMix10(spec as MixSpec10, item.seed);
}

function refBarsOf(spec: MixSpec): { bars: RefBar[]; sectionBarIndex: number[] } {
	const bars: RefBar[] = [];
	const sectionBarIndex: number[] = [];
	for (const s of spec.sections) {
		sectionBarIndex.push(bars.length);
		for (const chord of s.bars) bars.push({ chords: [chord], bpm: s.bpm });
	}
	return { bars, sectionBarIndex };
}

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

interface SynthRead {
	itemId: string;
	class: string;
	barCount: number;
	maxAbsErr: number;
	within025: number;
	sectionErrs: number[];
	normalizedCost: number;
}

const synth: SynthRead[] = [];
const chromaCache = new Map<string, ReturnType<typeof chromagram>>();
for (const item of fixture10.bandItems as {
	id: string;
	class: string;
	renderer: string;
	seed: number;
	barStarts: number[];
	sections: { sections: { at: number }[] };
}[]) {
	if (item.class === "pulseless") continue;
	const spec = bandSpecs.get(item.id)! as MixSpec;
	const recording = renderBand(item);
	const rec = chromagram(recording);
	chromaCache.set(item.id, rec);
	const { bars, sectionBarIndex } = refBarsOf(spec);
	const ref = renderReference(bars, spec.meter as Meter4);
	const refChroma = chromagram(ref.samples);
	const aligned = dtwAlign(refChroma.frames, rec.frames, rec.hopSec);
	const errs = item.barStarts
		.slice(0, -1)
		.map((truthSec, b) => Math.abs(aligned.mapSeconds(ref.barStarts[b]!) - truthSec));
	const sectionErrs = sectionBarIndex
		.slice(1)
		.map((barIdx, k) =>
			Math.abs(aligned.mapSeconds(ref.barStarts[barIdx]!) - item.sections.sections[k + 1]!.at),
		);
	synth.push({
		itemId: item.id,
		class: item.class,
		barCount: errs.length,
		maxAbsErr: Math.max(...errs),
		within025: errs.filter((e) => e <= 0.25).length,
		sectionErrs,
		normalizedCost: aligned.normalizedCost,
	});
	console.log(
		`${item.id.padEnd(22)} ${item.class.padEnd(15)} bars ${errs.filter((e) => e <= 0.25).length}/${errs.length} ≤0.25s (max ${Math.max(...errs).toFixed(2)}s) | sections ${sectionErrs.map((e) => e.toFixed(2)).join(",") || "—"} | cost ${aligned.normalizedCost.toFixed(3)}`,
	);
}

// Wrong-chart probe: six registered pairs, right-vs-wrong cost.
const PROBE_PAIRS: [string, string][] = [
	["drift-4a", "waltz-b"],
	["waltz-b", "drift-4a"],
	["contrast-b", "mod-a"],
	["mod-a", "contrast-b"],
	["swing-x", "oct-low-a"],
	["oct-low-a", "swing-x"],
];
const probe: unknown[] = [];
for (const [recId, chartId] of PROBE_PAIRS) {
	const rec = chromaCache.get(recId)!;
	const spec = bandSpecs.get(chartId)! as MixSpec;
	const { bars } = refBarsOf(spec);
	const ref = renderReference(bars, spec.meter as Meter4);
	const wrong = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec);
	const right = synth.find((s) => s.itemId === recId)!.normalizedCost;
	probe.push({ recording: recId, chart: chartId, rightCost: right, wrongCost: wrong.normalizedCost });
	console.log(`probe ${recId} vs chart ${chartId}: right ${right.toFixed(3)} wrong ${wrong.normalizedCost.toFixed(3)}`);
}

// Real arm: the transcribed MMKK charts, subsequence DTW.
const real: unknown[] = [];
for (const song of mmkkCharts.songs as {
	slug: string;
	gated: boolean;
	bpm: number;
	meter: string;
	sections: { name: string; bars: string[][] }[];
}[]) {
	const m = (manifestMmkk.songs as {
		slug: string;
		mix: { url: string } | null;
		stems: { url: string }[];
		sections: { name: string; start: number }[] | null;
	}[]).find((x) => x.slug === song.slug)!;
	const audio = m.mix
		? loadRaw(`${root}corpus-mmkk/${song.slug}/mix.mp3.22050.f32le.raw`)
		: (() => {
				const stems = m.stems.map((st) =>
					loadRaw(`${root}corpus-mmkk/${song.slug}/${st.url.split("/").pop()}.22050.f32le.raw`),
				);
				const len = Math.max(...stems.map((s) => s.length));
				const sum = new Float32Array(len);
				for (const s of stems) for (let i = 0; i < s.length; i++) sum[i]! += s[i]!;
				return sum;
			})();
	const bars: RefBar[] = [];
	const sectionBarIndex: number[] = [];
	for (const s of song.sections) {
		sectionBarIndex.push(bars.length);
		for (const chords of s.bars) bars.push({ chords, bpm: song.bpm });
	}
	const ref = renderReference(bars, song.meter as Meter4);
	const rec = chromagram(audio);
	const aligned = dtwAlign(chromagram(ref.samples).frames, rec.frames, rec.hopSec, { subsequence: true });
	const declared = (m.sections ?? []).map((s) => s.start);
	const placed = sectionBarIndex.map((barIdx) => aligned.mapSeconds(ref.barStarts[barIdx]!));
	// Score boundaries after 0.5 s, pairing the k-th declared with the k-th chart section.
	const pairs = Math.min(declared.length, placed.length);
	const errs: number[] = [];
	for (let k = 1; k < pairs; k++) errs.push(Math.abs(placed[k]! - declared[k]!));
	real.push({
		slug: song.slug,
		gated: song.gated,
		declaredCount: declared.length,
		chartCount: placed.length,
		placed: placed.map((p) => Math.round(p * 10) / 10),
		declared,
		errs: errs.map((e) => Math.round(e * 100) / 100),
		normalizedCost: aligned.normalizedCost,
	});
	console.log(
		`${song.slug}${song.gated ? " (GATED)" : " (exploratory)"}: boundaries within 4s ${errs.filter((e) => e <= 4).length}/${errs.length}, within 0.5s ${errs.filter((e) => e <= 0.5).length}/${errs.length} | errs ${errs.map((e) => e.toFixed(1)).join(",")}`,
	);
}

writeFileSync(
	`${root}results/study12.json`,
	`${JSON.stringify({ version: 1, synth, probe, real }, null, "\t")}\n`,
);
console.log(`\nstudy12.json: ${synth.length} synthetic items, ${probe.length} probe pairs, ${real.length} real songs`);
