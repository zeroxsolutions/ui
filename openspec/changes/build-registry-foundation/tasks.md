## 1. Doc-page foundation

- [x] 1.1 Build the reusable doc components in `apps/registry/src/components/docs/`: `DocPage` (the shell), `DocTabs` (Preview/Code/Props/Composition), `PropsTable`, `CompositionTree`, `UsageCode` (the `shadcn add` command + import snippet, derived from item name + deployed URL), `DarkModeToggle` - each composing `@zeroxsolutions/ui` primitives, no re-skinning.
- [x] 1.2 Retro-fit the existing `/preview/button` page to the new `DocPage` shape (Preview + Code/Usage + Props + Composition + dark-mode), as the reference instance.
- [x] 1.3 Add a catalog index/navigation page that lists items by `category` and `type`.
- [x] 1.4 Extend `registry-e2e` to assert the doc page renders every section (Preview, Code/Usage, Props, Composition, dark-mode toggle).

## 2. Typed, categorized registry items

- [x] 2.1 Add a `category` to the three existing items (`utils`, `button`, `model-info-card`) and confirm each already carries a `type`.
- [x] 2.2 Fix any pre-existing item that `shadcn registry validate` flags (missing fields, bad `type`, dangling `registryDependencies`) so the registry is clean before validate is wired.
- [x] 2.3 Grep-confirm every item has both a `type` and a `category`.

## 3. `shadcn registry validate` in the gate

- [x] 3.1 Add a `shadcn registry validate` step to the `@zeroxsolutions/ui` `shadcn-build` nx target (after `shadcn build`), so the static `build` target (which depends on `shadcn-build`) carries validate into the gate.
- [x] 3.2 Prove the gate fails on a deliberately malformed item, then remove the deliberate malformation.

## 4. Per-item doc pages

- [x] 4.1 Add a `registry:component`/`registry:ui` doc page per documented item as `redesign-composed-layer` stabilizes each cluster - each page composes `DocPage` with hand-authored Props + Composition and the derived `shadcn add` command + import snippet.
- [x] 4.2 Add the matching `registry.json` item (with `type` + `category` + `registryDependencies`) for each documented component if it is not already present.
- [x] 4.3 Per page: `registry-e2e` asserts all sections render; the page is reachable from the catalog index.

## 5. Block and page seed

- [x] 5.1 Author one `registry:block` (AI-provider picker grid composing `AiProviderCard` + `AiProviderIcon`) once the `redesign-composed-layer` cluster for those components lands; declare its `registryDependencies`; give it a doc page.
- [x] 5.2 Author one `registry:page` demo composing blocks/components; declare its `registryDependencies`; give it a doc page.
- [x] 5.3 `registry-e2e` covers the block/page doc pages and the install path.

## 6. Validation

- [ ] 6.1 Every documented item's page renders Preview + Code/Usage + Props + Composition + dark-mode (`registry-e2e`).
- [ ] 6.2 Every `registry.json` item has a `type` and a `category`; `shadcn registry validate` passes in the build gate.
- [ ] 6.3 At least one `registry:block` ships (composing existing items, declaring `registryDependencies`); a `registry:page` is wired.
- [ ] 6.4 `nx run-many -t lint build test` green across `ui`, `registry`, `registry-e2e`; `nx build @zeroxsolutions/registry` static-exports every doc page; `nx e2e @zeroxsolutions/registry-e2e` passes.
- [ ] 6.5 The npm channel is byte-unchanged: `packages/ui` `exports`/`files` identical to HEAD; `registry.json` stays outside `files`.
- [ ] 6.6 Rule-audit each milestone's staged diff against `.agents/rules/*` before commit; never bypass the husky gate.
