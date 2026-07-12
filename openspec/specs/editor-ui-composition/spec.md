# editor-ui-composition Specification

## Purpose

Define how the editor composes its UI. Every editor UI surface — chrome (slash menu,
bubble menu, toolbar, block menu), per-feature UIs (link, image, embed, code-block,
mention, table), and node-view shells — is composed from the house design system
(`@zeroxsolutions/ui`), never a competing library or a hand-rolled look-alike. Bespoke
UI is confined to a positioning or focus shell the design system genuinely cannot
express, and even then only the shell mechanics are bespoke: its visible contents are
still design-system components on design-system tokens. Refactoring a surface preserves
its observable behavior.

## Requirements

### Requirement: Every editor UI surface is composed from the house design system

The editor MUST compose every UI surface it renders from the house design system
(`@zeroxsolutions/ui`): chrome (slash menu, bubble menu, toolbar, block menu),
per-feature UIs (link, image, embed, code-block, mention, table forms and pickers),
and node-view shells. It MUST NOT introduce a competing UI/component library, and no
surface may render raw markup that stands in for a design-system component.

#### Scenario: A chrome surface renders its interactive parts from the design system

- **WHEN** the slash, bubble, toolbar, or block surface is rendered
- **THEN** its buttons, list rows, pressed/toggle states, tooltips, separators,
  and empty states are design-system components, not hand-authored `<button>` /
  `<div>` equivalents

#### Scenario: A new surface reaches for the design system before writing bespoke markup

- **WHEN** a new editor UI surface is added
- **THEN** it composes the design-system component that covers the need, and only
  falls back to bespoke code under the exception below

### Requirement: No re-implementation of a component the design system already ships

An editor surface MUST NOT hand-roll a container, list, or state that duplicates a
component the design system already provides — a popover/floating surface, a
command/menu list, an empty state, a tooltip, or a pressed/toggle state. Recreating
the popover look (`bg-popover border shadow`) or building a `<button>`-row list
with hand-rolled filtering is a re-implementation and is not allowed.

#### Scenario: A filterable command list uses the design-system command component

- **WHEN** a surface needs a filtered, grouped, keyboard-navigable list of actions
- **THEN** it composes the design-system command/menu and item/empty components
- **AND** it does not hand-roll rows, grouping, or the filtered-empty state

#### Scenario: A floating surface reuses the shared shell instead of a fresh popover look

- **WHEN** a surface needs a floating panel with the popover surface styling
- **THEN** it uses the shared floating-shell/popover primitive
- **AND** no surface declares its own `bg-popover border shadow` container

### Requirement: Bespoke UI is confined to a positioning or focus shell the design system cannot express

Bespoke UI MUST be confined to a **shell** the design system genuinely cannot
express: a floating surface anchored to a **coordinate or virtual point** rather
than a DOM trigger, or a surface whose **keyboard focus is owned by another
component**. The exception SHALL cover only the positioning/focus mechanics; the
visible content inside the shell MUST still be composed from design-system
components.

#### Scenario: A caret-anchored menu keeps only its anchoring bespoke

- **WHEN** a menu must open at the text caret or selection, which has no DOM trigger
- **THEN** its anchoring uses a virtual anchor (or a minimal positioning shell)
- **AND** its rows, groups, empty state, and highlight are design-system components

#### Scenario: A surface whose keys the editor owns keeps only its key handling bespoke

- **WHEN** the editor retains keyboard focus while a list surface is open (so the
  design-system component's own input cannot own the keys)
- **THEN** only the keyboard-navigation handling is bespoke
- **AND** the list rendering (rows, groups, highlight, empty) is design-system

#### Scenario: A node-view shell that cannot compose inside the engine is a documented exception

- **WHEN** a node-view shell (callout, toggle) cannot host a design-system
  component inside the engine's content container (`NodeViewContent`), confirmed by
  a spike
- **THEN** the bespoke shell is retained and recorded as an allowed exception under
  this requirement, not silently reintroduced elsewhere

### Requirement: A bespoke shell still renders design-system components on design-system tokens

Even a sanctioned bespoke shell MUST render only design-system components inside it
and SHALL ride the design-system token set, flipping light/dark via the `dark`
variant. A bespoke shell MUST NOT introduce a parallel visual style (its own colors,
spacing, or elevation values outside the tokens).

#### Scenario: The floating shell's visuals come from tokens

- **WHEN** the shared floating shell paints its surface, border, and elevation
- **THEN** those values come from design-system tokens (so it flips with `.dark`)
- **AND** its contents are design-system components, not token-divergent markup

### Requirement: Refactoring a surface preserves its observable behavior

Replacing a surface's bespoke markup with design-system components MUST NOT regress
the surface's observable behavior — its trigger, selection handling, keyboard
navigation, viewport-aware positioning, and accessibility states are unchanged.

#### Scenario: The refactored slash menu keeps its behavior

- **WHEN** the slash menu is recomposed from design-system components
- **THEN** the inline `/` trigger stays visible, the query filters the list, the
  typed `/query` range is deleted on select, the popup stays inside the viewport,
  and keyboard nav (↑/↓, Enter/Tab, Esc) still works

#### Scenario: The build gates stay green after a surface refactor

- **WHEN** a surface has been refactored
- **THEN** `nx run-many -t build test` passes and the engine-free `.d.ts`
  assertion (`assert-engine-free-dts`) still finds no engine types in the public API
