## Readiness Decision

ready

## Execution Mode

standard

The implementation already exists in `packages/editor/src/document/features/mermaid/mermaid.tsx` and has been verified in a real browser. Apply is a governance catch-up: confirm the code matches the spec and the verification, mark tasks, then re-run the gate.

## Verification Mode

retained-required

The load-bearing behavior is the crash-safety of collapse over the `dangerouslySetInnerHTML` SVG. Verification must be an interaction test in a real browser (jsdom cannot exercise the SVG lifecycle or the `removeChild` path): collapse/expand repeatedly while the diagram shows, across view/edit tab switches, asserting zero page errors.

## Debug Mode

standard

## Review Status

not-requested

## Delegation Mode

single-agent

## Parallelization Mode

serial-only

## Worktree Mode

same-tree

Repo convention is to work directly on `master`; this is a single-file node-view change.

## Blocked By

none

## Validation Focus

- Collapse/expand keeps the diagram render mounted — no `removeChild`, no page errors — across repeated toggles and view/edit switches (the crash-safe requirement).
- Header controls read consistently with the code block: View/Edit tabs 36px, copy + collapse chevron paired at 32px.
- Read-only viewer path is untouched (no header, no collapse).
- Node schema, `source` attribute, and the fenced ` ```mermaid ` codec round-trip are unchanged.

## Key Risks

- A refactor silently dropping `keepMounted` would re-introduce the `removeChild` crash. Mitigated by the load-bearing inline comment and the retained interaction test.
- Storybook's Vite cache can serve a stale editor `dist`, masking a real fix or regression during verification; clear `apps/storybook/node_modules/.cache/storybook` and force-rebuild before measuring.
