# @zeroxsolutions/ui

A React component library and design system — ~120 components built on
[Base UI](https://base-ui.com) primitives and **Tailwind CSS v4**, shipped as
tree-shakeable per-component subpaths that mirror the source tree. Covers everything from low-level
primitives (button, dialog, select) to composed surfaces (a CodeMirror code
editor, a chat thread, an avatar editor), all wired to one CSS-variable token
set that flips light/dark for free.

```tsx
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@zeroxsolutions/ui/components/ui/dialog';

<Dialog>
  <DialogTrigger render={<Button>Open</Button>} />
  <DialogContent>…</DialogContent>
</Dialog>;
```

## Install

```sh
pnpm add @zeroxsolutions/ui @base-ui/react react react-dom
```

`react`, `react-dom`, and `@base-ui/react` are peer dependencies (React 19).
Everything else the components need — CodeMirror, Shiki, Recharts, React Hook
Form, sonner, vaul, embla, motion, lucide-react, `@zeroxsolutions/fluent-emoji`,
… — is bundled as a regular dependency, so you only install the peers above.

Components are **client components** (they use Base UI's hooks and browser
APIs); under React Server Components, import them into a `"use client"` module.

## Styling

Components render Tailwind v4 utility classes against a set of CSS-variable
design tokens. There are two CSS entrypoints, both shipped as raw CSS and meant
to be imported from your Tailwind v4 stylesheet:

| Import                          | What it is                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@zeroxsolutions/ui/styles.css` | The full foundation — Tailwind v4, the `dark` variant, the Inter variable font, and the SDK's design tokens (`:root` + `.dark`, including the `--code-*` syntax palette).                                          |
| `@zeroxsolutions/ui/source.css` | A single `@source './'` that points Tailwind's content scanner at the library's compiled components in `node_modules` (which your app's build skips by default), so the utilities they use actually get generated. |

The canonical setup imports both:

```css
/* app.css — processed by Tailwind v4 */
@import '@zeroxsolutions/ui/styles.css';
@import '@zeroxsolutions/ui/source.css';
```

If your app **already owns Tailwind and its own tokens**, skip `styles.css` and
import only `source.css` — the components ride your token names (`--primary`,
`--muted`, `--border`, …) instead of bringing their own.

> Requires **Tailwind CSS v4** in your build (`@tailwindcss/vite` or the PostCSS
> plugin). The stylesheets ship as source, not pre-compiled CSS.

### Dark mode

Dark mode is a `dark` custom variant keyed off a `.dark` class on an ancestor —
toggle that class however you like. The library depends on
[`next-themes`](https://github.com/pacocoursey/next-themes) and pairs with it out
of the box, but any class toggler works.

## Components

Every module is its own subpath, mirroring the source tree under `dist/`:
`@zeroxsolutions/ui/<dir>/<name>`. The prefixes are `components/ui/*`
(primitives), `components/layouts/*`, `components/ai-elements/*`,
`components/chat/*`, `components/*` (composed surfaces), `hooks/*`, and `lib/*`
(utilities). For example:

```tsx
import { Button } from '@zeroxsolutions/ui/components/ui/button';
import { Center } from '@zeroxsolutions/ui/components/layouts/center';
import { CodeBlock } from '@zeroxsolutions/ui/components/ai-elements/code-block';
import { CodeEditor } from '@zeroxsolutions/ui/components/code-editor';
import { useCommandShortcut } from '@zeroxsolutions/ui/hooks/use-command-shortcut';
import { cn } from '@zeroxsolutions/ui/lib/utils';
```

A few groups (names below are the leaf, prefixed per the line that introduces them):

- **Primitives** (`components/ui/*`, ~70, Base UI / shadcn-style) — `accordion`,
  `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `calendar`, `card`,
  `carousel`, `chart`, `checkbox`, `combobox`, `command`, `context-menu`,
  `dialog`, `drawer`, `dropdown-menu`, `field`, `form`, `hover-card`, `input`,
  `input-otp`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`,
  `radio-group`, `resizable`, `scroll-area`, `select`, `sheet`, `sidebar`,
  `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `tooltip`,
  … plus `data-table` (TanStack Table) and chat primitives (`message`, `bubble`,
  `attachment`).
- **Layouts** (`components/layouts/*`) — `center`, `container`, `field-grid`,
  `field-row`, `floating-toolbar-shell`, `labeled-control`, `panel-header`,
  `section`.
- **Code editor** (`components/*`) — `code-editor` (CodeMirror + file tree +
  command palette), `code-editor-pane`, `file-tree`, `file-content-router`,
  `command-switcher`, `frontmatter-editor`, `markdown-view`, `font-preview`,
  `image-preview`, `binary-file-card`, `file-type-icon`.
- **Chat & AI elements** — chat surfaces under `components/chat/*`
  (`chat-message-shell`, `chat-empty-state`, `chat-attachment-chip`,
  `chat-composer-attachments`, `chat-composer-ghost-text`); AI elements under
  `components/ai-elements/*` (`code-block`, `conversation`, `reasoning`, `tool`).
- **Emoji** (`components/*`) — `emoji-picker`, `emoji-appearance`,
  `avatar-editor`, backed by
  [`@zeroxsolutions/fluent-emoji`](../fluent-emoji).
- **Higher-level controls** (`components/*`) — `number-field`, `select-field`,
  `search-input`, `password-input`, `tag-input`, `confirm-button`,
  `split-button`, `toolbar-button`, `popover-icon-button`, `tree-item`,
  `tree-row`, `status-dot`, `dirty-dot`, `icon-label`,
  `resize-handle`, `tab-close-button`, `sidebar-group-collapsible`,
  `sidebar-menu-collapsible`.
- **Hooks** (`hooks/*`) — `use-command-shortcut`, `use-mobile`,
  `use-stick-to-bottom`.
- **Utilities** (`lib/*`) — `utils` (`cn`), `shiki`, `code-theme`,
  `code-syntax`, and other internals.

Browse the workspace **Storybook** for the full catalog with live, interactive
examples of every component and variant.

## Syntax highlighting

`code-block` (static `<pre>`) and the CodeMirror editor share one
[Shiki](https://shiki.style)-based highlighter and the hand-authored `ui-code`
theme, whose token colors are `var(--code-*)` references. Because the palette
lives in the token layer, highlighted code flips light/dark with the rest of the
UI — no Shiki dual-theme plumbing.

## Icons

Components use [lucide-react](https://lucide.dev) for iconography. For brand /
vendor marks lucide doesn't ship, see [`@zeroxsolutions/icons`](../icons).

## Development

```sh
nx build @zeroxsolutions/ui    # build to dist/ (subpaths mirror src + raw CSS)
nx test @zeroxsolutions/ui     # unit tests via Vitest
```

In the workspace, the **Storybook** app consumes this package exactly as a
downstream app would — resolved from `node_modules` via its published `exports`,
with **no** source aliases or path rewrites — so a broken export, type, or
missing file surfaces there too. Rebuild the library
(`nx build @zeroxsolutions/ui`) for Storybook to pick up component changes.
