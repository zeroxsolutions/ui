## ADDED Requirements

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
