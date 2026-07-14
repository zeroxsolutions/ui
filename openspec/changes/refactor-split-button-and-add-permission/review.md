## Readiness Decision

**ready with conditions.**

The design and specs are internally consistent and the highest-risk assumption is
structurally de-risked (see Key Risks R1). Proceed to `plan`/`tasks`, carrying three
conditions:

1. **Seam must be eyeballed in a real browser.** The one-divided-control look is produced by
   `ButtonGroup`'s child selectors, not by unit-testable output - Storybook render is the gate,
   not a green `.spec` (see Validation Focus).
2. **Resolve D3 during authoring** - whether the two segments share `variant`/`size` by a matched
   default or the consumer sets both - by matching the sibling composed components, not inventing
   a convention.
3. **`Permission` name is clear** - grep of `packages/ui/src` shows no existing `Permission`
   component symbol/file; condition satisfied, keep it unless authoring surfaces a collision.

## Execution Mode

**tdd-preferred.** Both components have testable behaviour seams: the split button's menu-open +
per-item handlers, and the permission card's status-driven part visibility, multi-scope Allow
rendering, and tone emphasis. Write those `.spec.tsx` (this repo's runner is **vitest**, per the
`CLAUDE.md` override - confirm against the sibling specs, do not assume jest) against the specs
first. The purely visual assertion (the seam) is not TDD-able and belongs to Verification, not a
unit test.

## Verification Mode

**retained-recommended.** The core deliverable of the split-button half is *visual* (one divided
control vs two loose buttons) and jsdom cannot measure it. Drive `storybook-static` in a real
browser (Playwright) for the seam and the asymmetric decision row, and retain that check -
build+test green is **not** "done" for this UI change.

## Delegation Mode

**subagent-eligible.** Implementation is intended for a separate turn via an implementer subagent
that self-loads `.agents/rules/*.md` and the per-file framework skill; the brief points at these
OpenSpec artifacts and names the work, nothing more.

## Parallelization Mode

**parallel-eligible.** The two capabilities are separable - `Permission` composes the `Allow`
control through children and takes no hard `SplitButton` dependency. Natural ordering is
`SplitButton` first (so `Permission`'s multi-scope story can consume the real control), but they do
not block each other.

## Worktree Mode

**same-tree.** Work proceeds on `master` per the maintainer's explicit, recorded instruction - a
deliberate deviation from `worktree-per-task`, consistent with the in-flight
`relocate-code-editor-and-flatten-ai-elements` change.

## Review Status

not-requested.

## Blocked By

none.

## Validation Focus

Paths `plan.md` (and a later verification note) must carry forward:

- **The seam renders as one control (browser).** In Storybook, the `SplitButton` primary + caret
  share one rounded outline with a visible seam, outer corners rounded / inner squared - verified
  visually, across light and dark, not by a DOM snapshot.
- **The caret trigger stays a group sibling.** Confirm the Base UI `DropdownMenu` trigger renders
  as a direct adjacent child of `ButtonGroup` (so `[&>[data-slot]~[data-slot]]:border-l-0` and the
  outer re-round apply) and the content portals out of flow - the selector chain, not just an
  open/close test.
- **Status drives the card.** `pending` shows `PermissionActions` and hides `PermissionResolved`;
  `approved`/`denied` invert it and drop the live controls - via `data-status` selectors, asserted
  in the spec.
- **Row asymmetry.** Multi-scope -> `Allow` is a `SplitButton`; single-scope -> plain `Button`;
  `Deny` is always a single non-destructive button; `tone="danger"` foregrounds `Deny` without
  restructuring - assert in spec + eyeball in Storybook.
- **No CodeMirror / no vendored edits.** `permission.tsx` and `split-button.tsx` touch no
  `components/ui/*` file and pull in no editor engine; colour stays a semantic token.

## Key Risks

- **R1 - seam depends on DOM adjacency (LOW, structurally de-risked).** The join is CSS-selector
  driven and needs the action button and caret button to be adjacent `ButtonGroup` children.
  Confirmed: `DropdownMenu` = `MenuPrimitive.Root` (context provider, emits no DOM) and
  `DropdownMenuTrigger` = a bare `MenuPrimitive.Trigger` button, so the trigger stays a sibling and
  the content portals away. Residual risk is version-dependent Base UI behaviour -> the browser
  check (Validation Focus) is the backstop.
- **R2 - visual regression invisible to CI (MEDIUM).** A jsdom-only test suite can pass while the
  seam is broken. Mitigation: the retained Storybook/browser check is mandatory, not optional.
- **R3 - breaking public API (LOW).** Rewriting `SplitButton`'s exported surface is a breaking
  per-file subpath change (major bump). Only its own story + spec consume it, so migration is
  contained - but the story/spec MUST move in the same change or the build breaks.
- **R4 - `data-status` group scoping (LOW).** `Permission` coordinates via
  `group-data-[status=...]/permission:`; the named `group/permission` must sit on the Root and not be
  shadowed by the inner `Collapsible`'s own group. Use the named-group form to avoid collision.
- **R5 - caret icon fidelity (LOW).** The old code floated a hardcoded `size-2.5` chevron in a
  full icon button; the rebuild uses an `icon-sm` (or matched) caret and lets `Button` size its own
  svg - no hardcoded chevron size (`ui-primitive-fidelity`).

## Manual Adjustments

- D3 is intentionally left open for authoring (matched-default vs consumer-set `variant`); record
  the resolution back into `design.md` D3 once decided against the sibling files.
- Same-tree / master-directly is a standing maintainer instruction for this repo - do not
  "correct" it toward a worktree.
