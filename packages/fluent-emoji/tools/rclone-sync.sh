#!/usr/bin/env bash
# Publish `assets/` to the R2 bucket Terraform owns.
#
# rclone configures itself from its own environment variables - `RCLONE_S3_<FLAG>` is
# `--s3-<flag>` uppercased - so nothing here renames anything and there is no config
# file and no remote to define. `:s3:` is rclone's on-the-fly backend.
#
# Not the AWS SDK: it sends a CRC32 header beside the Content-MD5, and R2 accepts one
# non-default checksum, so every object failed with "You can only specify one non-default
# checksum at a time". One client option fixed that case; rclone absorbs the class upstream.
set -euo pipefail

# Both missing values fail late and misleadingly: with no endpoint
# rclone reaches AWS and returns 403, which reads as a bad credential; with no bucket the
# destination is bare `:s3:` and it returns `input member Key must not be empty`.
# FLUENT_EMOJI_BUCKET is this package's own name for its bucket, `<CONCERN>_BUCKET` as a
# worker's bucket binding; rclone reads no variable for it, since the bucket is the destination
# path. A wrong key passes this check and fails per object with a signature error.
missing=()
for name in RCLONE_S3_ENDPOINT RCLONE_S3_ACCESS_KEY_ID RCLONE_S3_SECRET_ACCESS_KEY FLUENT_EMOJI_BUCKET; do
  [ -n "${!name:-}" ] || missing+=("$name")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "rclone.config.missing: ${missing[*]}" >&2
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
# so without it every run re-uploads every file.
#
# Keys are `<style>/<codepoint>.<ext>` at the bucket root and are not content-hashed, so
# artwork re-sourced under the same key serves stale for the year the header below allows.
# Upload it under a `v2/` prefix and move each app's base URL: old URLs keep working and
# nothing needs purging.
#
# Stats print at INFO by default while rclone logs at NOTICE, so they need the level
# lowered or the run is silent until it ends.
exec rclone copy assets ":s3:${FLUENT_EMOJI_BUCKET}" \
  --s3-provider Cloudflare \
  --s3-no-check-bucket \
  --checksum \
  --transfers 8 \
  --header-upload 'Cache-Control: public, max-age=31536000, immutable' \
  --stats 30s \
  --stats-one-line \
  --stats-log-level NOTICE \
  "$@"
