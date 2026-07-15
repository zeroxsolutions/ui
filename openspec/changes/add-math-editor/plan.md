## Scope

Build the `packages/editor/src/math/` KaTeX authoring surface and rebuild the in-document math
node view (block + inline) to compose it, plus the additive LaTeX Shiki grammar. Covers the whole
change; the node contract (single `latex` attr, three codecs) is held constant.

## Covers

Tasks `1.1`-`1.3`, `2.1`-`2.5`, `3.1`-`3.6`, `4.1`-`4.4`, `5.1`-`5.2`, `6.1`-`6.4`. Validation
Focus: codec round-trip unchanged; live preview; `Alert`/`Empty`; inline `InputGroup`; palette
insert-at-caret; no JS KaTeX-CSS import; real-browser check.

## Plan Type

full

Cross-module (editor surface + node view + shared highlighter + storybook), and validation-
intensive (visual UI requiring a real-browser check).

## Execution Strategy

tdd-preferred

Logic-first: unit-test `render.ts` / `templates.ts` / `symbols.ts` / `useMathRender` before wiring
UI; the existing codec round-trip spec is the standing regression.

## Ordered Steps

1. Wire LaTeX highlighting: add `@shikijs/langs/latex`, register the loader + `tex` alias in
   `shared/code-mirror/code-syntax.ts`; confirm no JS import of the KaTeX stylesheet exists.
2. Build `math/core` (types -> render -> templates -> symbols -> export) with unit tests for the
   render seam (ok + never-throws) and template caret offsets.
3. Build `math/react`: `useMathRender` (state machine + last-good retention), then `FormulaRender`/
   `FormulaPreview` (`Alert`/`Empty`), `FormulaViewer`, `MathPalette` (`Popover`+`Command`),
   `MathToolbar`, and the standalone `MathEditor`.
4. Rebuild the block node view (`Disclosure`/`Tabs` + preview + palette + collapse `keepMounted`;
   read-only `Card` + `FormulaViewer`); rebuild the inline node view (`Popover` + `InputGroup` +
   one-line preview). Remove the raw `<textarea>`/`<input>`. Keep codecs/commands/feature id intact.
5. Add `insertMathInline` to the slash menu; add the standalone story and extend the document story.
6. Validate: unit + codec specs green, `nx run-many -t lint build test` green, real-browser check,
   rule-audit the diff.

## Validation Per Step

1. A LaTeX string highlights in `CodeMirrorPane`; `grep` finds no `import 'katex/dist/katex.min.css'`.
2. `nx test @zeroxsolutions/editor` covers render ok/error and template caret math; types carry no
   KaTeX type.
3. Storybook renders `MathEditor`: editing updates the preview; invalid keeps last-good with an
   `Alert`; empty shows `Empty`; palette inserts at caret and stays open.
4. In the document editor: block View/Edit toggle + collapse works without a render teardown; inline
   edits in-flow; document JSON only changes on `latex` edits; the codec round-trip spec stays green.
5. Slash shows both math entries; stories render inline + block.
6. All three gate targets green; browser check measured on the open state; audit recorded.

## Files / Owners

- `packages/ui/src/lib/shiki.ts` (latex grammar loader + `tex` alias; owns the language set)
- `packages/editor/src/math/core/{types,render,templates,symbols,export,index}.ts` (+ specs)
- `packages/editor/src/math/react/{use-math-render.ts,preview,viewer,palette,toolbar,editor}.tsx`,
  `react/index.ts`, `math/index.ts`
- `packages/editor/src/document/features/math/math.tsx` (node views; codecs unchanged)
- `packages/editor/src/document/ui/slash-menu.*` or the math feature's `slash` entry (inline entry)
- `apps/storybook/src/math-editor/math-editor.stories.tsx`; `apps/storybook/src/document-editor/*`
- `packages/editor/src/styles.css` (confirm the existing KaTeX `@import`; no code change expected)

## Completion Checkpoint

The math node authors via the shared `Disclosure`/`Tabs` chrome (block) and `Popover`/`InputGroup`
(inline) with a live KaTeX preview and a working palette; no raw `<textarea>`/`<input>` remains;
the read-only and export paths render the real formula; the `latex` attribute and all three codecs
are unchanged with the round-trip spec green; `nx run-many -t lint build test` is green.

## Completion Verification

Because Verification Mode is retained-required, record a verification note (e.g.
`openspec/changes/add-math-editor/verification.md`) with: the real-browser evidence (storybook-
static driven headless, open-state exercised, layout measured) for block + inline editing, live
preview updates, palette insert-at-caret, and the `Alert`/`Empty` states; the green
`nx run-many -t lint build test` output; and the grep proving no JS KaTeX-CSS import. Do not report
the change complete on build+test green alone (`dont-claim-done-on-ui-without-browser`).

## Delegation Units

- Optional: an implementer subagent may own steps 2-4 as one surface unit; it self-loads
  `.agents/rules/*` and the framework skills. Write results back into `tasks.md` (check boxes) and
  the verification note. Keep the brief a pointer to these artifacts, not embedded rules.

## Execution Notes

<!-- apply-time observations appended here -->

## Manual Adjustments

<!-- Open decision to confirm: the `Formula*` artifact noun (design.md D5). -->
