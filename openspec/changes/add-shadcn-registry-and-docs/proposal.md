## Why

`@zeroxsolutions/ui` ships **one** way today - an npm package (`pnpm add`,
`import`). shadcn's own model is the opposite (`shadcn add` copies the source, you
own it), and many consumers expect that channel. The library is already 80% ready for
it: `packages/ui/components.json` exists and every source file already imports via the
`@/` alias (`@/lib/utils`, `@/components/ui/input`) - which **is** the registry
convention the shadcn CLI rewrites on install. OpenStatus runs exactly this
dual-distribution setup in production (one source, `pnpm` import + `shadcn add`).

The current docs/dev tool is **Storybook**, and it is the wrong fit for this:
- shadcn does not use Storybook; its docs are a Next.js/MDX site, which is also the
  natural **host** for a `shadcn build` registry (static `public/r/*.json`).
- Storybook resolves `ui` from the built `node_modules` dist, so a real fix repeatedly
  looks unfixed until the dist is rebuilt and the Vite cache cleared (recurring pain).
- Storybook is a docs/dev tool, not a distribution channel - it cannot serve the
  registry.

So: replace Storybook with a Next.js **`registry`** app (named for its essence - it hosts
the shadcn registry and the docs), add the `shadcn add` channel alongside the kept npm
package (**dual distribution**), and rehome the interaction/a11y/visual testing that
`test-storybook` did to the app's **`registry-e2e`** (Playwright) - `packages/ui` stays
jsdom-only (the nx split: library = unit-tested, app = e2e-tested), which also retires
the manual "drive storybook-static with Playwright" pipeline. This is **phase 1**: it
stands up the new registry/preview/test foundation **before** the component-conventions
refactor, so that refactor has a live sandbox and populates registry items against final
names.

## What Changes

- **Remove** the Storybook app (`@zeroxsolutions/storybook`) via
  `@nx/workspace:remove` - not a hand `rm`.
- **Generate** a Next.js app named **`registry`** via `@nx/next:application`, with its
  paired `registry-e2e` sibling. It hosts: MDX docs, a **live component preview** (the
  new isolated sandbox that replaces Storybook), and the **shadcn registry** served from
  `public/r/*.json` via `shadcn build`.
- **Dual distribution**: keep the npm package unchanged (`pnpm add` / `import`) **and**
  add the `shadcn add <url>` channel from the same single source. Author a
  `registry.json` over `packages/ui` source; `shadcn build` emits the static registry;
  the CLI rewrites `@/` to the consumer's `components.json` aliases on install.
- **Rehome testing**: interaction/a11y/visual coverage moves to the app's
  **`registry-e2e`** (Playwright, driving the isolated previews), replacing the
  `test-storybook` target and the manual browser-verify pipeline; `packages/ui` stays
  jsdom-only.
- **Add Playwright** once - it backs the `registry-e2e` runner.
- **Registry plumbing only, not the full catalog** - wire `shadcn build` + 1-2 sample
  items; per-component registry items are populated later as each component's naming
  settles in the conventions refactor (avoids churn).
- **Detour (folded in)**: `packages/ui` was re-scaffolded via `@nx/react:library` (clean
  publishable baseline, vitest-browser cruft dropped, custom lib build + `base-vega`
  preset restored), and **ESLint was adopted workspace-wide** (the repo was
  `linter:none`) with a tuned ruleset - see tasks.md section 2b.

## Success Criteria

- `@nx/workspace:remove @zeroxsolutions/storybook` done; no `apps/storybook`, no
  `.storybook/`, no `@storybook/*` deps or `test-storybook` target remain.
- `apps/registry` (Next.js) builds via an `nx` target; it renders at least one component
  in an isolated live preview, and serves a valid registry item at `/r/<name>.json`.
- `npx shadcn add <registry-url>/r/<name>.json` into a scratch project installs the
  component with `@/` aliases correctly rewritten; the npm package channel
  (`pnpm add @zeroxsolutions/ui` + subpath import) still works unchanged.
- Interaction/a11y/visual coverage runs via `registry-e2e` (Playwright) against the
  previews; `packages/ui` stays jsdom-only with no `@vitest/browser*` dep.
- `nx e2e @zeroxsolutions/registry-e2e` runs (Playwright).
- `nx run-many -t lint build test` green across the workspace; `apps/registry` deploys
  as a static export to Cloudflare Pages per `fe-deploy-by-render-mode`.
- The `refactor-design-system-conventions` proposal is de-stale-d (its
  "re-organize Storybook" deliverable replaced by the docs/registry authoring
  standard).

## Non-Goals

- **Not** populating the full registry catalog (~53 items) - only plumbing + 1-2
  samples; the rest land during the conventions refactor against final names.
- **Not** refactoring/regrouping/renaming any component - that is the separate
  `refactor-design-system-conventions` change (this only stands up the tooling).
- **Not** publishing/releasing any package - `nx release` stays deferred workspace-wide
  (every package is still `0.0.1`, no tags).
- **Not** the AI model picker (`add-model-picker`).
- **Not** dropping the npm package or the `lib-public-exports-and-semver` release model
  - the registry is an **additive** second channel, package stays the source of truth.

## Capabilities

### New Capabilities

- `component-registry`: the shadcn-compatible registry that distributes
  `@zeroxsolutions/ui` source as a **second** channel beside the npm package - a
  `registry.json` over the `@/`-aliased source, `shadcn build` emitting static
  `public/r/*.json`, per-item `registryDependencies`, and the CLI's `@/` -> consumer
  alias rewrite - so one source serves both `pnpm add` and `shadcn add`.
- `docs-site`: the Next.js **`registry`** app that replaces the Storybook host - MDX
  docs plus an isolated **live component preview** (the design/dev sandbox), hosting the
  registry at `/r/*.json`, deployed as a static export to Cloudflare Pages, paired with
  a `registry-e2e` project.
- `component-testing`: the library test split - `packages/ui` stays jsdom-only (units),
  and real-browser interaction/a11y/visual coverage (the removed `test-storybook` role)
  lives in the app's `registry-e2e` (Playwright), per the nx library-vs-app split.

### Modified Capabilities

None. (No existing `openspec/specs/*` capability changes its requirements; the
Storybook removal touches the `e2e-pairs-each-app` **rule** text, tracked in Impact,
not an OpenSpec capability.)

## Impact

- **Apps**: remove `apps/storybook` (`@zeroxsolutions/storybook`); add `apps/registry`
  (`@zeroxsolutions/registry`) + `apps/registry-e2e` (`@zeroxsolutions/registry-e2e`).
- **`packages/ui`**: re-scaffolded to a clean publishable baseline (`@nx/react:library`)
  with its custom lib build + `base-vega` restored; add `registry.json` + `shadcn build`
  wiring (no `exports` change); stays jsdom-only. Source and the npm package are
  unchanged for the `import` channel.
- **Dependencies** (scaffolding - serialize per `worktree-per-task`): add
  `@nx/playwright` + `@playwright/test` and the `shadcn` CLI (devDep); `next` (`~16.1.6`)
  and `@nx/next` (`23.0.1`) already installed; remove `@storybook/*` + `@nx/storybook`.
  ESLint was also adopted (repo was `linter:none`) with a tuned ruleset.
- **Rules touched**: `e2e-pairs-each-app` (the Storybook-host exemption's subject is
  gone; the new Next.js app carries a real `*-e2e` - update the rule text);
  `fe-deploy-by-render-mode` (the registry app is a static export -> Pages);
  `lib-public-exports-and-semver` (unchanged - package kept, registry additive);
  `gen-via-generator` / `run-through-nx` (all create/remove via generators, all tasks
  via `nx`).
- **Follow-up edit**: `refactor-design-system-conventions/proposal.md` - drop the stale
  "re-organize Storybook" deliverable + impact line, point at the docs/registry
  authoring standard instead.
- **Sequence**: this change is **phase 1**; `refactor-design-system-conventions` (phase
  2) depends on it (needs the preview sandbox + populates registry items against final
  names). `add-model-picker` is independent.
