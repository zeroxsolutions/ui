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

## 3. Phase 2 — per-feature UIs (may apply in a later cycle)

- [ ] 3.1 `link`: popover editor from `field`/`input` + `hover-card` preview.
- [ ] 3.2 `image` / `embed`: `tabs` (upload/url) + `field`/`input` +
      `aspect-ratio` + `progress`/`spinner`.
- [ ] 3.3 `code-block`: language picker via `combobox`/`native-select` + `kbd` +
      `sonner` (copied toast).
- [ ] 3.4 `mention`: headless `Command`/`combobox` + `avatar`.
- [ ] 3.5 `table`: column/row actions via `dropdown-menu`/`context-menu`; adopt
      `resizable` where it replaces the hand-rolled column-resize.

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
- [ ] 5.4 Rule-audit the staged diff against `.agents/rules/*` (per
      `green-before-commit`) before any commit.
