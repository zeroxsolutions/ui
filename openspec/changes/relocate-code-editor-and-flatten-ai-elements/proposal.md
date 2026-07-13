## Why

The editor architecture already committed to this as **Phase 2**: the archived
`add-document-editor` design (D7 + Migration Plan) states the CodeMirror code editor
should move out of the base design system `@zeroxsolutions/ui` into the composite
`@zeroxsolutions/editor`, behind the reserved `shared/code-mirror/` seam and `code/`
surface — both of which exist today only as empty `export {}` stubs waiting for it.

shadcn/ui is not a code editor. CodeMirror is a foreign engine (its own DOM, scroller,
and styling) that only *rides* the design tokens — housing it in the base design system
drags the whole `@codemirror/*` tree into every design-system consumer, whether or not
they want an editor.

Two adjacent problems surfaced while scoping the move:

- The design-system `CodeBlock` (living under `components/ai-elements/`) bundles an
  **editable** CodeMirror mode, so it is what pins CodeMirror into `@zeroxsolutions/ui`.
- `components/ai-elements/` is a third-party (Vercel AI Elements) provenance bucket, not
  a role-based group. It **mis-files** a general-purpose `code-block` primitive under an
  "AI" label, and it **duplicates** shadcn's June-2026 native chat scroller
  (`MessageScroller`, already vendored in this repo) with a redundant `Conversation`.

## What Changes

- **Relocate CodeMirror** into `@zeroxsolutions/editor`: `code-editor-pane` →
  `shared/code-mirror/` (as the `CodeMirrorPane` seam); `code-editor` +
  `file-content-router` → `code/`; `lib/code-syntax` moves with the pane. The
  `@codemirror/*` dependencies move `@ui → @editor`. The shared Shiki foundation
  (`lib/shiki`, `lib/code-theme`) **stays** in `@ui` and is imported forward, so there is
  still exactly one highlighter instance.
- **`@ui CodeBlock` becomes a read-only Shiki view** — drops `editable` / `onCodeChange`
  / `onLanguageChange` and its lazy CodeMirror import — so `@ui` no longer ships CodeMirror.
- **Add a shared `Disclosure` compound to `@ui`** — a general collapsible block (Root +
  header + title + actions + collapsible content), a shadcn-style compound on Base UI
  authored per `ui-compound-authoring`, in the composed layer (not vendored `components/ui/`).
  The read-only `CodeBlock`, the editable code-block, the chat `reasoning`/`tool` surfaces,
  and the Mermaid header all compose it, so no two hand-roll a drifting header. Supersedes the
  rejected `CodeBlockShell` name (a `-shell` reflex; too code-block-specific for its many
  consumers).
- **The document code-block feature's editable surface** composes `Disclosure` +
  `CodeMirrorPane` (from `@editor`) + a settings menu (tab size / use tabs / show line
  numbers / soft wrap) built from the `@ui` `DropdownMenu`; the read-only viewer/export path
  uses the read-only `@ui CodeBlock`.
- **Dissolve `components/ai-elements/`**: `code-block` → flat `components/`, `reasoning` /
  `tool` → `components/chat/` (each composing `Disclosure`); **delete `conversation`**
  (superseded by the native `MessageScroller`) along with its now-dead `use-stick-to-bottom`
  hook.
- **Refactor the Mermaid surface to compose the design system** (it was hand-built against the
  rules by a separate session): its three hand-rolled header strips become the shared
  `Disclosure` header (F1); its hand-rolled zoom toolbar becomes the `@ui` `FloatingToolbar`,
  **renamed** from `FloatingToolbarShell` (F2); its `DropdownMenu` template switcher becomes a
  stateful `Combobox` that shows the active type (F5); its `rounded-lg border bg-card`
  look-alike becomes a design-system `Card` (F3); and its raw `<pre>` SSR fallback becomes the
  read-only `CodeBlock` (F4). Only the `DiagramCanvas` pan/zoom viewport stays bespoke; no
  diagram behavior changes.
- **ScrollArea**: the code surface's markdown and font preview panes scroll through the
  design-system `ScrollArea` (they were raw `overflow-auto` divs). CodeMirror's
  `.cm-scroller` and `CodeBlock`'s horizontal rail remain bespoke — sanctioned exceptions.

## Success Criteria

- `@zeroxsolutions/ui` has **zero** `@codemirror/*` dependency and no CodeMirror import
  anywhere under `packages/ui/src`.
- `@zeroxsolutions/editor` exposes the editing pane at `shared/code-mirror/` and the
  multi-file surface at `code/`, and imports `@ui` **forward only** — no `@ui → @editor`
  dependency edge is introduced.
- `@ui CodeBlock` renders read-only only; the editable code-block and the read-only
  `CodeBlock` share one `Disclosure` compound, so their header is identical by construction.
- `components/ai-elements/` no longer exists; `Conversation` and `use-stick-to-bottom` are
  removed with no dangling references; the four surfaces resolve at their new flat subpaths.
- The Mermaid surface hand-rolls no header strip, zoom toolbar, `Card` look-alike, or `<pre>`
  fallback, and its template switcher is a `Combobox` (not a `DropdownMenu`); only
  `DiagramCanvas` stays bespoke, and diagram behavior is unchanged.
- Markdown/font preview panes scroll via `ScrollArea`; exactly one Shiki highlighter
  instance across the workspace.
- `nx run-many -t lint build test` is green and Storybook builds; the editor's code-block
  editing and read-only rendering keep their observable behavior.

## Non-Goals

- No new code-editor capabilities (LSP, multi-cursor, diff, minimap, columns/layout —
  columns/layout stay deferred per the archived plan).
- No change to the read-only `CodeBlock`'s Shiki highlighting, copy control, or
  horizontal-rail behavior beyond its new home and shell composition.
- No redesign of `reasoning` / `tool` beyond relocating them out of `ai-elements/`.
- No new horizontal `ScrollArea` variant — the code-block rail keeps composing the Base UI
  primitive as it does today.
- No worktree/branch: work proceeds on `master` per the maintainer's explicit instruction
  (a deliberate, recorded deviation from `worktree-per-task`).

## Capabilities

### New Capabilities

- `editor-code-surface`: `@zeroxsolutions/editor` owns the CodeMirror editing pane (the
  `CodeMirrorPane` seam) and the standalone multi-file code surface (routing a file to the
  pane or to a design-system preview); the document code-block feature reuses the pane, and
  `@ui` is imported forward only.
- `ui-code-block`: `@zeroxsolutions/ui` ships a read-only code block plus a shared
  `Disclosure` compound (header + actions + collapsible content, authored per
  `ui-compound-authoring`) that any editable consumer composes so the header never drifts;
  `@ui` carries no CodeMirror dependency.
- `editor-mermaid-composition`: the `@zeroxsolutions/editor` Mermaid surface composes the
  design system end-to-end — the shared `Disclosure` header, a `Combobox` type/template
  switcher, the `FloatingToolbar` zoom controls, a `Card` container, and the read-only
  `CodeBlock` SSR fallback — leaving only the `DiagramCanvas` pan/zoom viewport bespoke.

### Modified Capabilities

- `editor-ui-composition`: the code-block feature's **editable** surface now composes the
  shared `@ui` shell around `@editor`'s own `CodeMirrorPane` (previously it consumed `@ui`'s
  `CodeBlock` editable mode); its observable editing behavior is preserved.

## Impact

- **Packages** — `@zeroxsolutions/ui`: remove the CodeMirror code-editor family, make
  `CodeBlock` read-only, add the `Disclosure` compound, rename `FloatingToolbarShell` →
  `FloatingToolbar`, flatten `ai-elements/`, delete `Conversation` + `use-stick-to-bottom`.
  `@zeroxsolutions/editor`: gain the `shared/code-mirror/` seam, the `code/` surface, the
  editable code-block rebuild, and the Mermaid surface refactor (compose `Disclosure` /
  `FloatingToolbar` / `Combobox` / `Card` / read-only `CodeBlock`). `apps/storybook`:
  move/retire the affected code + Mermaid stories.
- **Dependencies** — `@codemirror/{state,view,commands,language}` move `@ui → @editor`;
  `shiki` stays in `@ui`.
- **Public surface** — both packages use per-file `./*` subpath maps, so moving/removing/
  renaming a file **changes the contract** (breaking → major bump). `@ui` loses
  `.../components/code-editor`, `.../code-editor-pane`, `.../file-content-router`, and
  `.../components/ai-elements/*`, and renames `.../components/floating-toolbar-shell` →
  `.../components/floating-toolbar`; `@editor` gains `.../shared/code-mirror/*` and
  `.../code/*`; the surviving AI elements move to `.../components/code-block` and
  `.../components/chat/{reasoning,tool}`; the new `.../components/disclosure` is added.
- **Consumers today** — only `apps/storybook`, the editor's own code-block feature, and the
  `@editor` Mermaid surface import any of the affected surfaces, so the blast radius is small.
- Realizes the archived `add-document-editor` **D7 + Migration Plan (Phase 2)**: the reserved
  `code/` and `shared/code-mirror/` stubs finally get their implementation.
