# Block presets (project 3)

Decided 2026-11-25 with the owner. Project 3 of the editor programme (`2026-11-20-editor-profiles-design.md`):
drag-in block presets for the Document Editor and the email editor, on the block library
(`2026-11-24-block-library-design.md`).

## Why

An author building a mail or a page puts the same groups of blocks together again and again: a header with a
logo, a footer with social icons and the legal lines, a hero with a button, a row of two cards. Travel's old
editor had a drag palette for this; the house editors insert one block at a time. A preset is such a group,
inserted in one move.

## Goals

1. A product declares presets in code: `definePreset({ id, label, icon?, description?, content })`, one
   definition for either editor (owner's pick, approach 1). Travel defines its own; the library ships a few
   general ones.
2. An author inserts a preset three ways: dragging it from a presets panel beside the document to the spot it
   drops on, clicking it in that panel (inserts after the current block), and the slash menu and "+" under a
   "Presets" group.
3. An inserted preset is ordinary blocks: edited, moved and deleted like any other, with nothing tying it back
   to the preset.
4. An editor offers only the presets it can hold: a preset with a block the editor or the email profile's
   `allow` lacks is not offered there.
5. Docs: a "Block presets" page with a live demo in both editors and the API.

## Non-goals

- Presets an author saves at runtime (approach 2): would need a host store and a manager UI; may come later
  through a host callback.
- Synced or linked presets (editing a preset updating its copies).
- Native (project 4), which follows.

## Anti-goals

- A preset that inserts something the editor would refuse or the export cannot carry.
- An inserted preset that differs from what a hand-built group of the same blocks would be (other attributes,
  missing ids, a different render).
- A panel that looks like another product: it is drawn in the Document Editor's look, light and dark.

## Approaches

1. **Product-declared presets in code (picked).** No storage; a preset is data the product ships, as its
   blocks are.
2. Author-saved presets: needs a host store and a manager UI.
3. Both: approach 1 now, approach 2 later through a host callback.

## Design

### The definition (editor-core, UI-free)

- `definePreset({ id, label, icon?, description?, keywords?, content })` in `editor-core/blocks`, returning a
  frozen `BlockPreset`. `content` is the blocks in the editor's own JSON (`NodeJSON[]`, what
  `editor.getJSON().content` holds), which both editors share since the email editor holds document nodes.
- For email, `emailPreset({ ..., blocks })` takes the stored wire (`EmailBlock[]`, what travel saves) and
  converts it through the email profile's codec, so a product writes an email preset in the shape it already
  stores.
- `definePreset` checks the shape (a non-empty list of block nodes, an id of letters, digits and dashes) and
  throws `PresetDefinitionInvalid`. Whether an editor can hold it is checked where the editor is known.
- `presetFits(preset, { nodes, allow? })`: whether every node in the content is in the editor's schema and,
  for email, every block kind in the profile's `allow`. Both editors use it to choose which presets to offer.

### Inserting

- One command, `insertPreset` with `{ id, at? }`, on the Document Editor's core: it parses the content against
  the schema (the same boundary `setContent` uses), gives every block a fresh id and key where the profile
  carries them, and inserts at `at` or after the block holding the selection. The insert is one undo step.
- Drop: the editor reads a drag carrying the preset id (`application/x-zui-preset`) and inserts at the drop
  position, with the drop indicator the grip drag already draws.

### The panel (ui registry)

- `EditorPresetsPanel`: a list of the offered presets (icon, label, description), each draggable and
  clickable, with a search field when there are more than six. A host places it beside the editor (a sidebar,
  a sheet on narrow screens); the editor takes `presets` and the panel reads them from the editor.
- `Editor` and `EmailEditor` take `presets?: readonly BlockPreset[]`; the slash menu and "+" list the fitting
  ones under "Presets".
- Ships as a registry item `@zui/editor-presets` (panel and the library's presets).

### The library's presets

General ones only (business presets are the product's): for email, header (logo image and divider), hero
section, call to action (heading, text, button), two cards in columns, footer (social links and legal footer);
for the Document Editor, two columns, FAQ (toggle headings), callout with a button, cards in columns.

## Testing

- `definePreset` and `emailPreset`: shape errors, conversion, frozen result; `presetFits` per editor and
  `allow`.
- `insertPreset`: content, fresh ids, one undo step, position; refused when not fitting.
- Browser specs: drag from the panel to a spot, click insert, slash menu "Presets" group, in both editors;
  the email render of each library email preset at 600px and 375px, light and dark.
- Screenshots of the panel against the Document Editor in light and dark.

## Calls made by the writer (2026-11-25, after the builder check)

The owner asked to proceed; these were settled by the writer and are open to the owner's review.

1. **The email "two cards" preset becomes "two-up":** two columns, each an image, a heading, text and a button.
   Hero and card stay out of lanes (`laneWidths`, Outlook widths); the Document Editor keeps "cards in
   columns", since its columns take any block.
2. **"Fits" is what the editor would accept and the export carry, checked in the editor.** `presetFits` in
   editor-core checks node names against the schema and block kinds against `allow`; the email editor also runs
   `docProblems` over the preset's content and leaves out a preset with a `block-not-carried` problem. Where
   the caret sits matters: in a column, a preset holding `columns`, `hero` or `card` is not offered (as the
   slash items do with `inLanes`). Under `structure: 'locked'` no preset is offered. `bounds` stays a
   `validate` problem, as for any insert.
3. **`emailPreset(profile, options)` takes the profile**, so its blocks' codecs convert the wire, and a
   product block's wire never becomes `emailUnknown`. A preset holding `emailUnknown` does not fit.
4. **Ids: an inserted block gets a null id and a fresh key, and `stored` is dropped**, as `duplicateBlock`
   does; the host assigns ids on save as today. No id or stored copy from a preset's source reaches the
   document.
5. **The library's presets hold placeholder text from `messages`** (labels, descriptions and the text inside),
   no variables, and empty links and images. They show the same "fill this in" problems a block inserted from
   the slash menu shows.
6. **Where a preset lands.** Click, slash and "+" insert after the block holding the caret, at that block's
   level. A drop snaps to the nearest block boundary at the level under the pointer; a spot where the preset
   would be refused shows no drop indicator and drops nothing. `insertPreset`'s `at` is a document position.
