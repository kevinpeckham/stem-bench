/**
 * Study 34 Tier 2 truth extraction (docs/VALIDATION-STUDY34-INSTRUMENTS.md):
 * two corpus slots have their published settings available as MIDI from
 * the same source as the engraved score (the Cyber Hymnal's hymn, the
 * sheetmusicsinger typeset of the 1921 waltz). MIDI gives exact pitches,
 * so per-bar chord truth is EXTRACTED mechanically instead of read by
 * eye: parse the file, slice notes into bars from the time signature,
 * label each bar by best-covering chord template. The MIDIs, this code
 * and its tests are committed before registration.
 */

export interface MidiNote {
	startTick: number;
	endTick: number;
	pitch: number;
}

export interface MidiScore {
	ticksPerBeat: number;
	/** metre numerator/denominator changes, by tick */
	timeSigs: { tick: number; num: number; den: number }[];
	notes: MidiNote[];
}

/** Minimal SMF reader: note on/off and time signatures, all tracks merged. */
export function parseMidi(data: Uint8Array): MidiScore {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	if (view.getUint32(0) !== 0x4d546864) throw new Error("not a MIDI file");
	const nTracks = view.getUint16(10);
	const division = view.getUint16(12);
	if (division & 0x8000) throw new Error("SMPTE time not supported");
	const timeSigs: { tick: number; num: number; den: number }[] = [];
	const notes: MidiNote[] = [];
	let pos = 14;
	for (let tr = 0; tr < nTracks; tr++) {
		if (view.getUint32(pos) !== 0x4d54726b) throw new Error(`track ${tr}: bad header`);
		const len = view.getUint32(pos + 4);
		let p = pos + 8;
		const end = p + len;
		let tick = 0;
		let running = 0;
		const open = new Map<number, number>(); // pitch -> startTick
		const vlq = (): number => {
			let v = 0;
			for (;;) {
				const b = data[p++]!;
				v = (v << 7) | (b & 0x7f);
				if (!(b & 0x80)) return v;
			}
		};
		while (p < end) {
			tick += vlq();
			let status = data[p]!;
			if (status & 0x80) p++;
			else status = running;
			running = status;
			const type = status & 0xf0;
			if (type === 0x90 || type === 0x80) {
				const pitch = data[p++]!;
				const vel = data[p++]!;
				if (type === 0x90 && vel > 0) {
					if (!open.has(pitch)) open.set(pitch, tick);
				} else {
					const start = open.get(pitch);
					if (start !== undefined) {
						notes.push({ startTick: start, endTick: tick, pitch });
						open.delete(pitch);
					}
				}
			} else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
				p += 2;
			} else if (type === 0xc0 || type === 0xd0) {
				p += 1;
			} else if (status === 0xff) {
				const meta = data[p++]!;
				const mlen = vlq();
				if (meta === 0x58 && mlen >= 2) timeSigs.push({ tick, num: data[p]!, den: 2 ** data[p + 1]! });
				p += mlen;
			} else if (status === 0xf0 || status === 0xf7) {
				p += vlq();
			} else {
				throw new Error(`unhandled status 0x${status.toString(16)} at ${p}`);
			}
		}
		for (const [pitch, start] of open) notes.push({ startTick: start, endTick: tick, pitch });
		pos = end;
	}
	notes.sort((a, b) => a.startTick - b.startTick);
	timeSigs.sort((a, b) => a.tick - b.tick);
	return { ticksPerBeat: division, timeSigs, notes };
}

/** Duration-weighted pitch-class mass of the notes sounding in [fromTick, toTick). */
export function barPitchClasses(notes: MidiNote[], fromTick: number, toTick: number): Float32Array {
	const mass = new Float32Array(12);
	for (const n of notes) {
		const overlap = Math.min(n.endTick, toTick) - Math.max(n.startTick, fromTick);
		if (overlap > 0) mass[n.pitch % 12]! += overlap;
	}
	return mass;
}
