/**
 * Study 16b run (docs/BRIEF-STUDY16B.md): Study 16's arm C pairings
 * through the SHIPPED two-clause samePiece (alignedPlacements at
 * 2d585b75). Zero spend; alignment inputs identical to Study 16, so the
 * only question is the verdicts and that nothing else moved.
 */
import { readFileSync, writeFileSync } from "node:fs";
import declared from "../corpus/badverbs-declared.json";
import study16 from "../results/study16.json";
import type { ChartBar } from "../src/study14/chartBars.js";
import { alignChart } from "../src/study15/chartAlignment.js";
import { barmarkChartBars } from "../src/study16/barmarkChartBars.js";
import { alignedPlacements } from "../src/study16b/alignedPlacements.js";

const root = new URL("../", import.meta.url).pathname;
const fail: string[] = [];
const gate = (id: string, ok: boolean, detail: string) => {
	console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`);
	if (!ok) fail.push(id);
};

type Declared = { slug: string; chart: string | null; defaults: { tempo: number | null; meter: string | null }; sections: { name: string; start: number }[] | null };
const SONGS = (declared.songs as Declared[]).filter((s) => s.chart && s.sections);
const barsOf = new Map<string, ChartBar[]>();
const audioOf = new Map<string, Float32Array>();
for (const s of SONGS) {
	const read = barmarkChartBars(readFileSync(`${root}${s.chart}`, "utf8"), s.defaults);
	if (!read || read.warnings.length) throw new Error(`${s.slug}: unexpected parse state`);
	barsOf.set(s.slug, read.bars);
	const buf = readFileSync(`${root}corpus-mmkk/${s.slug}/mix.mp3.22050.f32le.raw`);
	audioOf.set(s.slug, new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
}
const SLUGS = SONGS.map((s) => s.slug);

interface PairResult {
	rec: string;
	chart: string;
	kind: "right" | "wrong";
	ratio?: number;
	samePiece?: boolean;
	refused?: string;
}
const pairs: PairResult[] = [];
const placements16 = new Map((study16.real as { slug: string; sections: { name: string; placed: number; hedged: boolean }[] }[]).map((r) => [r.slug, r.sections]));
let placementsEqual = true;
let hedgesEqual = true;

for (const rec of SLUGS) {
	for (const chart of SLUGS) {
		const kind = rec === chart ? "right" : "wrong";
		try {
			const a = alignChart(barsOf.get(chart)!, audioOf.get(rec)!, 22050);
			const p = alignedPlacements(barsOf.get(chart)!, a);
			pairs.push({ rec, chart, kind, ratio: p.ratio, samePiece: p.samePiece });
			if (kind === "right") {
				const base = placements16.get(rec)!;
				for (const [k, sec] of p.sections.entries()) {
					if (Math.abs(sec.start - base[k]!.placed) > 0.01) placementsEqual = false;
					if (sec.hedged !== base[k]!.hedged) hedgesEqual = false;
				}
			}
			console.log(`${kind} ${rec}⊗${chart}: ratio ${p.ratio.toFixed(2)} samePiece ${p.samePiece}`);
		} catch (e) {
			pairs.push({ rec, chart, kind, refused: (e as Error).message });
			console.log(`${kind} ${rec}⊗${chart}: REFUSED (${(e as Error).message.slice(0, 60)})`);
		}
	}
}

const rights = pairs.filter((p) => p.kind === "right");
const wrongs = pairs.filter((p) => p.kind === "wrong" && !p.refused);
const escapee = pairs.find((p) => p.rec === "eat-all-the-clocks" && p.chart === "mop-heart");
gate("16b-G2", rights.every((p) => p.samePiece === true), `right pairs samePiece: ${rights.map((p) => p.samePiece).join(",")}`);
gate(
	"16b-G3",
	wrongs.every((p) => p.samePiece === false),
	`${wrongs.length} alignable wrong pairs all false (escapee eat⊗mop ratio ${escapee?.ratio?.toFixed(2)} → samePiece ${escapee?.samePiece})`,
);
gate("16b-G4", placementsEqual && hedgesEqual, `right-pair placements within 0.01 s of Study 16 and hedges unchanged`);

const correct = rights.filter((p) => p.samePiece === true).length + wrongs.filter((p) => p.samePiece === false).length;
console.log(`\npredictions: P1 ${correct}/${rights.length + wrongs.length} pair verdicts correct; P2 placements equal ${placementsEqual}`);

writeFileSync(
	`${root}results/study16b.json`,
	`${JSON.stringify({ version: 1, pin: "2d585b75", pairs, placementsEqual, hedgesEqual, gates: { failed: fail } }, null, "\t")}\n`,
);
console.log(`study16b.json written; gates ${fail.length ? `FAILED: ${fail.join(", ")}` : "all pass"}`);
