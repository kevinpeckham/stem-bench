/**
 * Study 10 run (docs/BRIEF-STUDY10.md): every candidate over every
 * fixture item, zero LLM spend. Band items: render per the fixture's
 * (renderer, seed), D-prod on the mix buffer, N-beat → N-seg (fed
 * N-beat's beats), N-key-profiles on the same chroma D-prod used.
 * Chord songs: render per Study 1's synth, N-chord per bar (the v0.142
 * matcher baseline is in the fixture). Raw audio goes through a temp
 * dir; the Python runners (scripts/study10/*.py, .venv-study10) write
 * JSON back. Results to results/study10-instruments.json.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fixture from "../corpus/fixture10.json";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import mixes10 from "../corpus/mixes10.json";
import progressions from "../corpus/progressions.json";
import progressions10 from "../corpus/progressions10.json";
import { renderSong, type SongSpec } from "../src/fixture/synth.js";
import { renderMix, type MixSpec } from "../src/study4/synth4.js";
import { analyse, detectKey } from "../src/study9/analysis.js";
import { asBuffer, featuresOf } from "../src/study9/instruments.js";
import { renderParts, type MixSpec9 } from "../src/study9/parts.js";
import { AS, detectKeyWith, TP } from "../src/study10/keyprofiles.js";
import { renderMix10, type MixSpec10 } from "../src/study10/synth10.js";

const root = new URL("../", import.meta.url).pathname;
const PY = `${root}.venv-study10/bin/python`;
const dir = mkdtempSync(join(tmpdir(), "stem-bench10-run-"));

const bandSpecs = new Map<string, MixSpec9 & MixSpec10>();
for (const m of [...mixes.mixes, ...mixes9.mixes, ...mixes10.mixes] as (MixSpec9 & MixSpec10)[]) {
	bandSpecs.set(m.id, m);
}
const songSpecs = new Map<string, SongSpec>();
for (const s of [...progressions.songs, ...progressions10.songs] as SongSpec[]) {
	songSpecs.set(s.id, s);
}

function renderBand(item: { id: string; renderer: string; seed: number }): Float32Array {
	const spec = bandSpecs.get(item.id);
	if (!spec) throw new Error(`no spec: ${item.id}`);
	if (item.renderer === "synth4") return renderMix(spec as MixSpec, item.seed);
	if (item.renderer === "parts9") return renderParts(spec as MixSpec9, item.seed).mix;
	return renderMix10(spec as MixSpec10, item.seed);
}

function runPy(script: string, args: string[]): { out: unknown; ms: number } {
	const t0 = performance.now();
	execFileSync(PY, [`${root}scripts/study10/${script}`, ...args], { stdio: ["ignore", "ignore", "pipe"] });
	const outArg = args[args.indexOf("--out") + 1]!;
	return { out: JSON.parse(readFileSync(outArg, "utf8")), ms: Math.round(performance.now() - t0) };
}

const band: unknown[] = [];
for (const item of fixture.bandItems as {
	id: string;
	class: string;
	renderer: string;
	seed: number;
	truth: { durationSec: number };
}[]) {
	const samples = renderBand(item);
	const raw = join(dir, `${item.id}.raw`);
	writeFileSync(raw, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));

	const t0 = performance.now();
	const features = featuresOf(samples);
	const prod = analyse(features);
	const prodMs = Math.round(performance.now() - t0);
	const keyAS = detectKeyWith(AS, features.chroma, features.bassChroma);
	const keyTP = detectKeyWith(TP, features.chroma, features.bassChroma);
	const keyKK = detectKey(features.chroma, features.bassChroma);

	const nbeat = runPy("nbeat.py", ["--raw", raw, "--sr", "22050", "--out", join(dir, `${item.id}-nbeat.json`)]);
	const beats = (nbeat.out as { beats: number[] }).beats;
	let nseg: { out: unknown; ms: number } | null = null;
	if (beats.length >= 4) {
		const beatsFile = join(dir, `${item.id}-beats.json`);
		writeFileSync(beatsFile, JSON.stringify({ beats }));
		nseg = runPy("nseg.py", [
			"--raw", raw, "--sr", "22050", "--beats", beatsFile,
			"--out", join(dir, `${item.id}-nseg.json`),
		]);
	}
	band.push({
		itemId: item.id,
		class: item.class,
		durationSec: samples.length / 22050,
		prod: { tempo: prod.tempo, meter: prod.meter, key: prod.key, ms: prodMs },
		keyProfiles: { kk: keyKK, as: keyAS, tp: keyTP },
		nbeat: { ...(nbeat.out as object), ms: nbeat.ms },
		nseg: nseg ? { ...(nseg.out as object), ms: nseg.ms } : null,
	});
	const nb = nbeat.out as { tempo: number | null; meter: string };
	console.log(
		`${item.id} (${item.class}): prod ${prod.tempo.bpm} ${prod.meter.value} ${prod.key.value} | n-beat ${nb.tempo} ${nb.meter} | n-seg ${nseg ? ((nseg.out as { boundaries: number[] }).boundaries.map((b) => b.toFixed(0)).join(",") || "—") : "skipped"} | AS ${keyAS.value} TP ${keyTP.value}`,
	);
}

const chords: unknown[] = [];
for (const song of fixture.chordSongs as {
	id: string;
	source: string;
	seed?: number;
	truth: string[];
	bpm: number;
	matcherPerBar: string[];
}[]) {
	const spec = songSpecs.get(song.id);
	if (!spec) throw new Error(`no song spec: ${song.id}`);
	const seed =
		song.source === "fixture1"
			? 1000 + (progressions.songs as SongSpec[]).findIndex((s) => s.id === song.id)
			: song.seed!;
	const audio = renderSong(spec, seed);
	const raw = join(dir, `${song.id}.raw`);
	writeFileSync(raw, Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength));
	const barSec = (4 * 60) / song.bpm;
	const barStarts = [...spec.chords.map((_, b) => b * barSec), spec.chords.length * barSec];
	const barsFile = join(dir, `${song.id}-bars.json`);
	writeFileSync(barsFile, JSON.stringify({ barStarts }));
	const nchord = runPy("nchord.py", [
		"--raw", raw, "--bars", barsFile,
		"--out", join(dir, `${song.id}-nchord.json`),
	]);
	chords.push({
		itemId: song.id,
		source: song.source,
		nchord: { ...(nchord.out as object), ms: nchord.ms },
	});
	console.log(`${song.id}: n-chord ${nchord.ms}ms`);
}

rmSync(dir, { recursive: true, force: true });
writeFileSync(
	`${root}results/study10-instruments.json`,
	`${JSON.stringify({ version: 1, fixture: fixture.corpus, band, chords }, null, "\t")}\n`,
);
console.log(`\nstudy10-instruments.json: ${band.length} band items, ${chords.length} chord songs`);
