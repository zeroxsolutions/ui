#!/usr/bin/env bash
# Run from an app's root after the adapter build. Bundles the worker in .open-next as its production
# deploy would, without uploading it, and exits 1 when the upload exceeds 58982 KiB, 90 per cent of
# Cloudflare's 64 MiB uncompressed limit (code 10027); a pull request then learns the size before a
# deploy refuses it. The limit counts the uncompressed total of every module; the gzip figure wrangler
# prints beside it is no limit. Prints the upload and the server handler, raw and gzipped, either way.
set -euo pipefail

limit_kib=58982

output="$(WRANGLER_SEND_METRICS=false pnpm exec wrangler deploy --dry-run --env production 2>&1)" || {
  printf '%s\n' "$output"
  exit 1
}
# wrangler colours the figures when it thinks it writes to a terminal.
upload_line="$(printf '%s\n' "$output" | sed 's/\x1b\[[0-9;]*m//g' | grep '^Total Upload:')" || {
  printf '%s\n' "$output"
  echo 'check-worker-size: wrangler printed no "Total Upload:" line' >&2
  exit 1
}
upload_kib="$(printf '%s\n' "$upload_line" | sed -E 's/^Total Upload: ([0-9.]+) KiB.*/\1/')"

handler="$(find .open-next/server-functions/default/apps -maxdepth 2 -name handler.mjs | head -n 1)"
handler_kib="$(( $(wc -c < "$handler") / 1024 ))"
handler_gzip_kib="$(( $(gzip -c "$handler" | wc -c) / 1024 ))"

echo "$upload_line (limit $limit_kib KiB)"
echo "$handler: $handler_kib KiB / gzip: $handler_gzip_kib KiB"

if awk -v size="$upload_kib" -v limit="$limit_kib" 'BEGIN { exit !(size > limit) }'; then
  echo "check-worker-size: the upload is $upload_kib KiB, over $limit_kib KiB" >&2
  exit 1
fi
