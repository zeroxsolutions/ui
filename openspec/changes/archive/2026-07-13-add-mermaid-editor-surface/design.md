## Context

`@zeroxsolutions/editor` is an **editor family with surfaces** (design of `add-document-editor`, D1): `shared/` (cross-surface `theme/`, `code-mirror/`), `document/` (built), `code/` (reserved Phase 2). Exports use the per-file `./*` map (dist mirrors src), so a new surface lands at its own subpaths with no hand-maintained mapping.

Mermaid exists today only as a `document/` **feature**: `features/mermaid/mermaid.tsx` is a render-only atom node holding a `source` string, lazy-`import()`ing the `mermaid` engine and injecting SVG via `dangerouslySetInnerHTML`. Its only edit affordance is a raw `<textarea>` — bypassing the design system's `CodeEditorPane` — and a parse error replaces the diagram with a red `<pre>`.

The design system (`@zeroxsolutions/ui`) already ships everything needed except one thing: `CodeEditorPane` (CodeMirror + Shiki, controlled `value`/`onValueChange`/`language`/`readOnly`), `resizable` (react-resizable-panels), `tabs`, `toggle-group`, `dropdown-menu`/`select`, `toolbar-button`, `button-group`, `split-button`, `alert`, `empty`, `sonner`, `scroll-area`, `card`, `layouts/panel-header`, tokens (OKLCH + `.dark`), and `lib/resize-drag.ts` (pointer drag/resize math). The one thing it does **not** ship is any canvas / zoom-pan / node-graph capability (verified: no `react-flow`/`konva`/`tldraw`/`<canvas>`), so a pan/zoom viewport must be bespoke.

The sibling `code-block` establishes the house header idiom: a labelled language header (icon + name, becoming a picker when `onLanguageChange` is given) with a copy control, **shared identically between the read-only and editable body**. The `image` feature establishes the figure idiom: the artifact is always shown, editing rides an overlay affordance, `contentEditable={false}` + `stopPropagation` keeps ProseMirror selection stable.

## Goals / Non-Goals

**Goals:**

- Deliver a first-class **`mermaid/` surface** — `<MermaidEditor>` (split source↔preview authoring), `<DiagramViewer>` (read-only, SSR-safe), `<DiagramPreview>` (pan/zoom) — over an engine-free `core/`.
- **Rebuild the in-document block** to a code-block-style header with an **eye/pencil view/edit `ToggleGroup`**, reusing the surface's preview + source components; remove the `<textarea>`.
- Compose **100% from `@zeroxsolutions/ui`** at variants + tokens; confine the only bespoke code to the pan/zoom transform viewport (sanctioned by `ui-primitive-fidelity`).
- Keep the engine hidden (lazy, no type leak) and add **no new dependency**.

**Non-Goals:**

- Non-mermaid engines, visual/node drag editing (text-first), collaboration, an advanced config-JSON panel.
- Mermaid **syntax highlighting** in the pane — v1 is plain text; a grammar is Phase 2.
- Moving `code-editor` from `@zeroxsolutions/ui` into `shared/code-mirror/` — that stays the reserved `code` surface's work; the pane is consumed from `@zeroxsolutions/ui` today.

## Decisions

### D1 — A new `mermaid/` surface, honest to its engine

Add `packages/editor/src/mermaid/` as a sibling to `document/` and the reserved `code/`. Named `mermaid/` (the engine), matching the user's choice over a generic `diagram/`. Layout:

```
mermaid/
├─ core/                       engine-free logic
│  ├─ engine.ts     lazy seam: import('mermaid') → render(source, themeVars) → { svg } | { error, line? }
│  ├─ detect.ts     source → DiagramType (first keyword: graph/sequenceDiagram/classDiagram/…)
│  ├─ templates.ts  starter source per DiagramType
│  ├─ export.ts     copy source · copy SVG · download SVG · SVG→canvas→PNG
│  └─ types.ts      DiagramType · MermaidRenderResult · MermaidEditorProps · ExportKind
├─ react/
│  ├─ editor.tsx    <MermaidEditor>   — toolbar + source + preview (surface)
│  ├─ viewer.tsx    <DiagramViewer>   — read-only, SSR-safe (pre fallback)
│  ├─ preview.tsx   <DiagramPreview>  — bespoke pan/zoom viewport around the SVG
│  ├─ toolbar.tsx   <MermaidToolbar>  — type/template · theme · zoom · export
│  └─ use-mermaid-render.ts           — debounced render, keep-last-good, error state
└─ index.ts         doc-only barrel (per-file ./* map; each file is its own subpath entry)
```

Public subpaths: `@zeroxsolutions/editor/mermaid/react/editor`, `.../react/viewer`, `.../core/index`, matching how `document/react/*` is imported.

### D2 — `<MermaidEditor>` is controlled exactly like `CodeEditorPane`

`{ value?, defaultValue?, onValueChange?, readOnly?, layout?: 'split'|'tabs'|'auto', toolbar?: boolean, className? }`. Mirroring the code pane's contract lets the document block wire `attrs.source ↔ updateAttrs({ source })` with no adapter. `layout="auto"` chooses `resizable` split ≥ md and `tabs` < md (via `use-mobile`). `className` is external layout only (`ui-primitive-fidelity`).

### D3 — Render model: debounced, keep-last-good (`use-mermaid-render`)

Debounce source (~250 ms) → lazy `import('mermaid')` → `initialize` with the active theme's `variant.mermaid` (`theme` name + `themeVariables`) → `render`. Stable diagram id via `useId()` (no `Math.random`/`Date.now`, as the current feature already does); unmount cancel guard. On success, replace the good SVG; on failure, **retain the last good SVG** and set an error (message + line when Mermaid supplies it). Empty source → empty state. This is the shared render path for both the surface and the block (spec `mermaid-document-block`: one rendering path).

### D4 — Pan/zoom is the single bespoke surface

`<DiagramPreview>` is a `position: relative; overflow: hidden` viewport holding a `transform: translate(x,y) scale(k)` inner node wrapping the SVG. Pan = pointer-drag on empty space (pointer math from `lib/resize-drag.ts`); zoom = wheel + − / + controls, zoom-to-cursor, clamp ~0.1–8×; fit = SVG bbox vs viewport → center + scale; reset = k=1, centered. Only the transform viewport is raw; every control over/around it (`toolbar-button`, `button-group`, zoom badge) is a design-system component on tokens. This is the `ui-primitive-fidelity` sanctioned bespoke positioning shell (a surface the design system cannot express), not a re-skin of any shipped component.

### D5 — The in-document block: code-block-style header + eye/pencil toggle

Rebuild `features/mermaid` `MermaidView` to the sibling `code-block` header idiom, plus the user's eye/pencil control:

- **Header** (shared view/edit, like code-block): left = diagram-type identity (`Workflow`/`◇` icon + label); when editable it becomes a **diagram-type picker** (`dropdown-menu`/`select`), the exact parallel to code-block's language label→picker. Right = a single-select **`ToggleGroup`** `[ Eye | PencilLine ]` (view/edit) + a ghost `icon-xs` copy control (the same `CopyButton` shape code-block uses).
- **Body** driven by the toggle: Eye → `<DiagramPreview>`; Pencil → `CodeEditorPane` bound to `source`, with the non-destructive error strip. The `<textarea>` is deleted.
- Wrapped `contentEditable={false}` + `stopPropagation` on pointer/mousedown (as `code-block`/`image` do) so editing never moves ProseMirror selection.
- **View/edit is local React view-state**, never persisted; `source` stays the only attr; the fenced ` ```mermaid ` codec, slash item, and command are unchanged (spec: no document-data change).
- **Insert** (`/mermaid`) opens in edit (pencil) + focus. **Read-only** editor renders the diagram with no pencil (shared header, edit control hidden — mirroring how code-block drops the language *picker* when not editable).
- **Error at rest** shows a compact recoverable `Alert`/`Empty` with an "edit to fix" affordance, not a red `<pre>`.

The block is a **compact composition** of the same `core/` + `DiagramPreview` + `CodeEditorPane` + `use-mermaid-render`; it does not embed the full surface toolbar. One rendering path, one editing path, two chromes.

### D6 — Theme rides `shared/theme`

The diagram consumes the active editor theme's `variant.mermaid` (already wired: `theme` + `themeVariables`, selected per light/dark). The surface's theme control maps to Mermaid's built-in themes; `.dark` flips CSS tokens for the surrounding chrome. No foreign palette.

### D7 — Export via `core/export.ts`

Pure helpers over the rendered SVG string: copy source (clipboard), copy SVG, download SVG (blob), download PNG (SVG → `<canvas>` → `toBlob`, with a scale factor for DPI). Surface toolbar exposes them through `split-button` + `dropdown-menu`; results are reported via `sonner`. No new dependency — the browser `<canvas>` rasterizes.

### D8 — Source pane is plain text in v1

Shiki in this repo ships no `mermaid` grammar; `CodeEditorPane` runs with `language` omitted (plain text) so nothing is fabricated. A mermaid TextMate grammar is a clean Phase-2 add behind the same pane, no surface change.

### D9 — Testing and visual verification

Co-located Vitest specs for `core/` (detect, templates, export shape) and the block's toggle/serialization invariants (source-only attr, codec round-trip). Render + pan/zoom are **visual/DOM** and cannot be measured in jsdom — verify via storybook-static + Playwright (memory: verify visual bugs in a real browser). Storybook stories: surface Default/Controlled/ReadOnly-viewer/Error/each-diagram-type/Dark/Narrow-tabs, and the block's Eye/Pencil states.

## Risks / Trade-offs

- **Bespoke pan/zoom is the one non-DS surface.** Mitigated by confining it to a transform viewport (all controls remain DS) and reusing `lib/resize-drag.ts`; it needs real-browser tests, not jsdom. Accepted — the design system ships no canvas.
- **Rebuilding the block changes its interaction model** (textarea → header + toggle). The document data (schema/codec) is untouched, so it is behavior-compatible, not a data migration; existing ````mermaid` documents render unchanged.
- **Surface and block sharing** means the `core/` + preview render path is on the critical path for two consumers; a regression hits both. Mitigated by one shared, tested render hook.
- **PNG fidelity** (fonts/foreignObject in SVG→canvas) can vary by browser; documented, with copy/download-SVG as the lossless paths.
- **Public contract** (`MermaidEditorProps`, `DiagramViewer` props) is SemVer-stable once shipped; keep it minimal and code-pane-shaped.

## State Model

- **View/edit (block)**: `read-only-view` (editor not editable) · `view` (eye) · `edit` (pencil). Local view-state; default `view`, except a freshly inserted block starts in `edit`.
- **Render (shared)**: `idle → rendering → rendered(good)` and `rendering → error(keep last good)`; empty source → `empty`. Debounced on source change; cancel on unmount.
- **Preview transform**: `{ x, y, k }` with `fit` and `reset` as computed resets; independent of render state.

## Migration Plan

- **Additive**: new `mermaid/*` subpaths ship as a SemVer **minor**; nothing else consumes them yet.
- **Block rebuild in place**: replace `MermaidView`'s body/affordance; keep node name, `source` attr, codec, slash, command. No document migration — existing serialized diagrams round-trip identically.
- **Phase 2 (later)**: mermaid syntax grammar in the pane; advanced config panel; optional promotion of the block's editor into the full surface (a "pop out" into a `sheet`).

## Open Questions

- Read-only viewer: keep the minimal header (type label + copy) for consistency with code-block, or render a headerless clean figure? (Leaning: keep the minimal header, pencil hidden.)
- Which Mermaid diagram types ship starter templates in v1 vs. later (leaning: flowchart, sequence, class, state, ER, gantt, pie, mindmap, gitGraph).
- Inline preview pan/zoom parity: does the in-document block get the full pan/zoom, or a lighter fit-to-width with click-to-zoom, reserving full pan/zoom for the standalone surface?
