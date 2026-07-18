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

subagent-eligible

## Parallelization Mode

parallel-eligible

## Worktree Mode

same-tree

## Branch Finish Mode

standard

## Blocked By

none

## Validation Focus

- The surface is domain-free: `@zeroxsolutions/ui` gains no import of an app
  domain type (`AvailableModel`, `ModelCapability`, pricing/credit). Every
  model-specific value is a prop or a slot. This is the load-bearing contract.
- `AiProviderIcon` drops into `ModelListItem`'s `media` slot and renders verbatim
  (the DS resolves no provider key itself).
- `unavailable` dims `ModelListItem` and disables its enable `Switch`
  (`disabled = !onEnabledChange || unavailable`).
- `ModelList` renders children unchanged (no filter/group/sort/paginate).
- No `Badge`/`Item` look-alike is introduced; token pills reuse `Badge`, empty
  states reuse `Empty`, loading reuses `Skeleton`.
- `nx lint build test` green for `@zeroxsolutions/ui`; new Storybook stories add
  no new typecheck error to the pre-existing storybook baseline.

## Key Risks

- Owning the `Switch`/remove affordances on `ModelListItem` (design D2) is more
  opinionated than a pure slot; the `action` escape hatch must remain so extra
  trailing content is still possible.
- `IconChip.tint` is a consumer Tailwind class; keep the DS itself monochrome
  (no color token added) - the color arrives from the caller.
- Subpath exports: confirm `packages/ui/package.json`'s export map covers the new
  files (a `./*` wildcard needs no edit; a curated map needs per-file entries).
