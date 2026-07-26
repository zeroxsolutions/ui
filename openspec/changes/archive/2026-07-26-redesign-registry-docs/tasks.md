## 1. Route tree and layouts

- [x] 1.1 Make `app/layout.tsx` minimal: `<html><body>{children}</body></html>` + theme script only; remove the `DocsShell`/`SidebarProvider`/`SidebarInset` shell.
- [x] 1.2 Create `app/(main)/layout.tsx` mounting the top-nav `SiteHeader` (wordmark + Components/Blocks/Pages links + search trigger + icon theme toggle) over `{children}`.
- [x] 1.3 Create the section route folders under `(main)/`: `components/`, `blocks/`, `pages/` each with a list `page.tsx` and a `[slug]/page.tsx` detail.
- [x] 1.4 Create `app/preview/[kind]/[slug]/page.tsx` - a standalone route that renders only the looked-up example (no header/chrome), full-bleed; export `generateStaticParams` from the catalog.

## 2. Single catalog + list/detail pages

- [x] 2.1 Replace `doc-catalog.ts` with one typed catalog keyed by entry: `{ kind, slug, title, description, itemName, exampleName, Example, importSnippet }`; **remove the Button entry** (primitive). Export `entriesByKind`, `findEntry`, `previewParams`, `KIND_META`.
- [x] 2.2 Build the three list pages (`/components`, `/blocks`, `/pages`) via a shared `SectionList`.
- [x] 2.3 Build the three detail pages (`/<section>/<slug>`) via a shared `EntryDetail`; `generateStaticParams` per section.
- [x] 2.4 Delete the flat `app/preview/<slug>/` tree (all 8).
- [x] 2.5 Rewrite home `app/(main)/page.tsx`: drop the Button feature card; hero + featured (composed only) + ecosystem sections; links go to `/components`, `/blocks`, `/pages`.

## 3. PreviewCode = iframe + Tabs

- [x] 3.1 Rewrite `packages/ui/src/components/docs/preview-code.tsx`: `ui/tabs` (Preview + Code) replacing the `ToggleGroup`; props `kind`, `slug`, `exampleName`.
- [x] 3.2 Preview tab renders `<iframe src="/preview/<kind>/<slug>">` sized by the device switcher (mobile 375 / tablet 768 / desktop full) - real viewport, media queries respond.
- [x] 3.3 Code tab fetches `/r/<exampleName>.json` and renders `files[0].content` via `CodeBlock`; real loading state.
- [x] 3.4 Fullscreen is `<a target="_blank" rel="noopener" href="/preview/<kind>/<slug>">`; removed the `Dialog`.
- [x] 3.5 Iframe frame: fixed `h-[480px]`, clean surface (no `border-dashed` inner box).

## 4. Top-nav, no sidebar (+ mobile)

- [x] 4.1 Delete `app-sidebar.tsx`, `docs-shell.tsx`; remove every `SidebarProvider`/`SidebarInset`/`SidebarTrigger` import.
- [x] 4.2 `SiteHeader`: wordmark + section links (ghost `buttonVariants`) + search trigger + icon `DarkModeToggle`.
- [x] 4.3 Mobile nav (review F3): section links visible at every breakpoint (no desktop-only nav).

## 5. Catalog excludes primitives (verify)

- [x] 5.1 No primitive (Button) in the catalog, list/detail pages, or home featured grid; Button remains only a `registry:ui` dependency in `registry.json`.

## 6. Package-manager brand icons

- [ ] 6.1 Resolve coverage: check `@zeroxsolutions/icons/brands` for pnpm/npm/yarn/bun; vendor any missing (existing brand-mark workflow). - **DEFERRED**: none of the four exist; vendoring from Simple Icons is the remaining task.
- [ ] 6.2 `Installation` `PackageManagerToggle` items render each runner's brand icon alongside its label. - **DEFERRED** (depends on 6.1).

## 7. registry-e2e rewrite

- [x] 7.1 Rewrote `home.spec`, `detail-page.spec` (was `doc-page.spec`), `radius-seam.spec`, `renames.spec` to the new routes + selectors (Tabs `aria-selected`; iframe; fullscreen `target="_blank"`; top-nav; no sidebar). Deleted `button-preview.spec` (Button has no doc page).
- [x] 7.2 Added `responsive.spec`: the device switcher resizes the iframe (mobile < 400, tablet > 700).
- [x] 7.3 `shadcn-build` runs before the e2e `webServer` (prepended to the command) so `public/r/*.json` is populated (review F4).

## 8. Validation

- [x] 8.1 `pnpm nx run-many -t lint build test` green.
- [x] 8.2 `pnpm nx build @zeroxsolutions/registry` static-export emits every catalog route under the new paths and none under `/preview/<slug>`.
- [x] 8.3 `pnpm nx e2e @zeroxsolutions/registry-e2e` green (23/23).
- [x] 8.4 Visual check: screenshots captured (home + detail light/dark) via the e2e screenshot spec; structural assertions green.
