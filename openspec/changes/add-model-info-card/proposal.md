## Why

The `model-list` change shipped `ModelListItem` / `ModelList`, but hovering a
model shows nothing - the detail panel was a deliberate non-goal there. chiselhub
has that panel: a `ModelInfoCard` shown inside a `HoverCard` (LobeHub
`ModelSwitchPanel.detail` style) carrying the model's identity, context length,
abilities with descriptions, and credit pricing. It lives in the app and couples
to app types (`AvailableModel`, `ModelCapability`, the credit-pricing model).

`@zeroxsolutions/ui` already ships every primitive the panel needs - `HoverCard`,
`Item` / `ItemGroup`, `Tooltip`, plus the `IconChip` from `model-list`. What is
missing is the domain-free info-card **layout**: the identity header and the
titled, accent-barred sections. Adding a `ModelInfoCard` gives one shared,
domain-free detail panel that drops into the shipped `HoverCard`, so hovering a
`ModelListItem` can show model detail - and lets chiselhub's app panel collapse
onto it.

## What Changes

- Add a `model-info-card` compound to `@zeroxsolutions/ui`
  (`packages/ui/src/components/model-info-card.tsx`), presentational and
  domain-free, following the `card.tsx` compound convention (one file, sub-parts
  named `ModelInfoCard*`, each `data-slot`-tagged, `export { ... }` at the end):
  - `ModelInfoCard` - the detail panel content: an identity header (a media slot
    for the logo, the model name, its vendor, and the `modelId`) over a `children`
    body. It is a content block rendered inside the shipped `HoverCardContent`.
  - `ModelInfoCardSection` - a titled section: an accent bar plus a title and an
    optional trailing value, over its `children` (the detail lines).
- Detail lines reuse the shipped `Item` (`size="xs"`) plus `IconChip` - no new
  line component is introduced (a line is an `Item` by role).
- The hover trigger reuses the shipped `HoverCard`: the consumer wraps a
  `ModelListItem` in `HoverCardTrigger` and renders `ModelInfoCard` in
  `HoverCardContent`. No `ModelHoverCard` wrapper is added.
- Ship Storybook stories and vitest specs.

## Success Criteria

- `ModelInfoCard` renders an identity header - a logo slot, the model name, its
  vendor, and the `modelId` - over its `children` body.
- `ModelInfoCardSection` renders an accent bar, a title, an optional trailing
  value, and its `children`.
- `ModelInfoCard` drops into the shipped `HoverCardContent`, and a `ModelListItem`
  wrapped in `HoverCardTrigger` shows the panel on hover.
- A detail line is composed from the shipped `Item` plus `IconChip`; the change
  adds no line/row component and no `HoverCard` wrapper.
- The surface stays domain-free: no `AvailableModel`, `ModelCapability`, or
  pricing/credit type crosses into `@zeroxsolutions/ui`; every model value
  arrives as a prop, slot, or child.
- lint, build, and test are green for `@zeroxsolutions/ui`, and Storybook's
  `test-storybook` covers the new stories.

## Non-Goals

- The app's data mapping stays in chiselhub: turning `capabilities` into ability
  rows, `creditPricing` into pricing rows, and formatting the context length are
  app concerns, not the DS's.
- No `ModelHoverCard` component - the hover mechanism is the shipped `HoverCard`.
- No line/row component - a detail line is the shipped `Item` (`size="xs"`) plus
  `IconChip`; the DS adds no `Item` look-alike.
- Any color-token or design-system token change: the section accent bar and chip
  tints are consumer-supplied classes, keeping the DS itself monochrome.
- Wiring chiselhub's app `ModelInfoCard` onto the DS component and dropping its
  app helpers - a follow-up in the chiselhub repo once this ships.

## Capabilities

### New Capabilities

- `model-info-card`: a presentational, domain-free detail panel for a model - a
  `ModelInfoCard` (identity header + body) and a `ModelInfoCardSection` (accent
  bar + title + value + rows) - shown inside the shipped `HoverCard`, with detail
  lines composed from the shipped `Item` and `IconChip` and all data supplied by
  the consumer.

### Modified Capabilities

<!-- none: no existing spec-level behavior changes -->

## Impact

- Package: `@zeroxsolutions/ui` (`packages/ui`) - new `model-info-card`
  compound (`ModelInfoCard` + `ModelInfoCardSection`) with a story and spec; a
  subsequent `nx release`. Composes the existing `HoverCard`, `Item` / `ItemGroup`
  primitives and the `IconChip` from `model-list`.
- App: `apps/storybook` - a new story wiring `ModelListItem` in a `HoverCard`
  trigger with `ModelInfoCard` content.
- Downstream (out of scope here): chiselhub `apps/web-app` `ModelInfoCard`
  collapses onto the DS component, in a later chiselhub PR.
