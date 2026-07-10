# icon-library Specification

## Purpose

Define the icon package's public contract: category-scoped import subpaths (`brands`, `material`, …), a compound component API where variants are PascalCase sub-components on a base icon, full-color file icons that scale by a single `size` prop while preserving their intrinsic viewBox and colors, per-instance isolation of internal SVG ids, collision-free and valid exported symbol names, and the Material Icon Theme file-icon set (folders excluded) with attribution.

## Requirements

### Requirement: Category namespaces are exposed as import subpaths

Every icon belongs to a category, and the category **SHALL** be part of its
public import subpath — not a cosmetic source folder. The package **SHALL** expose
at least two categories: `brands` (vendor/brand marks) and `material` (Material
Icon Theme file icons). A category name **MUST NOT** collide with another
category's members, so the same short name may exist in more than one category.

#### Scenario: Import a Material file icon by category subpath

- **WHEN** a consumer imports from `@zeroxsolutions/icons/material/typescript`
- **THEN** it receives the TypeScript file-icon component

#### Scenario: The same name coexists across categories

- **WHEN** both a brand mark and a Material file icon share a base name (e.g. `react`)
- **THEN** `@zeroxsolutions/icons/brands/react` and `@zeroxsolutions/icons/material/react` each resolve to their own component without conflict

#### Scenario: Relocated brand marks keep working under the brands category

- **WHEN** a consumer imports a previously top-level mark from `@zeroxsolutions/icons/brands/deepgram`
- **THEN** it receives the same mark component that was previously exported at the top level

### Requirement: Icons use a compound component API for their variants

An icon **SHALL** be a base React component whose alternate renderings are
attached as PascalCase sub-components on the base. Consumers select a variant by
rendering the sub-component; the base component **SHALL** render the default
variant. A sub-component **MUST** exist only when that variant actually exists for
the icon.

#### Scenario: Base component renders the default variant

- **WHEN** a consumer renders `<TypescriptIcon />`
- **THEN** the default (non-light) icon artwork is rendered

#### Scenario: Light theme variant is a sub-component

- **WHEN** a Material icon has a light-theme pair and the consumer renders `<BunIcon.Light />`
- **THEN** the light-theme artwork is rendered instead of the default

#### Scenario: Absent variants are not exposed

- **WHEN** a Material icon has no light-theme pair
- **THEN** its component exposes no `.Light` sub-component, and referencing one is a type error

### Requirement: File icons render full-color at their intrinsic aspect ratio

Each Material file icon component **SHALL** preserve its own intrinsic `viewBox`
and its embedded colors, and **SHALL** be scaled by a single `size` prop
(defaulting to a font-relative size) rather than by overriding color — the icons
are multi-color with differing source viewBoxes. Icons **MUST NOT** depend on
`currentColor`.

#### Scenario: Sizing an icon

- **WHEN** a consumer renders a Material icon with `size="2rem"`
- **THEN** the icon scales to that size while preserving its intrinsic aspect ratio and colors

#### Scenario: Colors are intrinsic

- **WHEN** a Material icon is rendered inside text of any color
- **THEN** its multi-color artwork is unaffected by the surrounding `color`

### Requirement: Icons with internal ids are isolated across instances

Internal SVG ids (gradients, clip paths, masks) **MUST NOT** collide or
cross-reference across icons or instances rendered in the same document; every
icon **SHALL** render correctly regardless of what else is on the page. Some
source icons define such ids, so they must be isolated per icon.

#### Scenario: Many gradient icons on one page

- **WHEN** several different gradient-bearing icons are rendered together on a single page
- **THEN** each renders its own artwork correctly, with no icon inheriting another's gradient or clip

### Requirement: Symbol names are collision-free and valid identifiers

Each icon's exported symbol **SHALL** be the PascalCase of its source name with a
role suffix — `Icon` for file icons, `Mark` for brand marks. A source name
beginning with a digit **MUST** be spelled out so the symbol is a valid
identifier. The suffix keeps symbols from shadowing real library names.

#### Scenario: File icon symbol

- **WHEN** the source icon is `typescript`
- **THEN** its exported symbol is `TypescriptIcon`

#### Scenario: Name that collides with a real library

- **WHEN** the source icon is `react`
- **THEN** its exported symbol is `ReactIcon` (never a bare `React`)

#### Scenario: Name beginning with a digit

- **WHEN** the source icon is `3d`
- **THEN** its exported symbol is `ThreeDIcon`

### Requirement: The Material file-icon set is available with attribution

The `material` category **SHALL** provide the Material Icon Theme file icons
(excluding folder icons), with each `*_light` source pair merged into one
component that exposes a `.Light` sub-component. The package **MUST** record that
these icons come from Material Icon Theme under its MIT license.

#### Scenario: Folder icons are excluded

- **WHEN** a consumer looks for a Material `folder-*` glyph
- **THEN** it is not part of the `material` category

#### Scenario: Attribution is present

- **WHEN** the package documentation is consulted
- **THEN** it credits Material Icon Theme and its MIT license for the `material` category
