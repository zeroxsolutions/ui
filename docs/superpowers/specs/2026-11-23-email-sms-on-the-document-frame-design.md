# Email and SMS editors on the document editor's frame

Decided 2026-11-23 with the owner. Revises `2026-11-20-editor-profiles-design.md`: its "Where the email
schema lives (call made by the writer)" section is withdrawn, and the parts below replace what that
spec left to the builder about the editors' chrome, blocks and preview. Everything else in it stands:
the profiles, variables, validation, inline markup, the `email-blocks` and `sms-text` wire shapes, block
ids, required blocks, locked structure and the template code in `editor-core`.

## Why

The owner asked for the email and SMS editors as extensions of the Document Editor. What shipped in 0.1.x
is a second editor: `emailKit` assembles its own engine extensions instead of `standardKit`, rewrites
paragraph, list, callout, code and divider as email-only nodes, turns the drag handle off (no grip, no
"+"), replaces the block menu with a caret-bound "..." button, puts attribute controls inside the
document, lines up its own toolbar, and stacks a fixed white preview iframe under the editor. Side by
side with the Document Editor it reads as a different product.

## Goals

1. The Document Editor's frame: `Editor` with `standardKit`'s drag handle, the "+" that opens the slash
   menu, `EditorToolbar`, `BubbleMenu` and `SlashMenu`, themed by Editor Theme. An email or SMS editor placed beside a Document Editor looks and behaves the same in
   every part they share.
2. The Document Editor's blocks, reused: paragraph, bullet and ordered list, divider, `editor-callout`,
   `editor-code-block` and `editor-link`, with their node views. The email profile adds only what the
   document has no block for: the button, the columns with lanes, the html block and the variable chip.
3. The profile narrows, it does not fork: the slash menu, toolbar and bubble offer only the items the
   profile holds, and what reaches the document anyway (a paste, an import) and that the export cannot
   carry is a `validate` problem marked in place, never a silently different node.
4. A click on the grip opens the block menu, as in Notion, in the Document Editor itself: `Editor` draws
   the features' `blockMenu` contributions (turn into, duplicate, delete) in the house `DropdownMenu`
   anchored to the grip, and a drag still drags. Today the grip only drags and the standalone `BlockMenu`
   with its own handle is used nowhere; it is folded into the grip. The email profile's attributes
   (`align`, `spaceAfter`, `tone`, `width`, `ratio`, a button's link) are items of that menu. Nothing the
   author does not type sits inside the document flow.
5. The preview is part of the editor, as the Mermaid editor's is. The frame is the Document Editor's: the
   `EditorToolbar` above the document and nothing around it, no card, header or divider. With a renderer,
   `Tabs` ("Edit" / "Preview", host-worded) switch between the editor and the rendered email at every
   width, drawn as a Mermaid block's View/Edit switch is and placed at the end of the toolbar's row. The
   preview is drawn only with a renderer; without one the frame shows the editor alone.
   Revised 2026-11-23 after the owner's review: the frame is the Document Editor's, not a card.
   Revised 2026-11-23 after the owner's review: always tabs, like the code blocks. The `layout` prop and
   the resizable split are gone.
6. The SMS editor is the same frame with the SMS profile: paragraph text and variables, no block menu
   items beyond the variable, and the segment meter under the text, aligned with the text.
7. The docs pages follow the Document Editor page's outline (demo, Installation, Usage, API reference)
   and say what the component does; travel's own wiring leaves the design system's docs.

## Non-goals

- The wire shapes. `EditorEmailBlock[]` and the SMS body string are byte-for-byte what 0.1.x exports, so
  travel's stored templates and its switch (#1288) keep working; the round-trip tests stay as they are.
- New blocks (project 2) and block presets (project 3).
- The native editor (project 4); it follows this one.

## Anti-goals

- A second copy of any document block, node view, menu or toolbar under `profiles/`.
- A host having to compose Tabs, panels or a preview to get the editor the docs show.
- A control drawn inside the document for something the block menu can hold.

## Design

### Blocks

| Email kind  | Node                      | Owner                      |
| ----------- | ------------------------- | -------------------------- |
| `paragraph` | the document paragraph    | `standardKit`              |
| `list`      | bullet and ordered list   | `standardKit`              |
| `divider`   | horizontal rule           | `standardKit`              |
| `callout`   | the callout               | `editor-callout`           |
| `code`      | the code block            | `editor-code-block`        |
| `button`    | `emailButton`             | email profile              |
| `columns`   | `emailColumns` with lanes | email profile              |
| `html`      | `emailHtml`               | email profile              |
| link mark   | the link                  | `editor-link`              |
| variable    | `variable` chip           | profiles (shared with SMS) |

- The email attributes are global attributes the email profile adds to the reused nodes, so the document
  profile's own schema does not change.
- The `email-blocks` codec reads and writes the reused nodes. Where a reused block can hold more than an
  email block carries (a list item with two paragraphs or a nested list, a heading, a task list, a table,
  a code block's language), the email profile does not offer it, and `validate` names it in place when a
  paste or an import brings it in.
- The SMS profile holds paragraphs, hard breaks and variables only.

### Chrome

- `emailKit` and `smsKit` become profile features passed beside `standardKit` and the reused features;
  they keep the drag handle on and add no engine extension the document kit already has.
- `BlockAttributesMenu` and its "..." trigger are removed; the attributes become block menu items the
  email profile contributes, each disabled with its reason under locked structure or on a required
  block, as Delete is today.
- The URL variable picker and the variable menu become toolbar items in the one `EditorToolbar` row,
  drawn like its other items.
- Problem markers sit in the block's gutter row and never overlap a block's content; the variable chip
  marks an undeclared name with the design system's destructive token, not an underline.
- Icons are the registry's animated icons, as in the Document Editor.

### Preview

- `EmailEditor` draws the renderer's HTML in a sandboxed iframe under the Preview tab, on a muted canvas,
  as tall as the email and as wide as the editor, so the email's narrow-screen rules apply wherever the
  editor is narrow.
- The iframe's background follows the renderer's theme; the canvas around it follows Editor Theme. The
  email's `prefers-color-scheme` rules are answered for the theme around the editor: dark inside a `.dark`
  scope, light otherwise, following a theme switched later. `EmailTheme` takes an optional `dark` palette
  that the renderer emits as those rules.
- On the Preview tab the toolbar's row holds only the tabs. The sender, subject and preheader sit above the
  email as an inbox lists them. Added 2026-11-23 after the owner's review of the bare page.
- Revised 2026-11-24 after the owner's review: device and theme switches belong to every docs preview, not
  to the email preview. Each docs preview with a view page has a Desktop, Tablet and Mobile switch and a
  Light and Dark switch. Desktop in the site's theme draws the demo inline; any other choice frames the
  demo's view page at the device's width (768px, 375px, or the stage's for Desktop), in the theme its
  `?theme=` forces.
- Before hydration the editor draws its starting document from the JSON, with no engine, so the page does
  not show an empty stage until the client has loaded the editor.
- The frame runs scripts at an opaque origin under a nonce policy that admits only its height report.

## Testing

- The existing round-trip, validation, markup, meter and browser specs pass unchanged against the
  rebuilt editors.
- A browser spec that a grip click opens the block menu and a grip drag still moves the block, in the
  Document Editor.
- A browser spec per profile editor that the grip, the "+" and the block menu are the Document Editor's
  (same slots and labels) and that each attribute item sets its attribute.
- A browser spec that a pasted heading, task list and two-paragraph list item are marked as problems.
- A spec that the Edit and Preview tabs switch at a wide and a narrow viewport, keeping the one editor.
- Before and after screenshots of both docs demos in light and dark, beside the Document Editor demo,
  attached to the pull request.
