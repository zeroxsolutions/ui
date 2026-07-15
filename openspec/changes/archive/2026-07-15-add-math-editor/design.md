## Context

`@zeroxsolutions/editor` already renders KaTeX (the `math` feature: `mathInline` + `mathBlock`
atom nodes, a synchronous `katex.renderToString` view, and the `$…$` / `$$…$$` / `data-latex`
codecs). Its authoring UI predates the design-system chrome: click-to-edit swaps the render for
a raw `<textarea>`/`<input>` with no live preview, no palette, and no readable error.

The sibling block features have since converged. `code-block` composes the shared
`@zeroxsolutions/ui` `Disclosure` chrome over the in-package `CodeMirrorPane`; `mermaid` was
promoted to a full `packages/editor/src/mermaid/` surface — `core/` (engine-free logic: render
seam, templates, detect, export, types) and `react/` (`useMermaidRender`, `DiagramCanvas`/
`DiagramPreview`, `DiagramViewer`, `MermaidToolbar`, standalone `MermaidEditor`) — with a thin
in-document node view that composes `Disclosure` + `Tabs`. Math is the last block on bespoke
chrome. This change mirrors the mermaid surface for math, adapting to how KaTeX differs.

## Goals / Non-Goals

**Goals:**

- A `packages/editor/src/math/` surface mirroring `mermaid/`, exporting a standalone
  `MathEditor`, `FormulaPreview`/`FormulaViewer`, and the palette.
- An in-document math node view that composes the shared `Disclosure`/`Tabs` chrome (block) and
  a `Popover` + `InputGroup` (inline), reusing the surface's render/preview path.
- A symbol/template palette (`Popover` + `Command`) that inserts LaTeX at the caret.
- LaTeX-highlighted source via an additive Shiki `latex` grammar in `shared/code-mirror`.
- Zero contract drift: single `latex` attribute, codecs and round-trip tests unchanged.

**Non-Goals:**

- No `@zeroxsolutions/ui` component change (only the additive `latex` grammar loader).
- No `remark-math` two-way Markdown, no `$…$` input-rule auto-conversion, no equation numbering
  or MathML editing mode.
- No inline<->block node-type conversion UI.

## Decisions

### D1. Mirror the mermaid surface, thin node view on top

The unit is a surface (`math/core` + `math/react`) plus a thin `document/features/math/` node
view — exactly the mermaid shape (see `bounded-context-transport-agnostic` analog for the
editor, and the `mermaid-editor-surface` / `mermaid-document-block` specs). The heavy authoring
UI lives in the surface; the node view only composes it inside `Disclosure`.

```
packages/editor/src/math/
  index.ts                     doc-only barrel note (mirror mermaid/index.ts)
  core/
    index.ts
    types.ts       MathRenderResult {ok,html}|{ok:false,error}; MathRenderConfig {displayMode,color};
                   MathSymbol {label,latex,preview}; MathSymbolGroup; MathTemplate {label,latex,caretOffset?};
                   MathEditorProps; MathEditorLayout
    render.ts      renderMath(latex, cfg) -> MathRenderResult, never throws (wraps katex, throwOnError:true)
    templates.ts   DEFAULT_MATH_SOURCE + MATH_TEMPLATES + templateFor
    symbols.ts     SYMBOL_GROUPS: Greek | Operators | Relations | Delimiters | Arrows
    export.ts      copyLatex, copyMathML
  react/
    use-math-render.ts   useMathRender(source) -> MathRenderState (color from variant.math)
    preview.tsx    FormulaRender (presentational, takes state) + FormulaPreview (self-contained)
    viewer.tsx     FormulaViewer (read-only, renders the real formula)
    palette.tsx    MathPalette (Popover + Command)
    toolbar.tsx    MathToolbar (DisclosureHeader parts: label + export)
    editor.tsx     MathEditor (Disclosure muted + toolbar + Resizable split | Tabs)

packages/editor/src/document/features/math/math.tsx   node view (block + inline) + codecs + math()
packages/ui/src/lib/shiki.ts   + latex grammar loader + tex alias (additive; owns the language set)
```

### D2. KaTeX is synchronous and SSR-safe — five deliberate divergences from mermaid

KaTeX is not a heavy async engine like mermaid; that changes five things (each is an intentional
adaptation, not a pattern violation):

| # | Mermaid | Math | Why |
| - | ------- | ---- | --- |
| 1 | lazy `import()` engine, async, debounced | `render.ts` calls `katex` synchronously; debounce optional | KaTeX renders sync on server + client |
| 2 | `DiagramViewer` SSR-fallbacks to `CodeBlock` | `FormulaViewer` renders the real formula on first paint | KaTeX needs no live DOM |
| 3 | `toReact` export = source in `CodeBlock` | `toReact` = the rendered formula | export shows the formula, not source |
| 4 | `DiagramCanvas` pan/zoom = the one bespoke surface | no bespoke surface at all | a formula is static; DS `Card`/muted box suffices |
| 5 | title slot = type-detecting `Combobox` | title = static "Math" label; palette is the star | math has no "type"; value is symbol insertion |

Divergence 4 makes math *cleaner* than mermaid against `ui-primitive-fidelity`: it introduces no
coordinate-anchored surface. The render seam (`render.ts`) still returns a discriminated result
and the hook retains the last good render, mirroring mermaid's non-destructive error behavior.

### D3. Inline vs block hosts

- **Block** (`mathBlock`): `Disclosure variant="muted"` + `Tabs` (View/Edit). View = `FormulaPreview`;
  Edit = `CodeMirrorPane` (`language="latex"`) + a live `FormulaPreview` strip so the render is
  visible while typing (a small, justified extension of mermaid's View/Edit — you cannot read a
  formula from its LaTeX). Header = math label + View/Edit `TabsList` + `CopyButton` + collapse
  `DisclosureTrigger`, keeping the render mounted on collapse (`keepMounted`, the mermaid
  `removeChild` lesson).
- **Inline** (`mathInline`): cannot host a `Disclosure` in the text flow, so it stays click-to-edit
  into a `Popover` (DOM-anchored, focus-owning — a legitimate design-system overlay, unlike the
  bespoke `FloatingShell` used only for non-focus caret menus) holding an `InputGroup`
  (`InputGroupInput` + `InputGroupAddon` for palette/commit/cancel) and a one-line preview. This
  is the single honest divergence between the two nodes.

### D4. Palette = `Popover` + `Command` (stay-open), not a hand-rolled grid or a pick-one Combobox

The palette is a searchable, grouped inserter. It composes the shipped `Command` inside a
`Popover` (`CommandInput` search, `CommandGroup` per category, `CommandItem` per entry) — two
shipped components composed, the same way `Combobox` itself is built, so it is not hand-rolled
markup (respecting `use-shipped-combobox-for-searchable-picker`). It is deliberately not a
`Combobox`: a palette inserts many entries in succession and stays open, whereas `Combobox` is
pick-one-and-close. Templates (`\frac{}{}`, matrix, cases) carry a `caretOffset` so insertion
lands the caret in the first hole.

### D5. Naming — two nouns: `Math*` (process/surface) + `Formula*` (artifact)

Mermaid split `Mermaid*` (engine/process) from `Diagram*` (artifact) to avoid `MermaidView`
(node) colliding with a `MermaidViewer` (surface). Math has the same collision (`MathView` node
vs a read-only viewer), so it mirrors the split: `Math*` for process/surface, `Formula*` for the
rendered artifact. Existing vocabulary is preserved (`math()`, `mathInline`/`mathBlock`,
`MathTheme`, `variant.math`, `MathView`).

| Role | mermaid | math |
| ---- | ------- | ---- |
| Render fn / result | `renderDiagram` / `MermaidRenderResult` | `renderMath` / `MathRenderResult` |
| Hook / state | `useMermaidRender` / `MermaidRenderState` | `useMathRender` / `MathRenderState` |
| Templates | `DIAGRAM_TEMPLATES` / `DEFAULT_DIAGRAM_SOURCE` / `DiagramTemplate` | `MATH_TEMPLATES` / `DEFAULT_MATH_SOURCE` / `MathTemplate` |
| Symbols | — | `SYMBOL_GROUPS` / `MathSymbol` / `MathSymbolGroup` |
| Preview / viewer | `DiagramPreview` / `DiagramViewer` | `FormulaPreview` / `FormulaViewer` |
| Toolbar / editor | `MermaidToolbar` / `MermaidEditor` | `MathToolbar` / `MathEditor` |
| Node / codec / feature | `MermaidView` / `mermaidCodec` / `mermaid()` | `MathView` / `mathInlineCodec` + `mathBlockCodec` / `math()` |

Files stay kebab, concise-concern (not backend role-suffix), per `naming-files-and-symbols` and
the mermaid precedent.

### D6. Style — tokens, markers, KaTeX CSS, ASCII

- Design-system tokens only (`bg-muted/50`, `text-muted-foreground`, `text-destructive`,
  `bg-card`, `ring-ring`); no raw color, no `dark:`; `cn()` for conditional classes; `gap` not
  `space-*`; `size-*` when equal; `className` for layout only (shadcn `styling.md`).
- `data-slot` markers consistent with the repo: `data-slot="formula-preview"`,
  `data-slot="formula-viewer"`, `data-slot="math-editor"`; keep `data-math` / `data-math-inline`
  / `data-math-block` on the node/codec.
- KaTeX color from `variant.math`. The KaTeX stylesheet stays a CSS `@import` in `styles.css`
  (already present) — never a JS side-effect import (breaks the bundling contract; the current
  `math.tsx` JSDoc already warns this).
- Authored source (comments, JSDoc, UI labels) is plain ASCII per `plain-ascii-typography`
  (`...` not an ellipsis glyph). The math glyphs in `symbols.ts` (`α`, `∑`, `∫`, `→`) are
  *content* (the `preview` field), like i18n strings — kept as exact Unicode; the `latex` field
  (`\alpha`, `\sum`) is ASCII.

### D7. Base UI specifics

`render={<Button/>}` for custom triggers (not `asChild`); `nativeButton={false}` when a trigger
renders a non-button (`PopoverTrigger render={<InputGroupAddon/>}`); `ToggleGroup` default/value
are arrays; never a manual `z-index` on `Popover`/`Command` overlays (shadcn `base-vs-radix.md`,
`styling.md`).

### D8. LaTeX highlighting

Add a `latex` grammar loader (`@shikijs/langs/latex`) plus a `tex` alias to the Shiki language set
in `packages/ui/src/lib/shiki.ts` — the highlighter `shared/code-mirror` reuses owns the
`LANG_LOADERS`/`LANG_ALIASES`, so that is where the entry belongs. The grammar already ships via
`shiki` (no dependency to add). Absent the entry, the pane degrades to plain mono (still
bracket-matched and token-themed) — so this is additive, not a prerequisite. It is a grammar
addition, not a `@zeroxsolutions/ui` component change.

## Risks / Trade-offs

- **Live preview on every keystroke.** KaTeX is sync and cheap, so the block Edit tab can render
  on each edit; if a pathological formula is slow, the hook can debounce like mermaid. Low risk.
- **Two nodes, one surface.** Inline diverges (Popover + InputGroup) from block (Disclosure).
  Accepted: inline flow genuinely cannot host block chrome; both still share the render/preview
  path, so behavior stays consistent.
- **`Command` as a stay-open palette.** `Command` is usually pick-and-close; keeping it open for
  repeated inserts is a small behavioral extension. Mitigated by composing shipped components
  (not new markup) and documenting the intent in `editor-math-composition`.
- **New `Formula*` noun.** Introduces a second noun into the codebase. Justified by the exact
  precedent (`Diagram*`) and the `MathView`/viewer collision it prevents.

## State Model

- **Block render** (`useMathRender`): `idle` -> `rendering` -> `ok` | `error` | `empty`. On
  `error`, the last `ok` markup is retained and an `Alert` is shown; `empty` shows `Empty`.
- **Block view mode** (local, not persisted): `view` (eye) | `edit` (pencil). A freshly inserted
  empty block opens on `edit`; an existing formula opens on `view`.
- **Block collapse** (local, not persisted): `expanded` | `collapsed`; the active panel is kept
  mounted (hidden) while collapsed.
- **Inline** (local): `closed` (rendered) | `editing` (popover open). Enter/commit writes `latex`;
  Escape cancels.
- **Document data**: only `latex` is ever persisted; view/edit, collapse, and popover state are
  never written to the document.

## Migration Plan

- Replace the `document/features/math/` node view in place; the feature id, node names, commands,
  slash entries, and all three codecs are untouched, so existing documents render unchanged and
  the serialization round-trip tests stay green.
- Add `insertMathInline` to the slash menu (the command already exists) so inline math is
  discoverable alongside the block.
- Add `apps/storybook/src/math-editor/math-editor.stories.tsx` for the standalone surface; extend
  the document-editor story with inline/block node demos.
- Ship behind no flag — it is a UI upgrade to an existing feature with an unchanged contract.

## Open Questions

- Should the block Edit tab show the live preview inline (below the source) or only under the View
  tab? Design leans inline-below-source for math (you cannot read a formula from LaTeX); revisit
  if it crowds narrow widths.
- Symbol catalog breadth for v1 (a curated common set vs an exhaustive one) — start curated,
  grow from usage.
