## Scope

Phase-1 foundation for the design system's distribution and tooling: remove the
Storybook host, stand up a Next.js **`registry`** app (shadcn registry + docs), add the
`shadcn add` channel beside the kept npm package, and home interaction/a11y/visual
coverage in the app's `registry-e2e` (`packages/ui` stays jsdom-only). Scaffolding runs
as one serialized block (it touches shared root config).

## Covers

`1.1`-`1.3`, `2.1`-`2.4`, `2b.1`-`2b.3`, `3.1`-`3.3`, `4.1`-`4.3`, `5.1`-`5.2`, `6.1`,
`7.1`-`7.3`, `8.1`-`8.6`; VF-shadcn-add, VF-package-unchanged, VF-nx-green,
VF-registry-static-and-json, VF-registry-e2e.

## Plan Type

full

## Execution Strategy

tdd-preferred

## Ordered Steps

1. **Pin the uncertainties** (1.1-1.3) - DONE: `shadcn build` invocation recorded
   (`--cwd packages/ui -o ../../apps/registry/public/r`); test strategy = jsdom-only lib
   + `registry-e2e` for browser coverage; registry app resolves `ui` from workspace source.
2. **Serialized scaffolding** (2.1-2.4) - DONE: remove Storybook -> generate the Next.js
   app (+ e2e) -> add Playwright. Vitest browser mode explored then reverted (jsdom-only).
3. **Detour** (2b.1-2b.3) - DONE: re-scaffold `packages/ui` (`@nx/react:library`, clean
   baseline); adopt ESLint workspace-wide (tuned ruleset); rename app `docs` -> `registry`.
4. **Registry app preview + one page** (3.1-3.3): static export + MDX; isolated
   live-preview wrapper (source-resolved); one component docs page rendering the preview.
5. **Registry plumbing + samples** (4.1-4.3): `packages/ui/registry.json` with `button` +
   `model-info-card` (declares `registryDependencies`); `nx` target runs `shadcn build`
   -> `apps/registry/public/r`; validate emitted items.
6. **Interaction/visual coverage** (5.1-5.2): `registry-e2e` specs drive the previews;
   confirm `packages/ui` stays jsdom-only (no browser project, no `test-storybook`).
7. **Deploy target** (6.1): registry static-export build target + a `deploy` target
   wrapping `wrangler deploy` (Workers Static Assets, the repo's static-site convention)
   under `configurations`, no `nodejs_compat`/bindings; domain via `routes[].custom_domain`.
8. **Follow-up edits** (7.1-7.3): de-stale `refactor-design-system-conventions/proposal.md`;
   update `.agents/rules/e2e-pairs-each-app.md`; document the ESLint adoption.
9. **Validation sweep** (8.1-8.6).

## Validation Per Step

1-3. (Done) ui/editor/registry build + lint green; ui test 207 pass; no Storybook /
   `@storybook/*` / `test-storybook` / `@vitest/browser*` remain; `nx show projects`
   lists `@zeroxsolutions/registry` + `@zeroxsolutions/registry-e2e`.
4. `nx build @zeroxsolutions/registry` emits a static dir; the component page renders the
   live preview in a browser.
5. Each `/r/<name>.json` validates against the shadcn registry-item schema;
   `model-info-card` carries its `registryDependencies`.
6. `nx e2e @zeroxsolutions/registry-e2e` runs and asserts a component's interaction/layout
   against its preview; `nx test @zeroxsolutions/ui` stays jsdom-only.
7. The `deploy` target dry-runs (`wrangler deploy --env production --dry-run`) with no
   server binding.
8. The refactor proposal no longer mentions re-organizing Storybook; the e2e-pairs rule
   reflects the new Next.js app.
9. Full sweep: 8.1-8.6 all pass.

## Files / Owners

- `apps/storybook/**` - removed (generator)
- `apps/registry/**`, `apps/registry-e2e/**` - new (generator, renamed from `docs`)
- `packages/ui/**` - re-scaffolded (`@nx/react:library`), src + custom `vite.config.mts`
  + `components.json` restored; `registry.json` to add
- `eslint.config.mjs` (root) - ESLint adopted + tuned ruleset
- `apps/registry/next.config.*` + `wrangler.jsonc` + its `package.json` nx targets
  (build/deploy/shadcn-build)
- `openspec/changes/refactor-design-system-conventions/proposal.md` - de-stale edit
- `.agents/rules/e2e-pairs-each-app.md` - rule text update
- `vitest.config.ts` (root) - unchanged (aggregates the jsdom project)

## Completion Checkpoint

All `tasks.md` boxes checked; `nx run-many -t lint build test` green across the
workspace; `shadcn add` of a sample into a scratch project compiles with rewritten
aliases; the npm package channel is byte-for-byte unchanged (no `exports` diff); the
registry app static-builds and serves a schema-valid `/r/<name>.json` plus an isolated
live preview; `nx e2e @zeroxsolutions/registry-e2e` runs; the refactor proposal and
e2e-pairs rule are updated; the staged diff is rule-audited.

## Completion Verification

Verification Mode is retained-recommended: record a `verification.md` capturing the
real-browser evidence - the `shadcn add`-into-scratch run (aliases rewritten, compiles),
the `registry-e2e` run, and the registry static build + a `/r/<name>.json` fetch. These
prove the copy channel, the interaction coverage, and the registry host end to end, not
by inference.

## Execution Notes

- Detour (folded into tasks 2b): `packages/ui` re-scaffolded to a clean baseline; ESLint
  adopted workspace-wide (repo was `linter:none`); app renamed `docs` -> `registry`.
  Vitest browser mode was explored then reverted in favor of `registry-e2e`.
- Steps 5-9 (tasks 4-8) completed this session: authored `registry.json` (utils/button/
  model-info-card, both composed items declaring `registryDependencies: ["utils"]` - the
  honest same-source dep, since model-info-card does not import button); added the
  `shadcn-build` nx target on `@zeroxsolutions/ui`; wrote `registry-e2e` specs
  (interaction/a11y/geometry, chromium-only) + a home rewrite (dropping the stale
  `@zeroxsolutions/docs` template); added `wrangler.jsonc` + a `deploy` target (Workers
  Static Assets via `wrangler deploy`, matching the prior `apps/storybook` convention);
  de-staled the refactor proposal; recorded the ESLint adoption in `eslint.config.mjs`.
- Task 7.2 deviation (user-confirmed): the shared `.agents/rules/e2e-pairs-each-app.md`
  was NOT edited - it is generic, already covers the registry app via its default rule,
  and its Storybook-host exemption stays valid for other repos (per the
  `rules-shared-standard-not-repo-specific` guidance). See `verification.md` for evidence.

## Manual Adjustments
