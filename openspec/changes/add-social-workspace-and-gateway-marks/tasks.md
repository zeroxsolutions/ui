## 1. Finalize roster, mark-type matrix & pipeline

- [x] 1.1 Lock the 48-mark roster (clusters below) into a scratchpad manifest. For each mark record: **type** (M = monochrome single-path → base/`.Color`/`.Mono`/`.Avatar`; C = full-color/gradient → base/`.Color`), source (Simple Icons CC0 / gilbarbara / svgl / lobehub / vendor), `colorPrimary` hex, and the PascalCase `<Name>Mark` symbol. Resolve the Instagram flat-vs-gradient call (default: flat, Type M) and the `cartesia`/`parallel`/`xai` source line.
- [x] 1.2 Reuse the **existing** helpers — `makeAvatar` and `useFillId`/`useFillIds` from `src/brands/internal/`. No new composition module. Confirm Type-C marks feed gradients through `useFillIds(namespace, n)` for per-instance id isolation.
- [x] 1.3 Stand up the **throwaway** vendoring pipeline (scratchpad; only `.tsx` committed): per mark, pull SVG from its source → svgo → apply the matching authoring template (Type M = `bitbucket` shape; Type C = full-color base + `.Color`, ids via `useFillIds`). Run through `nx`.
- [x] 1.4 Confirm licensing per source and record it per mark for attribution: Simple Icons (CC0), gilbarbara/logos, svgl, `@lobehub/icons` (MIT), vendor SVG.

## 2. Vendor social / consumer marks (18)

- [x] 2.1 Simple Icons (Type M): `facebook`, `messenger`, `instagram` (flat), `threads`, `x`, `youtube`, `tiktok`, `reddit`, `pinterest`, `snapchat`, `mastodon`, `bluesky`, `whatsapp`, `telegram`, `signal`, `wechat`, `line`.
- [x] 2.2 `linkedin` — gilbarbara/logos (`linkedin-icon.svg`, `#0A66C2`); single-fill → Type M. (Simple Icons removed it.)

## 3. Vendor workspace / collaboration marks (19)

- [x] 3.1 Simple Icons (Type M): `slack`, `discord`, `zoom`, `google-meet`, `notion`, `figma`, `trello`, `asana`, `jira`, `confluence`, `linear`, `miro`, `airtable`, `clickup`, `dropbox`, `loom`, `calendly`.
- [x] 3.2 `microsoft-teams` — gilbarbara/logos; full-color + gradient → Type C (base/`.Color`, `useFillIds`, no `.Mono`/`.Avatar`). Also `monday` → gilbarbara/logos (`monday-icon.svg`, Type C) — Simple Icons dropped it.

## 4. Vendor mail / office marks (6)

- [x] 4.1 Simple Icons (Type M): `gmail`, `google-drive`, `google-docs`, `google-calendar`.
- [x] 4.2 `outlook` — svgl (`microsoft-outlook.svg`, preserve the non-zero-origin viewBox) and `onedrive` — gilbarbara/logos; both full-color/gradient → Type C.

## 5. Vendor AI Gateway–gap marks (5)

- [x] 5.1 `parallel` — official brand SVG (`parallel.ai/icon.svg`, Type M, `#1D1C1A`). ⛔ `cartesia` — **BLOCKED**: no clean public SVG source (absent from Simple Icons, lobehub, gilbarbara, svgl; its site is a JS SPA). Deferred pending a brand asset — see Open Questions in design.md.
- [x] 5.2 `bedrock`, `vertexai`, `xai` — dedicated marks (per existing AI-mark source convention), distinct from the `aws` / `gcp` / `grok` umbrellas.

## 6. Tests

- [x] 6.1 Confirm the existing glob-driven `src/brands/brand-marks.spec.tsx` picks up all 48 new files with **no edit** needed (it globs `./*.tsx`, excludes `internal/` + specs).
- [x] 6.2 Verify the smoke test still passes: each mark renders a non-empty `<svg>` with a `viewBox`; `size` maps to width/height; no two marks share an internal SVG id across the full set (incl. the new Type-C gradient marks).
- [x] 6.3 If the smoke test carries a mark-count floor, bump it below the new delivered total (no brittle exact count).

## 7. Docs & catalog

- [x] 7.1 Update `packages/icons/README.md` — add the social/workspace/mail rows and the 5 AI-gateway marks to the `brands/` table with per-mark source; note gilbarbara/logos + svgl sources and that the set now covers the Cloudflare AI Gateway provider list; keep/extend the trademark disclaimer to cover LinkedIn/Meta/Microsoft families; bump the mark count.
- [x] 7.2 Update `apps/storybook/src/icons/brand-marks.stories.tsx` so the catalog renders the new marks via glob, showing each mark's available variants (Type M full surface vs Type C color-only).

## 8. Validation

- [x] 8.1 `nx lint @zeroxsolutions/icons`, `nx build @zeroxsolutions/icons`, `nx test @zeroxsolutions/icons` all green; `dist/brands/*` emits the 48 new marks with `.d.ts` mirrors.
- [x] 8.2 Smoke-import a few new subpaths + variants (`brands/slack` → `.Color`/`.Mono`/`.Avatar`; `brands/microsoft-teams` → `.Color`, and `.Mono` is a type error) to confirm the `./*` exports map resolves them and variant typing is correct.
- [x] 8.3 Visual spot-check each cluster + every Type-C mark (`microsoft-teams`, `outlook`, `onedrive`, and gradient `instagram` if chosen) in Storybook (real browser) against source artwork — catch wrong-type classification and gradient breakage the structural test can't.
- [x] 8.4 Confirm `packages/icons/package.json` gained no runtime dependency and the existing ~130 marks still render unchanged.
- [x] 8.5 Confirm `brands/` resolves a mark for all 24 native AI Gateway providers (dedicated or umbrella).
- [x] 8.6 Rule-audit the staged diff against `.agents/rules/*` (`lib-public-exports-and-semver`, `ui-primitive-fidelity`, `naming-files-and-symbols`, `run-through-nx`, `green-before-commit`).
