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

- [x] 4.1 Author `packages/ui/registry.json` (root `name`/`homepage` + `items`) with a primitive sample (`button`) and a composed sample (`model-info-card`) declaring its `registryDependencies`. Added a third `utils` (`registry:lib`) item shipping the `cn` helper that both components import via `@/lib/utils`; button + model-info-card each declare `registryDependencies: ["utils"]` (the honest same-source dependency - model-info-card does not import button, so a fabricated button dep was avoided).
- [x] 4.2 Added the `shadcn-build` nx target on `@zeroxsolutions/ui` (`nx:run-commands`, `cwd={projectRoot}`, `shadcn build -o ../../apps/registry/public/r`, outputs `apps/registry/public/r`); generated dir gitignored.
- [x] 4.3 All three emitted items (`button`/`model-info-card`/`utils`.json) validate against the official shadcn registry-item schema (draft-07, via ajv@8); each embeds its `@/`-aliased source as `content`.

## 5. Interaction/visual coverage via `registry-e2e`

- [x] 5.1 Added `button-preview.spec.ts` (isolation + all 5 variants, role/name/enabled a11y, keyboard focus + Tab order + click, and a real bounding-box row-layout assertion jsdom can't make) and a `home.spec.ts` root smoke; removed the placeholder `example.spec.ts`; trimmed the Playwright config to the one installed browser (chromium). `nx e2e @zeroxsolutions/registry-e2e` -> 5 passed.
- [x] 5.2 Confirmed jsdom-only: `@zeroxsolutions/ui` targets are `test` + `test-ci--*` (Vitest `environment: 'jsdom'`) with no `test-storybook`/`test-browser`; no `@vitest/browser*` is declared in any `package.json` or physically installed (root `@vitest` holds only `coverage-v8`+`ui`; the pnpm-lock hits are vitest-4 optional-peer annotations, not a dependency).

## 6. Deploy (static export -> Cloudflare Workers Static Assets)

- [x] 6.1 Static-export `build` (inferred `next build` + `output: 'export'`) now `dependsOn` `@zeroxsolutions/ui:shadcn-build` and caches the `out/` dir. Deploy follows the workspace's established static-site convention (the prior `apps/storybook` config): a `deploy` target (`nx:run-commands`, `dependsOn: ["build"]`, `defaultConfiguration: development`, `development`/`production` configs wrapping `wrangler deploy --env <env>`) + `apps/registry/wrangler.jsonc` as an assets-only Worker (`assets.directory: ./out`, `not_found_handling: "404-page"`, `observability.enabled`, `env.development.workers_dev: true`, `env.production` with `workers_dev: false` + `routes: [{ pattern: "registry.zeroxsolutions.com", custom_domain: true }]`) - no `main`, no `nodejs_compat`, no bindings. Verified via `wrangler deploy --env production --dry-run` (read 63 assets from `./out`, "No bindings found", exits without upload); a live deploy is not run (needs Cloudflare creds; outward-facing).

## 7. Docs + rule follow-up

- [x] 7.1 Edited `refactor-design-system-conventions/proposal.md`: replaced the "re-organize Storybook" deliverable, both Storybook success-criteria, and the `@zeroxsolutions/storybook` impact line with the docs/registry authoring standard (author each cluster's preview page + `registry.json` item in the `registry` app).
- [x] 7.2 Resolved-by-analysis, NO shared-rule edit: `.agents/rules/e2e-pairs-each-app.md` is fully generic (`<app>` placeholders) and already covers the registry app via its default "every app pairs a `*-e2e` sibling" rule; the Storybook-host exemption is a valid GENERAL standard for other repos (Storybook is only gone in THIS repo). Per the `rules-shared-standard-not-repo-specific` guidance, a repo-specific edit to the synced rule was declined (confirmed with the user).
- [x] 7.3 Recorded the ESLint adoption (was `linter:none`) in `eslint.config.mjs` (repo-specific config header), not the shared rules - `green-before-commit` already names ESLint as the workspace linter standard; the tuned rules were already documented inline.

## 8. Validation

- [x] 8.1 `nx run-many -t lint build test` -> "Successfully ran targets lint, build, test for 6 projects" (ui 207 + editor 243 tests green, all builds/lints green).
- [x] 8.2 Served the built `out/` on 127.0.0.1:4599; `shadcn add http://.../r/button.json --cwd <scratch>` into a scratch project whose `components.json` maps the alias to `~/` -> created `button.tsx` + auto-pulled `lib/utils.ts` (its `utils` registryDependency resolved against the same registry); `@/lib/utils` rewritten to `~/lib/utils`, zero `@/` left, `tsc --noEmit` exit 0.
- [x] 8.3 npm channel byte-unchanged: `exports`/`files`/`dependencies`/`peerDependencies` identical to HEAD (only additive `nx` target metadata added); `registry.json` sits at root with `files: ["dist", ...]` so it is NOT in the published tarball; `@zeroxsolutions/ui/components/ui/button` resolves to real `dist/*.js`+`*.d.ts`.
- [x] 8.4 `nx build @zeroxsolutions/registry` static-exports to `out/` (all routes prerendered); `out/r/{button,model-info-card,utils}.json` served and schema-valid; the isolated live preview renders + is interactable (proven by `registry-e2e`).
- [x] 8.5 `nx e2e @zeroxsolutions/registry-e2e` -> 5 passed (chromium).
- [x] 8.6 Rule-audited the working-tree diff: COMPLIANT with `gen-via-generator` (no hand-created/moved projects; nx targets added via `package.json#nx` per `deploy-via-nx-per-env`), `e2e-pairs-each-app` (registry-e2e sibling, specs in the sibling, added in-change), `fe-deploy-by-render-mode` (static export, no `nodejs_compat`/bindings; repo deploys via Workers Static Assets, not Pages - a deliberate choice, Cloudflare's newer static-site path), `worker-wrangler-config` (assets-only Worker: `observability.enabled`, `env.development`/`env.production` split, `workers_dev` in dev + a `custom_domain` route in prod), `deploy-via-nx-per-env` (one `deploy` target, env under `configurations`, `defaultConfiguration: development`, `wrangler deploy --env <env>`), `lib-public-exports-and-semver` (`exports`/`files` byte-unchanged, registry additive + unpublished), `run-through-nx`, `naming-files-and-symbols` (`name: "registry"` = unscoped kebab), and `plain-ascii-typography` (all authored text pure ASCII).
