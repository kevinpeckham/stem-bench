/**
 * Study 49 (docs/BRIEF-STUDY49.md): run Basic Pitch once per bass stem and
 * write its notes under each registered configuration (src/study49/rules.ts)
 * to <stem folder>/study49/<id>.json (gitignored). No truth is read here.
 *   bun scripts/study49-transcribe.ts [slug ...]
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { bpConfigs } from "../src/study49/rules.js";

const root = new URL("../", import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(`${root}corpus/study48-manifest.json`, "utf8")) as { entries: Record<string, { raw: string }> };
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(manifest.entries);
for (const slug of slugs) {
	const e = manifest.entries[slug];
	if (!e) throw new Error(`no manifest entry for ${slug}`);
	const outDir = `${root}${e.raw.slice(0, e.raw.lastIndexOf("/"))}/study49`;
	mkdirSync(outDir, { recursive: true });
	writeFileSync(`${outDir}/configs.json`, JSON.stringify(bpConfigs()));
	const t = Date.now();
	const r = spawnSync("node", [`${root}scripts/study49-transcribe.mjs`, `${root}src/fixture/model.json`, `${root}src/fixture/weights.json`, `${root}${e.raw}`, `${outDir}/configs.json`, outDir], { encoding: "utf8", maxBuffer: 1 << 26 });
	if (r.status !== 0) throw new Error(`${slug}: ${r.stderr.slice(-2000)}`);
	console.log(`${slug}: ${r.stdout.trim()} (${((Date.now() - t) / 1000).toFixed(0)} s)`);
}
