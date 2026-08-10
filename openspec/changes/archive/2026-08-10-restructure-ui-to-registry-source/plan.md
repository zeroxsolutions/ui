## Scope

The whole change: collapse `@zeroxsolutions/ui` from a dual publishable-lib +
registry into a **registry-source-only, unpublished** workspace package with one
consumer channel (`shadcn add`), and reorganize its component source **per-style**
(`bases/<base>/ui/` primitives + `<style>/{components,blocks,pages}/` styled items
+ `examples/`), with internal importers repointed to workspace source.

## Covers

Tasks `1.1`-`8.5`. Validation Focus items carried forward: `shadcn registry
validate` passes, `shadcn-build` emits the full `/r/*.json` set, zero
published-package `@zeroxsolutions/ui` consumer imports remain, the gate
(`lint typecheck build test`) is green, and no publish target survives on
`packages/ui`.

## Plan Type

full - cross-module (ui source, every in-repo importer, the build target,
docs inventory) and validation-intensive (registry schema + grep + gate + e2e).

## Execution Strategy

standard - a source restructure + manifest rewrite + surface removal; correctness
is shown by `shadcn registry validate`, the build output, a clean grep, and the
green gate, not unit TDD.

## Ordered Steps

1. Inventory `@zeroxsolutions/ui` consumer imports; confirm the first style name (O1, default `default`); snapshot the current source tree to map files to new homes.
2. Restructure the source with `git mv`: primitives -> `bases/base-ui/ui/`, composed -> `<style>/components|blocks|pages/`, examples -> `examples/`; add per-directory barrels where needed.
3. Rewrite `packages/ui/registry.json` as the flat per-style manifest (globally-unique names, per-style `files[].path`, `type`, `dependencies`, `registryDependencies`, `categories`, `homepage`).
4. Run `shadcn registry validate`; fix schema/duplicate-name errors until green.
5. Remove the consumer `exports` and the publish/release target from `packages/ui/package.json`.
6. Repoint every in-repo importer (1.1 sites) to workspace source; re-grep to confirm zero published-package consumer imports.
7. Verify `@zeroxsolutions/ui:shadcn-build` emits `apps/docs/public/r/<name>.json` + `public/r/registry.json` from the per-style source; spot-check one emitted item.
8. Update `CLAUDE.md`/`AGENTS.md` (registry-source role + per-style layout + inventory line).
9. Run the gate and the registry e2e.

## Validation Per Step

1. A written list of import sites + the confirmed style name; a file->home map.
2. `packages/ui` tree shows `bases/base-ui/ui/`, `<style>/{components,blocks,pages}/`, `examples/`; primitives appear once (no per-style duplication).
3. `registry.json` items are uniquely named; each `files[].path` resolves on disk.
4. `shadcn registry validate` exits 0.
5. `packages/ui/package.json` has no consumer `exports` and no publish/release target.
6. `grep -R "@zeroxsolutions/ui" apps packages` shows only workspace-source imports + `package.json` `name` fields.
7. `shadcn-build` writes the full `/r/*.json` set with no errors; one emitted JSON validates against the registry-item schema.
8. `CLAUDE.md`/`AGENTS.md` state the registry-source role and the per-style layout.
9. `pnpm nx run-many -t lint typecheck build test` green; `pnpm nx e2e @zeroxsolutions/registry-e2e` (or `docs-e2e`) green.

## Files / Owners

- `packages/ui/bases/base-ui/ui/**` - primitives moved here.
- `packages/ui/<style>/{components,blocks,pages}/**` - styled items moved here.
- `packages/ui/examples/**` - example items moved here.
- `packages/ui/registry.json` - rewritten flat per-style manifest.
- `packages/ui/package.json` - consumer `exports` + publish target removed.
- `apps/docs/**` (and any other 1.1 importer) - imports repointed to workspace source.
- `CLAUDE.md` / `AGENTS.md` - registry-source role + per-style layout + inventory line.

## Completion Checkpoint

All tasks `1.1`-`8.5` checked; `@zeroxsolutions/ui` is registry-source and
unpublished (no consumer `exports`, no publish target); source lives under
`bases/<base>/ui/` + `<style>/{components,blocks,pages}/` + `examples/`; the grep
is clean of published-package consumer imports; `shadcn registry validate` passes;
`shadcn-build` emits the full `/r/*.json` set; and `pnpm nx run-many -t lint
typecheck build test` is green.

## Completion Verification

Retained evidence before the change is called done: the `shadcn registry validate`
green output; the `shadcn-build` output listing the emitted `/r/*.json` files; the
clean `grep -R "@zeroxsolutions/ui"` result (annotated); the green gate output; the
green registry/docs e2e output; and the updated `CLAUDE.md`/`AGENTS.md` lines. A
verification note records that no consumer can `import from '@zeroxsolutions/ui'`
and that the only consumer channel is `shadcn add`.
