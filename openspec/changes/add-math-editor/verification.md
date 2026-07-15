# Verification - add-math-editor

Verification Mode: **retained-required** (visual UI change). Evidence below.

## Code-level gate (green)

- `pnpm nx run-many -t build test` (no cache): **Successfully ran build + test for 4 projects.**
  - `@zeroxsolutions/editor`: 227 tests passed (39 files) - includes new `core/render.spec`,
    `core/templates.spec`, `core/symbols.spec`, and the **existing `math.spec.tsx` (6) unchanged
    and green** - the `$$…$$` / `$…$` / `data-latex` codec round-trip is intact.
  - `@zeroxsolutions/ui`: 188 passed. `@zeroxsolutions/icons` + `@zeroxsolutions/fluent-emoji`: 1467 passed.
- Typecheck: green (real coverage for the React files, which vitest only transpiles when imported).
- `lint`: **no target** - the repo has `linter: "none"` in `nx.json`, no `@nx/eslint`, no
  `eslint.config.*`. The `green-before-commit` gate here is build + test + typecheck; audited style
  manually instead (see below).

### A real failure caught and fixed

Adding the `latex` grammar to `packages/ui/src/lib/shiki.ts` broke the ui invariant test
`language-switcher.spec.tsx > "stays in sync with the highlighter language set (no drift)"`
(`CODE_LANGUAGE_OPTION_IDS` must equal `CODE_LANGUAGE_IDS`). Fixed by adding the matching
`{ id: "latex", label: "LaTeX", Icon: TexIcon }` option to `language-switcher-data.tsx`
(`@zeroxsolutions/icons/material/tex`). This is a necessary, additive consequence of extending the
shared highlighter's language set (a LaTeX code block is now a selectable language too). The
subagent had run only the editor test and missed this; running the ui test caught it.

## Real-browser check (Playwright chromium against storybook dev)

Drove `apps/storybook` (dev server) with Playwright chromium (`scratchpad/verify-math.mjs`).
**9/9 checks passed** - the checks discriminate (they assert concrete elements, not just page load):

| Check | Result |
| --- | --- |
| Standalone `MathEditor` renders real KaTeX (`.katex` present) | PASS |
| Error state shows a design-system `Alert` (last-good retained) | PASS |
| Empty state shows the `Empty` component ("No formula yet") | PASS |
| In-document block renders KaTeX + the `Disclosure` "Math" header | PASS |
| Block palette (Omega Insert) opens with 51 command items | PASS |
| Block palette has the search input | PASS |
| Inline math renders KaTeX in the text flow | PASS |
| Inline click opens a `Popover` with the LaTeX `InputGroup` input | PASS |

Screenshots (scratchpad): `05-block-palette.png` shows the `Disclosure` header (Sigma Math label,
View/Edit tabs, copy, collapse), the CodeMirror source with **LaTeX syntax highlighting**
(`\frac`/`\pm`/`\sqrt` colored - confirms the Task-1 grammar), the `Popover`+`Command` palette
(search + grouped Greek symbols with glyph/label/command), and the live KaTeX preview of the
quadratic formula. `07-inline-editing.png` shows the inline formula editing in a `Popover` +
`InputGroup` (input + Omega/commit/cancel addons) with a one-line live preview.

## Rule audit (manual, `green-before-commit`)

- Thin node view composing the `math/` surface; heavy render/preview/palette live in the surface.
- Design-system composition only (`Disclosure`, `Tabs`, `Card`, `Alert`, `Empty`, `InputGroup`,
  `Popover`, `Command`, `CopyButton`, `Separator`); no bespoke surface introduced.
- Tokens only - no raw color, no `dark:`; KaTeX color via `variant.math` on the container.
- Plain-ASCII source; the only non-ASCII is the math glyphs in `symbols.ts` `preview` (content).
- No JS side-effect import of `katex/dist/katex.min.css` (grep clean); the CSS `@import` in
  `styles.css` remains.
- Naming `Math*` (process) + `Formula*` (artifact); per-file `./*` subpath exports, no root barrel.
- Worked on `master`; not committed (commit only on request).

## Known minor items (non-blocking)

- The block-Edit palette and the standalone CodeMirror pane **append** the inserted snippet
  (CodeMirror exposes no imperative caret API); the inline native input inserts at the caret with
  `caretOffset`. Documented in `math.tsx` / `editor.tsx`.
- `renderMath` (throwOnError:true, authoring) vs `renderMathHtml` (throwOnError:false, viewer/
  export) - a deliberate two-function seam (design.md deviation notes).
