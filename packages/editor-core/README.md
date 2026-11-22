# @zeroxsolutions/editor-core

A Notion-like, block-based rich-text **editing engine** - headless. The engine
(Tiptap / ProseMirror) is **fully hidden behind a frozen, engine-free contract**:
you build documents, define features, and drive commands through the `IEditor`
façade and the declarative `defineFeature` API, importing no engine type. The
engine can be swapped without rippling into your code. JSON is the source of truth;
HTML/Markdown are pluggable per-node codecs.

**This package is the framework-free core: zero `react`** (no runtime, no types,
no peer dep - the bar Tiptap's `@tiptap/core` and Lexical set). It ships no React
surfaces, no menus or toolbar, no theme CSS, and no concrete features - those are
the **editor chrome**, which lives in the ui registry
(`@/registry/bases/base-ui/editor/...`) and composes this core. The chrome injects
its React node-view renderer at mount via the `nodeViewRenderer` option, and owns
the React serialization walker + `toReact` codec typing; a headless consumer
passes its own renderer (or omits it and gets no React node views).

> The one exception is the explicitly **unstable** `document/advanced` subpath -
> see [The `advanced` escape](#the-advanced-escape).

## Install

```bash
pnpm add @zeroxsolutions/editor-core
```

No `react` peer - the core is **framework-free** (zero `react` runtime, types, and
peer dep, like Tiptap's `@tiptap/core`). The React chrome - the `<Editor/>`/`<Viewer/>`
surfaces, the node-view renderer, and the `toReact` serialization walker + codec
typing - is supplied by the ui registry (`@/registry/bases/base-ui/editor/...`).

## Quick start - the imperative builder

```ts
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';

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
import { defineFeature } from '@zeroxsolutions/editor-core/document/core/index';
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
          el.hasAttribute('data-badge') ? { type: 'badge', attrs: { label: el.textContent ?? '' } } : null,
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
    slash: [{ id: 'badge', title: 'Badge', group: 'Inline', command: 'insertBadge' }],
  });
```

Feature commands compose the built-in primitives (`insertContent`, `toggleMark`,
`setNode`, ...) through `editor.run(...)` - they never touch the engine. Attribute
schemas are Zod; document JSON is validated at the boundaries only.

The built-in features (`standardKit`, `callout`, ...) are **editor chrome** -
shipped from the ui registry alongside the React surfaces, not from this package.

## Serialization & Migrate

```ts
import { createCodecRegistry, serialize, importMarkdown } from '@zeroxsolutions/editor-core/document/serialize/index';
import { createMigrator, summarizeImport } from '@zeroxsolutions/editor-core/document/migrate/index';

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
import { collectUiContributions, defaultBlockMenuItems } from '@zeroxsolutions/editor-core/document/ui/index';

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
tree-shaken / lazy-loaded) on its own. **Import each area through its barrel, `<area>/index`**;
`document/advanced` is the one entry that is a file.

- `document/core/index` - the engine-free contract: `createEditor` (builder),
  `createDocumentEditor`, `defineFeature`, the `IEditor` façade, types, errors.
- `document/serialize/index`, `document/migrate/index` - codecs + import/Migrate.
- `document/ui/index` - `collectUiContributions` / `defaultBlockMenuItems` (the headless
  aggregation; the menu _components_ are chrome).
- `document/advanced` - the unstable engine escape.
- `math/core/index`, `mermaid/core/index` - the KaTeX / Mermaid engines.
- `composer/index` - the headless composer types and trigger tokens.
- `template/index` - the message-template core; see "Message templates" below.
- `template/email/index` - the email templates; see "Message templates" below.
- `template/email/testing/index` - the email templates' test helpers; see "Message templates" below.
- `template/sms/index` - the SMS templates; see "Message templates" below.
- `profiles/index` - the email and SMS editor profiles, their validation and their codecs, with no
  engine; see "Editor profiles" below.
- `profiles/editor/index` - `blockIdentity`, the editor feature that keeps a host's block ids; see
  "Editor profiles" below.

Released with Nx Release + SemVer from conventional commits.

## Running unit tests

`nx test @zeroxsolutions/editor-core` (Vitest). `nx build @zeroxsolutions/editor-core`
runs the engine-hiding build guard.

## Message templates - `template/`

Message templates: the `{{name}}` grammar every channel shares, the SMS render and what it costs, and an
email renderer a product themes, overrides per block and layout, and extends with block types. Where a
template lives (storage, keys, locales, versions, delivery) stays in the product, which hands this code a
body and a send's values and gets back what to send.

- `template/index` - variables and inline markup: `interpolate`, `escapeHtml`, `redactVariables`,
  `variableTokens`, `sameVariableTokens`, `VARIABLE_TOKEN`, `VARIABLE_TYPES`, `displayWidth`, and
  `parseInlineMarkup`, `printInlineMarkup`, `plainInlineText`, `sameInlineMarkup`.
- `template/email/index` - the email renderer: `createEmailRenderer`, `defineBlock`, `defaultBlocks`,
  `defaultLayout`, `assertEmailTheme`, `sameBlockContent`, the `REGIONS`, the block limits and the errors
  `EmailThemeInvalid` and `BlockTypeCollision`.
- `template/email/testing/index` - `checkEmailRenderer`, the conformance check a product runs on its own
  renderer.
- `template/sms/index` - `renderSms`, `measureSms`, `fitsOneSmsSegment` and `SMS_SEGMENT_UNITS`.

```ts
import { interpolate } from '@zeroxsolutions/editor-core/template/index';
import { createEmailRenderer } from '@zeroxsolutions/editor-core/template/email/index';
import { renderSms } from '@zeroxsolutions/editor-core/template/sms/index';
```

The folder imports nothing outside itself, `zod` and `get-east-asian-width`. The code came from
zeroxsolutions `packages/template` at commit `5bb8d693`.

## Editor profiles - `profiles/`

A profile says what one kind of message may hold: the block kinds an author may add, the variables the
product declares, and the bounds the email renderer enforces. The email and SMS editors in the ui
registry (`@zui/email-editor`, `@zui/sms-editor`) edit against one, and a server checks a stored body
against the same profile before it sends.

- `profiles/index` loads no editing engine, so a server or a worker imports it alone:
  - `emailProfile({ allow?, variables?, bounds?, extraKinds? })` and `smsProfile({ variables?, maxSegments? })`
    build a profile. A bound may be tightened, never set above the renderer's own limit, and a
    variable name is 1 to 64 word characters, declared once; both throw an `EditorError` otherwise.
  - `validate(value, profile)` lists the problems of email blocks or an SMS body, in document order.
    Each `ProfileProblem` names its `kind` (`variable-undeclared`, `block-not-allowed`, `text-too-long`,
    `sms-segment-exceeded` and the rest of `ProblemKind`) and the block's id, or its key when the id is
    null. The editor never refuses an edit for a problem; it shows it.
  - `toEmailBlocks(doc)` and `fromEmailBlocks(blocks)` convert between the editor's document and the
    email renderer's blocks. A block nobody edited exports its stored text verbatim.
  - `toSmsText(doc)`, `fromSmsText(body)` and `measureSmsBody(body)` (units, limit, encoding, segments)
    do the same for an SMS body.
  - `EMAIL_KINDS`, `MAIL_LAYOUT_KINDS` (what a header or footer region may hold) and `emailNodeSpecs`.
- `profiles/editor/index` exports `blockIdentity({ required?, structure?, types? })`, a feature for
  `createEditor().use(...)`. It gives every top-level and lane block a `key` unique in the document and
  keeps the host's `id` on it across edits and moves. A pasted, duplicated or split-off block gets
  `id: null`, and ids never ride the clipboard. `required` blocks cannot be removed, and
  `structure: 'locked'` allows text, variable and mark edits only; a content load through the facade's
  `setContent` passes both. It adds the commands `assignBlockIds({ ids })` (key to id, run after the
  host saves) and `deleteBlock`.

```ts
import { emailProfile, toEmailBlocks, validate } from '@zeroxsolutions/editor-core/profiles/index';

const profile = emailProfile({
  allow: ['paragraph', 'button', 'list', 'divider'],
  variables: [{ name: 'firstName', type: 'string', required: true }],
  bounds: { blocks: 20 },
});

const problems = validate(toEmailBlocks(editor.getJSON()), profile);
if (problems.length > 0) refuse(problems);
```

The editors themselves, their menus, the variable chips and the preview are registry items; their
pages are [Email editor](https://ui.zeroxsolutions.com/docs/editor/email-editor) and
[SMS editor](https://ui.zeroxsolutions.com/docs/editor/sms-editor).
