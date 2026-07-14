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
- `command-node.tsx` → the `slashCommand()` inline `/command` node feature (mirrors `mention()`).
- `composer-kit.ts` → the minimal feature kit (single textblock + text + history +
  placeholder + the submit keymap), reused by both `ChatInput` and `ChatMessageView`.
- `composer-types.ts` → `ChatPerson`, `ChatCommand`, `ChatCommandRef`, `ChatMessagePayload`,
  `ChatSegment`.

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

**Spike result (resolved 2026-07-13).** The compiler hardcodes the substrate:
`compile-features.tsx` always prepends `Doc = Node.create({ name: 'doc', topNode: true,
content: 'block+' })` plus `paragraph`/`text`, and `createDocumentEditor` hardcodes
`EMPTY_DOC = doc > paragraph`. A feature's `advanced.engineExtensions` are appended **after**
that substrate, and TipTap forbids two nodes named `doc` — so the originally-guessed fallback
(a `composerKit` that *supplies its own doc node spec*) is **not viable** (name collision). The
`Enter`-keymap side is fine: it is expressible via `advanced.engineExtensions`
(`addKeyboardShortcuts`), and the menus already own `Enter` when open via capture-phase
`document` listeners (as `slash-menu.tsx` does), intercepting before ProseMirror. Two honest
paths remain for "single textblock" — **this is the open decision**:

- **(A) Behavioral single-line, no core change.** Keep the compiler's `doc: block+`.
  `composerKit` injects (via `advanced.engineExtensions`) `StarterKit.configure({ … })` reduced
  to `history` + `hardBreak`, `Placeholder`, and a per-instance keymap `Extension` — `Enter →
  onSubmit()+return true` (swallow the split), `Shift-Enter → setHardBreak`; inline = `text` +
  the existing `mention()` atom. Nothing loads a second block feature, so in practice the doc is
  one paragraph. Residual edge: a multi-block **paste** could introduce a second block (mitigate
  with a `clipboardTextParser`/paste guard). Touches only `composer/`.

- **(B) Configurable substrate, a small contained core change.** Parameterize the hardcoded top
  node: `compileFeatures(features, { topContent })` with `Doc` content defaulting to `block+`,
  threaded from a new `createDocumentEditor`/builder option; the composer passes `'paragraph'`.
  The schema then **structurally** forbids a second block (ProseMirror's `splitBlock` no-ops) —
  the correct realization of the spec's "single textblock, not the block document schema", with
  no paste edge. Default stays `block+`, so the document editor is unaffected; blast radius is
  one function (`compile-features.tsx`) plus one threaded option on the builder/`createDocumentEditor`.

Decision: **(B) chosen** (maintainer, 2026-07-13) — parameterize the substrate so the
single-textblock constraint is structural. `compileFeatures(features, { topContent })` with
`Doc` content defaulting to `block+`; a `topContent?` option is threaded through
`createDocumentEditor` and the `createEditor` builder; the composer passes `'paragraph'`. The
document editor passes nothing and stays `block+`, so it is unaffected. See tasks 2.1–2.2.

## Decision: `/` command is a Discord-style inline node (REVISED)

The command is a **Discord-style inline document node** that still reads `/name` — a leading
`command` atom node, a sibling of `mention`, committed in place of the typed `/query`. The
earlier "surface-state Badge" model (a `selectedCommand` React state rendered as a `Badge` at
the input edge, the whole message its argument) was **rejected after review**: it dropped the
`/image-gen` identity into a relabelled "Image" chip, matched no mainstream product (Discord
keeps `/name` visible as an atomic token; Slack keeps it literal text), and required no
auto-detect. The revision keeps an **atomic token** — for a resolved command id in the payload
and a single deletable unit — but makes it inline and literal.

On commit (Tab / Enter / click, **or** typing the full slug + Space — the Discord-style
auto-detect), the menu deletes the `/query` (via `deleteRange`) and runs `insertCommand({ id,
label, name })`, inserting the inline `/name` pill. **Backspace** on the committed pill deletes
the node and restores the editable `/name` text (re-opening the menu). The command therefore
lives **in the document**, so `docToPayload` derives it from `getJSON()` and the one shared
codec renders it identically in `ChatInput` and `ChatMessageView` — no surface state, no drift.

The command's `name` slug (falling back to `id`) is the token typed after `/` and shown in the
pill; the human `label` and `description` stay menu-only. `ChatCommand.name` is the slug, and a
`{ command: ChatCommandRef }` segment carries it in the payload.

**Start-only / one-command constraint:** `triggerQuery('/')` fires when `/` begins the block or
follows whitespace; the menu additionally requires `slashAtInputStart` (the first inline node is
text starting with `/`). A committed command node at the front makes that false, so the line
holds at most one command and a mid-line `/` stays literal text.

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
  command: ChatCommandRef | null;         // the leading command, derived from segments
  mentions: ChatMention[];                // resolved { id, label }, de-duplicated
  segments: ChatSegment[];                // ordered: { text } | { mention } | { command }
}
```

The view MUST place each pill where it sits in the text, so a flat `text + mentions[]` (which
loses inline position) is insufficient — `segments` is canonical (a `command` only ever leads),
and a flat `text` is derived from it (`segmentsToText`) when a caller wants a plain string.
`segments` is produced from the engine's `getJSON()` over the single paragraph; `mentions` is
the de-duplicated set of mention segments; `command` is the leading `command` segment (derived,
like `mentions` — no surface state).

## Decision: one shared render path for input and view

Both `ChatInput` (editable node view) and `ChatMessageView` (static `toReact`) render each pill
through the **same** component — the `mention` and `command` features each ship one shared pill
used by both surfaces — so nothing can drift. `ChatMessageView` renders the payload's `segments`
via `renderToReact` over the `mention` + `command` codec registry; the leading `/command` is an
inline node in `segments`, so it renders in place (no separate badge).

## Design-system fidelity (rules applied)

- The two menus are the **sanctioned bespoke** surface (`ui-from-design-system`: a
  caret/virtual-anchored popup whose focus is owned by the editor) — a `FloatingShell` shell
  only; every row/empty/scroll inside is `Item` / `Empty` / `ScrollArea`.
- The `/command` and `@mention` pills are inline nodes on the composer accent (a scoped,
  dark-aware `--composer-accent` CSS variable, the one deliberate exception to the monochrome
  tokens) — **no hand-rolled look-alike** and **no hardcoded colour** (`ui-primitive-fidelity`);
  the command pill adds a hairline accent ring to read as distinct from a mention.
- The ProseMirror DOM is the sanctioned "foreign engine rides tokens" exception, like
  CodeMirror's `.cm-scroller`.
- No edit to any vendored `components/ui/*`. `@ui` is composed forward; no `@ui → @editor`
  edge.
- If a coordinating shell is ever authored in `@ui`, it is a compound (cva variants exported,
  `data-slot`, Base UI `render`, never a prop-bag or Radix `asChild`) — but the first cut
  assembles from the existing `InputGroup`, so none is needed (`ui-compound-authoring`).

## Out of scope / deferred

- Copilot ghost typeahead: the canonical ghost is now the rich composer's inline widget
  decoration (`setSlashDecoration({ ghost })`), used by the `@`/`/` menus. The old textarea
  mirror-overlay (`ChatComposerGhostText`) was **removed** — superseded by that inline
  decoration and unable to work with the ProseMirror composer (it was hard-bound to a textarea).
- Multi/nested commands, a command/people registry, message-list/streaming orchestration,
  markdown round-trip of mentions/commands beyond the codec's existing `@label`.

## Testing / verification

- Vitest specs co-located (`.spec.tsx`) at the interface seams: mention insert-on-select,
  command commit-to-inline-node (Tab/Enter/space) + backspace-restore, the `command` node codec
  round-trip, payload extraction from `getJSON()`, view↔input pill identity.
- New `composer/` Storybook stories (`ChatInput` editing, `ChatMessageView` rendering) covered
  by the host's `test-storybook` target (no `-e2e` sibling).
- Because the value is visual (inline highlight, pills, caret-anchored menu, the `/command`
  commit/restore), verify in a **real browser** against `storybook-static` (jsdom cannot measure
  caret/layout), and prove each test discriminates before claiming done.
