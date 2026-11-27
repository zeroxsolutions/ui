#!/usr/bin/env bash
# The half of `test-visual-linux.sh` that runs inside the image: copies the checkout's files from /repo into a
# workspace of its own, installs it for Linux, runs `nx test-visual`, and copies the Linux references and the
# diffs back to /repo.
set -euo pipefail

work=/cache/work
mkdir -p "$work" /cache/tools

# The pnpm the workspace's `engines` names, installed once into the volume.
export PATH="/cache/tools/bin:$PATH"
[ "$(pnpm --version 2>/dev/null)" = 10.33.0 ] || npm install --global --prefix /cache/tools pnpm@10.33.0

# Everything but the install and the nx cache goes, so a file deleted from the checkout is gone here too.
find "$work" -mindepth 1 -maxdepth 1 ! -name node_modules ! -name .nx -exec rm -rf {} +
tar -C /repo --null --files-from=/files --ignore-failed-read -cf - 2>/dev/null | tar -C "$work" -xf -

cd "$work"
pnpm install --frozen-lockfile --store-dir /cache/store --reporter=append-only
export NX_DAEMON=false NX_NO_CLOUD=true

rm -rf /repo/test-output/visual/ui
mkdir -p /repo/test-output/visual
styles=($(node -e "import('./packages/ui/src/site/constants/platform-styles.ts').then((m) => console.log(m.PLATFORM_STYLES.web.join(' ')))"))

# One style, two browsers, at a time: under emulation each Chromium holds well over a gigabyte, and all sixteen
# at once exhaust a 6 GB container, whose kernel then kills a page mid-run. The cache is skipped because a run
# here is asked for to compare, and a replayed pass compares nothing.
status=0
for style in "${styles[@]}"; do
  pnpm nx test-visual @zeroxsolutions/ui --skip-nx-cache --outputStyle=stream -- --project "$style-*" "$@" || status=1
  [ -d test-output/visual/ui ] && cp -R test-output/visual/ui /repo/test-output/visual/
done

# Only the Linux references: the checkout's own macOS ones never came in.
[ -d packages/ui/visual-baselines ] && (cd packages/ui && find visual-baselines -name '*-linux.png' -print0 | tar --null -T - -cf -) |
  tar -C /repo/packages/ui -xf -
exit "$status"
