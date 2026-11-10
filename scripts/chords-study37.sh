#!/usr/bin/env bash
# Study 37 instrument input: ChordMini frame segments (nchord.py, $0) for
# every regular Josh Woodward mix in the Study 36b manifest. Output is
# per-song JSON under corpus-study36/chords/ (not committed; the witness
# results are). Resumable.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -I -c '
import json
m = json.load(open("corpus/study36b-manifest.json"))["entries"]
for slug, e in m.items():
    if e.get("bpm") and e.get("meter") and "regular" in e:
        print(slug + "\t" + e["regular"]["file"])
' | while IFS=$'\t' read -r slug file; do
  out="corpus-study36/chords/$slug.regular.json"
  [ -f "$out" ] && continue
  .venv-study10/bin/python scripts/study10/nchord.py --raw "corpus-study36/regular/$file.22050.f32le.raw" --out "$out" 2>/dev/null | tail -1
done
echo "chords done: $(ls corpus-study36/chords | wc -l)"
