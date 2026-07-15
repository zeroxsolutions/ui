## 1. Setup: LaTeX highlighting + dependency

- [x] 1.1 Confirm the `latex` grammar already ships via `shiki`'s `@shikijs/langs` (v4.2.0 has `latex.mjs`) — no install needed
- [x] 1.2 Register a `latex` grammar loader (+ `tex` alias) in `packages/ui/src/lib/shiki.ts` (where `LANG_LOADERS`/`LANG_ALIASES` live); a LaTeX `language="latex"` now highlights in `CodeMirrorPane`
- [x] 1.3 Confirmed `styles.css` keeps the KaTeX `@import` (line 23); confirmed no module JS-imports `katex/dist/katex.min.css`

## 2. `math/core` — engine-free logic (unit-tested off-runtime)

- [x] 2.1 `core/types.ts`: `MathRenderResult`, `MathRenderConfig`, `MathSymbol`, `MathSymbolGroup`, `MathTemplate`, `MathEditorProps`, `MathEditorLayout` (KaTeX type never in a public signature)
- [x] 2.2 `core/render.ts`: `renderMath(latex, cfg)` (throwOnError:true -> discriminated result, never throws) + lenient `renderMathHtml` for viewer/export; unit test ok + error paths
- [x] 2.3 `core/templates.ts`: `MATH_TEMPLATES` (fraction, sqrt, matrix, cases, limit), `DEFAULT_MATH_SOURCE`, `templateFor`; templates carry `caretOffset`; unit test
- [x] 2.4 `core/symbols.ts`: `SYMBOL_GROUPS` (Greek, Operators, Relations, Delimiters, Arrows) as `{ label, latex, preview }`; ASCII `latex`, Unicode `preview` as content
- [x] 2.5 `core/export.ts`: `copyLatex`, `copyMathML` (best-effort clipboard); `core/index.ts` barrel

## 3. `math/react` — components (compose `@zeroxsolutions/ui`)

- [x] 3.1 `react/use-math-render.ts`: `useMathRender(source)` -> `MathRenderState` (ok/error/empty; sync, no idle/rendering), retains last good render, color from `variant.math`
- [x] 3.2 `react/preview.tsx`: `FormulaRender` (presentational, takes state) + `FormulaPreview` (self-contained); `Alert` on error, `Empty` when empty; `data-slot="formula-preview"`; no bespoke surface
- [x] 3.3 `react/viewer.tsx`: `FormulaViewer` renders the real formula (SSR-safe); `data-slot="formula-viewer"`
- [x] 3.4 `react/palette.tsx`: `MathPalette` = `Popover` + `Command` (grouped `CommandGroup`, searchable `CommandInput`), inserts LaTeX at the caret, stays open across inserts
- [x] 3.5 `react/toolbar.tsx`: `MathToolbar` filling `DisclosureHeader` parts (math label + export menu)
- [x] 3.6 `react/editor.tsx`: standalone `MathEditor` = `Disclosure` muted + toolbar + `Resizable` split / `Tabs`, controlled/uncontrolled value contract; `react/index.ts`; `math/index.ts` doc-only note

## 4. In-document node view (`document/features/math/`)

- [x] 4.1 Rebuild the `mathBlock` view: `Disclosure`/`Tabs` (View/Edit) reusing `FormulaPreview` + `CodeMirrorPane` + palette; `CopyButton` + collapse (`keepMounted`); read-only = `Card` + `FormulaViewer`; removed the raw `<textarea>`
- [x] 4.2 Rebuild the `mathInline` view: click-to-edit into a `Popover` + `InputGroup` (input + palette/commit/cancel addons) + one-line `FormulaPreview`; removed the raw `<input>`
- [x] 4.3 Fresh insert opens in edit mode with the source focused; commit writes `latex`; view/edit + collapse stay local view-state (never persisted)
- [x] 4.4 Kept `mathInlineCodec` / `mathBlockCodec`, `mathAttrs`, commands, and feature id unchanged; `toReact` renders the real formula

## 5. Discovery + stories

- [x] 5.1 Added `insertMathInline` to the slash menu (a `math-inline` entry) alongside `insertMathBlock`
- [x] 5.2 `apps/storybook/src/math-editor/math-editor.stories.tsx` for the standalone `MathEditor`

## 6. Validation

- [x] 6.1 Unit tests green for `core/*` (render/templates/symbols) and the render hook; the math codec round-trip spec unchanged and green (editor 227 passed)
- [x] 6.2 `nx run-many -t build test` green across all 4 projects (`lint` target does not exist — repo `linter: none`); caught + fixed a real drift-test failure in `@zeroxsolutions/ui` (see verification.md)
- [x] 6.3 Real-browser check (storybook + Playwright chromium): 9/9 checks pass — KaTeX renders, block header + palette (51 items) + search, inline Popover+InputGroup, Alert/Empty states; screenshots captured
- [x] 6.4 Rule-audited the diff: thin node view, DS composition only, tokens-only (no raw color/`dark:`), ASCII source (glyphs confined to `symbols.ts` `preview`), no JS KaTeX-CSS import, `Math*`/`Formula*` naming, per-file `./*` exports
