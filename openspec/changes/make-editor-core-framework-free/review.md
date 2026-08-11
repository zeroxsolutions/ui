## Readiness Decision

ready - with one explicit gate: the user reviews this proposal (proposal, specs,
design) before `/opsx:apply` begins. The artifacts are internally consistent and
the blast radius is fully identified; no open technical blocker.

## Execution Mode

tdd-preferred - the change moves an existing React-exercising spec
(`serialize.spec.tsx`) into `docs-ui` rather than authoring new tests. That moved
spec MUST be observed red-then-green after the relocation (break the chrome
walker on purpose, confirm the test fails for its own reason, restore) per
`test-proves-by-failing`. New behavior (the framework-free contract) is
asserted by the gate greps, not by a behavioral test.

## Verification Mode

retained-required - the moved serialize spec is retained and is the proof the
chrome React rendering path still works after the relocation. It is not
disposable.

## Debug Mode

standard - no unresolved failure to diagnose going in. If the gate goes red on a
stray `ReactNode` in a `.d.ts`, switch to `systematic-debugging` to trace the
re-export leaking it.

## Review Request

Requested: the user asked to review the proposal before apply. The decision that
most deserves a second pair of eyes is D1 (opaque-`unknown` seam, ES1) vs the
rejected ES2 authoring-model split - confirm ES1 is the right depth before
implementation commits to it.

## Review Scope

- The three delta specs (`editor-serialization`, `editor-viewer`,
  `editor-feature-api`) - accuracy of the MODIFIED/ADDED/REMOVED blocks against
  the current main specs.
- Design D1-D5 - especially D1 (ES1 vs ES2) and D5 (the `.d.ts` is the bar, not
  the source grep).
- Completeness of the blast radius: are there React-bearing core APIs the audit
  missed?

## Review Focus

- Is "opaque `unknown` + chrome re-types" the right depth, or should the icon
  slots (the shallowest surface) stay React-typed to avoid author friction?
- Does the `editor-viewer` delta correctly preserve the server-safe/no-engine
  guarantee while moving React codecs to chrome?
- Is the verification bar (source grep + `.d.ts` grep + `package.json`) enough to
  prove "framework-free", or should it also include a consumer typecheck without
  `@types/react` installed?

## Review Status

requested - awaiting the user's review of proposal + specs + design.

## Delegation Mode

subagent-eligible - implementation may be delegated to an implementer subagent
with a lean brief (point at the OpenSpec artifacts + name the workstream); the
subagent self-loads `.agents/rules/*` and the matching framework skill. The
contract-type changes touch both core and chrome and share one green gate, so if
delegated it is one cohesive brief, not split.

## Parallelization Mode

serial-only - the workstreams have a real order: core contract types narrow to
`unknown` before the chrome re-types against them; the serialization files
relocate before the moved spec can run; the gate runs last. Splitting would race
on the shared type contract.

## Worktree Mode

same-tree - per this repo's convention, work directly on the branch; do not
create a worktree unprompted.

## Branch Finish Mode

standard - commit when the user asks, after the gate is green and the rule-audit
passes.

## Blocked By

none (technical). The only gate is the user's review of this proposal.

## Observed Failure

Not a bugfix or diagnosis change - no observed runtime failure. The defect is a
contract/prose mismatch: the core is labeled "headless" while its published
contract names `ReactNode` on three surfaces. The inspection boundary is the
`grep -rn "from 'react'" packages/editor-core/src` audit (7 hits) and the
`ReactNode` occurrences in the emitted `.d.ts`.

## Validation Focus

The `plan.md` must carry these forward, and the verification companion must
record their results:

1. `grep -rn "from 'react'" packages/editor-core/src` -> empty.
2. `grep -rn "ReactNode" packages/editor-core/dist` (after build) -> empty.
3. `packages/editor-core/package.json` -> no `react` in dependencies /
   peerDependencies / devDependencies.
4. The moved `serialize` spec in `docs-ui` -> observed red (walker broken on
   purpose) then green.
5. `nx run-many -t lint typecheck build test` green; `nx e2e
   @zeroxsolutions/docs-ui-e2e` green (chrome still renders documents).
6. Post-archive: the Purpose paragraphs of `editor-serialization` and
   `editor-viewer` are manually corrected to drop React from the core export
   list (archive syncs requirement bodies, not free-text Purpose).

## Key Risks

- A re-exported type leaks `ReactNode` into a `.d.ts` after the direct imports
  are removed; the source grep passes but the published contract does not.
  Mitigation: D5 - gate on `dist/**/*.d.ts`, not just source.
- The moved `serialize.spec.tsx` is dropped or silently weakened during
  relocation, leaving the chrome React path untested. Mitigation: move, run,
  break-on-purpose, restore.
- Author ergonomics regress from opaque `unknown`. Mitigation: D3 typed-alias
  barrel in the chrome.
- A non-core branch on `format === 'react'` breaks when `'react'` leaves `Format`.
  Verified unlikely (only the moving walker branches on it); re-check at apply.

## Findings Summary

none yet - no external review findings received. This file is the self-authored
pre-implementation readiness gate; the user's review is the next input.

## Manual Adjustments

- The post-archive Purpose fix for `editor-serialization` (drop "React" from
  "export to Markdown/HTML/React") and `editor-viewer` (React codecs are
  chrome-owned) must be applied manually - the `openspec archive` sync rewrites
  requirement bodies, not the free-text Purpose. This is tracked as an explicit
  task; it is not something the sync will do automatically.
- `editor-feature-api` line 25 references the stale package name
  `@zeroxsolutions/editor` (predates the rename to `editor-core`). Out of scope
  for this change; flagged as a follow-up.
