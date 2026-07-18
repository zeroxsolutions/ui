## 1. Pre-flight (resolve design Open Questions before wiring)

- [x] 1.1 Verified `shadcn@4.11.0`: `build [registry=./registry.json] -o <out=./public/r> --cwd <dir>`, file paths relative to `--cwd`. Target = from `packages/ui`: `shadcn build -o ../../apps/registry/public/r`.
- [x] 1.2 Test strategy RESOLVED (superseded browser-mode): `packages/ui` stays **jsdom-only** (workspace standard); real-browser interaction/a11y/visual moves to the app e2e (`registry-e2e`), per the nx split (lib = unit, app = e2e). No Vitest browser project.
- [x] 1.3 Approach confirmed: the registry app tsconfig maps `@zeroxsolutions/ui` -> `packages/ui/src` (workspace source, not dist); wired in 3.2.

## 2. Serialized scaffolding (one session, `--dry-run` each generator first)

- [x] 2.1 `@nx/workspace:remove @zeroxsolutions/storybook`; removed app + `@storybook/*` + `@nx/storybook` + `test-storybook` + nx.json storybook plugin/inputs -> 0 refs.
- [x] 2.2 `nx g @nx/next:application apps/docs --name=@zeroxsolutions/docs --appDir --src --style=css --linter=eslint --unitTestRunner=none --e2eTestRunner=playwright`. (App later renamed to `registry` - see 2b.3.) Scaffolded `apps/docs` + `apps/docs-e2e`. NOTE: `--linter=eslint` pulled eslint into a `linter:none` repo - resolved in 2b.2.
- [x] 2.3 `--e2eTestRunner=playwright` added `@nx/playwright` + `@playwright/test`; chromium browser present.
- [x] 2.4 Browser-mode Vitest was explored (dedicated `vitest.browser.config.mts` + `test-browser` target; found Vitest 4.1 provider = `@vitest/browser-playwright` `playwright()` factory, and `@nx/vitest` rejects nested `projects`) then **REVERTED** per the jsdom-only decision (1.2). No `@vitest/browser*` deps or `test-browser` target remain.

## 2b. Detour: re-scaffold, ESLint adoption, app rename (done)

- [x] 2b.1 Re-scaffolded `packages/ui` via `@nx/react:library ... --publishable --importPath=@zeroxsolutions/ui --bundler=vite --unitTestRunner=vitest --linter=eslint`; restored real src + custom lib `vite.config.mts` + `package.json` + `components.json` (preset `base-vega`) from git HEAD; dropped all vitest-browser cruft. `nx build/test @zeroxsolutions/ui` green (207 tests), editor build green.
- [x] 2b.2 Adopted ESLint workspace-wide (repo HEAD was `linter:none`; generators introduced it, user chose to keep). Tuned root `eslint.config.mjs`: off `no-empty-function` + `no-non-null-assertion`, `no-unused-vars` ignores `^_`; fixed genuine issues (dead `react-hooks` directive, unused `cn` import). Lint green on ui/editor/registry (5 non-blocking `any` warnings in editor).
- [x] 2b.3 Renamed the app `docs` -> `registry` via `@nx/workspace:move` (`@zeroxsolutions/registry` + `@zeroxsolutions/registry-e2e`); fixed carried-over `package.json` names, e2e webServer command (`registry:dev`), tsconfig `.next` paths; `nx sync`. Build+lint green.

## 3. Registry app: preview + docs

- [x] 3.1 Static export configured (`output: 'export'`; sample `api/hello` route removed - API routes are incompatible with export). Registry app builds to `apps/registry/out/` (index.html, all routes prerendered static). MDX DEFERRED to when prose docs are authored - previews use `.tsx`, which is enough for the sandbox + `registry-e2e` target.
- [x] 3.2 `ComponentPreview` wrapper (`data-slot="component-preview"`, isolated centered frame). Registry resolves `@zeroxsolutions/ui` via its **dist** (declared the workspace dep so Turbopack links it into `apps/registry/node_modules`; nx project-ref alone is TS-only; source-import deferred - the `@/` alias would collide). Tailwind v4 wired: `postcss.config.js` (`@tailwindcss/postcss`) + `global.css` imports ui `styles.css` + `source.css` -> 207KB CSS with ui theme tokens + component classes.
- [x] 3.3 `/preview/button` page renders all 5 Button variants inside `ComponentPreview`; static-exports to `out/preview/button.html` with the markup + generated styled CSS.

## 4. Registry (plumbing + 1-2 samples only)

- [ ] 4.1 Author `packages/ui/registry.json` (root `name`/`homepage` + `items`) with a primitive sample (`button`) and a composed sample (`model-info-card`) declaring its `registryDependencies`.
- [ ] 4.2 Add an `nx` target running `shadcn build` emitting `apps/registry/public/r/*.json` (invocation from 1.1).
- [ ] 4.3 Confirm each emitted `/r/<name>.json` validates against the shadcn registry-item schema.

## 5. Interaction/visual coverage via `registry-e2e`

- [ ] 5.1 Add `registry-e2e` (Playwright) specs that drive the registry app's component previews to cover the interaction/a11y/visual behavior the removed `test-storybook` used to check.
- [ ] 5.2 Confirm `packages/ui` stays jsdom-only (no browser project, no `test-storybook`); pure-logic + component specs remain in the jsdom `test` target.

## 6. Deploy (static export -> Cloudflare Pages)

- [ ] 6.1 Add the registry app `nx` build target (static export) and a `wrangler pages deploy` target with env under `configurations` (per `fe-deploy-by-render-mode` + `deploy-via-nx-per-env`), no `nodejs_compat`, no bindings.

## 7. Docs + rule follow-up

- [ ] 7.1 Edit `refactor-design-system-conventions/proposal.md`: remove the stale "re-organize Storybook" deliverable + its impact line; point at the docs/registry authoring standard instead.
- [ ] 7.2 Update `.agents/rules/e2e-pairs-each-app.md`: the Storybook-host exemption's subject is gone; the registry Next.js app carries a real `registry-e2e` sibling.
- [ ] 7.3 Reflect the ESLint adoption where the workspace linter standard is documented (repo was `linter:none`; now eslint with the tuned ruleset).

## 8. Validation

- [ ] 8.1 `nx run-many -t lint build test` green across the workspace.
- [ ] 8.2 `shadcn add <host>/r/button.json` into a scratch project: `@/` rewritten to that project's aliases, component compiles.
- [ ] 8.3 npm channel unchanged: `pnpm add @zeroxsolutions/ui` + a subpath import resolves exactly as before; no `exports` diff.
- [ ] 8.4 Registry app static build succeeds; fetching `/r/<name>.json` returns a schema-valid item; an isolated live preview renders a component.
- [ ] 8.5 `nx e2e @zeroxsolutions/registry-e2e` runs (Playwright).
- [ ] 8.6 Rule-audit the staged diff against `.agents/rules/*` (`green-before-commit`), noting `gen-via-generator`, `e2e-pairs-each-app`, `fe-deploy-by-render-mode`, `lib-public-exports-and-semver`.
