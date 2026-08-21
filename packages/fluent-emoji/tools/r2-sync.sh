#!/usr/bin/env bash
# Publish `assets/` to the R2 bucket Terraform owns.
#
# rclone configures itself from its own environment variables - `RCLONE_S3_<FLAG>` is
# `--s3-<flag>` uppercased - so nothing here renames anything and there is no config
# file and no remote to define. `:s3:` is rclone's on-the-fly backend.
set -euo pipefail

# Both missing values fail late and misleadingly (measured 2026-08-22): with no endpoint
# rclone reaches AWS and returns 403, which reads as a bad credential; with no bucket the
# destination is bare `:s3:` and it returns `input member Key must not be empty`.
missing=()
for name in RCLONE_S3_ENDPOINT RCLONE_S3_ACCESS_KEY_ID RCLONE_S3_SECRET_ACCESS_KEY R2_BUCKET; do
  [ -n "${!name:-}" ] || missing+=("$name")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "r2.config.missing: ${missing[*]}" >&2
  exit 1
fi

# Provider and bucket-check are properties of this destination, not of an environment, so
# they are flags here rather than variables somebody has to set. An object-scoped token
# cannot HeadBucket, which rclone otherwise does before the first upload.
#
# `copy`, never `sync`: sync deletes what is not in `assets/`, so an empty or mistyped
# source would empty the bucket. Removing an object stays a deliberate manual step.
#
# `--checksum` compares MD5 instead of modification time. A checkout writes fresh mtimes,
# so without it every run re-uploads all 9217 files.
#
# Stats print at INFO by default while rclone logs at NOTICE, so they need the level
# lowered or the run is silent until it ends.
exec rclone copy assets ":s3:${R2_BUCKET}" \
  --s3-provider Cloudflare \
  --s3-no-check-bucket \
  --checksum \
  --transfers 8 \
  --header-upload 'Cache-Control: public, max-age=31536000, immutable' \
  --stats 30s \
  --stats-one-line \
  --stats-log-level NOTICE \
  "$@"
