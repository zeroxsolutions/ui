## Context

`packages/ui` (`@zeroxsolutions/ui`) is today two things at once: a **publishable
npm library** consumers `import { ... } from '@zeroxsolutions/ui'`, and a
shadcn-compatible **registry** consumers reach via `shadcn add`. The current
`component-registry` spec encodes that duality as a feature ("a second, additive
channel alongside the unchanged npm package").

shadcn itself does not work that way. shadcn-ui/ui ships components as **registry
source only** - there is no consumer-import npm library of components; the only
`packages/` are the CLI, `react`, helpers, and tests. Consumers get components by
`shadcn add` (copy-in), and the source is organized **per-style** so the registry
is multi-style (vega/nova/luma each ship their own component code; color is a
token, style/radius/density is per-style code).

To be "dung kien truc shadcn nhat", `@zeroxsolutions/ui` must collapse to **one
consumer channel (`shadcn add`)** and reorganize its source **per-style**. This
change does exactly that. It does NOT touch the editor (change
`split-editor-core-and-chrome`) or the docs framework (change
`adopt-fumadocs-docs`).

Grounded API (confirmed against the shadcn registry-template docs, Context7
`/shadcn-ui/registry-template`):

- `registry.json` root: `{ "$schema", "name", "homepage", "items": [...] }`.
- Registry item: `{ name, type, title?, description?, dependencies?: string[],
  registryDependencies?: string[], files: [{ path, type, target? }], categories?,
  meta? }`. `type` is one of `registry:block|:component|:ui|:example|:lib|:hook|
  :page|:file|:theme|:style|:font|:base`.
- `dependencies` = npm packages the CLI installs (e.g. `@base-ui/react`);
  `registryDependencies` = other registry items the CLI also copies in.
- `shadcn build` emits `public/r/<name>.json` per item + a `public/r/registry.json`
  index; `shadcn registry validate` checks the schema.
- Canonical layout in the template is `registry/<style>/ui/` (primitives) +
  `registry/<style>/blocks/` (items). We adopt the **separated** form shadcn-ui/ui
  itself uses - `bases/<base>/ui/` (primitives per base library) + `<style>/`
  (composed items per style) - because a style can sit on any base.

## Goals / Non-Goals

**Goals:**

- `@zeroxsolutions/ui` becomes **registry-source only, unpublished**: no consumer
  `import` entry, no publish/release target; it stays a workspace package owning
  the registry source + `registry.json` + `shadcn-build`.
- **One consumer channel**: `shadcn add` copies an item's files, installs its npm
  `dependencies`, and pulls its `registryDependencies`.
- **Per-style source**: `bases/<base>/ui/` primitives + `<style>/{components,
  blocks,pages}/` styled items + `examples/`; one base + one style to start,
  additive thereafter.
- Internal importers (docs app, examples) reach the **workspace source directly**,
  not a published name.
- Gate green (`lint typecheck build test`) and `shadcn registry validate` passes.

**Non-Goals:**

- Editor restructure (`split-editor-core-and-chrome`).
- Docs / fumadocs (`adopt-fumadocs-docs`) - the docs app keeps importing the ui
  source; only the *nature* of that import (workspace, not published) is in scope.
- Shipping multiple styles up front - one base + one style; further styles are
  user-directed and additive.
- Multi-framework (vue) - far future.

## Decisions

### D1 - Registry-source, unpublished; the workspace package is the source home

`@zeroxsolutions/ui` keeps its workspace `package.json` (the registry source needs
deps, the `shadcn-build` target, and tsconfig) but drops the consumer `exports`
surface and any publish/release target. It is never on npm. The package's role
narrows to: hold `registry.json`, hold the per-style source, run `shadcn-build` to
emit `apps/docs/public/r/`. This is exactly shadcn-ui/ui's shape (its `packages/`
hold tooling, not a consumer component lib).

### D2 - One channel: `shadcn add` (copy-in); deps split by kind

`registry.json` is the manifest. Each item carries `files` (source copied in),
`dependencies` (npm packages the CLI installs, e.g. `@base-ui/react`, `editor-core`
once the editor lands), and `registryDependencies` (other registry items the CLI
also copies). There is no `pnpm add @zeroxsolutions/ui` path for components. This
matches how shadcn treats `@base-ui/react`/`@radix-ui` as npm `dependencies` of a
copy-in item.

### D3 - Per-style layout, base separated from style

```
packages/ui/
  registry.json               # flat manifest; items named globally uniquely
  bases/
    <base>/                   # e.g. base-ui (the primitive library this base targets)
      ui/                     #   primitives: button.tsx, card.tsx, ...
  <style>/                    # one folder per named style (e.g. nova)
    components/               #   styled components
    blocks/                   #   multi-component blocks
    pages/                    #   full page compositions
  examples/                   #   registry:example items (used by the docs live preview)
```

Rationale over the template's single `registry/<style>/ui`+`blocks` form: a style
(aesthetic: radius/spacing/density) is orthogonal to a base (the primitive
library: Base UI vs Radix). shadcn-ui/ui keeps `registry/bases/aria/ui/` distinct
from `apps/v4/registry/new-york-v4/blocks/`; we do the same so a future second
base or second style slots in without moving files. Color stays token-driven
(`globals.css` CSS vars, the monochrome scale); only structure/spacing differs per
style's code.

### D4 - Flat manifest, globally-unique item names, path encodes base/style

`registry.json#items` is one flat array. Each item's `name` is globally unique
(two styles cannot both claim `button`); the `files[].path` encodes where it lives
(`bases/base-ui/ui/button.tsx`, `<style>/blocks/dashboard.tsx`). This keeps
`shadcn add <name>` unambiguous while the on-disk layout stays per-style. A styled
item that composes a primitive lists that primitive in `registryDependencies`.

### D5 - Build mechanism unchanged; only the source shape and `homepage` move

`shadcn-build` already emits `apps/docs/public/r/<name>.json`. Its mechanism is
unchanged - it reads `registry.json`, resolves each item's `files`, and writes the
per-item JSON + the index. What changes is the **input** (per-style source) and
`registry.json#homepage` (the docs URL). No new build tooling.

### D6 - Migrate existing components into one base + one style; default base `base-ui`

Existing `components/ui` primitives move into `bases/base-ui/ui/`; existing
composed items move into the first style's `components|blocks|pages/`. The base is
`base-ui` (the repo already targets `@base-ui/react`). The **first style's name**
is the one open item (see Open Questions) - the folder is created under a name the
user confirms; until then the layout is correct regardless of the label.

## Risks / Trade-offs

- **In-repo importers break when the npm surface is removed.** Any
  `import ... from '@zeroxsolutions/ui'` in `apps/*` or examples stops resolving.
  Mitigation: a pre-migration grep lists every site; each becomes a workspace
  source import (`@zeroxsolutions/ui` alias repointed at `packages/ui/src`, or a
  direct relative/`@/` import). The docs app (the main importer) is migrated in
  this change; the fumadocs change rewrites its content anyway.
- **Per-style code duplicates across styles.** Each style carries its own
  component code - that is the cost of "da hinh" and is accepted (shadcn pays it
  too). Primitives under `bases/<base>/ui/` are NOT duplicated per style; only
  style-specific composition code is.
- **Loss of npm semver for components.** Unpublishing removes the version pin npm
  gave. Mitigation: the registry is rebuilt and redeployed on each release;
  registry items MAY carry a version in `meta` if a consumer ever needs it (not
  required now).
- **Item-name collisions across styles.** D4 enforces global uniqueness; the risk
  is human (two styles both adding `dashboard`). Mitigation: `shadcn registry
  validate` fails on duplicate `name`s; the gate runs it.

## State Model

Two simple pipelines; no long-lived runtime state.

- **Build pipeline (CI/local):** per-style source files + `registry.json` ->
  `shadcn-build` -> `apps/docs/public/r/<name>.json` (+ `public/r/registry.json`).
  Idempotent per commit.
- **Consumer flow (runtime, in the consumer's project):** `shadcn add <name>` ->
  resolve item in `registry.json` -> copy `files` -> `pnpm/npm install
  dependencies` -> recursively `add` each `registryDependency` -> rewrite `@/`
  aliases to the consumer's `components.json`.

## Migration Plan

1. **Inventory** every `@zeroxsolutions/ui` consumer import across `apps/*` and
   examples (`grep -R "@zeroxsolutions/ui"`); record the sites.
2. **Restructure source**: move primitives to `bases/base-ui/ui/`; move composed
   items into the first style's `components|blocks|pages/`; move example items to
   `examples/`. Keep git history via `git mv`.
3. **Rewrite `registry.json`** as the per-style flat manifest (D4); set
   `homepage`.
4. **Drop the npm surface**: remove consumer `exports` and the publish/release
   target from `packages/ui/package.json`.
5. **Re-point internal importers** (step 1 sites) to workspace source.
6. **Verify**: `shadcn registry validate`; `shadcn-build` emits `/r/*.json`;
   `pnpm nx run-many -t lint typecheck build test` green.

Fallback: the change is reversible until `shadcn-add` consumers depend on it
(there are none external yet). If the per-style split proves premature, the
flatten-back to a single `registry/<style>/` (template form) is a local move of
`registry.json` paths with no source rewrite.

## Open Questions

- **O1 (the one to confirm): the first style's name.** The base is `base-ui`. The
  first style folder is created under a name the user picks (a shadcn-style name
  like `nova`, or a neutral `default`). The layout is correct either way; only the
  folder label and the item `name` prefix depend on it. Default if unanswered:
  `default`.
