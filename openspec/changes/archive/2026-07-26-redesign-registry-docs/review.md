## Readiness Decision

ready with conditions

The proposal, `docs-site` spec delta, and design are coherent and cover all seven
fixes plus the minor details. Implementation can proceed. Conditions are
task-time resolutions (open questions), not blockers - see Blocked By.

## Execution Mode

tdd-preferred

Routes + preview are UI/IA; their test surface is the `registry-e2e` real-browser
suite + the build/static-export gate (`green-before-commit`). Adjust e2e
alongside each structural step rather than after.

## Verification Mode

retained-recommended

The existing `registry-e2e` suite is retained and rewritten to the new IA
(routes + Tabs + iframe selectors). The build gate (`nx run-many -t lint build
test`) plus a visual check remain the green bar.

## Review Request

Pre-implementation self-review of proposal + specs + design (this artifact). No
external review requested.

## Review Status

not-requested

## Delegation Mode

subagent-eligible

Critical-path work (route tree, iframe wiring, PreviewCode Tabs) stays with the
main agent; mechanical tasks (catalog data, brand-icon wiring, e2e selector
updates) are subagent-eligible with verification after.

## Parallelization Mode

serial-only

The route restructure, catalog, and iframe/Tabs each depend on the previous
step's shape; the change is sequential.

## Worktree Mode

same-tree

This repo works on `master` directly (no worktree per task).

## Branch Finish Mode

standard

## Blocked By

None. The open questions (iframe auto-height; brand-icon coverage) resolve at
task time and do not block starting.

## Validation Focus

- The iframe genuinely triggers responsive behavior - assert with an example
  whose component changes layout below a breakpoint (a real media query), at the
  mobile/tablet widths.
- `generateStaticParams` enumerates every catalog entry; the static export
  produces a page for each new route and NONE under the old `/preview/<slug>`.
- Preview/Code is `Tabs` (`aria-selected`); fullscreen is a `target="_blank"`
  link to `/preview/<kind>/<slug>` (no Dialog).
- No shadcn primitive (Button) in catalog, sidebar (gone), or home.
- Package-manager toggle shows a brand icon per runner.
- `nx run-many -t lint build test` green; `nx e2e` green on the new IA.

## Key Risks

- **iframe height**: a fixed `min-height` frame means tall examples scroll inside
  (auto-size via ResizeObserver/postMessage is deferred). May clip on first pass.
- **iframe load latency**: each preview is a separate document navigation;
  perceptible on first load (mitigated by static caching).
- **Silent missing pages**: a catalog entry not enumerated by
  `generateStaticParams` yields no page. The gate must assert the static build
  covers every catalog entry.
- **shadcn-build ordering**: the Code view fetches `/r/<example>.json`, populated
  by `shadcn-build`. The e2e `webServer` (`next dev`) serves `public/r`, so
  `shadcn-build` must run before e2e (the registry build already depends on it;
  ensure the e2e path does too).
- **E2E rewrite size**: every route + most selectors change - the suite rewrite
  is the largest single task.

## Findings Summary

- **F1 - iframe auto-height deferred.** Tall examples scroll inside a fixed
  frame. Disposition: accept for v1; follow-up auto-sizes the iframe to content.
- **F2 - brand-icon coverage unverified.** pnpm/npm/yarn/bun may not all exist in
  `@zeroxsolutions/icons/brands`. Disposition: resolve at task time; vendor any
  missing (existing brand-mark workflow).
- **F3 - mobile nav after sidebar removal.** Removing the sidebar removes the
  mobile Sheet nav; the header's section links must stay reachable on mobile
  (visible or behind a menu). Disposition: task must cover a mobile nav
  affordance, not just desktop links.
- **F4 - Code-view fetch needs shadcn-build first.** `/r/<example>.json` exists
  only after `shadcn-build`. Disposition: ensure shadcn-build runs before e2e
  (gate ordering), documented in tasks.
- **F5 - stateful examples already client-marked.** Stateful examples
  (`menu-button-hero`, `split-button-hero`, `tree-hero`) already carry
  `'use client'`; the standalone route renders them fine. Disposition: no action.

## Manual Adjustments

None. Tasks/plan should account for F3 (mobile nav) and F4 (shadcn-build before
e2e).
