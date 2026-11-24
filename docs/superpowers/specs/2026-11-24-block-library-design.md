# Block library (project 2)

Decided 2026-11-24 with the owner. Project 2 of the editor programme (`2026-11-20-editor-profiles-design.md`):
a block library wider than Notion's, for the Document Editor and the email editor. Builds on
`2026-11-24-email-renderer-css-and-blocks-design.md` (`defineEmailBlock`, primitives, product CSS).

## Why

Authors in both editors run out of blocks. The Document Editor lacks columns, buttons, cards, bookmarks,
files, media and a table of contents. The email editor lacks headings, quotes, images, tables, spacers,
social links, a hero, cards and a legal footer, so a product cannot build a header with a banner or a footer
with social icons (travel's mail layout today takes paragraph, list, callout, divider and columns only).

## Goals

1. The blocks in the table below, each in the editors marked, with the Document Editor's look in the
   editor (frame spec) and, for email, a render that holds up in common mail clients and takes the product's
   CSS like every default block.
2. One definition per block. A block both editors hold is declared once (fields, attributes, label, icon)
   and gives the Document Editor its node and the email profile its block and render. This is the API a
   product uses for its own blocks too (travel's travel-specific blocks).
3. Every block is reachable the way existing blocks are: the slash menu, the "+" and the block menu (turn
   into, attributes), with host-worded labels.
4. Docs: a "Block library" overview page, and a section per block on its editor's page or its own page,
   each with a live demo.

## Non-goals

- Business blocks (itineraries, bookings, place cards): products define those with the API (owner's call).
- Native (project 4) and block presets (project 3), which follow.
- Database views, synced blocks, comments.

## Anti-goals

- A block drawn one way in the editor and another in the Viewer or an export.
- A second copy of a block for the other editor.
- An email block that a common client (Gmail web and app, Apple Mail, Outlook desktop and web) breaks.

## The library

| Block                             | Document | Email | Notes                                                    |
| --------------------------------- | -------- | ----- | -------------------------------------------------------- |
| Heading 1-3                       | has      | new   |                                                          |
| Quote                             | has      | new   |                                                          |
| Image (caption, link)             | has      | new   | email: https URL, alt required, width                    |
| Button                            | new      | has   | document: a link button                                  |
| Columns                           | new      | has   | document: lanes of blocks, stacking on narrow            |
| Table                             | has      | new   | email: simple table, no merged cells                     |
| Spacer                            | -        | new   | fixed heights                                            |
| Social links                      | -        | new   | a row of icon links; icons are hosted PNGs               |
| Hero                              | -        | new   | large image, heading, text, button                       |
| Card (image, title, text, button) | new      | new   | products, places, articles                               |
| Bookmark (link card with preview) | new      | -     | title, description, image read by the host               |
| File attachment                   | new      | -     | name, size, download link                                |
| Video / Audio                     | new      | -     | email would show a linked thumbnail; not in this project |
| Table of contents                 | new      | -     | from the document's headings                             |
| Toggle heading                    | new      | -     | a heading that folds what follows                        |
| Legal footer / unsubscribe        | -        | new   | required variables (e.g. unsubscribe url)                |

## Approaches

1. One shared definition for both editors (owner picked): generalise `defineEmailBlock` into a block
   definition that may carry a document side, an email side or both, from one schema.
2. Two separate sets (document features as today, email through `defineEmailBlock`): faster to start; the
   shared blocks drift.

## Design

### The definition

- `defineBlock({ type, label, icon, fields, attributes, document?, email? })` in `editor-core`, UI-free.
  `fields` and `attributes` use the kinds `defineEmailBlock` has (`richText`, `plainText`, `link`,
  `imageUrl`, `lanes`; `choice`, `toggle`, `number`), plus what the library needs (e.g. a list of items for
  social links, a heading level). `email.render` draws with the primitives. `document` declares the node's
  codecs (Markdown and HTML, as the document features have) and how the Viewer renders it read-only.
- `defineEmailBlock` becomes `defineBlock` with an email side only, so nothing a product wrote breaks.
- In the ui registry, `blockFeature(definition, { view })` turns a definition into a Document Editor
  feature, with a React node view in the Document Editor's look. Each library block ships its view. The
  email profile takes the same definitions for its email side (`emailProfile({ blocks })`,
  `EmailEditor` `blocks`).

### Existing blocks gaining the other editor

- Heading, quote, image and table already exist as document nodes. The email profile maps them to new email
  block types (`heading`, `quote`, `image`, `table`) through its codec, as it maps paragraph and callout
  today, and the renderer gains their default email blocks. The wire gains types; nothing stored changes.
- Button and columns exist as email nodes. The Document Editor gains them as document features, drawn as
  the email editor draws them, with Markdown/HTML codecs.

### Packaging

- Each library block is a registry item, `@zui/editor-<block>`, as `editor-callout` is, holding its
  definition's UI side and docs demo. `standardKit` stays as it is; a host adds library blocks as features.
- The email editor's defaults: travel's mail layout and templates pick blocks with `allow`, as today.

## Testing

- Each block: codec round trip (document: Markdown and HTML; email: `EmailBlock` and back), validation, the
  email render's HTML and text arms, a Viewer render, and a browser spec inserting it from the slash menu.
- Email renders checked in a browser at 600px and 375px, light and dark, with the default theme and with a
  product stylesheet.
- The docs demo for each block.

## Calls made by the writer (2026-11-24, after the builder check)

The owner asked to proceed; these were settled by the writer and are open to the owner's review.

1. **Existing blocks keep their definitions.** Heading, quote, image and table gain built-in email blocks
   (renderer defaults, like paragraph); they are not rewritten on `defineBlock`. Button and columns become
   shared document nodes with neutral names, `button` and `columns`/`column` (not `emailButton`), which the
   Document Editor stores and the email profile's codec maps to the unchanged wire types `button` and
   `columns` (`ratio` stays an email attribute). Email documents store `EmailBlock[]`, not node names, so the
   email editor's switch to the shared nodes changes nothing stored. New library blocks are built on
   `defineBlock`.
2. **Spacer, social links, hero, card and legal footer are built into the renderer** in `editor-core`: a
   server's `createEmailRenderer` draws them without being handed definitions, they join `EmailBlockKind`,
   `allow` and `validate`, and their type names are reserved (`defineEmailBlock` refuses them; 0.2.0 is
   unpublished, so no product block is affected). Card is one `defineBlock` with both sides, in
   `editor-core`; its document view ships in `@zui/editor-card`.
3. **Legal footer:** fields for the sender's identity (rich text), the postal address (plain text) and the
   unsubscribe link (a link, required, a fixed URL or a `url` variable), plus an optional reason line.
   `validate` reports an empty unsubscribe link or address with the existing kinds. Placement is free; a
   product that needs it in every mail marks it required with the existing `required` ids.
4. **Social links:** the product supplies each icon: an item is a label (the alt text), an icon URL (https)
   and a link. No hosted artwork. At most 8 items. This adds an `items` field kind.
5. **Folding stays.** When a profile's `allow` leaves out `heading` or `quote`, the export folds them into a
   paragraph as today (the codec reads the profile), so travel's mail layout keeps working. Release order:
   editor and renderer ship in the same `editor-core`, and travel upgrades its editor and its server together.
6. **Toggle heading** holds nested children like today's `toggle`, with a heading (level 1 to 3) as its
   summary; the table of contents lists that summary as a heading.

## Left to the builder

- The order the blocks are built in, module layout, primitive additions the hero and social rows need.
- Exact field names and limits per block.
