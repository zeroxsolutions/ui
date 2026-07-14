## Readiness Decision

ready

## Execution Mode

tdd-preferred - co-locate `ai-provider-card.spec.tsx` and drive the click/action-island and status/meta behaviors from it; visual/layout assertions are verified in a real browser, not jsdom.

## Verification Mode

retained-required - UI change: build + test green is necessary but not sufficient. The card must be rendered and inspected in a real browser (Storybook), confirming reserved-height alignment across differing description lengths and correct tokens in light and `.dark`. jsdom cannot measure layout.

## Debug Mode

standard

## Delegation Mode

single-agent - one focused component + one story + one spec.

## Parallelization Mode

serial-only

## Worktree Mode

same-tree - work on `master` directly per this repo's convention; no branch/worktree unless asked.

## Branch Finish Mode

standard - do not commit unless the user asks.

## Review Status

not-requested - shadcn/Base-UI/cva/`data-slot` conventions and `Card`/`Switch`/`StatusDot` source were reviewed during design; findings folded into the design decisions (CardDescription over raw `<p>`, no `text-base` override, drop footer border, `action` slot over `enabled` props).

## Blocked By

none

## Validation Focus

- Whole-card `onClick` invokes `onSelect`; activating the `action` node does NOT (propagation stopped) - assert in the spec.
- `status` (tone + text) replaces `meta` and is tone-styled via tokens; `meta` alone renders muted - assert in the spec.
- Domain-free: the component imports nothing from `@zeroxsolutions/icons` and defines no preset/provider map - assert by inspection / an import-grep in the spec.
- Browser: two cards with 1-line and 3-line descriptions keep footers aligned (reserved `min-h`); tokens hold in light and `.dark`.

## Key Risks

- Layout-only-verifiable bits (reserved-height alignment, hover ring, dark tokens) cannot be proven in jsdom - require a real-browser check via `storybook-static` + a headless driver.
- Storybook Vite cache can serve a stale `@zeroxsolutions/ui` dist after a rebuild, making a correct card look unfixed - clear `apps/storybook/node_modules/.cache/storybook` and restart if a change does not reflect.
- Nested-interactive a11y: the card is a clickable container holding an interactive `action`; deliberately NOT given `role="button"`. Keep it a mouse affordance; do not "fix" it into a button.

## Manual Adjustments

<!-- none -->
