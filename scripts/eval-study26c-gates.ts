/** S26C gate evaluation (docs/BRIEF-STUDY26.md, 26c addendum) over results/study26c.json. */
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url).pathname;
interface Row {
	R4b: {
		outcome: string;
		first4?: number[];
		last4?: number[];
		appAccept?: { bar1Ok: boolean; medianOk: boolean };
		endsWithinQuarterBar?: boolean;
	};
}
const d = JSON.parse(readFileSync(`${root}results/study26c.json`, "utf8")) as {
	songs: Record<string, Row>;
};
const full = (s: string) => {
	const r = d.songs[s]!.R4b;
	return r.outcome === "repaired" && r.appAccept!.bar1Ok && r.appAccept!.medianOk && r.endsWithinQuarterBar === true;
};
const g1 = full("letter-lands") && full("peaceful-dreams");
const mop = d.songs["mop-heart"]!.R4b;
const g2 = mop.outcome === "repaired" && mop.appAccept!.bar1Ok && mop.appAccept!.medianOk;
const g3 = d.songs["eat-all-the-clocks"]!.R4b.outcome === "refused";
console.log(`S26C-G1 (letter + peaceful: app acceptance AND ends within 0.25 bar of truth): ${g1 ? "PASS" : "FAIL"}`);
console.log(`S26C-G2 (mop: app acceptance; ends reported): ${g2 ? "PASS" : "FAIL"} (mop ends first4 ${mop.first4?.map((x) => x.toFixed(2)).join("/")}, last4 ${mop.last4?.map((x) => x.toFixed(2)).join("/")})`);
console.log(`S26C-G3 (eat refused): ${g3 ? "PASS" : "FAIL"}`);
if (!(g1 && g2 && g3)) process.exit(2);
