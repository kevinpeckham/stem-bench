import { describe, expect, test } from "bun:test";
import mixes from "../corpus/mixes.json";
import mixes11b from "../corpus/mixes11b.json";
import { renderMix, type MixSpec } from "../src/study4/synth4.js";
import { analyse, extractFeatures } from "../src/study11b/analysis200.js";
import { TEMPO_LADDER_RUNGS, tempoLadderMatch } from "../src/study11b/ladder200.js";

const asBuffer = (data: Float32Array, sampleRate = 22050) =>
	({
		sampleRate,
		length: data.length,
		numberOfChannels: 1,
		getChannelData: () => data,
		duration: data.length / sampleRate,
	}) as unknown as AudioBuffer;

describe("the v0.200.0 port (79ed4def), pinned", () => {
	test("rungs and the shipped ladder semantics", () => {
		expect([...TEMPO_LADDER_RUNGS]).toEqual([2, 0.5, 1.5, 2 / 3]);
		expect(tempoLadderMatch(224, 112, {})).toEqual({ factor: 2 });
		expect(tempoLadderMatch(60, 120, {})).toEqual({ factor: 0.5 });
		expect(tempoLadderMatch(90, 60, {})).toBeNull(); // 3:2 gated off without compound
		expect(tempoLadderMatch(90, 60, { compound: true })).toEqual({ factor: 1.5 });
		expect(tempoLadderMatch(122.5, 120, {})).toEqual({ factor: 1 }); // tolerance 3, absolute
		expect(tempoLadderMatch(124, 120, {})).toBeNull();
	});
	test("disclosed smoke pins: drift-4a straight, lilt-a's true rung on the alternates", () => {
		const di = mixes.mixes.findIndex((m) => m.id === "drift-4a");
		const d = analyse(extractFeatures(asBuffer(renderMix(mixes.mixes[di] as MixSpec, 4000 + di))));
		expect(d.tempo.bpm).toBe(120);
		expect(d.tempo.subdivision).toBe(2);
		const li = mixes.mixes.findIndex((m) => m.id === "lilt-a");
		const l = analyse(extractFeatures(asBuffer(renderMix(mixes.mixes[li] as MixSpec, 4000 + li))));
		// The smoke that shaped the brief's predictions: the super-beat test
		// did NOT fire on this render (bpm stays 90) but the true dotted
		// tempo sits on the shipped ladder as an alternate.
		expect(l.tempo.alternates.some((a) => Math.abs(a.bpm - 60) <= 1)).toBe(true);
	});
});

describe("the swing-stress corpus", () => {
	test("15 items, straight 4/4, ratios 0.60-0.70 across three tempi", () => {
		expect(mixes11b.mixes).toHaveLength(15);
		const ratios = new Set(mixes11b.mixes.map((m: { swing: number }) => m.swing));
		expect(ratios.size).toBe(5);
		for (const m of mixes11b.mixes as { meter: string; swing: number }[]) {
			expect(m.meter).toBe("4/4");
			expect(m.swing).toBeGreaterThanOrEqual(0.6);
			expect(m.swing).toBeLessThanOrEqual(0.7);
		}
	});
});
