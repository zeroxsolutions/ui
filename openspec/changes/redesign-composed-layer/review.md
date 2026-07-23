## Readiness Decision

ready with conditions

The proposal, specs, and design are coherent and the change can enter implementation.
The condition is the per-cluster gate already encoded in the design: **no cluster is
touched until its mini-proposal (concrete decisions, breaking-rename flags, any
compound-spec delta) is agreed**. The cluster boundaries and the versioning cadence are
intentionally left as open questions, resolved cluster-by-cluster rather than up front.

## Execution Mode

standard

This is a refactor/redesign pass over existing, tested components. The editor and ui
packages already carry co-located specs (`.spec.tsx`) that assert current behavior; each
cluster keeps them green and adjusts them where behavior intentionally changes. TDD is
not required for the mechanical migrations (cn, data-slot, surface), but any behavior
change in a compound component adds or updates its spec first.

## Verification Mode

retained-recommended

Keep the existing `.spec.tsx` suites running (jsdom) and add a **real-browser** check for
each cluster's composable-into-block sample region in the `registry` app - jsdom cannot
measure layout or interaction, and the user reviews UI pixels closely (per
`verify-visual-bugs-in-real-browser`). The registry app already exists (from the archived
`add-shadcn-registry-and-docs`), so the block-verification step has a host.

## Debug Mode

standard

## Review Request

Self-review recorded here (pre-implementation review). No external review requested yet;
the per-cluster mini-proposals are the natural review checkpoints during apply.

## Review Scope

The three planning artifacts (proposal, specs, design) for `redesign-composed-layer`, and
their coherence with the two existing capability deltas (`design-system-conventions`,
`ui-composition-defaults` cn-everywhere) and the six candidate compound specs.

## Review Focus

- That "redesign every composed component" is scoped as an in-place refactor, NOT a
  purge (the in-repo-usage lesson).
- That the foundation-first ordering genuinely unblocks later clusters.
- That composable-into-block is a verifiable criterion, not an assertion.

## Review Status

not-requested

## Delegation Mode

subagent-eligible

Each cluster, once its mini-proposal is agreed, is a self-contained refactor unit that an
implementer subagent can carry (it self-loads the `.agents/rules` and framework skills).
The lean delegation brief points at this change's artifacts plus the cluster's
mini-proposal; it does not embed rule slugs.

## Parallelization Mode

serial-only

The cluster ordering is sequential by necessity: the shared surface and `cn()`-everywhere
must land before the chrome menus consume them, and `ui` composed clusters land before
the editor clusters that depend on them. Shared root config (`nx.json`, lockfile) also
serializes scaffolding per `worktree-per-task`. Work within a single cluster is small
enough to stay in one stream.

## Worktree Mode

same-tree

This repo works directly on `master` (per the working convention); no worktree unless
explicitly requested. Concurrent sessions share the master tree, so each commit stages
its files by explicit path, never `git add -A`.

## Branch Finish Mode

standard

## Blocked By

none

No hard blocker. The two open questions (exact cluster boundaries; per-cluster vs
surface-freeze versioning) are resolved during apply, not before it.

## Observed Failure

Not a bugfix change. The drift symptoms that motivate it, for reference: 9 editor files
hand-join className instead of `cn()`; 5 chrome menus carry bespoke `data-*-menu`
attributes; the floating surface is redeclared with drifted shadows
(`FloatingShell` `shadow-md` vs `editor-toolbar` `shadow-sm`); two convention gaps
(monochrome tokens, icon source) had no spec.

## Validation Focus

These must carry into `plan.md` and be checkable per cluster:

- **Editor no-regression** - `nx run-many -t lint build test` green; `editor`'s existing
  `.spec.tsx` suites pass unchanged (or updated where behavior intentionally changes).
- **Migration completeness** - after the foundation + chrome-menu clusters, a grep for
  `.filter(Boolean).join` and `data-(bubble|slash|trigger|block)-menu`/`data-editor-toolbar`
  in authored code returns zero; the floating surface is declared once.
- **Convention gaps recorded** - `design-system-conventions` and the `cn()`-everywhere
  requirement on `ui-composition-defaults` exist and validate `--strict`.
- **Composable-into-block** - each redesigned cluster composes a sample region in the
  `registry` app without editing the component, verified in a real browser.
- **Breaking renames flagged** - every subpath rename is recorded as a major bump with a
  migration note; in-repo consumers updated in the same commit.

## Key Risks

- **Editor regression** - `editor` consumes `ui` in many places; a `ui` cluster can break
  it silently. Mitigation: green gate + editor suites on every cluster; foundation lands
  first.
- **Over-abstraction of the surface** - extracting a shared surface risks a premature
  abstraction. Mitigation: extract only the already-duplicated look.
- **Subjective redesign calls** - "does this satisfy the philosophy?" is a judgment.
  Mitigation: the checklist + per-cluster review.
- **Composable-into-block overhead** - proving composability per cluster adds a step;
  accepted trade-off for the registry-ecosystem goal.
- **Scope creep** - "redesign every composed component" is wide. Mitigation: the
  per-cluster mini-proposal gate keeps each unit small and reviewed.

## Findings Summary

- **Merge color + icon into one capability** (`design-system-conventions`) - accepted.
  User-confirmed ("khong can tach"); the two rules share a visual-identity concern.
- **Compound-spec deltas deferred to per-cluster** - accepted. Defining six compound
  deltas up front would be premature; the design states each lands when its cluster's
  requirement actually changes. `plan.md` must list the six candidates and the
  per-cluster trigger.
- **Cluster boundaries left open** - deferred (not a blocker). Resolved in each cluster's
  mini-proposal; the foundation-first ordering is the committed starting cut.
- **Versioning cadence left open** - deferred (not a blocker). Per-cluster major vs a
  final surface-freeze cluster is decided once the first breaking rename appears.
- **Composable-into-block depends on the registry app** - accepted. The app exists (archived
  `add-shadcn-registry-and-docs`); `build-registry-foundation` later formalizes the sample
  regions as `registry:block` items.

## Manual Adjustments

None yet. The per-cluster mini-proposals produced during apply are the place to record
concrete rename/decisions; they feed back into compound-spec deltas and the major-bump
migration notes.
