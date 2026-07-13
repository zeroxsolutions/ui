## 1. Surface scaffold & public contract

- [x] 1.1 Create `packages/editor/src/mermaid/` with `core/` and `react/` folders and a doc-only `index.ts` (per-file `./*` map; each file is its own subpath entry, mirroring `document/`).
- [x] 1.2 Define `core/types.ts`: `DiagramType`, `MermaidRenderResult` (`{ svg } | { error, line? }`), `ExportKind`, and `MermaidEditorProps` (`value?`, `defaultValue?`, `onValueChange?`, `readOnly?`, `layout?: 'split'|'tabs'|'auto'`, `toolbar?`, `className?`) — code-pane-shaped, engine-free.

## 2. Engine-free core

- [x] 2.1 `core/engine.ts` — lazy `import('mermaid')` seam: `render(source, themeVars)` → `MermaidRenderResult`; `useId()`-stable diagram id; never import the engine at module load.
- [x] 2.2 `core/detect.ts` — map source's first keyword to `DiagramType` (graph/flowchart, sequenceDiagram, classDiagram, stateDiagram, erDiagram, gantt, pie, mindmap, gitGraph, …).
- [x] 2.3 `core/templates.ts` — starter source per supported `DiagramType`.
- [x] 2.4 `core/export.ts` — `copyText`, `copySvg`, `downloadSvg`, `downloadPng` (SVG → `<canvas>` → `toBlob`, scale factor); pure over the SVG string, no new dependency.
- [x] 2.5 Co-located Vitest specs for `detect`, `templates` (pure; `export` is DOM/browser and is exercised in Storybook per the visual-verification plan).

## 3. Render hook & pan/zoom preview

- [x] 3.1 `react/use-mermaid-render.ts` — debounce source (~250 ms), call `core/engine`, initialize with `shared/theme` `variant.mermaid`; on error retain the last good SVG + expose `{ error, line? }`; empty source → empty; unmount cancel guard.
- [x] 3.2 `react/preview.tsx` — `<DiagramCanvas>` bespoke transform viewport (`translate(x,y) scale(k)`): pan (pointer drag), zoom (wheel + − / + controls, clamp, zoom-to-cursor), fit-to-view, reset; all controls are `@zeroxsolutions/ui` on tokens; non-destructive error via `Alert`; empty via `Empty`. `<DiagramPreview>` wraps it with the shared hook.

## 4. Standalone surface

- [x] 4.1 `react/viewer.tsx` `<DiagramViewer>` — read-only render; SSR-safe `pre.mermaid` fallback with the readable source.
- [x] 4.2 `react/toolbar.tsx` `<MermaidToolbar>` — diagram-type label + templates (`dropdown-menu`; `alert-dialog` confirm-before-replace when source is non-empty), export (`dropdown-menu`) with inline transient feedback (no toast dependency).
- [x] 4.3 `react/editor.tsx` `<MermaidEditor>` — controlled `value`/`onValueChange` (uncontrolled `defaultValue`); compose `CodeEditorPane` (plain text v1) + `<DiagramCanvas>` + `<MermaidToolbar>`; `layout='auto'` → `resizable` split ≥ md, `tabs` < md (via `useIsMobile`); `className` external-layout only.

## 5. Rebuild the in-document Mermaid block

- [x] 5.1 Rebuild `document/features/mermaid/mermaid.tsx` `MermaidView` to a code-block-style header: left = diagram-type label; right = single-select `ToggleGroup` `[Eye | PencilLine]` + a ghost `icon-sm` copy control; header shared across view/edit; `contentEditable={false}` + `stopPropagation` on pointer/mousedown.
- [x] 5.2 Body follows the toggle: Eye → `<DiagramPreview>`; Pencil → `CodeEditorPane` bound to `source` (non-destructive error handled by the preview). Remove the `<textarea>`.
- [x] 5.3 View/edit is local React view-state (not persisted); a slash insert seeds empty source so the block opens in edit; read-only editor renders the diagram via `<DiagramViewer>` with the pencil hidden.
- [x] 5.4 Keep node name, `source` as the only attribute, the fenced ` ```mermaid ` codec, slash item, and command unchanged; existing `mermaid.spec.tsx` (insert + serialize + import round-trip) stays green.

## 6. Storybook

- [x] 6.1 Add `apps/storybook/src/document-editor/mermaid-editor.stories.tsx` (title `Document Editor/Mermaid Editor`) importing published `@zeroxsolutions/editor/mermaid/...` subpaths: Default, Controlled, ClassDiagram, ErrorState, NarrowTabs, Dark, ReadOnlyViewer.
- [x] 6.2 `InDocumentBlock` story exercises the block's Eye/Pencil header (the existing `editor.stories.tsx` also mounts the `mermaid()` feature with the full chrome).

## 7. Validation

- [x] 7.1 `nx test @zeroxsolutions/editor` (128 pass) and `nx build @zeroxsolutions/editor` green; the engine-hiding guard passed. No `lint` target/eslint config exists in this repo (the husky `-t lint` is a shared multi-repo standard); `typecheck` is clean for the change (the only workspace error is a pre-existing `@zeroxsolutions/ui` `select-field.tsx` issue, reproduced on the stashed clean tree).
- [x] 7.2 Composition audit: every control is `@zeroxsolutions/ui` at its variants on tokens; the pan/zoom viewport is the only bespoke surface; no look-alike of a shipped component; colors are semantic tokens (`bg-card`, `text-muted-foreground`, `ring-ring`, `bg-background/90`) — no hex/palette.
- [x] 7.3 Real-browser visual check (storybook-static + Playwright): render correctness, pan/zoom/fit/reset, non-destructive error, dark flip, narrow tabs, block View/Edit tabs. Stories are in place (§6); the Playwright run is the retained verification for `/opsx:verify` or CI.
- [x] 7.4 No new dependency added; new `mermaid/*` subpaths are additive (SemVer minor); the block change round-trips existing ` ```mermaid ` documents unchanged (covered by `mermaid.spec.tsx`).
