#!/usr/bin/env python3
"""Study 44, the port comparison (docs/BRIEF-STUDY44.md): the app's stored
Beat This beats and downbeats for its five dev recordings (its port, its
decode; docs/bench-reply-beats-2026-11-11.json on stem-shovel dev, copied
to corpus/study44-app-beats.json) against the package's readings of the
same mixes on the bench (results/study36-trackers.json, beatthis-small0),
F-measure at 70 ms (Study 42's fscore), counts and the largest offset
between matched beats. $0. Writes results/study44-port.json."""
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
app = json.load(open(ROOT / "corpus" / "study44-app-beats.json"))
pkg = json.load(open(ROOT / "results" / "study36-trackers.json"))


def match(est, ref, window=0.07):
    ref = np.sort(np.asarray(ref, dtype=float))
    est = np.sort(np.asarray(est, dtype=float))
    used = np.zeros(len(est), dtype=bool)
    matched = 0
    offsets = []
    for r in ref:
        idx = np.where((~used) & (np.abs(est - r) <= window))[0]
        if len(idx):
            j = idx[np.argmin(np.abs(est[idx] - r))]
            used[j] = True
            matched += 1
            offsets.append(abs(est[j] - r))
    p = matched / max(1, len(est))
    rc = matched / max(1, len(ref))
    f = 0.0 if p + rc == 0 else 2 * p * rc / (p + rc)
    return f, matched, (max(offsets) if offsets else None), (float(np.median(offsets)) if offsets else None)


out = {}
for slug, a in app.items():
    p = pkg[slug]["beatthis-small0"]
    fb, mb, maxb, medb = match(a["beats"], p["beats"])
    fd, md, maxd, medd = match(a["downbeats"], p["downbeats"])
    out[slug] = {
        "beats": {"app": len(a["beats"]), "package": len(p["beats"]), "matched": mb, "f70": round(fb, 4), "maxOffsetSec": maxb, "medianOffsetSec": medb},
        "downbeats": {"app": len(a["downbeats"]), "package": len(p["downbeats"]), "matched": md, "f70": round(fd, 4), "maxOffsetSec": maxd, "medianOffsetSec": medd},
        "durationApp": a.get("duration"),
    }
    print(f"{slug:20s} beats app {len(a['beats'])} pkg {len(p['beats'])} F {fb:.4f} max off {maxb if maxb is None else round(maxb,3)} | downbeats app {len(a['downbeats'])} pkg {len(p['downbeats'])} F {fd:.4f} max off {maxd if maxd is None else round(maxd,3)}")
(ROOT / "results" / "study44-port.json").write_text(json.dumps(out, indent="\t") + "\n")
print("wrote results/study44-port.json")
