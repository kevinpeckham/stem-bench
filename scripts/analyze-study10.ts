/**
 * Study 10 analyzer (docs/BRIEF-STUDY10.md, "Registered measures" and
 * "Gates"): reads results/study10-instruments.json and prints the
 * registered tables and gate verdicts. Nothing here re-thresholds.
 */
import { readFileSync } from "node:fs";
import fixture from "../corpus/fixture10.json";
import { sameChord } from "../src/grading/symbols.js";
import { fMeasure, keyRight, tempoExact, tempoOctave, triadClass, type Truths } from "../src/study10/grading10.js";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study10-instruments.json`, "utf8"));
const itemOf = new Map((fixture.bandItems as { id: string }[]).map((i) => [i.id, i]));
const songOf = new Map((fixture.chordSongs as { id: string }[]).map((s) => [s.id, s]));

type Band = (typeof run.band)[number];

function truthsOf(id: string): Truths {
	const item = itemOf.get(id)! as unknown as {
		truth: {
			tempo: number | null;
			meter: string;
			key: string;
			tempoChanges: { bpm: number }[];
			keyChanges: { key: string }[];
		};
	};
	return {
		tempos: [item.truth.tempo, ...item.truth.tempoChanges.map((c) => c.bpm)].filter(
			(x): x is number => x !== null,
		),
		meter: item.truth.meter,
		keys: [item.truth.key, ...item.truth.keyChanges.map((c) => c.key)],
	};
}

const pulsed = (run.band as Band[]).filter((r) => r.class !== "pulseless");

// ---- G-beat: tempo, paired ----
console.log("Tempo (±1 bpm, any section; 6/8 accepts 3×; octave apart):");
let prodExact = 0;
let nbExact = 0;
let prodOct = 0;
let nbOct = 0;
let newFailure = 0;
for (const r of pulsed) {
	const t = truthsOf(r.itemId);
	const pe = tempoExact(r.prod.tempo.bpm, t);
	const ne = tempoExact(r.nbeat.tempo, t);
	const po = !pe && tempoOctave(r.prod.tempo.bpm, t);
	const no = !ne && tempoOctave(r.nbeat.tempo, t);
	prodExact += pe ? 1 : 0;
	nbExact += ne ? 1 : 0;
	prodOct += po ? 1 : 0;
	nbOct += no ? 1 : 0;
	if (pe && !ne && !no) newFailure++;
	console.log(
		`  ${r.itemId.padEnd(22)} ${r.class.padEnd(15)} truth ${t.tempos.join("/")} ${t.meter} | prod ${r.prod.tempo.bpm} ${pe ? "✓" : po ? "oct" : "✗"} | n-beat ${r.nbeat.tempo} ${ne ? "✓" : no ? "oct" : "✗"}`,
	);
}
for (const r of (run.band as Band[]).filter((x) => x.class === "pulseless")) {
	console.log(
		`  ${r.itemId.padEnd(22)} pulseless       n-beat tempo ${r.nbeat.tempo} (${r.nbeat.beats.length} beats; null is honest) | prod ${r.prod.tempo.bpm} (no null path)`,
	);
}
const gBeat = nbExact >= prodExact && nbOct <= prodOct && newFailure === 0;
console.log(
	`G-beat (n=${pulsed.length}): prod ${prodExact} exact/${prodOct} oct, n-beat ${nbExact} exact/${nbOct} oct, worse-than-octave regressions ${newFailure} → ${gBeat ? "PASS" : "FAIL"}`,
);

// ---- Beat/downbeat F-measure (N-beat only; D-prod has none) ----
let fSum = 0;
let dbSum = 0;
for (const r of pulsed) {
	const item = itemOf.get(r.itemId)! as unknown as { beats: number[]; barStarts: number[] };
	fSum += fMeasure(r.nbeat.beats, item.beats, 0.07);
	dbSum += fMeasure(r.nbeat.downbeats, item.barStarts.slice(0, -1), 0.07);
}
console.log(
	`Beat F@70ms mean ${(fSum / pulsed.length).toFixed(3)}, downbeat F ${(dbSum / pulsed.length).toFixed(3)} over ${pulsed.length} items`,
);

// ---- G-meter ----
const simple = pulsed.filter((r) => truthsOf(r.itemId).meter !== "6/8");
const compound = pulsed.filter((r) => truthsOf(r.itemId).meter === "6/8");
const prodMeter = simple.filter((r) => r.prod.meter.value === truthsOf(r.itemId).meter).length;
const nbMeter = simple.filter((r) => r.nbeat.meter === truthsOf(r.itemId).meter).length;
const nb68 = compound.filter((r) => r.nbeat.meter === "6/8").length;
const gMeter = nbMeter >= prodMeter && nb68 * 3 >= compound.length * 2;
console.log(
	`\nG-meter: 4/4+3/4 prod ${prodMeter}/${simple.length}, n-beat ${nbMeter}/${simple.length}; 6/8 n-beat ${nb68}/${compound.length} (prod cannot) → ${gMeter ? "PASS" : "FAIL"}`,
);

// ---- G-key: profiles ----
console.log("\nKey (any section's key counts; prod = KK):");
const counts = { kk: 0, as: 0, tp: 0 };
let newConfusionAS = 0;
let newConfusionTP = 0;
let kkMismatch = 0;
for (const r of pulsed) {
	const t = truthsOf(r.itemId);
	const kk = keyRight(r.keyProfiles.kk.value, t);
	const as = keyRight(r.keyProfiles.as.value, t);
	const tp = keyRight(r.keyProfiles.tp.value, t);
	counts.kk += kk ? 1 : 0;
	counts.as += as ? 1 : 0;
	counts.tp += tp ? 1 : 0;
	if (kk && !as) newConfusionAS++;
	if (kk && !tp) newConfusionTP++;
	if (r.keyProfiles.kk.value !== r.prod.key.value) kkMismatch++;
	if (!kk || !as || !tp) {
		console.log(
			`  ${r.itemId.padEnd(22)} truth ${t.keys.join("/")} | KK ${r.keyProfiles.kk.value} ${kk ? "✓" : "✗"} | AS ${r.keyProfiles.as.value} ${as ? "✓" : "✗"} | TP ${r.keyProfiles.tp.value} ${tp ? "✓" : "✗"}`,
		);
	}
}
if (kkMismatch) console.log(`  WARNING: KK-rebuild vs prod key mismatched on ${kkMismatch} items`);
const gKeyAS = counts.as - counts.kk >= 3 && newConfusionAS === 0;
const gKeyTP = counts.tp - counts.kk >= 3 && newConfusionTP === 0;
console.log(
	`G-key (n=${pulsed.length}): KK ${counts.kk}, AS ${counts.as} (new confusions ${newConfusionAS}) ${gKeyAS ? "PASS" : "FAIL"}, TP ${counts.tp} (new confusions ${newConfusionTP}) ${gKeyTP ? "PASS" : "FAIL"}`,
);

// ---- G-seg ----
console.log("\nSections (N-seg on N-beat's beats; ±4 s, ±0.5 s in brackets):");
const single = pulsed.filter((r) => (itemOf.get(r.itemId)! as unknown as { sections: { sections: unknown[] } }).sections.sections.length === 1);
const contrast = pulsed.filter((r) => r.class === "contrast");
const changey = pulsed.filter((r) => ["change", "hard-mediantmod"].includes(r.class));
function segGrade(r: Band, tol: number): { found: number; total: number; false: number } {
	const truth = (itemOf.get(r.itemId)! as unknown as { sections: { sections: { at: number }[] } }).sections.sections
		.filter((s) => s.at > 0.5)
		.map((s) => s.at);
	const bounds: number[] = r.nseg?.boundaries ?? [];
	const found = truth.filter((t) => bounds.some((b) => Math.abs(b - t) <= tol)).length;
	return { found, total: truth.length, false: bounds.filter((b) => !truth.some((t) => Math.abs(b - t) <= tol)).length };
}
let singleFalse = 0;
let cFound = 0;
let cTotal = 0;
let cFound05 = 0;
for (const r of [...contrast, ...changey, ...single]) {
	const g = segGrade(r, 4);
	const g05 = segGrade(r, 0.5);
	if (single.includes(r)) singleFalse += g.false;
	if (contrast.includes(r)) {
		cFound += g.found;
		cTotal += g.total;
		cFound05 += g05.found;
	}
	if (g.total > 0 || g.false > 0) {
		console.log(
			`  ${r.itemId.padEnd(22)} ${r.class.padEnd(15)} ${g.found}/${g.total} [${g05.found}/${g05.total}] +${g.false} false | bounds ${(r.nseg?.boundaries ?? []).map((b: number) => b.toFixed(1)).join(",") || "—"}`,
		);
	}
}
const changeFound = changey.reduce((a, r) => a + segGrade(r, 4).found, 0);
const changeTotal = changey.reduce((a, r) => a + segGrade(r, 4).total, 0);
const gSeg = singleFalse === 0 && cFound === cTotal;
console.log(
	`G-seg: single-section false ${singleFalse} over ${single.length} items; contrast ${cFound}/${cTotal} at ±4 s [${cFound05}/${cTotal} at ±0.5 s] (Study 8 chart arm: 8/8) → ${gSeg ? "PASS" : "FAIL"}; change/mediant boundaries (ungated, the model never heard them): ${changeFound}/${changeTotal}`,
);

// ---- G-chord ----
console.log("\nChords (per bar; maj-min reduction and full vocabulary):");
let mmMatcher = 0;
let mmN = 0;
let fullMatcher = 0;
let fullN = 0;
let bars = 0;
let hardMmMatcher = 0;
let hardMmN = 0;
let hardFullMatcher = 0;
let hardFullN = 0;
let hardBars = 0;
for (const c of run.chords as { itemId: string; nchord: { perBar: string[] } }[]) {
	const song = songOf.get(c.itemId)! as unknown as { truth: string[]; matcherPerBar: string[]; source: string };
	const hard = song.source === "progressions10";
	let sMm = 0;
	let sN = 0;
	let sFull = 0;
	let sNF = 0;
	for (const [b, t] of song.truth.entries()) {
		const m = song.matcherPerBar[b]!;
		const n = c.nchord.perBar[b] ?? "";
		const mmM = triadClass(m) === triadClass(t);
		const mmNc = triadClass(n) === triadClass(t);
		const fM = sameChord(t, m);
		const fN = n !== "" && sameChord(t, n);
		mmMatcher += mmM ? 1 : 0;
		mmN += mmNc ? 1 : 0;
		fullMatcher += fM ? 1 : 0;
		fullN += fN ? 1 : 0;
		sMm += mmNc ? 1 : 0;
		sN += mmM ? 1 : 0;
		sFull += fN ? 1 : 0;
		sNF += fM ? 1 : 0;
		bars++;
		if (hard) {
			hardMmMatcher += mmM ? 1 : 0;
			hardMmN += mmNc ? 1 : 0;
			hardFullMatcher += fM ? 1 : 0;
			hardFullN += fN ? 1 : 0;
			hardBars++;
		}
	}
	console.log(
		`  ${c.itemId.padEnd(16)} ${hard ? "hard " : "plain"} n-chord mm ${sMm}/${song.truth.length} full ${sFull}/${song.truth.length} | matcher mm ${sN}/${song.truth.length} full ${sNF}/${song.truth.length}`,
	);
}
const gChord =
	mmN >= mmMatcher && fullN > fullMatcher && hardMmN >= hardMmMatcher && hardFullN > hardFullMatcher;
console.log(
	`G-chord: maj-min n-chord ${mmN}/${bars} vs matcher ${mmMatcher}/${bars}; full n-chord ${fullN}/${bars} vs matcher ${fullMatcher}/${bars}; hard set mm ${hardMmN}/${hardBars} vs ${hardMmMatcher}/${hardBars}, full ${hardFullN}/${hardBars} vs ${hardFullMatcher}/${hardBars} → ${gChord ? "PASS" : "FAIL"}`,
);

// ---- Deployment cost ----
console.log("\nDeployment cost (onnxruntime CPU on this VM; per 90 s of audio, median):");
const per90 = (xs: { ms: number; durationSec: number }[]) => {
	const v = xs.map((x) => (x.ms * 90) / x.durationSec).sort((a, b) => a - b);
	return v[Math.floor(v.length / 2)]!;
};
console.log(
	`  N-beat ${Math.round(per90(pulsed.map((r) => ({ ms: r.nbeat.ms, durationSec: r.durationSec }))))} ms (10.4 MB), N-seg ${Math.round(per90(pulsed.filter((r) => r.nseg).map((r) => ({ ms: r.nseg.ms, durationSec: r.durationSec }))))} ms (1.6 MB), D-prod ${Math.round(per90(pulsed.map((r) => ({ ms: r.prod.ms, durationSec: r.durationSec }))))} ms (0 MB)`,
);
const chordCost = (run.chords as { itemId: string; nchord: { ms: number } }[]).map((c) => ({
	ms: c.nchord.ms,
	durationSec: ((songOf.get(c.itemId)! as unknown as { truth: string[] }).truth.length * 4 * 60) / (songOf.get(c.itemId)! as unknown as { bpm: number }).bpm,
}));
console.log(`  N-chord ${Math.round(per90(chordCost))} ms (17.1 MB; budget: ≤ 25 MB, ≤ 10 s / 90 s)`);
