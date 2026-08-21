#!/usr/bin/env bash
# Publish `assets/` to the R2 bucket Terraform owns.
#
# rclone owns the transfer. This wrapper exists to map the four documented variables
# onto rclone's seven-key env config, so `CLAUDE.md`'s inventory stays four rows and a
# forgotten variable is named here rather than surfacing as an opaque 403.
set -euo pipefail

missing=()
for name in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do
  [ -n "${!name:-}" ] || missing+=("$name")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "r2.config.missing: ${missing[*]}" >&2
  exit 1
fi

export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
# An object-scoped token cannot HeadBucket, which rclone otherwise does first.
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
export RCLONE_CONFIG_R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"

# `copy`, never `sync`: sync deletes what is not in `assets/`, so an empty or mistyped
# source would empty the bucket. Removing an object stays a deliberate manual step.
#
# `--checksum` compares MD5 instead of modification time. A checkout writes fresh mtimes,
# so without it every run re-uploads all 9217 files.
#
# Stats print at INFO by default while rclone logs at NOTICE, so they need the level
# lowered or the run is silent until it ends.
exec rclone copy assets "r2:${R2_BUCKET}" \
  --checksum \
  --transfers 8 \
  --header-upload 'Cache-Control: public, max-age=31536000, immutable' \
  --stats 30s \
  --stats-one-line \
  --stats-log-level NOTICE \
  "$@"
