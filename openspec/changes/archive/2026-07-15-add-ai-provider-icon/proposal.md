## Why

`@zeroxsolutions/icons` already vendors ~177 brand marks that mirror `@lobehub/icons` per-mark shape (a `Base` SVG plus `.Mono` / `.Color` / `.Text` / `.Avatar` / `.Combine` statics), and it ships the same avatar/combine helpers under `internal/`. What it is missing is lobehub's second tier: the `features/` resolvers (`ProviderIcon`, `ModelIcon`) that map an AI provider/model string to the right mark.

Because that tier is absent, every consumer that wants "an AI provider's logo from a key" hand-rolls its own `key -> mark` registry. Two signals in this repo:

- The design system already ships `AiProviderCard` (`packages/ui`), whose `icon` prop is documented as a consumer-supplied brand mark node - it deliberately takes the mark as a slot rather than resolving it, so there is nowhere shared that turns an AI provider key into a mark.
- chiselhub's `ProviderLogo` imports ~50 marks straight from `@lobehub/icons` at runtime, hand-maintains a key map, re-derives the color/mono variant, and hand-rolls a colored-initial fallback - coupling a downstream app to an external icon package and drifting from this repo's own icon strategy (per-file subpath, `sideEffects: false`, `react` peer only, no runtime `@lobehub`).

Adding an `AiProviderIcon` resolver to `@zeroxsolutions/icons` gives one shared component that renders an AI provider logo from a key - the natural node to drop into `AiProviderCard`'s `icon` slot - and lets `ProviderLogo` collapse to a thin wrapper that drops `@lobehub/icons` entirely.

## What Changes

- Add an `AiProviderIcon` resolver to `@zeroxsolutions/icons`, scoped to AI providers, mirroring lobehub's `features/ProviderIcon`: an `ai-provider-config` mapping (`{ keywords, Icon }[]`) plus an `AiProviderIcon` component that resolves an AI provider key to a vendored mark and renders a chosen variant at a size, with a neutral fallback when unmatched.
- Vendor the ~21 AI provider brand marks that chiselhub's `ProviderLogo` needs but the package does not yet have (and verify a plain `google` / `microsoft` mark and a `lucide-mark` adapter for the `custom` case), following the existing vendoring pattern.
- Ship Storybook stories and vitest specs for `AiProviderIcon` and the newly vendored marks.

## Success Criteria

- `AiProviderIcon` renders the correct vendored mark for every AI provider key chiselhub's `ProviderLogo` currently maps, across `type` = `avatar` / `mono` / `color` / `combine` and a numeric `size`, and renders a neutral fallback for an unknown key.
- `AiProviderIcon` drops cleanly into `AiProviderCard`'s `icon` slot (`<AiProviderCard icon={<AiProviderIcon provider={...} />} />`).
- The resolver and its config live in `@zeroxsolutions/icons`; individual marks stay importable per-file (tree-shakeable), so consumers who want a single mark still pay for one mark.
- `AiProviderIcon` pulls in no `@lobehub/icons` runtime dependency; it composes only vendored marks and the package's own `internal/` helpers.
- lint, build, and test are green for `@zeroxsolutions/icons`, and its Storybook `test-storybook` covers the new stories.

## Non-Goals

- Rewiring chiselhub's `ProviderLogo` onto `AiProviderIcon` and dropping its `@lobehub/icons` dependency. That lands in the chiselhub repo as a follow-up once this ships and chiselhub bumps the `@zeroxsolutions/icons` version.
- A `ModelIcon` (fuzzy match by raw model id). AI provider logos resolve by an explicit provider key; a model-id resolver is deferred until a consumer needs it.
- Non-AI / service provider resolution (payments, storage, messaging, ...). This resolver is scoped to AI model/inference providers only; the package still vendors non-AI marks for direct per-file import, but they are not in the `ai-provider-config` mapping.
- The `model-list` / `model-item` / `model-hover-card` design-system components (a separate change).
- Any color-token or design-system change: brand marks carry their own brand color and stay in the icons package, not the monochrome DS.

## Capabilities

### New Capabilities

- `ai-provider-icon`: resolve an AI provider key to a vendored brand mark and render it as a mark, mono, colored, avatar, or combine variant at a requested size, with a neutral fallback for unknown keys.

### Modified Capabilities

<!-- none: no existing spec-level behavior changes -->

## Impact

- Package: `@zeroxsolutions/icons` (`packages/icons`) - new `ai-provider-icon` + `ai-provider-config` modules, ~21 new vendored `brands/*` marks, new subpath exports, new specs and stories; a subsequent `nx release` so consumers can bump.
- Package: `@zeroxsolutions/ui` (`packages/ui`) - no code change; `AiProviderCard`'s `icon` slot becomes the intended consumer of `AiProviderIcon` (composition across the two packages).
- App: `apps/storybook` - new stories for `AiProviderIcon` and the vendored marks.
- Downstream (out of scope here): chiselhub `apps/web-app` `ProviderLogo` and its `@lobehub/icons` dependency, in a later chiselhub PR.
