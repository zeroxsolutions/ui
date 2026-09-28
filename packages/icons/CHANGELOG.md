## 0.1.0 (2026-09-28)

### 🚀 Features

- **icons:** add AiProviderIcon resolver and vendor 23 AI provider marks ([9f11f81](https://github.com/zeroxsolutions/ui-sdk/commit/9f11f81))
- **icons:** add social/workspace + AI Gateway provider brand marks ([02de1e4](https://github.com/zeroxsolutions/ui-sdk/commit/02de1e4))
- **icons:** add self-sufficient AI + dev/infra brand-mark set ([6a080ec](https://github.com/zeroxsolutions/ui-sdk/commit/6a080ec))
- ⚠️ **icons:** add Material file-icon category and category-based architecture ([ffc3000](https://github.com/zeroxsolutions/ui-sdk/commit/ffc3000))
- **node:** reset version ([65ba65a](https://github.com/zeroxsolutions/ui-sdk/commit/65ba65a))
- **nx:** migrate ([03c1a0e](https://github.com/zeroxsolutions/ui-sdk/commit/03c1a0e))
- **package:** change chiselart -> zeroxsolutions ([00beb5e](https://github.com/zeroxsolutions/ui-sdk/commit/00beb5e))
- **icons:** build out @chiselart/icons with the vendored brand marks ([6ff4278](https://github.com/zeroxsolutions/ui-sdk/commit/6ff4278))
- bootstrap @chiselart/ui design-system SDK + Storybook app ([a51ae51](https://github.com/zeroxsolutions/ui-sdk/commit/a51ae51))

### 💅 Refactors

- ⚠️ **icons,fluent-emoji:** rename modules to match primary export ([0cfdec9](https://github.com/zeroxsolutions/ui-sdk/commit/0cfdec9))
- ⚠️ **ui:** ui-composed cluster - renames, data-slot, variants ([#000](https://github.com/zeroxsolutions/ui-sdk/issues/000))

### ⚠️ Breaking Changes

- **icons,fluent-emoji:** rename modules to match primary export ([0cfdec9](https://github.com/zeroxsolutions/ui-sdk/commit/0cfdec9))
  @zeroxsolutions/icons/ai-provider-config (a ./* subpath)
  is renamed to ai-provider-mappings. No in-repo consumer of that subpath;
  external consumers must update (major bump via nx release, cluster 5).
  The fluent-emoji lib renames are internal (only "." is exported).
- **ui:** ui-composed cluster - renames, data-slot, variants ([#000](https://github.com/zeroxsolutions/ui-sdk/issues/000))
  three public subpath renames in @zeroxsolutions/ui -
  components/chat/chat-message-shell -> chat-message,
  components/tree-row -> tree-indent,
  components/layouts/field-row -> layouts/field-group. In-repo consumers
  updated; external consumers must update import paths (major bump via
  nx release).
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
