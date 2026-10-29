/**
 * Builds the committed Study 9 fixture (docs/BRIEF-STUDY9.md): the 15
 * pulsed Study 4/8 specs (pulseless excluded, as registered) plus the 6
 * misleading-stem specs from corpus/mixes9.json. For each item it
 * records truth, class, the truth bar grid, section truth and the
 * seeded stem order; for the Q4 side arm it encodes the harmonic stem
 * (bass + comp, as rendered and normalized by renderParts) for every
 * item and the mix for the 6 new mislead items (the other mixes are the
 * committed Study 4 MP3s, untouched). Audio itself is NOT committed as
 * floats — renders are deterministic from the committed specs + seeds;
 * the sum contract is pinned in tests/study9.test.ts.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mixes from "../corpus/mixes.json";
import mixes9 from "../corpus/mixes9.json";
import { barSeconds, truthOf, type MixSpec } from "../src/study4/synth4.js";
import { sectionTruth } from "../src/study8/sections.js";
import { renderParts, stemOrder, type MixSpec9 } from "../src/study9/parts.js";

function classOf(spec: MixSpec9): "loop" | "change" | "contrast" | "mislead" {
	if (spec.extra) return "mislead";
	if (spec.sections.some((s) => s.name)) return "contrast";
	return spec.sections.length > 1 ? "change" : "loop";
}

function barStarts(spec: MixSpec): number[] {
	let t = 0;
	const starts: number[] = [];
	for (const s of spec.sections) {
		for (let b = 0; b < s.bars.length; b++) {
			starts.push(t);
			t += barSeconds(spec.meter, s.bpm);
		}
	}
	starts.push(t);
	return starts;
}

const items: { spec: MixSpec9; seed: number }[] = [
	...(mixes.mixes as MixSpec9[])
		.map((spec, i) => ({ spec, seed: 4000 + i }))
		.filter(({ spec }) => !spec.pulseless),
	...(mixes9.mixes as MixSpec9[]).map((spec, i) => ({ spec, seed: 9000 + i })),
];

mkdirSync(new URL("../corpus/mixes9", import.meta.url).pathname, { recursive: true });
const dir = join(tmpdir(), `stem-bench9-${process.pid}`);
mkdirSync(dir, { recursive: true });

function encode(samples: Float32Array, id: string, mp3: string) {
	const rawFile = join(dir, `${id}.raw`);
	writeFileSync(rawFile, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
	execFileSync("ffmpeg", [
		"-y", "-loglevel", "error",
		"-f", "f32le", "-ar", "22050", "-ac", "1", "-i", rawFile,
		"-codec:a", "libmp3lame", "-q:a", "4",
		new URL(`../${mp3}`, import.meta.url).pathname,
	]);
}

const out: unknown[] = [];
for (const { spec, seed } of items) {
	const truth = truthOf(spec);
	const { parts, mix } = renderParts(spec, seed);
	const bass = parts.find((p) => p.role === "bass")!.samples;
	const comp = parts.find((p) => p.role === "comp")!.samples;
	const harmonic = new Float32Array(mix.length);
	for (let i = 0; i < mix.length; i++) harmonic[i] = bass[i]! + comp[i]!;
	const harmonicMp3 = `corpus/mixes9/${spec.id}-harmonic.mp3`;
	encode(harmonic, `${spec.id}-h`, harmonicMp3);
	let mixMp3 = `corpus/mixes/${spec.id}.mp3`;
	if (spec.extra) {
		mixMp3 = `corpus/mixes9/${spec.id}.mp3`;
		encode(mix, spec.id, mixMp3);
	}
	out.push({
		id: spec.id,
		class: classOf(spec),
		seed,
		extra: spec.extra ?? null,
		stems: parts.length,
		stemOrder: stemOrder(parts.length, seed),
		truth,
		barStarts: barStarts(spec),
		sections: sectionTruth(spec),
		mixMp3,
		harmonicMp3,
	});
	console.log(
		`${spec.id}: ${classOf(spec)}, ${parts.length} stems, ${truth.durationSec.toFixed(0)}s, tempo ${truth.tempo}, ${truth.key}`,
	);
}
rmSync(dir, { recursive: true, force: true });
writeFileSync(
	new URL("../corpus/fixture9.json", import.meta.url).pathname,
	`${JSON.stringify({ version: 1, corpus: `${mixes.seed}+${mixes9.seed}`, items: out }, null, "\t")}\n`,
);
console.log(`\nfixture9.json: ${out.length} items`);
