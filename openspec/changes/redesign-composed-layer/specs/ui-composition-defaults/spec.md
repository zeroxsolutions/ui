## ADDED Requirements

### Requirement: Every authored component composes classes through cn()

Every authored component MUST build its class strings through `cn()` and forward a
consumer-supplied `className` into that call, so a passed `className` tailwind-merges and
can override the component's own classes. Hand-joined class strings (for example
`[...].filter(Boolean).join(' ')`) are not allowed; `cn()` is the single class-merge
helper.

#### Scenario: A consumer overrides a class

- **WHEN** a consumer passes a `className` that conflicts with one of the component's own
  utility classes
- **THEN** the passed class wins, because both were merged through `cn()`.

#### Scenario: No hand-joined class strings

- **WHEN** an authored component assembles conditional classes
- **THEN** it uses `cn()` and never a hand-rolled join such as
  `[...].filter(Boolean).join(' ')`.

#### Scenario: The cn helper is shared, not copied

- **WHEN** a package needs the class-merge helper
- **THEN** it imports `cn` from `@zeroxsolutions/ui/lib/utils` and does not declare its
  own copy.

### Requirement: A compound component ships as one file with all parts co-located

A compound component (a root plus its named sub-parts - the shadcn `sidebar` /
`dropdown-menu` pattern) MUST ship as a **single** root file `<root-kebab>.tsx` containing
the root AND every part, exported together from one `export { ... }` block at the end of
the file. Each part symbol MUST follow `<Root><Part>` (e.g. `SidebarHeader`,
`DropdownMenuItem`, `ModelListItem`). A part MUST NOT be split into its own
`<root>-<part>.tsx` file. A genuinely reusable, non-compound component (used outside the
compound - e.g. a `Badge` used by many surfaces) stays in its own file.

#### Scenario: A compound's parts are co-located

- **WHEN** a compound component is authored (root plus named parts)
- **THEN** the root and every part live in one `<root-kebab>.tsx` file and are exported
  from one `export { ... }` block, matching the shadcn `sidebar` / `dropdown-menu` pattern.

#### Scenario: A part is not split into its own file

- **WHEN** a part belongs to a compound (e.g. a list item and its skeleton belong to the
  list compound)
- **THEN** it lives in the compound's root file as `<Root><Part>`, never in a separate
  `<root>-<part>.tsx` file.

#### Scenario: A reusable non-compound component stays separate

- **WHEN** a component is genuinely reusable outside one compound (e.g. a generic chip used
  by several surfaces)
- **THEN** it stays in its own file and is not forced into any single compound's file.

### Requirement: A component file uses plain declarations with one trailing export block

An authored component file MUST declare its symbols as plain `function`/`const` and export
them from a single `export { ... }` block at the end of the file (the shadcn house style
seen in `card.tsx`, `item.tsx`, `button.tsx`), not as inline `export function` per symbol.

#### Scenario: A file exports its symbols

- **WHEN** a component or compound file exports its root and parts
- **THEN** it uses plain declarations with one trailing `export { ... }` block, matching
  the vendored house style.

### Requirement: Variants are declared with cva and exported for reuse

An authored component that has visual variants (size, tone, emphasis) MUST declare them
with `cva` as a `<Component>Variants` symbol, select among them by variant prop, and
export the variants symbol so consumers can reuse it - never hand-roll conditional
className with a template-literal ternary, and never declare a bespoke variant vocabulary
that restates a composed primitive's variants (delegate to the primitive instead). A
component MUST also forward a consumer `className` through `cn()` so a passed class can
override, and its color MUST come from a semantic token, never a hardcoded value.

#### Scenario: A component offers multiple variants

- **WHEN** an authored component renders in more than one size or tone
- **THEN** the variants are a `cva` `<Component>Variants`, selected by prop and exported
  for reuse.

#### Scenario: Conditional classes are assembled

- **WHEN** an authored component applies a class conditionally (e.g. rotate when open)
- **THEN** it merges through `cn(..., open && 'rotate-90')`, never a template-literal
  ternary.

#### Scenario: A consumer overrides styling

- **WHEN** a consumer passes a `className` to an authored component
- **THEN** the component forwards it through `cn()` so it can override the component's own
  classes, and the component's `Props` extends the native element props (not a closed
  interface).
