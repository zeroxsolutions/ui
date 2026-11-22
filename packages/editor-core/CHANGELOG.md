## 0.1.1 (2026-11-22)

### 🚀 Features

- **editor-core:** give the engine escape decorations and a selection ([fd44d846](https://github.com/zeroxsolutions/ui/commit/fd44d846))
- **editor-core:** hold email list items and lanes in their parents ([b27ca394](https://github.com/zeroxsolutions/ui/commit/b27ca394))
- **editor-core:** open a trigger after anything, give a leaf its text ([1cb62def](https://github.com/zeroxsolutions/ui/commit/1cb62def))
- **editor-core:** keep block ids, required blocks and locked structure ([320f7034](https://github.com/zeroxsolutions/ui/commit/320f7034))
- **editor-core:** email nodes and the email-blocks codec ([fd0de544](https://github.com/zeroxsolutions/ui/commit/fd0de544))
- **editor-core:** export, import and check an SMS body ([b7dba7e7](https://github.com/zeroxsolutions/ui/commit/b7dba7e7))
- **editor-core:** validate an email against its profile ([fb49e9de](https://github.com/zeroxsolutions/ui/commit/fb49e9de))
- **editor-core:** email and SMS profiles ([b1fd586b](https://github.com/zeroxsolutions/ui/commit/b1fd586b))
- **editor-core:** carry the message template code ([0edefcb2](https://github.com/zeroxsolutions/ui/commit/0edefcb2))

### 🩹 Fixes

- **editor-core:** refuse bounds the renderer would refuse ([7e3bc6c1](https://github.com/zeroxsolutions/ui/commit/7e3bc6c1))
- **ui:** read undo from history and re-apply the shown link ([ea8c0307](https://github.com/zeroxsolutions/ui/commit/ea8c0307))
- **editor-core:** check new blocks' ids, keep author setContent guarded ([9dedb1fd](https://github.com/zeroxsolutions/ui/commit/9dedb1fd))
- **editor-core:** keep ids off the clipboard and let a host load content ([12877aea](https://github.com/zeroxsolutions/ui/commit/12877aea))
- **editor-core:** export an unedited email block unchanged ([274a3f6c](https://github.com/zeroxsolutions/ui/commit/274a3f6c))
- **editor-core:** flag an empty list and a non-token href ([1d7b2570](https://github.com/zeroxsolutions/ui/commit/1d7b2570))
- **editor-core:** declare the package free of side effects ([3ad65a18](https://github.com/zeroxsolutions/ui/commit/3ad65a18))
- **icons,editor-core:** keep dist when building, for typecheck ([f2d8179c](https://github.com/zeroxsolutions/ui/commit/f2d8179c))

### 💅 Refactors

- **editor-core:** keep the profile core free of the engine ([9abc26cc](https://github.com/zeroxsolutions/ui/commit/9abc26cc))
- **editor-core:** list each entry's names in its index ([2a0c783b](https://github.com/zeroxsolutions/ui/commit/2a0c783b))
- **ui:** move the web registry into packages/ui ([48d7f659](https://github.com/zeroxsolutions/ui/commit/48d7f659))

### ❤️ Thank You

- Lương Văn Tú

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
