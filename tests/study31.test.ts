/**
 * Study 31 instrument proofs (docs/BRIEF-STUDY31.md): the class
 * arithmetic, each witness's vote-or-abstain rule, the W6 decision
 * core, the checkerboard boundary finder, and the humility rule.
 */
import { describe, expect, test } from "bun:test";
import {
	checkerboardNovelty,
	classOf,
	w1TimeZero,
	w2LastOnset,
	w3BothEnds,
	w4Harmonic,
	w6Decide,
	w7Section,
	weightedVote,
} from "../src/study31/witnesses.js";

const BEAT = 0.5;

describe("w1 time zero", () => {
	test("votes the class of the bar line on time zero", () => {
		// anchor 2.0s, beat 0.5: lattice hits 0.0 exactly at j = -4 -> class 0
		const v = w1TimeZero(2.0, BEAT, 4);
		expect(v.cls).toBe(0);
	});
	test("a pickup one beat before the anchor votes the WRONG class by construction", () => {
		// truth bar one at 0.5 (class 1 on a lattice anchored at 2.0 would be...):
		// anchor 2.1, time zero sits at j=-4.2 -> 0.2 beat from lattice -> within 0.25,
		// votes class of j=-4 even though bar one is elsewhere.
		const v = w1TimeZero(2.1, BEAT, 4);
		expect(v.cls).toBe(0);
		expect((v.detail.distBeats as number) <= 0.25).toBe(true);
	});
	test("abstains when time zero is off the lattice", () => {
		const v = w1TimeZero(2.2, BEAT, 4); // 0.4 beat away
		expect(v.cls).toBeNull();
	});
});

describe("w2 last strong onset", () => {
	const span = { first: 0, last: 20 };
	test("votes the snapped class on a steady ending", () => {
		const pk = [17.0, 17.5, 18.0, 18.5, 19.0];
		const v = w2LastOnset(pk, 1.0, BEAT, 4, span);
		expect(v.cls).toBe(classOf(19.0, 1.0, BEAT, 4));
	});
	test("abstains on a fade", () => {
		const v = w2LastOnset([5.0, 5.5, 6.0], 1.0, BEAT, 4, span);
		expect(v.cls).toBeNull();
		expect(v.detail.abstain).toBe("fade");
	});
	test("abstains on a ritardando", () => {
		const pk = [16.4, 17.0, 17.62, 18.3, 19.0]; // spacing stretches past 3%
		const v = w2LastOnset(pk, 1.0, BEAT, 4, span);
		expect(v.cls).toBeNull();
		expect(v.detail.abstain).toBe("ritardando");
	});
});

describe("w3 both ends", () => {
	test("remainder zero votes the shared class", () => {
		const v = w3BothEnds([1.0, 3.0, 9.0], 1.0, BEAT, 4); // 16 beats apart
		expect(v.cls).toBe(0);
	});
	test("a pickup leaves a remainder and abstains", () => {
		const v = w3BothEnds([0.5, 3.0, 9.0], 1.0, BEAT, 4); // 17 beats apart
		expect(v.cls).toBeNull();
		expect(v.detail.remainder).toBe(1);
	});
});

describe("w4 harmonic rhythm", () => {
	test("changes concentrated on one class win with a margin", () => {
		const labels: string[] = [];
		for (let bar = 0; bar < 8; bar++)
			for (let b = 0; b < 4; b++) labels.push(`chord${bar}`); // change every bar at class 0
		const v = w4Harmonic(labels, 4);
		expect(v.cls).toBe(0);
		expect(v.detail.margin).toBe(7);
	});
	test("abstains with too few changes", () => {
		const labels = Array(32).fill("A") as string[];
		labels[16] = "B";
		expect(w4Harmonic(labels, 4).cls).toBeNull();
	});
});

describe("w6 decision core", () => {
	test("snare backbeat pair plus kick picks the downbeat", () => {
		const v = w6Decide([1, 10, 1, 10], [8, 1, 5, 1], null, 4); // snare on 1&3 (classes), kick favors 0
		expect(v.cls).toBe(0);
		expect(v.detail.modeUsed).toBe("snare+kick");
	});
	test("bass veto abstains", () => {
		const v = w6Decide([1, 10, 1, 10], [8, 1, 5, 1], 2, 4);
		expect(v.cls).toBeNull();
		expect(v.detail.abstain).toBe("bass veto");
	});
	test("3/4 uses the kick argmax", () => {
		const v = w6Decide(null, [2, 9, 3], null, 3);
		expect(v.cls).toBe(1);
	});
});

describe("w7 section scale", () => {
	test("block-structured chroma yields boundaries on the block edges", () => {
		const a = new Float32Array(12);
		a[0] = 1;
		const b = new Float32Array(12);
		b[7] = 1;
		const beatChroma: Float32Array[] = [];
		for (let i = 0; i < 96; i++) beatChroma.push(Math.floor(i / 32) % 2 === 0 ? a : b);
		const nov = checkerboardNovelty(beatChroma, 8);
		// novelty at a boundary (32) beats novelty inside a section (16)
		expect(nov[32]!).toBeGreaterThan(nov[16]!);
		const v = w7Section(beatChroma, 4);
		expect(v.cls).toBe(0); // boundaries at 32 and 64, both class 0
	});
});

describe("the humility rule", () => {
	test("a clear winner moves off the base", () => {
		const r = weightedVote(
			[
				{ cls: 2, weight: 2 },
				{ cls: 2, weight: 2 },
				{ cls: 0, weight: 1 },
			],
			4,
		);
		expect(r.decided).toBe(2);
		expect(r.undecided).toBe(false);
	});
	test("a winner that leads the base by less than 2 stays undecided", () => {
		const r = weightedVote(
			[
				{ cls: 2, weight: 2 },
				{ cls: 0, weight: 1 },
			],
			4,
		);
		expect(r.decided).toBe(0);
		expect(r.undecided).toBe(true);
	});
	test("a winner without a 1-point lead over the runner-up stays undecided", () => {
		const r = weightedVote(
			[
				{ cls: 2, weight: 2 },
				{ cls: 3, weight: 2 },
			],
			4,
		);
		expect(r.decided).toBe(0);
		expect(r.undecided).toBe(true);
	});
	test("the base winning outright is decided, not undecided", () => {
		const r = weightedVote(
			[
				{ cls: 0, weight: 2 },
				{ cls: 1, weight: 1 },
			],
			4,
		);
		expect(r.decided).toBe(0);
		expect(r.undecided).toBe(false);
	});
});
