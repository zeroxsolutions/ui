# zui native, wave 3: the data items

The first spec, `2026-11-09-zui-native-zui-ports-design.md`, governs this wave: same names, parts and props, same
`cn-` tokens, static icons, all 16 registries, a demo, a docs page and a spec per item. Wave 2's spec,
`2026-11-10-zui-native-ports-wave-2-design.md`, set how tests are written and how a copied lib is checked
against its source; this wave keeps both. This spec decides what those left open for the eight items of wave 3:
tree-item, file-tree, code-card, markdown-view, data-table, data-table-column-header, model-list and
resize-handle.

## Per item

**tree-item.**

- The parts and props are the web's.
- `leaf` joins `expanded` in the item's context, because the web shows the leaf spacer and turns the chevron
  through group-data selectors, which the native build cannot draw.
- `TreeItemIndent` pads by `depth` times 12px, computed in code; the web reads a CSS variable inside `calc()`.
- `TreeItemRenameInput`:
  - The return key commits, and so does leaving the field.
  - Escape cancels through `onKeyPress`, where the platform reports it, as in wave 2's number-field.
  - The web's IME guard has no React Native equivalent and is dropped. Expo Go checks a Vietnamese and a
    Japanese keyboard.
- A press on the trigger reaches the trigger alone, since a press goes only to the innermost pressable.

**file-tree.**

- The parts and props are the web's, including `role` `tree`, `treeitem` and `group`, with `aria-level`,
  `aria-expanded` and `aria-selected`.
- iOS maps the tree roles to no trait, so there a row announces its name and its selected and expanded states
  only. That goes on the Expo Go list.
- The web walks the DOM for its keyboard model, so the native tree tracks each item in its context, in
  render order. It moves focus through refs on ArrowUp, ArrowDown, Home, End, ArrowLeft, ArrowRight, Enter
  and Space, wherever the platform reports keys: the web and a hardware keyboard.
- On a touchscreen, a press selects a row and toggles a folder, as a click does on the web.

**code-card.**

- The parts and props are the web's. `CodeCardActions` always shows, since a phone has no hover to reveal it.
- It composes native items that already exist:
  - `CollapsibleCard` and `CopyButton`;
  - for the code, native `CodeBlockContent` with the `useHighlightedCode` hook and its highlighter, which
    already runs Shiki on Hermes. A card must not load a second highlighter.
- What that costs, compared with the web:
  - Only that highlighter's 13 languages are coloured; any other language shows as plain text.
  - Its colours are GitHub light and dark, not the web's token-linked code theme. A card on a phone and a card
    on the web colour the same code differently.
- `lines`, the web's pre-tokenized input, still draws each token in its own colour.
- `languageLabel` and `isPlainLanguage` come from a native copy of the web's `lib/code-language`. A spec
  compares the copy with the web's output, so a language reads the same name on both.
- `CodeCardLanguage` draws the label alone: wave 2 left out the code-language icons.

**markdown-view.**

- `MarkdownView` takes the web's `children` string and stays memoized, so a streaming chat re-renders only the
  message that changed.
- How it parses and renders:
  - It parses with `unified`, `remark-parse` and `remark-gfm` into an mdast tree.
  - It renders that tree itself, a native part for each node: headings, paragraphs, emphasis, strong,
    strikethrough, links, lists with their numbers and task checkboxes, blockquotes, rules, images through
    `expo-image`, tables through native `Table`, inline code, and fenced code through `CodeCard`.
  - The web goes through `react-markdown`, whose output is DOM tags; React Native cannot render those
    without a part for every tag, and the hast stage between would add packages to no purpose.
- Raw HTML is dropped, as on the web.
- A link opens through `Linking` only if it passes the same protocol filter as react-markdown's
  `defaultUrlTransform` (http, https, irc, ircs, mailto, xmpp). A spec compares the two over a list of URLs.
- Each node carries the classes the web gives its element through the root's descendant selectors, written on
  the node itself, since React Native has no such selector.
- Expo Go checks that micromark's Unicode property escapes run on Hermes.

**data-table.**

- The parts are the web's. The table instance is still the caller's `useReactTable`; the item only renders it.
- `@tanstack/react-table` is added to native-ui. It is headless and runs unchanged on React Native.
- Native `Table` lays a row's cells out at equal widths in a horizontal scroller, with no `colSpan`. Three
  consequences:
  - A column is as wide as the others unless the caller sets a width on its cells.
  - `DataTableEmpty` spans the body as one block, not as a cell.
  - Grouped headers that span columns are not supported. The docs page says so.
- `DataTableViewOptions` uses the native DropdownMenu's checkbox items.

**data-table-column-header.**

- The parts, copy and sort and hide actions are the web's, with `onPress` for `onClick`.
- A caller's handler runs first, and preventing its default skips the action, as on the web.
- The icons are lucide's static `ArrowUp`, `ArrowDown`, `ChevronsUpDown` and `EyeOff`.

**model-list.**

- The parts are the web's: `ModelListTitle` is a heading, and `ModelListContent` a native ScrollArea.
- Two web classes reach into descendants, which the native build cannot draw. The docs page shows the caller
  writing each one on the element itself:
  - one dims an `Item` marked unavailable;
  - one stretches a tabs list across the header.

**resize-handle.**

- `onDrag(dx)`, `onToggle`, `value`, `min`, `max` and `step` keep the web's meaning.
- It drags as native `resizable` does:
  - with the responder system, measuring from the screen position so the delta stays steady while the panel
    moves under the finger;
  - with a scrolling parent unable to take the touch;
  - with `hitSlop` for a finger-sized target.
- The drag starts after the web's 4px, from a native copy of `lib/resize-drag`.
- A double tap toggles, and so does Enter where the platform reports it. The arrows resize where it reports
  them.
- A screen reader adjusts it by `step` through the increment and decrement actions.
- `dx` is not flipped in right-to-left layouts, as on the web.

## Dependencies

- `@tanstack/react-table`, `unified` and `remark-gfm` are now declared by both `packages/ui` and native-ui, so
  each moves to the default catalog and both take it from there.
- `remark-parse` has one declarer and stays native-ui's own pin.
- `@tanstack/react-table` declares `react-dom` as a peer, which an Expo app without web support lacks. The
  data-table docs page says the warning is harmless.

## Tests

As in wave 2:

- Specs assert what a reader gets and what a press or typed text calls, through `userEvent`, never a class.
- Each case is seen red before its code.
- Each copied lib is compared with its web source.

The bulk falls on four items:

- **markdown-view:** each node kind renders as its part, raw HTML is dropped, and an unsafe link does not open.
- **data-table:** sorting, paging, column visibility and the empty state, driven through a real
  `useReactTable`.
- **file-tree:** selecting, expanding and the controlled and uncontrolled values.
- **code-card:** the copy, the label and the plain-text fallback.

What jest cannot press or type runs in a real browser, in the native zone's e2e:

- file-tree's arrow keys;
- tree-item's Escape;
- resize-handle's mouse drag and arrows;
- data-table-column-header's prevented default.

The Expo Go list for the pull request:

- the drag with a finger;
- the tree on VoiceOver and TalkBack;
- renaming with an IME keyboard;
- markdown on Hermes;
- a wide data table scrolling sideways.

## Batches

1. tree-item, model-list, data-table-column-header and resize-handle, which need no new package.
2. data-table, with `@tanstack/react-table`.
3. code-card, with the code-language lib.
4. markdown-view, with the remark packages.
5. file-tree.

## Not in this wave

- Code-language icons.
- Highlighting beyond the native highlighter's 13 languages.
- Grouped table headers.
- Virtualized rows.
