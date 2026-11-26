#!/usr/bin/env bash
# Prints every file over 20 MiB that the OpenNext build in the current directory will upload as a static
# asset, and exits 1 when it printed any. Cloudflare refuses a deploy holding an asset over 25 MiB, and a
# page's prerendered render, its HTML and its flight data together, is one such asset: the deploy copies
# .open-next/cache into the assets. Nothing before the upload measures them, so a page that grew past the
# limit builds, passes every test and fails only the deploy, or the zone's e2e where its server refuses it.
set -euo pipefail

limit_bytes=$((20 * 1024 * 1024))

if [ ! -d .open-next/assets ]; then
  echo "check-asset-sizes: no .open-next/assets in $(pwd); run it from an app after its OpenNext build" >&2
  exit 2
fi
dirs=(.open-next/assets)
[ -d .open-next/cache ] && dirs+=(.open-next/cache)

oversized=$(find "${dirs[@]}" -type f -size "+${limit_bytes}c")
if [ -n "$oversized" ]; then
  echo "Assets over 20 MiB, near Cloudflare's 25 MiB limit per asset:" >&2
  while IFS= read -r file; do
    echo "  $(($(wc -c < "$file") / 1024 / 1024)) MiB  $file" >&2
  done <<< "$oversized"
  exit 1
fi
