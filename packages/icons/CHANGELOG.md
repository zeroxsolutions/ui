## 0.2.0 (2026-11-12)

### 🚀 Features

- **icons:** export the brand-mark manifest alone at /brand-mark-url ([6128dace](https://github.com/zeroxsolutions/ui/commit/6128dace))
- **icons:** draw a brand mark by name with one BrandMark component ([7816088f](https://github.com/zeroxsolutions/ui/commit/7816088f))
- **icons:** generate a brand manifest and resolve a mark to its url ([0b968419](https://github.com/zeroxsolutions/ui/commit/0b968419))
- **icons:** render every brand mark to an svg file per variant ([7d71fd32](https://github.com/zeroxsolutions/ui/commit/7d71fd32))

### 🩹 Fixes

- **icons:** resolve the subpaths under the default condition too ([a17e4fc6](https://github.com/zeroxsolutions/ui/commit/a17e4fc6))
- **icons,editor-core:** keep dist when building, for typecheck ([f2d8179c](https://github.com/zeroxsolutions/ui/commit/f2d8179c))
- **deps:** keep icons and fluent-emoji react peers as ranges ([e0f41e6b](https://github.com/zeroxsolutions/ui/commit/e0f41e6b))
- **icons:** fetch the mask probe in cors mode and keep server components working ([ec664a3f](https://github.com/zeroxsolutions/ui/commit/ec664a3f))
- **icons:** restart a returning brand mark's fallback and pin the untested cases ([6f562f91](https://github.com/zeroxsolutions/ui/commit/6f562f91))

### 💅 Refactors

- ⚠️ **icons:** serve brand marks as files behind one BrandMark ([4b5bab53](https://github.com/zeroxsolutions/ui/commit/4b5bab53))
- **icons:** draw AiProviderIcon through BrandMark ([06c237c6](https://github.com/zeroxsolutions/ui/commit/06c237c6))

### ⚠️ Breaking Changes

- **icons:** serve brand marks as files behind one BrandMark ([4b5bab53](https://github.com/zeroxsolutions/ui/commit/4b5bab53))
  every @zeroxsolutions/icons/brands/<name> subpath and
  its <Name>Mark component are removed; draw a brand with
  <BrandMark name="<name>" /> from @zeroxsolutions/icons/brand-mark.
  AiProviderMapping takes `mark: BrandMarkName` in place of `Icon`.
  Refs: #24

### ❤️ Thank You

- Lương Văn Tú
- luongvantuit

## 0.1.1 (2026-10-05)

### 🚀 Features

- **icons:** add the apple and google-play brand marks ([#17](https://github.com/zeroxsolutions/ui/issues/17))

### 🩹 Fixes

- **icons:** keep the google-play mark from shrinking in a flex row ([04a373d5](https://github.com/zeroxsolutions/ui/commit/04a373d5))

### ❤️ Thank You

- Claude Opus 5.5
- luongvantuit

## 0.1.0 (2026-09-28)

### 🚀 Features

- **icons:** add AiProviderIcon resolver and vendor 23 AI provider marks ([9f11f81](https://github.com/zeroxsolutions/ui-sdk/commit/9f11f81))
- **icons:** add social/workspace + AI Gateway provider brand marks ([02de1e4](https://github.com/zeroxsolutions/ui-sdk/commit/02de1e4))
- **icons:** add self-sufficient AI + dev/infra brand-mark set ([6a080ec](https://github.com/zeroxsolutions/ui-sdk/commit/6a080ec))
- ⚠️ **icons:** add Material file-icon category and category-based architecture ([ffc3000](https://github.com/zeroxsolutions/ui-sdk/commit/ffc3000))

### 💅 Refactors

- ⚠️ **icons,fluent-emoji:** rename modules to match primary export ([0cfdec9](https://github.com/zeroxsolutions/ui-sdk/commit/0cfdec9))

### ⚠️ Breaking Changes

- **icons,fluent-emoji:** rename modules to match primary export ([0cfdec9](https://github.com/zeroxsolutions/ui-sdk/commit/0cfdec9))
  @zeroxsolutions/icons/ai-provider-config (a ./* subpath)
  is renamed to ai-provider-mappings. No in-repo consumer of that subpath;
  external consumers must update (major bump via nx release, cluster 5).
  The fluent-emoji lib renames are internal (only "." is exported).
- **icons:** add Material file-icon category and category-based architecture ([ffc3000](https://github.com/zeroxsolutions/ui-sdk/commit/ffc3000))
  brand marks moved to the `brands/` subpath — import
  `@zeroxsolutions/icons/brands/<name>` instead of `@zeroxsolutions/icons/<name>`.

### ❤️ Thank You

- Claude
- Claude Opus 4.8
- Claude Opus 4.8 (1M context)
- Lương Văn Tú

## 0.0.1 (2026-06-28)

### 🚀 Features

- **node:** reset version ([65ba65a](https://github.com/zeroxsolutions/ui-sdk/commit/65ba65a))
- **nx:** migrate ([03c1a0e](https://github.com/zeroxsolutions/ui-sdk/commit/03c1a0e))
- **package:** change chiselart -> zeroxsolutions ([00beb5e](https://github.com/zeroxsolutions/ui-sdk/commit/00beb5e))
- **icons:** build out @chiselart/icons with the vendored brand marks ([6ff4278](https://github.com/zeroxsolutions/ui-sdk/commit/6ff4278))
- bootstrap @chiselart/ui design-system SDK + Storybook app ([a51ae51](https://github.com/zeroxsolutions/ui-sdk/commit/a51ae51))

### ❤️ Thank You

- Claude Opus 4.8 (1M context)
- Lương Văn Tú
