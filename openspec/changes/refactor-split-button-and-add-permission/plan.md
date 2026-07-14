## Scope

Implement both capabilities of the change in `@zeroxsolutions/ui`: rewrite `SplitButton` into a
compound split button on `ButtonGroup` (`ui-split-button`), and add the inline `Permission`
compound in-chat consent card (`ui-permission`). Presentational only - no host/runtime wiring.
Work proceeds same-tree on `master`.

## Covers

- Tasks `1.1`-`1.5` (SplitButton), `2.1`-`2.6` (Permission), `3.1`-`3.2` (green + release).
- Validation Focus: `VF-seam` (one divided control, browser), `VF-caret-sibling` (trigger stays a
  group child), `VF-status` (status drives card), `VF-row-asymmetry` (plain Deny / graduated
  Allow / danger tone), `VF-no-vendored` (no `components/ui/*` edit, no editor engine, token colour).

## Plan Type

full - cross-component, a breaking public-API bump, and validation-intensive (the core split-button
deliverable is visual and only provable in a real browser).

## Execution Strategy

tdd-preferred - behaviour seams (menu open + per-item handlers; status-driven part visibility;
multi-scope Allow; tone emphasis) are written as failing `.spec.tsx` first, then made green. The
purely visual seam assertion is not TDD-able and is proven in the browser step, not a unit test.
Runner is **vitest** (the `CLAUDE.md` override) - confirm against sibling specs.

## Ordered Steps

**Unit A - SplitButton** (covers 1.1-1.5)

1. A1 - *(failing)* Rewrite `split-button.spec.tsx` to the new compound API: assert a
   `data-slot="split-button"` group renders the action + caret parts; primary click runs the fixed
   action; the caret opens the menu; an item's own handler fires. Red (component not yet rewritten).
2. A2 - Rewrite `split-button.tsx` - Root composing `ButtonGroup`; parts `SplitButtonAction`,
   `SplitButtonMenu` (wraps `DropdownMenu`), `SplitButtonTrigger` (`DropdownMenuTrigger render={<Button/>}`),
   `SplitButtonContent`, `SplitButtonItem`; each `data-slot="split-button-*"`; Base UI `render`, no
   Radix `asChild`; no bespoke `cva` (delegate to `Button`/`ButtonGroup`, matched `variant`/`size`);
   classic semantics (fixed primary + per-item handlers), labelled primary supported. -> A1 green.
3. A3 - Rewrite `apps/storybook/src/split-button.stories.tsx` for the new API: labelled + icon
   primary, single vs multiple items, each `variant`.
4. A4 - *(browser)* Build `storybook-static`, drive the SplitButton stories with Playwright, and
   confirm the seam: one shared rounded outline, outer corners rounded / inner squared, in light and
   dark - the trigger sits as an adjacent group child, content portals away.

**Unit B - Permission** (covers 2.1-2.6)

5. B1 - *(failing)* Write `permission.spec.tsx`: `pending` shows `PermissionActions` / hides
   `PermissionResolved`; `approved` & `denied` invert and drop the live controls; multi-scope Allow
   renders a `SplitButton`; single-scope renders a plain `Button`; `tone="danger"` foregrounds Deny.
   Red (component absent).
6. B2 - Implement `permission.tsx` - Root (`status`->`data-status`, `tone`->`data-tone`,
   `group/permission`, `data-slot="permission"`) + parts `PermissionHeader` (icon - title - status
   `Badge`), `PermissionDescription`, `PermissionPreview` (`Collapsible` + read-only `CodeBlock`),
   `PermissionActions`, `PermissionResolved`; visibility via `group-data-[status=...]/permission:`;
   asymmetric row (plain non-destructive `Deny`; `Allow` composed through children); `tone` emphasis.
   -> B1 green.
7. B3 - Write `apps/storybook/src/permission.stories.tsx`: pending / approved / denied, single vs
   multi scope, default vs danger tone, rendered inside a `ChatMessageShell` assistant message.
8. B4 - *(browser)* Drive the Permission stories with Playwright: inline (no modal), asymmetric row,
   resolved state persists and is non-interactive, danger tone foregrounds Deny - light and dark.

**Unit C - Green + release** (covers 3.1-3.2, after A + B)

9. C1 - Rule-audit the staged diff against `ui-compound-authoring`, `ui-primitive-fidelity`,
   `ui-from-design-system`, `naming-files-and-symbols`; run `nx run-many -t lint build test`
   (incl. `@zeroxsolutions/ui`) and the Storybook build green.
10. C2 - Record the retained browser evidence (see Completion Verification).
11. C3 - `nx release` for `@zeroxsolutions/ui` - **major** (SplitButton API rewrite is breaking on
    its per-file subpath; `./components/permission` is additive) from conventional commits.

## Validation Per Step

1. A1 - spec runs and fails for the right reason (new API absent), not a syntax error.
2. A2 - `nx test @zeroxsolutions/ui` green for `split-button.spec`; no `components/ui/*` edit; no
   `splitButtonVariants` cva introduced.
3. A3 - Storybook builds; each story renders without console errors.
4. A4 - browser screenshot/inspection confirms `VF-seam` + `VF-caret-sibling` (light + dark).
5. B1 - spec runs and fails (component absent).
6. B2 - `split-button` + `permission` specs green; `VF-status` asserted; colour is token-only.
7. B3 - Storybook builds; Permission stories render inside `ChatMessageShell`.
8. B4 - browser inspection confirms `VF-row-asymmetry` + inline non-modal + resolved persistence.
9. C1 - lint + build + test green workspace-wide; rule-audit note states compliant/fixed per file.
10. C2 - retained verification note exists with the browser evidence.
11. C3 - release bump is major; changelog reflects the breaking subpath.

## Files / Owners

- `packages/ui/src/components/split-button.tsx` - Unit A (rewrite)
- `packages/ui/src/components/split-button.spec.tsx` - Unit A
- `apps/storybook/src/split-button.stories.tsx` - Unit A
- `packages/ui/src/components/permission.tsx` - Unit B (new)
- `packages/ui/src/components/permission.spec.tsx` - Unit B (new)
- `apps/storybook/src/permission.stories.tsx` - Unit B (new)
- No shared-file edits between A and B: the package exposes a per-file `./*` subpath map (no root
  barrel per `lib-public-exports-and-semver`), so a new component needs no exports edit. `package.json`
  version is touched once by Unit C only.

## Completion Checkpoint

All `split-button` and `permission` specs green; Storybook builds; the browser check for the seam
(A4) and the asymmetric card (B4) has been run and its evidence retained; rule-audit clean across the
diff; `components/ui/*` untouched and no CodeMirror import added; `@zeroxsolutions/ui` released as a
major bump.

## Completion Verification

Verification Mode is **retained-recommended**, so build+test green is **not** sufficient to call this
done. Retain a short verification note recording, from driving `storybook-static` in a real browser
(Playwright):

- the `SplitButton` renders as **one divided control** with a visible seam (outer rounded / inner
  squared) in light and dark - the check that jsdom cannot perform;
- the `Permission` decision row is asymmetric (plain `Deny`, graduated-scope `Allow`), renders inline
  with no modal, and its `approved`/`denied` state persists and is non-interactive;
- `tone="danger"` foregrounds `Deny` without restructuring the row.

The note discriminates a real pass from a false one (e.g. it would fail if the seam collapsed to two
loose buttons), per the "prove the test discriminates" discipline.

## Delegation Units

- **Unit A (SplitButton)** and **Unit B (Permission)** are each delegable to an implementer subagent.
  Each brief points only at this change's OpenSpec artifacts (`proposal`, `design` D2-D9, the two
  `specs`, `review`) and names the unit's task IDs - no embedded rule slugs or skill lists (the
  implementer self-loads `.agents/rules/*` and the per-file framework skill). Each unit writes its
  result back by checking off its `tasks.md` items and appending to Execution Notes.
- **Unit C** is not delegated - it is the aggregation/release step, run once after A and B land.

## Parallel Units

- A and B may run **concurrently** - `Permission` composes the `Allow` control through children and
  takes no hard `SplitButton` dependency, so B's specs/stories can use a plain `Button` (single-scope)
  or a placeholder while A lands the real control. Natural first-mover is A (so B's multi-scope story
  consumes the finished split button), but neither blocks the other.
- **Aggregator:** Unit C runs after both A and B complete (single-agent), then release.

## Isolation Boundaries

- Unit A owns `split-button.{tsx,spec.tsx}` + its story; Unit B owns `permission.{tsx,spec.tsx}` + its
  story. Disjoint file sets.
- No shared file is edited in parallel: no root barrel (per-file `./*` exports), and the sole shared
  surface - `package.json` version - is touched only by Unit C, after the parallel units merge.
- Validation boundary: each unit's specs run independently; the workspace-wide `lint build test` and
  the release are Unit C's responsibility, not a parallel unit's.

## Manual Adjustments

- Resolve `design.md` D3 (matched-default vs consumer-set `variant`) during A2 by matching the sibling
  composed components, and write the resolution back into D3.
- Keep `Permission` as the component name unless A/B authoring surfaces a collision (grep currently
  clear).
