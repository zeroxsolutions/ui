## Why

`@zeroxsolutions/editor` is deliberately an **editor family with surfaces** (`document/` built, `code/` reserved) so a new surface slots in under its own folder without a breaking rename. Mermaid already exists in the family — but only as a **render-only block** inside `document/`, whose sole editing affordance is a raw `<textarea>` that bypasses the design system's CodeMirror pane (`CodeEditorPane`). There is no first-class surface for authoring a diagram, no live source↔preview editing, no pan/zoom, no export, no templates, and a parse error replaces the last good render with a red `<pre>`.

This change delivers a real **Mermaid editor surface** (`mermaid/`) and rebuilds the in-document block to reuse it — closing the gap between "a diagram you can look at" and "a diagram you can author" — while composing every pixel from `@zeroxsolutions/ui` at its variants and tokens, so the surface is on-brand and flips light/dark for free.

## What Changes

- A new `mermaid/` surface exporting `<MermaidEditor>` (split source/preview authoring), `<DiagramViewer>` (read-only, SSR-safe), and a `<DiagramPreview>` pan/zoom viewport, over an engine-free `core/` (lazy mermaid seam, diagram-type detection, starter templates, export).
- The `document/` **mermaid block is rebuilt** to a code-block-style header — diagram-type label/picker on the left, an **eye/pencil `ToggleGroup`** (view ⇄ edit) plus a copy control on the right — with the body driven by that toggle: rendered diagram under the eye, `CodeEditorPane` under the pencil. The `<textarea>` is removed; the block reuses the surface's preview + source components.
- Preview gains **pan/zoom/fit/reset** as a single bespoke transform shell (the only piece the design system cannot express), built on the existing `lib/resize-drag.ts` pointer math.
- Parse errors become **non-destructive** — the last good render is retained and the error is surfaced through a design-system `Alert`.
- Storybook stories cover the surface, the block's view/edit toggle, every diagram type, error state, dark mode, and the narrow (tabbed) layout.

## Success Criteria

- `@zeroxsolutions/editor/mermaid/react/editor` renders a working split source↔preview authoring surface; edits update the live diagram (debounced), and a parse error keeps the last good render visible.
- The in-document mermaid block shows a header with an eye/pencil toggle; view renders the diagram, edit shows `CodeEditorPane`; the raw `<textarea>` is gone; the fenced ` ```mermaid ` codec and the node's `source` attribute are unchanged.
- Preview supports pan (drag), zoom (wheel + buttons), fit-to-view, and reset; every other control is a `@zeroxsolutions/ui` component on design tokens.
- Export produces: copy source, copy SVG, download SVG, download PNG; success/failure is reported via `sonner`.
- Diagram theme rides `shared/theme`'s `variant.mermaid` and flips with `.dark`; no foreign palette or hardcoded color is introduced.
- `nx build`/`nx lint`/`nx test @zeroxsolutions/editor` are green; the build's engine-hiding guard passes (no engine type leaks); new subpaths are additive (SemVer minor).

## Non-Goals

- Non-mermaid diagram engines (the surface is named `mermaid/`, honest to its engine).
- Visual/node drag editing — the surface stays **text-first** (source is the source of truth).
- Mermaid **syntax highlighting** in the source pane — v1 runs `CodeEditorPane` as plain text; a mermaid grammar is deferred (no capability is fabricated).
- Collaborative editing, an advanced mermaid-config JSON panel, and moving `code-editor` out of `@zeroxsolutions/ui` into `shared/code-mirror/` (that remains the reserved `code` surface's Phase 2 work).
- Any new runtime dependency (`mermaid` is already an editor dependency; PNG export uses the browser `<canvas>`).

## Capabilities

### New Capabilities

- `mermaid-editor-surface`: the standalone Mermaid authoring surface — a controlled `<MermaidEditor>` with split source/preview (resizable on wide, tabbed on narrow), a pan/zoom `<DiagramPreview>`, diagram-type detection + starter templates, theme selection, export (source/SVG/PNG), and a read-only SSR-safe `<DiagramViewer>` — composed entirely from `@zeroxsolutions/ui` except the bespoke pan/zoom transform shell.
- `mermaid-document-block`: the in-document Mermaid block — a code-block-style header (diagram-type label/picker + an eye/pencil view/edit `ToggleGroup` + copy) whose body switches between the rendered diagram and `CodeEditorPane`, reusing the surface's components, with non-destructive parse-error handling and an unchanged canonical fenced-` ```mermaid ` codec and node schema.

### Modified Capabilities

<!-- No existing capability spec governs the mermaid block's behavior at the requirement level; the implementation change to `document/features/mermaid` is captured under Impact. -->

## Impact

- **New code**: `packages/editor/src/mermaid/**` (`core/`, `react/`), exported at `@zeroxsolutions/editor/mermaid/*` via the existing per-file `./*` map.
- **Modified code**: `packages/editor/src/document/features/mermaid/mermaid.tsx` — the node view is rebuilt (header + eye/pencil toggle; `<textarea>` removed); the codec, node schema, slash item, and command are behavior-compatible.
- **Storybook**: new stories under `apps/storybook/src/document-editor/` (or a `Mermaid/` group).
- **Dependencies**: none added — `mermaid` is already an editor dependency; UI composes `@zeroxsolutions/ui`.
- **Versioning**: additive **minor** for `@zeroxsolutions/editor` (new subpaths); the block change is behavior-compatible, not breaking.
- **Rules in force**: `ui-from-design-system`, `ui-primitive-fidelity` (the pan/zoom shell is the sanctioned bespoke positioning surface), `lib-public-exports-and-semver`, `structure-lib-layers`/editor-family layout, `naming-files-and-symbols`, `green-before-commit`.
