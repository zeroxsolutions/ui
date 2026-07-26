# Verification - build-registry-foundation

## Automated gate (green)

- `nx run-many -t lint build test` -> 6 projects green.
- `nx e2e @zeroxsolutions/registry-e2e` -> **51/51 pass** (real Chromium). Covers every
  doc page's sections (Preview, Code/Usage with the `shadcn add` command + import snippet,
  Props table, Composition tree, dark-mode toggle) for: button, split-button, menu-button,
  chat-message, tree, field-group, ai-provider-picker (block), demo-page (page).

## Registry ecosystem

- `packages/ui/registry.json` documents **10 items**, every one with a `type` and a
  `category` (none missing). All five shadcn ecosystem types are present: `registry:ui`,
  `registry:lib`, `registry:component`, `registry:block`, `registry:page`.
- `shadcn registry validate` runs in the `@zeroxsolutions/ui` `shadcn-build` nx target
  (after `shadcn build`) and passes ("Checked 1 registry file and 10 items"). Verified it
  catches errors (file-path / structure).
- A `registry:block` (`ai-provider-picker`, composing `AiProviderCard` + `AiProviderIcon`)
  and a `registry:page` (`demo-page`, composing the block + `ChatMessage`) ship, each with
  a full doc page and declared `registryDependencies`.

## Doc-page surface

- Reusable doc components in `apps/registry/src/components/docs/` (`DocPage`, `DocTabs`,
  `PropsTable`, `CompositionTree`, `UsageCode`, `DarkModeToggle`), each composing
  `@zeroxsolutions/ui` primitives (no re-skinning).
- `UsageCode` derives the `shadcn add` command + import snippet from the item name +
  deployed URL. Props/Composition are hand-authored from each component's source.
- Dark-mode is a simple `dark` class toggle on `<html>` (no `next-themes`); the toggle
  carries text labels (no icon dep yet - a follow-up if the registry adopts `lucide-react`).

## npm channel

- `packages/ui/package.json` `exports`/`files`/`main`/`module` are **byte-unchanged** vs
  the pre-change baseline (verified by diff). New composed components (`blocks/`, `pages/`)
  surface through the existing `./*` map - additive, non-breaking. `registry.json` stays
  outside `files`.

## Notes / follow-ups

- The block/page source lives in `packages/ui/src/components/{blocks,pages}/` (not
  `apps/registry`) because the shadcn validator rejects parent-directory traversal in item
  `files` paths; the doc pages import them via the `@/.../blocks` / `.../pages` subpaths.
- Catalog `category` grouping is sourced from `registry.json` (the hand-seeded const from
  cluster 1 was replaced by registry-derived data in cluster 4).
- No deferred verification items - every documented surface is covered by the real-browser
  e2e.
