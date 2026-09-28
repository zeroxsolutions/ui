## 0.1.0 (2026-09-28)

### 💅 Refactors

- ⚠️ rename docs-ui app to registry-ui ([bded078](https://github.com/zeroxsolutions/ui-sdk/commit/bded078))
- ⚠️ **editor-core:** make core framework-free, move react to chrome ([4363169](https://github.com/zeroxsolutions/ui-sdk/commit/4363169))
- ⚠️ ui -> docs-ui registry, editor -> headless core + chrome ([f228fe6](https://github.com/zeroxsolutions/ui-sdk/commit/f228fe6))

### ⚠️ Breaking Changes

- rename docs-ui app to registry-ui ([bded078](https://github.com/zeroxsolutions/ui-sdk/commit/bded078))
  workspace packages @zeroxsolutions/docs-ui and @zeroxsolutions/docs-ui-e2e rename to @zeroxsolutions/registry-ui and @zeroxsolutions/registry-ui-e2e.
- **editor-core:** make core framework-free, move react to chrome ([4363169](https://github.com/zeroxsolutions/ui-sdk/commit/4363169))
  the published editor-core .d.ts no longer names ReactNode, react is removed from peerDependencies, and NodeSpec.render / NodeViewProps.children / the UI-contribution icon slots are typed unknown at core. The chrome re-types these via the new editor/react-types barrel (ReactSerializeContext / ReactNodeCodec / ReactMarkCodec) and casts at the registration/read boundaries (as NodeCodec / as MarkCodec / as ReactNode).
- ui -> docs-ui registry, editor -> headless core + chrome ([f228fe6](https://github.com/zeroxsolutions/ui-sdk/commit/f228fe6))
  @zeroxsolutions/ui is deleted (registry source at
  apps/docs-ui/registry/bases/base-ui/); @zeroxsolutions/editor is renamed
  @zeroxsolutions/editor-core and trimmed to headless - its React chrome, theme, and
  built-in features are registry items now, not package exports.

### ❤️ Thank You

- Claude
- Lương Văn Tú
