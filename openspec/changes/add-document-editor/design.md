## Context

`@zeroxsolutions/ui` is a shadcn + Base UI + Tailwind v4 design system that already ships most of an editor's chrome (`command`, `popover`, `dropdown-menu`, `tooltip`, `bubble`, `toolbar-button`, `emoji-picker`, CodeMirror `code-editor-pane`) plus `remark-gfm` and Shiki. It has no block-based document editor. This change adds one as a new package, `@zeroxsolutions/editor`, built on Tiptap/ProseMirror as a hidden engine with all chrome composed from `@zeroxsolutions/ui`.

The library build in this workspace emits one entry per source file (dist mirrors src) and externalizes every declared dependency, which is exactly what the ProseMirror single-instance requirement needs: the engine is a plain internal `dependency`, deduped by the consumer, never installed twice.

Licensing was verified against Tiptap's June 2025 release notes: core, StarterKit, drag-handle, details/toggle, mathematics, table-of-contents, and other formerly-Pro extensions are MIT. Only Cloud/Platform features (collaboration hosting, comments, AI, DOCX conversion, `node-range`) are paid — none are required for L1–L3.

## Goals / Non-Goals

**Goals:**

- One publishable package hosting an **editor family with surfaces**; deliver the `document` (rich-text) surface, reserve `code` for later.
- Hide the engine **absolutely** from both app consumers and third-party feature authors, via a declarative `defineFeature`; a single opt-in `advanced` escape is the only engine leak.
- JSON source-of-truth with a **per-node codec registry** serving export, static Viewer, and two-way import/Migrate.
- **Delta-first** change model behind a swappable `IDocumentBackend`; default emits engine steps, interface admits Yjs.
- Zod-validated attributes/args/import **at boundaries only**.
- Two Viewers (static SSR-safe + read-only live) and an **engine-agnostic** theming layer.

**Non-Goals:**

- The `code` surface implementation, a Yjs collaboration backend, comments/AI/version-history/DOCX, and paid `node-range` multi-block selection. Interfaces leave room; no implementation here.

## Decisions

### D1 — Surfaces in one package; namespace reserves `code`

Structure: `shared/` (cross-surface: `code-mirror/`, `theme/`), `document/` (this change), `code/` (reserved). Exports follow the workspace's **per-file `./*` map** (as in `@zeroxsolutions/ui`), so files land at natural subpaths (`@zeroxsolutions/editor/document/...`, `.../theme`, `.../advanced`) with **no hand-maintained mapping**; the future `code` surface slots in under its own folder without a breaking rename.

```
packages/editor/src/
├── shared/{code-mirror/, theme/}            # reused by every surface
├── document/
│   ├── core/{types/, builder, facade, feature-compiler, registry, document-backend/}
│   ├── features/{heading,list,task,toggle,callout,quote,divider,image,link,
│   │             highlight,color,mention,embed,table,code-block,mermaid,math}/
│   ├── serialize/{serializer, deserializer, markdown/, html/, react-renderer}
│   ├── ui/{bubble-menu, slash-menu, drag-handle-menu, floating-menu, link-editor, toolbar}
│   └── react/{editor, viewer, viewer-live}
├── code/           # [Phase 2] reserved
└── migrate/{migrator, sources/}
```

### D2 — Hidden engine, declarative feature API, single escape

Only `document/core/` imports the engine. Consumers see `IEditor`; feature authors see `defineFeature`. Declarative features import only `@zeroxsolutions/editor`, so the engine stays hidden even from extenders and no second ProseMirror instance is introduced. The lone leak is `@zeroxsolutions/editor/advanced` (raw plugins/extensions), documented unstable / outside SemVer. Thinnest spot: node schema (`content` expression, DOM parse) — a controlled vocabulary covers common cases; the long tail falls to `advanced`.

Hiding is a **type-level** property — decoupling so a later engine swap does not ripple into consumer code — **not** access control. It therefore does **not** depend on the exports map: the per-file `./*` map is fine as long as each file's **public signatures stay engine-free**. We do not narrow exports to "lock down" internals.

```ts
interface EditorFeature {
  id: string; dependsOn?: string[];
  nodes?: NodeSpec[]; marks?: MarkSpec[];
  commands?: Record<string, { args?: ZodType; run(e: IEditor, a?): boolean }>;
  inputRules?: InputRuleSpec[]; shortcuts?: Record<string, string>;
  codecs?: NodeCodec[];                                  // per-node, both directions
  slash?: SlashItem[]; toolbar?: ToolbarItem[]; blockMenu?: BlockMenuItem[];
  advanced?: { prosePlugins?: unknown[]; tiptapExtensions?: unknown[] }; // only engine leak
}
interface NodeSpec<A extends ZodType = ZodType> {
  name: string; group: 'block' | 'inline';
  content?: 'text*' | 'block+' | 'inline*' | 'empty';
  atom?: boolean; draggable?: boolean;
  attrs?: A;                                             // Zod schema →
  render(p: NodeViewProps<z.infer<A>>): ReactNode;       // type inferred, validated, defaulted
}
interface NodeViewProps<A> {
  attrs: A; updateAttrs(patch: Partial<A>): void;
  selected: boolean; editor: IEditor; deleteNode(): void; children?: ReactNode;
}
```

### D3 — Per-node codec registry (export + import + viewer)

Serialization knowledge lives with each feature; a generic walker delegates. The same registry powers export (Markdown/HTML), the static Viewer (`toReact`), and import. `render` (interactive view) and `toReact` (static view) are separate but may share a component.

```ts
interface NodeCodec<A = unknown> {
  node: string;
  toMarkdown?(n, ctx): string; toHTML?(n, ctx): string; toReact?(n, ctx): ReactNode;
  fromMarkdown?(tok, ctx): NodeJSON<A> | null; fromHTML?(el, ctx): NodeJSON<A> | null;
  fallback?: Partial<Record<Format, 'skip' | 'children' | 'text'>>;
}
```

### D4 — Markdown import via the token path (A)

Markdown import runs `remark`/`remark-gfm` → tokens → per-node `fromMarkdown`, so custom blocks (callout/mermaid) reconstruct rather than being lost. HTML import reuses ProseMirror's DOM parser (features contribute parse rules). Produced nodes are Zod-gated; import returns `{ doc, warnings[], dropped[] }`.

For blocks with no standard-Markdown form the codec uses an **extended dialect for round-trip** (research-confirmed against how Notion itself does it — see D9): callouts as **GitHub Alerts** (`> [!NOTE]`, degrading gracefully to a plain blockquote outside GitHub); toggles/mentions (and Phase-2 columns) as **Notion-flavored-style tags with an HTML fallback**. Standard blocks (text/heading/list/code/table/math) round-trip as GFM.

### D5 — Delta-first backend, default engine-steps, Yjs-ready

`IDocumentBackend` emits step-sized deltas per edit plus debounced/on-demand snapshots. Default `PmStepsBackend` needs no extra deps. A future `YjsBackend` (Phase 2) makes deltas compact CRDT updates and unlocks collaboration, with no façade/feature change.

### D6 — Validate at boundaries, trust the interior

Zod runs at import, remote deltas, consumer API calls, and dev-time feature registration. Internally-generated edits from already-validated commands are not re-validated per keystroke, keeping large-document editing cheap.

### D7 — Engine-agnostic theme + CodeMirror seam

`IEditorTheme` carries prose, code (Shiki + CodeMirror), Mermaid, and KaTeX tokens keyed light/dark; `EditorThemeProvider` wraps `next-themes`. Code-bearing blocks (code-block, mermaid source) render through an internal `CodeMirrorPane` seam that today delegates to `@zeroxsolutions/ui`'s `code-editor-pane` and later swaps to the in-package `shared/code-mirror/` when the `code` surface lands — with no feature edits.

### D8 — Heavy features are lazy

Mermaid, KaTeX, Shiki, and tables dynamic-import their heavy dependencies so a minimal editor stays small; each heavy feature is its own subpath entry to enable code-splitting.

### D9 — JSON is canonical; Markdown fidelity is dialect-dependent (as Notion does it)

Research confirmed Notion keeps **block-JSON as the lossless source of truth** and offers an **extended "Notion-flavored / Enhanced Markdown"** for high-fidelity round-trips, while its plain Markdown export is lossy (callouts → blockquote/HTML, toggles flatten). Our architecture is the same split: JSON is canonical; Markdown is a derived, **dialect-dependent** view (D4). This resolves the earlier "Markdown is lossy" framing — vanilla CommonMark cannot express these blocks, but an extended dialect can, which is exactly what we adopt.

## Risks / Trade-offs

- **Building a framework, not a wrapper.** Absolute hiding + extensibility means owning `defineFeature`, the feature compiler, the façade, and a rich enough primitive layer — the heaviest part of the package. Trade-off accepted for a Tiptap-free plugin ecosystem.
- **Schema abstraction is leaky at the edges.** ProseMirror `content`/DOM-parse concepts cannot be fully hidden cheaply; the controlled vocabulary + `advanced` fallback is a deliberate, bounded leak.
- **Markdown is lossy in vanilla CommonMark for engine-only blocks** (callout/columns/caption). Mitigated with an extended dialect (GitHub Alerts for callouts, Notion-flavored tags/HTML for structural blocks — D4/D9) and per-codec fallbacks; JSON and HTML remain the high-fidelity paths. Non-GitHub renderers show alerts as plain blockquotes (graceful degradation).
- **Stable public contract is hard to change.** `IEditor`, `EditorFeature`, `NodeSpec`, `NodeCodec`, `IDocumentBackend`, `IEditorTheme`, `ImportResult` are SemVer-stable once third parties depend on them; they need careful first design. `advanced` is explicitly exempt.
- **ProseMirror single-instance** depends on the engine staying an internal `dependency`; the `advanced` escape used from an external package reintroduces the risk (documented).

## State Model

**Editor instance:** `building → ready → destroyed`. Features register during `building`; commands/subscriptions are valid only in `ready`.

**Change model per edit:** `edit → delta emitted` (immediate, step-sized) and, on a settling burst, `→ snapshot emitted` (debounced). Snapshots are also produced on demand. Deltas and snapshots are independent streams.

**Import:** `parse (tokens/DOM) → per-node map → Zod gate → { accepted → doc | rejected → warnings/dropped }`. The document only ever contains validated nodes.

## Migration Plan

- **Phase 1 (this change):** `document` surface, L1–L3 blocks, serialization (export + import path A), both Viewers, theming, Migrate reporting, default step backend. Scaffold via nx generator; Storybook stories; co-located specs; `*-e2e` where applicable.
- **Phase 2 (later changes):** move `code-editor` from `@zeroxsolutions/ui` into `shared/code-mirror/` behind the existing `CodeMirrorPane` seam and expose the `code` surface; add the `YjsBackend` + collaboration (L4/L5); optionally comments/AI/DOCX on the same interfaces.
- No data migration: the package is additive; nothing consumes it yet.

## Resolved Questions

- **Export granularity** → per-file `./*` map like `@zeroxsolutions/ui`; hiding is type-level (D2), not an exports concern. No curated/wildcard map.
- **Columns/layout** → deferred to Phase 2 (see Migration Plan / Non-Goals).
- **Extended-Markdown dialect** → GitHub Alerts (`> [!NOTE]`) for callouts; Notion-flavored tags + HTML fallback for structural blocks (D4/D9).

## Open Questions

- **Which heavy features ship enabled by default** in the `starter` bundle vs opt-in subpaths (leaning: L1-light default; table/code-block/mermaid/math/image opt-in for code-splitting).
