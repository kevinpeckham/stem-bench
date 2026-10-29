import { describe, expect, test } from "bun:test";
import fixture from "../corpus/fixture10.json";
import mixes10 from "../corpus/mixes10.json";
import progressions10 from "../corpus/progressions10.json";
import { parseChord } from "../src/grading/symbols.js";
import { detectKey } from "../src/study9/analysis.js";
import { featuresOf } from "../src/study9/instruments.js";
import { AS, detectKeyWith, KK, TP } from "../src/study10/keyprofiles.js";
import { fMeasure, tempoExact, tempoOctave, triadClass } from "../src/study10/grading10.js";
import { renderMix10, type MixSpec10 } from "../src/study10/synth10.js";
import vocab from "../scripts/study10/chordmini-vocab.json";
import chordminiConfig from "../models/study10/chordmini-config.json" with { type: "json" };

describe("key profiles", () => {
	test("tables are 12 wide with the tonic in the top two (Temperley's minor puts the fifth first)", () => {
		for (const p of [KK, AS, TP]) {
			for (const table of [p.major, p.minor]) {
				expect(table).toHaveLength(12);
				const rank = [...table].sort((a, b) => b - a).indexOf(table[0]!);
				expect(rank).toBeLessThanOrEqual(1);
			}
		}
	});
	test("detectKeyWith(KK) IS production's detectKey (same chroma, same answer)", () => {
		const spec = mixes10.mixes.find((m) => m.id === "verb-x")! as MixSpec10;
		const f = featuresOf(renderMix10(spec, 10006));
		const ours = detectKeyWith(KK, f.chroma, f.bassChroma);
		const prods = detectKey(f.chroma, f.bassChroma);
		expect(ours.value).toBe(prods.value);
		expect(ours.confidence).toBeCloseTo(prods.confidence, 10);
	});
	test("a plain C-major chroma reads C major under every profile", () => {
		const chroma = new Float32Array(12);
		for (const pc of [0, 4, 7]) chroma[pc] = 1;
		chroma[2] = 0.3;
		chroma[9] = 0.3;
		for (const p of [KK, AS, TP]) expect(detectKeyWith(p, chroma).value).toBe("C major");
	});
});

describe("synth10", () => {
	const spec = mixes10.mixes.find((m) => m.id === "swing-x")! as MixSpec10;
	test("deterministic per seed", () => {
		const a = renderMix10(spec, 10000);
		const b = renderMix10(spec, 10000);
		expect(a.length).toBe(b.length);
		let worst = 0;
		for (let i = 0; i < a.length; i += 101) worst = Math.max(worst, Math.abs(a[i]! - b[i]!));
		expect(worst).toBe(0);
	});
	test("swing, reverb and dense all change the render", () => {
		const { swing: _s, ...plain } = spec;
		const base = renderMix10(plain, 10000);
		const swung = renderMix10(spec, 10000);
		const verbed = renderMix10({ ...plain, reverb: true }, 10000);
		const densed = renderMix10({ ...plain, dense: true }, 10000);
		const differs = (x: Float32Array, y: Float32Array) => {
			let d = 0;
			for (let i = 0; i < Math.min(x.length, y.length); i += 37) d += Math.abs(x[i]! - y[i]!);
			return d;
		};
		expect(differs(base, swung)).toBeGreaterThan(0);
		expect(verbed.length).toBeGreaterThan(base.length); // the tail second
		expect(differs(base, densed)).toBeGreaterThan(0);
	});
});

describe("grading10", () => {
	test("tempoExact: any section, 6/8 eighth-note reading, ±1", () => {
		const t = { tempos: [100, 140], meter: "4/4", keys: [] };
		expect(tempoExact(100.6, t)).toBe(true);
		expect(tempoExact(140, t)).toBe(true);
		expect(tempoExact(120, t)).toBe(false);
		expect(tempoExact(null, t)).toBe(false);
		expect(tempoExact(180, { tempos: [60], meter: "6/8", keys: [] })).toBe(true);
		expect(tempoExact(90, { tempos: [60], meter: "6/8", keys: [] })).toBe(false);
	});
	test("tempoOctave: half and double only", () => {
		const t = { tempos: [96], meter: "4/4", keys: [] };
		expect(tempoOctave(48, t)).toBe(true);
		expect(tempoOctave(192, t)).toBe(true);
		expect(tempoOctave(144, t)).toBe(false);
	});
	test("triadClass reduction", () => {
		expect(triadClass("Cmaj7")).toBe(triadClass("C"));
		expect(triadClass("Am7")).toBe(triadClass("Am"));
		expect(triadClass("Adim")).toBe(triadClass("Am"));
		expect(triadClass("Dsus2")).toBe(triadClass("Dsus4"));
		expect(triadClass("C")).not.toBe(triadClass("Cm"));
		expect(triadClass("C")).not.toBe(triadClass("Csus4"));
		expect(triadClass("N.C.")).toBe("nc");
	});
	test("fMeasure at ±70 ms", () => {
		expect(fMeasure([0, 0.5, 1.0], [0, 0.5, 1.0], 0.07)).toBe(1);
		expect(fMeasure([0, 0.5, 1.0], [0.05, 0.55, 1.2], 0.07)).toBeCloseTo(2 / 3, 10);
		expect(fMeasure([], [0, 1], 0.07)).toBe(0);
	});
});

describe("chordmini vocabulary map", () => {
	test("covers all 170 labels and lands in the bench vocabulary", () => {
		const labels = (chordminiConfig as unknown as { vocabulary?: string[]; idx_to_chord?: string[] });
		const all = labels.vocabulary ?? labels.idx_to_chord ?? Object.keys(vocab);
		expect(Object.keys(vocab)).toHaveLength(170);
		for (const label of all) expect(vocab).toHaveProperty([label]);
		for (const [raw, mapped] of Object.entries(vocab as Record<string, string>)) {
			if (mapped === "") continue; // N / X: no chord
			const p = parseChord(mapped);
			expect(p.ok).toBe(true);
			if (!p.ok) console.log(raw, mapped);
		}
	});
	test("spot checks", () => {
		const v = vocab as Record<string, string>;
		expect(v.C).toBe("C");
		expect(v["C#:min"]).toBe("C#m");
		expect(v["C:min7"]).toBe("Cm7");
		expect(v.N).toBe("");
		expect(v.X).toBe("");
	});
});

describe("fixture10", () => {
	test("counts and model hashes", () => {
		expect(fixture.bandItems).toHaveLength(35);
		expect(fixture.chordSongs).toHaveLength(20);
		expect(Object.keys(fixture.models)).toContain("small0.onnx");
		expect((fixture.models as Record<string, string>)["chordnet.onnx"]).toBe(
			"1faee8e1cf168300afe0f47517e76836ac200c3841b0fb430fad7dfea5ad6394",
		);
	});
	test("hard set carries the review's classes", () => {
		const classes = new Set((fixture.bandItems as { class: string }[]).map((i) => i.class));
		for (const c of ["hard-swing", "hard-octave", "hard-reverb", "hard-dense", "hard-mediantmod"]) {
			expect(classes).toContain(c);
		}
		expect((mixes10.mixes as MixSpec10[]).length).toBeGreaterThanOrEqual(12);
		expect(progressions10.songs.length).toBe(4);
	});
});
