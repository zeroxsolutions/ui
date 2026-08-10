## Readiness Decision

ready with conditions - the structure and manifest work is unblocked; the only
conditional is the first style's **name** (O1), which has a safe default
(`default`) and does not block the layout. Proceed once the user confirms or
overrides the style name.

## Execution Mode

standard - a source restructure + manifest rewrite + npm-surface removal. Not a
behavioral feature; the TDD loop does not apply. Correctness is shown by
`shadcn registry validate`, the `shadcn-build` output, a clean consumer-import
grep, and the green gate.

## Verification Mode

retained-recommended - keep `shadcn registry validate` and a `shadcn-build`
smoke check (emits `/r/<name>.json`) as the durable evidence; the existing
`registry-e2e` continues to exercise the served items.

## Debug Mode

standard.

## Review Scope

`packages/ui` (source layout, `registry.json`, `package.json` publish/exports),
every in-repo `@zeroxsolutions/ui` importer, and the `shadcn-build` target.

## Review Focus

- No consumer `import from '@zeroxsolutions/ui'` remains as a published-package
  import (internal importers point at workspace source).
- `registry.json` items are globally uniquely named across the base + style; paths
  match the per-style on-disk files.
- No publish/release target survives on `packages/ui`.
- Primitives are NOT duplicated per style (they live once under `bases/<base>/ui/`).

## Review Status

resolved - pre-implementation review written into this file; no external review
requested.

## Delegation Mode

single-agent - the migration is sequential and cross-cutting within one package;
the apply step delegates file edits to the implementer, but the change is not
parallelizable across agents.

## Parallelization Mode

serial-only - restructure -> rewrite manifest -> drop npm surface -> repoint
importers -> verify; each step depends on the prior.

## Worktree Mode

same-tree - repo convention is to work on `master` directly; no worktree.

## Branch Finish Mode

standard.

## Blocked By

none - O1 (first style name) defaults to `default` and does not block.

## Validation Focus

Carry forward into `plan.md`:

- `shadcn registry validate` passes on the rewritten `registry.json`.
- `@zeroxsolutions/ui:shadcn-build` emits `apps/docs/public/r/<name>.json` +
  `public/r/registry.json` from the per-style source.
- `grep -R "@zeroxsolutions/ui" apps packages` shows zero *published-package*
  consumer imports (remaining hits are workspace source imports or `package.json`
  `name` fields, not consumer `import` statements reaching a published lib).
- `pnpm nx run-many -t lint typecheck build test` is green.
- No publish/release target on `packages/ui`.

## Key Risks

- An in-repo importer is missed when the npm surface is removed -> build breaks.
  Mitigated by the pre-migration grep + the gate.
- Item-name collisions across base/style slip in -> `shadcn registry validate`
  catches duplicates; the gate runs it.
- Per-style code duplication is mistaken for a bug and "deduplicated" into a
  shared file - it is intentional (the cost of multi-style); the design records it.

## Findings Summary

None - pre-implementation; no findings yet.
