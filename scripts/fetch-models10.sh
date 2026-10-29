#!/usr/bin/env bash
# Study 10 model weights (docs/BRIEF-STUDY10.md): fetched, never
# committed; every file verified against the hash recorded in
# corpus/fixture10.json before use. Licenses: Beat This! MIT (CPJKU),
# ChordMini MIT (ptnghia-j), LinkSeg weights CC-BY 4.0
# (Buisson/McFee/Essid, ISMIR 2024 — attribution required on ship).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p models/study10
declare -A FILES=(
	["small0.onnx"]="ashudesai/songbird-models c462b064a4033050ca6a5354bf866ff4610ab1fd8f1dec1e494b20b22d870aea"
	["linkseg_7c.onnx"]="elicwhite/linkseg-7c-onnx c1dac2e094d260678d0097b85da6f5189abfe87af4b9c6f7adebaf99f4896125"
	["chordnet.onnx"]="musetric/chordmini-onnx 1faee8e1cf168300afe0f47517e76836ac200c3841b0fb430fad7dfea5ad6394"
	["chordmini-config.json"]="musetric/chordmini-onnx 1f26c11ebea51ec08f12e813eb213a729fa0ecc407ac7632dfdc7bad67e65aa4"
	["cqt-plan.bin"]="musetric/chordmini-onnx c31f0a6fd2d582d753be6628b5daecdee58acba53cba93b2bc2b5c75dee2ba48"
)
for f in "${!FILES[@]}"; do
	read -r repo hash <<<"${FILES[$f]}"
	target="models/study10/$f"
	src="$f"
	[ "$f" = "chordmini-config.json" ] && src="config.json"
	if [ ! -f "$target" ] || ! echo "$hash  $target" | sha256sum -c --quiet 2>/dev/null; then
		echo "fetching $f from $repo"
		curl -sL "https://huggingface.co/$repo/resolve/main/$src" -o "$target"
	fi
	echo "$hash  $target" | sha256sum -c
done
echo "models ready; python deps: python3 -m venv .venv-study10 && .venv-study10/bin/pip install -r scripts/study10/requirements.txt"
