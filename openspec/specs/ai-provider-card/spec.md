# ai-provider-card Specification

## Purpose

Define `@zeroxsolutions/ui`'s `AiProviderCard` - a domain-free design-system card for presenting
one AI provider as a tile in a grid. It composes the shipped `Card` at its variants: a leading
icon slot plus the provider name in a header, a description clamped to two lines with a reserved
minimum height so tiles align, and a footer carrying a muted meta note (or a tone-styled status)
on the left and a trailing action slot on the right. The whole card is the selection target while
the trailing control lives on an island that stops click propagation. The card holds no
AI-provider domain knowledge - the brand mark and the trailing control are consumer-supplied
nodes - so the provider domain (which vendors exist, brand-logo resolution, connection state)
stays in the consuming app.

## Requirements

### Requirement: Provider tile layout

`AiProviderCard` SHALL present one AI provider as a grid tile composed of a leading icon slot and the provider name in a header, a description body, and a footer. The description SHALL clamp to two lines and reserve a fixed minimum height so tiles in a grid align regardless of description length.

#### Scenario: A provider with name, icon, and description

- **WHEN** the card is rendered with `name`, an `icon` node, and a `description`
- **THEN** the icon and the name appear together in the header, and the description appears below it clamped to two lines

#### Scenario: Descriptions of differing length keep tiles aligned

- **WHEN** two cards render side by side, one with a one-line description and one with a three-line description
- **THEN** both cards reserve the same description height so their footers align

#### Scenario: A provider with no description

- **WHEN** the card is rendered without a `description`
- **THEN** the header and footer still render, and the reserved description height is preserved so alignment holds

### Requirement: Domain-free composition

`AiProviderCard` SHALL be free of any AI-provider domain knowledge. It SHALL NOT import from `@zeroxsolutions/icons`, SHALL NOT define a provider or preset registry, and SHALL NOT resolve a brand mark itself. The brand mark SHALL be supplied by the consumer as an `icon` node, and the trailing control SHALL be supplied by the consumer as an `action` node.

#### Scenario: Consumer supplies the brand mark

- **WHEN** a consumer passes a brand mark element as `icon`
- **THEN** the card renders that element verbatim in the header, applying no fallback and no brand resolution

#### Scenario: No icon supplied

- **WHEN** the card is rendered without an `icon`
- **THEN** the card renders the header without fabricating a placeholder mark

### Requirement: Whole-card selection with an isolated action

The whole card SHALL act as the selection target: clicking it SHALL invoke `onSelect`. Interacting with the trailing `action` control SHALL NOT invoke `onSelect` - the action occupies an island that stops click propagation.

#### Scenario: Clicking the card body selects it

- **WHEN** `onSelect` is provided and the user clicks the card body
- **THEN** `onSelect` is invoked

#### Scenario: Interacting with the action does not select the card

- **WHEN** `onSelect` is provided and the user activates the control passed as `action`
- **THEN** the action's own handler runs and `onSelect` is NOT invoked

### Requirement: Footer meta and status

The footer SHALL show, on its left, a muted meta note when `meta` is provided. When a `status` with a tone and text is provided, it SHALL replace the meta note and be styled by tone using semantic tokens (never a hardcoded colour). The trailing `action` node SHALL sit at the footer's right edge.

#### Scenario: Meta note shown

- **WHEN** `meta` is provided and no `status` is provided
- **THEN** the footer-left shows the meta note in a muted style

#### Scenario: Status overrides meta

- **WHEN** both `meta` and a `status` are provided
- **THEN** the footer-left shows the status text styled by its tone, and the meta note is not shown

### Requirement: House primitive fidelity

`AiProviderCard` SHALL compose the shipped `Card` at its variants and confine `className` to layout. It SHALL NOT override a primitive's internal appearance (size, spacing, radius, colour, font, icon-size) via `className`, and SHALL express colour only through semantic tokens so light/dark themes hold.

#### Scenario: Renders on card tokens in both themes

- **WHEN** the card renders under the light theme and under the `.dark` theme
- **THEN** its surface, text, and status tones read from the design-system tokens with no hardcoded hex or palette colour
