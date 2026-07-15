## Context

`@zeroxsolutions/icons` is a per-file, tree-shakeable icon package: `exports` maps `./*` -> `dist/*`, `sideEffects: false`, `react`/`react-dom` peers only, no runtime `@lobehub/icons`. It already ships ~177 brand marks under `src/brands/*` that mirror `@lobehub/icons` per-mark shape, plus the avatar/combine machinery under `src/brands/internal/`.

Confirmed API shapes (read from installed source, not memory):

- A mark (e.g. `src/brands/openai.tsx`) is `const XxxMark = Base as XxxMarkType`, where `Base: FC<IconProps>` renders `<svg fill="currentColor" height={size} width={size} ...>` with `size` defaulting to `'1em'`; statics are attached: `.Mono`, `.Text`, `.Avatar` (`makeAvatar`), `.Combine` (`makeCombine`), `.colorPrimary`. Colored brands additionally attach `.Color`.
- `IconProps` (`internal/types`) = `{ size?: string | number; style?; ...svgProps }`.
- `internal/avatar` -> `makeAvatar(Base, { background, color, iconMultiple })`; `internal/combine` -> `makeCombine(Base, TITLE, { spaceMultiple, textMultiple })`; `internal/fill-ids` isolates gradient ids so two marks on one page do not collide.

What is missing is lobehub's second tier. Confirmed from the installed `@lobehub/icons@5.8.0`: `es/features/` ships `ProviderIcon`, `ModelIcon`, `ProviderCombine`, `IconAvatar`, `IconCombine` plus `providerConfig` / `modelConfig` / `providerEnum`. `ModelIcon({ model, size = 12, type = 'avatar', shape, ...rest })` lowercases `model`, iterates `modelMappings` (each `{ keywords: string[], ... }`), regex-matches a keyword, renders the matched item's variant, and falls back to `DefaultIcon` / `DefaultAvatar`. `ProviderIcon` is the AI-provider-keyed analogue.

Two consumers motivate the AI-provider resolver: `AiProviderCard` (`packages/ui`) already exposes an `icon` slot documented as a consumer-supplied `@zeroxsolutions/icons` mark, and chiselhub's `ProviderLogo` is a hand-rolled, weaker `ProviderIcon` (a static `preset -> mark` map over ~50 `@lobehub/icons` imports, a `pickVariant` (`.Color ?? Base`) standing in for `type`, and a colored-initial square standing in for the Default fallback).

## Goals / Non-Goals

**Goals:**

- Add an AI-provider resolver tier to `@zeroxsolutions/icons` mirroring lobehub `features/`: an `ai-provider-config` mapping and an `AiProviderIcon` component, scoped to AI model/inference providers.
- Vendor the ~21 AI provider marks the mapping needs but the package lacks, following the existing mark pattern.
- Make `AiProviderIcon` the shared node for `AiProviderCard`'s `icon` slot.
- Keep individual marks per-file and tree-shakeable; the resolver is the opt-in convenience tier.
- Zero runtime `@lobehub/icons`.

**Non-Goals:**

- Chiselhub `ProviderLogo` rewire (separate repo/PR after release).
- `ModelIcon` (fuzzy model-id match); non-AI provider resolution.
- `model-list` / DS components; any color-token change.

## Decisions

### D1 - Mirror lobehub's two-tier split, scoped to AI providers

Tier 1 (marks) already exists and already matches lobehub's per-mark shape. This change adds only Tier 2 (the resolver) plus the missing Tier 1 marks. `internal/avatar` and `internal/combine` already provide lobehub's `IconAvatar` / `IconCombine`, so `AiProviderIcon` composes them rather than re-implementing. The mapping is scoped to AI providers only; non-AI marks in the package are not registered in it.

### D2 - `AiProviderIcon` lives in `@zeroxsolutions/icons`, feeds the DS card's slot

The resolver renders colored brand marks, so it stays in the icons package (as lobehub keeps `ProviderIcon` with its marks), not in the monochrome design system. `AiProviderCard` (DS) keeps its `icon` slot and consumes the resolver by composition: `<AiProviderCard icon={<AiProviderIcon provider="openai" type="avatar" />} />`. The card's existing slot design confirms the DS deliberately does not own brand-mark rendering.

### D3 - `AiProviderIcon` API

```
AiProviderIcon({
  provider: string,                                   // the AI provider key to resolve
  size?: number,                                      // default documented (lobehub uses 12)
  type?: 'color' | 'mono' | 'avatar' | 'combine',     // default 'color' (matches the original ProviderLogo: a plain color mark, falling back to mono)
  shape?: 'circle' | 'square',                        // avatar shape, when type='avatar'
  ...svgProps
})
```

Resolution: look the (lowercased) `provider` up in the AI provider mapping; render the resolved mark's variant for `type` via the statics, using the fallback chain `type` static `?? .Mono ?? Base` when a mark lacks that exact variant; if no mapping entry matches, render the neutral Default.

### D4 - `ai-provider-config` shape and home

```
aiProviderMappings: { keywords: string[]; Icon: BrandMark }[]
```

The mapping for the AI providers (openai, anthropic, gemini, bfl, flux, ...) lives in `@zeroxsolutions/icons` (brand identity is shared, as in lobehub). App-specific keys (chiselhub `claude-code`, gateway `custom`, the `bfl` alias) are handled by an optional `mapping` / `extra` prop on `AiProviderIcon` (or a `resolveAiProviderMark(key, extra?)` helper) so the shared package stays domain-neutral and the app extends it without forking the config.

### D5 - Vendoring the ~21 missing marks

Missing: `volcengine, newapi, zhipu, zai, moonshot, gemma, bailian, xiaomi(-mimo), modelscope, stepfun, codex, bfl, bytedance, workersai, baai, ibm, llava, myshell, pixverse, vidu, ai4bharat`; plus verify a plain `google` and `microsoft` mark (only `google-*` / `microsoft-teams` exist today) and a `lucide-mark` adapter for the `custom` case. Each new mark follows the existing pattern: a `Base` SVG (`fill="currentColor"`, `size='1em'`), the `.Mono` / `.Color?` / `.Text?` / `.Avatar` / `.Combine` statics via `internal/*`, `internal/fill-ids` for any gradient, and an MIT attribution comment. Source SVGs come from MIT-licensed sets (lobehub, Simple Icons, svgl), matching the icon-vendoring approach already used in the package.

### D6 - Fallback is neutral (mono), not colored

The Default placeholder is a neutral monochrome mark (inherits `currentColor`), not a colored initial square. Color stays a per-brand concern; a consumer that wants a colored initial can still render its own fallback. This keeps the package free of an ad-hoc color palette.

### D7 - Exports and tree-shaking

New subpaths ride the existing `./*` -> `dist/*` map: `@zeroxsolutions/icons/ai-provider-icon`, `@zeroxsolutions/icons/ai-provider-config`, and each new mark under its existing `brands/*` path. `AiProviderIcon` imports every mapped mark (a heavier bundle) - accepted as the opt-in convenience tier; `sideEffects: false` and per-file marks keep single-mark imports lean.

## Risks / Trade-offs

- Resolver bundle weight: importing `AiProviderIcon` pulls in all mapped marks. Mitigation: it is opt-in; single-mark imports stay tree-shakeable; the mapping is data, so a consumer could build a narrower one via the exported `resolveAiProviderMark`.
- Subpath resolution drift: the README documents `@zeroxsolutions/icons/brands/...` while chiselhub imports flat keys like `@zeroxsolutions/icons/deepgram`. The exact dist layout (flattened vs `brands/`) must be confirmed against the built `dist/` before choosing the `ai-provider-icon` subpath, so the exports actually resolve.
- Published-version lag: this working tree lacks `lucide-mark` and `ai4bharat`, which chiselhub already imports from the published package - so those exist on the release line even if not in this snapshot. Reconcile against the version chiselhub consumes before re-vendoring duplicates.
- Brand asset licensing: only vendor from MIT-licensed sources and carry the attribution comment, as the existing marks do.

## State Model

`AiProviderIcon` is a pure, stateless render: `(provider, type, size, shape) -> mark variant | Default`. Resolution is deterministic (a lookup over static data), so there is no runtime state, no async, and no lifecycle to model. `React.memo` (as lobehub does) is a rendering optimization, not state.

## Migration Plan

Additive and backward compatible - no existing export changes. Rollout: land marks + `ai-provider-config` + `AiProviderIcon` + specs + stories in `@zeroxsolutions/icons`; `nx release` the package; then, in a separate chiselhub PR, bump `@zeroxsolutions/icons` and collapse `ProviderLogo` to `<AiProviderIcon type="avatar" size={n} />` plus its `logoUrl` `<img>` guard, dropping `@lobehub/icons`. Until chiselhub bumps, nothing downstream changes.

## Open Questions

- `ai-provider-config` home: shared generic config plus an optional `extra` prop (leaning this) vs a fully app-owned mapping passed in.
- Confirm the built `dist/` subpath layout for marks (flat vs `brands/`) so `ai-provider-icon` / `ai-provider-config` subpaths resolve.
- Confirm whether `google` (plain), `microsoft` (plain), and the `lucide-mark` adapter already exist on the release line before vendoring them.
- Is any consumer going to need `type="combine"` (icon + wordmark) now, or can `combine` be deferred?
