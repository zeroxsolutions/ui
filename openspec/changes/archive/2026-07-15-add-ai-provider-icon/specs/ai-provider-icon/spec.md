## ADDED Requirements

### Requirement: Resolve an AI provider key to a vendored brand mark

`AiProviderIcon` MUST accept a `provider` string naming an AI provider and resolve it, through a configured AI provider mapping, to a vendored brand mark from `@zeroxsolutions/icons`. Resolution MUST be case-insensitive and MUST cover every AI provider key the mapping declares.

#### Scenario: Known AI provider key renders its mark

- **WHEN** `AiProviderIcon` is given a `provider` key that the mapping declares (e.g. `openai`, `anthropic`, `bfl`)
- **THEN** it renders that provider's vendored brand mark

#### Scenario: Key match ignores case

- **WHEN** the same provider key is passed in a different case (e.g. `OpenAI`, `ANTHROPIC`)
- **THEN** it resolves to the same brand mark as the lowercase key

### Requirement: Render the requested visual variant

`AiProviderIcon` MUST accept a `type` selecting the mark's visual variant - `color`, `mono`, `avatar`, or `combine` - and MUST use a single documented default variant when `type` is omitted.

#### Scenario: Color variant renders the brand's own colors

- **WHEN** `type` is `color` and the resolved mark ships a color variant
- **THEN** it renders the mark in the brand's intrinsic colors

#### Scenario: Mono variant follows current text color

- **WHEN** `type` is `mono`
- **THEN** it renders the mark monochrome, inheriting the surrounding `currentColor`

#### Scenario: Avatar variant wraps the mark in a rounded container

- **WHEN** `type` is `avatar`
- **THEN** it renders the mark inside the package's rounded avatar container

#### Scenario: Default variant when type is omitted

- **WHEN** no `type` is provided
- **THEN** it renders the documented default variant

### Requirement: Render at a requested size

`AiProviderIcon` MUST accept a numeric `size` that sets the rendered dimensions of the mark, and MUST apply a documented default when `size` is omitted.

#### Scenario: Explicit size

- **WHEN** a numeric `size` is provided
- **THEN** the rendered mark takes that size

#### Scenario: Default size

- **WHEN** `size` is omitted
- **THEN** the mark renders at the documented default size

### Requirement: Fall back for an unknown AI provider key

When the `provider` key matches no entry in the AI provider mapping, `AiProviderIcon` MUST render a neutral default placeholder, and MUST NOT throw or render an unrelated mark.

#### Scenario: Unknown key renders the neutral fallback

- **WHEN** `AiProviderIcon` is given a `provider` key with no mapping entry
- **THEN** it renders the neutral default placeholder
- **AND** it does not throw and does not render a different provider's mark

### Requirement: Compose into the AI provider card slot

`AiProviderIcon` MUST render as a standalone node suitable for `AiProviderCard`'s consumer-supplied `icon` slot, so a card can display a provider logo by passing `<AiProviderIcon provider={...} />` without importing an individual mark.

#### Scenario: Used as the card icon

- **WHEN** `AiProviderIcon` is passed as `AiProviderCard`'s `icon` prop for a known provider
- **THEN** the card renders that provider's mark in its leading brand-mark slot

### Requirement: Individual marks stay independently importable

Adding the resolver MUST NOT change the per-file, tree-shakeable nature of the vendored marks. A consumer that imports a single brand mark by its subpath MUST NOT be forced to pull in the AI provider mapping, the resolver, or unrelated marks.

#### Scenario: Importing one mark does not pull the registry

- **WHEN** a consumer imports a single brand mark from its own subpath (e.g. `@zeroxsolutions/icons/brands/openai`)
- **THEN** only that mark and its own `internal/` helpers are reachable through that import
- **AND** the AI provider mapping and the other vendored marks are not forced into the consumer's bundle

### Requirement: Self-contained rendering with no external icon dependency

`AiProviderIcon`, the AI provider mapping, and every mark it resolves MUST render entirely from `@zeroxsolutions/icons` vendored marks and the package's own `internal/` helpers, with no runtime dependency on `@lobehub/icons` or any other external icon package.

#### Scenario: No external icon package at runtime

- **WHEN** `AiProviderIcon` renders any resolved provider
- **THEN** it does so using only vendored marks and `internal/` helpers from `@zeroxsolutions/icons`
