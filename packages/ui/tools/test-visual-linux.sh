#!/usr/bin/env bash
# Runs the visual suite in the image CI's `visual` job runs in, from any machine with Docker, and brings the Linux
# references it writes and the diffs of a failed comparison back into this checkout. Its arguments go to Vitest,
# such as `--update` or `--shard=1/4`.
#
# `pnpm nx test-visual-linux @zeroxsolutions/ui`
set -euo pipefail

# The digest of mcr.microsoft.com/playwright:v1.64.1-noble, the version the lockfile holds; the `container:` of the
# `visual` job in .github/workflows/ci.yml names the same one, and the two change together.
IMAGE='mcr.microsoft.com/playwright:v1.64.1-noble@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f'

repo="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
files="$(mktemp)"
trap 'rm -f "$files"' EXIT
# The tracked files and the new ones not ignored, so the container builds what this checkout holds, and none of
# its macOS `node_modules`, build output or references.
git -C "$repo" ls-files -z --cached --others --exclude-standard >"$files"

# CI's runners are x86-64, and Chromium antialiases differently on ARM, so an Apple machine runs the same build
# under emulation. The volume keeps the Linux install and the nx cache between runs.
exec docker run --rm --init --ipc=host --platform linux/amd64 --memory 6g \
  --volume "$repo:/repo" \
  --volume "$files:/files:ro" \
  --volume zeroxsolutions-ui-visual-linux:/cache \
  --env CI \
  "$IMAGE" bash /repo/packages/ui/tools/test-visual-in-container.sh "$@"
