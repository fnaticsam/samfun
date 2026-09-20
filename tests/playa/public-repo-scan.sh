#!/usr/bin/env bash
# Scan only this packet's public source and tests; never dump matching content.
set -euo pipefail
cd "$(dirname "$0")/../.."
mapfile -d '' files < <(
  git ls-files --cached --others --exclude-standard -z -- \
    api/playa.js api/_lib/playa-session.js api/_lib/playa-store.js \
    api/_lib/playa.html api/_lib/PLAYA-PAGE.md tests/playa vercel.json
)
report=$(mktemp)
trap 'rm -f "$report"' EXIT
if ! bash tests/dev-page/secret-scan.sh "${files[@]}" >"$report" 2>&1; then
  echo 'FAIL existing secret scan (matching content suppressed)'
  exit 1
fi
status=0
# Split source spelling only; the combined detection expression is unchanged.
pattern='[0-9a-f]{64}|[a-z0-9-]+\.(private\.|public\.)?blob\.vercel-storage\.com|data:[i]mage/'
pattern+='|[0-9]{4}.*(DSC[0-9]+|OMD[[:alnum:]_]+|IMG_[0-9]+)'
pattern+='|(DSC[0-9]+|OMD[[:alnum:]_]+|IMG_[0-9]+).*[0-9]{4}'
for file in "${files[@]}"; do
  if grep -qiE "$pattern" "$file"; then
    echo "FAIL public-data scan: $file (matching content suppressed)"
    status=1
  fi
done
if [ "$status" -eq 0 ]; then
  echo "PASS public repo scan: ${#files[@]} files"
fi
exit "$status"
