## 1. `@ui` — shared `Disclosure` compound + rename

- [ ] 1.1 Add a `Disclosure` compound to `packages/ui/src/components/disclosure.tsx` — a shadcn-style compound (Root + `DisclosureHeader` / `DisclosureTitle` / `DisclosureActions` / `DisclosureContent`) wrapping a Base UI collapsible primitive, per `ui-compound-authoring`: exported `disclosureVariants` cva, `data-slot="disclosure-*"` on every part, `className` layout-only; do not touch `components/ui/*`.
- [ ] 1.2 Recompose the existing (still-editable) `CodeBlock` onto `Disclosure` with no behavior change; keep its spec green.
- [ ] 1.3 Rename `FloatingToolbarShell` → `FloatingToolbar` (file `floating-toolbar.tsx`, symbol, story, per-file export subpath); update its consumers.

## 2. `@editor` — land the CodeMirror seam and code surface

- [ ] 2.1 Move `code-editor-pane.tsx` → `packages/editor/src/shared/code-mirror/` as the `CodeMirrorPane` seam (replace the `export {}` stub).
- [ ] 2.2 Move `lib/code-syntax.ts` into `shared/code-mirror/`, re-pointing its Shiki imports to `@zeroxsolutions/ui/lib/shiki` (forward — one highlighter).
- [ ] 2.3 Move `code-editor.tsx` + `file-content-router.tsx` → `packages/editor/src/code/`; import the generic previews (`markdown-view`, `image-preview`, `font-preview`, `binary-file-card`, `language-switcher`) forward from `@zeroxsolutions/ui`.
- [ ] 2.4 Move `@codemirror/{state,view,commands,language}` from `packages/ui/package.json` to `packages/editor/package.json`.
- [ ] 2.5 Move the co-located specs (`code-editor-pane.spec`, `code-editor.spec`, `file-content-router.spec`) with their files.

## 3. `@editor` — rebuild the editable code-block feature

- [ ] 3.1 Rebuild `document/features/code-block` editable node view as `Disclosure` + `CodeMirrorPane` + copy, dropping the import of `@ui`'s editable `CodeBlock`.
- [ ] 3.2 Add the settings menu (Tab size / Use tabs / Show line numbers / Soft wrap) built from the `@ui` `DropdownMenu`, wired to CodeMirror compartments (no remount).
- [ ] 3.3 Point the read-only paths (static viewer, export codec `toReact`) at the read-only `@ui` `CodeBlock`.
- [ ] 3.4 Update/extend the code-block feature spec to assert editing behavior is preserved.

## 4. `@ui` — drop CodeMirror and the code-editor family

- [ ] 4.1 Make `CodeBlock` read-only: remove `editable` / `onCodeChange` / `onLanguageChange` and the lazy `CodeEditorPane` import.
- [ ] 4.2 Delete `code-editor.tsx`, `code-editor-pane.tsx`, `file-content-router.tsx`, `lib/code-syntax.ts` (+ their specs) from `@ui`.
- [ ] 4.3 Confirm no `@codemirror` import and no `@zeroxsolutions/editor` import remains under `packages/ui/src`.

## 5. `@ui` — flatten `ai-elements/` and delete the redundant Conversation

- [ ] 5.1 Move `code-block` → `components/code-block.tsx` (composing `Disclosure`); move `reasoning` → `components/chat/reasoning.tsx` and `tool` → `components/chat/tool.tsx` (each composing `Disclosure`, with specs); remove the empty `ai-elements/` folder.
- [ ] 5.2 Delete `ai-elements/conversation.tsx` + spec, and the now-dead `hooks/use-stick-to-bottom.ts` + spec.
- [ ] 5.3 Update every internal import of the moved/removed subpaths (`markdown-view`, editor code-block feature, chat surfaces).

## 6. `@editor` — ScrollArea on preview panes

- [ ] 6.1 In the moved `FileContentRouter`, swap the markdown and font panes' raw `overflow-auto` for the design-system `ScrollArea`; leave `.cm-scroller` and the read-only rail bespoke.

## 7. `@editor` — Mermaid rule-conformance refactor

- [ ] 7.1 (F1) Recompose the Mermaid node view (`document/features/mermaid/mermaid.tsx`) and standalone editor (`mermaid/react/editor.tsx`) header onto the shared `@ui` `Disclosure` — diagram-type label in `DisclosureTitle`, View/Edit `Tabs` + copy in `DisclosureActions`, the active panel in `DisclosureContent` — deleting the three hand-rolled header strips.
- [ ] 7.2 (F2) Replace the hand-rolled zoom toolbar in `mermaid/react/preview.tsx` with the `@ui` `FloatingToolbar`; keep only `DiagramCanvas` bespoke.
- [ ] 7.3 (F5) Replace the `DropdownMenu` template switcher in `mermaid/react/toolbar.tsx` with a stateful `Combobox` (the `LanguageSwitcher` pattern) that shows the active diagram type.
- [ ] 7.4 (F3) Replace `rounded-lg border bg-card` containers (node view, viewer, standalone editor) with a design-system `Card` / the `Disclosure` container.
- [ ] 7.5 (F4) Render the Mermaid export codec `toReact` fallback through the read-only `@ui` `CodeBlock` instead of a raw `<pre>`.
- [ ] 7.6 Update/extend the Mermaid specs to assert diagram behavior (render, View/Edit, template pick, export) is unchanged.

## 8. Storybook and release

- [ ] 8.1 Relocate the code-editor / code-block / reasoning / tool / Mermaid stories to the new subpaths; delete the `conversation` story; update the `floating-toolbar` story name.
- [ ] 8.2 Bump `@zeroxsolutions/ui` and `@zeroxsolutions/editor` as **major** via `nx release` (conventional commits), reflecting the changed public subpath maps.

## 9. Validation

- [ ] 9.1 `nx run-many -t lint build test` green after each phase; `test-storybook` green.
- [ ] 9.2 Grep-verify: no `@codemirror` / no `@zeroxsolutions/editor` under `packages/ui/src`; exactly one Shiki instance.
- [ ] 9.3 Behavior parity: editable code-block edits/language-switch/copy work; read-only + editable share the `Disclosure`; preview panes scroll via `ScrollArea`; no dangling `Conversation` / `use-stick-to-bottom` references.
- [ ] 9.4 Mermaid parity: diagram renders, View/Edit switches, template pick + export work; no hand-rolled header/toolbar/card/`<pre>`; template switcher is a `Combobox`; only `DiagramCanvas` bespoke.
- [ ] 9.5 Rule-audit the diff against `.agents/rules/*` (`ui-from-design-system`, `ui-primitive-fidelity`, `ui-compound-authoring`, `naming-files-and-symbols`, `lib-public-exports-and-semver`) before committing on `master`.
