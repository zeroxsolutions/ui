## Why

The repo already carries both halves of a chat surface, but not the piece that joins
them. `@zeroxsolutions/ui` ships a presentational chat kit (`components/chat/*`:
`ChatMessageShell`, `ChatEmptyState`, `ChatComposerAttachments`, `ChatAttachmentChip`,
`ChatComposerGhostText`) plus `Message*` / `MessageScroller`. `@zeroxsolutions/editor`
ships the ProseMirror engine with an inline `/` slash menu (`document/ui/slash-menu.tsx`),
a `mention` node (the `@label` pill + codec + `insertMention`), and engine seams already
declared generic over `@` — `triggerQuery(char)`, `caretRect()`, `setSlashDecoration(...)`.

What is missing is a **chat composer input** that highlights `/` commands and `@` mentions
inline, and a **matching message view** that renders those tokens back. Today "the input"
is not a component at all — it is a bare `@ui` `<textarea>` assembled in a single Storybook
story. A `<textarea>`'s content is one uniformly-styled string, so it **cannot** paint a
`/` token, carry a resolved `@` mention as a single deletable pill bound to an id, or pin a
command-mode chip. The requested behavior is therefore unreachable by patching the textarea;
it needs a contentEditable surface, which — like the CodeMirror relocation already in
flight — belongs in `@editor`, never in the base design system.

The two surfaces are a matched pair and MUST share one schema/codec, or the pill/badge
render drifts between edit and view. The existing `mention` feature already models the
correct shape: one `MentionPill` serves both the editable `MentionView` and the static
`toReact` codec.

## What Changes

- **Add a `composer/` surface to `@zeroxsolutions/editor`** (a sibling of `document/`,
  `mermaid/`, `code/`): a contentEditable **`ChatInput`** — a single textblock, `Enter`
  submits / `Shift+Enter` newlines, with a placeholder — built on the existing engine plus a
  minimal composer kit; and a read-only **`ChatMessageView`** that renders the same content.
- **`@` mention trigger menu** — the one genuinely missing piece. Typing `@` opens a
  caret-anchored suggestion menu; picking an item inserts a **resolved mention pill** carrying
  `{ id, label }` and showing `label`. Reuses the existing `mention()` node, `triggerQuery('@')`,
  and `caretRect()`; the menu is a bespoke `FloatingShell` (the sanctioned caret-anchored
  surface) whose rows/empty/scroll are the design-system `Item` / `Empty` / `ScrollArea` — a
  near-sibling of `slash-menu.tsx`. The people list is caller-supplied.
- **`/` command mode** — Claude/Cursor-style, distinct from the document slash menu (which
  inserts a block). Typing `/` at the input start opens a command menu; picking an item sets a
  **single command mode** rendered as a design-system **`Badge`** chip pinned at the input
  start, with the rest of the input as that command's argument; `Backspace` at the start
  clears it. The command is **surface state**, not inline document content. The command list is
  caller-supplied.
- **Structured submit payload** — `onSubmit` emits an object `{ command, mentions, segments }`
  (positional `segments` so the view can place pills; a flat `text` is derivable). The input
  clears on submit.
- **`ChatMessageView`** renders `@mention → pill` and `/command → Badge` from the same
  schema/codec as the input — the same `MentionPill`, no look-alike.
- **`@ui` composes forward**: the composer is assembled from the existing `InputGroup` (shell),
  `Badge` (command chip), and the chat attachment parts; `ChatMessageShell` / `Message` host the
  `ChatMessageView` body. No `@ui → @editor` dependency edge is introduced; the ProseMirror DOM
  rides the design tokens (the sanctioned foreign-engine exception).

## Success Criteria

- Typing `@` opens the mention menu; selecting inserts a pill `{ id, label }` showing `label`;
  the pill deletes as one unit. Typing `/` at the start opens the command menu; selecting pins a
  `Badge` command chip; `Backspace` at the start clears it. Both are positioned at the caret.
- `Enter` submits `{ command, mentions, segments }`; `Shift+Enter` newlines; the input clears.
- `ChatMessageView` renders the same mention pills and command badge from the payload, using the
  **same** `MentionPill` as the input — verified identical, no second render path.
- `@zeroxsolutions/ui` gains **no** TipTap/ProseMirror dependency; there is **no**
  `@ui → @editor` import edge; `@editor` composes `@ui` forward.
- New per-file public subpaths under `@zeroxsolutions/editor/composer/*`; no `export *` barrel of
  internals.
- `nx run-many -t lint build test` is green and Storybook builds; the composer and view are
  verified rendering in a real browser (not just jsdom).

## Non-Goals

- No Copilot-style ghost typeahead inside the rich input — the textarea-based
  `ChatComposerGhostText` stays for lite surfaces; a decoration-based typeahead is a separate
  future feature.
- No multi-command or nested commands — exactly one command mode per message.
- No mention/command **data** — the people list and command list are caller-supplied (may be
  async); the surface ships no directory and no command registry.
- No message list / streaming / conversation orchestration — `MessageScroller` and the chat
  shells already own that; the composer only produces one payload and the view renders one body.
- No change to the `document` block editor, `mermaid`, or `code` surfaces.
- No new markdown round-trip for mentions/commands beyond the mention codec's existing
  honest-but-lossy `@label`.
- No worktree/branch — work proceeds on `master` per the maintainer's standing instruction.

## Capabilities

### New Capabilities

- `editor-composer`: `@zeroxsolutions/editor` owns a chat composer input (`ChatInput`) and a
  matching read-only message view (`ChatMessageView`). The input highlights inline `@` mentions
  (resolved `{ id, label }` pills via a caret-anchored menu) and a leading `/` command mode
  (a design-system `Badge`), submits a structured object payload, and both surfaces render from
  one shared schema/codec so the pill/badge cannot drift. `@ui` is composed forward only, and
  the base design system carries no ProseMirror dependency.

## Impact

- **Packages** — `@zeroxsolutions/editor`: new `src/composer/` (`ChatInput`,
  `ChatMessageView`, the `@` mention menu, the `/` command menu, a minimal composer kit),
  reusing `mention()`, `FloatingShell`, and the trigger/caret/decoration seams.
  `@zeroxsolutions/ui`: no new code required — `InputGroup`, `Badge`, and the chat parts already
  exist; the bare `<textarea>` composer is **superseded** for the highlight case, not deleted.
- **Public surface** — additive: new per-file subpaths `@zeroxsolutions/editor/composer/*`
  (minor bump). No removals, no breaking change.
- **Dependencies** — none new in `@ui`; `@editor` already depends on TipTap.
- **Storybook** — new `composer/` stories (`ChatInput` editing, `ChatMessageView` rendering),
  covered by the host's `test-storybook` target; no `-e2e` sibling.
