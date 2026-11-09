/**
 * Study 34 corpus fetch (docs/CORPUS-STUDY34.md): downloads the ten
 * external recordings named in corpus/study34-sources.json (the two
 * badverbs slots reuse corpus-mmkk/). Audio goes to corpus-study34/
 * (gitignored) with a 22050 Hz mono f32le decode beside each file; the
 * committed record is corpus/fixture-study34.json: source URL, SHA-256,
 * bytes, duration and license per item. archive.org items are resolved
 * through the metadata API to their best audio file (a named file when
 * the manifest pins one, else the restored/longest MP3/FLAC).
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sources from "../corpus/study34-sources.json";

const root = new URL("../", import.meta.url).pathname;
const dir = `${root}corpus-study34`;
mkdirSync(dir, { recursive: true });

interface Item {
	slug: string;
	kind: string;
	source?: string;
	page?: string;
	identifier?: string;
	identifierOverride?: string;
	file?: string;
	category: string;
	license?: string;
	truth: string;
	declared?: Record<string, unknown>;
}

async function download(url: string, to: string): Promise<{ sha256: string; bytes: number }> {
	const res = await fetch(url, { redirect: "follow" });
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	const buf = Buffer.from(await res.arrayBuffer());
	writeFileSync(to, buf);
	return { sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
}

function decodeMono(file: string): number {
	const raw = `${file}.22050.f32le.raw`;
	if (!existsSync(raw))
		execFileSync("ffmpeg", ["-y", "-v", "error", "-i", file, "-f", "f32le", "-ar", "22050", "-ac", "1", raw]);
	const bytes = readFileSync(raw).byteLength;
	return bytes / 4 / 22050;
}

/** The item's audio file on archive.org: the pinned name, else the longest original MP3/FLAC. */
async function archiveFileUrl(identifier: string, pinned?: string): Promise<{ url: string; name: string }> {
	const meta = (await (await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`)).json()) as {
		files: { name: string; format?: string; length?: string; source?: string }[];
	};
	if (pinned) {
		const f = meta.files.find((x) => x.name === pinned);
		if (!f) throw new Error(`pinned file not in ${identifier}: ${pinned}`);
		return { url: `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`, name: f.name };
	}
	const seconds = (len?: string): number => {
		if (!len) return 0;
		if (/^[\d.]+$/.test(len)) return Number(len);
		return len.split(":").reduce((acc, part) => acc * 60 + Number(part), 0); // "mm:ss" on georgeblood items
	};
	const audio = meta.files
		.filter((x) => /(mp3|flac)/i.test(x.format ?? "") && seconds(x.length) > 0)
		.filter((x) => !/_(sample|preview)/.test(x.name))
		.sort((a, b) => seconds(b.length) - seconds(a.length));
	// georgeblood items carry multiple restoration passes of the same side; prefer the plain/restored take
	const preferred = audio.find((x) => /restored/i.test(x.name)) ?? audio[0];
	if (!preferred) throw new Error(`no audio file in ${identifier}`);
	return { url: `https://archive.org/download/${identifier}/${encodeURIComponent(preferred.name)}`, name: preferred.name };
}

/** The Download MP3 link on a joshwoodward.com song page. */
async function pageMp3Url(page: string): Promise<string> {
	const html = await (await fetch(page)).text();
	const m = html.match(/href="([^"]+\.mp3)"/i);
	if (!m) throw new Error(`no mp3 link on ${page}`);
	return new URL(m[1]!, page).href;
}

const out: Record<string, unknown>[] = [];
for (const item of sources.items as Item[]) {
	if (item.kind === "badverbs") {
		const raw = `${root}${item.source}/mix.mp3.22050.f32le.raw`;
		if (!existsSync(raw)) throw new Error(`badverbs raw missing: ${raw} (run fetch-mmkk first)`);
		out.push({ ...item, note: "reuses corpus-mmkk, no fetch" });
		console.log(`${item.slug}: badverbs inventory, ok`);
		continue;
	}
	let url: string;
	let name: string;
	if (item.kind === "archive") {
		const id = item.identifierOverride ?? item.identifier!;
		({ url, name } = await archiveFileUrl(id, item.file));
	} else if (item.kind === "page-mp3") {
		url = await pageMp3Url(item.page!);
		name = url.split("/").pop()!;
	} else throw new Error(`unknown kind ${item.kind}`);
	const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : ".mp3";
	const file = `${dir}/${item.slug}${ext}`;
	const got = existsSync(file)
		? { sha256: createHash("sha256").update(readFileSync(file)).digest("hex"), bytes: readFileSync(file).byteLength }
		: await download(url, file);
	const duration = decodeMono(file);
	out.push({ ...item, url, file: name, sha256: got.sha256, bytes: got.bytes, durationSec: Math.round(duration * 100) / 100 });
	console.log(`${item.slug}: ${(got.bytes / 1e6).toFixed(1)} MB, ${duration.toFixed(1)} s  (${name})`);
}

writeFileSync(
	`${root}corpus/fixture-study34.json`,
	`${JSON.stringify({ version: 1, fetched: "2026-11-09", items: out }, null, "\t")}\n`,
);
console.log(`\nfixture-study34.json: ${out.length} items`);
