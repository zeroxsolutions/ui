## Readiness Decision

ready

## Execution Mode

tdd-preferred

## Verification Mode

retained-recommended

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

## Branch Finish Mode

standard

## Blocked By

none

## Validation Focus

- Domain-free: `@zeroxsolutions/ui` gains no app domain type (`AvailableModel`,
  `ModelCapability`, pricing/credit); every model value is a prop, slot, or child.
- No look-alike / no "Row": the change adds `ModelInfoCard` + `ModelInfoCardSection`
  only - no line/row component (lines reuse the shipped `Item`) and no `HoverCard`
  wrapper (the trigger reuses the shipped `HoverCard`).
- Convention exact: one compound file `components/model-info-card.tsx`, sub-parts
  named `ModelInfoCard*`, each `data-slot`-tagged, `export { ... }` at the end -
  the `card.tsx` shape; composed surface in `components/`, not `components/ui/`.
- `ModelInfoCard` media renders verbatim (an `AiProviderIcon` drops in), and the
  panel shows inside the shipped `HoverCardContent`.
- `nx build test @zeroxsolutions/ui` green; the new story adds no new storybook
  typecheck error.

## Key Risks

- `ModelInfoCardSection` is thin; keep it justified (the repeated accent-title
  header) or drop it in review.
- HoverCard content mounts on open (Base UI) - the spec must open the card to
  assert panel content, or assert the trigger only.
- Section accent / chip tint are consumer classes - keep the DS itself monochrome
  (no colour token added).
