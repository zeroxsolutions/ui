# icon-library Specification (delta)

## ADDED Requirements

### Requirement: The brands category is a self-sufficient AI and dev/infra mark set

The `brands` category **SHALL** provide vendored brand marks spanning the AI
ecosystem — model labs, inference/hosting platforms, voice/speech vendors,
generative-media tools, agent/framework tooling, and vector/data stores — **and**
common dev/cloud/infra vendors. Each mark **SHALL** be a vendored component
(committed source, not generated in-repo); the package **MUST NOT** depend on any
third-party icon library at runtime to render a mark. The package **MUST** record
each mark's source (e.g. Simple Icons CC0, `@lobehub/icons` source artwork,
vendor/seeklogo SVG) and retain a trademark disclaimer stating the marks identify
their owners without implying affiliation or endorsement.

#### Scenario: Import an AI provider mark by category subpath

- **WHEN** a consumer imports from `@zeroxsolutions/icons/brands/openai`
- **THEN** it receives that provider's brand-mark component

#### Scenario: Import a dev/infra mark by category subpath

- **WHEN** a consumer imports a dev/cloud/infra mark from `@zeroxsolutions/icons/brands/<name>`
- **THEN** it receives that vendor's brand-mark component

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

The `.Avatar` and `.Combine` variants **SHALL** be generic composition components
shared across all brands — parametrized by the brand's icon, primary color, and
name — not per-brand vendored artwork. Every icon-form rendering (base, `.Color`,
`.Mono`) **SHALL** be sized by a single `size` prop applied to the svg
width/height.

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

#### Scenario: Absent variants are not exposed

- **WHEN** a brand has no wordmark artwork (e.g. many dev/infra marks)
- **THEN** its component exposes no `.Text` or `.Combine` sub-component, and referencing one is a type error

#### Scenario: Sizing an icon-form variant

- **WHEN** a consumer renders a base, `.Color`, or `.Mono` mark with `size="1.5rem"` (or a numeric size)
- **THEN** the svg width and height are set to that size, preserving the mark's aspect ratio
