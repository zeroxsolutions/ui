## Why

chiselhub renders "a model in a model list" as a small stack of app components
under `apps/web-app`: the model item (a provider logo + name/id, capability and
token chips, an enable `Switch` and a remove button), the list section around it
(title, search, capability tabs, Enabled/Disabled groups, empty + loading
states), a loading skeleton, a tinted-icon chip atom, and a token-pill atom.
Every one is a thin composition of `@zeroxsolutions/ui` primitives (`Item`,
`Switch`, `Tooltip`, `Badge`, `Empty`, `Skeleton`, `ItemGroup`) plus a couple of
app atoms - yet it all lives in the app, so any other surface that needs a model
list re-hand-rolls the same shell.

Two things make now the moment to extract it:

- The item's leading logo is chiselhub's provider-logo helper, which this repo
  just replaced with `AiProviderIcon` in `@zeroxsolutions/icons`
  (`add-ai-provider-icon`). `@zeroxsolutions/ui` already depends on
  `@zeroxsolutions/icons`, so the item's logo slot is fillable from the design
  system's own dependency graph.
- The design system already ships the closest analog, `AiProviderCard` - a
  domain-free tile whose brand mark and trailing control are consumer-supplied
  slots. `ModelListItem` is the same shape one layer down (built on the shipped
  `Item` instead of `Card`), so it belongs beside it as a composed surface.

Extracting the presentational shell gives one shared, domain-free `model-list`
surface any app fills with its own data and state, and lets chiselhub's model
item and list section collapse onto it.

## What Changes

- Add a `model-list` composed surface to `@zeroxsolutions/ui`
  (`packages/ui/src/components/`), presentational and domain-free, mirroring
  `AiProviderCard`'s slot-based, `data-slot`-tagged style:
  - `ModelListItem` (`model-list-item.tsx`) - one model built on the shipped
    `Item`: a leading media slot (the provider logo, e.g. `AiProviderIcon`), the
    model name and id, a meta slot for capability / token chips, and a trailing
    action slot (an enable `Switch`, a remove control), with an `unavailable`
    dimmed state.
  - `ModelList` (`model-list.tsx`) - the thin presentational frame: a header
    region (title + a trailing controls slot for search / refresh), an optional
    tabs slot, and a scrollable `ItemGroup` list region. It holds no list state.
  - `ModelListSkeleton` (`model-list-skeleton.tsx`) - placeholder items whose
    shape matches `ModelListItem` (logo + two text lines + trailing control).
  - `IconChip` (`icon-chip.tsx`) - a generic tinted-icon-plus-tooltip atom the
    consumer feeds an icon, label, and tint; the reusable visual behind a
    capability chip, taxonomy-agnostic (the DS declares no capability set).
- Reuse shipped primitives rather than re-inventing them: token pills render
  through the existing `Badge`, empty states through the existing `Empty`, and
  the logo slot accepts `AiProviderIcon`.
- Ship Storybook stories and vitest specs for each new component.

## Success Criteria

- `ModelListItem` renders a model - logo slot, name, id, a meta slot, and a
  trailing action slot - with an `unavailable` state that dims it, and drops an
  `AiProviderIcon` into its logo slot without the DS importing any provider
  registry.
- `ModelList` renders the titled frame (header + trailing controls slot +
  optional tabs slot + a scrollable list region) and holds no list state - the
  consumer supplies filtered items, tab controls, and search.
- `ModelListSkeleton` renders placeholder items matching `ModelListItem`'s shape.
- `IconChip` renders a tinted icon with a tooltip from consumer-supplied
  `icon` / `label` / `tint`, and carries no built-in capability taxonomy.
- The surface stays domain-free: no `AvailableModel`, no `ModelCapability`, no
  pricing/credit types cross into `@zeroxsolutions/ui`; every model-specific
  value arrives as a prop or a slot.
- lint, build, and test are green for `@zeroxsolutions/ui`, and Storybook's
  `test-storybook` covers the new stories.

## Non-Goals

- Moving the stateful container behavior into the DS: the Enabled/Disabled
  split, capability-tab taxonomy, search filtering, refresh, and add-model form
  stay in chiselhub. `ModelList` is a presentational frame with slots, not a
  controller.
- Any app domain type in the DS - `AvailableModel`, `ModelCapability` (from
  `@zeroxsolutions/agents`), and the pricing/credit-tier model stay app-side.
- A model detail / hover-card surface and its pricing lines (`ModelHoverCard`,
  the credit/tier pricing). Deferred to a later change if a consumer needs it.
- Rewiring chiselhub's model item and list section onto the new components and
  dropping the app atoms. That lands in the chiselhub repo as a follow-up once
  this ships and chiselhub bumps `@zeroxsolutions/ui`.
- Any color-token or design-system token change: the surface uses only existing
  semantic tokens (the monochrome palette plus `--destructive`); brand color
  arrives via the logo slot.
- A new `Badge`- or `Item`-like primitive: token pills reuse `Badge`, the item
  is built on `Item`, and no look-alike is introduced.

## Capabilities

### New Capabilities

- `model-list`: a presentational, domain-free set of design-system components
  for rendering a model in a model list - a `ModelListItem` (logo / name / id /
  meta / action slots), a `ModelList` frame, a `ModelListSkeleton`, and a generic
  `IconChip` - composing shipped `@zeroxsolutions/ui` primitives and the
  `AiProviderIcon` logo, with all data and state supplied by the consumer.

### Modified Capabilities

<!-- none: no existing spec-level behavior changes -->

## Impact

- Package: `@zeroxsolutions/ui` (`packages/ui`) - new `model-list-item`,
  `model-list`, `model-list-skeleton`, and `icon-chip` components with stories
  and specs; a subsequent `nx release` so consumers can bump. Composes the
  existing `Item` / `Badge` / `Empty` / `Skeleton` / `Switch` / `Tooltip`
  primitives and `@zeroxsolutions/icons` (already a dependency).
- App: `apps/storybook` - new stories for the model-list components.
- Downstream (out of scope here): chiselhub `apps/web-app` model item, list
  section, skeleton, and chip atoms collapse onto the DS components, in a later
  chiselhub PR.
