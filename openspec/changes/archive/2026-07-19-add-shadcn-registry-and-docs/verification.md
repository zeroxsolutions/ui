## Completion Decision

Implemented and verified. All 28 tasks in `tasks.md` are checked. The phase-1
registry/preview/test foundation is in place: `registry.json` + `shadcn build`
plumbing, an isolated live preview, `registry-e2e` real-browser coverage, a
static-export deploy target (Workers Static Assets), and the doc/rule follow-ups - with the npm
package channel byte-for-byte unchanged. Real-tool evidence (not inference)
captured below.

## Commands Run

- `nx run @zeroxsolutions/ui:shadcn-build` -> built `utils`/`button`/`model-info-card`
  into `apps/registry/public/r/*.json`.
- ajv@8 (draft-07) validation of `button.json`/`model-info-card.json`/`utils.json`
  against the official `registry-item.json` schema -> all VALID.
- `nx build @zeroxsolutions/ui` -> dist green (registry resolves it from dist).
- `nx e2e @zeroxsolutions/registry-e2e` -> **5 passed** (chromium): 4 button-preview
  specs (isolation + all 5 variants, role/name/enabled a11y, keyboard focus + Tab
  order + click, real bounding-box row layout) + 1 home smoke.
- `nx build @zeroxsolutions/registry` -> static export; `out/` has prerendered
  `index.html` + `preview/button.html` and `out/r/*.json` (re-validated schema-valid).
- `nx run-many -t lint build test` -> "Successfully ran targets lint, build, test
  for 6 projects" (ui 207 + editor 243 tests green).
- `shadcn add http://127.0.0.1:4599/r/button.json --cwd <scratch> --yes --overwrite`
  into a scratch project aliased to `~/` -> created `button.tsx` + auto-pulled
  `lib/utils.ts`; `tsc --noEmit` exit 0.

## Manual Checks

- **Registry-item schema**: each emitted `/r/<name>.json` carries `$schema` =
  registry-item, required `name`+`type`, and embeds its `@/`-aliased source as
  `content`; ajv confirmed valid.
- **Alias rewrite (`shadcn add`)**: in the scratch, `@/lib/utils` was rewritten to
  the consumer's `~/lib/utils`; `grep '@/'` over the installed files returned NONE.
- **Composed dependency**: `button`'s `registryDependencies: ["utils"]` resolved
  against the same served registry (bare name -> `.../r/utils.json`), so `shadcn add
  button.json` also installed `lib/utils.ts`.
- **npm channel unchanged**: `packages/ui/package.json` `exports`/`files`/
  `dependencies`/`peerDependencies` are identical to HEAD (only an additive `nx`
  target key); `registry.json` is at root and `files: ["dist", ...]` excludes it
  from the tarball; `@zeroxsolutions/ui/components/ui/button` resolves to real
  `dist/*.js`+`*.d.ts`.
- **Deploy config (Workers Static Assets, the repo's static-site convention)**:
  `apps/registry/wrangler.jsonc` is an assets-only Worker (`assets.directory: ./out`,
  `not_found_handling: "404-page"`), `observability.enabled`, no `main`, no
  `compatibility_flags` (no `nodejs_compat`), no data bindings; `env.development` =
  `workers_dev: true`, `env.production` = `workers_dev: false` +
  `routes: [{ pattern: "registry.zeroxsolutions.com", custom_domain: true }]`.
  `wrangler deploy --env production --dry-run` read 63 assets from `./out`, reported
  "No bindings found", and exited without upload (wrangler 4.112.0).
- **jsdom-only library**: `@zeroxsolutions/ui` targets are `test` + `test-ci--*`
  (Vitest `environment: 'jsdom'`); no `test-storybook`/`test-browser`; no
  `@vitest/browser*` declared in any `package.json` or physically installed.

## Evidence

- `registry-e2e`: 5/5 passed in a real chromium browser (interaction, a11y, real
  geometry, navigation) - the coverage the removed `test-storybook` provided.
- `shadcn add` smoke: the copy channel works end to end (aliases rewritten, deps
  pulled, `tsc` clean) into a project whose alias differs from this repo's.
- Static build: the same deployment serves the docs/preview HTML and the
  schema-valid registry JSON under `/r`.

## Residual Risks

- **Live deploy not exercised**: the `deploy` target is wired and validated by
  `wrangler deploy --dry-run`, but a real deploy needs Cloudflare credentials and
  is outward-facing, so it was not run. First real production deploy attaches the
  `registry.zeroxsolutions.com` custom domain (the DNS zone must exist in the
  account); `nx deploy @zeroxsolutions/registry -c production`.
- **Same-registry bare-name dep resolution** worked against a locally served
  registry; confirm it still resolves once deployed under the real host (the
  bare `utils` name resolves relative to the item's own registry URL).
- **Preview-from-dist, not source**: the registry imports `@zeroxsolutions/ui`
  from its built dist (the `@/` alias would collide with a source import), so a
  dist rebuild is needed to see a component-source edit in the preview. This is a
  narrower version of the old Storybook stale-cache pain; the `build + shadcn add`
  smoke covers shipped-artifact fidelity. (Source-import preview was deferred in
  task 3.2.)
- **Playwright chromium-only**: firefox/webkit are not installed; the config is
  trimmed to chromium (the one provisioned browser). Add the others once their
  binaries are cached in CI.
- **a11y depth**: the e2e asserts role/name/focus (the accessible tree) rather
  than a full axe scan; an `@axe-core/playwright` pass is a reasonable future add.
