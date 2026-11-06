import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { type Note, chordsPerBar } from "../src/fixture/chords.js";
import { type SongSpec, barStarts } from "../src/fixture/synth.js";
import { SHIPPED, V142, chordsPerBar231 } from "../src/study18/chords231.js";

const fixture = JSON.parse(
	readFileSync(new URL("../corpus/fixture.json", import.meta.url).pathname, "utf8"),
);

function perBar(segments: { bar: number; bars: number; chord: string }[], total: number): string[] {
	const out = new Array<string>(total).fill("N.C.");
	for (const s of segments) {
		for (let i = 0; i < s.bars && s.bar - 1 + i < total; i++) out[s.bar - 1 + i] = s.chord;
	}
	return out;
}

describe("study 18: the v0.231 matcher port", () => {
	test("at the v0.142 constants it IS the pinned v0.142 port, bar for bar over the whole fixture", () => {
		let bars = 0;
		for (const song of fixture.songs) {
			const notes: Note[] = (song.notes as [number, number, number, number][]).map(
				([start, duration, pitch, amplitude]) => ({
					start,
					end: start + duration,
					pitch,
					amplitude,
				}),
			);
			const starts = barStarts({ bpm: song.bpm, chords: song.truth } as SongSpec);
			const pinned = perBar(chordsPerBar(notes, starts), song.truth.length);
			const ported = perBar(chordsPerBar231(notes, starts, V142), song.truth.length);
			expect(ported).toEqual(pinned);
			bars += song.truth.length;
		}
		expect(bars).toBe(440);
	});

	test("the bass rule: a pickup sounding under 15% of the bar no longer earns the root bonus", () => {
		// A bar of E5 (E2 bass + E3/B3 held) with a C#2 pickup in the last
		// 0.12 s of a 2 s bar: the handoff's static-bloom bar 15 shape.
		const notes: Note[] = [
			{ start: 0, end: 2, pitch: 40, amplitude: 0.8 },
			{ start: 0, end: 2, pitch: 52, amplitude: 0.7 },
			{ start: 0, end: 2, pitch: 59, amplitude: 0.7 },
			{ start: 1.88, end: 2.4, pitch: 37, amplitude: 0.8 },
		];
		const old = perBar(chordsPerBar231(notes, [0, 2], V142), 1);
		const now = perBar(chordsPerBar231(notes, [0, 2], SHIPPED), 1);
		expect(old[0]).toBe("C#m7");
		expect(now[0]).toBe("E5");
	});

	test("the presence rule: a 10% second from a harmonic leak no longer turns a power chord into a sus2", () => {
		// The handoff's Static Bloom profile: B 63%, F# 26%, C# 10% (ninth
		// harmonic leak), bass B — built from held notes with those weights.
		const notes: Note[] = [
			{ start: 0, end: 2, pitch: 47, amplitude: 0.96 }, // B2, weight 2*1.26
			{ start: 0, end: 2, pitch: 54, amplitude: 0.22 }, // F#3, weight 2*0.52
			{ start: 0, end: 1, pitch: 61, amplitude: 0.1 }, // C#4, weight 1*0.4
		];
		const old = perBar(chordsPerBar231(notes, [0, 2], V142), 1);
		const now = perBar(chordsPerBar231(notes, [0, 2], SHIPPED), 1);
		expect(old[0]).toBe("Bsus2");
		expect(now[0]).toBe("B5");
	});
});
