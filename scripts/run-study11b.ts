/**
 * Study 11b run (docs/BRIEF-STUDY11B.md): the shipped v0.200.0 tempo
 * ladder (verbatim port at 79ed4def) over the Study 11 corpus (33
 * pulsed band items + 4 scored MMKK songs), the 15-item swing-stress
 * set, and the lesson-6-corrected wrong-tempo set through the shipped
 * tempoLadderMatch. Zero model spend. Writes results/study11b.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import fixture10 from "../corpus/fixture10.json";
import manifestMmkk from "../corpus/fixture-mmkk.json";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import mixes10 from "../corpus/mixes10.json";
import mixes11b from "../corpus/mixes11b.json";
import { renderMix, type MixSpec } from "../src/study4/synth4.js";
import { renderParts, type MixSpec9 } from "../src/study9/parts.js";
import { renderMix10, type MixSpec10 } from "../src/study10/synth10.js";
import {
	analyse,
	combineFeatures,
	extractFeatures,
	type Detection,
} from "../src/study11b/analysis200.js";
import { tempoLadderMatch } from "../src/study11b/ladder200.js";
import { WRONG_MULTIPLIERS } from "../src/study11/ladder.js";

const root = new URL("../", import.meta.url).pathname;
const run10 = JSON.parse(readFileSync(`${root}results/study10-instruments.json`, "utf8"));
const runMmkk = JSON.parse(readFileSync(`${root}results/study10-mmkk.json`, "utf8"));

const bandSpecs = new Map<string, MixSpec9 & MixSpec10>();
for (const m of [...mixes.mixes, ...mixes9.mixes, ...mixes10.mixes] as (MixSpec9 & MixSpec10)[]) {
	bandSpecs.set(m.id, m);
}
const itemOf = new Map((fixture10.bandItems as { id: string }[]).map((i) => [i.id, i]));

const asBuffer = (data: Float32Array, sampleRate = 22050) =>
	({
		sampleRate,
		length: data.length,
		numberOfChannels: 1,
		getChannelData: () => data,
		duration: data.length / sampleRate,
	}) as unknown as AudioBuffer;

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

/**
 * Lesson-6-corrected wrong set: rows are dropped when the "wrong" value
 * sits within the shipped tolerance (max of 3 bpm and 2 %) of ANY true
 * label, and items where the old detection was not exact (±1 of a true
 * label) are excluded entirely — wrongness is defined against the value
 * actually compared.
 */
function wrongRowsFor(trueTempos: number[], compound: boolean): { multiplier: number; declared: number }[] {
	const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(3, 0.02 * b);
	return WRONG_MULTIPLIERS.filter((m) => !(compound && m === 1.5))
		.map((m) => ({ multiplier: m, declared: Math.round(trueTempos[0]! * m * 10) / 10 }))
		.filter((r) => !trueTempos.some((t) => near(r.declared, t)));
}

interface Read11b {
	itemId: string;
	source: "band" | "mmkk" | "swing";
	class: string;
	meterTruth: string;
	swing: number | null;
	trueTempos: number[];
	oldDetected: number | null;
	oldExact: boolean;
	nw: {
		bpm: number;
		subdivision: number;
		meter: string;
		alternates: { factor: number; bpm: number; strength: number }[];
	};
	trueRungInAlternates: { factor: number; strength: number } | null;
	gatedMatch: { factor: number } | null;
	wrongRows: { multiplier: number; declared: number; accept: boolean }[];
}

const reads: Read11b[] = [];

function read(
	itemId: string,
	source: Read11b["source"],
	cls: string,
	meterTruth: string,
	swing: number | null,
	trueTempos: number[],
	oldDetected: number | null,
	detection: Detection,
): void {
	const nw = {
		bpm: detection.tempo.bpm,
		subdivision: detection.tempo.subdivision,
		meter: detection.meter.value,
		alternates: detection.tempo.alternates ?? [],
	};
	const oldExact = oldDetected !== null && trueTempos.some((t) => Math.abs(oldDetected - t) <= 1);
	// Is a true tempo present on the shipped ladder (direct or an alternate)?
	let trueRung: { factor: number; strength: number } | null = null;
	for (const t of trueTempos) {
		if (Math.abs(nw.bpm - t) <= 1) trueRung = { factor: 1, strength: 1 };
	}
	if (!trueRung) {
		for (const a of nw.alternates) {
			if (trueTempos.some((t) => Math.abs(a.bpm - t) <= Math.max(1, 0.01 * t))) {
				trueRung = { factor: a.factor, strength: a.strength };
				break;
			}
		}
	}
	const compound = nw.subdivision === 3 || meterTruth === "6/8";
	let gatedMatch: { factor: number } | null = null;
	for (const t of trueTempos) {
		const m = tempoLadderMatch(t, nw.bpm, { compound: nw.subdivision === 3 });
		if (m && (!gatedMatch || m.factor === 1)) gatedMatch = m;
		if (gatedMatch?.factor === 1) break;
	}
	const newExact = trueTempos.some((t) => Math.abs(nw.bpm - t) <= 1);
	const wrongRows = (oldExact || newExact
		? wrongRowsFor(trueTempos, meterTruth === "6/8")
		: []
	).map((r) => ({
		...r,
		accept: tempoLadderMatch(r.declared, nw.bpm, { compound: nw.subdivision === 3 }) !== null,
	}));
	reads.push({
		itemId,
		source,
		class: cls,
		meterTruth,
		swing,
		trueTempos,
		oldDetected,
		oldExact,
		nw,
		trueRungInAlternates: trueRung,
		gatedMatch,
		wrongRows,
	});
	console.log(
		`${itemId.padEnd(24)} truth ${trueTempos.join("/")} ${meterTruth.padEnd(4)} | old ${oldDetected ?? "—"} | new ${nw.bpm} sub ${nw.subdivision} ${nw.meter} | trueRung ${trueRung ? `f=${trueRung.factor.toFixed(2)}@${trueRung.strength}` : "ABSENT"} | ladder ${gatedMatch ? `f=${gatedMatch.factor.toFixed(2)}` : "✗"}`,
	);
}

for (const r of run10.band as { itemId: string; class: string; prod: { tempo: { bpm: number } } }[]) {
	if (r.class === "pulseless") continue;
	const item = itemOf.get(r.itemId)! as unknown as {
		renderer: string;
		seed: number;
		truth: { tempo: number; meter: string; tempoChanges: { bpm: number }[] };
	};
	const spec = bandSpecs.get(r.itemId)!;
	const samples =
		item.renderer === "synth4"
			? renderMix(spec as MixSpec, item.seed)
			: item.renderer === "parts9"
				? renderParts(spec as MixSpec9, item.seed).mix
				: renderMix10(spec as MixSpec10, item.seed);
	const detection = analyse(extractFeatures(asBuffer(samples)));
	read(
		r.itemId,
		"band",
		r.class,
		item.truth.meter,
		(spec as MixSpec10).swing ?? null,
		[item.truth.tempo, ...item.truth.tempoChanges.map((c) => c.bpm)],
		r.prod.tempo.bpm,
		detection,
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
	const combined = combineFeatures(stems.map((st) => extractFeatures(asBuffer(st))))!;
	read(
		s.slug,
		"mmkk",
		"real",
		s.declared.meter[0]?.value ?? "—",
		null,
		s.declared.tempo.map((t) => t.value),
		s.prod.tempo.bpm,
		analyse(combined),
	);
}

for (const [i, spec] of (mixes11b.mixes as MixSpec10[]).entries()) {
	const samples = renderMix10(spec, 11000 + i);
	const detection = analyse(extractFeatures(asBuffer(samples)));
	read(
		spec.id,
		"swing",
		"swing-stress",
		spec.meter,
		spec.swing ?? null,
		[spec.sections[0]!.bpm],
		null,
		detection,
	);
}

writeFileSync(
	`${root}results/study11b.json`,
	`${JSON.stringify({ version: 1, port: "79ed4def", reads }, null, "\t")}\n`,
);
console.log(
	`\nstudy11b.json: ${reads.length} reads, ${reads.reduce((a, r) => a + r.wrongRows.length, 0)} wrong rows`,
);
