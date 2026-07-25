## Scope

This plan drives the full `redesign-composed-layer` change: bringing every authored
component and hook to the shadcn/ui convention set, cluster by cluster, foundation-first.
It expands `tasks.md` (the coarse-grained source of truth) into ordered, validated
execution steps.

## Covers

Task groups `1.x` (foundation), `2.x` (ui composed), `3.x` (icons + fluent-emoji),
`4.x` (compound deltas), `5.x` (breaking-rename release), `6.x` (validation). Validation
Focus items carried from `review.md`: editor-no-regression, migration-completeness,
convention-gaps-recorded, composable-into-block, breaking-renames-flagged.

## Plan Type

full

## Execution Strategy

standard

Refactor over existing, tested components. Each cluster opens with a mini-proposal that
is agreed before any edit; mechanical migrations (cn, data-slot, export-style) do not
require TDD, but any behavior change in a compound adds/updates its `.spec.tsx` first.

## Ordered Steps

1. **Foundation mini-proposal** - confirm `FloatingShell` folds into `Popover`, list the
   editor chrome-menu consumers, decide the non-focus handling.
2. **Fold `FloatingShell` -> `Popover`** + replace the 9 editor `cn()` hand-joins + rename
   the 5 bespoke `data-*-menu`/`data-editor-toolbar` attributes to `data-slot="<kebab>"`
   (splitting `trigger-menu` identity from `data-token-kind` state). Migrate every
   selector (CSS, `.spec.tsx`, engine) in the same step.
3. **ui composed cluster mini-proposal** - group the audit findings (data-slot gaps,
   naming, variants, export-style, resize/API/color) into sub-clusters.
4. **ui composed refactor** - add the missing `data-slot` across the ~25 audited
   roots/parts; rename `ChatMessageShell` -> `ChatMessage` and the `*Row` tokens; convert
   the 3 inline-export files to trailing `export { ... }`; export the missing variants and
   replace the `toggle.tsx` ternaries with `cn()`; open `ResizeHandleProps` and fix the
   `ai-provider-icon` hardcoded color.
5. **icons + fluent-emoji mini-proposal + refactor** - rename the 5 utility modules to
   match their primary export; walk the resolvers/Provider/setters against the philosophy
   checklist.
6. **Compound deltas + release** - for each cluster whose redesign changed a compound
   requirement, add its delta to `specs/`; record every subpath rename in the cluster
   mini-proposal and carry the major bump via `nx release`.
7. **Final validation** - migration-completeness greps, full green gate, registry-e2e,
   editor no-regression, rule-audit.

## Validation Per Step

1. Mini-proposal agreed (the gate; no edit before this).
2. `nx run-many -t lint build test` green; grep `.filter(Boolean).join` and the 5
   `data-*-menu`/`data-editor-toolbar` attributes in authored code returns zero; no
   `*Shell` component remains in the editor; `editor` `.spec.tsx` suites pass.
3. ui composed sub-clusters defined and agreed.
4. Per sub-cluster: green gate; composable-into-block sample region renders in the
   `registry` app (real browser); editor unaffected; compound delta validated `--strict`
   if a requirement changed.
5. green gate; icon-source rule holds; no file/primary-export mismatch remains.
6. every added compound delta validates `--strict`; breaking renames flagged with a
   migration note.
7. All `6.x` validation tasks green (see below).

## Files / Owners

- `packages/editor/src/document/ui/*` - foundation cluster (fold to `Popover`, cn,
  data-slot)
- `packages/editor/src/{composer,document/react}/*` - cn hand-join holdouts
- `packages/ui/src/components/{*,chat,layouts}/*` - ui composed cluster
- `packages/icons/src/*`, `packages/fluent-emoji/src/lib/*` - icons + fluent-emoji cluster
- `openspec/changes/redesign-composed-layer/specs/*` - compound deltas (per cluster)
- Ownership is per cluster, assigned when its mini-proposal is agreed.

## Completion Checkpoint

The change is complete when every cluster has reached `merged` in the design's state
model: mini-proposal agreed, refactor landed, composable-into-block verified, green gate
passed, reviewed. The two convention-gap capabilities (`design-system-conventions`,
`ui-composition-defaults` cn-everywhere + compound-file + variants requirements) exist and
validate `--strict`, and the migration-completeness greps return zero.

## Completion Verification

Retained evidence before the change is presented as complete (`verification.md`
companion, per `retained-recommended`):

- Migration greps return zero: `.filter(Boolean).join`, `data-(bubble|slash|trigger|block)-menu`,
  `data-editor-toolbar`, bespoke `*Shell`, unjustified `*Row`.
- `nx run-many -t lint build test` green across `ui`, `editor`, `icons`, `fluent-emoji`,
  `registry`, `registry-e2e`; `nx e2e @zeroxsolutions/registry-e2e` passes (covers the
  composable-into-block sample regions).
- `editor` no-regression: its `.spec.tsx` suites pass, updated only where behavior
  intentionally changed.
- Each cluster's mini-proposal and rule-audit note are committed alongside its diff.
- The floating surface comes from the `Popover` primitive; the two new/modified specs
  validate `--strict`.

## Delegation Units

Each cluster, once its mini-proposal (step 1/3/5) is agreed, is a self-contained
delegation unit for an implementer subagent. Ownership boundary = the cluster's file set
(see Files / Owners); the subagent self-loads `.agents/rules` and the matching framework
skill. Result writes back as: the refactor diff (committed), the cluster's mini-proposal
and rule-audit note, and any compound-spec delta added to this change's `specs/`. The
delegation brief stays lean - it points at this change's artifacts plus the cluster
mini-proposal and names the work; it does not embed rule slugs.

## Parallel Units

None. The cluster ordering is sequential (foundation before consumers; `ui` before the
editor clusters that depend on it), and shared root config serializes scaffolding per
`worktree-per-task`. Work runs in one stream on `master` (same-tree).

## Isolation Boundaries

Same-tree execution. Each commit stages its cluster's files by explicit path (never
`git add -A`) because concurrent sessions share the `master` tree. A cluster's compound
delta lives under this change's `specs/` until archive, then syncs to main.

## Review Follow-Up

Accepted findings from `review.md` that shape this plan: color + icon merged into one
`design-system-conventions` capability; compound deltas land per-cluster (not up front);
`FloatingShell` folds into the `Popover` primitive (not a rename to an invented name);
`model-list`'s three files are independent compositions and are NOT merged.
