## Scope

Implement the `mermaid/` surface (`core/` + `react/`) in `@zeroxsolutions/editor` and rebuild the in-document Mermaid block onto a code-block-style header with an eye/pencil view/edit toggle, plus Storybook coverage and green validation.

## Covers

`1.1`–`1.2`, `2.1`–`2.5`, `3.1`–`3.2`, `4.1`–`4.3`, `5.1`–`5.4`, `6.1`–`6.2`, `7.1`–`7.4`; Validation Focus: engine-hiding guard, codec/schema invariant, composition audit, real-browser visual, no-new-dependency/additive-subpath.

## Plan Type

full — cross-module (new surface + existing feature rebuild + storybook), visual-verification-intensive, with a shared render path serving two consumers.

## Execution Strategy

tdd-preferred — unit-test `core/` and the block's serialization/toggle invariants first; visual behavior is proven in a real browser (storybook-static + Playwright), not jsdom.

## Ordered Steps

1. Scaffold `mermaid/{core,react}` + `index.ts`; write `core/types.ts` (engine-free contract). Add failing Vitest specs for `detect`/`templates`/`export`.
2. Implement `core/engine.ts` (lazy seam), `core/detect.ts`, `core/templates.ts`, `core/export.ts` until the `core` specs pass.
3. Implement `react/use-mermaid-render.ts` (debounced, keep-last-good, theme from `variant.mermaid`) and `react/preview.tsx` `<DiagramPreview>` (bespoke pan/zoom transform viewport, all controls design-system).
4. Implement `react/viewer.tsx`, `react/toolbar.tsx`, then `react/editor.tsx` `<MermaidEditor>` (controlled contract, `layout='auto'` split/tabs).
5. Rebuild `document/features/mermaid/mermaid.tsx`: code-block-style header + eye/pencil `ToggleGroup` + copy; body follows the toggle (`DiagramPreview` / `CodeEditorPane`); remove the `<textarea>`; local view-state; insert→edit+focus; read-only hides pencil; recoverable error at rest. Keep node name, `source` attr, codec, slash, command unchanged.
6. Add Storybook stories for the surface (Default/Controlled/ReadOnly/Error/each type/Dark/Narrow) and the block (Eye/Pencil/read-only/error).
7. Run lint/test/build; run the storybook-static + Playwright visual checks; run the composition + invariant audits.

## Validation Per Step

1. `nx test @zeroxsolutions/editor` shows the new `core` specs present and failing (red).
2. The `core` specs pass; `mermaid` is not imported at module load (grep/build guard).
3. `use-mermaid-render` retains the last good SVG on a bad edit (spec); `<DiagramPreview>` pans/zooms/fits/resets in a Storybook story (browser).
4. `<MermaidEditor>` honors controlled `value`/`onValueChange`; narrow width switches to tabs; `<DiagramViewer>` SSR fallback emits `pre.mermaid`.
5. Block round-trip test: document JSON only changes on `source` edits; ` ```mermaid ` Markdown/HTML round-trips unchanged; toggling view/edit does not mutate the document; `<textarea>` is gone.
6. Stories render for every listed state in light and dark.
7. `nx lint/test/build @zeroxsolutions/editor` green + engine-hiding guard passes; Playwright checks pass; audits clean.

## Files / Owners

- `packages/editor/src/mermaid/core/{types,engine,detect,templates,export}.ts` (+ specs)
- `packages/editor/src/mermaid/react/{use-mermaid-render,preview,viewer,toolbar,editor}.tsx`
- `packages/editor/src/mermaid/index.ts`
- `packages/editor/src/document/features/mermaid/mermaid.tsx` (+ spec)
- `apps/storybook/src/document-editor/mermaid-editor.stories.tsx`

## Completion Checkpoint

All `tasks.md` items checked; `nx lint build test @zeroxsolutions/editor` green with the engine-hiding guard passing; the block's document-data invariant proven by test; the composition audit clean (only the pan/zoom viewport bespoke, no hardcoded colors, no look-alikes); no new dependency; new `mermaid/*` subpaths additive (SemVer minor).

## Completion Verification

Verification Mode is retained-recommended: retain Storybook stories as living coverage and a storybook-static + Playwright run proving render correctness, pan/zoom/fit/reset, non-destructive error, dark-mode flip, narrow (tabbed) layout, and the block's eye/pencil states. Record the outcome as a companion `verification.md` note.

## Delegation Units

- **core** — `mermaid/core/*` (+ specs); owns the engine seam, detection, templates, export; writeback: tasks 2.x.
- **surface** — `mermaid/react/*`; owns `use-mermaid-render`, preview (pan/zoom), viewer, toolbar, editor; writeback: tasks 3.x–4.x.
- **block** — `document/features/mermaid/mermaid.tsx` (+ spec); owns the header/eye-pencil rebuild; depends on core + surface; writeback: tasks 5.x.
- **stories** — `apps/storybook/...`; writeback: tasks 6.x. Integration owner reconciles all four into `tasks.md`/validation.

## Parallel Units

`core` and `stories` scaffolding may run alongside early `surface` work; `surface` (preview + render hook) must land before `block`. `block` is serial after `surface`.

## Isolation Boundaries

`core` edits only `mermaid/core/**`; `surface` only `mermaid/react/**`; `block` only `document/features/mermaid/**`; `stories` only `apps/storybook/**`. No unit edits shared root config or another unit's files; validation is per-package `nx` targets.

## Execution Notes

<!-- append transient observations here -->
