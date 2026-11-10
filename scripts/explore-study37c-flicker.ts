/**
 * Study 37 part C, EXPLORATORY and unregistered (docs/BRIEF-STUDY37.md
 * results section): the same witness with chord segments shorter than
 * one beat removed before change detection (the reader's sus4/passing
 * flicker that the registered run showed dominating the stability term).
 * Reported beside the registered result, graded against no prediction.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { foldCompare, median, summarizeTracker } from "../src/study36/metrical.js";
import { changeBeats, harmonicPeriod, type Segment } from "../src/study37/harmonic.js";

const root = new URL("../", import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(`${root}corpus/study36b-manifest.json`, "utf8")) as { entries: Record<string, { bpm: number | null; meter: string | null; regular?: { file: string } }> };
const trackers = JSON.parse(readFileSync(`${root}results/study36b-trackers.json`, "utf8")) as Record<string, Record<string, { beats: number[]; downbeats: number[] }>>;
const declaredBarSec = (bpm: number, meter: string) => ((meter === "6/8" ? 2 : meter === "3/4" ? 3 : 4) * 60) / bpm;

/** Drop segments shorter than minSec, extending the previous segment over them. */
function deflicker(segs: Segment[], minSec: number): Segment[] {
	const out: Segment[] = [];
	for (const s of segs) {
		if (s.end - s.start < minSec && out.length) {
			out[out.length - 1] = { ...out[out.length - 1]!, end: s.end };
			continue;
		}
		if (out.length && out[out.length - 1]!.chord === s.chord) out[out.length - 1] = { ...out[out.length - 1]!, end: s.end };
		else out.push({ ...s });
	}
	return out;
}

const summary: Record<string, unknown> = {};
for (const minBeats of [1, 2]) {
	for (const sys of ["beatthis-final0", "madmom-34"]) {
		let n = 0, baseStrict = 0, strict = 0, fixed = 0, broke = 0, abstained = 0;
		for (const [slug, e] of Object.entries(manifest.entries)) {
			if (!e.bpm || e.meter !== "4/4" || !e.regular) continue;
			let segs: Segment[];
			try {
				segs = (JSON.parse(readFileSync(`${root}corpus-study36/chords/${slug}.regular.json`, "utf8")) as { segments: Segment[] }).segments;
			} catch {
				continue;
			}
			const t = trackers[`${slug}|regular`]?.[sys];
			if (!t) continue;
			const s = summarizeTracker(t.beats, t.downbeats);
			if (!s.beatsPerBar || s.beatsPerBar < 2) continue;
			const beatSec = median(t.beats.slice(1).map((b, i) => b - t.beats[i]!));
			const changes = changeBeats(deflicker(segs, minBeats * beatSec), t.beats);
			const w = harmonicPeriod(changes, s.beatsPerBar);
			const truthBar = declaredBarSec(e.bpm, e.meter);
			const b = foldCompare(s.beatsPerBar * beatSec, truthBar).strict;
			const a = foldCompare(w.k * beatSec, truthBar).strict;
			n++;
			if (b) baseStrict++;
			if (a) strict++;
			if (!b && a) fixed++;
			if (b && !a) broke++;
			if (w.abstain) abstained++;
		}
		summary[`${sys} minSegment ${minBeats} beat`] = { n, baseStrict, strict, fixed, broke, abstained };
		console.log(`${sys}, segments shorter than ${minBeats} beat removed (4/4, n=${n}): base strict ${baseStrict} -> ${strict} | fixed ${fixed} broke ${broke} abstained ${abstained}`);
	}
}
writeFileSync(`${root}results/study37c-exploratory.json`, `${JSON.stringify(summary, null, "\t")}\n`);
