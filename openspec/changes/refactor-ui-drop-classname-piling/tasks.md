## 1. Foundations (already applied this session)

- [x] 1.1 Amend `.agents/rules/ui-from-design-system.md` with the "take the primitive's
      defaults; a `className` override must earn its place" discipline (paragraph, 🔴
      example, rule-of-thumb bullet, Why clause).
- [x] 1.2 Update session memory: `icon-sizing-prefer-intrinsic` (lucide-in-Button nuance),
      `combobox-anchors-popup-to-trigger-width` (trigger override-piling), new
      `answer-why-before-acting`, and `MEMORY.md` index.
- [x] 1.3 Strip `LanguageSwitcher` trigger to `className={className}` — no self-added
      `min-w-40`/`justify-between`/`font-normal`/`size-4`/`text-muted-foreground`.
- [x] 1.4 Delete `mono-chip`, `dirty-dot`, `status-dot`, `tab-close-button` (component +
      spec + story each); verify no dangling references; `./*` exports auto-drop.

## 2. Remove redundant overrides (parent already applies the size)

- [x] 2.1 `tag-input:62` — removed `<X className="size-3">` → `<X />` (Button `size="icon-xs"`
      sizes its svg → `size-3`).
- [x] 2.2 `ai-elements/tool:61/64/68/70` — removed `size-3` on the four status icons (inside
      `<Badge>` → `[&>svg]:size-3!`); kept the semantic colours + `animate-pulse`.

## 3. Replace hand-sizing with the primitive's own variant

- [x] 3.1 `tag-input:59` — dropped `size-4`, kept `size="icon-xs"` + `rounded-full` + colour.
- [x] 3.2 `tree-row:80/83` — dropped `size-5` and child `size-3.5`; kept `size="icon-xs"`
      (24px / 12px). Synced the no-children spacer `w-5` → `w-6` to match the 24px toggle.
- [x] 3.3 `ai-elements/conversation:127` — `size="icon"` + `size-8` → `size="icon-sm"`;
      kept the `absolute … -translate-x-1/2 rounded-full` positioning.
- [x] 3.4 `ai-elements/code-block` CopyButton — baked `size="icon-xs"` into the local
      `CopyButton` (was `icon-sm` + call-site `size-6` overrides) and dropped `size-6` at both
      call sites + the internal icon `size-3.5`. Both copy buttons now 24px via the variant.
- [x] 3.5 `avatar-editor:181` — `size="icon"` + `size-7` → `size="icon-sm"`; kept `ml-auto`
      and the destructive-hover colour.

## 4. Resolve the two heavy re-tunes

- [x] 4.1 `tree-item:92` — **replaced the neutralised `<Button>` with a `<div>`** per the W3C
      WAI-ARIA tree-view pattern (a treeitem's clickable region is a `div`/`span`, not a
      per-item `<button>`; activation is owned by the tree via roving tabindex + Enter). This
      removes the ghost-variant fight (`hover:bg-transparent`), the invalid `<button>`-wraps-
      `<input>` nesting, and the per-item tab-stop conflict — deleting the whole className pile
      at its root. Name region now `flex min-w-0 flex-1 items-center gap-1.5 py-1 text-xs
      cursor-pointer`. Removed the now-unused `Button` import; updated the docstring. TreeItem
      has no real consumers (story/spec only); spec still passes (click `getByText`, `textbox`,
      ref div).
- [x] 4.2 `ai-elements/code-block:259` — accepted `LanguageSwitcher`'s default trigger:
      removed the `h-6 min-w-28 border-0 bg-transparent text-[11px] shadow-none hover:bg-accent`
      chip pile entirely; no new prop. Renders as the default `sm outline` dropdown.

## 5. Resolve CONFIRM-AT-APPLY sites (read each trigger; Button-child → remove, bare → keep)

- [x] 5.1 **REMOVE both.** `sidebar-group:60` — `SidebarGroupLabel` applies `[&>svg]:size-4
      shrink-0` → `size-4 shrink-0` redundant, removed (kept `ml-auto`). `sidebar-menu:73` —
      `SidebarMenuButton` applies `[&_svg]:size-4 shrink-0` (higher specificity, no escape) →
      `size-3.5` was inert (already 16px), removed.
- [x] 5.2 **KEEP both.** `reasoning:139/144` and `tool:112/125` sit inside a bare
      `CollapsibleTrigger` (no svg sizing) → the sizes are the bare lucide icons' only spec.
- [x] 5.3 **KEEP both.** `icon-label:31` is an `<Icon>` in a `<span>` (no sizing); `file-tree:378`
      is a `<ChevronRight>` in a clickable `<div>` with a matching `w-4` spacer sibling.
- [x] 5.4 `split-button:108` **KEEP** (10px dropdown caret — no Button variant reaches it);
      `split-button:119` **REMOVE** `size-3.5` → `<Icon />` (DropdownMenuItem's default 16px).

## 6. Validation

- [x] 6.1 `nx build @zeroxsolutions/ui` + `nx test @zeroxsolutions/ui` green (45 files, 209 tests).
- [x] 6.2 `nx build-storybook @zeroxsolutions/storybook` green.
- [x] 6.3 Real-browser visual parity: playwright (system Chrome, `channel:'chrome'`) over
      `storybook-static` (:6100) — every USE-VARIANT swap lands on its variant size
      (icon-xs 24/svg12, icon-sm 32/svg16), redundant-removal icons at the primitive size (16/12),
      `tree-item` name region is a `div` (no `button:has(input)`), no overflow/scrollbar introduced
      (only the code-block's by-design scroll rail). Recorded in `verification.md`.
- [x] 6.4 N/A — no override-removal regression test was added (the change only removes redundant
      classes/components); nothing to prove discriminates. Pre-existing co-located specs stay green.
- [x] 6.5 Rule-audit performed against `.agents/rules/*` before commit (recorded in the apply report).
