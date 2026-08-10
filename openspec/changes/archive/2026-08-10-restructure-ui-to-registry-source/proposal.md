## Why

`packages/ui` (`@zeroxsolutions/ui`) is today a **publishable npm library**
consumers `import` from, and also a shadcn registry. That dual model does not
match shadcn's own architecture: shadcn-ui/ui ships components as **registry
source only** (in `apps/v4/registry/...`) - there is **no** consumer-import npm
library; consumers get components by `shadcn add` (copy-in). To be "đúng kiến trúc
shadcn nhất", `@zeroxsolutions/ui` must become **registry-source only,
unpublished**, with **one consumer channel: `shadcn add`** - and the component
source reorganized per-style (base x style x component) so the SDK is
multi-style ("đa hình") the way shadcn is (vega/nova/luma ship per-style code).

## What Changes

- **Unpublish `@zeroxsolutions/ui`**: remove the consumer `import` entry points
  and the publish/release targets. It stays as a **workspace package** (the
  registry-source home, holds `registry.json` + the `shadcn-build` target) but is
  NOT published to npm. Consumers never `import from '@zeroxsolutions/ui'`.
- **One consumer channel: `shadcn add` (copy-in)**. `registry.json` is the
  manifest: each item carries `files` (copy-in source) + `dependencies` (npm, e.g.
  `@base-ui/react`) + `registryDependencies` (other registry items).
- **Restructure component source per-style**, mirroring shadcn:
  `registry/bases/<base>/ui/<primitive>.tsx` (primitives) +
  `registry/<style>/{components,blocks,pages}/<slug>.tsx` (styled, per-style) +
  `registry/examples/<slug>.tsx`. Start with the **Base UI** base and a **single
  style**; which styles to add is user-directed.
- The **docs app imports the ui source internally** (workspace) for live preview,
  and `@zeroxsolutions/ui:shadcn-build` still emits `apps/docs/public/r/<name>.json`.
- Existing components migrate into the per-style structure (one base + one style
  to start; the user directs further).

## Success Criteria

- `@zeroxsolutions/ui` is NOT published (no consumer `import` entry, no publish
  target); it remains a workspace package owning the registry source.
- Component source lives under `registry/bases/<base>/ui/` +
  `registry/<style>/{components,blocks,pages}/` + `registry/examples/`.
- `pnpm dlx shadcn@latest add @zeroxsolutions/<item>` copy-in-installs an item
  (with its `dependencies` + `registryDependencies`) into a consumer project.
- `shadcn registry validate` passes on the new `registry.json`.
- The docs app still imports the ui source (workspace) and `shadcn-build` emits
  `/r/<name>.json`.
- `pnpm nx run-many -t lint typecheck build test` is green.

## Non-Goals

- Editor restructure (change `split-editor-core-and-chrome`).
- Docs / fumadocs adoption (change `adopt-fumadocs-docs`).
- Shipping multiple styles up front - one base + one style to start; the user
  directs which styles are added.
- Multi-framework (vue) - far future.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `component-registry`: the registry becomes the **sole** consumer channel -
  `@zeroxsolutions/ui` is unpublished (no npm import); components are
  registry-source organized per-style (base x style x component); consumers
  install by `shadcn add` (copy-in).

## Impact

- `packages/ui`: drop publish/import-entry role; restructure source to
  `registry/bases|<style>|examples/`; rewrite `registry.json` as the copy-in
  manifest; keep `shadcn-build`.
- `apps/docs` (and any internal importer): import ui source via workspace, not a
  published name.
- `CLAUDE.md`/`AGENTS.md`: record that `@zeroxsolutions/ui` is registry-source,
  unpublished, shadcn-add channel.
- Build/gate: still green; `shadcn registry validate` in the gate.
