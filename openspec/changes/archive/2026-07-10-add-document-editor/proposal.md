## Why

`@zeroxsolutions/ui` already ships the chrome a rich document editor needs — `command` (cmdk), `popover`, `dropdown-menu`, `tooltip`, `bubble`, `toolbar-button`, `emoji-picker`, and a CodeMirror `code-editor-pane` — but there is no editor that composes them into a Notion-style, block-based writing surface. Product surfaces that need long-form, structured content (docs, notes, knowledge pages) currently have nowhere to turn inside the SDK.

We want a **headless-core, house-chrome** editor: Tiptap/ProseMirror as the hidden engine, every visible control built from `@zeroxsolutions/ui` (no competing UI library, per `ui-from-design-system`). It must be **extensible by third parties without ever exposing Tiptap**, store content as **JSON (source of truth)** with HTML/Markdown as pluggable serializers, emit **small deltas** (not full-document snapshots) so large documents stay cheap to persist, and ship a **read-only Viewer** plus a **themeable** surface. The architecture must also leave a clean seam for a future **code-editor surface** (CodeMirror) and future **real-time collaboration** (Yjs) without a rewrite.

## What Changes

- Introduce a new publishable package **`@zeroxsolutions/editor`** (one package), scaffolded via the nx generator, depending on `@zeroxsolutions/ui`.
- Structure it as an **editor family with surfaces**: this change delivers the **`document`** surface (rich-text); the folder/exports namespace reserves **`code`** for a later surface.
- Deliver a **declarative feature API** (`defineFeature`) that hides Tiptap behind the SDK's own vocabulary; node attributes, command args, and codec output are validated with **Zod 4** at trust boundaries only.
- Deliver a **per-node codec registry** that serves export (Markdown/HTML), the static Viewer (React), and two-way **import/Migrate** (Markdown via token path, HTML via ProseMirror DOM parsing) with a reported, non-silent import result.
- Deliver an **`IDocumentBackend`** change model whose default emits ProseMirror-step deltas + debounced snapshots; the interface admits a future Yjs backend.
- Deliver two **Viewers** — a static, SSR-safe React renderer and a read-only live editor — and an **engine-agnostic theming** layer (default theme + `EditorThemeProvider`) driving prose, code (Shiki/CodeMirror), Mermaid, and KaTeX in light/dark.
- Deliver the **L1–L3 block set**: text/marks, headings, lists (bullet/ordered/task), toggle, quote, callout, divider, image, link, table, code-block (Shiki), Mermaid, and math (KaTeX), plus slash menu, bubble menu, floating "+", and drag-handle block controls.

## Success Criteria

- A consumer composes an editor via `createEditor().use(...).build()` and renders `<Editor/>`; **no `@tiptap/*` type appears in the package's public `.d.ts`** except under the explicitly-unstable `advanced` entry.
- A third party authors a new block (e.g. a diagram) with `defineFeature` importing **only** `@zeroxsolutions/editor` — no direct Tiptap dependency, no second ProseMirror instance.
- `onDelta` payloads for a single edit are **step-sized**, not full-document; a debounced snapshot provides recovery checkpoints.
- Round-trips: JSON↔JSON lossless; JSON→HTML→JSON near-lossless; Markdown **import preserves custom blocks** (callout/columns/mermaid) via the token path; import returns `{ doc, warnings[], dropped[] }` and never silently corrupts the document (Zod-gated).
- The static Viewer renders stored JSON **without instantiating ProseMirror** and is importable server-side.
- Light/dark toggles prose, code, Mermaid, and math themes from one `IEditorTheme`.
- `lint`, `build`, and `test` are green across the workspace; each new project carries its co-located specs and (where applicable) its `*-e2e` sibling.

## Non-Goals

- The **`code` editor surface** (CodeMirror as a standalone surface) — reserved in structure, delivered in a later change.
- A **Yjs collaboration backend** and presence cursors (L5) — the `IDocumentBackend` interface leaves room; no implementation here.
- **Comments, Content AI, version history, and DOCX/ODT conversion** (Tiptap paid or bespoke) — out of scope; may be added later on the same interfaces.
- **Multi-block range selection** built on the paid `node-range` extension.
- Migrating the existing `code-editor`/`code-editor-pane` out of `@zeroxsolutions/ui` — the document surface consumes them via an internal seam for now.

## Capabilities

### New Capabilities

- `document-editor-core`: the hidden-engine façade (`IEditor`), the `createEditor` builder, per-invocation composition, the command layer, and the `IDocumentBackend` delta/snapshot change model (default ProseMirror-steps).
- `editor-feature-api`: the declarative `defineFeature` contract — `NodeSpec`/`MarkSpec`, `NodeViewProps`, Zod-schema attributes and command args, UI contributions (slash/toolbar/block-menu), and the single `advanced` engine-escape.
- `editor-serialization`: the per-node codec registry — export to Markdown/HTML/React, two-way import (Markdown token path, HTML DOM path), and the reported, Zod-gated Migrate result.
- `editor-viewer`: the static SSR-safe React Viewer and the read-only live-editor Viewer, both driven by the same feature registry.
- `editor-theming`: the engine-agnostic `IEditorTheme`, the shipped default theme, and `EditorThemeProvider` synchronizing prose/code/Mermaid/math across light and dark.

### Modified Capabilities

<!-- None — this repo has no existing specs under openspec/specs/. -->

## Impact

- **New package**: `packages/editor` (`@zeroxsolutions/editor`), ESM, per-file `./*` subpath exports mirroring `dist/` (as in `@zeroxsolutions/ui`; engine hiding is type-level, not an exports concern), declarations emitted, released via Nx Release + SemVer (`lib-public-exports-and-semver`).
- **New dependencies** (catalog-pinned per `house-libs-catalog-scope`): `@tiptap/*` (core + StarterKit + MIT extensions incl. drag-handle, details, mathematics), `prosemirror-*` (deduped single instance — externalized in the lib build), `zod` (4.x), `remark`/`remark-gfm` (already present in `@ui`), `mermaid` (lazy), `katex` (lazy), Shiki (present), and `yjs`/`y-prosemirror` reserved for Phase 2.
- **Depends on** `@zeroxsolutions/ui` (regular `dependency`) for all chrome and the CodeMirror seam.
- **Public contract**: `IEditor`, `EditorFeature`/`defineFeature`, `NodeSpec`/`MarkSpec`/`NodeViewProps`, `NodeCodec`/`MarkCodec`, `IDocumentBackend`, `IEditorTheme`, and `ImportResult` become the SemVer-stable surface; `@zeroxsolutions/editor/advanced` is explicitly unstable.
- **Licensing**: L1–L3 use only MIT Tiptap packages; no paid Tiptap Cloud/Pro dependency is introduced.
- **Storybook**: stories added for `<Editor/>`, `<Viewer/>`, and representative feature blocks in `apps/storybook`.
