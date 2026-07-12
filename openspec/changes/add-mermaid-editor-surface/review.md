## Readiness Decision

ready with conditions — scope, capabilities, and design are settled; the Open Questions in `design.md` have documented default leanings and are not blockers. Proceed, resolving those defaults during implementation.

## Execution Mode

tdd-preferred — the repo gates on `lint build test` before commit (`green-before-commit`); write co-located Vitest specs alongside `core/` and the block invariants. Purely-visual behavior (render, pan/zoom, dark) is verified in a real browser rather than forced into jsdom.

## Verification Mode

retained-recommended — keep Storybook stories + a storybook-static/Playwright check as the retained visual verification for render, pan/zoom, error state, dark mode, and the block's eye/pencil states.

## Debug Mode

standard

## Review Status

not-requested

## Delegation Mode

subagent-eligible — `core/` (engine seam, detect, templates, export), the `react/` surface, and the block rebuild are separable briefs pointing at these artifacts.

## Parallelization Mode

parallel-eligible — `core/` and Storybook scaffolding can proceed alongside the surface; the block rebuild depends on `core/` + `DiagramPreview` + `use-mermaid-render` and should follow them.

## Worktree Mode

worktree-eligible — a single feature change adding files under `packages/editor` and editing one existing feature; it runs **no** nx generator and touches no shared root config, so it does not contend on the scaffolding surface.

## Branch Finish Mode

standard

## Blocked By

none

## Validation Focus

- `nx build @zeroxsolutions/editor` passes the **engine-hiding build guard** (no engine type leaks in public `.d.ts`; `mermaid` stays lazy, never imported at module load).
- `nx lint @zeroxsolutions/editor` and `nx test @zeroxsolutions/editor` green; no inline `eslint-disable` without a stated reason.
- **Codec/schema invariant**: the block keeps `source` as its only attribute; the fenced ` ```mermaid ` Markdown/HTML round-trip and SSR `toReact` are unchanged (round-trip test).
- **Composition audit** (`ui-from-design-system` + `ui-primitive-fidelity`): every control composes `@zeroxsolutions/ui` at its variants on tokens; the pan/zoom transform viewport is the only bespoke surface; no hand-rolled look-alike of a shipped component; no hardcoded hex/palette color.
- **Visual (real browser)**: render correctness, pan/zoom/fit/reset, non-destructive error, dark-mode flip, narrow (tabbed) layout — via storybook-static + Playwright, not jsdom.
- **No new dependency** added; new subpaths are additive (SemVer minor).

## Key Risks

- **Bespoke pan/zoom** is the sole non-design-system surface; it must be verified in a real browser and kept to a transform viewport (all controls remain design-system). Risk: drift into a second hand-styled UI — audit against `ui-primitive-fidelity`.
- **Shared render path** (`core/` + `DiagramPreview` + `use-mermaid-render`) serves both the surface and the block, so a regression hits both consumers — cover it with tests once.
- **PNG export fidelity** (fonts/foreignObject through SVG→canvas) varies by browser; keep copy/download-SVG as the lossless paths and document the caveat.
- **Block interaction change** (textarea → header + eye/pencil) must not alter document data; guard with the round-trip test above.

## Findings Summary

No prior review findings — this is the initial readiness gate.
