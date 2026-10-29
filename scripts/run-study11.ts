/**
 * Study 11 run (docs/BRIEF-STUDY11.md): pure functions over numbers the
 * program already holds — the stored Study 10 detections (synthetic and
 * MMKK) and the fixtures' truth — plus re-rendered onset envelopes for
 * the subdivision test. Zero model spend. Writes results/study11.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import fixture10 from "../corpus/fixture10.json";
import fixture4 from "../corpus/fixture4.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import mixes10 from "../corpus/mixes10.json";
import { renderMix, type MixSpec } from "../src/study4/synth4.js";
import { combineFeatures } from "../src/study9/analysis.js";
import { featuresOf } from "../src/study9/instruments.js";
import { renderParts, type MixSpec9 } from "../src/study9/parts.js";
import { renderMix10, type MixSpec10 } from "../src/study10/synth10.js";
import {
	subdivisionOf,
	tempoLadderMatch,
	wrongTempoSet,
	type SubdivisionRead,
} from "../src/study11/ladder.js";

const root = new URL("../", import.meta.url).pathname;
const run10 = JSON.parse(readFileSync(`${root}results/study10-instruments.json`, "utf8"));
const runMmkk = JSON.parse(readFileSync(`${root}results/study10-mmkk.json`, "utf8"));

const bandSpecs = new Map<string, MixSpec9 & MixSpec10>();
for (const m of [...mixes.mixes, ...mixes9.mixes, ...mixes10.mixes] as (MixSpec9 & MixSpec10)[]) {
	bandSpecs.set(m.id, m);
}
const itemOf = new Map((fixture10.bandItems as { id: string }[]).map((i) => [i.id, i]));

function renderBand(item: { id: string; renderer: string; seed: number }): Float32Array {
	const spec = bandSpecs.get(item.id);
	if (!spec) throw new Error(`no spec: ${item.id}`);
	if (item.renderer === "synth4") return renderMix(spec as MixSpec, item.seed);
	if (item.renderer === "parts9") return renderParts(spec as MixSpec9, item.seed).mix;
	return renderMix10(spec as MixSpec10, item.seed);
}

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

interface ItemRead {
	itemId: string;
	source: "band" | "mmkk";
	class: string;
	meterTruth: string;
	trueTempos: number[];
	detected: number;
	prodExact: boolean;
	subAtTrue: SubdivisionRead;
	subAtDetected: SubdivisionRead;
	subAtSlowerOfPair: SubdivisionRead;
	gated: { match: boolean; rung: number | null };
	open: { match: boolean; rung: number | null };
	wrongRows: {
		multiplier: number;
		declared: number;
		gatedAccept: boolean;
		openAccept: boolean;
		currentRuleFires: boolean;
		subUsed: 2 | 3;
	}[];
}

const items: ItemRead[] = [];

function readItem(
	itemId: string,
	source: "band" | "mmkk",
	cls: string,
	meterTruth: string,
	trueTempos: number[],
	detected: number,
	envelope: { onset: Float32Array; fps: number },
): void {
	const primaryTruth = trueTempos[0]!;
	const subAtTrue = subdivisionOf(envelope.onset, envelope.fps, primaryTruth);
	const subAtDetected = subdivisionOf(envelope.onset, envelope.fps, detected);
	const slower = Math.min(primaryTruth, detected);
	const subAtSlowerOfPair = subdivisionOf(envelope.onset, envelope.fps, slower);
	// The declared-vs-detected ladder read, compound evidence at the pair's slower pulse.
	const gated = tempoLadderMatch(primaryTruth, detected, subAtSlowerOfPair.subdivision, "L-gated");
	const open = tempoLadderMatch(primaryTruth, detected, subAtSlowerOfPair.subdivision, "L-open");
	const prodExact = trueTempos.some((t) => Math.abs(detected - t) <= 1);
	const compound = meterTruth === "6/8";
	const wrongRows = wrongTempoSet(primaryTruth, compound).map((row) => {
		const slowerW = Math.min(row.declared, detected);
		const subW = subdivisionOf(envelope.onset, envelope.fps, slowerW).subdivision;
		return {
			...row,
			gatedAccept: tempoLadderMatch(row.declared, detected, subW, "L-gated").match,
			openAccept: tempoLadderMatch(row.declared, detected, subW, "L-open").match,
			// Production's shipped rule: tempos within 2 % agree.
			currentRuleFires: Math.abs(row.declared - detected) / detected > 0.02,
			subUsed: subW,
		};
	});
	items.push({
		itemId,
		source,
		class: cls,
		meterTruth,
		trueTempos,
		detected,
		prodExact,
		subAtTrue,
		subAtDetected,
		subAtSlowerOfPair,
		gated,
		open,
		wrongRows,
	});
	console.log(
		`${itemId.padEnd(24)} truth ${trueTempos.join("/")} ${meterTruth.padEnd(4)} det ${detected} | sub@true ${subAtTrue.subdivision} (r3 ${subAtTrue.r3.toFixed(2)}/rB ${subAtTrue.rBeat.toFixed(2)}) | gated ${gated.match ? `✓r${gated.rung?.toFixed(2)}` : "✗"} open ${open.match ? `✓r${open.rung?.toFixed(2)}` : "✗"}`,
	);
}

for (const r of run10.band as { itemId: string; class: string; prod: { tempo: { bpm: number } } }[]) {
	if (r.class === "pulseless") continue;
	const item = itemOf.get(r.itemId)! as unknown as {
		renderer: string;
		seed: number;
		truth: { tempo: number; meter: string; tempoChanges: { bpm: number }[] };
	};
	const samples = renderBand({ id: r.itemId, renderer: item.renderer, seed: item.seed });
	const f = featuresOf(samples);
	readItem(
		r.itemId,
		"band",
		r.class,
		item.truth.meter,
		[item.truth.tempo, ...item.truth.tempoChanges.map((c) => c.bpm)],
		r.prod.tempo.bpm,
		f,
	);
}

for (const s of runMmkk.songs as {
	slug: string;
	declared: { tempo: { value: number }[]; meter: { value: string }[] };
	prod: { tempo: { bpm: number } };
}[]) {
	if (!s.declared.tempo.length) continue;
	const m = (manifestMmkk.songs as { slug: string; stems: { url: string }[] }[]).find(
		(x) => x.slug === s.slug,
	)!;
	const stems = m.stems.map((st) =>
		loadRaw(`${root}corpus-mmkk/${s.slug}/${st.url.split("/").pop()}.22050.f32le.raw`),
	);
	const combined = combineFeatures(stems.map((st) => featuresOf(st)))!;
	readItem(
		s.slug,
		"mmkk",
		"real",
		s.declared.meter[0]?.value ?? "—",
		s.declared.tempo.map((t) => t.value),
		s.prod.tempo.bpm,
		combined,
	);
}

// The Study 7 ×2/÷2 context: how many of its registered wrong settings
// sit on the always-accepted rungs (reported, silenced-by-design).
const study7Rows = (fixture4.items as { pulseless: boolean; truth: { tempo: number | null }; wrong: { tempo: string } }[])
	.filter((i) => !i.pulseless && i.truth.tempo !== null)
	.map((i) => ({ truth: i.truth.tempo!, wrong: Number(i.wrong.tempo) }))
	.map((r) => ({ ...r, onRung: tempoLadderMatch(r.wrong, r.truth, 2, "L-gated").match }));

writeFileSync(
	`${root}results/study11.json`,
	`${JSON.stringify({ version: 1, items, study7Rows }, null, "\t")}\n`,
);
console.log(`\nstudy11.json: ${items.length} items, ${items.reduce((a, i) => a + i.wrongRows.length, 0)} wrong-tempo rows, ${study7Rows.length} Study 7 rows`);
