/**
 * Study 10 Amendment 1 run (docs/BRIEF-STUDY10.md): the MMKK catalog.
 * Per song: D-prod and D-activity on the per-stem buffers (production's
 * real input shape); N-beat, N-seg and the key-profile candidates on
 * the rendered mix (else the stems' sum). Audio from gitignored
 * corpus-mmkk/ decodes made by scripts/fetch-mmkk.ts, verified against
 * the manifest's hashes before use. Results to
 * results/study10-mmkk.json. Zero LLM spend.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import manifest from "../corpus/fixture-mmkk.json";
import { analyse, combineFeatures } from "../src/study9/analysis.js";
import { dActivity, dProd, featuresOf } from "../src/study9/instruments.js";
import { AS, detectKeyWith, TP, KK } from "../src/study10/keyprofiles.js";

const root = new URL("../", import.meta.url).pathname;
const PY = `${root}.venv-study10/bin/python`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench10-mmkk-"));

function loadRaw(file: string): Float32Array {
	const buf = readFileSync(file);
	return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function runPy(script: string, args: string[]): { out: unknown; ms: number } {
	const t0 = performance.now();
	execFileSync(PY, [`${root}scripts/study10/${script}`, ...args], { stdio: ["ignore", "ignore", "pipe"] });
	const outArg = args[args.indexOf("--out") + 1]!;
	return { out: JSON.parse(readFileSync(outArg, "utf8")), ms: Math.round(performance.now() - t0) };
}

interface MStem { name: string; url: string; sha256: string; seconds: number }
interface MSong {
	slug: string;
	declared: { key: { start: number; value: string }[]; meter: { start: number; value: string }[]; tempo: { start: number; value: number }[] };
	sections: { index: string; name: string; start: number }[] | null;
	stems: MStem[];
	mix: { url: string; sha256: string; seconds: number } | null;
}

const out: unknown[] = [];
for (const song of manifest.songs as MSong[]) {
	const sdir = `${root}corpus-mmkk/${song.slug}`;
	// Verify the originals still match the committed hashes before analysing.
	for (const s of song.stems) {
		const file = `${sdir}/${s.url.split("/").pop()}`;
		const sha = createHash("sha256").update(readFileSync(file)).digest("hex");
		if (sha !== s.sha256) throw new Error(`hash mismatch: ${song.slug}/${s.name}`);
	}
	const stems = song.stems.map((s) => loadRaw(`${sdir}/${s.url.split("/").pop()}.22050.f32le.raw`));
	let mixSamples: Float32Array;
	if (song.mix) {
		mixSamples = loadRaw(`${sdir}/mix.mp3.22050.f32le.raw`);
	} else if (stems.length === 1) {
		mixSamples = stems[0]!;
	} else {
		const len = Math.max(...stems.map((s) => s.length));
		mixSamples = new Float32Array(len);
		for (const s of stems) for (let i = 0; i < s.length; i++) mixSamples[i]! += s[i]!;
		let peak = 0;
		for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(mixSamples[i]!));
		if (peak > 0) for (let i = 0; i < len; i++) mixSamples[i]! /= peak;
	}

	const t0 = performance.now();
	const prod = dProd(stems);
	const prodMs = Math.round(performance.now() - t0);

	// The profile candidates on production's own combined chroma.
	const features = stems.map((s) => featuresOf(s));
	const combined = combineFeatures(features)!;
	const keys = {
		kk: detectKeyWith(KK, combined.chroma, combined.bassChroma),
		as: detectKeyWith(AS, combined.chroma, combined.bassChroma),
		tp: detectKeyWith(TP, combined.chroma, combined.bassChroma),
	};

	// D-activity on the detected grid (prod tempo + meter anchored at 0).
	const dur = Math.max(...stems.map((s) => s.length)) / 22050;
	const beatsPerBar = prod.meter.value === "3/4" ? 3 : 4;
	const barSec = (beatsPerBar * 60) / Math.max(1, prod.tempo.bpm);
	const grid: number[] = [];
	for (let t = 0; t <= dur - barSec / 2; t += barSec) grid.push(t);
	grid.push(dur);
	const activity = stems.length > 1 ? dActivity(stems, grid) : null;

	const rawFile = join(dir, `${song.slug}.raw`);
	writeFileSync(rawFile, Buffer.from(mixSamples.buffer, mixSamples.byteOffset, mixSamples.byteLength));
	const nbeat = runPy("nbeat.py", ["--raw", rawFile, "--sr", "22050", "--out", join(dir, `${song.slug}-nbeat.json`)]);
	const beats = (nbeat.out as { beats: number[] }).beats;
	let nseg: { out: unknown; ms: number } | null = null;
	if (beats.length >= 4) {
		const bf = join(dir, `${song.slug}-beats.json`);
		writeFileSync(bf, JSON.stringify({ beats }));
		nseg = runPy("nseg.py", ["--raw", rawFile, "--sr", "22050", "--beats", bf, "--out", join(dir, `${song.slug}-nseg.json`)]);
	}
	const nb = nbeat.out as { tempo: number | null; meter: string; beats: number[] };
	out.push({
		slug: song.slug,
		declared: song.declared,
		sections: song.sections,
		stems: song.stems.map((s) => s.name),
		usedMix: song.mix ? "rendered-mix" : stems.length === 1 ? "single-stem" : "stem-sum",
		prod: { tempo: prod.tempo, meter: prod.meter, key: prod.key, ms: prodMs },
		keys,
		activity: activity ? { boundaries: activity.boundaries } : null,
		nbeat: { tempo: nb.tempo, meter: nb.meter, beatCount: nb.beats.length, ms: nbeat.ms },
		nseg: nseg ? { boundaries: (nseg.out as { boundaries: number[] }).boundaries, ms: nseg.ms } : null,
	});
	console.log(
		`${song.slug}: declared ${song.declared.tempo.map((t) => t.value).join("/") || "—"} ${song.declared.meter.map((m) => m.value).join("/") || "—"} ${song.declared.key.map((k) => k.value).join("/") || "—"} | prod ${prod.tempo.bpm} ${prod.meter.value} ${prod.key.value} | n-beat ${nb.tempo} ${nb.meter} (${nb.beats.length} beats) | n-seg ${nseg ? (nseg.out as { boundaries: number[] }).boundaries.map((b) => b.toFixed(0)).join(",") || "—" : "skip"} | act ${activity ? activity.boundaries.map((b) => b.toFixed(0)).join(",") || "—" : "n/a"} | KK ${keys.kk.value} AS ${keys.as.value} TP ${keys.tp.value}`,
	);
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(
	`${root}results/study10-mmkk.json`,
	`${JSON.stringify({ version: 1, fetched: manifest.fetched, songs: out }, null, "\t")}\n`,
);
console.log(`\nstudy10-mmkk.json: ${out.length} songs`);
