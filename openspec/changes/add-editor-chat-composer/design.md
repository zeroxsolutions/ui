# Design — add-editor-chat-composer

## Context

The composer is not a greenfield editor: it reuses `@zeroxsolutions/editor`'s engine façade
(`IEditor`), the `mention` node, the `FloatingShell` positioning surface, and the trigger
seams (`triggerQuery`, `caretRect`, `setSlashDecoration`). The `slash-menu.tsx` chrome is the
proven reference — the `@` menu is a near-clone of it, and the `/` command menu is an
adaptation. The design decisions below are the deltas from "just reuse slash-menu".

## Surface layout

`packages/editor/src/composer/` (a sibling of `document/`, `mermaid/`, `code/`), files
kebab-cased and role-named, one `MentionPill`-style component per responsibility:

- `chat-input.tsx` → `ChatInput` — the contentEditable input surface.
- `chat-message-view.tsx` → `ChatMessageView` — the read-only render.
- `mention-menu.tsx` → the `@` suggestion menu (near-clone of `slash-menu.tsx`).
- `command-menu.tsx` → the `/` command menu (adaptation of `slash-menu.tsx`).
- `composer-kit.ts` → the minimal feature kit (single textblock + text + history +
  placeholder + the submit keymap), reused by both `ChatInput` and `ChatMessageView`.
- `composer-types.ts` → `ChatPerson`, `ChatCommand`, `ChatMessagePayload`, `ChatSegment`.

Each is exposed at its own `@zeroxsolutions/editor/composer/*` subpath (per-file map, no
`export *`), consistent with `lib-public-exports-and-semver`.

## Decision: reuse the engine with a minimal composer kit (not the block document schema)

The document editor is `doc → block+ → …` with headings, lists, tables. A chat line is one
textblock of inline content (`text` + `mention` atoms) where `Enter` submits rather than
splitting a block. `composerKit()` builds:

- a document schema constrained to a **single textblock** (`content: "paragraph"`),
- inline content = `text` + the existing `mention` atom,
- `history` + `placeholder`,
- a keymap where `Enter` → submit (when no menu is open) and `Shift+Enter` → hard break.

**Risk / spike (verify before building):** the current `createEditor()` builder is exercised
only by `standardKit()` (block document). Whether it exposes (a) a constrained single-block
schema and (b) an `Enter`-keymap override cleanly must be verified against the builder
(`core/builder/create-editor.ts`) and the engine (TipTap). If the builder cannot express a
constrained schema, the smallest honest fix is a `composerKit` that supplies its own document
node spec — not a fork of the engine. This is the one real unknown; resolve it first.

## Decision: `/` command is surface state, not a document node

Claude/Cursor model the slash command as a **message mode**, not inline content: a leading
chip owns the whole message, and the remaining text is its argument. So the command is held as
**React surface state** on `ChatInput` (`selectedCommand: ChatCommand | null`), rendered as a
design-system `Badge` pinned at the input's leading edge (outside the ProseMirror DOM), and it
travels as a **top-level `command` field** in the payload. On select, the command menu deletes
the typed `/query` from the doc (via `deleteRange`, exactly as slash-menu does) and lifts the
command into state — it inserts nothing into the document. `Backspace` at input-start with an
active command clears the state.

This differs from the document slash menu, which runs a block-insert command and leaves the
doc changed. Rejected alternative: a leading command **atom node** in the doc — it would put a
message-level mode into inline content, complicate the payload extraction, and make
"exactly one command" a document invariant instead of a simple state flag.

**Start-only constraint:** `triggerQuery('/')` fires when `/` begins the block or follows
whitespace; the command menu additionally requires the trigger to sit at the block start (an
empty input or the very front of the argument), so a mid-argument `/` stays literal text.

## Decision: `@` mention is an atom node inserted via a slash-menu-style menu

The `mention` node already exists (atom pill `{ id, label }`, codec, `insertMention`). The
`@` menu is a near-clone of `slash-menu.tsx`: `triggerQuery('@')` drives detection,
`caretRect()` positions the `FloatingShell`, `setSlashDecoration` paints the typed `@query`
while open, keyboard nav (↑/↓/Enter/Esc) is owned by the menu because the editor keeps focus.
On select it runs `deleteRange({ from, to })` over the `@query` then `insertMention({ id,
label })`. The people list is a `ChatInput` prop (`people` or an async `onQueryPeople`), so the
surface ships no directory. Mentions can appear anywhere inline (unlike the start-only command).

The `setSlashDecoration` seam is "slash"-named but generic (`{ from, to, ghost }`); it is
reused for the `@query` highlight. No engine change is required.

## Decision: positional segments as the canonical payload

```ts
interface ChatMessagePayload {
  command: ChatCommand | null;            // the leading mode, or null
  mentions: ChatMention[];                // resolved { id, label }, de-duplicated
  segments: ChatSegment[];                // ordered: { text } | { mention: { id, label } }
}
```

The view MUST place each pill where it sits in the text, so a flat `text + mentions[]` (which
loses inline position) is insufficient — `segments` is canonical, and a flat `text` is derived
from it (`segments.map(s => s.text ?? '@'+s.mention.label).join('')`) when a caller wants a
plain string. `segments` is produced from the engine's `getJSON()` over the single paragraph;
`mentions` is the de-duplicated set of mention segments; `command` comes from surface state.

## Decision: one shared render path for input and view

Both `ChatInput` (editable `MentionView`) and `ChatMessageView` (static `toReact`) render the
mention through the **same** `MentionPill` — as the `mention` feature already does — so the
pill cannot drift. `ChatMessageView` builds a read-only editor (or `render-to-react`) over
`composerKit()`'s schema from the payload's `segments`, and prepends the command `Badge` from
`payload.command`. The command `Badge` is likewise one component shared by the input chip and
the view chip.

## Design-system fidelity (rules applied)

- The two menus are the **sanctioned bespoke** surface (`ui-from-design-system`: a
  caret/virtual-anchored popup whose focus is owned by the editor) — a `FloatingShell` shell
  only; every row/empty/scroll inside is `Item` / `Empty` / `ScrollArea`.
- The command chip is the design-system `Badge`; the mention pill uses the `primary` token
  pair — **no hand-rolled look-alike** and **no hardcoded colour** (`ui-primitive-fidelity`).
- The ProseMirror DOM is the sanctioned "foreign engine rides tokens" exception, like
  CodeMirror's `.cm-scroller`.
- No edit to any vendored `components/ui/*`. `@ui` is composed forward; no `@ui → @editor`
  edge.
- If a coordinating shell is ever authored in `@ui`, it is a compound (cva variants exported,
  `data-slot`, Base UI `render`, never a prop-bag or Radix `asChild`) — but the first cut
  assembles from the existing `InputGroup`, so none is needed (`ui-compound-authoring`).

## Out of scope / deferred

- Copilot ghost typeahead in the rich input — the textarea `ChatComposerGhostText` stays for
  lite surfaces; a decoration-based typeahead is a separate feature.
- Multi/nested commands, a command/people registry, message-list/streaming orchestration,
  markdown round-trip of mentions/commands beyond the codec's existing `@label`.

## Testing / verification

- Vitest specs co-located (`.spec.tsx`) at the interface seams: mention insert-on-select,
  command set/clear state, payload extraction from `getJSON()`, view↔input pill identity.
- New `composer/` Storybook stories (`ChatInput` editing, `ChatMessageView` rendering) covered
  by the host's `test-storybook` target (no `-e2e` sibling).
- Because the value is visual (inline highlight, pill, caret-anchored menu, badge), verify in
  a **real browser** against `storybook-static` (jsdom cannot measure caret/layout), and prove
  each test discriminates before claiming done.
