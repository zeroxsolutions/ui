## ADDED Requirements

### Requirement: The split button is one divided control built on `ButtonGroup`

`@zeroxsolutions/ui` MUST ship a `SplitButton` that renders as a single divided control - a
shared rounded outline with a visible seam, outer corners rounded and inner corners squared -
by composing the design-system `ButtonGroup` (and `ButtonGroupSeparator`), NOT two independent
buttons in a bare `flex`. The primary action segment and the caret segment MUST be adjacent
siblings inside the group so its radius/border-collapse selectors apply.

#### Scenario: The two segments read as one unit

- **WHEN** a `SplitButton` renders a primary segment and a caret segment
- **THEN** they share one rounded outline with a seam between them, the outer corners rounded and
  the inner corners squared
- **AND** the join is produced by composing `ButtonGroup`, not by hand-rolled radius/border
  classes on two loose buttons

#### Scenario: The primary segment can carry a label

- **WHEN** a caller renders `SplitButton` with a text label on the primary segment
- **THEN** the primary shows the label (it is not restricted to an icon-only button)

### Requirement: The split button is a compound of `data-slot` parts, not a prop-bag

`SplitButton` MUST be authored as a Root plus named sub-parts - a primary-action part, a menu
part, a caret trigger part, a content part, and item parts - so a consumer arranges (and can
inject arbitrary controls into) the parts. It MUST NOT take its slots as props (no `options` /
`onPrimary` / `extraItems` prop-bag). Each **authored** part carries a `data-slot` - the two
authored buttons are tagged `data-slot="split-button-action"` / `data-slot="split-button-trigger"`;
the Root and the menu parts **retain the composed primitive's own functional `data-slot`**
(`button-group`, `dropdown-menu-*`), because the child buttons' `in-data-[slot=button-group]`
radius hooks depend on the Root staying `data-slot="button-group"` - overriding it would break the
seam. Polymorphism MUST use Base UI `render`, never Radix `asChild`. The component MUST live in the
composed component layer, never in the vendored `components/ui/*` layer.

#### Scenario: A consumer composes the parts

- **WHEN** a consumer builds a split button
- **THEN** it renders a Root with a primary-action part and a menu part holding a caret trigger
  and item parts, arranging them as children
- **AND** it does not pass an options array or slot render-props to a monolithic component

#### Scenario: The caret's open state rides the Base UI menu

- **WHEN** the caret segment is activated
- **THEN** its dropdown open/closed state is owned by the wrapped Base UI menu primitive
- **AND** no hand-rolled React context or prop-drilled `open` boolean coordinates the parts

### Requirement: The split button carries no bespoke variant vocabulary

`SplitButton` MUST NOT declare its own `cva` variant set. It MUST delegate all visual styling to
the `ButtonGroup` and `Button` primitives it composes; a matched `variant`/`size` is set on the
primary and caret parts (or defaulted to a matched pair), and `ButtonGroup` joins them. Colour on
any part MUST be a semantic token, never a hardcoded hex or palette value.

#### Scenario: Styling comes from the composed primitives

- **WHEN** a `SplitButton` is styled at a variant and size
- **THEN** the appearance is produced by the `Button`/`ButtonGroup` variants on its parts
- **AND** no `splitButtonVariants` cva is introduced to restate that vocabulary

### Requirement: The split button uses classic action-plus-variants semantics

`SplitButton`'s primary segment MUST run a fixed action, and each menu item MUST invoke its own
handler for a related variant of that action. It MUST NOT implement the remembered-default toggle
semantic (a `value` the menu switches via `onValueChange` while the primary repeats the current
option).

#### Scenario: Primary runs the default, items run variants

- **WHEN** the user activates the primary segment
- **THEN** the fixed default action runs
- **WHEN** the user selects a menu item instead
- **THEN** that item's own variant handler runs, rather than merely changing which option the
  primary would run next
