## Scope

The whole `redesign-registry-docs` change: the docs IA restructure (RESTful
routes + top-nav, no sidebar), the iframe-based responsive preview, Preview/Code
as Tabs, fullscreen-as-route, removing primitives from the catalog, package-manager
brand icons, and the `registry-e2e` rewrite. Covers all eight task groups.

## Covers

Task IDs: `1.1`-`1.4`, `2.1`-`2.5`, `3.1`-`3.5`, `4.1`-`4.3`, `5.1`, `6.1`-`6.2`,
`7.1`-`7.3`, `8.1`-`8.4`.

High-priority Validation Focus mapped in: **iframe-triggers-responsive** (step 5 +
8), **generateStaticParams-coverage** (steps 3-4 + 8), **Tabs-aria-selected** (5),
**fullscreen-new-tab** (5), **no-primitives-in-catalog** (2 + 8), **brand-icons**
(7), **shadcn-build-before-e2e** (8, review F4), **mobile-nav** (1, review F3).

## Plan Type

full

Cross-module (Next App Router route tree + `packages/ui` PreviewCode + e2e),
validation-intensive (iframe responsive behavior, static-export coverage), and
high-regret (deletes the current route tree). A full plan.

## Execution Strategy

tdd-preferred

Adjust `registry-e2e` alongside each structural step; the build/static-export gate
+ a real-browser visual check are the green bar (`green-before-commit`).

## Ordered Steps

1. Shell swap: minimal root layout + `(main)/layout.tsx` with `SiteHeader`; delete `DocsShell`/`AppSidebar`/sidebar shell. (1.1, 1.2, 4.1, 4.2)
2. Single typed catalog (Button removed) + helpers (`entriesByKind`, `findEntry`, flat list). (2.1, 5.1)
3. Section list pages (`/components`, `/blocks`, `/pages`) + detail pages (`/<section>/<slug>`) with `generateStaticParams`. (1.3, 2.2, 2.3)
4. Standalone `preview/[kind]/[slug]` route rendering only the Example, with `generateStaticParams`. (1.4)
5. PreviewCode rewrite: `ui/tabs` + iframe (src `/preview/<kind>/<slug>`, width=device) + device switcher + fullscreen `target="_blank"` link + Code fetch loading state. (3.1-3.5)
6. Delete flat `app/preview/<slug>/` tree; de-Button the home featured grid + links. (2.4, 2.5)
7. Package-manager brand icons (resolve coverage, vendor missing). (6.1, 6.2)
8. Mobile nav affordance in `SiteHeader` (review F3). (4.3)
9. Rewrite `registry-e2e` to new routes/selectors + add the responsive-behavior spec; wire `shadcn-build` before e2e (review F4). (7.1, 7.2, 7.3)
10. Gate: `lint build test` + static-export coverage + e2e + visual. (8.1-8.4)

## Validation Per Step

1. Build green; no `[data-slot="sidebar"]` in the DOM; `[data-slot="site-header"]` top-nav present.
2. `tsc` green; Button absent from the catalog; helpers exported.
3. Static export emits a page for every catalog entry under the new section routes; list pages render cards; detail pages render title + Installation + Usage.
4. Static export emits `/preview/<kind>/<slug>` for every entry; the route renders only the Example (no header).
5. Preview/Code is Tabs (`aria-selected`); iframe `src` resolves; device switch resizes the iframe width; fullscreen opens a new tab to the standalone route; Code tab fetches `/r/<exampleName>.json`.
6. No `/preview/<slug>` pages in the export; home featured grid has no Button.
7. Each runner item shows its brand icon; selecting a runner still updates the command.
8. Section links reachable at mobile width (no desktop-only nav).
9. `nx e2e` green; the responsive-behavior spec proves the iframe re-flows a media query at mobile width.
10. `nx run-many -t lint build test` green; export covers every catalog entry and no flat `/preview/<slug>`; e2e green; visual check passes (home + detail, light/dark, device switch, fullscreen new tab).

## Files / Owners

- `apps/registry/src/app/layout.tsx` - root (minimal)
- `apps/registry/src/app/(main)/layout.tsx` - top-nav shell
- `apps/registry/src/app/(main)/{page,components/*,blocks/*,pages/*}.tsx` - home + list + detail
- `apps/registry/src/app/preview/[kind]/[slug]/page.tsx` - standalone example route
- `apps/registry/src/components/docs/{doc-catalog,site-header}.ts` - catalog + header (delete app-sidebar.tsx, docs-shell.tsx)
- `packages/ui/src/components/docs/preview-code.tsx` - iframe + Tabs
- `packages/ui/src/components/docs/installation.tsx` - brand icons
- `apps/registry-e2e/src/*.spec.ts` - rewritten suite + responsive spec

## Completion Checkpoint

All tasks in `tasks.md` are `[x]`; `nx run-many -t lint build test` is green; the
registry static-export covers every catalog entry under the new routes and none
under `/preview/<slug>`; `nx e2e` is green (including the responsive-behavior
spec); a real-browser visual check confirms the home + a detail page (light/dark),
the device switch resizing the iframe, and fullscreen opening the standalone route
in a new tab.

## Completion Verification

The `registry-e2e` suite is the retained verification surface: it asserts the spec
scenarios (iframe responsive at device widths, Tabs `aria-selected`, fullscreen new
tab, RESTful routes, no primitive in catalog, brand icons). The static-export
coverage check (step 10) asserts `generateStaticParams` enumerated every entry.
Both must be green before the change is complete.

## Delegation Units

Subagent-eligible (mechanical, verify after): the catalog data (2.1), the
package-manager brand-icon wiring once coverage is resolved (6.1-6.2), and the
`registry-e2e` selector/route updates (7.1). Critical-path stays main-agent:
shell swap (1), route tree (3-4), PreviewCode iframe+Tabs (5), the responsive
spec (7.2).
