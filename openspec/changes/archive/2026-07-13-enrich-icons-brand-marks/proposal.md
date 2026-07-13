## Why

`@zeroxsolutions/icons` ships a rich `material/` file-icon set (587 icons) but its
`brands/` category holds only **5 marks** (github, deepgram, inworld, pipecat,
leonardo). That is far too thin for the product family this SDK targets — an
AI/agent platform whose surfaces reference model providers, inference hosts,
voice/speech vendors, generative-media tools, and the usual dev/cloud/infra
brands. Consumers currently have no house source for those logos.

Every existing mark's JSDoc frames the set as "vendor a mark only when
`@lobehub/icons` doesn't ship it" — but `@lobehub/icons` is **not installed
anywhere** in the workspace, and nothing consumes it. The package is already a
standalone, publishable library; the gap-filler framing describes a dependency
that doesn't exist. We make the intent explicit: the `brands/` category is
**self-sufficient** — every mark is vendored from public artwork, with no runtime
dependency on any third-party icon library.

## What Changes

- Grow the `brands/` category from 5 marks to a curated, **self-sufficient** set
  covering the AI ecosystem **and** dev/cloud/infra: model labs, inference/hosting
  platforms, voice/speech, generative media, agent/framework tooling, vector/data
  stores, and dev/cloud/infra vendors.
- Adopt the full **`@lobehub/icons` variant surface** per brand: a base component
  plus `.Color`, `.Mono`, `.Avatar`, `.Text`, and `.Combine` sub-components —
  present **only where that variant applies to the brand** (lobehub is itself
  uneven). `.Color`/`.Mono` are vendored icon artwork; `.Avatar`/`.Combine` are
  generic composition components (icon-on-background, icon-plus-wordmark) shared
  across brands. Icon-form variants take `size` (default `1em`); `.Avatar`/`.Text`/
  `.Combine` take the lobehub props (`background`/`iconMultiple`, `text`/`textColor`).
- Icon artwork is vendored from public sources (`@lobehub/icons` source artwork,
  Simple Icons CC0, vendor/seeklogo SVGs), each source recorded per mark and in the
  README, with the trademark disclaimer retained.
- Replace the hand-maintained brand-mark test array with a glob-driven smoke test
  (mirroring `material.spec.tsx`): every mark renders a non-empty svg and no two
  marks share an internal SVG id.
- Update the README `brands/` table and the Storybook brand-marks catalog to
  reflect the full set.

The 5 existing marks and their import paths are unchanged — this is purely
additive to the public surface.

## Success Criteria

- The `brands/` category spans all seven enumerated domains (model labs,
  inference/host, voice/speech, generative media, agent/tooling, vector/data,
  dev/cloud/infra), with a substantial floor of marks per domain rather than a
  token sample.
- Each brand exposes the lobehub variant surface **where each variant exists**: the
  base + `.Color`/`.Mono` render valid non-empty svgs (`.Mono` via `currentColor`,
  `.Color` intrinsic colors); `.Avatar` fills a background with the brand color;
  `.Text`/`.Combine` render the wordmark for brands that ship one; icon-form
  variants apply `size` to width/height; an absent variant is a type error.
- No two brand marks share an internal SVG id when rendered on one page.
- The package introduces **no** new runtime dependency (no `@lobehub/icons`, no
  `simple-icons` at runtime); marks ship as committed `.tsx`.
- `lint`, `build`, and `test` are green for `@zeroxsolutions/icons`; the brand
  smoke test is glob-driven (not a hand-listed array), so adding a mark needs no
  test edit.
- README `brands/` table and the Storybook catalog list every mark, each with its
  source attribution.

## Non-Goals

- No change to the `material/` file-icon set.
- No lobehub brand-specific extras beyond the five canonical variants — `.Brand` /
  `.BrandColor` are not replicated; variants are not forced onto a brand that lacks
  the artwork (no invented wordmarks).
- No runtime dependency on `@lobehub/icons`, `simple-icons`, or any icon library —
  the set is vendored and self-sufficient.
- No provider→mark registry, no dynamic `<Icon name="…" />` lookup component — the
  per-subpath, tree-shakeable architecture is unchanged.
- Not an unbounded Simple Icons mirror — brands outside the AI + dev/cloud/infra
  scope (payment, social, OS, gaming, …) are out of scope.
- No committed codegen — the one-time vendoring transform is a throwaway, as with
  the `material/` conversion.

## Capabilities

### New Capabilities

<!-- None — this extends an existing capability. -->

### Modified Capabilities

- `icon-library`: the `brands` category gains a defined coverage contract (a
  self-sufficient AI + dev/cloud/infra brand-mark set), the full lobehub-style
  variant surface per brand (`.Color`/`.Mono`/`.Avatar`/`.Text`/`.Combine`, present
  where each exists) with its color model, and a source-attribution requirement for
  brand marks. Existing marks and import paths keep rendering (variants are added
  additively).

## Impact

- **Code**: `packages/icons/src/brands/*` (many new multi-variant mark components +
  one shared `makeAvatar`/`makeCombine` composition module);
  `packages/icons/src/brands/brand-marks.spec.tsx` (hand array → glob smoke test);
  `packages/icons/README.md` (brands table); `apps/storybook/src/icons/brand-marks.stories.tsx`
  (catalog).
- **Public surface**: new `@zeroxsolutions/icons/brands/<name>` subpaths — additive
  (minor SemVer per `lib-public-exports-and-semver`); no existing subpath changes.
- **Dependencies**: none added at runtime. A dev-only, throwaway transform may pull
  from `simple-icons` / `@lobehub/icons` source during vendoring but is not
  committed and not a package dependency.
- **Build/test**: Vite per-file entries already glob `src/**/*.tsx`, so new marks
  are picked up with no config change; the smoke test becomes glob-driven.
