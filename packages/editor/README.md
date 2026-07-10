# @zeroxsolutions/editor

A Notion-like, block-based rich-text editor. The editing engine (Tiptap /
ProseMirror) is **fully hidden behind a frozen, engine-free contract** — you
build documents, define features, and drive commands through the `IEditor`
façade and declarative `defineFeature` API, importing no engine type. The engine
can be swapped without rippling into your code. JSON is the source of truth;
HTML/Markdown are pluggable per-node codecs; the two `Viewer`s render without
instantiating the engine.

> The one exception is the explicitly **unstable** `document/advanced` subpath —
> see [The `advanced` escape](#the-advanced-escape).

## Install

```jsonc
// package.json
"dependencies": { "@zeroxsolutions/editor": "workspace:*" }
```

Peers (provide them in the consuming app): `react`, `react-dom`,
`@base-ui/react`, `next-themes`.

Wire the stylesheets through Tailwind (never a JS side-effect import):

```css
@import '@zeroxsolutions/editor/styles.css';  /* tokens + dark variant */
@import '@zeroxsolutions/editor/source.css';   /* points Tailwind's scanner at the lib */
```

## Quick start — the editable surface

```tsx
import { Editor } from '@zeroxsolutions/editor/document/react/editor';
import { standardKit } from '@zeroxsolutions/editor/document/features/standard/index';
import { callout } from '@zeroxsolutions/editor/document/features/callout/index';

<Editor
  features={[standardKit(), callout()]}
  content={{ type: 'doc', content: [{ type: 'paragraph' }] }}
  onReady={(editor) => { /* editor: IEditor — the engine-free façade */ }}
  onChange={(delta) => { /* step-sized delta, not a full snapshot */ }}
/>
```

Or build imperatively with the fluent builder:

```ts
import { createEditor } from '@zeroxsolutions/editor/document/core/index';

const editor = createEditor()
  .use(standardKit())
  .use(callout())
  .content(doc)
  .onChange((delta) => save(delta))
  .build({ element });

editor.run('toggleHeading', { level: 2 }); // validated, dispatched via the façade
editor.isActive('bold');                   // engine-free state query
editor.getJSON();                          // canonical document JSON
```

Everything you do goes through `IEditor` — `run` / `can` / `isActive`,
`getJSON` / `setContent`, `getSelection` / `focus`, `onChange` / `onSnapshot`.
No engine package is imported.

## Reading — two Viewers

```tsx
import { Viewer } from '@zeroxsolutions/editor/document/react/viewer';         // static, SSR-safe (no engine in its graph)
import { ViewerLive } from '@zeroxsolutions/editor/document/react/viewer-live'; // read-only live editor

<Viewer doc={doc} features={[standardKit(), callout()]} />;
```

`<Viewer>` renders JSON server-side through the feature codecs — its module graph
contains no ProseMirror/Tiptap.

## Authoring a feature — `defineFeature`

A feature is the single declarative unit: one block/mark bundled with its
behavior, serialization, node view, and UI — **engine-free**.

```tsx
import { defineFeature } from '@zeroxsolutions/editor/document/core/index';
import { z } from 'zod';

export const badge = () =>
  defineFeature({
    id: 'badge',
    nodes: [{
      name: 'badge',
      group: 'inline',
      atom: true,
      attrs: z.object({ label: z.string().default('') }),
      render: ({ attrs }) => <span className="badge">{attrs.label}</span>,
    }],
    codecs: [{
      node: 'badge',
      toMarkdown: (n) => `:${n.attrs?.label}:`,
      toHTML: (n) => `<span data-badge>${n.attrs?.label}</span>`,
      toReact: (n) => <span data-badge>{n.attrs?.label}</span>,
      fromHTML: (el) => el.hasAttribute('data-badge')
        ? { type: 'badge', attrs: { label: el.textContent ?? '' } } : null,
    }],
    commands: {
      insertBadge: {
        args: z.object({ label: z.string() }),
        run: (editor, { label }) =>
          editor.run('insertContent', { content: { type: 'badge', attrs: { label } } }),
      },
    },
    slash: [{ id: 'badge', title: 'Badge', group: 'Inline', command: 'insertBadge' }],
  });
```

Feature commands compose the built-in primitives (`insertContent`, `toggleMark`,
`setNode`, …) through `editor.run(...)` — they never touch the engine. Attribute
schemas are Zod; document JSON is validated at the boundaries only.

## Built-in features

Import each from its own subpath so heavy blocks stay lazy:

| Feature | Subpath | Notes |
| --- | --- | --- |
| `standardKit` | `…/features/standard/index` | headings, lists, task lists, quote, divider, hard break + bold/italic/strike/code/underline/highlight/sub/superscript |
| `callout` | `…/features/callout/index` | icon + themed palette; GitHub-alert Markdown |
| `toggle` | `…/features/toggle/index` | collapsible `<details>` |
| `link` | `…/features/link/index` | link mark (autolink / paste-URL) |
| `image` | `…/features/image/index` | node view with alt/width popover |
| `table` | `…/features/table/index` | GFM tables — **lazy** |
| `codeBlock` | `…/features/code-block/index` | via the `CodeMirrorPane` seam — **lazy** |
| `mermaid` | `…/features/mermaid/index` | lazy-rendered diagram — **lazy** |
| `math` | `…/features/math/index` | inline + block KaTeX — **lazy** |
| `mention`, `embed` | `…/features/mention/index`, `…/features/embed/index` | inline chip / iframe embed |

The code block delegates its editing surface to a registered pane:

```ts
import { setCodeMirrorPane } from '@zeroxsolutions/editor/document/features/code-block/index';
setCodeMirrorPane(MyCodeMirrorPane); // an app-provided (lazy) @zeroxsolutions/ui pane; falls back to a textarea
```

## Serialization & Migrate

```ts
import { createCodecRegistry, serialize, importMarkdown } from '@zeroxsolutions/editor/document/serialize/index';
import { createMigrator, summarizeImport } from '@zeroxsolutions/editor/document/migrate/index';

const registry = createCodecRegistry([standardKit(), callout()]);
serialize(doc, 'markdown', registry);          // 'html' | 'react' | custom formats
importMarkdown('# Title\n\n> [!NOTE]\n> hi', registry);

const migrator = createMigrator();             // generic Markdown + HTML adapters
const result = migrator.migrate({ format: 'html', content }, registry);
summarizeImport(result);                        // { warnings, dropped, clean }
```

Import is Zod-gated and returns an observable `ImportResult` (warnings + dropped
content). Add a new output format with `registry.registerNodeSerializer(...)` —
no change to the walker.

## Chrome

Slash / bubble / block menus and a toolbar, composed from `@zeroxsolutions/ui`
and driven entirely through the façade (positioned from the browser selection, no
engine coordinates):

```tsx
import { EditorToolbar, SlashMenu, BubbleMenu, BlockMenu, collectUiContributions, defaultBlockMenuItems }
  from '@zeroxsolutions/editor/document/ui/index';

const ui = collectUiContributions(features);
<EditorToolbar editor={editor} items={ui.toolbar} />;
<SlashMenu editor={editor} items={ui.slash} />;
<BubbleMenu editor={editor} items={ui.bubble} container={container} />;
<BlockMenu editor={editor} items={[...ui.blockMenu, ...defaultBlockMenuItems]} container={container} />;
```

## Theming

Engine-agnostic theme built on the `@zeroxsolutions/ui` token set (light/dark via
the `.dark` class):

```tsx
import { EditorThemeProvider, extendTheme } from '@zeroxsolutions/editor/shared/theme/index';
```

## The `advanced` escape

`@zeroxsolutions/editor/document/advanced` is the **only** engine-exposing module
and is **outside the SemVer-stable contract** — it may change in any release. It
re-exports the raw engine primitives (`Extension`, `Node`, `Mark`, `Plugin`, …)
for a feature that must reach the engine via `feature.advanced.engineExtensions`
/ `advanced.prosePlugins`. House features use it internally (e.g. `standardKit`
wraps Tiptap's MIT extensions) yet still export an engine-free `EditorFeature`. A
build guard fails if any engine type leaks into a public `.d.ts` outside this
subpath.

## Public surface

Per-file subpath exports (`./*` → `./dist/*`), so each module is imported (and
tree-shaken / lazy-loaded) on its own. **Import each module at its full
subpath**: a directory barrel is `<subpath>/index`, a standalone module is its
file path (e.g. `document/react/editor`).

- `document/core/index` — `createEditor`, `defineFeature`, the `IEditor` contract, errors.
- `document/react/{editor,viewer,viewer-live}` — React surfaces (files).
- `document/ui/index` — chrome (slash/bubble/block menus + toolbar).
- `document/features/<name>/index` — one barrel per feature.
- `document/serialize/index`, `document/migrate/index` — codecs + import/Migrate.
- `shared/theme/index` — theming.
- `document/advanced` — the unstable engine escape (a file).

Released with Nx Release + SemVer from conventional commits.

## Running unit tests

`nx test @zeroxsolutions/editor` (Vitest). `nx build @zeroxsolutions/editor` runs
the engine-hiding build guard.
