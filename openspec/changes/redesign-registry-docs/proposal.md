## Why

The docs site built in `build-registry-foundation` (and extended in-session) renders,
but its information architecture and preview mechanism diverge from how real
shadcn-style docs systems work. Each divergence below is a wrong design decision,
not polish:

1. **Flat `/preview/<slug>` routes** instead of RESTful section routes. Real docs
   systems use `/{home}`, `/components`, `/components/:slug`, `/blocks`,
   `/blocks/:slug`, `/pages`, `/pages/:slug` - addressable per-section URLs with a
   list page per section. The flat structure has no section list pages and
   un-addressable URLs.
2. **Persistent left sidebar** the user wants gone. The catalog should live behind
   a top-nav (Components / Blocks / Pages), not a rail.
3. **Preview/Code as a `ToggleGroup`** (toggle semantics, `aria-pressed`). It is
   tabbed content - the correct primitive is `Tabs` (`aria-selected`).
4. **Responsive preview via a `max-w-[375px]` div.** This does NOT exercise the
   component's real responsive behavior: CSS media queries and `vw` units key off
   the **viewport**, not a container width. A device preview MUST be an `<iframe>`
   at the device width so the inner component sees a real viewport and responds.
5. **Fullscreen as an in-page `Dialog`.** Other systems make "fullscreen" a
   dedicated **route** opened in a new tab (shadcn's "Open in new tab"), not an
   overlay.
6. **shadcn primitives (Button) in the docs catalog.** Primitives belong to
   shadcn/ui. The registry docs showcase OUR composed components + blocks + pages -
   primitives stay in `registry.json` as installable dependencies, they are just
   not re-documented here.
7. **Package-manager toggle has no brand icons** (pnpm/npm/yarn/bun). Every other
   docs system shows the brand mark; ours is text-only.

### Minor details (also in scope)

- Preview frame carries a `border-dashed` inner box - not the shadcn aesthetic;
  the iframe surface should be clean.
- The install-command `CodeBlock` renders inside a `Disclosure` whose default
  closed state hides the command; it should be open/visible by default.
- Home copy + badge ("v0.1 - shadcn-compatible registry") and per-page
  descriptions need a consistency pass.
- Per-page example depth is uneven (Button has variant Examples; every other page
  is hero-only) - bring composed pages to a consistent example structure.
- The Code-view fetch surfaces "Source unavailable." while loading - give it a
  real loading state.

## What Changes

Redesign the docs IA + preview mechanism to match the shadcn-docs pattern.

- **RESTful routes** - `/{home}`, `/components[/:slug]`, `/blocks[/:slug]`,
  `/pages[/:slug]`, plus standalone `/preview/[kind]/:slug` routes that render one
  example raw (the iframe `src` and the fullscreen/new-tab target). Remove the
  flat `/preview/<slug>` tree.
- **Top-nav, no sidebar** - section navigation in the header; each section has a
  list page; the doc page is the detail. Drop the `ui/sidebar` shell
  (`SidebarProvider`/`AppSidebar`/`SidebarInset`).
- **Preview = iframe + Tabs** - the live preview renders in an `<iframe>` sized to
  the active device width (mobile 375 / tablet 768 / desktop full) so the
  component's media queries respond; Preview/Code is a `Tabs`; "Open in new tab"
  links to the `/preview/[kind]/:slug` route (no Dialog).
- **Catalog scope = composed + blocks + pages only** - drop the Button primitive
  doc page, sidebar entry, and home feature card (Button stays a `registry:ui`
  dependency in `registry.json`, just not documented).
- **Package-manager brand icons** on the Installation toggle (use
  `@zeroxsolutions/icons/brands` where present; vendor any missing).
- Minor polish items above.

## Success Criteria

- Routes are the RESTful set; no `/preview/<slug>` flat route remains; each
  section (`components`/`blocks`/`pages`) has a list page and per-item detail page.
- No left sidebar; navigation is top-nav.
- The live preview renders in an `<iframe>`; switching device resizes the iframe
  (real viewport, media queries respond); Preview/Code is `Tabs`.
- Fullscreen opens a dedicated `/preview/[kind]/:slug` route in a new tab (no
  Dialog).
- No shadcn primitive (Button) appears in the docs catalog, sidebar, or home.
- The package-manager toggle shows a brand icon per runner.
- `nx run-many -t lint build test` green; the registry static-export covers every
  new route; `nx e2e @zeroxsolutions/registry-e2e` green against the new
  structure.

## Non-Goals

- Not changing what the registry SHIPS - `registry.json` still carries primitives
  as installable dependencies; `shadcn add` is unchanged.
- Not changing the static deploy (Workers Static Assets,
  `registry.zeroxsolutions.com`).
- Not redesigning the composed components themselves - that was
  `redesign-composed-layer` (archived). This change consumes their current
  surface.
- Not MDX - pages stay `.tsx`.
- Not changing the `registry:example` mechanism (proven last change) - examples
  stay the single source for the Code view.

## Capabilities

### Modified Capabilities

- `docs-site` - routing becomes RESTful + section-list pages; navigation is
  top-nav (no sidebar); the live preview is an iframe + `Tabs` + device-width +
  fullscreen-route; the catalog excludes shadcn primitives; the package-manager
  toggle shows brand icons.

## Impact

- **Apps**: `@zeroxsolutions/registry` (route tree, header/nav, the doc + section
  list pages, the standalone preview route, the catalog), `@zeroxsolutions/registry-e2e`
  (routes + selectors rewritten for the new IA).
- **Packages**: `@zeroxsolutions/ui` (`components/docs/preview-code` ->
  iframe + Tabs; `installation` -> brand icons; examples unchanged).
- **Specs**: `docs-site` modified.
- **Depends on**: nothing active (the surface is the post-`redesign-composed-layer`
  + post-`build-registry-foundation` tree).
