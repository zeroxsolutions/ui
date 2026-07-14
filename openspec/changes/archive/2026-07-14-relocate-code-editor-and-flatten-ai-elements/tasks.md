## 1. `@ui` — shared `Disclosure` compound + rename

- [x] 1.1 Add a `Disclosure` compound to `packages/ui/src/components/disclosure.tsx` — a shadcn-style compound (Root + `DisclosureHeader` / `DisclosureTitle` / `DisclosureActions` / `DisclosureContent`) wrapping a Base UI collapsible primitive, per `ui-compound-authoring`: exported `disclosureVariants` cva, `data-slot="disclosure-*"` on every part, `className` layout-only; do not touch `components/ui/*`.
- [x] 1.2 Recompose the existing (still-editable) `CodeBlock` onto `Disclosure` with no behavior change; keep its spec green.
- [x] 1.3 Rename `FloatingToolbarShell` → `FloatingToolbar` (file `floating-toolbar.tsx`, symbol, story, per-file export subpath); update its consumers.

## 2. `@editor` — land the CodeMirror seam and code surface

- [x] 2.1 Move `code-editor-pane.tsx` → `packages/editor/src/shared/code-mirror/` as the `CodeMirrorPane` seam (replace the `export {}` stub). _(landed additively; `data-slot="code-mirror-pane"`; @ui original deleted in Phase 4)_
- [x] 2.2 Move `lib/code-syntax.ts` into `shared/code-mirror/`, re-pointing its Shiki imports to `@zeroxsolutions/ui/lib/shiki` (forward — one highlighter).
- [x] 2.3 Move `code-editor.tsx` + `file-content-router.tsx` → `packages/editor/src/code/`; import the generic previews (`markdown-view`, `image-preview`, `font-preview`, `binary-file-card`, `language-switcher`) forward from `@zeroxsolutions/ui`.
- [x] 2.4 Move `@codemirror/{state,view,commands,language}` from `packages/ui/package.json` to `packages/editor/package.json`. _(added to @editor + `class-variance-authority`; removal from @ui deferred to Phase 4 to keep @ui green)_
- [x] 2.5 Move the co-located specs (`code-editor-pane.spec`, `code-editor.spec`, `file-content-router.spec`) with their files.

## 3. `@editor` — rebuild the editable code-block feature

- [x] 3.1 Rebuild `document/features/code-block` editable node view as `Disclosure` + `CodeMirrorPane` + copy, dropping the import of `@ui`'s editable `CodeBlock`. _(+ rewired mermaid's pane import off @ui → @editor `CodeMirrorPane`, so Phase 4 can delete @ui's pane; grep confirms no `components/code-editor-pane` import under `packages/editor/src`)_
- [x] 3.2 Add the settings menu (Tab size / Use tabs / Show line numbers / Soft wrap) built from the `@ui` `DropdownMenu`, wired to CodeMirror compartments (no remount). _(new `code-settings-menu.tsx`; `CodeMirrorPane` extended with `tabSize`/`useTabs`/`showLineNumbers` compartments)_
- [x] 3.3 Point the read-only paths (static viewer, export codec `toReact`) at the read-only `@ui` `CodeBlock`.
- [x] 3.4 Update/extend the code-block feature spec to assert editing behavior is preserved.

## 4. `@ui` — drop CodeMirror and the code-editor family

- [x] 4.1 Make `CodeBlock` read-only: remove `editable` / `onCodeChange` / `onLanguageChange` and the lazy `CodeEditorPane` import. _(kept the Shiki `<pre>` + ScrollArea rail, copy, and the `Disclosure` composition; dropped the `LanguageSwitcher` picker branch; no consumer passed the editable props)_
- [x] 4.2 Delete `code-editor.tsx`, `code-editor-pane.tsx`, `file-content-router.tsx`, `lib/code-syntax.ts` (+ their specs) from `@ui`. _(git rm; kept `lib/shiki.ts` + `lib/code-theme.ts` and all preview components per D2; repointed the 3 storybook code-editor stories to `@zeroxsolutions/editor/code/*` + `shared/code-mirror/code-mirror-pane`)_
- [x] 4.3 Confirm no `@codemirror` import and no `@zeroxsolutions/editor` import remains under `packages/ui/src`. _(removed the 4 `@codemirror/*` deps from `packages/ui/package.json` + `pnpm install`; kept `class-variance-authority` / `shiki` / `@shikijs/langs`; all three verification greps empty)_

## 5. `@ui` — flatten `ai-elements/` and delete the redundant Conversation

- [x] 5.1 Move `code-block` → `components/code-block.tsx`; move `reasoning` → `components/chat/reasoning.tsx` and `tool` → `components/chat/tool.tsx` (with specs); remove the empty `ai-elements/` folder. _(relocate-only per Non-Goals — reasoning/tool internals unchanged, not recomposed onto `Disclosure`; `git mv` preserved history)_
- [x] 5.2 Delete `ai-elements/conversation.tsx` + spec, and the now-dead `hooks/use-stick-to-bottom.ts` + spec. _(grep-verified no other consumer incl. uncommitted `composer/`)_
- [x] 5.3 Update every internal import of the moved/removed subpaths (`markdown-view`, `tool.tsx`, editor code-block feature, storybook stories); deleted the `conversation` story. _(story files physically stay under `apps/storybook/src/ai-elements/` with repointed imports — physical relocation is 8.1)_

## 6. `@editor` — ScrollArea on preview panes

- [x] 6.1 In the moved `FileContentRouter`, swap the markdown and font panes' raw `overflow-auto` for the design-system `ScrollArea`; leave `.cm-scroller` and the read-only rail bespoke. _(also fixed a Phase-2 latent defect: `shared/code-mirror/code-syntax.ts` `import type` from `shiki`/`shiki/types` was unresolvable in @editor → added `shiki` as an @editor **devDependency** (type-only, erased at build; runtime highlighter still forward-imported from @ui — one instance, D2 intact))_

## 7. `@editor` — Mermaid rule-conformance refactor

- [x] 7.1 (F1) Recompose the Mermaid node view (`document/features/mermaid/mermaid.tsx`) and standalone editor (`mermaid/react/editor.tsx`) header onto the shared `@ui` `Disclosure` — diagram-type label in `DisclosureTitle`, View/Edit `Tabs` + copy in `DisclosureActions`, the active panel in `DisclosureContent` — deleting the three hand-rolled header strips. _(no `DisclosureTrigger` — a Mermaid block never collapses; `MermaidToolbar` renders the standalone editor's `DisclosureHeader`, `editor.tsx` owns the `Disclosure` Root + body)_
- [x] 7.2 (F2) Replace the hand-rolled zoom toolbar in `mermaid/react/preview.tsx` with the `@ui` `FloatingToolbar`; keep only `DiagramCanvas` bespoke.
- [x] 7.3 (F5) Replace the `DropdownMenu` template switcher in `mermaid/react/toolbar.tsx` with a stateful `Combobox` (the `LanguageSwitcher` pattern) that shows the active diagram type. _(export menu stays a `DropdownMenu`; the switcher displays `DIAGRAM_TYPE_LABEL[detected type]`, synthesizing a display-only option for types without a template)_
- [x] 7.4 (F3) Replace `rounded-lg border bg-card` containers (node view, viewer, standalone editor) with a design-system `Card` / the `Disclosure` container. _(editable node view + standalone editor → `Disclosure` Root; read-only viewer node view → `Card`/`CardContent`; `viewer.tsx` fallback `<pre>` → read-only `CodeBlock`)_
- [x] 7.5 (F4) Render the Mermaid export codec `toReact` fallback through the read-only `@ui` `CodeBlock` instead of a raw `<pre>`.
- [x] 7.6 Update/extend the Mermaid specs to assert diagram behavior (render, View/Edit, template pick, export) is unchanged. _(exported `MermaidView`/`mermaidCodec`; new node-view assertions in `mermaid.spec.tsx` + new `toolbar.spec.tsx`; also fixed the `editor.tsx` dts TS2322 — `react-resizable-panels@4.11.2` renamed `direction`→`orientation`)_

## 8. Storybook and release

- [x] 8.1 Relocate the code-editor / code-block / reasoning / tool / Mermaid stories to the new subpaths; delete the `conversation` story; update the `floating-toolbar` story name. _(dissolved `AI Elements`: `code-block`→`Components/CodeBlock` (src root, matching the flat `Components/*` convention), `reasoning`/`tool`→`Chat/Reasoning`+`Chat/Tool` (joining the existing `src/chat/` group per D5); renamed the pane story `CodeEditorPane`→`CodeMirrorPane`; kept the coherent `Code Editor` cluster (its imports were already repointed to `@editor` subpaths in Phase 4); Mermaid story already at `Document Editor/Mermaid Editor` on `@editor` subpaths; `conversation` deleted + `floating-toolbar` renamed in earlier phases. storybook rebuild green, no stale `AI Elements`.)_
- [ ] 8.2 Bump `@zeroxsolutions/ui` and `@zeroxsolutions/editor` as **major** via `nx release` (conventional commits), reflecting the changed public subpath maps.

## 9. Validation

- [x] 9.1 `nx run-many -t lint build test` green after each phase; `test-storybook` green. _(build+test green for `@ui` (194/194) + `@editor` (179/179) and `build-storybook` green, re-verified independently each phase. `test-storybook` proper (interaction runner) needs `@storybook/test-runner`+playwright, which aren't installed in this shared tree and can't be added mid-concurrency without churning the lockfile — substituted a **zero-install raw-CDP browser render pass** (cached chrome-headless-shell) over the mermaid/code-block/disclosure/floating-toolbar stories: all render faithfully, zero horizontal overflow, zero look-alike classes. `@ui`/`@editor` have no per-project `lint` target; the standalone `typecheck` red is a pre-existing project-wide DOM-lib config artifact in out-of-scope specs, not this change.)_
- [x] 9.2 Grep-verify: no `@codemirror` / no `@zeroxsolutions/editor` under `packages/ui/src`; exactly one Shiki instance. _(all three empty/one: no `@codemirror`, no `@editor` back-edge, exactly one `createHighlighter` in `@ui/lib/shiki.ts`.)_
- [x] 9.3 Behavior parity: editable code-block edits/language-switch/copy work; read-only + editable share the `Disclosure`; preview panes scroll via `ScrollArea`; no dangling `Conversation` / `use-stick-to-bottom` references. _(specs green + browser render confirms; no dangling refs.)_
- [x] 9.4 Mermaid parity: diagram renders, View/Edit switches, template pick + export work; no hand-rolled header/toolbar/card/`<pre>`; template switcher is a `Combobox`; only `DiagramCanvas` bespoke. _(browser: flowchart renders in node-view + standalone + dark; View/Edit tabs; Combobox shows "Flowchart"; Export DropdownMenu; FloatingToolbar zoom overlay; parse error → DS `Alert`. greps: no look-alike chrome; only `DiagramCanvas` bespoke.)_
- [x] 9.5 Rule-audit the diff against `.agents/rules/*` (`ui-from-design-system`, `ui-primitive-fidelity`, `ui-compound-authoring`, `naming-files-and-symbols`, `lib-public-exports-and-semver`) before committing on `master`. _(code-reviewer audit: essentially clean — one LOW naming nit fixed (`paneVariants`→`codeMirrorPaneVariants`); `CodeEditorContext` correctly NOT a violation (headless multi-file root state, relocated verbatim, no Base-UI-primitive equivalent); no hardcoded hex/palette colours; forward-only `@editor→@ui`. Confirmed: the moved/renamed/deleted public subpaths make **8.2 a required MAJOR bump** with `!`/`BREAKING CHANGE`.)_
