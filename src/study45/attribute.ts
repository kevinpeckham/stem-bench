/**
 * Study 45 Arm 0 ($0): where a draft's chord qualities were lost. For each
 * bar whose truth chord parses, the truth's quality family (Study 34's
 * grader) is compared with the hint's and the draft's at that bar:
 *   - hintWrongDraftFollowed: the hint's family was wrong and the draft wrote the hint's family;
 *   - hintWrongDraftOtherWrong: the hint was wrong and the draft wrote a third family;
 *   - hintRightDraftWrong: the hint had the right family and the draft did not keep it;
 *   - powerChord: the draft wrote a power chord (quality "5") where the truth has a third.
 * A power chord is counted under powerChord only. Mechanical, tested.
 */
import { familyOf } from "../study34/grade34.js";
import { parseChord } from "../grading/symbols.js";

export interface Attribution {
	bearing: number;
	draftRight: number;
	hintRight: number;
	lost: { hintWrongDraftFollowed: number; hintWrongDraftOtherWrong: number; hintRightDraftWrong: number; powerChord: number };
}

export function attributeQualities(truthPerBar: string[], hintPerBar: string[], draftPerBar: string[]): Attribution {
	const out: Attribution = { bearing: 0, draftRight: 0, hintRight: 0, lost: { hintWrongDraftFollowed: 0, hintWrongDraftOtherWrong: 0, hintRightDraftWrong: 0, powerChord: 0 } };
	for (let i = 0; i < truthPerBar.length; i++) {
		const truth = familyOf(truthPerBar[i] ?? "");
		if (truth === null) continue;
		out.bearing++;
		const hint = familyOf(hintPerBar[i] ?? "");
		const draftSymbol = draftPerBar[i] ?? "";
		const draft = familyOf(draftSymbol);
		const p = parseChord(draftSymbol);
		const power = p.ok && p.quality === "5";
		if (hint === truth) out.hintRight++;
		if (draft === truth) {
			out.draftRight++;
			continue;
		}
		if (power) out.lost.powerChord++;
		else if (hint !== truth && draft === hint) out.lost.hintWrongDraftFollowed++;
		else if (hint !== truth) out.lost.hintWrongDraftOtherWrong++;
		else out.lost.hintRightDraftWrong++;
	}
	return out;
}
