## 1. Contract (spec + rule)

- [x] 1.1 Amend `.agents/rules/ui-from-design-system.md` (replace body, not
      duplicate): retitle "Every Screen" → "Every UI Surface"; broaden scope to
      any workspace code that renders UI (app OR publishable UI library); add the
      compose-don't-reimplement paragraph with the two mechanism exceptions
      (coordinate/virtual anchor; foreign keyboard-focus ownership); keep the
      stylesheet/emoji/no-competing-library/token guidance verbatim.
- [x] 1.2 Grep the amended rule clean of any project/component name
      (`@zeroxsolutions`, `editor`, `slash`, `prosemirror`, `tiptap`) so it is
      safe to mirror to the `classify` origin.

## 2. Phase 1 — chrome surfaces

- [x] 2.1 Extract the shared bespoke floating-shell in `document/ui/floating-shell.tsx`
      (design D3): a non-focus-owning `position: fixed` surface carrying the DS
      surface tokens (`bg-popover`/border/shadow/`animate-in`) **once** and owning
      the viewport clamp/flip from a supplied rect. Sanctioned by the amended rule
      (virtual-point anchor + foreign keyboard-focus ownership).
- [x] 2.2 Refactor `slash-menu.tsx` to consume the shared shell and render its rows
      from DS `Item`/`ItemMedia`/`ItemContent`/`ItemTitle`/`ItemDescription`, the
      no-match state from `Empty`, and overflow via `ScrollArea` (design D2 — not
      cmdk `Command`, which fights editor focus ownership). Keep external filtering,
      external keyboard nav, positioning, and the `setSlashDecoration` inline
      highlight/ghost unchanged.
- [x] 2.3 Refactor `bubble-menu.tsx`: shared floating-shell + `ToggleGroup`/
      `Toggle` (pressed) + `Tooltip`; delete the `top-44` positioning math (virtual
      anchor from the selection rect).
- [x] 2.4 Refactor `editor-toolbar.tsx`: `ToggleGroup`/`Toggle` + `Tooltip` +
      `button-group`; drop the raw `title` attribute and `aria-pressed`-on-`Button`.
- [x] 2.5 Refactor `block-menu.tsx`: `DropdownMenu`/`ContextMenu` + `Tooltip` on
      the handle; remove the `<span contents>` separator hack.
- [x] 2.6 Update `chrome.spec.tsx` to assert the new composition (design-system
      components present, no re-implemented shell) while keeping all existing
      behavior assertions green.

## 3. Phase 2 — per-feature UIs

Scope corrected at apply from an on-disk survey (design D7): only `image`, `embed`,
and `code-block` render hand-rolled UI that duplicates a design-system component;
`link` / `mention` / `table` render no such surface, so they are already compliant
with `editor-ui-composition` and need no recompose. Each recompose adds a co-located
view render test (the feature specs are codec-only — no UI net today).

- [ ] 3.1 `image`: Edit affordance + alt/width editor → DS `Button` (trigger) +
      `Popover` (`PopoverContent`) + `Field`/`FieldLabel` + `Input`, deleting the
      hand-rolled `bg-popover` panel and raw `<input>`s. Keep the pointer-guard so
      opening the popover doesn't move ProseMirror selection; preserve commit-on-blur
      for `alt` and `width` (numeric → `null` when empty). Add `image-view.spec.tsx`.
- [ ] 3.2 `embed`: URL entry → DS `Input` (drop the raw `<input type=url>` +
      hand-rolled focus-ring). Preserve commit on blur **and** Enter
      (`preventDefault`, trim, ignore empty); once a URL is set, the iframe frame
      shows and no input renders. Add `embed-view.spec.tsx`.
- [ ] 3.3 `code-block`: Copy button → DS `Button` (`variant="ghost"`, keep the
      Copy→Copied 1.5s flip + `navigator.clipboard`). The language picker is already
      the DS `LanguageSwitcher` and stays (its pointer-guard too); `sonner`/`kbd`
      are **not** added — a `Toaster` mount is app-owned, out of this recompose. Add
      `code-block-view.spec.tsx`.
- [x] 3.4 `link` / `mention` — **N/A (compliant as-is):** `link.tsx` renders no UI
      (a `BubbleItem` marker; the href popover is chrome-owned), and `mention.tsx`
      is a static inline `@label` chip (its `@`-typeahead is chrome/out-of-scope).
      Neither hand-rolls a design-system component look-alike, so the spec's
      "no re-implementation" requirement is already met; building new popover /
      typeahead surfaces is new-feature work outside this refactor.
- [x] 3.5 `table` — **N/A (compliant as-is):** `table.tsx` renders no UI; its
      column/row menus and column-resize are `TableKit`-engine-owned, not hand-rolled
      markup. Nothing to recompose; adding new action menus is new-feature work.

## 4. Phase 3 — node-view shells (gated by spike)

- [ ] 4.1 Spike (D-R1): confirm a design-system `Alert`/`Collapsible` can host an
      editable `NodeViewContent`; record the result in `design.md` Open Questions.
- [ ] 4.2 If the spike passes: callout → `alert` (keep FluentEmoji icon), toggle →
      `collapsible` (preserve the static `<details>` twin + closed-state behavior).
- [ ] 4.3 If the spike fails: retain the bespoke shells and record them as an
      allowed exception under the `editor-ui-composition` "cannot express" scenario.

## 5. Validation

- [x] 5.1 `pnpm nx run-many -t build test` green; `assert-engine-free-dts` finds no
      engine types in the public `.d.ts` after each surface swap.
- [x] 5.2 Re-run the retained browser probes: inline `/` stays visible + filters +
      delete-on-select, viewport flip near the bottom edge, bubble only over a
      text (non-node) selection, keyboard nav (↑/↓, Enter/Tab, Esc).
- [x] 5.3 Confirm no surface still declares a `bg-popover border shadow` container
      of its own and no hand-rolled command/menu list survives (spec: "no
      re-implementation").
- [x] 5.4 Rule-audit the staged diff against `.agents/rules/*` (per
      `green-before-commit`) before any commit.
