## Why

`@zeroxsolutions/editor` already renders KaTeX math (the `math` feature: `mathInline` +
`mathBlock` nodes, the `$…$` / `$$…$$` / `data-latex` codecs). What it lacks is an
authoring experience. Clicking a formula swaps the render for a raw `<textarea>`/`<input>`:
no live preview while typing, no symbol/template palette, no readable parse-error, and a
hand-rolled input that predates the design-system chrome.

Meanwhile the sibling block features have converged on one pattern. `code-block` and
`mermaid` now compose the shared `Disclosure` chrome, and `mermaid` was promoted to a full
`packages/editor/src/mermaid/` surface (`core/` engine-free logic + `react/` components) with
a standalone `MermaidEditor`, a `DiagramViewer`, and a thin in-document node view. Math is the
last block still on bespoke chrome. This change brings math onto that same pattern: a real
KaTeX authoring surface that mirrors mermaid, adapted to how KaTeX actually differs.

## What Changes

- Add a `packages/editor/src/math/` surface mirroring `mermaid/`: `core/` (render seam,
  templates, symbols, types, export) and `react/` (`useMathRender` hook, `FormulaPreview`,
  `FormulaViewer`, `MathPalette`, `MathToolbar`, standalone `MathEditor`).
- Rebuild the in-document math node view (`document/features/math/`) to compose the shared
  `Disclosure` chrome with a live preview and the palette, replacing the raw textarea/input.
  Inline math keeps its in-flow affordance via a `Popover` + `InputGroup`.
- Add a `latex` grammar to the in-package Shiki highlighter (`shared/code-mirror`) so the
  LaTeX source pane is syntax-highlighted.
- Keep the node contract unchanged: single `latex` attribute, and the `$…$` / `$$…$$` /
  `data-latex` codecs round-trip exactly as before.

## Success Criteria

- Editing a math block shows the LaTeX source (in the design-system code pane, LaTeX-highlighted)
  and a live KaTeX render together; the render updates as the source changes.
- A symbol/template palette inserts LaTeX at the caret (Greek, operators, relations,
  delimiters, arrows; fraction/sqrt/matrix/cases/limit templates).
- An invalid formula keeps the last good render and shows a design-system `Alert`; an empty
  formula shows a design-system `Empty` state.
- Inline and block math are both authorable; inline uses a `Popover` + `InputGroup`, block
  uses the `Disclosure`/`Tabs` chrome — no raw `<textarea>`/`<input>` remains.
- The standalone `MathEditor` reads identically to `MermaidEditor` (shared `Disclosure`,
  responsive split/tabs) and is importable at `@zeroxsolutions/editor/math/react/editor`.
- The read-only viewer and the static `toReact` export render the real formula (KaTeX is
  synchronous and SSR-safe), not a source fallback.
- `nx run-many -t lint build test` is green; the math codec round-trip tests are unchanged.

## Non-Goals

- No change to the wire contract: the `latex` attribute and all three codecs stay as-is; no
  new persisted attribute (display/inline stays the node type, not an attr).
- No two-way Markdown parsing for math (still needs `remark-math`) and no `$…$` input-rule
  auto-conversion — declined as before.
- No math linting, equation numbering, or a MathML editing mode.
- No design-system (`@zeroxsolutions/ui`) component changes; the only cross-package edit is the
  additive `latex` Shiki grammar loader.
- No node-type conversion UI between inline and block (separate insert commands remain).

## Capabilities

### New Capabilities

- `math-editor-surface`: the standalone `packages/editor/src/math/` KaTeX authoring surface —
  `MathEditor` (source pane + live preview), `FormulaPreview`/`FormulaViewer`, the
  symbol/template palette, the sync SSR-safe render seam, theme-driven color, and export.
- `math-document-block`: the in-document math node (inline + block) upgraded to compose the
  shared `Disclosure`/`Tabs` chrome with a live preview and palette, replacing the raw
  textarea/input, while keeping the single `latex` attribute and the codecs unchanged.
- `editor-math-composition`: how the math surfaces compose the house design system — the
  shared `Disclosure` header, the `Card` container, `Alert`/`Empty` states, the inline
  `Popover` + `InputGroup`, and the `Popover` + `Command` palette — with no bespoke chrome
  (math has no pan/zoom canvas, so it introduces no bespoke surface at all).

### Modified Capabilities

<!-- None. This change is additive: no existing spec's requirements change. The existing math
     codecs (editor-serialization) and theme contract (editor-theming, variant.math) are reused
     as-is; the latex Shiki grammar is an additive loader, not a requirement change. -->

## Impact

- **New surface:** `packages/editor/src/math/{core,react}/**` (engine-free logic + React).
- **Rebuilt:** `packages/editor/src/document/features/math/**` (node view now composes the
  surface; codecs + feature registration unchanged).
- **Additive edit:** `packages/editor/src/shared/code-mirror` reuses `@zeroxsolutions/ui`'s
  Shiki highlighter (`ui/lib/shiki.ts`), which owns the language set — so the `latex` grammar
  loader (+ `tex` alias) is one additive entry in `packages/ui/src/lib/shiki.ts`. This is a
  grammar addition, not a component change (no `@zeroxsolutions/ui` component is touched).
- **Dependency:** none to add — the `latex` grammar already ships with the installed
  `@shikijs/langs` (transitively via `shiki`), exactly like the existing per-language loaders.
  `katex` is already a dependency; its stylesheet stays a CSS `@import` in `styles.css` (never a
  JS side-effect import).
- **Stories:** `apps/storybook/src/math-editor/math-editor.stories.tsx` for the standalone
  surface; inline/block node demos extend the document-editor story.
- **Reused unchanged:** `Disclosure`, `Tabs`, `Card`, `Alert`, `Empty`, `InputGroup`,
  `Command`, `Popover`, `Separator`, `CopyButton`, `Resizable`, `CodeMirrorPane`,
  `shared/theme` `variant.math`.
