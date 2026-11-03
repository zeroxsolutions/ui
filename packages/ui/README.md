# @zeroxsolutions/ui

The web registry: the items' source under `registry/bases/base-ui`, and `registry.json`, which names
what each item ships. `@zeroxsolutions/registry-ui` serves the built registry and draws the items in
its docs.

- `pnpm nx build-registry @zeroxsolutions/ui` writes each `base-*` style's JSON to `dist/r/styles`.
- `pnpm nx examples-index @zeroxsolutions/ui` writes the docs' demo index under `registry/bases/base-ui/examples`.
- `pnpm nx test @zeroxsolutions/ui` runs the items' specs; a `*.browser.spec.tsx` runs in Chromium.
