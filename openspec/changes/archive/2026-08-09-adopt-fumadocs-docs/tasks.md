## 1. Rename the app `registry` -> `docs`

- [x] 1.1 `nx g @nx/workspace:move` `apps/registry` -> `apps/docs` (`@zeroxsolutions/registry` -> `@zeroxsolutions/docs`); repeat for `apps/registry-e2e` -> `apps/docs-e2e`.
- [x] 1.2 Repoint the `@zeroxsolutions/ui:shadcn-build` output to `apps/docs/public/r`; update the `docs` app's build `outputs`.
- [x] 1.3 Update `apps/docs/wrangler.jsonc`: `routes[].custom_domain` -> `ui.zeroxsolutions.com` (dev/prod envs).
- [x] 1.4 Update `packages/ui/registry.json#homepage` to the `ui.zeroxsolutions.com` / new pages.dev URL.
- [x] 1.5 Update `CLAUDE.md`/`AGENTS.md` workspace inventory (`apps/registry` -> `apps/docs`) and the `.gitignore` apps path.
- [x] 1.6 Verify the rename: `nx build @zeroxsolutions/docs` resolves and no stale `registry` project name remains.

## 2. Install fumadocs + resolve open questions

- [x] 2.1 Resolve **Q1** (theme seam) and **Q4** (seed item) with the user.
- [x] 2.2 Add `fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui` to `apps/docs` (catalog-pinned); verify the version against Next 16 / React 19 (Q3).
- [x] 2.3 Wire the fumadocs Tailwind plugin into the app's Tailwind v4 (`@tailwindcss/postcss`) config.
- [x] 2.4 Pull the docs layout + UI components via `npx fumadocs` (do not hand-copy).

## 3. Sources, layouts, theme

- [x] 3.1 Create two `loader` sources in `apps/docs/src/lib/source.ts`: `docs` -> `/docs`, `registry` -> `/registry`.
- [x] 3.2 Add the shared root layout: top nav (wordmark, docs/registry switch, theme toggle, GitHub).
- [x] 3.3 Add the fumadocs docs layout for `/docs` and `/registry` per the Q1 decision; remap color tokens to the monochrome scale.
- [x] 3.4 Add `content/docs/_meta.json` and `content/registry/{components,blocks,pages}/_meta.json`.

## 4. Registry MDX components + template page + install guide

- [x] 4.1 Build `<Preview example="...">` - live `registry:example` inline for components, iframe `/preview/<kind>/<slug>` for blocks/pages.
- [x] 4.2 Port `<Install name="...">` (package-manager toggle + `shadcn add`) from the existing `Installation` component.
- [x] 4.3 Add `<Props of="...">` via fumadocs `auto-type-table`/`TypeTable` (verify the API per Q3).
- [x] 4.4 Wire `Preview`/`Install`/`Props` into the app's `mdx-components`.
- [x] 4.5 Seed one template page `content/registry/<kind>/<seed>.mdx` (the Q4 item).
- [x] 4.6 Add the general-docs **"Install the library"** guide: `pnpm add @zeroxsolutions/ui` + `import { ... } from '@zeroxsolutions/ui'`.

## 5. Remove the hand-rolled shell (keep preview)

- [x] 5.1 Delete `apps/docs/src/app/(main)/**` and `apps/docs/src/components/docs/**`.
- [x] 5.2 Keep `apps/docs/src/app/preview/[kind]/[slug]/**`; verify it still builds and serves.
- [x] 5.3 Update `app/layout.tsx` + routing so `/`, `/docs`, `/registry` compose correctly.

## 6. Docs-authoring rule + submodule bump

- [x] 6.1 Author the doc-authoring rule in the `zeroxsolutions/nx-cloudflare-in-house-rules` repo.
- [x] 6.2 Tag the rules repo and bump the `.agents/rules` submodule; commit the gitlink.

## 7. Rewrite docs-e2e

- [x] 7.1 Repoint `apps/docs-e2e/src/*.spec.ts` to the `/docs` + `/registry` IA and fumadocs DOM.
- [x] 7.2 Assert the seeded registry page renders Preview + Install + Props, that no primitive has a page, and that the install-library guide renders.
- [x] 7.3 Keep `@zeroxsolutions/ui:shadcn-build` before the e2e `webServer`.

## 8. Validation

- [x] 8.1 `pnpm nx run-many -t lint typecheck build test` green.
- [x] 8.2 `pnpm nx build @zeroxsolutions/docs` static-export emits the `/docs` + `/registry` routes with no server binding.
- [x] 8.3 `pnpm nx e2e @zeroxsolutions/docs-e2e` green.
- [x] 8.4 Confirm no `packages/ui` `components/ui` primitive has a per-component doc page; only the seeded registry item + the install guide exist.
