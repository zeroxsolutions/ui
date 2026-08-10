## 0. Scope revision (recorded after planning)

The shipped scope diverged from the original proposal, by user direction +
research, and is tracked here so the tasks match what landed:

- **`packages/ui` is DELETED**, not merely unpublished. Its source moved into
  the docs app as a shadcn-style registry (the `apps/v4/registry` layout).
- The layout is `apps/docs-ui/registry/bases/base-ui/{ui,components,blocks,
  pages,examples,hooks,lib}/` — organized by **base** (no `<style>/` source
  folder; style is a token), matching shadcn-ui/ui.
- The **editor-split was folded in**: `packages/editor` is now headless
  **editor-core** (zero `@tiptap/react`/`@zeroxsolutions/ui` imports) and its
  chrome moved into the registry (`apps/docs-ui/registry/.../editor/`). The
  renderer is injected (`NodeViewRenderer`) so core stays headless.
- The official shadcn registry standard (verified against ui.shadcn.com docs) is
  a static `registry.json` + `shadcn build` CLI → `public/r`. That is what
  shipped (NOT the code-driven `registry.ts` that shadcn-ui/ui's own repo uses
  internally for its multi-base matrix).

## 1. Inventory + confirm names

- [x] 1.1 Grep every `@zeroxsolutions/ui` consumer `import`; record each site.
- [x] 1.2 Base `base-ui`, (no style folder — shadcn uses no style source folder).
- [x] 1.3 Snapshot the `packages/ui` source tree.

  - 1.1: `packages/editor` was the sole consumer. `apps/docs-ui` imported none.
  - 1.3: primitives `src/components/ui/*`; composed flat `src/components/*.tsx`
    + `{chat,docs,layouts}/*`; blocks/pages under `src/components/`; examples
    `src/examples/*`; shared `src/lib/*`, `src/hooks/*`.

## 2. Restructure the ui source into the app registry

- [x] 2.1 Move primitives → `apps/docs-ui/registry/bases/base-ui/ui/`.
- [x] 2.2 Move composed → `apps/docs-ui/registry/bases/base-ui/components/`.
- [x] 2.3 Move blocks → `bases/base-ui/blocks/`, pages → `bases/base-ui/pages/`.
- [x] 2.4 Move examples → `bases/base-ui/examples/`; lib/hooks under `bases/base-ui/`.
- [x] 2.5 Rewrite internal imports → `@/registry/bases/base-ui/*`; fix the 7
      `./ui/` relative imports broken by the `components/`↔`ui/` geometry change.

## 3. Rewrite the registry manifest

- [x] 3.1 `apps/docs-ui/registry.json`: `$schema`, `name`, `homepage`, `items[]`,
      `files[].path` → `registry/bases/base-ui/...`.
- [x] 3.2 Per-item `type`/`dependencies`/`registryDependencies`/`categories` kept.
- [x] 3.3 `homepage` = `https://ui.zeroxsolutions.com`.
- [x] 3.4 `shadcn registry validate` passes.

## 4. Delete `packages/ui`

- [x] 4.1 `packages/ui` deleted (source moved to `apps/docs-ui/registry/`).
- [x] 4.2 Its publish/import role gone with the package.
- [x] 4.3 Zero dependents remain (it is orphaned then removed).

## 5. Editor-split (folded in)

- [x] 5.1 editor-core headless: inject `NodeViewRenderer` into `compileFeatures`
      /`DocumentEditorConfig`/`EditorBuilder`; remove `node-view-adapter` from core.
- [x] 5.2 Move editor chrome → `apps/docs-ui/registry/.../editor/`; rewrite imports
      (ui→`@/registry/...`, core→`@zeroxsolutions/editor/...`, chrome→chrome relative).
- [x] 5.3 Recreate `node-view-adapter` in chrome; wire `createNodeViewRenderer()`
      into `editor.tsx` + `chat-input.tsx`.
- [x] 5.4 editor-core deps trimmed to headless-only; chrome deps moved to docs-ui.
- [x] 5.5 Zero `@zeroxsolutions/ui` import anywhere; editor-core `@tiptap/react`-free.

## 6. Keep the build emitting the registry

- [x] 6.1 `@zeroxsolutions/docs-ui:shadcn-build` emits `apps/docs-ui/public/r/<name>.json`.
- [x] 6.2 Emitted items validate against the registry-item schema.

## 7. Record the architecture in docs

- [x] 7.1 Update `CLAUDE.md`/`AGENTS.md`: `@zeroxsolutions/ui` deleted; registry
      source at `apps/docs-ui/registry/bases/base-ui/`; `@zeroxsolutions/editor-core`
      is headless; editor chrome is registry items.
- [x] 7.2 Workspace inventory line updated (one-liner + full project inventory in
      `AGENTS.md`; `CLAUDE.md` is a symlink to it).

## 8. Validation

- [x] 8.1 `shadcn registry validate` passes.
- [x] 8.2 `shadcn-build` emits the full `/r/*.json` set.
- [x] 8.3 `grep -R "@zeroxsolutions/ui" apps packages` → zero published-package
      consumer imports (only stale prose comments + generated `/r/` files, to clean).
- [x] 8.4 `pnpm nx run-many -t lint typecheck build test` GREEN (5 projects; docs-ui
      `test` now runs its 74 registry specs / 370 tests via the added
      `vitest.config.mts`).
- [x] 8.5 `pnpm nx e2e @zeroxsolutions/docs-ui-e2e` GREEN (3 browsers).

## Remaining follow-ups (post gate-green)

- [x] e2e green (8.5); B7 vitest test target for docs-ui (the 74 registry specs now
      run via `apps/docs-ui/vitest.config.mts`); renamed `@zeroxsolutions/editor` ->
      `@zeroxsolutions/editor-core`; cleaned every stale `@zeroxsolutions/ui` /
      bare-`@zeroxsolutions/editor` prose ref; regenerated `/r/`.
- [ ] (optional, not gated) add a `registry:block` `document-editor` item bundling
      the editor chrome so it is `shadcn add`-able as one item.
