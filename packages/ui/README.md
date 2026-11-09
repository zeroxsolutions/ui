# @zeroxsolutions/ui

The web registry: the items' source under `registry/bases/base-ui`, and `registry.json`, which names
what each item ships. `@zeroxsolutions/registry-ui` serves the built registry and draws the items in
its docs.

- An item writes a class that differs between styles as a `cn-<slot>` token: upstream's slot where the
  part looks like upstream's, else one of zui's own, defined in each of `registry/styles/style-<style>.css`.
  `src/build/zui-slots.spec.ts` keeps the eight sheets and the items in step.
- `pnpm nx build-registry @zeroxsolutions/ui` writes each `base-<style>` JSON to `dist/r/styles`, every
  token replaced by that style's classes from `@zeroxsolutions/shadcn-upstream`'s sheet and zui's.
- `registry/bases/base-ui/ui/` holds the docs' primitives, upstream's base items as the CLI installs them,
  slots kept; `pnpm nx sync-primitives @zeroxsolutions/ui` rewrites them from the snapshot. The docs load
  every style's sheets, and a web page carries the picker's `style-<style>` class on `<html>`.
- `pnpm nx examples-index @zeroxsolutions/ui` writes the docs' demo index under `registry/bases/base-ui/examples`.
- `pnpm nx test @zeroxsolutions/ui` runs the items' specs; a `*.browser.spec.tsx` runs in Chromium.
