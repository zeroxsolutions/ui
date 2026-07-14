## 1. Spike — confirm the engine can host a minimal composer

- [x] 1.1 Verified `compile-features.tsx`: the substrate `Doc`/`paragraph`/`text` is **hardcoded** (`Doc` content `block+`), features are appended after it, and TipTap forbids a duplicate `doc` node — so the guessed "own doc node spec" fallback is **not viable** (name collision). Two honest paths recorded in `design.md`: (A) behavioral single-line, no core change; (B) configurable substrate, a small contained core change. **Decision pending maintainer pick (A vs B).**
- [x] 1.2 Verified the `Enter`-keymap seam: expressible via `advanced.engineExtensions` (`addKeyboardShortcuts`), and menus own `Enter` when open via capture-phase `document` listeners (as `slash-menu.tsx`), so composer `Enter → submit` fires only when no menu is open. Composes under both (A) and (B).

## 2. `@editor` — configurable doc substrate (path B) + composer kit

- [x] 2.1 Parameterize the substrate: `compileFeatures(features, { topContent })` builds `Doc` with content defaulting to `block+`; threaded a `topContent?: string` option through `createDocumentEditor` config and the `createEditor` builder (`topContent(expr)`). Default-preserving — the document editor stays `block+`.
- [x] 2.2 Added a core spec (`create-document-editor.spec.tsx`) proving `topContent: 'paragraph'` structurally forbids a second block (an inserted paragraph merges into the one block) and the default `block+` DOES admit one (the test discriminates); full `@editor` suite green (132 tests).
- [x] 2.3 Added `packages/editor/src/composer/composer-types.ts`: `ChatPerson`, `ChatCommand`, `ChatMention`, `ChatSegment`, `ChatMessagePayload` (positional segments; `command` nullable) + `segmentsToText` helper.
- [x] 2.4 Added `packages/editor/src/composer/composer-kit.ts` (+ `composer-kit.spec.tsx`, 4 tests): `StarterKit` reduced to `undoRedo` + `hardBreak` (marks/blocks off), `Placeholder`, composed with `mention()` on the `topContent: 'paragraph'` substrate; `Enter → submit` deferred to the React input (the `paragraph` schema makes `splitBlock` a structural no-op).

## 3. `@editor` — the `@` mention menu (near-clone of slash-menu)

- [x] 3.1 Add `composer/mention-menu.tsx`: `triggerQuery('@')` detection, `caretRect()` positioning in a `FloatingShell`, `setSlashDecoration` highlight of the typed `@query`, ↑/↓/Enter/Esc owned by the menu.
- [x] 3.2 Rows/empty/scroll are the design-system `Item` / `Empty` / `ScrollArea`; the people list comes from a caller prop (sync list or async query). No look-alike.
- [x] 3.3 On select: `deleteRange` the `@query`, then `insertMention({ id, label })`; the pill shows `label`, deletes as one atom.
- [x] 3.4 Co-located `mention-menu.spec.tsx`: select-inserts-pill, empty-state on no match, label-not-id.

## 4. `@editor` — the `/` command menu (mode Badge, surface state)

- [x] 4.1 Add `composer/command-menu.tsx`: `triggerQuery('/')` **restricted to input start**, `caretRect()` positioning, query filtering, keyboard nav; caller-supplied command list.
- [x] 4.2 On select: `deleteRange` the `/query` (insert nothing into the doc), lift the command into `ChatInput` surface state; render it as a design-system `Badge` pinned at the input's leading edge.
- [x] 4.3 `Backspace` at input start with an active command clears the state and removes the `Badge`; a mid-argument `/` stays literal.
- [x] 4.4 Co-located `command-menu.spec.tsx`: set-mode-on-select, clear-on-backspace, start-only, exactly-one-command.

## 5. `@editor` — ChatInput assembly and payload

- [x] 5.1 Add `composer/chat-input.tsx` → `ChatInput`: builds the editor over `composerKit()`, mounts the mention + command menus, holds `selectedCommand` state, renders the `Badge` chip inside the `@ui` `InputGroup` shell, styles the ProseMirror DOM via tokens.
- [x] 5.2 Extract the payload from `getJSON()` + `selectedCommand`: `{ command, mentions (de-duped), segments (ordered) }` (the shared `message-payload.ts` codec); `Enter` submits and clears, `Shift+Enter` newlines; placeholder when empty.
- [x] 5.3 Co-located `chat-input.spec.tsx`: payload shape (command + mentions + positional segments), submit-clears, null-command case.

## 6. `@editor` — ChatMessageView (read-only, shared codec)

- [x] 6.1 Add `composer/chat-message-view.tsx` → `ChatMessageView`: render the payload's `segments` over the shared `mention` codec read-only (same `MentionPill` via `toReact`/`render-to-react`), prepend the command `Badge` from `payload.command`.
- [x] 6.2 Co-located `chat-message-view.spec.tsx`: the view's mention pill is the **same** `MentionPill` the input renders (no second render path); leading `Badge` on a command message.

## 7. `@editor` — public surface

- [x] 7.1 Add the `composer/*` files to `@zeroxsolutions/editor`'s per-file `./*` subpath map (additive; the `./*` wildcard already mirrors `dist/`, so `composer/*` resolves at `@zeroxsolutions/editor/composer/*` with no manual entry); no root barrel `export *`; confirmed no `@ui → @editor` edge and no ProseMirror dep in `@ui`; engine-free `.d.ts` guard passes.

## 8. Storybook and verification

- [x] 8.1 Add `apps/storybook/src/composer/` stories: `ChatInput` (editing — `@` menu, `/` command, submit) and `ChatMessageView` (rendering pills + badge), composed with the `@ui` chat shells.
- [x] 8.2 `@zeroxsolutions/editor` `typecheck build test` green (this repo gates on `typecheck`, not `lint`); Storybook builds; the host's `test-storybook` covers the new stories (7 tests, real Chromium). NOTE: `@zeroxsolutions/storybook:typecheck` has **pre-existing** failures in unrelated stories (`pagination.stories.tsx`, `message-scroller.stories.tsx` — missing `variant`/`size`), not introduced by this change; the composer stories are type-clean.
- [x] 8.3 Verified in a **real browser** (Playwright + Chromium against `storybook-static`): 23/23 checks incl. discrimination — caret-anchored menu position (menu x follows the caret: 227px→506px), inline `@query`/`/query` highlight, atomic pill delete, start-only `/`, leading command Badge. See `verification.md`.

## 9. Release

- [ ] 9.1 Release `@zeroxsolutions/editor` as a **minor** bump via `nx release` (conventional commits) — additive `composer/*` subpaths, no removals.
