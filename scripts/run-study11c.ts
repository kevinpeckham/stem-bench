/**
 * Study 11c run (docs/BRIEF-STUDY11C.md): the patched declared-meter
 * ladder (verbatim port at 2cf70cb) over Study 11b's stored reads
 * (arm 1, pure), the mirror fixture under both candidate fix-1 rules
 * (arm 2), and the ×3 rung's exposure (arm 3). Zero model spend.
 */
import { readFileSync, writeFileSync } from "node:fs";
import fixture10 from "../corpus/fixture10.json";
import mixes11c from "../corpus/mixes11c.json";
import { analyse, extractFeatures } from "../src/study11b/analysis200.js";
import { isCompoundMeter, isTripleMeter, tempoLadderMatch } from "../src/study11c/ladder2cf.js";
import { subdivisionOf } from "../src/study11/ladder.js";
import { renderMix10, type MixSpec10 } from "../src/study10/synth10.js";

const root = new URL("../", import.meta.url).pathname;
const run11b = JSON.parse(readFileSync(`${root}results/study11b.json`, "utf8"));
const meterOf = new Map(
	(fixture10.bandItems as { id: string; truth: { meter: string } }[]).map((i) => [
		i.id,
		i.truth.meter,
	]),
);

const asBuffer = (data: Float32Array) =>
	({
		sampleRate: 22050,
		length: data.length,
		numberOfChannels: 1,
		getChannelData: () => data,
		duration: data.length / 22050,
	}) as unknown as AudioBuffer;

type Read = (typeof run11b.reads)[number];

// ---- Arm 1: the declared-meter gate over the stored 11b reads ----
const arm1: unknown[] = [];
for (const r of run11b.reads as Read[]) {
	// The declared meter: band items carry it as truth; MMKK as the band's
	// row; the swing-stress set is 4/4 by construction.
	const meter = r.source === "band" ? (meterOf.get(r.itemId) ?? r.meterTruth) : r.meterTruth;
	const gates = { compound: isCompoundMeter(meter), triple: isTripleMeter(meter) };
	let declaredMatch: { factor: number } | null = null;
	for (const t of r.trueTempos as number[]) {
		const m = tempoLadderMatch(t, r.nw.bpm, gates);
		if (m && (!declaredMatch || m.factor === 1)) declaredMatch = m;
		if (declaredMatch?.factor === 1) break;
	}
	const wrongRows = (r.wrongRows as { multiplier: number; declared: number; accept: boolean }[]).map(
		(w) => ({
			...w,
			acceptPatched: tempoLadderMatch(w.declared, r.nw.bpm, gates) !== null,
		}),
	);
	arm1.push({
		itemId: r.itemId,
		source: r.source,
		meter,
		gates,
		trueTempos: r.trueTempos,
		detected: r.nw.bpm,
		shippedMatch: r.gatedMatch,
		patchedMatch: declaredMatch,
		wrongRows,
	});
}

// ---- Arm 2: the mirror fixture under both fix-1 rules ----
const arm2: unknown[] = [];
for (const [i, spec] of (mixes11c.mixes as (MixSpec10 & { wrongDeclared: number })[]).entries()) {
	const samples = renderMix10(spec, 11100 + i);
	const f = extractFeatures(asBuffer(samples));
	const d = analyse(f);
	const truth = spec.sections[0]!.bpm;
	const wrong = spec.wrongDeclared;
	// The bench's declared-lag rule: the Study 11 Amendment 1+2 subdivision
	// test evaluated at the DECLARED tempo licenses the 3:2 rungs.
	const subAtDeclared = subdivisionOf(f.onset, f.fps, wrong);
	const declaredLagAccept =
		tempoLadderMatch(wrong, d.tempo.bpm, { compound: subAtDeclared.subdivision === 3 }) !== null;
	// The shipped declared-meter gate: 4/4 opens nothing beyond 1, 2, half.
	const declaredMeterAccept =
		tempoLadderMatch(wrong, d.tempo.bpm, {
			compound: isCompoundMeter(spec.meter),
			triple: isTripleMeter(spec.meter),
		}) !== null;
	arm2.push({
		itemId: spec.id,
		truth,
		detected: d.tempo.bpm,
		detectedSubdivision: d.tempo.subdivision,
		wrongDeclared: wrong,
		subAtDeclared: { subdivision: subAtDeclared.subdivision, r3: subAtDeclared.r3, r2: subAtDeclared.r2, rBeat: subAtDeclared.rBeat },
		declaredLagAccept,
		declaredMeterAccept,
	});
	console.log(
		`${spec.id}: truth ${truth} detected ${d.tempo.bpm} (sub ${d.tempo.subdivision}) | wrong declared ${wrong} | declared-lag sub ${subAtDeclared.subdivision} → ${declaredLagAccept ? "ACCEPTS the wrong value" : "rejects"} | declared-meter → ${declaredMeterAccept ? "ACCEPTS" : "rejects"}`,
	);
}

// ---- Arm 3: the ×3 rung's exposure ----
const arm3: unknown[] = [];
for (const r of run11b.reads as Read[]) {
	const exact = (r.trueTempos as number[]).some((t) => Math.abs(r.nw.bpm - t) <= 1);
	if (!exact) continue;
	const meter = r.source === "band" ? (meterOf.get(r.itemId) ?? r.meterTruth) : r.meterTruth;
	const gates = { compound: isCompoundMeter(meter), triple: isTripleMeter(meter) };
	const rows = [3 * r.nw.bpm, 3 * r.nw.bpm + 4, 3 * r.nw.bpm - 4].map((declared) => ({
		declared: Math.round(declared * 10) / 10,
		accept: tempoLadderMatch(declared, r.nw.bpm, gates) !== null,
	}));
	arm3.push({ itemId: r.itemId, meter, triple: gates.triple, detected: r.nw.bpm, rows });
}

writeFileSync(
	`${root}results/study11c.json`,
	`${JSON.stringify({ version: 1, port: "2cf70cb", arm1, arm2, arm3 }, null, "\t")}\n`,
);
console.log(`\nstudy11c.json: arm1 ${arm1.length} reads, arm2 ${arm2.length} mirrors, arm3 ${arm3.length} items`);
