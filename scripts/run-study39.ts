/**
 * Study 39 (docs/BRIEF-STUDY39.md), $0: eight downbeat systems against
 * annotated bar lines on 48 free-tempo performances (Winterreise SC06 and
 * HU33) and three steady-drift 78s (JAAH). Per cell: downbeat precision,
 * recall and F at 70 ms and at 150 ms, the bar fold of the median
 * tracker bar against the median annotated bar, the bar-count ratio, and
 * the registered "chartable" verdict (recall at 70 ms ≥ 0.8 with a fold
 * ratio of 1 or 1/2). Writes results/study39.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { downbeatF, foldCompare, median, summarizeTracker } from "../src/study36/metrical.js";

const root = new URL("../", import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(`${root}corpus/study39-manifest.json`, "utf8")) as {
	entries: Record<string, { group: string; performance: string; annotatedBars: number[] }>;
};
const trackers = JSON.parse(readFileSync(`${root}results/study39-trackers.json`, "utf8")) as Record<string, Record<string, { beats: number[]; downbeats: number[] }>>;
const SYSTEMS = ["beatthis-final0", "beatthis-small0", "beatthis-final0-dbn", "madmom-34-l100", "madmom-34-l30", "madmom-34-l10", "madmom-34-l3", "madmom-346-l100"];
const CHARTABLE_RECALL = 0.8;

interface Cell {
	truthBar: number;
	barSec: number | null;
	beatsPerBar: number | null;
	fold: number;
	strict: boolean;
	folded: boolean;
	f70: number;
	p70: number;
	r70: number;
	f150: number;
	r150: number;
	barCountRatio: number;
	chartable: boolean;
}
const cells: Record<string, Record<string, Cell>> = {};
for (const [slug, e] of Object.entries(manifest.entries)) {
	const bars = e.annotatedBars;
	if (bars.length < 2) continue;
	const truthBar = median(bars.slice(1).map((b, i) => b - bars[i]!));
	const first = bars[0]!;
	const last = bars[bars.length - 1]!;
	cells[slug] = {};
	for (const sys of SYSTEMS) {
		const t = trackers[slug]?.[sys];
		if (!t) continue;
		const s = summarizeTracker(t.beats, t.downbeats);
		const fc = s.barSec ? foldCompare(s.barSec, truthBar, 0.04) : { ratio: Number.NaN, strict: false, folded: false };
		const a = downbeatF(t.downbeats, bars, 0.07, first - 0.5, last + 0.5);
		const b = downbeatF(t.downbeats, bars, 0.15, first - 0.5, last + 0.5);
		const inRange = t.downbeats.filter((d) => d >= first - 0.5 && d <= last + 0.5).length;
		cells[slug][sys] = {
			truthBar,
			barSec: s.barSec,
			beatsPerBar: s.beatsPerBar,
			fold: fc.ratio,
			strict: fc.strict,
			folded: fc.folded,
			f70: +a.f.toFixed(3),
			p70: +a.precision.toFixed(3),
			r70: +a.recall.toFixed(3),
			f150: +b.f.toFixed(3),
			r150: +b.recall.toFixed(3),
			barCountRatio: +(inRange / bars.length).toFixed(3),
			chartable: a.recall >= CHARTABLE_RECALL && fc.folded && (fc.ratio === 1 || fc.ratio === 0.5),
		};
	}
}

const groups: Record<string, (slug: string) => boolean> = {
	SC06: (s) => s.endsWith("-sc06"),
	HU33: (s) => s.endsWith("-hu33"),
	winterreise: (s) => s.startsWith("swd-"),
	jaah: (s) => manifest.entries[s]!.group === "jaah",
};
const summary: Record<string, Record<string, unknown>> = {};
for (const [g, f] of Object.entries(groups)) {
	summary[g] = {};
	for (const sys of SYSTEMS) {
		const xs = Object.entries(cells)
			.filter(([slug]) => f(slug))
			.map(([, c]) => c[sys])
			.filter((c): c is Cell => !!c);
		if (!xs.length) continue;
		const med = (k: keyof Cell) => +median(xs.map((c) => c[k] as number)).toFixed(3);
		const row = {
			n: xs.length,
			f70: med("f70"),
			p70: med("p70"),
			r70: med("r70"),
			f150: med("f150"),
			r150: med("r150"),
			strict: xs.filter((c) => c.strict).length,
			folded: xs.filter((c) => c.folded).length,
			half: xs.filter((c) => !c.strict && c.fold === 0.5).length,
			double: xs.filter((c) => !c.strict && c.fold === 2).length,
			chartable: xs.filter((c) => c.chartable).length,
		};
		summary[g][sys] = row;
		console.log(
			`${g.padEnd(11)} ${sys.padEnd(20)} n=${row.n}: F70 ${row.f70} (P ${row.p70} R ${row.r70}) | F150 ${row.f150} R150 ${row.r150} | strict ${row.strict} folded ${row.folded} (half ${row.half}, double ${row.double}) | chartable ${row.chartable}`,
		);
	}
}
// predictions
const w = summary.winterreise as Record<string, { r70: number; f70: number; chartable: number; n: number }>;
const j = summary.jaah as Record<string, { f70: number }>;
const ok = (b: boolean) => (b ? "PASS" : "FAIL");
console.log("\nP1 Beat This final0 recall@70 median >= 0.75 on Winterreise:", w["beatthis-final0"]?.r70, ok((w["beatthis-final0"]?.r70 ?? 0) >= 0.75));
console.log("P2 madmom l10 recall@70 median exceeds l100 by >= 0.15:", w["madmom-34-l100"]?.r70, "->", w["madmom-34-l10"]?.r70, ok((w["madmom-34-l10"]?.r70 ?? 0) - (w["madmom-34-l100"]?.r70 ?? 0) >= 0.15));
console.log("P3 Beat This + DBN below Beat This peak-picking on Winterreise F70:", w["beatthis-final0-dbn"]?.f70, "<", w["beatthis-final0"]?.f70, ok((w["beatthis-final0-dbn"]?.f70 ?? 1) < (w["beatthis-final0"]?.f70 ?? 0)));
console.log("P4 madmom l100 has the best F70 on the JAAH 78s:", Object.entries(j).map(([k, v]) => `${k} ${v.f70}`).join(", "), ok(Object.entries(j).every(([, v]) => v.f70 <= (j["madmom-34-l100"]?.f70 ?? 0))));
const sc = summary.SC06 as Record<string, { r70: number }>;
const hu = summary.HU33 as Record<string, { r70: number }>;
const p5 = SYSTEMS.every((s) => Math.abs((sc[s]?.r70 ?? 0) - (hu[s]?.r70 ?? 0)) <= 0.1);
console.log("P5 SC06 vs HU33 recall@70 within 0.10 for every system:", ok(p5));
const best = Object.entries(w).sort((a, b) => b[1].chartable - a[1].chartable || b[1].r70 - a[1].r70)[0]!;
console.log(`S39-D1: most chartable system on Winterreise = ${best[0]} (${best[1].chartable} of ${best[1].n}; recall@70 ${best[1].r70}) -> ${best[1].chartable >= 0.75 * best[1].n ? "ADOPT as the free-tempo tracker" : "none reaches 75%: hold the free-tempo path for the draft-format study"}`);
writeFileSync(`${root}results/study39.json`, `${JSON.stringify({ CHARTABLE_RECALL, summary, cells }, null, "\t")}\n`);
console.log("results/study39.json written");
