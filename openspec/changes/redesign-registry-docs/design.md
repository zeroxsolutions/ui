## Context

The registry docs site (`apps/registry`, Next.js App Router, static export) today
uses a flat `/preview/<slug>` route tree, a persistent left sidebar
(`ui/sidebar`), a `ToggleGroup` for Preview/Code, a `max-w-[375px]` div for the
"responsive" preview, and a `Dialog` for fullscreen. It also documents the Button
primitive. None of this matches how shadcn-style docs systems work. This design
covers the route/IA restructure and the iframe-based preview mechanism that
replaces it.

Existing assets to keep: the `registry:example` mechanism (example files in
`packages/ui/src/examples/`, `shadcn build` emits `/r/<example>.json`, the Code
view fetches it), the `Installation`/`Usage`/`OnThisPage` doc primitives in
`packages/ui/src/components/docs/`, and the `registry-e2e` harness.

## Goals / Non-Goals

**Goals:**

- RESTful section routes with list + detail per tier, plus standalone raw-example
  routes for the iframe + fullscreen.
- A live preview that is a real viewport (iframe at device width) so the
  component's responsive behavior is authentic.
- Preview/Code as `Tabs`; fullscreen as a standalone route opened in a new tab.
- Top-nav, no left sidebar.
- Docs catalog = composed components + blocks + pages only (no primitives).
- Brand icons on the package-manager toggle.

**Non-Goals:**

- Not changing the registry ship (`registry.json`, `shadcn add`).
- Not changing the static deploy (Workers Static Assets).
- Not redesigning the composed components themselves.
- Not MDX.

## Decisions

### 1. Route tree (App Router + route groups)

Root layout is minimal (html/body + theme only). A `(main)` route group adds the
top-nav header; the standalone preview routes sit outside it so they render with
no chrome.

```
app/
  layout.tsx                 # minimal: <html><body>{children}</body></html>
  (main)/
    layout.tsx               # <SiteHeader/> (top nav: wordmark, Components/Blocks/Pages, search, theme) + {children}
    page.tsx                 # /            home
    components/
      page.tsx               # /components  list
      [slug]/page.tsx        # /components/:slug  detail
    blocks/
      page.tsx               # /blocks      list
      [slug]/page.tsx        # /blocks/:slug
    pages/
      page.tsx               # /pages       list
      [slug]/page.tsx        # /pages/:slug
  preview/
    [kind]/[slug]/page.tsx   # /preview/<kind>/<slug>  raw example, no chrome
```

The flat `app/preview/<slug>/` tree is removed. Dynamic routes export
`generateStaticParams` from the catalog so static export enumerates every page.

### 2. One catalog drives everything

A single typed catalog (in the app) is the source for the list pages, the detail
pages, the standalone preview route, and `generateStaticParams`. Each entry:

```
{ kind: 'component' | 'block' | 'page',
  slug, title, description,
  itemName,          # for Installation (/r/<itemName>.json)
  exampleName,       # for the Code tab (/r/<exampleName>.json)
  Example,           # the example component, rendered by the standalone route
  importSnippet }    # for Usage
```

Button (the primitive) is removed from this catalog. The catalog is grouped by
`kind` into the three sections.

### 3. Preview is an iframe; the device switcher sizes the iframe

`PreviewCode` (in `packages/ui/src/components/docs/`) renders the live preview as
`<iframe src="/preview/<kind>/<slug>" style={{ width: deviceWidth }}>`. The
standalone route renders the example full-bleed (width 100%, the route's own
viewport), so the component inside sees the iframe's width as its viewport and
its media queries / `vw` units respond authentically. The device switcher
(mobile 375 / tablet 768 / desktop full) changes only the iframe's CSS width.

The standalone route is the SAME url used by "Open in new tab" (fullscreen) - so
fullscreen is a plain `<a target="_blank" href="/preview/<kind>/<slug>">`, no
Dialog.

Iframe height: a generous fixed `min-height` with the iframe at `height: 100%`
inside a fixed-height frame (scroll inside). Auto-sizing the iframe to content
(postMessage/ResizeObserver) is a follow-up, not in scope.

### 4. Preview/Code are Tabs

`PreviewCode` uses `ui/tabs` (`Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`):
the Preview tab holds the iframe, the Code tab holds the fetched source
(`CodeBlock`). This replaces the `ToggleGroup` (tabbed content needs tab
semantics, `aria-selected`).

### 5. Top-nav, no sidebar

Delete `DocsShell`, `AppSidebar`, and the `SidebarProvider`/`SidebarInset` shell.
`SiteHeader` becomes the global nav (wordmark + section links + search trigger +
icon theme toggle), mounted in `(main)/layout.tsx`. The catalog is reached via
section list pages (`/components`, `/blocks`, `/pages`), not a rail.

### 6. Package-manager brand icons

The `Installation` package-manager toggle items carry each runner's brand icon
from `@zeroxsolutions/icons/brands` where present; any missing runner icon is
vendored (same workflow as existing brand marks).

## Risks / Trade-offs

- **Iframe overhead**: each preview is a separate document navigation (the
  standalone route). Acceptable for docs; the route is static and cacheable.
- **Same-origin**: the iframe loads a route on the same static origin - no CORS
  issue.
- **Iframe height**: a fixed-height frame means very tall examples scroll inside.
  Auto-size is deferred (Open Questions).
- **Static export + dynamic routes**: every `[slug]` route must enumerate slugs
  via `generateStaticParams`; a new catalog entry that isn't in the catalog won't
  get a page (correct - it's the source of truth).
- **E2E rewrite**: routes + selectors change wholesale; the `registry-e2e` suite
  is rewritten to the new IA in the same change.

## State Model

`PreviewCode` (client) holds:
- `device`: `'mobile' | 'tablet' | 'desktop'` (iframe width; default `desktop`).
- `tab`: `'preview' | 'code'` (Tabs; default `preview`).
- `source`: the fetched example source (`string | null`), resolved from
  `/r/<exampleName>.json` when the Code tab is opened.

No fullscreen state - fullscreen is a link, not a toggle.

## Migration Plan

Single PR, no fallback path (the docs site is not a released package). Order:

1. New route tree + `(main)` group + standalone preview route.
2. Catalog (single source) + list/detail pages; delete flat `/preview/<slug>`.
3. `PreviewCode` -> iframe + Tabs; wire device switcher to iframe width; fullscreen link.
4. Remove sidebar shell; `SiteHeader` global.
5. Remove Button from catalog + home.
6. Package-manager brand icons.
7. Rewrite `registry-e2e` to the new routes/selectors.
8. Gate: `nx run-many -t lint build test` + `nx e2e` green; visual check.

## Open Questions

- Iframe auto-height now or deferred? (Design defers it - fixed min-height first.)
- Brand icon coverage: are pnpm/npm/yarn/bun all present in
  `@zeroxsolutions/icons/brands`, or do some need vendoring? Resolve at task time.
