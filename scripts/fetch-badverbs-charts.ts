/**
 * Study 16 corpus fetch (docs/BRIEF-STUDY16.md): the band's STORED,
 * MIGRATED barmark charts and the CURRENT declared sections, from the
 * same public Badverbs song pages as scripts/fetch-mmkk.ts (Kevin
 * authorized the download for Study 10's amendment; the band is
 * Badverbs — "mmkk" survives only as the account slug). The app's
 * sections lost their roman-numeral index at a0926c65, so a section is
 * {name, start}. Charts land in corpus/badverbs-charts/<slug>.chart.md
 * verbatim; the declared record (sections with starts, and the settings
 * rows at 0:00 that production hands the parser as defaults) in
 * corpus/badverbs-declared.json. This script extracts and commits; it
 * never parses a chart — grading waits for the registered run.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sources from "../corpus/mmkk-sources.json";

const root = new URL("../", import.meta.url).pathname;

/** Minimal devalue decode of a SvelteKit __data.json data node (fetch-mmkk.ts). */
function decodeNode(data: unknown[]): unknown {
	const seen = new Map<number, unknown>();
	function resolve(i: number): unknown {
		if (i < 0) return [undefined, undefined, NaN, Infinity, -Infinity, -0][-i - 1];
		if (seen.has(i)) return seen.get(i);
		const v = data[i];
		if (v === null || typeof v !== "object") {
			seen.set(i, v);
			return v;
		}
		if (Array.isArray(v)) {
			if (v.length === 2 && v[0] === "Date") return new Date(v[1] as string);
			const out: unknown[] = [];
			seen.set(i, out);
			for (const idx of v) out.push(resolve(idx as number));
			return out;
		}
		const out: Record<string, unknown> = {};
		seen.set(i, out);
		for (const [k, idx] of Object.entries(v)) out[k] = resolve(idx as number);
		return out;
	}
	return resolve(0);
}

/** Every object in the tree, flattened (fetch-mmkk.ts). */
function walk(v: unknown, out: Record<string, unknown>[] = [], depth = 0): Record<string, unknown>[] {
	if (depth > 24 || v === null || typeof v !== "object") return out;
	if (Array.isArray(v)) {
		for (const x of v) walk(x, out, depth + 1);
		return out;
	}
	out.push(v as Record<string, unknown>);
	for (const x of Object.values(v)) walk(x, out, depth + 1);
	return out;
}

/** A barmark chart text: has a bar line and (for the band's charts) a heading. */
function looksLikeChart(s: string): boolean {
	const lines = s.split("\n");
	return lines.some((l) => l.trimStart().startsWith("|")) && lines.some((l) => l.startsWith("## "));
}

mkdirSync(`${root}corpus/badverbs-charts`, { recursive: true });
const songsOut: unknown[] = [];
for (const pageUrl of sources.songs) {
	const slug = pageUrl.split("/").pop()!;
	const res = await fetch(`${pageUrl}/__data.json`);
	if (!res.ok) throw new Error(`${res.status} ${pageUrl}`);
	const payload = (await res.json()) as { nodes: ({ type: string; data: unknown[] } | null)[] };
	const objects = payload.nodes
		.filter((n): n is { type: string; data: unknown[] } => n?.type === "data")
		.flatMap((n) => walk(decodeNode(n.data)));

	// The chart: a score row {kind: "chart", markdown}, else the longest chart-shaped string.
	let chart: string | null = null;
	for (const o of objects) {
		if (o.kind === "chart" && typeof o.markdown === "string" && looksLikeChart(o.markdown)) chart = o.markdown;
	}
	if (!chart) {
		for (const o of objects) {
			for (const v of Object.values(o)) {
				if (typeof v === "string" && looksLikeChart(v) && v.length > (chart?.length ?? 0)) chart = v;
			}
		}
	}

	// Settings rows at 0:00 — production's parser defaults ({tempo: at0("tempo"), meter: at0("meter")}).
	const settingRows = objects.filter(
		(o) => typeof o.kind === "string" && typeof o.value === "string" && typeof o.start === "number",
	) as { kind: string; start: number; value: string }[];
	const at0 = (kind: string) =>
		settingRows
			.filter((r) => r.kind === kind)
			.sort((a, b) => a.start - b.start)[0]?.value ?? null;

	// Sections, post-a0926c65: {name, start}, no numeral index; settings rows carry `kind`, sections do not.
	const sections = objects
		.filter((o) => typeof o.name === "string" && typeof o.start === "number" && o.kind === undefined)
		.map((o) => ({ name: o.name as string, start: o.start as number }))
		.sort((a, b) => a.start - b.start);

	if (chart) writeFileSync(`${root}corpus/badverbs-charts/${slug}.chart.md`, chart.endsWith("\n") ? chart : `${chart}\n`);
	songsOut.push({
		slug,
		page: pageUrl,
		chart: chart ? `corpus/badverbs-charts/${slug}.chart.md` : null,
		chartChars: chart?.length ?? null,
		defaults: { tempo: at0("tempo") ? Number(at0("tempo")) : null, meter: at0("meter"), key: at0("key") },
		sections: sections.length ? sections : null,
	});
	console.log(
		`${slug}: chart ${chart ? `${chart.length} chars` : "NONE"}, defaults ${at0("key") ?? "—"} ${at0("meter") ?? "—"} ${at0("tempo") ?? "—"} bpm, ${sections.length} sections`,
	);
}

writeFileSync(
	`${root}corpus/badverbs-declared.json`,
	`${JSON.stringify({ version: 1, fetched: "2026-11-01", note: "Study 16 corpus: the stored migrated charts (verbatim in corpus/badverbs-charts/) and the band's current declared sections and 0:00 settings, from the public Badverbs pages.", songs: songsOut }, null, "\t")}\n`,
);
console.log("\nbadverbs-declared.json written");
