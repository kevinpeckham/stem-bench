/**
 * Study 10 Amendment 1 analyzer (docs/BRIEF-STUDY10.md, "Amendment 1"):
 * the MMKK table. Tempo vs any declared row at ±1 and ±3 (both
 * registered), octave apart; meter and key vs declarations (blank
 * unscored); sections vs the band's declared start seconds at ±4 s and
 * ±0.5 s for N-seg and D-activity. Disagreement rule: a scored miss is
 * flagged where the audio's own evidence disputes the declaration.
 */
import { readFileSync } from "node:fs";
import { keyEqual } from "../src/grading/listen.js";

const root = new URL("../", import.meta.url).pathname;
const run = JSON.parse(readFileSync(`${root}results/study10-mmkk.json`, "utf8"));

/** "F#maj" / "Emin" → the bench's key names. */
function declaredKey(v: string): string {
	const m = v.match(/^([A-G][#b]?)(maj|min)$/i);
	if (!m) return v;
	return `${m[1]} ${m[2]!.toLowerCase() === "min" ? "minor" : "major"}`;
}
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

type Song = (typeof run.songs)[number];

console.log("Tempo vs declaration (±1 | ±3; octave apart):");
const rows: { name: string; prod1: boolean; prod3: boolean; nb1: boolean; nb3: boolean }[] = [];
for (const s of run.songs as Song[]) {
	const declared: number[] = s.declared.tempo.map((t: { value: number }) => t.value);
	if (!declared.length) {
		console.log(`  ${s.slug.padEnd(24)} no declared tempo — unscored (prod ${s.prod.tempo.bpm}, n-beat ${s.nbeat.tempo})`);
		continue;
	}
	const grade = (bpm: number | null, tol: number) => bpm !== null && declared.some((d) => near(bpm, d, tol));
	const oct = (bpm: number | null) => bpm !== null && declared.some((d) => near(bpm, d * 2, 1) || near(bpm, d / 2, 1));
	const r = {
		name: s.slug,
		prod1: grade(s.prod.tempo.bpm, 1),
		prod3: grade(s.prod.tempo.bpm, 3),
		nb1: grade(s.nbeat.tempo, 1),
		nb3: grade(s.nbeat.tempo, 3),
	};
	rows.push(r);
	console.log(
		`  ${s.slug.padEnd(24)} declared ${declared.join("/")} | prod ${s.prod.tempo.bpm} ${r.prod1 ? "✓" : r.prod3 ? "✓3" : oct(s.prod.tempo.bpm) ? "oct" : "✗"} | n-beat ${s.nbeat.tempo} ${r.nb1 ? "✓" : r.nb3 ? "✓3" : oct(s.nbeat.tempo) ? "oct" : "✗"}`,
	);
}
console.log(
	`  totals (n=${rows.length}): ±1 prod ${rows.filter((r) => r.prod1).length}, n-beat ${rows.filter((r) => r.nb1).length}; ±3 prod ${rows.filter((r) => r.prod3).length}, n-beat ${rows.filter((r) => r.nb3).length}`,
);

console.log("\nMeter vs declaration:");
let pm = 0;
let nm = 0;
let mn = 0;
for (const s of run.songs as Song[]) {
	const declared = s.declared.meter.map((m: { value: string }) => m.value);
	if (!declared.length) continue;
	mn++;
	const p = declared.includes(s.prod.meter.value);
	const n = declared.includes(s.nbeat.meter);
	pm += p ? 1 : 0;
	nm += n ? 1 : 0;
	console.log(`  ${s.slug.padEnd(24)} declared ${declared.join("/")} | prod ${s.prod.meter.value} ${p ? "✓" : "✗"} | n-beat ${s.nbeat.meter} ${n ? "✓" : "✗"}`);
}
console.log(`  totals (n=${mn}): prod ${pm}, n-beat ${nm}`);

console.log("\nKey vs declaration (any declared row):");
const kc = { kk: 0, as: 0, tp: 0 };
let kn = 0;
for (const s of run.songs as Song[]) {
	const declared = s.declared.key.map((k: { value: string }) => declaredKey(k.value));
	if (!declared.length) continue;
	kn++;
	const g = (v: string) => declared.some((d: string) => keyEqual(v, d));
	const kk = g(s.keys.kk.value);
	const as = g(s.keys.as.value);
	const tp = g(s.keys.tp.value);
	kc.kk += kk ? 1 : 0;
	kc.as += as ? 1 : 0;
	kc.tp += tp ? 1 : 0;
	console.log(
		`  ${s.slug.padEnd(24)} declared ${declared.join("/")} | KK ${s.keys.kk.value} ${kk ? "✓" : "✗"} | AS ${s.keys.as.value} ${as ? "✓" : "✗"} | TP ${s.keys.tp.value} ${tp ? "✓" : "✗"}`,
	);
}
console.log(`  totals (n=${kn}): KK ${kc.kk}, AS ${kc.as}, TP ${kc.tp}`);

console.log("\nSections vs declared starts (±4 s [±0.5 s]):");
for (const s of run.songs as Song[]) {
	if (!s.sections) continue;
	const truth = s.sections.map((x: { start: number }) => x.start).filter((t: number) => t > 0.5);
	const gradeB = (bounds: number[], tol: number) => ({
		found: truth.filter((t: number) => bounds.some((b) => near(b, t, tol))).length,
		false: bounds.filter((b) => b > 0.5 && !truth.some((t: number) => near(b, t, tol))).length,
	});
	for (const [label, bounds] of [
		["n-seg", s.nseg?.boundaries ?? []],
		["d-activity", s.activity?.boundaries ?? []],
	] as [string, number[]][]) {
		const g4 = gradeB(bounds, 4);
		const g05 = gradeB(bounds, 0.5);
		console.log(
			`  ${s.slug.padEnd(24)} ${label.padEnd(10)} ${g4.found}/${truth.length} [${g05.found}/${truth.length}] +${g4.false} false`,
		);
	}
}
