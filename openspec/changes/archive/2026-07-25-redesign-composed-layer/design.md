## Context

The workspace is a **UI-only SDK** (`@zeroxsolutions/ui`, `@zeroxsolutions/editor`,
`@zeroxsolutions/icons`, `@zeroxsolutions/fluent-emoji`) for other apps in the product
family. It is already on the shadcn 2026 standard: Base UI `render` (zero real Radix
`asChild`), `data-slot` widely used, `cva` for variants, a flat `registry.json`,
`shadcn@4.11.0`. The composed layer mostly reads as one design system, but an audit found
two classes of gap:

- **Editor drift** (mechanical): 9 files hand-join className with
  `[...].filter(Boolean).join(' ')` instead of `cn()` (the editor already imports `cn`
  from `@zeroxsolutions/ui/lib/utils`); 5 chrome menus carry bespoke attributes
  (`data-bubble-menu`, `data-slash-menu`, `data-trigger-menu`, `data-block-menu`,
  `data-editor-toolbar`); the floating surface is redeclared and has drifted
  (`FloatingShell` `shadow-md` + `text-popover-foreground` vs `editor-toolbar`
  `shadow-sm`).
- **Composed redesign** (judgment): every authored component must be confirmed against the
  shadcn philosophy and - critically - made composable enough to assemble into blocks and
  pages (the registry-ecosystem goal).

Two convention gaps (monochrome tokens + scoped hue; one icon source) have no spec yet;
they land in the new `design-system-conventions` capability, and the `cn()`-everywhere
rule lands as an added requirement on `ui-composition-defaults`.

A key constraint, learned this session: **in-repo usage is not a dead-code signal** for a
publishable SDK. Nothing is purged for low in-repo usage; every authored component is
redesigned in place.

## Goals / Non-Goals

**Goals:**

- Bring every authored composed component and hook to the shadcn philosophy, end to end.
- Close the editor drift (cn, data-slot, surface) and the two convention gaps.
- Make each composed component **composable into a block/page** without editing it.
- Keep `editor` (which consumes `ui`) green at every step.

**Non-Goals:**

- A shadcn-2026 upgrade (already done), purging low-usage components, building registry
  docs/blocks (that is `build-registry-foundation`), redesigning vendored
  `components/ui/*`, the AI model picker (`add-model-picker`).

## Decisions

### 1. Foundation-first cluster ordering

Order clusters so each dependency is aligned before its dependents:

1. **Foundation** - extract the shared floating surface (keep `FloatingShell` as the single
   sanctioned declaration) and land `cn()`-everywhere (the mechanical swap on the 9 editor
   holdouts). These unblock every later cluster.
2. **Editor chrome menus** - rename the 5 bespoke `data-*-menu` attributes to
   `data-slot="<kebab>"` and have each menu consume the shared surface (deleting the
   `shadow-sm`/`shadow-md` drift).
3. **`ui` composed clusters** - grouped by folder (`components/*` root, `chat/`,
   `layouts/`) and by family; each component walked against the philosophy and the
   composable-into-block goal.
4. **`icons` system + `fluent-emoji`** - verify the resolvers, Provider, and setters
   against the philosophy (these are mostly already correct; the pass confirms and
   documents).

The exact per-cluster grouping is agreed in each cluster's mini-proposal; the order above
is the starting cut.

### 2. The per-cluster loop

Each cluster is one reviewable unit running the same loop: audit against the philosophy
checklist -> write a short per-cluster proposal (concrete decisions, any breaking subpath
rename, the compound-spec delta if a requirement changes) -> agree -> refactor -> verify
composable-into-block -> prove green -> review -> merge. A cluster is never merged red or
un-reviewed.

### 3. Surface, cn, and data-slot migrations are mechanical and local

- **`cn()`** stays the single helper at `packages/ui/src/lib/utils.ts`; no package grows
  its own copy. The work is replacing the 9 hand-join holdouts with the existing import.
- **Surface** - `FloatingShell` is a bespoke re-implementation of Base UI
  `Popover.Positioner` (virtual-element `anchor` + `side` + collision handling), so it
  folds into the `ui/popover` primitive rather than surviving under any custom name. The
  caret menus (`bubble-menu`, `slash-menu`, `trigger-menu`) consume `Popover` directly,
  deleting the drift and the bespoke surface in one move. The cluster verifies the
  non-focus requirement (caret menus keep editor focus) against Popover's options.
- **`data-slot`** - each bespoke `data-*-menu` becomes `data-slot="<kebab>"`. A *content*
  variant that the menu needs to read (e.g. a token kind) stays on a **second** attribute,
  the same pattern `callout` already uses (`data-slot="callout"` + `data-callout={variant}`).
  Any selector (CSS, test, editor engine) reading the old attribute is migrated in the same
  cluster.

### 4. Composable-into-block is verified, not asserted

A component is composable if a consumer can assemble it with siblings into a page region
**without editing the component**. Each redesigned cluster proves this by composing a
sample region in the `registry` app (the seed for the later `registry:block` items). If a
component cannot be assembled without an edit, the cluster fixes the component's seams
(slots, children, variants), not the consumer.

### 5. Redesign pass uses a philosophy checklist

Each component is walked against one checklist (composition over config; parts-not-props;
`cva` for variants; `data-slot` kebab 1:1; Base UI `render`; semantic tokens; monochrome
+ scoped hue; one icon source; restraint over chrome; never reimplement a shipped
primitive). A shortcoming is fixed in place; a component that already passes is left
untouched and recorded as verified.

### 6. Breaking subpath renames are batched per cluster

Because the surface is a per-file `./*` map, a rename is a major change. In-repo consumers
are updated atomically in the same commit; the release carries a major bump plus a
migration note (`lib-public-exports-and-semver`, via `nx release`). Renames are grouped per
cluster so a consumer absorbs one coordinated set at a time.

## Risks / Trade-offs

- **Editor regression** - `editor` consumes `ui` in many places; a `ui` cluster can break
  it silently. Mitigation: the green gate plus `editor`'s tests run on every cluster; the
  foundation (surface + cn) lands before the composed redesign.
- **Over-abstraction of the surface** - extracting a shared surface risks a premature
  abstraction. Mitigation: extract only the genuinely duplicated look (already declared
  twice), nothing speculative.
- **Subjective redesign calls** - "does this component satisfy the philosophy?" is a
  judgment. Mitigation: the philosophy checklist plus per-cluster review; borderline cases
  are decided in the cluster mini-proposal, not mid-refactor.
- **Composable-into-block overhead** - proving composability per cluster adds a step.
  Trade-off accepted: it is what the registry-ecosystem goal requires.
- **Gating latency** - "propose first, discuss gradually" slows each cluster. This is the
  deliberate trade-off over an unreviewable big-bang.

## State Model

Each cluster moves through an explicit lifecycle; the change is done when every cluster
reaches `merged`:

- `unaudited` - not yet walked against the philosophy checklist.
- `proposed` - audited; a per-cluster mini-proposal (decisions, breaking flags, any
  compound-spec delta) is under discussion.
- `agreed` - the mini-proposal is accepted; edits may begin.
- `refactored` - components brought to the philosophy; in-repo consumers updated lockstep.
- `block-verified` - a sample region in the `registry` app proves composable-into-block.
- `green` - lint/build/test pass; `editor` unregressed.
- `reviewed` - cluster reviewed (breaking renames confirmed and flagged).
- `merged` - integrated; the next cluster begins.

## Migration Plan

- **Rollout** - one cluster at a time in the foundation-first order; each cluster is
  independently shippable and green, so the branch stays releasable throughout.
- **Consumer lockstep** - a cluster's breaking renames update in-repo consumers in the same
  commit; the release carries a major bump and migration note for external consumers.
- **Fallback** - because clusters are independent commits, a problematic cluster can be
  reverted without unwinding earlier ones.
- **Hand-off to `build-registry-foundation`** - the sample regions composed during
  block-verification become the seed `registry:block` items in that change.

## Open Questions

- **Cluster boundaries** - the foundation-first cut above is a proposal; the exact
  per-cluster grouping and sequence are confirmed in each cluster's mini-proposal.
- **Bespoke-attribute coupling** - confirm whether each `data-*-menu` is read by the editor
  engine or its CSS before renaming it to `data-slot`, so no selector is orphaned.
- **Compound-spec deltas** - which of the six compound specs (`ui-menu-button` /
  `ui-split-button` / `ui-permission` / `model-list` / `model-info-card` / `ai-provider-card`)
  actually need a requirement change is decided per cluster, not up front.
- **Versioning cadence for renames** - per-cluster major bumps versus deferring all
  breaking renames to a final "surface freeze" cluster.
