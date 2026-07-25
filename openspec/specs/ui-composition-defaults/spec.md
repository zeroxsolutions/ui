# ui-composition-defaults Specification

## Purpose

Define the composition discipline for `@zeroxsolutions/ui` composites: consume design-system primitives at their built-in defaults and declared `size` variants rather than piling on `className` overrides, confine `className` to genuine layout and raw-asset sizing, never reimplement a shipped primitive, and never edit the vendored shadcn primitive layer to add a missing size or variant.

## Requirements

### Requirement: Consume design-system primitives at their defaults

A composite in `@zeroxsolutions/ui` MUST NOT add a `className` whose only effect is
re-tuning a design-system primitive's built-in size, spacing, icon-size, colour, or
font. Where a non-default size is genuinely required, the composite selects the
primitive's own `size` variant instead of a hand-authored utility class.

#### Scenario: Icon rendered inside a size-applying primitive

- **WHEN** a composite renders an icon as a direct child of a primitive that already
  sizes its SVGs (a `Button` applies `[&_svg:not([class*='size-'])]:size-4`; a `Badge`
  applies `[&>svg]:size-3!`)
- **THEN** the icon carries no `size-*` class equal to the size the primitive already
  applies — the redundant class is removed and the primitive sizes the icon.

#### Scenario: A non-default control size is required

- **WHEN** a composite needs a button or icon-button larger or smaller than the default
- **THEN** it selects the primitive's declared `size` variant (e.g. `icon-xs`,
  `icon-sm`) rather than overriding with a `size-*` `className`.

#### Scenario: A variant is declared and then overridden

- **WHEN** a composite sets a primitive's `size` variant and also a conflicting `size-*`
  `className` on the same element
- **THEN** the conflicting `className` is removed, leaving the declared variant to govern.

#### Scenario: A neutralised primitive signals the wrong element, not an exception

- **WHEN** a composite must neutralise a primitive's signature styling to fit (e.g. a `Button`
  stripped of its height, padding, and hover so a parent container can own the visuals) and no
  variant expresses the inert result
- **THEN** this is treated as the wrong element for the job — the composite uses the element the
  established pattern prescribes (e.g. per the W3C tree-view pattern a treeitem's clickable
  region is a `div`/`span`, not a per-item `<button>`, so activation stays with the tree) rather
  than a neutralising `className` pile.

### Requirement: Confine className to genuine layout on raw elements

A `className` on a composite MUST appear only when it expresses layout the primitive
cannot (a container width the surrounding layout dictates, flex sizing/truncation,
positioning) or sizes a **raw** element that has no design-system default (a bare icon,
an image/asset). Such classes are not primitive overrides and MUST be retained.

#### Scenario: Flex truncation on a raw text element

- **WHEN** text must ellipsize within a flex row
- **THEN** `min-w-0 flex-1 truncate` on the raw text element is retained, because
  `truncate` must live on the text node and cannot move to a wrapper.

#### Scenario: Sizing a raw asset or bare icon

- **WHEN** a composite renders a raw image, emoji, file-type icon, or a bare lucide icon
  (which has no design-system default size)
- **THEN** a size `className` on that raw element is retained as the element's only size
  specification.

### Requirement: No composite reimplements a shipped primitive

A composite MUST NOT hand-build a surface the design system already ships; it composes
the shipped component instead.

#### Scenario: A short labelled/monospace chip

- **WHEN** a short labelled value must render as a chip
- **THEN** the shipped `Badge` is used, not a bespoke `<span>` that recreates the
  badge's shape from tokens.

### Requirement: The vendored primitive layer is not modified

The fix for a missing size or variant MUST NOT be an edit to
`packages/ui/src/components/ui/` — these are vendored shadcn primitives that regenerate,
so local edits are lost. A composite MUST use an existing variant or keep a justified
raw-element class.

#### Scenario: No exact variant reaches the required size

- **WHEN** no primitive `size` variant yields the required size and that size is
  genuinely load-bearing
- **THEN** the composite keeps the minimal `className` on the raw element and does not
  edit the vendored primitive to add a variant.

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
