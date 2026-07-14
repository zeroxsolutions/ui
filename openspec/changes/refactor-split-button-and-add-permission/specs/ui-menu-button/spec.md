## ADDED Requirements

### Requirement: The menu button is a remembered-default split control on `ButtonGroup`

`@zeroxsolutions/ui` MUST ship a `MenuButton` compound - a single divided control built on
`ButtonGroup` (one seamed unit, like `SplitButton`) whose primary segment repeats the
**currently-selected** action and whose caret opens a menu that **changes which action is
current** (arms it) rather than firing it. It MUST be distinct from `SplitButton` (whose primary
is a fixed default and whose menu items fire on selection). It MUST be authored as compound parts
(`MenuButton`, `MenuButtonAction`, `MenuButtonMenu`, `MenuButtonTrigger`, `MenuButtonContent`,
`MenuButtonRadioGroup`, `MenuButtonRadioItem`), not a prop-bag, using Base UI `render` (never
Radix `asChild`), living in the composed layer.

#### Scenario: The primary repeats the current action

- **WHEN** a `MenuButton` is rendered with a current value and the user clicks the primary segment
- **THEN** the current action runs (the primary's label reflects the current value)

#### Scenario: The caret menu changes the current action rather than firing it

- **WHEN** the user opens the caret menu and selects a different item
- **THEN** that item becomes the current (checked) action - it does **not** run the action
- **AND** the user must click the primary to run the newly-armed action

### Requirement: The current selection rides the Base UI menu radio group

`MenuButton`'s current-action state MUST be expressed through the design-system
`DropdownMenu` radio group (`MenuButtonRadioGroup` / `MenuButtonRadioItem`) - a controlled
`value` + `onValueChange` - so the checked item is the current default. It MUST NOT hand-roll a
React context to share the selection across the parts. The consumer owns `value` and threads it to
both the primary (label + action) and the radio group.

#### Scenario: The current value is the checked default

- **WHEN** a `MenuButton`'s current value is a given scope and the menu is open
- **THEN** that scope's radio item is checked (`aria-checked="true"`) and the others are not
