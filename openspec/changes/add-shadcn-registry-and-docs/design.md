## Context

`@zeroxsolutions/ui` is a Vite-built publishable library: `vite.config.mts` emits a
per-file `dist/` (mirroring `src/`, `@/` resolved to relative) behind a `./*` subpath
`exports` map, and the same file declares a Vitest `jsdom` project. The root
`vitest.config.ts` aggregates every project via a `projects` glob. The package carries
`components.json` (`base-vega`) and authors every source file with the `@/` alias
(`tsconfig` `paths: { "@/*": ["./src/*"] }`) - exactly the alias the shadcn CLI rewrites
on install. The former docs/dev/test tool was a Storybook host that resolved `ui` from
`node_modules` dist (the stale-cache pain) and provided interaction testing via
`test-storybook`. `next` (`~16.1.6`) and `@nx/next` (`23.0.1`) are installed.

## Goals / Non-Goals

**Goals:**

- A second, additive distribution channel (`shadcn add`) from the one existing source,
  with the npm package unchanged.
- A Next.js **`registry`** app that documents + live-previews components (the Storybook
  replacement) and hosts the registry statically.
- Interaction/a11y/visual coverage rehomed to the app's `registry-e2e` (Playwright);
  `packages/ui` stays jsdom-only.
- A phase-1 foundation the later conventions refactor builds on.

**Non-Goals:**

- Full registry catalog, any component refactor/rename, any `nx release`, the model
  picker. (See proposal Non-Goals.)

## Decisions

1. **Alias direction - nothing to find-replace.** The source already uses `@/`, the
   shadcn registry convention. The package build resolves `@/` to relative for `dist/`;
   the registry ships the `@/` source as-is and the CLI rewrites `@/` to the consumer's
   `components.json` aliases on `shadcn add`. Unlike OpenStatus (who import `@scope/ui`
   internally and replace it with `@` at build), this repo needs **no** import rewrite
   for the registry direction.

2. **Registry ownership + host.** `registry.json` is owned by `packages/ui` (it lists
   the package's own source files as items). An `nx` target runs `shadcn build` from
   `packages/ui` emitting into the registry app's public dir
   (`shadcn build -o ../../apps/registry/public/r`), so the one deployment serves both
   docs and registry. (Resolved against `shadcn@4.11.0`: `build [registry] -o <out>
   --cwd <dir>`, paths relative to `--cwd`.)

3. **Preview imports from workspace source, not built dist.** To kill the stale-dist
   cache pain that motivated the move, the registry app resolves components from the
   workspace **source** (fast HMR, no dist rebuild between edits). Fidelity to the
   shipped artifact is covered separately by a build + `shadcn add` smoke check, not by
   making every preview pay the dist round-trip.

4. **App stack = Next.js App Router + MDX, minimal.** Plain `@nx/next` app with MDX
   pages and a small live-preview wrapper; no heavyweight docs framework at this stage.
   The shadcn registry-template is a reference, not a dependency.

5. **Test split = jsdom-only library + app e2e (NOT Vitest browser mode).** `packages/ui`
   keeps its single jsdom Vitest project (the workspace standard). Real-browser
   interaction/a11y/visual coverage lives in the app's `registry-e2e` (Playwright),
   driving the isolated previews - the nx split (library = unit-tested, app =
   e2e-tested). Vitest browser mode was explored and rejected: it needs custom, non
   plugin-native wiring (`@nx/vitest` rejects nested `test.projects`; the browser
   provider is the `@vitest/browser-playwright` factory), and the repo already gets a
   real-browser seam for free via the app e2e.

6. **Playwright installed once** (`@nx/playwright` + `@playwright/test`) - it backs the
   `registry-e2e` runner.

7. **Deploy = static export -> Cloudflare Pages.** The registry app sets Next.js
   `output: 'export'`; registry JSON lives under `public/r` so it ships as static
   assets. Deploy through an `nx` target wrapping `wrangler pages deploy`
   (`fe-deploy-by-render-mode`), no `nodejs_compat`, no bindings.

8. **All create/remove via generators, serialized.** `@nx/workspace:remove` the
   Storybook app; `@nx/next:application` the app (+ its e2e); `@nx/workspace:move` to
   rename it to `registry`. These touch shared root config (`nx.json`, lockfile), so
   they run in **one serialized scaffolding session** (`worktree-per-task`), `--dry-run`
   first.

9. **`packages/ui` re-scaffolded to a clean baseline.** Re-generated via
   `@nx/react:library` (`--publishable --bundler=vite`), then the real src + custom lib
   `vite.config.mts` + `package.json` + `components.json` (`base-vega`) restored from git
   HEAD, dropping all vitest-browser cruft. Net: `ui` back to a pristine, standard
   publishable library.

10. **ESLint adopted workspace-wide.** The repo was `linter:none`; the generators pulled
    ESLint in and the team chose to keep it. Root `eslint.config.mjs` tuned: off
    `no-empty-function` + `no-non-null-assertion` (idiomatic no-ops / deliberate `!`),
    `no-unused-vars` ignores `^_`. Lint green on ui/editor/registry.

11. **Rule text update.** `e2e-pairs-each-app` named the Storybook host +
    `test-storybook` as its e2e exemption; with Storybook gone and a real Next.js app +
    `registry-e2e`, that rule's example/exemption is updated to match.

## Risks / Trade-offs

- **Preview-from-source vs from-dist.** Source import gives DX and kills the stale
  cache, but a preview is then not a byte-for-byte check of the shipped package; offset
  with a build + `shadcn add`-into-scratch smoke check in CI.
- **`shadcn build` in a monorepo.** Resolved: run with `--cwd packages/ui`, output to
  `../../apps/registry/public/r`.
- **Next.js static export limits.** No server features (acceptable - docs + static
  registry need none); if ever needed it moves to Workers per `fe-deploy-by-render-mode`.
- **Losing Storybook addons** (controls/a11y/docs panels). Replaced by MDX docs + the
  live preview + `registry-e2e` a11y assertions; the controls panel has no 1:1
  replacement (accept - it was under-used; stories used no args).
- **Registry churn** if items are built before names settle -> mitigated by shipping
  **plumbing + 1-2 samples only**, populating the rest during the refactor.
- **Playwright in CI** (browser download, flake) - standard; pin and cache the browser.

## State Model

Two independent axes, not a runtime state machine:

- **Distribution channels:** `npm package` (import) and `shadcn registry` (copy) - both
  derive from one source; neither owns runtime state.
- **Test surfaces:** the library's `jsdom` Vitest (units) and the app's `registry-e2e`
  Playwright (real-browser interaction/a11y/visual) - a check belongs to exactly one,
  chosen by whether it needs a real browser.

## Migration Plan

1. **Serialized scaffolding** (done): remove Storybook -> generate the Next.js app (+
   e2e) -> add Playwright -> re-scaffold `packages/ui` -> rename app to `registry`.
2. **Wire the app** (remaining): MDX + live-preview wrapper (source import); `shadcn
   build` plumbing emitting `apps/registry/public/r`; author `registry.json` + **1-2
   sample items**.
3. **Interaction/visual coverage** (remaining): `registry-e2e` specs drive the previews;
   `packages/ui` stays jsdom-only.
4. **Verify**: `nx run-many -t lint build test` green; `shadcn add` a sample into a
   scratch project; registry static build + a `/r/<name>.json` fetch.
5. **De-stale**: edit `refactor-design-system-conventions/proposal.md` (drop the
   "re-organize Storybook" deliverable, point at the docs/registry authoring standard).

**Fallback:** the npm package channel is untouched throughout, so no consumer is
affected while the registry/preview/test foundation is built.

## Open Questions

- Which 1-2 components seed the sample registry items (recommend: one primitive, e.g.
  `button`, plus one composed, e.g. `model-info-card`, to exercise
  `registryDependencies`).
- Registry app MDX authoring shape (per-component page structure) - firmed when the
  first page lands.
