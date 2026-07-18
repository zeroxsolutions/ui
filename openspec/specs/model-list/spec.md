# model-list Specification

## Purpose

Define `@zeroxsolutions/ui`'s model-list surface - a domain-free set of
design-system components for listing models: `ModelListItem` (one model as a
horizontal item with a leading media slot, a name over its id, a meta slot for
chips, and a trailing action slot), `ModelList` (the titled section frame - header
with a controls slot, an optional tabs slot, and a scrollable list region - that
owns no list state), `ModelListSkeleton` (loading placeholders that mirror the item
shape), and `IconChip` (a generic tinted-icon-with-tooltip chip). Every
model-specific value (name, id, logo, chips, availability) arrives as a prop or slot,
and the surface reuses the shipped `Badge` and `Empty` primitives rather than a
look-alike - so the model catalog, its capability taxonomy, and its pricing stay in
the consuming app.

## Requirements

### Requirement: Render a model as a list item

`ModelListItem` MUST render one model as a horizontal list item carrying a
leading media slot, the model name, the model id, a meta slot for chips, and a
trailing action slot. The name and id MUST be distinct so the id reads as a
secondary line under the name.

#### Scenario: Item shows name, id, and the supplied slots

- **WHEN** `ModelListItem` is given a `name`, an `id`, a media node, a meta node, and an action node
- **THEN** it renders the name as the primary line and the id as a secondary line
- **AND** it renders the media node in the leading slot, the meta node, and the action node in the trailing slot

#### Scenario: Optional slots are omitted cleanly

- **WHEN** `ModelListItem` is given only a `name` and an `id`
- **THEN** it renders the item with no media, meta, or action, and does not throw

### Requirement: Fill the logo slot from a consumer-supplied node

`ModelListItem` MUST accept its leading logo as a consumer-supplied node and
render it verbatim, applying no provider resolution or fallback of its own. An
`AiProviderIcon` from `@zeroxsolutions/icons` MUST be a valid node for that slot.

#### Scenario: AiProviderIcon in the media slot

- **WHEN** an `AiProviderIcon` node is passed as the item's media
- **THEN** the item renders that icon in its leading slot unchanged
- **AND** the item resolves no provider key and imports no provider registry itself

### Requirement: Dim an unavailable model

`ModelListItem` MUST accept an `unavailable` state that visually dims the item to
signal the model cannot be used, while keeping the model listed. When
`unavailable`, the trailing enable control MUST render in a non-interactive
(disabled) form.

#### Scenario: Unavailable item is dimmed and its toggle disabled

- **WHEN** `ModelListItem` is rendered with `unavailable` set
- **THEN** the item is visually dimmed
- **AND** a trailing enable control is rendered disabled

### Requirement: Render the model list frame without owning list state

`ModelList` MUST render the titled section frame: a header region carrying a
title and a trailing controls slot, an optional tabs slot below the header, and
a scrollable list region for its children. `ModelList` MUST NOT own list state -
it MUST NOT filter, group, sort, or paginate its children; the consumer supplies
already-prepared children and any controls.

#### Scenario: Frame renders title, controls, tabs, and children

- **WHEN** `ModelList` is given a `title`, a controls node, a tabs node, and item children
- **THEN** it renders the title and controls in the header, the tabs below the header, and the children in the scrollable list region

#### Scenario: Frame does not transform children

- **WHEN** `ModelList` is given a set of item children
- **THEN** it renders exactly those children in order, without filtering, grouping, or reordering them

### Requirement: Render loading placeholders that match the item shape

`ModelListSkeleton` MUST render placeholder items whose shape mirrors
`ModelListItem` - a leading media placeholder plus two stacked text-line
placeholders and a trailing control placeholder - and MUST accept a configurable
item count.

#### Scenario: Skeleton renders the requested number of placeholder items

- **WHEN** `ModelListSkeleton` is rendered with an item count
- **THEN** it renders that many placeholder items, each with a media placeholder, two text-line placeholders, and a trailing control placeholder

### Requirement: Provide a generic tinted-icon chip

`IconChip` MUST render a tinted icon with a tooltip from consumer-supplied
`icon`, `label`, and `tint` values. `IconChip` MUST NOT declare or assume any
model capability taxonomy - the consumer decides which icon, label, and tint
represent a given concept.

#### Scenario: Chip renders the supplied icon, tint, and tooltip

- **WHEN** `IconChip` is given an `icon`, a `label`, and a `tint`
- **THEN** it renders the icon in a container styled by the tint
- **AND** the `label` is available as the chip's tooltip

#### Scenario: Chip carries no built-in capability set

- **WHEN** `IconChip` is rendered
- **THEN** it exposes no predefined capability list and requires the caller to supply every icon, label, and tint

### Requirement: Keep the surface domain-free and reuse shipped primitives

The `model-list` surface MUST render without importing any application domain
type - no model-catalog type, no capability enum, and no pricing/credit type MUST
cross into `@zeroxsolutions/ui`; every model-specific value MUST arrive as a prop
or a slot. Token-style pills and empty states MUST reuse the shipped `Badge` and
`Empty` primitives rather than a new look-alike component.

#### Scenario: No application domain type in the surface

- **WHEN** the `model-list` components are built
- **THEN** they compile against only `@zeroxsolutions/ui` primitives, `@zeroxsolutions/icons`, and React, with no application model, capability, or pricing type imported

#### Scenario: Pills and empty states reuse shipped primitives

- **WHEN** a consumer renders token pills or an empty state around the model list
- **THEN** it does so with the shipped `Badge` and `Empty` primitives, and the `model-list` surface introduces no `Badge`- or `Item`-like replacement
