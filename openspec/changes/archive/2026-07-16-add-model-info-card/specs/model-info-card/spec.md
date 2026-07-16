## ADDED Requirements

### Requirement: Render a model identity header

`ModelInfoCard` MUST render an identity header carrying a leading media slot
(the provider logo), the model name, the model vendor, and the `modelId`, over a
`children` body. The media MUST be a consumer-supplied node rendered verbatim,
with no provider resolution of its own.

#### Scenario: Header shows logo, name, vendor, and id

- **WHEN** `ModelInfoCard` is given a media node, a `name`, a `vendor`, and a `modelId`, plus body `children`
- **THEN** it renders the media in the leading slot, the name, the vendor, and the `modelId`, followed by the `children`

#### Scenario: Media is rendered verbatim

- **WHEN** an `AiProviderIcon` node is passed as the card's media
- **THEN** the card renders that node unchanged and resolves no provider key itself

### Requirement: Render a titled, accent-barred section

`ModelInfoCardSection` MUST render a section header consisting of an accent bar,
a title, and an optional trailing value, followed by its `children` (the detail
lines). The accent colour MUST be a consumer-supplied class, so the design system
itself ships no colour.

#### Scenario: Section shows accent, title, value, and children

- **WHEN** `ModelInfoCardSection` is given an accent class, a `title`, a `value`, and `children`
- **THEN** it renders an accent bar styled by the class, the title, the value, and the children

#### Scenario: Value is optional

- **WHEN** `ModelInfoCardSection` is given a `title` and `children` but no `value`
- **THEN** it renders the header with no trailing value and does not throw

### Requirement: Show the panel inside the shipped HoverCard

`ModelInfoCard` MUST render as standalone content suitable for the shipped
`HoverCardContent`, so a consumer can wrap any node (e.g. a `ModelListItem`) in
`HoverCardTrigger` and show the panel on hover. The change MUST NOT add a
`HoverCard` wrapper component of its own.

#### Scenario: Panel shown on hovering a trigger

- **WHEN** a `ModelListItem` is wrapped in `HoverCardTrigger` and `ModelInfoCard` is rendered in `HoverCardContent`
- **THEN** hovering the item reveals the `ModelInfoCard` panel
- **AND** the surface introduces no `HoverCard`-like wrapper component

### Requirement: Compose detail lines from the shipped Item

A detail line inside a section - an icon, a label, and an optional value - MUST be
composed from the shipped `Item` plus `IconChip`. The `model-info-card` surface
MUST NOT introduce a line or row component of its own, since a line is an `Item`
by role.

#### Scenario: A detail line is an Item, not a new component

- **WHEN** a consumer renders an ability or pricing line inside a `ModelInfoCardSection`
- **THEN** it does so with the shipped `Item` and `IconChip`
- **AND** the `model-info-card` surface exports no line or row component

### Requirement: Keep the surface domain-free

The `model-info-card` surface MUST render without importing any application
domain type - no model-catalog type, no capability enum, and no pricing/credit
type MUST cross into `@zeroxsolutions/ui`; every model value MUST arrive as a
prop, a slot, or a child.

#### Scenario: No application domain type in the surface

- **WHEN** the `model-info-card` components are built
- **THEN** they compile against only `@zeroxsolutions/ui` primitives and React, with no application model, capability, or pricing type imported
