## 1. Spike — confirm the engine can host a minimal composer

- [ ] 1.1 Verify `core/builder/create-editor.ts` (and the TipTap engine under it) can build a schema constrained to a **single textblock** (`content: "paragraph"`, inline = `text` + `mention`) — if not, design `composerKit()` to supply its own document node spec (no engine fork).
- [ ] 1.2 Verify the builder exposes an `Enter`-keymap override so `Enter` → submit and `Shift+Enter` → hard break, without splitting a block. Record the seam used.

## 2. `@editor` — composer kit and shared types

- [ ] 2.1 Add `packages/editor/src/composer/composer-types.ts`: `ChatPerson`, `ChatCommand`, `ChatMention`, `ChatSegment`, `ChatMessagePayload` (positional segments; `command` nullable).
- [ ] 2.2 Add `packages/editor/src/composer/composer-kit.ts`: the minimal feature kit (single textblock + `text` + existing `mention()` + `history` + `placeholder` + submit keymap), reused by input and view.

## 3. `@editor` — the `@` mention menu (near-clone of slash-menu)

- [ ] 3.1 Add `composer/mention-menu.tsx`: `triggerQuery('@')` detection, `caretRect()` positioning in a `FloatingShell`, `setSlashDecoration` highlight of the typed `@query`, ↑/↓/Enter/Esc owned by the menu.
- [ ] 3.2 Rows/empty/scroll are the design-system `Item` / `Empty` / `ScrollArea`; the people list comes from a caller prop (sync list or async query). No look-alike.
- [ ] 3.3 On select: `deleteRange` the `@query`, then `insertMention({ id, label })`; the pill shows `label`, deletes as one atom.
- [ ] 3.4 Co-located `mention-menu.spec.tsx`: select-inserts-pill, empty-state on no match, label-not-id.

## 4. `@editor` — the `/` command menu (mode Badge, surface state)

- [ ] 4.1 Add `composer/command-menu.tsx`: `triggerQuery('/')` **restricted to input start**, `caretRect()` positioning, query filtering, keyboard nav; caller-supplied command list.
- [ ] 4.2 On select: `deleteRange` the `/query` (insert nothing into the doc), lift the command into `ChatInput` surface state; render it as a design-system `Badge` pinned at the input's leading edge.
- [ ] 4.3 `Backspace` at input start with an active command clears the state and removes the `Badge`; a mid-argument `/` stays literal.
- [ ] 4.4 Co-located `command-menu.spec.tsx`: set-mode-on-select, clear-on-backspace, start-only, exactly-one-command.

## 5. `@editor` — ChatInput assembly and payload

- [ ] 5.1 Add `composer/chat-input.tsx` → `ChatInput`: builds the editor over `composerKit()`, mounts the mention + command menus, holds `selectedCommand` state, renders the `Badge` chip inside the `@ui` `InputGroup` shell, styles the ProseMirror DOM via tokens.
- [ ] 5.2 Extract the payload from `getJSON()` + `selectedCommand`: `{ command, mentions (de-duped), segments (ordered) }`; `Enter` submits and clears, `Shift+Enter` newlines; placeholder when empty.
- [ ] 5.3 Co-located `chat-input.spec.tsx`: payload shape (command + mentions + positional segments), submit-clears, null-command case.

## 6. `@editor` — ChatMessageView (read-only, shared codec)

- [ ] 6.1 Add `composer/chat-message-view.tsx` → `ChatMessageView`: render the payload's `segments` over `composerKit()`'s schema read-only (same `MentionPill` via `toReact`/`render-to-react`), prepend the command `Badge` from `payload.command`.
- [ ] 6.2 Co-located `chat-message-view.spec.tsx`: the view's mention pill is the **same** `MentionPill` the input renders (no second render path); leading `Badge` on a command message.

## 7. `@editor` — public surface

- [ ] 7.1 Add the `composer/*` files to `@zeroxsolutions/editor`'s per-file `./*` subpath map (additive); no root barrel `export *`; confirm no `@ui → @editor` edge is introduced.

## 8. Storybook and verification

- [ ] 8.1 Add `apps/storybook/src/composer/` stories: `ChatInput` (editing — `@` menu, `/` command, submit) and `ChatMessageView` (rendering pills + badge), composed with the `@ui` chat shells.
- [ ] 8.2 `nx run-many -t lint build test` green; Storybook builds; the host's `test-storybook` covers the new stories.
- [ ] 8.3 Verify in a **real browser** against `storybook-static` (caret-anchored menu position, inline highlight, pill, command badge) — jsdom cannot measure layout; prove each visual test discriminates.

## 9. Release

- [ ] 9.1 Release `@zeroxsolutions/editor` as a **minor** bump via `nx release` (conventional commits) — additive `composer/*` subpaths, no removals.
