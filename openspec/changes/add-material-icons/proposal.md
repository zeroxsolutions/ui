## Why

`@zeroxsolutions/icons` today ships only a handful of hand-authored brand/vendor
**marks**; its README explicitly says "use lucide for every non-brand icon." We
now need a large set of **file-type icons** (language/framework/tooling glyphs)
that lucide does not carry, sourced from the MIT-licensed
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
`icons/` set.

Dropping hundreds of icons into the current package surfaces two structural
problems that must be solved first:

- The build is **flat** (`vite.config.mts` keys every entry by basename and
  throws on any collision), so the folder a source file lives in is discarded
  and category is meaningless. Real names like `react`, `vue`, `angular`,
  `docker`, `figma` exist in the Material set **and** are exactly the names we'd
  want as future brand marks — they would collide in one flat namespace.
- There is no classification architecture and no shared component API, so a
  large third-party set cannot be added coherently or attributed properly.

This change introduces a **category-based, provenance-respecting architecture**
with a single component pattern, then populates it with the Material file icons.

## What Changes

- **Refactor the icons package into category namespaces** that are real subpaths
  (not cosmetic folders): `brands/` (the existing marks, relocated) and
  `material/` (the new Material file icons). Import paths become
  `@zeroxsolutions/icons/material/typescript` and
  `@zeroxsolutions/icons/brands/deepgram`.
- **Change the build** (`vite.config.mts`) from flat-basename output to
  path-preserving output so category lives in the subpath and cross-category
  name collisions are impossible.
- **Adopt one component pattern** across the package — the LobeHub-style
  **compound component**: a base icon exposes its variants as attached
  sub-components. For Material icons the variant is a **theme** (`Icon.Light`);
  for brands it is a **style** (`.Color` / `.Mono`, reserved for later).
- **Add the Material file-icon set** as committed `.tsx` components: 587 base
  components; 46 of them also expose a `.Light` sub-component (the Material
  `*_light` pairs, merged). Folder icons are excluded.
- **Establish the naming and attribution rules**: PascalCase symbol +
  `Icon`/`Mark` suffix, leading digits spelled out (`3d` → `ThreeDIcon`); an MIT
  attribution note crediting Material Icon Theme.

## Success Criteria

- `@zeroxsolutions/icons/material/<name>` resolves to a full-color file icon
  component; the 46 icons with a light pair also expose `<Name>Icon.Light`.
- `@zeroxsolutions/icons/brands/<name>` resolves to the relocated marks; the
  Storybook imports are updated and green.
- The build produces path-preserving output (`dist/material/*.js`,
  `dist/brands/*.js`) and no longer relies on the flat-basename collision guard;
  `react` as a future brand and `material/react` coexist without conflict.
- Every icon renders at its intrinsic `viewBox`, scaled by a `size` prop; icons
  with internal gradient/clip ids render correctly when many appear on one page
  (ids are namespaced per icon).
- `nx lint build test @zeroxsolutions/icons` and the Storybook catalog are green.
- The package documents the Material Icon Theme (MIT) attribution.

## Non-Goals

- **No codegen tooling committed to the repo.** No SVGR/svgo dependency, no
  `icons:codegen` nx target. Icons are committed as plain `.tsx`, consistent with
  the package today; the one-time conversion is a throwaway process.
- **No folder icons** from Material Icon Theme (the 270 `folder-*` glyphs).
- **No brand style sub-components yet** (`.Color` / `.Mono` / `.Text`) — the
  compound API is designed to accept them later, but they are not authored here.
- **No automatic Material version tracking / re-sync** — future additions are
  requested separately.
- No changes to consuming apps beyond the Storybook import updates required by
  the brands relocation.

## Capabilities

### New Capabilities

- `icon-library`: the public contract and architecture of
  `@zeroxsolutions/icons` — category namespaces exposed as subpaths, the compound
  component API (base + variant/style sub-components), the symbol naming rule, and
  the Material file-icon set with its `.Light` theme variants and MIT attribution.

### Modified Capabilities

<!-- None — the icons package has no existing spec under openspec/specs/. -->

## Impact

- **Package**: `packages/icons` — new `src/brands/` and `src/material/` trees,
  rewritten `vite.config.mts` (path-preserving entries + dts flattening removal),
  README attribution/usage update. Existing brand-mark subpaths change
  (`/deepgram` → `/brands/deepgram`) — a **breaking** import change, acceptable at
  v0.0.1 where only Storybook consumes it.
- **App**: `apps/storybook` — update the 5 brand-mark imports; add a Material
  icons catalog story.
- **Public surface**: hundreds of new subpaths under `@zeroxsolutions/icons/*`
  (see `lib-public-exports-and-semver`); the `./*` exports map already covers
  nested paths, so no `package.json` exports change is required — verify at
  implementation.
- **Dependencies**: none added at runtime (no codegen deps).
- **Source**: Material Icon Theme icons, MIT-licensed — attribution recorded.
