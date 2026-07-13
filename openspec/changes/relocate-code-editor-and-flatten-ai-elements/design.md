## Context

`@zeroxsolutions/ui` is a shadcn-style design system (Base UI + Tailwind v4). Today it
also ships the CodeMirror-based code editor family — `code-editor-pane` (the CodeMirror
surface), `code-editor` (multi-file `CodeEditor` / `CodeEditorContent`),
`file-content-router` (routes a file to a viewer), and the editable mode of
`ai-elements/code-block` — plus the `@codemirror/*` dependencies. `@zeroxsolutions/editor`
is the composite editor package that depends on `@ui`; it reserves two empty stubs,
`shared/code-mirror/` and `code/`, explicitly for this move (archived
`add-document-editor` **D7** + Migration Plan **Phase 2**).

Two entanglements block a clean move: `ai-elements/code-block`'s **editable** mode lazily
imports `code-editor-pane`, so the code block is what pins CodeMirror into `@ui`; and the
`components/ai-elements/` folder is a Vercel-AI-Elements provenance bucket that mis-files
the general `code-block` and duplicates shadcn's June-2026 native `MessageScroller` with a
redundant `Conversation` (verified against the shadcn changelog and AI Elements docs).

**Mermaid rides in the same seam.** `@editor`'s Mermaid surface — the in-document node
view (`document/features/mermaid/mermaid.tsx`) and the standalone editor
(`mermaid/react/{editor,toolbar,preview}.tsx`) — already renders its **edit** body with
this very `CodeEditorPane`: a Mermaid block is a code editor plus a View/Edit tab. But it
was built (by a separate session) against the rules with a large amount of bespoke UI —
three hand-rolled header strips, a hand-rolled zoom toolbar, `rounded-lg border bg-card`
card look-alikes, a raw `<pre>` fallback, and a `DropdownMenu` template switcher where a
stateful picker is required. Because Mermaid composes the exact pane, shell, and read-only
block this change relocates/introduces, its rule-conformance cleanup is folded in here
rather than duplicated in a later change.

Governing rules: `ui-from-design-system`, `ui-primitive-fidelity`, `ui-compound-authoring`,
`naming-files-and-symbols`, `lib-public-exports-and-semver`, `house-libs-catalog-scope`,
`green-before-commit`.

## Goals / Non-Goals

**Goals:**

- CodeMirror lives in `@editor`, not `@ui`; `@ui` becomes CodeMirror-free.
- `@ui` `CodeBlock` is a read-only view.
- `@ui` ships a shared **`Disclosure`** compound (a general collapsible block: header +
  actions + collapsible content) that the read-only `CodeBlock`, the editable code-block,
  the chat `reasoning`/`tool` surfaces, and the Mermaid header all compose — so no two of
  them hand-roll a drifting header.
- `components/ai-elements/` is dissolved; `Conversation` is deleted in favour of the native
  `MessageScroller`.
- The Mermaid surface composes design-system components end-to-end: the shared `Disclosure`
  (its header), a `Combobox` template/type switcher (not a `DropdownMenu`), the `@ui`
  `FloatingToolbar` (renamed from `FloatingToolbarShell`) for zoom, the design-system `Card`
  container, and the read-only `CodeBlock` for its SSR fallback — leaving only the pan/zoom
  viewport (`DiagramCanvas`) bespoke.
- Preview panes scroll via the design-system `ScrollArea`; one Shiki instance workspace-wide.

**Non-Goals:**

- New editor features, a horizontal `ScrollArea` variant, `reasoning`/`tool` **redesign**
  (they only relocate + compose `Disclosure`), columns/layout, new Mermaid diagram
  capabilities. No worktree/branch (work on `master`, per maintainer).

## Decisions

### D1 — Relocation map

| From (`@ui`) | To (`@editor`) |
| --- | --- |
| `components/code-editor-pane.tsx` (`CodeEditorPane`) | `shared/code-mirror/` as the `CodeMirrorPane` seam |
| `components/code-editor.tsx` (`CodeEditor`, `CodeEditorContent`) | `code/` |
| `components/file-content-router.tsx` (`FileContentRouter`, `RoutedFile`, `fileView`) | `code/` |
| `lib/code-syntax.ts` (CodeMirror theme + Shiki extension + language compartment) | `shared/code-mirror/` (moves with the pane) |

Generic previews (`markdown-view`, `image-preview`, `font-preview`, `binary-file-card`,
`language-switcher`) **stay in `@ui`**; the moved `FileContentRouter` imports them forward.

### D2 — `lib/` untangle keeps one Shiki instance

`lib/shiki.ts` (`highlightToLines`, `CODE_LANGUAGE_IDS`) and `lib/code-theme.ts` back the
read-only `CodeBlock` and `language-switcher` → **stay in `@ui`**. Only `lib/code-syntax.ts`
moves (its sole consumer is the pane); after the move it imports the Shiki foundation from
`@zeroxsolutions/ui/lib/shiki` (forward), so the highlighter is instantiated once, in `@ui`.

### D3 — Dependency moves

`@codemirror/{state,view,commands,language}` move `@ui → @editor` package.json. `shiki` +
`@shikijs/langs` stay in `@ui` (read-only block still highlights). None are in the pnpm
`catalog:` today; post-move they remain single-consumer, so no catalog entry is required
(`house-libs-catalog-scope`).

### D4 — `@ui` `CodeBlock` becomes read-only

Drop `editable` / `onCodeChange` / `onLanguageChange` and the lazy `CodeEditorPane` import.
The read-only block keeps its Shiki `<pre>`, copy control, and horizontal rail. Its only
consumer of the editable mode is the editor's own code-block feature (D6), so the removal
is contained.

### D5 — A shared `Disclosure` compound in `@ui` (composition-first) — supersedes the rejected `CodeBlockShell`

The shared chrome is **not** a code-block-specific "shell". Multiple blocks need the same
header-over-collapsible-body pattern — the read-only code block, the editable code-block,
the chat `reasoning`/`tool` surfaces, and the Mermaid header — so the reusable piece is a
**general `Disclosure` compound**, and each block composes it. (The earlier `CodeBlockShell`
name is dropped: it is both too code-block-specific for a component this many surfaces use,
and a reflex `-shell` suffix the maintainer rejected; naming is grounded in the role, per
`naming-files-and-symbols`.)

`Disclosure` is authored per **`ui-compound-authoring`** — a shadcn-style compound on Base
UI, not a prop-bag:

```
Disclosure                       data-slot="disclosure"        (Root — wraps a Base UI collapsible)
├─ DisclosureHeader              data-slot="disclosure-header" (re-lays-out via has-data-[slot=disclosure-actions])
│  ├─ DisclosureTitle            data-slot="disclosure-title"  → label | LanguageSwitcher | diagram type
│  └─ DisclosureActions          data-slot="disclosure-actions"→ [settings menu | tabs] · copy · collapse trigger
└─ DisclosureContent             data-slot="disclosure-content"→ Shiki <pre> | CodeMirrorPane | DiagramPreview
```

- **Placement** — a newly-authored compound, so it lives in `@ui`'s composed layer
  (`packages/ui/src/components/disclosure.tsx`), **never** the CLI-vendored `components/ui/`
  (which regenerates) — `ui-primitive-fidelity` / `ui-compound-authoring` gap A.
- **State, not prop-drilling** — the open/closed (collapse) state rides the **Base UI
  collapsible primitive** the Root wraps; parts read it through that primitive, not a
  hand-rolled React context or an `open` boolean drilled through the parts
  (`ui-compound-authoring` gap B).
- **Variants** — cva `disclosureVariants`, exported; `className` layout-only.
- **Direction** — it lives in `@ui` because `@editor → @ui` is forward; housing it in
  `@editor` would force a forbidden back-dependency for the read-only block.

Whether the editor wraps `DisclosureHeader` in a domain-named part (e.g.
`DocumentBlockHeader`) is a deferred sub-decision; the shared compound itself is `Disclosure`.

### D6 — Editable code-block rebuilt in `@editor`

`document/features/code-block` composes, for the live node view:
`Disclosure` (`@ui`) + `CodeMirrorPane` (`@editor`) in `DisclosureContent` + a settings menu
in `DisclosureActions` built from the `@ui` `DropdownMenu` (Tab size / Use tabs / Show line
numbers / Soft wrap) + copy + the collapse trigger. The read-only paths (static viewer,
export codec `toReact`) render the read-only `@ui` `CodeBlock` (which itself composes
`Disclosure`). Behavior is preserved: edits write `code`, language changes write `language`.

### D7 — Settings menu drives CodeMirror via compartments

The pane already reconfigures live through CodeMirror `Compartment`s (language, editable,
wrap, placeholder). The settings menu adds compartments for **tab size** (`indentUnit` /
`EditorState.tabSize`), **use tabs** (tab vs spaces indent), **show line numbers**
(`lineNumbers()` toggled), and **soft wrap** (the pane's existing `EditorView.lineWrapping`
compartment) — reconfigured without remounting, consistent with the pane's existing pattern.

### D8 — Dissolve `ai-elements/`

`code-block` → `components/code-block.tsx` (composing `Disclosure`); `reasoning` →
`components/chat/reasoning.tsx` and `tool` → `components/chat/tool.tsx` (keeping their names,
joining the existing `chat/` composites — they are chat-response surfaces, not general
primitives — and each composing `Disclosure` for its collapsible header). **Delete**
`conversation.tsx` + `conversation.spec.tsx` and its now-dead `hooks/use-stick-to-bottom.ts`
(+ spec) — sole consumer was `Conversation`. Safe because these are hand-authored (not
CLI-regenerated) files; the folder is not a shadcn-vendored path.

### D9 — ScrollArea only where the wrapper fits

The moved `FileContentRouter`'s markdown and font panes swap raw `overflow-auto` for the
design-system `ScrollArea` (vertical — the wrapper fits). CodeMirror's `.cm-scroller` and the
read-only block's horizontal rail stay bespoke — sanctioned `ui-primitive-fidelity` exceptions
(foreign scroll ownership; the vendored wrapper is vertical-only and must not be edited).

### D10 — SemVer / release

Both packages expose per-file `./*` subpath maps, so moved/removed files change the public
contract → **major** bumps for `@ui` and `@editor` (`lib-public-exports-and-semver`), via
`nx release` from conventional commits. The `FloatingToolbarShell` → `FloatingToolbar`
rename (D12) is itself a breaking subpath change on `@ui`. Only `apps/storybook`, the
editor's own features, and the Mermaid surface consume the affected subpaths.

### D11 — Mermaid is a code editor + a View/Edit tab, so it composes the same block (F1)

The Mermaid node view and standalone editor each hand-roll a header strip
(`flex items-center justify-between … border-b px-2 py-1.5`) three times over. Since a
Mermaid block is exactly *the code editor plus a View/Edit tab*, its header is the shared
`Disclosure` header, not a bespoke strip: the diagram-type label fills `DisclosureTitle`, the
View/Edit `Tabs` + copy fill `DisclosureActions`, and the active tab's panel (`DiagramPreview`
under View, `CodeMirrorPane` under Edit) fills `DisclosureContent`. The visible icon+text type
label is a legitimate raw layout row inside `DisclosureTitle` (it is *not* the icon-only
`IconLabel`, which hides its text behind a tooltip).

### D12 — Mermaid zoom controls compose `FloatingToolbar` (F2) + the rename

`mermaid/react/preview.tsx` hand-rolls a zoom/pan toolbar. It composes the `@ui`
**`FloatingToolbar`** instead — the existing `FloatingToolbarShell`, **renamed** to drop the
rejected `-shell` suffix (maintainer request; `naming-files-and-symbols`). Only the pan/zoom
**viewport** (`DiagramCanvas`) stays bespoke — the one sanctioned coordinate/virtual-anchor
surface (`ui-from-design-system`); its controls are design-system components on design-system
tokens.

### D13 — Mermaid template/type switcher is a stateful `Combobox`, not a `DropdownMenu` (F5)

`toolbar.tsx` picks a template with a `DropdownMenu` — a fire-and-forget menu that shows no
current selection, so nothing (a user or an agent) can tell which template/type is active.
The diagram type is *stateful selection*, so it composes the shipped **`Combobox`** — the
`LanguageSwitcher` pattern (a `Combobox`-backed switcher that displays its current value) —
unifying the type label and the template picker into one switcher. (Shipped `Combobox`, never
a hand-rolled Popover+Command; its popup width is overridable.)

### D14 — Mermaid block container is a design-system `Card`/`Disclosure`, not a look-alike (F3)

`rounded-lg border bg-card` recurs across the node view, the viewer, and the standalone
editor container — a hand-rolled `Card` look-alike. The block container composes the
design-system `Card` (or the `Disclosure` Root's own container), never the ad-hoc class
(`ui-from-design-system`: compose, don't re-skin).

### D15 — Mermaid SSR fallback renders the read-only `CodeBlock` (F4)

The export codec `toReact` emits a raw `<pre class="mermaid" …>` fallback (Mermaid needs a
live DOM the static server lacks). It renders the read-only `@ui` `CodeBlock` instead — the
exact read-only Shiki view this change introduces (D4) — so the static export shows
highlighted, copyable source consistent with every other code block, not a bare `<pre>`.

## Risks / Trade-offs

- **Dependency direction** — `@editor`'s code-block must stop importing `@ui`'s editable
  `CodeBlock` **before** `@ui` drops it; order the move so `@editor` owns the pane first.
- **Shiki double-load** — if the moved `code-syntax` re-imports Shiki from a copied source
  instead of `@ui/lib/shiki`, two highlighters load; the forward import (D2) prevents it.
- **Breaking subpaths** — real major bumps (`CodeMirror` move, `ai-elements/` flatten, the
  `FloatingToolbar` rename); mitigated by the tiny consumer set.
- **Header drift** — the whole reason for the shared `Disclosure` (D5); a hand-rolled header
  (as Mermaid had three of) reintroduces the look-alike the rules forbid.
- **Mermaid scope creep** — the Mermaid cleanup is bounded to *rule conformance* (compose
  the existing DS components); no diagram behavior changes, and `DiagramCanvas` stays as-is.
- **Storybook coverage** — the Storybook host is covered by its `test-storybook` target
  (the `e2e-pairs-each-app` Storybook exception), which must stay green after story moves.

## State Model

- **Code-block render mode**: `editable` (live node view → `CodeMirrorPane`) vs `read-only`
  (viewer/export → `@ui CodeBlock`). One feature, two render paths, one shared `Disclosure`.
- **Disclosure collapse**: `expanded` ⇄ `collapsed` (content hidden), owned by the wrapped
  Base UI collapsible primitive — not a hand-rolled boolean.
- **Pane settings** (editable only): `tabSize`, `useTabs`, `showLineNumbers`, `softWrap`,
  reconfigured live via CodeMirror compartments (D7).
- **Mermaid view mode**: `view` (rendered diagram) ⇄ `edit` (`CodeMirrorPane`), local
  uncontrolled tab state — never persisted (source stays the only attribute).
- **Mermaid type/template**: the active diagram type, shown by the `Combobox` switcher (D13).

## Migration Plan

1. `@ui`: add the `Disclosure` compound (composed layer, on a Base UI collapsible); recompose
   the (still-editable) `CodeBlock` onto it — green.
2. `@ui`: rename `FloatingToolbarShell` → `FloatingToolbar` (file + symbol + subpath) — green.
3. `@editor`: land `shared/code-mirror/` (move pane + `code-syntax`) and `code/` (move
   `code-editor` + `file-content-router`); move `@codemirror/*` deps — green.
4. `@editor`: rebuild the code-block feature's editable surface on `Disclosure` + moved pane +
   settings menu; switch its read-only path to `@ui` read-only `CodeBlock` — green.
5. `@ui`: drop `CodeBlock` editable mode + lazy pane import; delete the code-editor family
   (`code-editor`, `code-editor-pane`, `file-content-router`, `lib/code-syntax`) — green.
6. `@ui`: flatten `ai-elements/` (move `reasoning`/`tool` to `chat/`, composing `Disclosure`;
   delete `conversation` + `use-stick-to-bottom`); move `code-block` to `components/`.
7. `@editor`: refactor Mermaid — node view + standalone editor compose `Disclosure` (F1),
   zoom composes `FloatingToolbar` (F2), template switcher becomes a `Combobox` (F5), the
   container composes `Card` (F3), the `toReact` fallback renders the read-only `CodeBlock`
   (F4); `DiagramCanvas` untouched — green.
8. `@editor`: apply `ScrollArea` to the moved preview panes.
9. `apps/storybook`: relocate/retire stories; update every import subpath; run
   `nx run-many -t lint build test` + `test-storybook`; `nx release` major bumps.

## Resolved Decisions

*(Formerly Open Questions — settled with the maintainer.)*

- **Read-only `CodeBlock` header** → label + copy + collapse (the `Disclosure` header slots).
- **Settings-menu option set** → Tab size, Use tabs, Show line numbers, **Soft wrap**.
- **Shared-chrome name** → **`Disclosure`** (a general compound), *not* `CodeBlockShell`
  (rejected `-shell` reflex; too code-block-specific for its many consumers).
- **`reasoning` / `tool`** → keep their names; relocate to `components/chat/`; compose
  `Disclosure`.
- **`FloatingToolbarShell`** → renamed `FloatingToolbar`.
- **`CodeMirrorPane`** → confirmed as the moved pane's seam name.

## Open Questions

- Does the editor wrap `DisclosureHeader` in a domain-named part (`DocumentBlockHeader`), or
  compose `Disclosure`'s parts directly? (Deferred; does not block the move.)
- Do the sibling `ChatMessageShell` / `FloatingShell` also drop `-shell` in this change, or a
  follow-up? (Maintainer to confirm scope.)
