# design-system-conventions Specification

## Purpose

Define the design-system conventions every authored component in `@zeroxsolutions/ui` follows: monochrome tokens with scoped hues entering only through CSS variables, one icon source per role, file-name and `data-slot` discipline, no reflex-suffix or twin names that bypass a shipped primitive, and preservation of a composed primitive's functional `data-slot` in compound parts.

## Requirements

### Requirement: Tokens are monochrome; a hue enters only through a scoped variable

The design-system tokens MUST be monochrome - grayscale, with `--destructive` the only
chromatic token. A non-grayscale hue MUST enter a surface only through a scoped
`.dark`-aware CSS variable on a wrapper element, never a hardcoded color value, a raw
color utility, or a new global color token.

#### Scenario: A component needs a color accent

- **WHEN** an authored component requires a non-grayscale accent
- **THEN** the accent is supplied by a scoped `.dark`-aware CSS variable on a wrapper
  element, not a hardcoded color or a raw color utility class.

#### Scenario: A token-driven surface renders

- **WHEN** a token-driven surface such as `bg-primary/10 text-primary` renders
- **THEN** it reads as grayscale, because every token except `--destructive` is chroma 0.

#### Scenario: The dark-mode variant of a scoped hue

- **WHEN** a wrapper declares a scoped accent CSS variable for light mode
- **THEN** a matching `.dark` override on the same wrapper supplies the dark-mode value,
  so the hue reads correctly in both themes.

### Requirement: One icon source per role

An authored component MUST source its icons from one convention per role: lucide for UI
control glyphs, and the `@zeroxsolutions/icons` system for brand marks. A raw unicode
glyph or an emoji used where a UI glyph belongs is not allowed.

#### Scenario: A component renders a UI control glyph

- **WHEN** an authored component renders a UI control icon (a button action, a menu
  chevron, a status indicator)
- **THEN** it uses a lucide icon, not a raw unicode character or an emoji.

#### Scenario: A component renders a brand mark

- **WHEN** an authored component renders a provider or brand logo
- **THEN** it uses the `@zeroxsolutions/icons` system, not an inline ad-hoc SVG, a raw
  unicode glyph, or an emoji.

### Requirement: File name matches the root symbol; structural elements carry a data-slot

An authored component's file MUST be the kebab form of its root symbol (e.g.
`split-button.tsx` for `SplitButton`), and a non-vendored utility/module file MUST be the
kebab form of its primary export. Every structural element a component renders MUST carry
a `data-slot="<kebab>"` whose value is the 1:1 kebab of its symbol (the `sidebar` /
`dropdown-menu` pattern); a bespoke non-kebab `data-*` attribute standing in for a slot
(for example `data-bubble-menu`, `data-slash-menu`) is not allowed. A genuine content
variant (for example `data-callout={variant}`) stays on a second attribute, alongside the
identity `data-slot`.

#### Scenario: A file matches its root symbol

- **WHEN** a component or utility module is named
- **THEN** its file is the kebab form of its root symbol or primary export, so a glob and
  the eye find it from the symbol.

#### Scenario: A structural element is targeted

- **WHEN** a component renders a structural root or part that CSS or a parent must target
- **THEN** it carries `data-slot="<kebab>"` matching its symbol, never a bespoke
  `data-*-menu` or non-kebab attribute.

### Requirement: No reflex-suffix names; reuse a shipped primitive instead of a twin

An authored component MUST NOT use a reflex `-shell` suffix (shadcn ships no `*Shell`
component; a bespoke positioning/focus need folds into the matching primitive - e.g. a
caret-anchored floating surface uses `Popover`, not a custom `*Shell`) or a `*Row` suffix.
A component whose role matches a shipped primitive MUST compose that primitive, never
reproduce it under a twin name (a visible-text status pill composes `Badge`; an
icon+label+value line composes `Item`).

#### Scenario: A floating or positioning surface is needed

- **WHEN** an authored component needs a floating/anchored surface
- **THEN** it composes the matching primitive (`Popover`, `Tooltip`, `HoverCard`) rather
  than a bespoke `*Shell` re-implementation.

#### Scenario: A row or status pill is authored

- **WHEN** a new component would present an icon+label+value line or a status token
- **THEN** it composes the shipped `Item` or `Badge` primitive, never a `*Row` or `*Chip`
  twin of one.

### Requirement: A compound part retains a composed primitive's functional data-slot

A compound part that composes a design-system primitive MUST retain the primitive's
functional `data-slot` where descendant style hooks depend on it. For example, a
`SplitButton` Root composes `ButtonGroup`, and the child buttons'
`in-data-[slot=button-group]` radius hooks depend on the Root keeping
`data-slot="button-group"`; overriding it with `data-slot="split-button"` breaks the seam.
Such a part is targetable through the primitive's slot plus its composed position; an
authored part that is NOT a functional primitive (an action button, a trigger) carries its
own `data-slot`.

#### Scenario: A compound root composes a primitive with descendant hooks

- **WHEN** a compound root composes a primitive whose descendant hooks key off the
  primitive's data-slot (e.g. `ButtonGroup` radius)
- **THEN** the root retains the primitive's `data-slot` (e.g. `button-group`), not its own
  symbol-kebab.

#### Scenario: An authored part is not a functional primitive

- **WHEN** a compound part is an authored button (an action or a trigger), not a primitive
  with functional descendant hooks
- **THEN** it carries its own `data-slot` (e.g. `split-button-action`).
