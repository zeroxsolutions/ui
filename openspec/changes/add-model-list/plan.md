## Scope

Implement the `model-list` presentational surface in `@zeroxsolutions/ui`:
`IconChip`, `ModelListItem`, `ModelList`, `ModelListSkeleton`, each with a
co-located vitest spec and a Storybook story. Domain-free; no app type enters the
DS. The stateful container and domain types stay in chiselhub.

## Covers

- `1.1`, `1.2` (readiness), `2.1`-`2.2` (IconChip), `3.1`-`3.2` (ModelListItem),
  `4.1`-`4.3` (ModelList + skeleton), `5.1`-`5.3` (Storybook), `6.1`-`6.6`
  (validation).
- VF - domain-free contract, `AiProviderIcon` in the media slot, `unavailable`
  disables the toggle, `ModelList` transforms nothing, no `Badge`/`Item`
  look-alike.

## Plan Type

full

## Execution Strategy

tdd-preferred

## Ordered Steps

1. Readiness (1.1, 1.2): confirm the export map, deps (`@zeroxsolutions/icons`,
   `lucide-react`), and the vitest setup; re-read `ai-provider-card.tsx` + the
   shipped primitives to lock conventions.
2. `IconChip` (2.1, 2.2): write the spec, then the component - the leaf atom the
   item's Storybook story reuses.
3. `ModelListItem` (3.1, 3.2): write the spec (name/id lines, slots,
   `AiProviderIcon` media, `unavailable` -> disabled `Switch`, `onRemove`), then
   the component built on `Item`.
4. `ModelList` + `ModelListSkeleton` (4.1, 4.2, 4.3): write the specs (frame
   renders + transforms nothing; skeleton count/shape), then the components.
5. Storybook (5.1, 5.2, 5.3): stories for the item (states + real
   `AiProviderIcon` + `IconChip` + `Badge`), the assembled frame (+ skeleton +
   `Empty`), and the chip gallery.
6. Validate (6.1-6.5) then record the chiselhub follow-up (6.6).

## Validation Per Step

1. `packages/ui/package.json` export map understood; `nx test @zeroxsolutions/ui`
   runs (baseline green).
2. `nx test @zeroxsolutions/ui` - IconChip spec passes.
3. `nx test @zeroxsolutions/ui` - ModelListItem spec passes (incl. the
   `unavailable`/disabled and `AiProviderIcon`-verbatim assertions).
4. `nx test @zeroxsolutions/ui` - ModelList + skeleton specs pass.
5. `nx build @zeroxsolutions/storybook` / stories load; `nx typecheck
   @zeroxsolutions/storybook` shows only pre-existing unrelated errors.
6. `nx lint build test @zeroxsolutions/ui` green; domain-free grep clean; real
   browser check; `openspec validate add-model-list` passes.

## Files / Owners

- `packages/ui/src/components/icon-chip.tsx` (+ `.spec.tsx`)
- `packages/ui/src/components/model-list-item.tsx` (+ `.spec.tsx`)
- `packages/ui/src/components/model-list.tsx` (+ `.spec.tsx`)
- `packages/ui/src/components/model-list-skeleton.tsx` (+ `.spec.tsx`)
- `apps/storybook/src/.../model-list-item.stories.tsx`
- `apps/storybook/src/.../model-list.stories.tsx`
- `apps/storybook/src/.../icon-chip.stories.tsx`
- `packages/ui/package.json` (export map - only if not a `./*` wildcard)

## Completion Checkpoint

All six task groups checked off; `nx lint build test @zeroxsolutions/ui` green;
the domain-free grep is clean; the new Storybook stories add no new typecheck
error; the real-browser check confirms the item states, `IconChip` tints, the
frame, and the skeleton; `openspec validate add-model-list` passes. No commit
unless the user asks.

## Completion Verification

- Retained evidence recommended: the real-browser render (screenshot) of the
  item states + `IconChip` gallery + assembled frame + skeleton, and the
  `nx lint build test @zeroxsolutions/ui` result.
- The domain-free grep result (no app-domain/capability/pricing import in the new
  files) recorded on task 6.2.

## Parallel Units

- After step 1, `IconChip` (group 2) and `ModelListItem` (group 3) and
  `ModelList`/`ModelListSkeleton` (group 4) are independent components and MAY be
  implemented concurrently (separate files, separate specs); the item's Storybook
  story reuses `IconChip`, so land group 2 before story 5.1. One owner aggregates
  and runs the single validation pass (group 6).

## Isolation Boundaries

- Each component is one file + one spec + one story; no shared file is edited
  except `packages/ui/package.json` (only if the export map is not a wildcard),
  which a single owner edits once. Parallel work stays in same-tree (no
  worktree): the only shared surface is that one optional package.json edit.
