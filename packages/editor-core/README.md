# @zeroxsolutions/editor-core

A Notion-like, block-based rich-text **editing engine** - headless. The engine
(Tiptap / ProseMirror) is **fully hidden behind a frozen, engine-free contract**:
you build documents, define features, and drive commands through the `IEditor`
façade and the declarative `defineFeature` API, importing no engine type. The
engine can be swapped without rippling into your code. JSON is the source of truth;
HTML/Markdown are pluggable per-node codecs.

**This package is the headless core.** It ships no React surfaces, no menus or
toolbar, no theme CSS, and no concrete features - those are the **editor chrome**,
which lives in the ui registry (`@/registry/bases/base-ui/editor/...`) and
composes this core. The chrome injects its React node-view renderer at mount via
the `nodeViewRenderer` option; a headless consumer passes its own (or omits it
and gets no React node views).

> The one exception is the explicitly **unstable** `document/advanced` subpath -
> see [The `advanced` escape](#the-advanced-escape).

## Install

```jsonc
// package.json
"dependencies": { "@zeroxsolutions/editor-core": "workspace:*" }
```

Peer: `react` (types only - the core renders no React itself; the `NodeSpec.render`
contract uses React *types*).

## Quick start - the imperative builder

```ts
import { createEditor } from '@zeroxsolutions/editor-core/document/core';

const editor = createEditor()
  .use(myFeature())
  .content({ type: 'doc', content: [{ type: 'paragraph' }] })
  .onChange((delta) => save(delta))
  .nodeViewRenderer(myRenderer) // React node views - inject yours (the chrome does), or omit
  .build({ element });

editor.run('toggleHeading', { level: 2 }); // validated, dispatched via the façade
editor.isActive('bold'); // engine-free state query
editor.getJSON(); // canonical document JSON
```

Everything you do goes through `IEditor` - `run` / `can` / `isActive`,
`getJSON` / `setContent`, `getSelection` / `focus`, `onChange` / `onSnapshot`.
No engine package is imported.

## The injected node-view renderer

A node with a React view (`NodeSpec.render`) needs a renderer that lifts it into
the engine's node-view system - and that lift requires `@tiptap/react`, which the
core deliberately does not depend on. So the renderer is a **port**: the chrome
supplies `createNodeViewRenderer()` (wrapping `ReactNodeViewRenderer` + the
`NodeViewWrapper` host) and passes it to `createDocumentEditor({ nodeViewRenderer })`
or `.nodeViewRenderer(...)` on the builder. A headless build with no renderer
simply omits React node views.

## Authoring a feature - `defineFeature`

A feature is the single declarative unit: one block/mark bundled with its
behavior, serialization, node view, and UI - **engine-free**.

```tsx
import { defineFeature } from '@zeroxsolutions/editor-core/document/core';
import { z } from 'zod';

export const badge = () =>
  defineFeature({
    id: 'badge',
    nodes: [
      {
        name: 'badge',
        group: 'inline',
        atom: true,
        attrs: z.object({ label: z.string().default('') }),
        render: ({ attrs }) => <span className="badge">{attrs.label}</span>,
      },
    ],
    codecs: [
      {
        node: 'badge',
        toMarkdown: (n) => `:${n.attrs?.label}:`,
        toHTML: (n) => `<span data-badge>${n.attrs?.label}</span>`,
        toReact: (n) => <span data-badge>{n.attrs?.label}</span>,
        fromHTML: (el) =>
          el.hasAttribute('data-badge')
            ? { type: 'badge', attrs: { label: el.textContent ?? '' } }
            : null,
      },
    ],
    commands: {
      insertBadge: {
        args: z.object({ label: z.string() }),
        run: (editor, { label }) =>
          editor.run('insertContent', {
            content: { type: 'badge', attrs: { label } },
          }),
      },
    },
    slash: [
      { id: 'badge', title: 'Badge', group: 'Inline', command: 'insertBadge' },
    ],
  });
```

Feature commands compose the built-in primitives (`insertContent`, `toggleMark`,
`setNode`, ...) through `editor.run(...)` - they never touch the engine. Attribute
schemas are Zod; document JSON is validated at the boundaries only.

The built-in features (`standardKit`, `callout`, ...) are **editor chrome** -
shipped from the ui registry alongside the React surfaces, not from this package.

## Serialization & Migrate

```ts
import {
  createCodecRegistry,
  serialize,
  importMarkdown,
} from '@zeroxsolutions/editor-core/document/serialize';
import {
  createMigrator,
  summarizeImport,
} from '@zeroxsolutions/editor-core/document/migrate';

const registry = createCodecRegistry([myFeature()]);
serialize(doc, 'markdown', registry); // 'html' | 'react' | custom formats
importMarkdown('# Title\n\n> [!NOTE]\n> hi', registry);

const migrator = createMigrator(); // generic Markdown + HTML adapters
const result = migrator.migrate({ format: 'html', content }, registry);
summarizeImport(result); // { warnings, dropped, clean }
```

Import is Zod-gated and returns an observable `ImportResult` (warnings + dropped
content). Add a new output format with `registry.registerNodeSerializer(...)` -
no change to the walker.

## UI contributions

The slash / toolbar / bubble / block menu **items** a feature declares are
aggregated engine-free; the menu **components** themselves are chrome.

```ts
import {
  collectUiContributions,
  defaultBlockMenuItems,
} from '@zeroxsolutions/editor-core/document/ui';

const ui = collectUiContributions(features);
// ui.toolbar, ui.slash, ui.bubble, ui.blockMenu - the chrome renders these
```

## The `advanced` escape

`@zeroxsolutions/editor-core/document/advanced` is the **only** engine-exposing
module and is **outside the SemVer-stable contract** - it may change in any release.
It re-exports the raw engine primitives (`Extension`, `Node`, `Mark`, `Plugin`, ...)
for a feature that must reach the engine via `feature.advanced.engineExtensions`
/ `advanced.prosePlugins`. House features use it internally yet still export an
engine-free `EditorFeature`. A build guard fails if any engine type leaks into a
public `.d.ts` outside this subpath.

## Public surface

Per-file subpath exports (`./*` -> `./dist/*`), so each module is imported (and
tree-shaken / lazy-loaded) on its own. **Import each module at its full subpath**;
a directory barrel is `<subpath>/index`, a standalone module is its file path.

- `document/core` - the engine-free contract: `createEditor` (builder),
  `createDocumentEditor`, `defineFeature`, the `IEditor` façade, types, errors.
- `document/serialize`, `document/migrate` - codecs + import/Migrate.
- `document/ui` - `collectUiContributions` / `defaultBlockMenuItems` (the headless
  aggregation; the menu *components* are chrome).
- `document/advanced` - the unstable engine escape.
- `math/core/...`, `mermaid/core/...` - the KaTeX / Mermaid engines.
- `composer/...` - the headless composer types + trigger tokens.

Released with Nx Release + SemVer from conventional commits.

## Running unit tests

`nx test @zeroxsolutions/editor-core` (Vitest). `nx build @zeroxsolutions/editor-core`
runs the engine-hiding build guard.
