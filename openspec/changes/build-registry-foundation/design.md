## Context

The `registry` app (from the archived `add-shadcn-registry-and-docs`) is a render-only
sandbox today: `layout.tsx`, `page.tsx`, one `ComponentPreview`, and a single
`/preview/button` page. `registry.json` has three items (`utils`, `button`,
`model-info-card`) with a `type` but no `categories`. The shadcn ecosystem goal needs the
app to document every item fully and to grow from components into blocks and pages.

The shadcn registry already supports the shape natively: item `type`
(`registry:ui`/`:component`/`:block`/`:page`/`:example`), `categories`, May 2026
`shadcn registry validate`, and April 2026 Composition trees. This change adopts that
shape and builds the doc-page surface that `ui.shadcn.com` demonstrates.

This change depends on `redesign-composed-layer` for the components a block composes; it
may start in parallel once the first redesigned cluster is stable, and its doc pages track
the surface as it settles.

## Goals / Non-Goals

**Goals:**

- A reusable doc-page layout (Preview + Code/Usage + Props + Composition + dark-mode) that
  every documented item composes.
- Typed, categorized registry items; `shadcn registry validate` in the build gate.
- At least one `registry:block` and a `registry:page` to prove the ecosystem path.
- Reuse `ComponentPreview`, the `shadcn-build` target, and `registry-e2e`; extend, not
  rebuild.

**Non-Goals:**

- Redesigning components (`redesign-composed-layer`). This change documents whatever the
  redesigned surface is.
- A new test runner; static-deploy change; MDX; the flat registry structure; the npm
  channel.

## Decisions

### 1. Doc-page content is hand-authored per item, like `ui.shadcn.com`

Each documented item gets a `.tsx` page that composes the shared doc layout and supplies
the item-specific Preview, Props, Composition tree, and Usage/Code as authored content.
Props and Composition are NOT auto-extracted (react-docgen was considered and rejected - it
adds a build toolchain and still needs curation); `ui.shadcn.com` itself hand-curates these.
The `shadcn add` command and the import snippet are derived from the item's `name` and the
deployed registry URL, so only Props/Composition are hand-authored.

### 2. A small set of reusable doc components, composed from primitives

Build a `docs/` folder in the registry app with: `DocPage` (the shell), `DocTabs`
(Preview/Code/Props/Composition), `PropsTable`, `CompositionTree`, `UsageCode` (the
`shadcn add` command + import snippet), and `DarkModeToggle`. Each composes the
`@zeroxsolutions/ui` primitives (no re-skinning); they live in the app, not the library.

### 3. `categories` groups the catalog

A fixed category set groups items for navigation/filtering: `primitives`, `components`,
`layout`, `data-display`, `editor`, `blocks`, `pages`. Every existing item gets a category;
new items declare one on add.

### 4. `shadcn registry validate` joins the `shadcn-build` target

The `@zeroxsolutions/ui` `shadcn-build` nx target gains a `shadcn registry validate` step
after `shadcn build`, so a malformed `registry.json` fails the build. The static `build`
target already depends on `shadcn-build`, so validate reaches the gate.

### 5. Block and page seeds prove the path

Seed one `registry:block` composed from existing redesigned components (an AI-provider
picker grid from `AiProviderCard` + `AiProviderIcon`), declaring its `registryDependencies`,
and one `registry:page` demo composing blocks. The seed lands after the
`redesign-composed-layer` cluster that stabilizes those components.

### 6. The registry stays flat; the npm channel stays unchanged

`registry.json` remains flat (no nested items). `registry.json` sits at the package root
outside `files`, so it is not in the npm tarball; the npm `exports`/`files` surface is
byte-unchanged (additive `nx` target metadata + registry content only).

## Risks / Trade-offs

- **Hand-authored doc upkeep** - Props/Composition can drift from the code. Mitigation:
  derive Usage/Code from the item name + URL; review Props/Composition when the component
  is touched; the `registry-e2e` suite asserts the page renders each section. This is the
  same trade-off `ui.shadcn.com` makes.
- **Block/page depends on redesign** - the seed block composes components that
  `redesign-composed-layer` stabilizes. Mitigation: the seed lands after that cluster;
  until then the doc pages track single components.
- **Category set churn** - a fixed category set may need new groups later. Mitigation: the
  set is small and additive; adding a category is non-breaking.
- **Validate strictness** - `shadcn registry validate` may flag pre-existing items.
  Mitigation: fix every flagged item in the same change; validate is added once the items
  are clean.

## State Model

Each documented item moves through:

- `cataloged` - the item is in `registry.json` with a `type` and a `category`.
- `doc-authored` - its doc page exists with Preview + Code/Usage + Props + Composition.
- `validated` - `shadcn registry validate` passes for the item.
- `e2e-covered` - `registry-e2e` asserts the page's sections render.
- `shipped` - the static export includes the page and the item is installable via
  `shadcn add`.

A block/page follows the same path plus a `composed` step (its files assemble existing
items and declare `registryDependencies`).

## Migration Plan

- **Rollout** - build the doc components and the layout first, retro-fit the existing
  `button` page to the new shape, then add `categories` to the existing three items and
  wire `shadcn registry validate`. New component pages are added as `redesign-composed-layer`
  stabilizes each cluster. The block/page seed lands last.
- **Consumer lockstep** - none; the npm channel is unchanged and the registry is additive.
- **Fallback** - the doc layout and validate are independent commits; either can be
  reverted without unwinding the other.

## Open Questions

- **Category set** - the seven groups above are a starting cut; confirm or adjust when the
  first batch of items is categorized.
- **Block seed choice** - AI-provider picker is the proposed seed; confirm once the
  `redesign-composed-layer` cluster for `AiProviderCard` / `AiProviderIcon` lands.
- **Props-table depth** - whether Props shows only the component's own props or also the
  inherited primitive props (shadcn shows own + key inherited).
