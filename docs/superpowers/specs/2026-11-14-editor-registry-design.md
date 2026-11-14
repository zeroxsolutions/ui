# zui: the editor in the web registry and its docs

The editor chrome, `packages/ui/registry/bases/base-ui/editor/` (103 files, 74 of them not specs),
composes `@zeroxsolutions/editor-core` into React surfaces: a document editor and viewer with its toolbar,
bubble, block and slash menus; ten document features; a code editor; a chat composer; and standalone math and
mermaid editors. None of it is in `packages/ui/registry.json` and no page of `packages/ui-docs-web` names it.
A consumer can install the headless core from npm (`@zeroxsolutions/editor-core@0.1.0`) and nothing else, while
the core's own README sends them to the chrome "in the ui registry".

This spec makes every surface and feature of the chrome installable with `shadcn add @zui/<item>` and documents
each one on the web docs with a live demo. It changes no behaviour of the chrome or the core.

## Goals

- Every non-spec file under `editor/` belongs to exactly one registry item, and `registry.spec.ts` fails when one
  does not. This is a rule of its own beside `familyProblems`, not an extension of it: `familyProblems` names an
  item after its first file and its category after the kind folder, which the editor's nested `.ts` and `.tsx`
  files and the names below do not follow. The editor rule: every item in category `editor` ships only files
  under `editor/` (plus the `lib`, `hooks` and `types` files `SHIPPED` requires), and every non-spec file under
  `editor/` is shipped by exactly one of them.
- A consumer gets only what they draw: a project that wants the document editor without math does not bundle
  `katex` or its stylesheet, and one that wants the chat composer does not bundle CodeMirror or mermaid. (The core
  lists `katex` and `mermaid` in its own `dependencies`, so they are installed with it; see Decided.)
- Each item installs into a project with the shadcn CLI and builds there: its `dependencies` name every package
  its files import, `registryDependencies` name every registry item they import, and its `css` carries every
  style rule `editor/styles.css` holds for it.
- The web docs have an Editor section with an overview page and one page per item, each with a
  `ComponentPreview` of a demo and the install steps the component pages use.

## Non-goals

- A React Native editor. Tiptap renders to the DOM; a native editor is its own design (a WebView host or a
  native editing library) and its own spec.
- Any change to the core's API or to what the chrome does. Moving a file between folders to fit an item is in
  scope; changing its behaviour is not.
- New editor features.

## Anti-goals

- One `editor` item carrying all 74 files: every consumer would install mermaid, KaTeX, CodeMirror and shiki to
  draw a chat input.
- Items whose files import site-only modules (`packages/ui/src/site/...`) or paths the CLI cannot rewrite.
- One stylesheet for every item: `editor/styles.css` imports KaTeX's CSS and needs `@tailwindcss/typography`, so
  attached whole to a shared item it would put both on a chat input.

## The items

Every item is `registry:component` unless named otherwise, in a new category `editor`, and its files keep their
path under `editor/` as their target, so a consumer gets `components/editor/document/...` as the registry lays it
out. The document features carry the `editor-` prefix: shadcn already has `table` and `toggle`, and a bare `link`
or `image` would read as something other than an editor block.

| Item                                                                                                                                                                     | Files                                                                                                                                               | Draws                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `editor-theme` (`registry:lib`)                                                                                                                                          | `shared/theme/**`                                                                                                                                   | the theme context the document viewer and the math and mermaid surfaces read                                                                     |
| `editor-code-mirror` (`registry:lib`)                                                                                                                                    | `shared/code-mirror/**`                                                                                                                             | the CodeMirror pane and syntax table                                                                                                             |
| `document-editor`                                                                                                                                                        | `document/react/**`, `document/ui/**`, `document/node-view-adapter.tsx`, `document/serialize/**`, `document/features/standard/**`, `react-types.ts` | `<Editor>`, `<Viewer>`, the toolbar and menus, with the standard kit (paragraphs, headings, lists, tasks, marks)                                 |
| `editor-callout`, `editor-code-block`, `editor-embed`, `editor-image`, `editor-link`, `editor-math`, `editor-mention`, `editor-mermaid`, `editor-table`, `editor-toggle` | `document/features/<name>/**`                                                                                                                       | one document feature each, each depending on `document-editor`; `editor-code-block` also on `editor-code-mirror`, which `code-block.tsx` imports |
| `editor-features`                                                                                                                                                        | `document/features/index.ts`                                                                                                                        | the barrel that loads every feature at once, depending on all ten feature items                                                                  |
| `math-editor`                                                                                                                                                            | `math/react/**`                                                                                                                                     | the standalone formula editor and viewer                                                                                                         |
| `mermaid-editor`                                                                                                                                                         | `mermaid/react/**`                                                                                                                                  | the standalone diagram editor and viewer                                                                                                         |
| `code-editor`                                                                                                                                                            | `code/**`                                                                                                                                           | the file editor and its content router                                                                                                           |
| `chat-input`                                                                                                                                                             | `composer/**`                                                                                                                                       | the chat composer, its triggers and message view                                                                                                 |

`document/features/index.ts` stays as it is, the eager barrel its docblock describes, and ships as its own item
so `document-editor` does not pull every feature in through it; each feature's own `index.ts` stays its lazy
entry. `shared/index.ts` exports nothing and nothing imports it, so it is deleted rather than shipped.
`document/migrate/` and `composer/message-payload.spec.tsx` hold only specs and ship in no item.

### Stylesheets

`editor/styles.css` splits by the rules each item needs, and each item carries its part as its `css`: the prose
mapping and the `@tailwindcss/typography` plugin go with `document-editor`, the KaTeX import with `editor-math`
and `math-editor`, and each feature's block rules with that feature. `cssProblems`, which reads only
`base-ui/styles.css` today, also reads the editor's sheet, so an item's `css` cannot drift from the source. The
docs site imports the editor's sheet beside the base's, in `apps/registry-ui/src/app/global.css`, so the demos
draw as a consumer's project does.

## Dependencies

- `@zeroxsolutions/editor-core` is a `dependencies` entry of every item that imports it, at the published range.
  Before the items publish, the chrome is typechecked against the published core rather than the workspace one;
  if it needs anything 0.1.0 lacks, the core is released first, on the owner's go-ahead, in its own pull request.
- npm packages are named per item from what that item's files import (`@tiptap/react`, `@tiptap/starter-kit`,
  `@tiptap/extension-placeholder`, `tiptap-extension-global-drag-handle`, `@codemirror/*`, `katex`, `shiki`,
  `zod`, `lucide-react`, `next-themes`, `class-variance-authority`, `@zeroxsolutions/fluent-emoji`).
- Registry dependencies are named as the registry names them today: shadcn items as `@shadcn/<name>` (`button`,
  `popover`, `tabs`, `use-mobile`, `utils`, ...) and this registry's as `@zui/<name>` (`collapsible-card`,
  `copy-button`, `code-card`, `markdown-view`, `language-combobox`, `floating-toolbar`, `image-preview`,
  `font-preview`, `file-type-icon`), from what each item's files import.
- An item whose files import a base `lib`, `hooks` or `types` file, such as `lib/shiki.ts` or
  `lib/language-options.tsx`, ships that file as a `registry:lib` of its own, as `language-combobox` does; the
  existing `SHIPPED` rule requires it.
- The existing `declarationProblems` check already fails when an item's files import what the item does not
  declare; it covers the editor items unchanged once `sourceOf` resolves a relative `./x.js` import to `x.ts` or
  `x.tsx`, which 47 editor files use.

## The docs

`packages/ui-docs-web/content/docs/meta.json` gains an `editor` section after `components`:

- pages live under `content/docs/editor/`, beside `components/`.
- `editor/index.mdx`: what the core is and what the chrome is, installing the core, and which item to start
  from for a document, a code file, a chat input or a formula.
- one page per item above, in the shape `components/base/editor-tab.mdx` has: `ComponentPreview` of
  `<item>-demo`, the CLI and manual install steps, and usage. The two libs get a usage section instead of a
  preview.
- each demo is a `registry:example` under `examples/`, like the component demos, and reaches the live site
  through the existing examples index.

The site's search, sitemap, `llms.txt` and the e2e lists that enumerate pages pick the new pages up the way they
pick up component pages; lists that enumerate every item gain the new items.

## Left to the builder

- The demo content of each page.
- The order the items land in, as long as each pull request leaves `registry.spec.ts` and the build green.

## Decided

- `katex` and `mermaid` stay in the core's `dependencies` (owner, 2026-11-14). A project that installs only
  `chat-input` gets both in `node_modules` and bundles neither, since the math and mermaid features load lazily.
  The core is not changed or released for this spec.
- `chat-input` reaches the `@tailwindcss/typography` plugin through its real dependency on `document-editor`, whose
  files it imports (2026-11-14). KaTeX stays out of its whole dependency tree; the owner may later ask for the
  shared document files to split into an item without css.
