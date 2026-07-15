## Readiness Decision

ready with conditions

The design is complete and mirrors the shipped `mermaid` surface, so the pattern is proven.
Conditions before/while implementing:
- Confirm the `Formula*` artifact noun (the one open naming decision in `design.md` D5).
- Verify component APIs against the project's `base-vega` / Base UI via `npx shadcn@latest docs
  input-group command popover toggle-group tabs` before authoring (per the shadcn skill workflow).
- Confirm `@shikijs/langs/latex` is a real grammar in the installed Shiki before wiring the loader.

## Execution Mode

tdd-preferred

Pure logic (`render.ts`, `templates.ts`, `symbols.ts`, `useMathRender` state) is unit-testable
off-runtime (vitest); the codec round-trip is already covered and must stay green. UI composition
is verified in the browser (see Verification Mode).

## Verification Mode

retained-required

This is a visual UI change; build+test green is not "done". The rendered block/inline editors,
the live preview, the palette insertion, and the error/empty states MUST be verified in a real
browser (storybook-static driven by a headless browser, measuring actual layout) before the work
is reported complete. A closed-state screenshot is hollow for popover/command content — exercise
the open state.

## Debug Mode

standard

## Review Status

not-requested

## Delegation Mode

subagent-eligible

The implementer subagent may build the surface; it self-loads `.agents/rules/*` and the framework
skills. Keep the brief lean: point it at these artifacts.

## Parallelization Mode

serial-only

The scaffolding (new files, the `@shikijs/langs/latex` install touching the lockfile) is shared-
config work and must not run concurrently with other scaffolding (`worktree-per-task`). The work
itself is a single cohesive surface.

## Worktree Mode

same-tree

Work on `master` directly, per the user's instruction and the `work-on-master-directly` memory;
do not create a branch/worktree unprompted. Commit only when asked (`commit-conventions`).

## Branch Finish Mode

standard

## Blocked By

none

## Validation Focus

- The `$$…$$` / `$…$` / `data-latex` codec round-trip tests stay green and unchanged (contract
  intact) — `editor-serialization`.
- Editing a block shows source + a live KaTeX render that updates on edit; invalid keeps the last
  good render with an `Alert`; empty shows `Empty`.
- The palette inserts LaTeX at the caret; a template lands the caret in its first hole; search
  filters entries.
- Inline math edits in a `Popover` + `InputGroup` in the text flow; surrounding text is unchanged.
- No raw `<textarea>`/`<input>` remains in the math node view.
- The read-only viewer and `toReact` render the real formula (KaTeX sync/SSR-safe).
- Build guard / grep confirms no JS side-effect import of `katex/dist/katex.min.css`; the CSS
  `@import` in `styles.css` remains.
- `nx run-many -t lint build test` green.

## Key Risks

- Live-preview-on-keystroke performance for pathological formulas (mitigation: debounce in the
  hook like mermaid).
- Inline node diverging from the block chrome (accepted: text-flow constraint; render path shared).
- `Command` used as a stay-open insert palette rather than pick-one (mitigation: compose shipped
  components, document intent in `editor-math-composition`).
- Icon/label ASCII vs the math glyphs being legitimate Unicode content in `symbols.ts` — keep the
  `plain-ascii-typography` content/typography distinction straight.
