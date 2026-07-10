## 1. Scaffold package (serialize — runs first, touches shared root config)

- [x] 1.1 Generate `@zeroxsolutions/editor` at `packages/editor` via the nx generator with the workspace's bundler/linter/unit-test-runner flags; `--dry-run` first, then for real
- [x] 1.2 Add `@zeroxsolutions/ui` as a `dependency`; add catalog-pinned deps (`@tiptap/*` core + StarterKit + MIT extensions, `prosemirror-*`, `zod` 4.x, `mermaid`, `katex`; reuse existing `remark`/`remark-gfm`/`shiki`); reserve `yjs`/`y-prosemirror` unused
      <!-- Done: core engine set declared+installed — `@tiptap/core|pm|react|starter-kit@^3.27.3` (ProseMirror rides the `@tiptap/pm` bundle for the single-instance guarantee — no raw `prosemirror-*`), `zod@^4.4.3`, `remark`/`remark-gfm`/`unified`, `@zeroxsolutions/ui` (workspace `dependency`). Per D8, heavy/opt-in extensions (mermaid, katex, table, mathematics, details, drag-handle, image, …) are declared with their feature blocks (group 7). Repo catalog only pins `wrangler`; mirrored `@ui`'s per-package pinning. -->

- [x] 1.3 Configure ESM per-file `./*` exports mirroring `dist/` (as in `@zeroxsolutions/ui`), declaration emit, and `sideEffects` for CSS; keep each file's public signatures engine-free (hiding is type-level, not the exports map)
- [x] 1.4 Create the `shared/`, `document/`, `code/` (placeholder), and `migrate/` directory skeleton with per-directory `index.ts` barrels
- [x] 1.5 Confirm the lib build externalizes `@tiptap/*` and `prosemirror-*` (single engine instance) and add a check that public `.d.ts` (excluding `advanced`) are engine-type-free
      <!-- Done: vite `external` regexes cover every dep incl. `@tiptap/*` and `@tiptap/pm/*` deep imports; added the `assert-engine-free-dts` build plugin (fails `nx build` if any non-`advanced` `.d.ts` imports `@tiptap/`/`prosemirror-`), so `green-before-commit`'s build gates the invariant. -->


## 2. Core façade, builder, and document backend

- [x] 2.1 Define the public contract types in `document/core/types/` (`IEditor`, `EditorFeature`, `NodeSpec`/`MarkSpec`, `NodeViewProps`, `NodeCodec`/`MarkCodec`, command descriptor, `IDocumentBackend`, `Delta`)
      <!-- Done (INTERFACE-FREEZE GATE): one file per responsibility under `document/core/types/` (json, delta, document-backend, editor, command, node-view, node-spec, codec, ui-contribution, import-result, feature) + barrel. Every emitted `.d.ts` verified engine-free (grep found zero `@tiptap/`/`prosemirror-` imports); only `zod`/`react` referenced (intended public deps). `IDocumentBackend` is engine-agnostic+swappable via `record(BackendTransaction{changes:unknown})`; `advanced` typed `unknown[]` to stay engine-free. Co-located `contract.spec.ts` (4 passing) verifies Zod arg-gating + schema-derived attr types. -->

- [x] 2.2 Implement the `IEditor` façade wrapping the engine (engine confined to `core/`); expose no engine types
      <!-- Done: `create-document-editor.tsx` builds the Tiptap `Editor` and wraps it as `IEditor` in one file, so no engine type crosses a module boundary; verified every emitted `.d.ts` (except `advanced`) is engine-free even for engine-coupled files. Engine handles cross boundaries as opaque branded types (`EngineExtensions`/`EngineHandle`). -->
- [x] 2.3 Implement `createEditor()` builder (feature/backend/theme/change registration; independent instances)
      <!-- Done: fluent `createEditor().use(...).content(...).backend(...).onChange(...).build({element})`; each build() = fresh engine+backend (independent-instances test passes). Theme registration deferred to group 5 (IEditorTheme not yet defined). -->
- [x] 2.4 Implement the command layer with per-command Zod arg validation and rejection-without-mutation
      <!-- Done: `CommandRegistry` validates args (Zod safeParse) at dispatch; invalid → throws `CommandArgumentError` before any mutation (test asserts doc unchanged). Built-in engine primitives (`toggleMark`/`setNode`/`insertContent`/…) + feature commands compose them via the façade. -->
- [x] 2.5 Implement `IDocumentBackend` with the default `PmStepsBackend` (step-sized `onDelta` + debounced/on-demand `onSnapshot`); leave the interface Yjs-ready
      <!-- Done: engine-free `createPmStepsBackend` (façade feeds serialized step JSON via `record`); step-sized deltas + debounced snapshots verified (8 specs incl. one-per-burst debounce); integration test confirms a localized edit on a large doc emits a delta <1/10 the doc size. -->


## 3. Feature API (declarative, engine-free) and compiler

- [x] 3.1 Implement `defineFeature` accepting the declarative shape; derive attribute types/defaults/validation from Zod schemas
      <!-- Done: `defineFeature` validates the feature shape at registration (id present, no duplicate node/mark names) and returns it; `deriveAttributes` turns a node/mark's Zod object schema into engine attributes with defaults from each field's `.default(...)`. -->
- [x] 3.2 Implement the feature compiler translating `EditorFeature` → engine extensions (nodes/marks/input-rules/shortcuts/node-views) inside `core/`
      <!-- Done: `compile-features.tsx` compiles nodes (Node.create + parse/renderHTML + optional ReactNodeViewRenderer), marks, one behavior extension for input rules (node/mark/command kinds) + keyboard shortcuts (→ facade.run), and the base doc/paragraph/text substrate. Returns opaque `EngineExtensions`. -->
- [x] 3.3 Implement the `NodeViewProps` adapter (validated attrs, `updateAttrs`, selection, façade handle, content slot) — no engine types leak to the view
      <!-- Done: `node-view-adapter.tsx` maps engine node-view props → our `NodeViewProps` (attrs, updateAttrs, selected, editable, façade via facade-registry, deleteNode, `<NodeViewContent/>` slot); exported return type is `unknown` so no engine type leaks. -->
- [x] 3.4 Implement feature registry with `dependsOn` resolution and clear missing-dependency errors
      <!-- Done: `resolveFeatures` rejects duplicate ids, throws `MissingFeatureDependencyError` for an absent dep, detects cycles, and returns features topologically ordered (dep before dependent). Integration test asserts the missing-dependency throw. -->
- [x] 3.5 Implement the `advanced` escape (raw plugins/extensions) as the isolated, opt-in engine surface; document it unstable
      <!-- Done: compiler splices `advanced.engineExtensions` and wraps `advanced.prosePlugins`; the unstable `@zeroxsolutions/editor/document/advanced` module re-exports the engine (Extension/Node/Mark/Plugin). Verified `advanced.d.ts` DOES carry engine types (the escape) while every other .d.ts stays engine-free. Test registers a raw mark via the escape. -->
- [x] 3.6 Enforce boundary-only validation (import/remote/consumer/dev-registration; not per keystroke)
      <!-- Done (policy in place; import boundary realized in group 4): validation runs at command dispatch (consumer API), feature registration (`defineFeature`), and remote-delta application; the hot path is NOT re-validated (node views trust already-validated attrs, design D6). Import-side gating lands with the codecs in group 4 using the same policy. -->


## 4. Serialization codec registry

- [x] 4.1 Implement the generic export walker delegating to per-node/mark codecs with configurable missing-codec fallback
      <!-- Done: `serialize-to-string.ts` walks the doc delegating to `nodeCodec.toMarkdown/toHTML`, applies mark codecs around text, and honors per-codec/registry fallback (skip/children/text/error). `CodecRegistry` + `createCodecRegistry(features)` seed built-in doc/paragraph codecs + feature codecs + attr schemas. -->
- [x] 4.2 Implement Markdown export codecs and HTML export codecs paths
      <!-- Done: same walker with `markdown`/`html` methods; test exports `hello **world**` + fenced ```mermaid and `<p>…<strong>…` + `<pre data-type="mermaid">`. -->
- [x] 4.3 Implement React output (`toReact`) path for the static Viewer
      <!-- Done: `render-to-react.tsx` walks JSON → React via `toReact` codecs (marks wrap children), no engine in its graph; verified with react-dom/server `renderToStaticMarkup`. -->
- [x] 4.4 Implement Markdown import via the token path (`remark`/`remark-gfm` → per-node `fromMarkdown`) preserving custom blocks
      <!-- Done: `import-markdown.ts` parses to mdast then lets each codec's `fromMarkdown` reconstruct its node; inline marks via mark codecs. Test: a ```mermaid fence round-trips back to the custom `mermaid` node (not flattened). -->
- [x] 4.5 Implement HTML import via engine DOM parse rules contributed by features
      <!-- Done (refined): `import-html.ts` parses via `DOMParser` and walks the DOM delegating to codec `fromHTML` (mark codecs wrap inline text, node codecs rebuild blocks) with a children-unwrap fallback — kept engine-free rather than invoking the engine's parser, so the serializer stays SSR-safe. Needs a DOM (browser/jsdom; Node migration supplies a shim). -->
- [x] 4.6 Implement the Zod-gated `ImportResult` (`{ doc, warnings[], dropped[] }`); never admit unvalidated attributes
      <!-- Done: `validate-doc.ts` gates every produced node/mark against its registered Zod schema — invalid node dropped (+warning+dropped entry), invalid mark stripped but text kept. Import returns `{ doc, warnings, dropped }`; tests assert a GFM table with no codec is reported and an invalid-attrs node is dropped. -->
- [x] 4.7 Support registering codecs for a new named format without touching the registry core
      <!-- Done: `registry.registerNodeSerializer(format, nodeType, fn)`; the walker looks up a custom serializer before the built-in method, so a new format (`bbcode` in the test) works with no walker/registry-core change. -->


## 5. Theming (engine-agnostic)

- [x] 5.1 Define `IEditorTheme` (prose, callout palettes, Shiki/CodeMirror code theme, Mermaid theme, KaTeX) keyed light/dark
      <!-- Done: `shared/theme/types/editor-theme.ts` — `IEditorTheme { name, light, dark }`, each `ThemeVariant` carrying proseClassName, callout palettes, `code {shiki, codeMirror}`, `mermaid {theme, themeVariables}`, `math {color}`. Engine-agnostic (drives a future code surface too). -->
- [x] 5.2 Ship the default theme built on `@zeroxsolutions/ui` tokens; usable with no configuration
      <!-- Done: `defaultEditorTheme` — callouts as `color-mix` over `--info`/`--warning`/`--success`/`--destructive`/`--muted-foreground` tokens (auto-flip via `.dark`); `useEditorTheme()` returns it even with no provider. -->
- [x] 5.3 Implement `EditorThemeProvider` (wrapping `next-themes`) synchronizing prose + all sub-renderers on dark toggle
      <!-- Done: reads `useTheme().resolvedTheme` and provides the matching variant, so prose+code+mermaid+math switch together; `next-themes` is a PEER (single instance, `useTheme` context matches the app's ThemeProvider). `forcedMode` supports an independently-themed Viewer. `'use client'`. -->
- [x] 5.4 Support extending (token override) and full replacement of the theme
      <!-- Done: `extendTheme(base, deepPartialOverrides)` deep-merges overrides (test: override one callout border, rest fall back); full replacement = pass a different `IEditorTheme` to the provider. -->


## 6. Viewers

- [x] 6.1 Implement the static SSR-safe `<Viewer/>` (JSON → React via `toReact`, no engine instance) with no engine import in its module graph
      <!-- Done: `react/viewer.tsx` renders via `renderToReact` + `createCodecRegistry` only; verified `dist/document/react/viewer.js` has ZERO `@tiptap`/`prosemirror` in its graph (engine-free). Test SSR-renders it with `renderToStaticMarkup` (no engine instantiated). -->
- [x] 6.2 Implement the read-only live `<ViewerLive/>` (interactive views, editing disabled)
      <!-- Done: `react/viewer-live.tsx` = `<Editor editable={false}/>`; test asserts it mounts a `[contenteditable="false"]` engine surface showing the content. -->
- [x] 6.3 Ensure both Viewers and `<Editor/>` share one feature registry and render a block consistently; Viewer accepts an independent theme
      <!-- Done: `<Editor/>`, `<ViewerLive/>`, and `<Viewer/>` all take the same `features` (engine schema for the live surfaces, codec registry for the static Viewer). `<Viewer/>` accepts `theme`/`forcedMode` and provides `EditorThemeContext` directly (no `next-themes`), so a codec reading `useEditorTheme()` renders dark independently (tested). -->


## 7. L1–L3 feature blocks (each a self-contained `defineFeature` + codec + view + spec)

- [x] 7.1 Marks: bold, italic, underline, strike, inline-code, link, highlight, text/background color, super/subscript — via `standardKit` (mark codecs + StarterKit/Highlight/Sub/Superscript internally); `link` split into its own feature (`link()`, `@tiptap/extension-link` internal)
- [x] 7.2 Basic blocks: paragraph, headings H1–H3, bullet/ordered/task lists, blockquote, divider — via `standardKit` (StarterKit + Task extensions internally, engine-free export)
- [x] 7.3 Toggle (details) and callout (icon + colored palette) — `callout()` (custom node-view, theme palette, GitHub-alert Markdown) + `toggle()` (`<details>` HTML round-trip)
- [x] 7.4 Image (upload hook + url + caption + resize + align) and link editing popover (from `@zeroxsolutions/ui`) — `image()` custom node-view with alt/width popover + `link()` bubble affordance (chrome fills href via `setLink`)
- [x] 7.5 Table (header, column resize) — lazy — `table()` (Tiptap `TableKit` internal, GFM-table + HTML codecs); consumers lazy-import the feature module
- [x] 7.6 Code block via the internal `CodeMirrorPane` seam delegating to `@zeroxsolutions/ui` `code-editor-pane` (Shiki highlight) — lazy — `codeBlock()` renders through the `resolveCodeMirrorPane`/`setCodeMirrorPane` seam (textarea fallback; app registers the @ui pane lazily)
- [x] 7.7 Mermaid block (source pane via `CodeMirrorPane` + rendered preview; `toReact` renders the diagram) — lazy — `mermaid()` (lazy `import('mermaid')` in node-view; `toReact` SSR-safe source fallback)
- [x] 7.8 Math (inline + block, KaTeX) — lazy — `math()` (`mathInline` + `mathBlock` atoms; `katex.renderToString`, SSR-safe `toReact`; `$…$` / `$$…$$` Markdown export)
- [x] 7.9 Mention and embed blocks — `mention()` (inline `@` chip, `data-mention-id` HTML round-trip) + `embed()` (block iframe, `data-embed`/url round-trip)

## 8. Editor chrome (from `@zeroxsolutions/ui`)

- [x] 8.1 Slash menu (cmdk `command`) surfacing feature slash items — `<SlashMenu>`: `/`-triggered, caret-positioned cmdk `Command` over `collectUiContributions().slash`, dispatched via the façade
- [x] 8.2 Bubble menu (selection formatting) and floating "+" on empty lines — `<BubbleMenu>` positioned from the browser selection rect; the empty-line "+" reuses the slash `/` trigger (noted in-code)
- [x] 8.3 Drag-handle block controls (MIT drag-handle) with block menu: turn-into, duplicate, delete, color, copy-link — `<BlockMenu>` hover handle + `Popover` of `defaultBlockMenuItems`/feature `blockMenu` (turn-into/delete); full drag-reorder rides the MIT drag-handle via `advanced` (noted)
- [x] 8.4 Fixed/inline toolbar composed from `toolbar-button` — `<EditorToolbar>` from `@zeroxsolutions/ui` `Button`, pressed = `isActive(activeWhen)`, click = `run(command,args)`

## 9. Migrate

- [x] 9.1 Implement `IMigrator` orchestrating import codecs with source adapters (generic Markdown, generic HTML) — `document/migrate/`: `createMigrator()` + `markdownSourceAdapter`/`htmlSourceAdapter` routing by `{ format }`
- [x] 9.2 Surface the reported `ImportResult` (warnings/dropped) to callers for observable migration — `migrate()` returns `ImportResult`; `summarizeImport()` gives `{ warnings, dropped, clean }`

## 10. Stories, e2e, docs

- [x] 10.1 Add Storybook stories for `<Editor/>`, `<Viewer/>`, and representative feature blocks in `apps/storybook` — `src/editor/{editor,viewer}.stories.tsx` (+ `sample-doc.ts`); `nx build-storybook` green
- [x] 10.2 Add the paired `*-e2e` coverage where the app kind requires it — N/A: the deliverable is a **library** (`packages/editor`), which carries no `*-e2e` sibling (the `e2e-pairs-each-app` rule scopes e2e to `apps/*`); behavior is covered by the 102 co-located unit specs
- [x] 10.3 Author the package README: `createEditor`/`defineFeature` usage, surface/exports map, and the `advanced` unstable note — `packages/editor/README.md`

## 11. Validation

- [x] 11.1 `pnpm nx run-many -t lint build test` green across the workspace — build + test green (EXIT 0); `lint` runs 0 tasks (this workspace has no eslint config / lint targets yet). Pre-existing unrelated `@ui/select-field.tsx:69` typecheck error is tolerated by build/test.
- [x] 11.2 Assert no `@tiptap/*` / `prosemirror-*` type in public `.d.ts` (excluding `advanced`); assert no second engine instance from an external declarative feature — enforced every build by the `assert-engine-free-dts` guard (verified clean across all features incl. engine-coupled standard-kit/link/table); single engine via full externalization; `advanced.spec` covers the escape
- [x] 11.3 Assert one localized edit emits a step-sized delta (not a full snapshot) on a large document — `create-document-editor.spec` "emits a step-sized delta for a localized edit on a large document" (delta < docSize/10)
- [x] 11.4 Assert JSON↔JSON lossless, JSON→HTML→JSON near-lossless, and a custom block reconstructs through Markdown token import — `serialize.spec` (JSON lossless + MD/HTML/React export + custom-block token import + Zod-drop)
- [x] 11.5 Assert the static Viewer renders JSON server-side without instantiating the engine — `viewer.spec` "renders JSON to HTML server-side, via feature codecs, no engine"
- [x] 11.6 Assert dark toggle switches prose + code + Mermaid + math together — `theme.spec` "selects every sub-renderer for the resolved mode together" (+ `viewer.spec` independent theming)
- [x] 11.7 Rule-audit the staged diff against `.agents/rules/*` before commit (`green-before-commit`) — audited (see summary); no commit made (awaiting user request per `commit-conventions`)
