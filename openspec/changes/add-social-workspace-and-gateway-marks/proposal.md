## Why

`@zeroxsolutions/icons` `brands/` now holds ~130 vendored marks, but they were
curated as an **AI + dev/cloud/infra** set. Two adjacent needs are unserved:

1. **Social / workspace / communication brands** - Facebook, Slack, Discord,
   Instagram, Notion, Figma, Zoom, Gmail, ... - are **entirely absent** (0 marks).
   Product surfaces that reference sign-in-with, share-to, integrations, or
   collaboration tools have no house source and would hand-roll look-alikes.
2. **Cloudflare AI Gateway provider coverage** - the SDK targets an AI platform,
   and AI Gateway is the inference entrypoint. Its published list is **24 native
   providers**; the current set already covers 20, but leaves a confirmed gap.

Cross-referencing the AI Gateway providers page against `brands/`: 20 of 24 are
covered. Genuinely missing / worth a distinct mark: **`cartesia`**, **`parallel`**
(absent), plus **`bedrock`**, **`vertexai`**, **`xai`** (currently only reachable
via the umbrella marks `aws` / `gcp` / `grok`). This change closes that gap and
opens the social/workspace domain.

## What Changes

- Add a **social / consumer** cluster to `brands/` (18): `facebook`, `messenger`,
  `instagram`, `threads`, `x`, `linkedin`, `youtube`, `tiktok`, `reddit`,
  `pinterest`, `snapchat`, `mastodon`, `bluesky`, `whatsapp`, `telegram`, `signal`,
  `wechat`, `line`.
- Add a **workspace / collaboration** cluster (19): `slack`, `discord`,
  `microsoft-teams`, `zoom`, `google-meet`, `notion`, `figma`, `trello`, `asana`,
  `jira`, `confluence`, `linear`, `miro`, `airtable`, `monday`, `clickup`,
  `dropbox`, `loom`, `calendly`.
- Add a **mail / office suite** cluster (6): `gmail`, `google-drive`,
  `google-docs`, `google-calendar`, `outlook`, `onedrive`.
- Close the **AI Gateway** provider gap (4 shipped): `parallel`, `bedrock`,
  `vertexai`, `xai`. (`cartesia` is **deferred** - no clean public SVG source
  exists; it has no umbrella mark, so it remains the one uncovered native provider,
  tracked pending a licensable brand asset.)
- Keep a **single flat `brands/` category** - no new subpath namespace. These
  marks import as `@zeroxsolutions/icons/brands/<name>`, exactly like every
  existing mark.
- Each mark follows the **established authoring patterns** already in the package:
  a monochrome single-path source ships `base(mono)` + `.Color` + `.Mono` +
  `.Avatar` (the `bitbucket` pattern); a full-color / gradient source ships
  `.Color` + `.Avatar` with the base rendering `.Color` and **no** `.Mono`
  (variants present only where they apply). No `.Text` / `.Combine` (these marks
  ship no wordmark artwork).
- Vendor artwork from public sources, recorded per mark: **Simple Icons (CC0)** for
  the majority; **gilbarbara/logos** for `linkedin`, `microsoft-teams`, `onedrive`;
  **svgl** for `outlook`. All three are already declared sources for the package.
- Update the README `brands/` table and the Storybook brand-marks catalog. The
  brand smoke test is already glob-driven, so it picks up new marks with no edit.

The existing ~130 marks and their import paths are unchanged - this is purely
additive to the public surface.

## Success Criteria

- All new marks resolve at `@zeroxsolutions/icons/brands/<name>` and render a
  non-empty svg; the AI Gateway cluster makes `brands/` cover **23 of 24** native
  Cloudflare AI Gateway providers (via a dedicated or umbrella mark), with
  `cartesia` the sole documented deferral.
- Each mark exposes exactly the variants its source supports - a monochrome source
  gets `base`/`.Color`/`.Mono`/`.Avatar`; a full-color source gets `.Color`/
  `.Avatar` (base = `.Color`, no `.Mono`); referencing an absent variant is a type
  error.
- `.Color` preserves intrinsic brand colors (including gradients); `.Mono`, where
  present, paints via `currentColor`; `.Avatar` centers the icon on a filled
  background defaulting to the brand's primary color; icon-form variants apply
  `size` to width/height.
- No two brand marks (existing or new) share an internal SVG id when rendered on
  one page - gradient marks (`instagram`, `microsoft-teams`, `outlook`, `onedrive`)
  isolate their ids via the existing `fill-ids` helper.
- The package adds **no** runtime dependency; marks ship as committed `.tsx`.
- `lint`, `build`, and `test` are green for `@zeroxsolutions/icons`.
- README `brands/` table and the Storybook catalog list every new mark with its
  source attribution; the trademark disclaimer is retained and covers the
  newly-added trademark-restrictive brands.

## Non-Goals

- No new category / import-subpath namespace (`social/`, `workspace/`) - the marks
  live in the one flat `brands/` category.
- No `.Text` / `.Combine` wordmark variants for these marks - none ship wordmark
  artwork in scope.
- No provider->mark registry or dynamic `<Icon name="..." />` lookup - the
  per-subpath, tree-shakeable architecture is unchanged.
- No unbounded social/brand mirror - scope is the enumerated 48. Adjacent domains
  (payment, OS, gaming, e-commerce) remain out of scope.
- No change to the `material/` file-icon set or the existing AI + dev/infra marks.
- No committed codegen - any one-time vendoring transform is throwaway, as with the
  prior brand-mark and `material/` work.

## Capabilities

### New Capabilities

<!-- None - this extends an existing capability. -->

### Modified Capabilities

- `icon-library`: broaden the "self-sufficient AI and dev/infra mark set"
  requirement so the `brands` category also spans **social / communication** and
  **workspace / productivity** brands, and assert **coverage of the Cloudflare AI
  Gateway native provider list** (via a dedicated or umbrella mark per provider).
  Extend the source-attribution requirement to note gilbarbara/logos and svgl as
  sources for specific marks and the added trademark-restrictive brands. Existing
  marks and import paths are unchanged (additive).

## Impact

- **Code**: 48 new `packages/icons/src/brands/<name>.tsx` mark components (reusing
  the existing `makeAvatar` / `fill-ids` helpers - no new composition module);
  `packages/icons/README.md` (brands table + attribution); `apps/storybook/src/icons/brand-marks.stories.tsx`
  (catalog). No change to `brand-marks.spec.tsx` - it is glob-driven.
- **Public surface**: 48 new `@zeroxsolutions/icons/brands/<name>` subpaths -
  additive (minor SemVer per `lib-public-exports-and-semver`); no existing subpath
  changes.
- **Dependencies**: none added at runtime. A dev-only, throwaway transform may pull
  from `simple-icons` source during vendoring but is not committed and not a
  package dependency.
- **Build/test**: the per-file build entries and the glob smoke test already pick
  up `src/brands/*.tsx`, so new marks need no config change.
- **Licensing**: LinkedIn is confirmed removed from Simple Icons (sourced from
  gilbarbara/logos instead); the Microsoft product family (Teams, OneDrive,
  Outlook) is sourced from gilbarbara/svgl. All are trademark-restrictive - the
  retained disclaimer states the marks identify their owners without implying
  affiliation or endorsement; follow each owner's brand guidelines when used.
