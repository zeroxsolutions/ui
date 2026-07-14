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

### Requirement: The brands category is a self-sufficient AI and dev/infra mark set

The `brands` category **SHALL** provide vendored brand marks spanning the AI
ecosystem — model labs, inference/hosting platforms, voice/speech vendors,
generative-media tools, agent/framework tooling, and vector/data stores — common
dev/cloud/infra vendors, **and** social / communication and workspace /
productivity brands (social networks, messaging apps, collaboration tools, and
office / mail suites). The set **SHALL** cover every native provider on the
**Cloudflare AI Gateway** provider list, via either a dedicated mark or an umbrella
mark for the provider's parent brand (e.g. `aws` for Amazon Bedrock). All marks
live in the one flat `brands/` category — there is **no** per-domain subpath
namespace; each mark imports as `@zeroxsolutions/icons/brands/<name>`. Each mark
**SHALL** be a vendored component (committed source, not generated in-repo); the
package **MUST NOT** depend on any third-party icon library at runtime to render a
mark. The package **MUST** record each mark's source (e.g. Simple Icons CC0,
`@lobehub/icons` source artwork, `gilbarbara/logos`, `svgl`, vendor/seeklogo SVG)
and retain a trademark disclaimer stating the marks identify their owners without
implying affiliation or endorsement.

#### Scenario: Import an AI provider mark by category subpath

- **WHEN** a consumer imports from `@zeroxsolutions/icons/brands/openai`
- **THEN** it receives that provider's brand-mark component

#### Scenario: Import a dev/infra mark by category subpath

- **WHEN** a consumer imports a dev/cloud/infra mark from `@zeroxsolutions/icons/brands/<name>`
- **THEN** it receives that vendor's brand-mark component

#### Scenario: Import a social/communication mark by category subpath

- **WHEN** a consumer imports a social or messaging mark from `@zeroxsolutions/icons/brands/<name>` (e.g. `facebook`, `discord`, `whatsapp`)
- **THEN** it receives that brand's mark component from the same flat `brands/` category, with no separate `social/` subpath

#### Scenario: Import a workspace/productivity mark by category subpath

- **WHEN** a consumer imports a collaboration or office mark from `@zeroxsolutions/icons/brands/<name>` (e.g. `slack`, `notion`, `figma`, `gmail`)
- **THEN** it receives that brand's mark component from the same flat `brands/` category, with no separate `workspace/` subpath

#### Scenario: Cloudflare AI Gateway providers are covered

- **WHEN** a consumer needs the brand mark for a native Cloudflare AI Gateway provider (e.g. `parallel`, `bedrock`, `vertexai`, `xai`, `cohere`, `perplexity`)
- **THEN** the `brands` category resolves a mark for that provider, either dedicated (`brands/parallel`) or via the provider's parent-brand umbrella mark — covering every native provider except `cartesia`, which is documented as a deferral until a licensable brand asset exists (it has no umbrella mark)

#### Scenario: No runtime icon-library dependency

- **WHEN** the package is installed with only its declared peer dependencies (React)
- **THEN** every brand mark renders without any third-party icon library present at runtime

#### Scenario: Source attribution and trademark disclaimer are present

- **WHEN** the package documentation is consulted for a brand mark
- **THEN** it records the mark's source and states the trademark disclaimer

### Requirement: Brand marks expose the lobehub-style variant surface where each variant exists

A brand mark **SHALL** be a base React component whose alternate renderings are
attached as PascalCase sub-components, mirroring the `@lobehub/icons` variant
surface. The base component renders the brand's default artwork; each of the
following variants **SHALL** be present **only when it applies to that brand** (its
artwork or composition exists), and referencing an absent variant **MUST** be a
type error:

- `.Color` — the full brand-color artwork; its intrinsic colors **MUST NOT** be
  recolored by the surrounding `color`.
- `.Mono` — a monochrome rendering that paints via `currentColor`, inheriting the
  surrounding text color.
- `.Avatar` — the icon centered on a filled background (the brand's primary color by
  default), accepting `background`, foreground `color`, and an icon-size multiplier
  in addition to `size`.
- `.Text` — the brand wordmark, accepting `text` and `textColor` in addition to
  `size`.
- `.Combine` — the icon paired with the wordmark, accepting `text` and `textColor`
  in addition to `size`.

A mark whose source artwork is a single monochrome path **SHALL** render its base
in `currentColor` and expose `.Mono` (the same silhouette) and `.Color` (the same
silhouette in the brand's primary color). A mark whose source artwork is full-color
or gradient with no clean monochrome silhouette **SHALL** render its base as the
full-color artwork and expose `.Color` (the same artwork), and **MUST NOT** expose
a `.Mono` variant. The `.Avatar` and `.Combine` variants **SHALL** be generic
composition components shared across all brands — parametrized by the brand's icon,
primary color, and name — not per-brand vendored artwork. Every icon-form rendering
(base, `.Color`, `.Mono`) **SHALL** be sized by a single `size` prop applied to the
svg width/height.

#### Scenario: Full-color variant preserves intrinsic colors

- **WHEN** a consumer renders `<OpenaiMark.Color />` inside text of any color
- **THEN** the mark keeps its intrinsic brand colors, unaffected by the surrounding `color`

#### Scenario: Monochrome variant inherits currentColor

- **WHEN** a consumer renders `<OpenaiMark.Mono />` inside text of a given color
- **THEN** the mark paints in that inherited `currentColor`

#### Scenario: Avatar variant places the icon on a filled background

- **WHEN** a consumer renders `<OpenaiMark.Avatar />`
- **THEN** the icon is centered on a filled background defaulting to the brand's primary color, overridable via `background`, foreground `color`, and the icon-size multiplier

#### Scenario: Text and Combine variants render the wordmark where it exists

- **WHEN** a brand ships a wordmark and the consumer renders `<OpenaiMark.Text text="OpenAI" />` or `<OpenaiMark.Combine />`
- **THEN** the wordmark (Text) or the icon-plus-wordmark (Combine) is rendered, honoring `text` and `textColor`

#### Scenario: A full-color source exposes no monochrome variant

- **WHEN** a mark is vendored from full-color or gradient source artwork with no clean monochrome silhouette (e.g. `instagram`, `microsoft-teams`, `outlook`, `onedrive`)
- **THEN** its base renders the full-color artwork, `.Color` renders the same artwork, and the component exposes no `.Mono` (nor `.Text` / `.Combine`) sub-component — referencing one is a type error

#### Scenario: Absent variants are not exposed

- **WHEN** a brand has no wordmark artwork (e.g. many dev/infra marks)
- **THEN** its component exposes no `.Text` or `.Combine` sub-component, and referencing one is a type error

#### Scenario: Sizing an icon-form variant

- **WHEN** a consumer renders a base, `.Color`, or `.Mono` mark with `size="1.5rem"` (or a numeric size)
- **THEN** the svg width and height are set to that size, preserving the mark's aspect ratio
