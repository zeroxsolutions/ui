# icon-library Specification (delta)

## MODIFIED Requirements

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
