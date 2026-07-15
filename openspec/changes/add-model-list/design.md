## Context

chiselhub's "model in a model list" is a stack of app components under
`apps/web-app`: the model item, the list section, a loading skeleton, a
tinted-icon chip atom, and a token-pill atom. Each is a thin composition of
`@zeroxsolutions/ui` primitives (`Item`, `Switch`, `Tooltip`, `Badge`, `Empty`,
`Skeleton`, `ItemGroup`) plus a couple of app atoms, but it lives in the app.

The design system already ships the shape one layer up: `AiProviderCard`
(`packages/ui/src/components/ai-provider-card.tsx`) is a domain-free composed
surface built on the `Card` primitive, whose brand mark and trailing control are
consumer-supplied `React.ReactNode` slots ("the consumer supplies the mark and
control", "applies no fallback"). `@zeroxsolutions/ui` already depends on
`@zeroxsolutions/icons`, and this repo just shipped `AiProviderIcon` there.

This change extracts the presentational shell into a `model-list` surface beside
`AiProviderCard`, following the same conventions: `function` component,
`data-slot` attribute, `React.ComponentProps<'div'>` base, `cn` + semantic
tokens, `export { X }` at the file end, one kebab-case file per component, a
co-located `*.spec.tsx`, and a Storybook story under `apps/storybook/src`.

## Goals / Non-Goals

**Goals:**

- Ship `ModelListItem`, `ModelList`, `ModelListSkeleton`, and `IconChip` as
  presentational, domain-free components in `@zeroxsolutions/ui`.
- Keep the surface capability-taxonomy-agnostic: no `ModelCapability`, no
  `AvailableModel`, no pricing/credit type crosses into the DS.
- Compose shipped primitives (`Item`, `Badge`, `Empty`, `Skeleton`, `Switch`,
  `Tooltip`) and the `AiProviderIcon` logo; introduce no `Badge`/`Item`
  look-alike.
- Let chiselhub's model item and list section collapse onto these once released.

**Non-Goals:**

- The stateful container behavior (Enabled/Disabled grouping, capability-tab
  taxonomy, search filtering, refresh, add-model) - stays in chiselhub.
- A model detail / hover-card surface and its pricing lines - a later change.
- Rewiring chiselhub - a follow-up PR after `@zeroxsolutions/ui` releases.

## Decisions

### D1 - Configured slot props, not a new compound; built on the shipped `Item`

`ModelListItem` follows `AiProviderCard`'s pattern: a single `function` component
taking flat props and `React.ReactNode` slots, tagged `data-slot`, composing an
existing primitive internally. The DS already ships the compound (`Item`,
`ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`); the
new component is a configured convenience over it, exactly as `AiProviderCard` is
over `Card`. It does not re-export a new `ModelListItem.Media` sub-component set.

```ts
export interface ModelListItemProps
  extends Omit<React.ComponentProps<'div'>, 'id' | 'title'> {
  /** Primary line - the model display name. */
  name: React.ReactNode
  /** Secondary line under the name - the model id. */
  modelId?: React.ReactNode
  /** Leading logo slot, rendered verbatim (e.g. <AiProviderIcon .../>). */
  media?: React.ReactNode
  /** Meta region before the controls - capability / token chips. */
  meta?: React.ReactNode
  /** Enable toggle state. Omit onEnabledChange to render the Switch read-only. */
  enabled?: boolean
  onEnabledChange?: (enabled: boolean) => void
  /** Show a trailing remove control when provided. */
  onRemove?: () => void
  /** Extra trailing content, before the toggle (escape hatch). */
  action?: React.ReactNode
  /** Dim the item and disable the toggle - listed but unusable. */
  unavailable?: boolean
}
```

Internally: `<Item variant="default" size="sm" data-slot="model-list-item"
className={cn(unavailable && 'opacity-55', className)}>` wrapping `ItemMedia`
(media), `ItemContent` (`ItemTitle` name, `ItemDescription` modelId), and
`ItemActions` (meta, action, the `Switch`, the remove `Button`).

`modelId` (not `id`) names the id line so it never collides with the DOM `id`
on the spread `React.ComponentProps<'div'>`; `title` is omitted for the same
reason (it is the native tooltip attribute).

### D2 - The item owns the enable + remove affordances (faithful, still domain-free)

The item renders the enable `Switch` and remove `Button` itself from
`enabled` / `onEnabledChange` / `onRemove`, mirroring chiselhub's model item
(`onToggle` / `onRemove`) one-to-one but with no app type. This lets the DS own
the `unavailable -> Switch disabled` behavior (`disabled={!onEnabledChange ||
unavailable}`) that a pure opaque slot could not enforce, and makes chiselhub's
item collapse to a single `<ModelListItem ... />`. The `action` slot remains as
an escape hatch for anything extra. This matches `AiProviderCard`, which also
owns behavior (`onSelect`) alongside an `action` slot.

### D3 - Capability chips are generic `IconChip`s the consumer feeds; taxonomy stays app-side

`@zeroxsolutions/ui` cannot depend on `@zeroxsolutions/agents`, so the DS ships
no `ModelCapability` set. `IconChip` is the reusable tinted-icon-plus-tooltip
visual; the consumer supplies the `icon`, `label`, and `tint` for each concept.
chiselhub keeps its `ABILITIES` table and renders each ability through
`IconChip`. `tint` is a consumer-supplied className (e.g.
`'bg-emerald-500/15 text-emerald-600'`), which keeps the DS itself monochrome -
the color arrives from the consumer, not a DS token (see the monochrome-DS rule).

```ts
export interface IconChipProps extends React.ComponentProps<'span'> {
  /** The glyph node, sized by the caller (e.g. <Eye className="size-3" />). */
  icon: React.ReactNode
  /** Tooltip text. */
  label: React.ReactNode
  /** Consumer className for the tinted container (bg + text color). */
  tint?: string
}
```

`icon` is a `React.ReactNode` (not a `LucideIcon` type) so the chip couples to no
icon library; the caller passes an already-sized element.

### D4 - `ModelList` is a presentational frame with slots, holding no list state

`ModelList` renders the header (title + a trailing `controls` slot), an optional
`tabs` slot, and a scrollable region for `children`. It does not filter, group,
sort, or paginate - the consumer supplies prepared children (its `ItemGroup`s,
its `Empty`, its `ModelListSkeleton`) and the controls. This keeps the app's
capability-tab taxonomy, Enabled/Disabled split, search, refresh, and add-model
out of the DS.

```ts
export interface ModelListProps extends React.ComponentProps<'div'> {
  /** Header title (e.g. "Model list"). */
  title?: React.ReactNode
  /** Trailing header slot - search, refresh, etc. */
  controls?: React.ReactNode
  /** Optional tab bar rendered below the header. */
  tabs?: React.ReactNode
  /** The scrollable list region content. */
  children?: React.ReactNode
}
```

### D5 - Reuse shipped primitives; add no look-alike

Token pills render through the shipped `Badge` (a mono/secondary variant), empty
states through the shipped `Empty`, loading through `Skeleton`. The change adds
no `Badge`- or `Item`-like component (a prior `MonoChip` look-alike was rejected
for being "essentially a Badge"). `ModelListSkeleton` composes `Skeleton` into a
shape matching `ModelListItem`.

```ts
export interface ModelListSkeletonProps extends React.ComponentProps<'div'> {
  /** Number of placeholder items. Defaults to 6. */
  count?: number
}
```

### D6 - Placement, exports, and tests

Files land in `packages/ui/src/components/` (composed surfaces, beside
`ai-provider-card.tsx`), not `components/ui/` (primitives). Each is kebab-cased
(`model-list-item.tsx`, `model-list.tsx`, `model-list-skeleton.tsx`,
`icon-chip.tsx`), exports its symbol at the file end, carries a co-located
`*.spec.tsx` (vitest + Testing Library, the workspace runner), and gets a
Storybook story under `apps/storybook/src`. Subpath exports follow the package's
existing map - verify against `packages/ui/package.json` during apply and add
per-file entries only if the map is not already a `./*` wildcard.

## Risks / Trade-offs

- **Owning the Switch/remove (D2) is more opinionated than a pure slot.** Trade
  accepted: it is faithful to the source, lets the DS enforce
  `unavailable -> disabled`, and cuts consumer boilerplate; the `action` slot is
  the escape hatch for anything beyond the two common affordances.
- **`ModelList` statelessness (D4) means the consumer re-implements grouping,
  tabs, and search.** Trade accepted: pulling the app's capability taxonomy into
  the DS would break the domain-free contract; chiselhub keeps its container and
  swaps only the item + atoms.
- **`IconChip.tint` is a consumer Tailwind class (D3).** It leaks a styling
  contract to the caller, but keeps the DS monochrome and the taxonomy app-side;
  chiselhub already models tints this way.
- **A new Storybook story adds to the pre-existing storybook typecheck baseline**
  (unrelated stories already error). The new stories must add no new error;
  the pre-commit gate runs `lint build test`, which storybook is not part of.

## State Model

Only `ModelListItem` is interactive, and it is controlled: `enabled` is a prop,
`onEnabledChange` reports intent, and the parent owns the value. With no
`onEnabledChange`, or when `unavailable`, the `Switch` is disabled/read-only.
`ModelList` and `ModelListSkeleton` are stateless. `IconChip`'s only runtime
state is the `Tooltip`'s open/closed, owned by the shipped `Tooltip` primitive.

## Migration Plan

1. Ship the four components + stories + specs in `@zeroxsolutions/ui`; green
   `lint build test`; `nx release` so consumers can bump.
2. (Out of scope, chiselhub PR) Bump `@zeroxsolutions/ui`; replace the app's
   model item with `ModelListItem` (logo slot = `AiProviderIcon`), render each
   ability through `IconChip`, token pills through `Badge`, the list section
   through `ModelList`, and loading through `ModelListSkeleton`; delete the app
   atoms that the DS now covers. The stateful container logic stays in the app.

## Open Questions

- Whether a later `ModelHoverCard` (model detail + credit/tier pricing) is
  wanted in the DS, or stays app-side. Deferred; not blocking this change.
