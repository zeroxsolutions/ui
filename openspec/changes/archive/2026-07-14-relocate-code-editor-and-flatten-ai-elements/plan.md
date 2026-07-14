## Scope

The whole change: relocate the CodeMirror code editor from `@zeroxsolutions/ui` into
`@zeroxsolutions/editor`, add a shared `Disclosure` compound and make `@ui` `CodeBlock` a
read-only view composing it, rename `FloatingToolbarShell` → `FloatingToolbar`, rebuild the
editor's editable code-block on the moved pane, dissolve `components/ai-elements/`, delete the
redundant `Conversation`, refactor the `@editor` Mermaid surface to compose the design system
(F1–F5), and apply the design-system `ScrollArea` to the code surface's preview panes. One
serial execution block (hard cross-package ordering).

## Covers

`1.1`–`1.3`, `2.1`–`2.5`, `3.1`–`3.4`, `4.1`–`4.3`, `5.1`–`5.3`, `6.1`, `7.1`–`7.6`,
`8.1`–`8.2`, `9.1`–`9.5`; Validation Focus: no-`@codemirror`-in-`@ui`, one-Shiki-instance,
editable-behavior parity, shared-`Disclosure` header parity, `ScrollArea` on preview panes,
no dangling `Conversation`, Mermaid composes the design system (only `DiagramCanvas` bespoke).

## Plan Type

full

## Execution Strategy

tdd-preferred

## Ordered Steps

1. `@ui`: add the `Disclosure` compound (composed layer, on a Base UI collapsible, per
   `ui-compound-authoring`), recompose the still-editable `CodeBlock` onto it; rename
   `FloatingToolbarShell` → `FloatingToolbar`. (1.1–1.3)
2. `@editor`: create `shared/code-mirror/` — move `code-editor-pane` (as `CodeMirrorPane`) +
   `lib/code-syntax`, re-point Shiki to `@zeroxsolutions/ui/lib/shiki`; move `@codemirror/*` deps. (2.1, 2.2, 2.4)
3. `@editor`: create `code/` — move `code-editor` + `file-content-router`, importing previews
   forward from `@ui`; carry the co-located specs. (2.3, 2.5)
4. `@editor`: rebuild the code-block feature's editable node view on `Disclosure` +
   `CodeMirrorPane` + settings menu (compartment-wired, incl. soft wrap) + copy; point read-only
   paths at the `@ui` read-only `CodeBlock`; update the feature spec. (3.1–3.4)
5. `@ui`: drop `CodeBlock` editable mode + lazy pane import; delete the code-editor family and
   `lib/code-syntax`; confirm no `@codemirror` / no `@editor` import under `packages/ui/src`. (4.1–4.3)
6. `@ui`: flatten `ai-elements/` (move `code-block` to `components/`, `reasoning`/`tool` to
   `components/chat/`, each composing `Disclosure`), delete `conversation` +
   `use-stick-to-bottom`, update internal imports. (5.1–5.3)
7. `@editor`: refactor Mermaid to compose the design system — `Disclosure` header (F1),
   `FloatingToolbar` zoom (F2), `Combobox` switcher (F5), `Card` container (F3), read-only
   `CodeBlock` fallback (F4); leave `DiagramCanvas` bespoke; update Mermaid specs. (7.1–7.6)
8. `@editor`: swap the moved `FileContentRouter` markdown/font panes to `ScrollArea`. (6.1)
9. Storybook: relocate stories to new subpaths, delete the `conversation` story, rename the
   floating-toolbar story; then `nx release` major bumps for `@ui` + `@editor`. (8.1–8.2)

## Validation Per Step

1. `nx run-many -t lint build test @zeroxsolutions/ui`; `CodeBlock` spec + `Disclosure` render green; `FloatingToolbar` resolves at its new subpath.
2. `nx build @zeroxsolutions/editor`; grep confirms `code-syntax` imports `@ui/lib/shiki` (no re-bundled Shiki).
3. `nx build @zeroxsolutions/editor`; moved specs green at new paths.
4. `nx test @zeroxsolutions/editor` — editing writes `code`, language switch writes `language`, copy works; read-only path renders `@ui` `CodeBlock`.
5. `grep -R "@codemirror\|@zeroxsolutions/editor" packages/ui/src` returns nothing; `nx run-many -t lint build test` green.
6. `grep -R "ai-elements\|use-stick-to-bottom\|Conversation" packages apps` returns only intended (none dangling); build/test green.
7. `nx test @zeroxsolutions/editor` — Mermaid renders / switches View⇄Edit / picks template / exports unchanged; grep finds no hand-rolled header strip, zoom toolbar, `rounded-lg border bg-card`, or `<pre class="mermaid"` fallback; switcher is a `Combobox`.
8. Storybook render: markdown/font panes scroll with the styled `ScrollArea`; `.cm-scroller` untouched.
9. `nx run-many -t lint build test` + `test-storybook` green; `nx release` produces major bumps.

## Files / Owners

- `packages/ui/src/components/disclosure.tsx` (new), `components/code-block.tsx` (from `ai-elements/`, read-only, composes `Disclosure`)
- `packages/ui/src/components/floating-toolbar.tsx` (renamed from `floating-toolbar-shell.tsx`)
- `packages/ui/src/components/{code-editor,code-editor-pane,file-content-router}.tsx` (delete), `lib/code-syntax.ts` (move out)
- `packages/ui/src/components/ai-elements/*` (dissolve), `components/chat/{reasoning,tool}.tsx` (moved), `hooks/use-stick-to-bottom.ts` (delete)
- `packages/editor/src/shared/code-mirror/*` (pane + code-syntax), `packages/editor/src/code/*` (surface)
- `packages/editor/src/document/features/code-block/code-block.tsx` (rebuild)
- `packages/editor/src/document/features/mermaid/mermaid.tsx`, `packages/editor/src/mermaid/react/{editor,toolbar,preview}.tsx` (Mermaid refactor; `DiagramCanvas` untouched)
- `packages/{ui,editor}/package.json` (dep moves + version), `apps/storybook/src/{code-editor,ai-elements,mermaid}/*`

## Completion Checkpoint

All 9 task groups checked; the three new capability specs (`editor-code-surface`,
`ui-code-block`, `editor-mermaid-composition`) and the `editor-ui-composition` delta hold in
the code; `@ui` is CodeMirror-free; `@editor` owns the pane + surface with only forward `@ui`
imports; one Shiki instance; `ai-elements/` gone; the Mermaid surface composes the design
system (only `DiagramCanvas` bespoke); `nx run-many -t lint build test` + `test-storybook`
green; major bumps released.

## Completion Verification

Verification Mode is retained-recommended → record a short `verification.md` (or Execution Notes
entry) with Storybook-driven evidence that: (a) the editable code-block edits/switches
language/copies and its header matches the read-only block's (shared `Disclosure`, no drift);
(b) the markdown/font preview panes scroll via the styled `ScrollArea`; (c) the Mermaid surface
renders, switches View⇄Edit, picks a template via the `Combobox`, and exports — with no
hand-rolled header/toolbar/card/`<pre>`. jsdom cannot measure layout — the proof must come from
a real render (`test-storybook` / a browser-driven check).

## Delegation Units

- Single implementer subagent owns the whole serial block; it self-loads `.agents/rules/*.md`
  per file and writes completion back into `tasks.md` checkboxes + `verification.md`.

## Isolation Reason

Same-tree by maintainer instruction (work on `master`, no worktree — deviation from
`worktree-per-task`). The move edits both packages' `package.json` and per-file export maps, so
it must be serialized against any other concurrent work on this repo.

## Execution Notes

<!-- apply-time observations appended here -->

## Manual Adjustments

<!-- preserve human edits -->
