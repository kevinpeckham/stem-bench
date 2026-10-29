/**
 * Study 10 MMKK amendment fetch (docs/BRIEF-STUDY10.md, "Real
 * recordings"): downloads the public MMKK catalog named in
 * corpus/mmkk-sources.json from stemshovel.com's public song pages —
 * the band's declared settings (key, meter, tempo), the chart document
 * (section structure), each stem's ORIGINAL upload and the rendered
 * mix. Audio goes to corpus-mmkk/ (gitignored) with a 22050 Hz mono
 * f32le decode beside each file (ffmpeg); the committed record is
 * corpus/fixture-mmkk.json: urls, SHA-256 hashes, byte sizes,
 * durations, and every scored label with its provenance. Blank labels
 * are recorded as absent, never invented.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sources from "../corpus/mmkk-sources.json";

const root = new URL("../", import.meta.url).pathname;

/** Minimal devalue decode of a SvelteKit __data.json data node. */
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

/** Every object in the tree, flattened. */
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

async function download(url: string, to: string): Promise<{ sha256: string; bytes: number }> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	const buf = Buffer.from(await res.arrayBuffer());
	writeFileSync(to, buf);
	return { sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
}

/** ffmpeg decode to the bench shape; returns seconds. */
function toRaw(file: string): { raw: string; seconds: number } {
	const raw = `${file}.22050.f32le.raw`;
	execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-ac", "1", "-ar", "22050", "-f", "f32le", raw]);
	const bytes = readFileSync(raw).length;
	return { raw, seconds: bytes / 4 / 22050 };
}

const songsOut: unknown[] = [];
for (const pageUrl of sources.songs) {
	const slug = pageUrl.split("/").pop()!;
	const dir = `${root}corpus-mmkk/${slug}`;
	mkdirSync(dir, { recursive: true });
	const res = await fetch(`${pageUrl}/__data.json`);
	if (!res.ok) throw new Error(`${res.status} ${pageUrl}`);
	const payload = (await res.json()) as { nodes: ({ type: string; data: unknown[] } | null)[] };
	const objects = payload.nodes
		.filter((n): n is { type: string; data: unknown[] } => n?.type === "data")
		.flatMap((n) => walk(decodeNode(n.data)));

	// Settings rows: {kind: "key"|"meter"|"tempo", start: seconds, value} as the band entered them.
	const settingRows = objects.filter(
		(o) => typeof o.kind === "string" && typeof o.value === "string" && typeof o.start === "number",
	) as { kind: string; start: number; value: string }[];
	const rowsOf = (kind: string) =>
		settingRows.filter((r) => r.kind === kind).sort((a, b) => a.start - b.start);
	// The song row: has title + slug matching the page.
	const song = objects.find((o) => o.slug === slug && typeof o.title === "string");
	// The chart doc: the longest string field containing "**" structure markup.
	let chart: string | null = null;
	for (const o of objects) {
		for (const v of Object.values(o)) {
			if (typeof v === "string" && v.includes("**") && v.length > (chart?.length ?? 199)) chart = v;
		}
	}
	// Sections declared with START TIMES in seconds: {index, name, start}.
	const sections = objects
		.filter((o) => typeof o.index === "string" && typeof o.name === "string" && typeof o.start === "number")
		.map((o) => ({ index: o.index as string, name: o.name as string, start: o.start as number }))
		.sort((a, b) => a.start - b.start);
	// Stems: {label, url, durationSeconds, sampleRate, sizeBytes} with the original upload url.
	const stems = objects.filter(
		(o) =>
			typeof o.label === "string" &&
			typeof o.url === "string" &&
			(o.url as string).includes(".public.blob.vercel-storage.com") &&
			!(o.url as string).includes(".play-") &&
			!(o.url as string).includes("/midi/"),
	);
	// The mix: any url with /mix- and .mp3.
	const mixUrl = objects
		.flatMap((o) => Object.values(o))
		.find((v): v is string => typeof v === "string" && v.includes("/mix-") && v.endsWith(".mp3"));

	const stemsOut: unknown[] = [];
	for (const s of stems) {
		const url = s.url as string;
		const file = `${dir}/${url.split("/").pop()}`;
		const dl = await download(url, file);
		const dec = toRaw(file);
		stemsOut.push({
			name: s.label,
			url,
			...dl,
			seconds: Math.round(dec.seconds * 10) / 10,
			declaredSampleRate: s.sampleRate ?? null,
		});
		console.log(`  stem ${s.label}: ${(dl.bytes / 1e6).toFixed(1)} MB, ${dec.seconds.toFixed(0)}s`);
	}
	let mixOut: unknown = null;
	if (mixUrl) {
		const file = `${dir}/mix.mp3`;
		const dl = await download(mixUrl, file);
		const dec = toRaw(file);
		mixOut = { url: mixUrl, ...dl, seconds: Math.round(dec.seconds * 10) / 10 };
	}
	songsOut.push({
		slug,
		page: pageUrl,
		title: song?.title ?? slug,
		declared: {
			// Provenance: the song settings rows ({kind, start, value}) in the
			// public page payload, as the band entered them; starts in seconds.
			key: rowsOf("key").map((r) => ({ start: r.start, value: r.value })),
			meter: rowsOf("meter").map((r) => ({ start: r.start, value: r.value })),
			tempo: rowsOf("tempo").map((r) => ({ start: r.start, value: Number(r.value) })),
		},
		sections: sections.length ? sections : null,
		chart: chart,
		stems: stemsOut,
		mix: mixOut,
	});
	console.log(
		`${slug}: declared ${rowsOf("key").map((r) => r.value).join("/") || "—"} ${rowsOf("meter").map((r) => r.value).join("/") || "—"} ${rowsOf("tempo").map((r) => r.value).join("/") || "—"} bpm, ${stemsOut.length} stems, ${sections.length} sections with starts`,
	);
}

writeFileSync(
	`${root}corpus/fixture-mmkk.json`,
	`${JSON.stringify({ version: 1, fetched: "2026-10-29", sources: sources.songs.length, songs: songsOut }, null, "\t")}\n`,
);
console.log(`\nfixture-mmkk.json: ${songsOut.length} songs`);
