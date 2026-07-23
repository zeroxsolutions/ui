## Why

The `registry` app (from the archived `add-shadcn-registry-and-docs`) is a render-only
sandbox today: one preview page (`/preview/button`) that renders five variants, a
`registry.json` with no `categories` on any of its three items, and no Usage/Code/Props/
Composition/dark-mode. The ambition is bigger - the registry must become the
**foundation for a full shadcn-style ecosystem**: components, **blocks**, and **pages**
that other apps `shadcn add`. Today it ships components but documents none of them, and
it has no concept of a block or a page.

The shadcn registry already supports this natively (item `type`: `registry:ui`,
`registry:component`, `registry:block`, `registry:page`, `registry:example`; May 2026
`shadcn registry validate`; April 2026 Composition sections). This change adopts that
shape wholesale.

## What Changes

Turn the registry into the ecosystem foundation:

- **Registry item types** - declare each item's `type` explicitly
  (`registry:ui` / `registry:component` / `registry:block` / `registry:page` /
  `registry:example`) so the ecosystem can grow beyond single components. Seed at least
  one `registry:block` (e.g. an AI-provider picker grid composed from `AiProviderCard` +
  `AiProviderIcon`) to prove the path.
- **`categories` on every item** - group/filter the catalog (primitives, layout,
  data-display, editor, blocks, pages).
- **Complete doc page per component/block** - clone the `ui.shadcn.com` shape: a live
  Preview tab plus Code/Usage (the `shadcn add` command + import snippet), a Props
  table, a **Composition tree** (the April 2026 `Parent -> Part` structure), and a
  dark-mode toggle.
- **`shadcn registry validate` in the gate** - the May 2026 CLI check verifies
  `registry.json` on every build.
- **Reuse, do not rebuild** - keep `ComponentPreview`, the `shadcn-build` nx target, and
  the `registry-e2e` harness; extend them.

The registry stays **flat** (no nested items) and the npm channel stays unchanged -
this is additive ecosystem + documentation.

## Success Criteria

- Every documented component AND block has a page: live Preview + Usage/Code + Props +
  Composition tree + dark-mode toggle - matching `ui.shadcn.com`.
- At least one `registry:block` ships (composed from existing designed-public
  components), proving the blocks path; `registry:page` is wired and documented even if
  the first page is a demo.
- Every registry item carries a `type` and a `category`; `shadcn registry validate`
  passes in the build gate.
- A consumer can copy the `shadcn add` command and import snippet from any page and
  install/use the item.
- `nx run-many -t lint build test` green; `nx build @zeroxsolutions/registry`
  static-exports every doc page; `nx e2e @zeroxsolutions/registry-e2e` passes (extended
  to cover the doc tabs, not just the preview render).
- The npm package channel is byte-unchanged (additive `nx` target metadata + registry
  content only).

## Non-Goals

- Not redesigning components - that is `redesign-composed-layer`. This change documents
  and ships whatever the redesigned surface is; it does not rename or restyle.
- Not a new test runner - library tests stay jsdom-only; interaction coverage in
  `registry-e2e`.
- Not changing the static deploy (Workers Static Assets, `registry.zeroxsolutions.com`).
- Not MDX - pages are `.tsx`.
- Not changing the flat registry structure or the npm `exports`/`files` surface.

## Capabilities

### New Capabilities

- `registry-ecosystem`: the full registry contract - item `type`s
  (`registry:ui`/`:component`/`:block`/`:page`/`:example`), `categories` on every item,
  `shadcn registry validate` in the build gate, and a complete doc page (Preview +
  Usage/Code + Props + Composition + dark-mode) per documented item; the ecosystem grows
  from single components to assembled blocks and pages.

### Modified Capabilities

- `docs-site`: "each documented component renders in an isolated live preview" is
  upgraded to the full doc shape; "the registry app hosts the component registry" gains
  the `type` + `categories` + `validate` obligations and the blocks/pages growth path.
- `component-registry`: the registry-item contract gains explicit `type` and
  `categories` fields and the `validate` gate.

## Impact

- **Apps**: `@zeroxsolutions/registry` (doc-page layout + Code/Usage/Props/Composition
  components + dark-mode toggle + the first block/page seeds), `@zeroxsolutions/registry-e2e`
  (extended to the doc tabs).
- **Packages**: `@zeroxsolutions/ui` (`registry.json` gains `type` + `categories` + more
  items + a block; `shadcn-build` gains a `validate` step).
- **Consumers**: none breaking - additive documentation and registry content; npm channel
  unchanged.
- **Specs**: one new capability (`registry-ecosystem`) + two modified (`docs-site`,
  `component-registry`).
- **Depends on**: `redesign-composed-layer` (doc the final redesigned surface, and blocks
  compose redesigned components). May run in parallel once the first redesigned cluster
  is stable - doc pages track the surface as it settles.
