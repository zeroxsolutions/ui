## 0.0.1 (2026-06-28)

### 🚀 Features

- **node:** reset version ([65ba65a](https://github.com/zeroxsolutions/ui-sdk/commit/65ba65a))
- **nx:** migrate ([03c1a0e](https://github.com/zeroxsolutions/ui-sdk/commit/03c1a0e))
- **fluent-emoji:** add animated (anim) style, served from a CDN ([04398d6](https://github.com/zeroxsolutions/ui-sdk/commit/04398d6))
- **package:** change chiselart -> zeroxsolutions ([00beb5e](https://github.com/zeroxsolutions/ui-sdk/commit/00beb5e))
- **shadcn:** add & update shadcn/ui components ([0afe265](https://github.com/zeroxsolutions/ui-sdk/commit/0afe265))
- **ui:** relocate emoji style to a standalone EmojiAppearance control ([8c2babe](https://github.com/zeroxsolutions/ui-sdk/commit/8c2babe))
- **ui:** add Conversation chat scroll surface + useStickToBottom ([caa4bb1](https://github.com/zeroxsolutions/ui-sdk/commit/caa4bb1))
- **ui:** add NumberField + SelectField inspector field controls ([857c091](https://github.com/zeroxsolutions/ui-sdk/commit/857c091))
- **ui:** add interactive control + tree primitives ([4af87f0](https://github.com/zeroxsolutions/ui-sdk/commit/4af87f0))
- **ui:** add layout shells (PageContainer, PanelHeader, Section, …) ([cb88ff6](https://github.com/zeroxsolutions/ui-sdk/commit/cb88ff6))
- **ui:** add a style toggle to EmojiPicker ([115e08f](https://github.com/zeroxsolutions/ui-sdk/commit/115e08f))
- **ui:** rich brand syntax theme for CodeBlock + editor ([aa6b4f9](https://github.com/zeroxsolutions/ui-sdk/commit/aa6b4f9))
- **ui:** add ai-elements renderer group ([af0248e](https://github.com/zeroxsolutions/ui-sdk/commit/af0248e))
- **ui:** add chat component group ([a7b8f3f](https://github.com/zeroxsolutions/ui-sdk/commit/a7b8f3f))
- **ui:** add SidebarGroupCollapsible composite ([eac0460](https://github.com/zeroxsolutions/ui-sdk/commit/eac0460))
- **ui:** add SidebarMenuCollapsible composite ([d8f58bb](https://github.com/zeroxsolutions/ui-sdk/commit/d8f58bb))
- **ui:** add document-centric code-editor component layer ([e58ca53](https://github.com/zeroxsolutions/ui-sdk/commit/e58ca53))
- **fluent-emoji:** self-host Fluent 3D emoji, drop the lobehub CDN ([56d423b](https://github.com/zeroxsolutions/ui-sdk/commit/56d423b))
- **ui:** add Center and Flex layout primitives ([f33c765](https://github.com/zeroxsolutions/ui-sdk/commit/f33c765))
- **ui:** add DataTable (@tanstack/react-table) on Base UI ([0d56609](https://github.com/zeroxsolutions/ui-sdk/commit/0d56609))
- **ui:** add Form (react-hook-form) on Base UI ([a11f0ad](https://github.com/zeroxsolutions/ui-sdk/commit/a11f0ad))
- **ui:** add magicui effects (meteors, animated-grid-pattern, highlighter) ([d0e7398](https://github.com/zeroxsolutions/ui-sdk/commit/d0e7398))
- **ui:** add PasswordInput (input-group + show/hide toggle) ([f84237c](https://github.com/zeroxsolutions/ui-sdk/commit/f84237c))
- **ui:** add status + signal tokens (success/warning/info/selection-signal/component-mark) ([881f633](https://github.com/zeroxsolutions/ui-sdk/commit/881f633))
- **ui:** AvatarEditor onUpload + tabs, ship source.css ([9e3abbd](https://github.com/zeroxsolutions/ui-sdk/commit/9e3abbd))
- bootstrap @chiselart/ui design-system SDK + Storybook app ([a51ae51](https://github.com/zeroxsolutions/ui-sdk/commit/a51ae51))

### 🩹 Fixes

- **ui:** repaint the editor when an async grammar load finishes mid-mount ([3771949](https://github.com/zeroxsolutions/ui-sdk/commit/3771949))
- **ui:** load Shiki grammars via explicit imports so the editor highlights ([7444d57](https://github.com/zeroxsolutions/ui-sdk/commit/7444d57))
- **ui:** keep selected editor text visible in dark mode ([e354f3d](https://github.com/zeroxsolutions/ui-sdk/commit/e354f3d))
- **ui:** restore + wire NumberField `step` (don't drop a load-bearing prop) ([4009b4c](https://github.com/zeroxsolutions/ui-sdk/commit/4009b4c))
- **ui:** restore FieldGrid/FieldRow `cols` as a computed grid-template ([9ed800d](https://github.com/zeroxsolutions/ui-sdk/commit/9ed800d))
- **ui:** wrap DataTable view-options label in DropdownMenuGroup ([efe6025](https://github.com/zeroxsolutions/ui-sdk/commit/efe6025))

### 🔥 Performance

- **ui:** window the EmojiPicker grid instead of mounting the whole catalog ([d4033e0](https://github.com/zeroxsolutions/ui-sdk/commit/d4033e0))
- **ui:** lazy-render emoji cells via IntersectionObserver ([c5e0490](https://github.com/zeroxsolutions/ui-sdk/commit/c5e0490))

### 🧱 Updated Dependencies

- Updated fluent-emoji to 0.0.1

### ❤️ Thank You

- Claude Opus 4.8
- Claude Opus 4.8 (1M context)
- Lương Văn Tú