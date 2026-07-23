## Scope

This plan drives the full `build-registry-foundation` change: turning the render-only
registry app into a complete, typed, categorized, validated shadcn ecosystem that documents
components and grows into blocks and pages. It expands `tasks.md` into ordered, validated
execution steps.

## Covers

Task groups `1.x` (doc-page foundation), `2.x` (typed/categorized items), `3.x` (validate),
`4.x` (per-item pages), `5.x` (block/page seed), `6.x` (validation). Validation Focus items
from `review.md`: doc-page-completeness, typed-categorized-items, validate-in-gate,
block-page-path, npm-channel-unchanged.

## Plan Type

full

## Execution Strategy

standard

New doc components and pages over a stable registry app. No TDD for the layout work; each
doc page gets an e2e assertion that its sections render.

## Ordered Steps

1. **Doc-page foundation** - build the `docs/` components (`DocPage`, `DocTabs`,
   `PropsTable`, `CompositionTree`, `UsageCode`, `DarkModeToggle`) composing ui primitives;
   no re-skinning.
2. **Reference instance + catalog** - retro-fit `/preview/button` to the full `DocPage`
   shape; add the catalog index page (items by `category`/`type`).
3. **Categories + clean items** - add a `category` to the three existing items; fix
   anything `shadcn registry validate` flags; grep-confirm every item has `type` +
   `category`.
4. **Validate in the gate** - add `shadcn registry validate` to the `shadcn-build` nx
   target; prove the gate fails on a deliberately malformed item, then revert the
   malformation.
5. **Per-item doc pages** - as `redesign-composed-layer` stabilizes each cluster, add the
   item's doc page (hand-authored Props/Composition + derived `shadcn add`/import) and its
   `registry.json` entry; extend `registry-e2e` per page.
6. **Block/page seed** - once the `AiProviderCard`/`AiProviderIcon` cluster lands, author
   the AI-provider-picker `registry:block` and a demo `registry:page`, each with a doc page
   and declared `registryDependencies`.
7. **Final validation** - all `6.x` checks green.

## Validation Per Step

1. `nx run-many -t lint build test` green; the doc components compile and compose
   primitives (no hardcoded color, no re-skinned primitive).
2. The button page renders Preview + Code/Usage + Props + Composition + dark-mode; the
   catalog lists it by category; `registry-e2e` green.
3. `shadcn registry validate` (run manually pre-gate) passes; grep confirms every item has
   `type` + `category`.
4. A malformed item fails the `shadcn-build` target; the build is green once reverted.
5. Per page: `registry-e2e` asserts all sections render; the page is reachable from the
   catalog; the npm `exports`/`files` are unchanged.
6. The block composes existing items and declares `registryDependencies`; its doc page
   renders all sections; `registry-e2e` covers it.
7. All `6.x` validation tasks green (see below).

## Files / Owners

- `apps/registry/src/components/docs/*` - doc-page components (foundation)
- `apps/registry/src/app/**` - doc pages + catalog index
- `apps/registry-e2e/**` - e2e coverage of the doc tabs and the block/page
- `packages/ui/registry.json` - `categories`, new items, block/page entries
- `packages/ui` `shadcn-build` target - the `validate` step
- Ownership per milestone, assigned when the milestone starts.

## Completion Checkpoint

The change is complete when every documented item has a full doc page, every `registry.json`
item has a `type` and a `category`, `shadcn registry validate` is in the gate, at least one
`registry:block` ships, and the npm channel is byte-unchanged. The `registry-ecosystem`
capability and the modified `docs-site` / `component-registry` deltas validate `--strict`.

## Completion Verification

Retained evidence before the change is presented as complete (`verification.md` companion,
per `retained-recommended`):

- Every documented item's page renders Preview + Code/Usage + Props + Composition +
  dark-mode (`registry-e2e`, real browser).
- Every `registry.json` item has a `type` and a `category`; `shadcn registry validate`
  passes in the build gate.
- At least one `registry:block` ships (composing existing items, declaring
  `registryDependencies`); a `registry:page` is wired.
- `nx run-many -t lint build test` green; `nx build @zeroxsolutions/registry` static-exports
  every doc page; `nx e2e @zeroxsolutions/registry-e2e` passes.
- The npm channel is byte-unchanged (`exports`/`files` identical to HEAD; `registry.json`
  outside `files`).
- Each milestone's rule-audit note is committed alongside its diff.

## Delegation Units

Each doc component (step 1) and each per-item doc page (step 5) is a self-contained
delegation unit for an implementer subagent, once the `DocPage` shape is agreed. Ownership
boundary = the component/page file; the subagent self-loads `.agents/rules` and the matching
framework skill. Result writes back as the page/component diff plus its e2e assertion. The
brief stays lean - it points at this change's artifacts plus the page's content.

## Parallel Units

The doc-page foundation (steps 1-4) is sequential. Once the `DocPage` shape lands,
individual per-item doc pages (step 5) are independent - they share the layout, not files -
and may be authored in parallel. The block/page seed (step 6) stays sequential (it depends
on `redesign-composed-layer`).

## Isolation Boundaries

Same-tree execution on `master`. Parallel per-item pages own disjoint files
(`apps/registry/src/app/<kind>/<name>/page.tsx` + its `registry.json` entry), so they do not
conflict; the shared `registry.json` is edited one item per commit to avoid merge races.
Each commit stages its files by explicit path (never `git add -A`).

## Review Follow-Up

Accepted findings from `review.md` that shape this plan: the three capabilities overlap on
type/category by design (contract / hosting / item-shape); doc content is hand-authored
(docgen rejected, matching `ui.shadcn.com`); the block/page seed lands after the
`redesign-composed-layer` cluster; the registry stays flat and the npm channel unchanged.
