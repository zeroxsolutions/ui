## Scope

The committed portion of `refactor-editor-chrome`: the **contract** (amend
`ui-from-design-system` + the `editor-ui-composition` spec) and **Phase 1
(chrome)** — slash, bubble, toolbar, and block surfaces recomposed from the design
system behind one shared floating-shell primitive. Phase 1 landed in commits
`61c426c` (contract) + `2898e5e` (chrome).

**Phase 2 (per-feature UIs) is now added to this plan** — scope corrected at apply
(design D7) to the three surfaces that actually hand-roll a design-system look-alike:
`image`, `embed`, `code-block`. `link` / `mention` / `table` render no such surface
and are reclassified N/A (already compliant). Phase 3 (node-view shells) stays out of
scope, behind the D-R1 spike.

## Covers

- Tasks: `1.1`, `1.2`, `2.1`, `2.2`, `2.3`, `2.4`, `2.5`, `2.6`, `3.1`, `3.2`,
  `3.3`, `5.1`, `5.2`, `5.3`, `5.4` (`3.4`, `3.5` closed N/A — no surface to
  recompose, per D7)
- Validation Focus: no-re-implementation grep · engine-free `.d.ts` · behavior
  parity probes (trigger/filter/flip/bubble/keyboard) · rule is name-clean ·
  Phase 2 view specs green (image/embed/code-block commit + composition)

## Plan Type

full

## Execution Strategy

tdd-preferred

## Ordered Steps

1. Amend `.agents/rules/ui-from-design-system.md` (replace body per design D5) and
   grep it clean of project/component names.
2. Encode the new-composition expectations into `chrome.spec.tsx` (design-system
   components present; no re-implemented shell) — added alongside the existing
   behavior specs, which stay green throughout.
3. Extract the shared floating-shell primitive (`document/ui/floating-shell.tsx`);
   resolve the wrap-`Popover`-vs-thin-surface question and document it inline.
4. Refactor `slash-menu.tsx` to the virtual-anchored `Popover` + headless
   `Command`/`item`+`empty`+`scroll-area`; delete the custom clamp/flip; keep
   external filtering, keyboard nav, and `setSlashDecoration` unchanged.
5. Refactor `bubble-menu.tsx` (shared shell + `ToggleGroup`/`Toggle` + `Tooltip`,
   virtual anchor from the selection rect; delete `top-44`).
6. Refactor `editor-toolbar.tsx` (`ToggleGroup`/`Toggle` + `Tooltip` +
   `button-group`).
7. Refactor `block-menu.tsx` (`DropdownMenu`/`ContextMenu` + `Tooltip`; remove the
   `<span contents>` hack). Finalize `chrome.spec.tsx`.
8. Run the full validation sweep (build/test, `.d.ts`, probes, no-reimpl grep,
   rule-audit).

Phase 2 (added at apply — serial, one surface then green, per `review.md`):

9. `image.tsx`: Edit trigger → DS `Button`; alt/width editor → DS `Popover` +
   `Field`/`FieldLabel` + `Input`; delete the hand-rolled `bg-popover` panel + raw
   `<input>`s. Keep the pointer-guard (no PM selection move on open); preserve
   commit-on-blur (`alt`; `width` numeric→`null`). Add `image-view.spec.tsx`.
10. `embed.tsx`: URL entry → DS `Input`; preserve commit on blur + Enter
    (`preventDefault`/trim/ignore-empty); URL set → iframe frame, no input. Add
    `embed-view.spec.tsx`.
11. `code-block.tsx`: Copy → DS `Button` (keep Copy→Copied flip + clipboard); keep
    the DS `LanguageSwitcher`; no `sonner`/`kbd`. Add `code-block-view.spec.tsx`.
12. Phase 2 validation: `nx test @zeroxsolutions/editor` (new view specs + all prior
    green); `nx build @zeroxsolutions/editor` + `assert-engine-free-dts` clean; no
    `bg-popover` / raw look-alike survives in the three files.

## Validation Per Step

1. `grep -iE '@zeroxsolutions|editor|slash|prosemirror|tiptap'` on the rule returns
   nothing meaningful; the rule still reads coherently for an app *and* a library.
2. `nx test @zeroxsolutions/editor` — new composition assertions and all prior
   behavior assertions green.
3. `nx build @zeroxsolutions/editor` green; the shell renders on tokens (dark flip).
4. `nx run-many -t build test` green; `assert-engine-free-dts` clean; slash browser
   probe: `/` visible, filters, delete-on-select, viewport flip near bottom.
5. Bubble probe: appears only over a text (non-node) selection, correct position.
6. Toolbar: pressed states reflect `isActive`; tooltips present; specs green.
7. Block: menu opens at the hovered block; `chrome.spec.tsx` fully green.
8. `nx run-many -t build test` green; probes pass; no `bg-popover border shadow`
   container and no hand-rolled command list remain; rule-audit passes.

## Files / Owners

- `.agents/rules/ui-from-design-system.md` (rule amend)
- `packages/editor/src/document/ui/floating-shell.tsx` (new shared shell)
- `packages/editor/src/document/ui/slash-menu.tsx`
- `packages/editor/src/document/ui/bubble-menu.tsx`
- `packages/editor/src/document/ui/editor-toolbar.tsx`
- `packages/editor/src/document/ui/block-menu.tsx`
- `packages/editor/src/document/ui/chrome.spec.tsx`
- `packages/editor/src/styles.css` (only if shell tokens move here)

## Completion Checkpoint

Phase 1 is complete when: all four chrome surfaces render their interactive parts
from design-system components; the slash menu's custom positioning math is deleted
(virtual anchor); one shared floating-shell replaces the duplicated `bg-popover
border shadow` containers; `chrome.spec.tsx` asserts the composition and keeps
every behavior test green; `nx run-many -t build test` and `assert-engine-free-dts`
pass; and the amended rule is name-clean. Phases 2–3 remain open in `tasks.md`.

## Completion Verification

Retained (Verification Mode: retained-recommended): keep the browser probes
(positioning/flip, `/` trigger + filter + delete-on-select, bubble-over-text,
keyboard nav) as the non-regression evidence and record their pass/fail in a
verification companion note. Behavior parity — not just green units — is the
acceptance signal, because the refactor changes how every surface renders.

## Execution Notes

<!-- apply-time notes appended here -->

- 2026-07-10 — Plan **complete**. All Covers tasks done (`1.1`, `1.2`,
  `2.1`–`2.6`, `5.1`–`5.4`). Landed as two commits on `refactor/editor-chrome`:
  `61c426c` (contract — rule amend + `editor-ui-composition` spec) and `2898e5e`
  (Phase 1 chrome — slash/bubble/toolbar/block recomposed from the design system
  behind the shared `floating-shell`). `nx run-many -t lint build test` green;
  `assert-engine-free-dts` clean; retained browser probes (trigger/filter/flip,
  bubble-over-text, keyboard nav) verified in prior sessions; `5.4` rule-audit
  performed at each commit.
- Remaining open tasks (`3.1`–`3.5` Phase 2, `4.1`–`4.3` Phase 3) are **outside
  this plan's Covers** — deferred to later apply cycles by design. Phase 3 is
  gated on the D-R1 `NodeViewContent` spike (`4.1`) and must not start until it
  resolves. Continuing them requires a new/extended plan; per the apply preflight,
  this cycle stops here rather than implementing uncovered tasks.

## Manual Adjustments

<!-- human notes preserved across writeback -->
