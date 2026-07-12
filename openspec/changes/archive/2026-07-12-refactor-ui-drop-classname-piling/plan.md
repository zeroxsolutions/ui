## Scope

Remove `className` override-piling on design-system components across
`@zeroxsolutions/ui` composites, and resolve the two heavy re-tunes. Foundations
(rule, memory, `LanguageSwitcher` trigger, four deletions) are already applied; this
plan drives the remaining per-site edits and the validation.

## Covers

- `1.1`–`1.4` (done — recorded for traceability)
- `2.1`, `2.2` (remove redundant)
- `3.1`–`3.5` (use variant)
- `4.1`, `4.2` (heavy re-tunes)
- `5.1`–`5.4` (confirm-at-apply)
- `6.1`–`6.5` (validation)
- VF: real-browser visual parity; unit gate; no dangling refs; discriminating regression tests.

## Plan Type

full — validation-intensive (retained-required visual verification) across multiple files.

## Execution Strategy

standard

## Ordered Steps

1. Apply the **remove-redundant** edits (`2.1`, `2.2`) — no visual change expected (the
   parent already applies the same size).
2. Apply the **use-variant** swaps (`3.1`–`3.5`) — replace each `size-*` with the
   primitive's `size` variant; keep layout/positioning/colour classes.
3. Read each **confirm-at-apply** trigger (`5.1`–`5.4`); for each icon decide Button-child
   → remove, or bare/raw → keep; apply.
4. Resolve `code-block:259` (`4.2`) open decision first, then re-shape `tree-item:92`
   (`4.1`) off `Button` onto a non-Button click target keeping `min-w-0 flex-1`.
5. Run the unit gate (`6.1`, `6.2`).
6. Rebuild dist + `storybook-static` and **browser-verify** every changed/adjacent surface
   (`6.3`); prove any added regression test discriminates (`6.4`).
7. Rule-audit the staged diff against `.claude/rules/*` (`6.5`).

## Validation Per Step

1. `nx test @zeroxsolutions/ui` green; grep confirms the removed classes are gone.
2. Each swapped control renders at the variant's size in a real browser (step 6);
   `nx build` green.
3. No bare-lucide icon left at lucide's 24px default where 16px was intended; no
   redundant `size-*` left on a Button/Badge child.
4. `LanguageSwitcher` in `code-block` carries no chip className pile; `tree-item` name is
   no longer a neutralised `Button`; both verified in browser.
5. `nx build @zeroxsolutions/ui` + `nx test @zeroxsolutions/ui` + `nx build-storybook` green.
6. Playwright reads on affected stories show computed sizes/overflow match intent; no
   native scrollbar or overflow introduced.
7. Audit result recorded: compliant, or what was fixed.

## Files / Owners

- `packages/ui/src/components/tag-input.tsx`
- `packages/ui/src/components/tree-row.tsx`
- `packages/ui/src/components/tree-item.tsx`
- `packages/ui/src/components/avatar-editor.tsx`
- `packages/ui/src/components/sidebar-group-collapsible.tsx`
- `packages/ui/src/components/sidebar-menu-collapsible.tsx`
- `packages/ui/src/components/icon-label.tsx`
- `packages/ui/src/components/file-tree.tsx`
- `packages/ui/src/components/split-button.tsx`
- `packages/ui/src/components/ai-elements/tool.tsx`
- `packages/ui/src/components/ai-elements/conversation.tsx`
- `packages/ui/src/components/ai-elements/reasoning.tsx`
- `packages/ui/src/components/ai-elements/code-block.tsx`
- (done) `packages/ui/src/components/language-switcher.tsx`; deleted `mono-chip`/`dirty-dot`/`status-dot`/`tab-close-button`; `.agents/rules/ui-from-design-system.md`

## Completion Checkpoint

Every `2.*`–`6.*` task checked; no `className` on a design-system component whose sole
effect re-tunes a built-in size/spacing/icon-size/colour/font remains; the two heavy
re-tunes resolved; unit gate + storybook green; real-browser parity recorded; rule-audit
clean.

## Completion Verification

Verification Mode is **retained-required**: record a verification companion note
(`openspec/changes/refactor-ui-drop-classname-piling/verification.md`) capturing — the
storybook stories checked, computed size/overflow readings (before/after) for each
variant swap and each heavy re-tune, confirmation of no native scrollbar/overflow, and
the proof that each added regression test fails without its fix. jsdom results do not
satisfy this gate.

## Delegation Units

Optional (subagent-eligible): a single implementer subagent may own the whole `2.*`–`5.*`
edit set and the CONFIRM-AT-APPLY trigger reads, writing results back into `tasks.md`;
the browser-verify step and rule-audit are retained by the main loop.

## Execution Notes

- `code-block:259` decision made — accept `LanguageSwitcher`'s default trigger, remove the
  chip pile entirely, no new prop. Step 4 is unblocked.
- Foundations already green (ui build+test 221-class suite, storybook build) after the
  deletions; re-confirm after each subsequent edit.

## Manual Adjustments

None.
