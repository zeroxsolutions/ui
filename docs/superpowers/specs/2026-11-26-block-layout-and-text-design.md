# Block layout and text styling

Decided 2026-11-26 with the owner, during the review of uploads: blocks cannot be laid out (an image cannot be
aligned or resized by hand, columns cannot be weighed in the Document Editor), and text has little styling. One
more web extension, before native (project 4). The owner plans to grow the editor later into a "drag to web
site" builder, so the layout model chosen here must carry over to whole pages.

## Why

An author building a mail or a page wants a narrow centred image, a wide table, a 2/3 + 1/3 split, a tinted
section, a centred heading in a colour. Today: the image takes a typed pixel width in the Document Editor,
alignment exists only in the email's data, columns' `ratio` only in email, and text has bold, italic, underline,
strike, code and highlight only.

## Goals

1. **One layout model for every block, in editor-core, UI-free.** Values are design tokens and fractions, never
   pixels or hex, so the same document draws in the Document Editor, the Viewer, an email and, later, a site:
   - `align`: `start` | `center` | `end`.
   - `width`: a fraction of the container (`0.25` to `1`, snapped to steps of 0.05 when dragged) or `full`
     (bleeds to the container's edges where the surface allows).
   - `spaceBefore` / `spaceAfter`: `none` | `small` | `medium` | `large` (email already has `spaceAfter`).
   - The shape reserves per-breakpoint overrides (`responsive?: { [breakpoint]: Partial<Layout> }`) for the
     site builder; this project defines the type and validation and ignores it when drawing.
2. **Media blocks** (image, video/audio, embed, card, bookmark, file): an align control in the block's floating
   toolbar; image, video, embed and card also get drag handles on both sides to set the width, and a
   "Full width" toggle. Bookmark and file align only.
3. **Columns** in both editors: drag the divider between lanes to set `ratio` (snapping at thirds, halves and
   quarters); add or remove a column from the floating toolbar (2 to 4); vertical alignment of lanes
   (`top` | `center` | `bottom`); lanes stack under a narrow width as today.
4. **Table**: drag column borders to set column widths (stored as fractions); a "Full width" toggle.
5. **Section block** (new, both editors): a container of blocks with a background from the theme's tokens
   (`none` | `muted` | `primary` | `accent` | the named hues of goal 6), padding (`none` | `small` | `medium`
   | `large`) and width (`content` | `wide` | `full`). Email draws it with its `section` primitive; it is the
   unit a site page will be built of.
6. **Text styling** in both editors:
   - Text alignment for paragraphs, headings, quotes, list items (start, center, end, justify where the
     surface allows; email has no justify).
   - Text colour and background colour from a token palette (`default`, `muted`, and a fixed set of named hues
     each mapped per theme to a light and a dark value), on the selection bubble; never a free hex.
   - Paragraph styles: `lead` (larger) and `small` beside the normal paragraph and headings 1 to 3, in the
     turn-into menu. No free font sizes.
7. Every layout and text value round-trips through the Markdown/HTML codecs (HTML carries it; Markdown keeps the
   text and drops what it cannot say), the email wire, and `validate`; the Viewer draws it as the editor does.
8. Docs: a "Layout" page and a "Text styling" section, each with live demos in both editors; every changed
   block's page mentions its layout controls.

## Non-goals

- Text wrapping around images (floats): breaks email and narrow screens.
- Free pixel sizes, free colours, free fonts.
- The site builder itself, a page profile, its renderer, and per-breakpoint editing UI (later project).
- Native (project 4), which will take the same model.

## Anti-goals

- A layout the email cannot draw offered in the email editor: the email profile offers only what its renderer
  draws in Gmail, Apple Mail and Outlook (e.g. no `full` bleed beyond the card, widths capped at 566px).
- A layout drawn one way in the editor and another in the Viewer, an export or a send.
- Controls that look the same in every registry style: they use the registry's components and `cn-*` slots.

## Approaches

1. **Shared token-based layout attributes (picked by the writer, owner asked to proceed):** one `Layout` type in
   editor-core, attached as global attributes to the blocks that take it, each surface mapping tokens to its CSS.
   Carries to a site builder.
2. Per-block ad-hoc attributes (pixel widths, CSS strings): quick, but every surface and the future site
   builder re-interpret each block; ruled out by the owner's site-builder plan.

## Left to the builder

- Module layout, the toolbar's exact placement, the handle visuals (in the Document Editor's look), the named
  hue list (8 to 10 hues consistent with the registry's chart/accent palette), the HTML attribute names.
- How existing values migrate: the Document image's numeric `width` (px) reads as a fraction of the 720px
  content width on load; email `width: 'full'` and `align` map onto the new names. Nothing stored breaks.

## Calls made by the writer (2026-11-26, after the builder check)

The owner asked to proceed; these were settled by the writer and are open to the owner's review.

1. **Section nesting.** A section holds any block but a section: columns, hero, card included. A section never
   sits in a lane or in another section. A page is a run of sections and blocks. In email the section is a
   top-level row (its own table), so section > columns > lane is two table levels, which Outlook draws; the
   existing rules (no lanes in a lane, no hero or card in a lane) stay. `validate` and the renderer gain the
   section rules; the content expressions in both editors say the same.
2. **The stored email format grows; old names stay.** Email `align` keeps `left | center | right` on the wire
   (the editor maps `start`/`end` to them); `spaceBefore`, `width` fractions, `valign`, section and the text
   colour markers are new. editor-core 0.2.0 is unpublished and a product upgrades its editor and its server
   (its `validate`) together, as for the block library (call 5 there), so no older checker meets the new
   shapes. Email image widths stored as whole pixels (1 to 566) read as a fraction of 566; new ones are written
   as fractions.
3. **Colours are a fixed set, products set their values.** Tokens: `default`, `muted`, `primary`, `accent`
   and eight hues `red`, `orange`, `amber`, `green`, `teal`, `blue`, `violet`, `pink`. The Document Editor maps
   them to the registry theme's CSS variables (adding the hue variables to the styles' theme); `EmailTheme`
   gains `accent` and a light and a dark hex per hue, with defaults a product overrides. Products cannot add
   token names in this project; `validate` knows the closed set. Text colour and section background use the
   same set.
4. **Inline colour in email text** is a new inline-markup form, `{color=<token>}text{/color}` (and
   `{bg=<token>}...{/bg}`), escaped like the rest; older-format checks and translation checks learn it.
5. **The email button keeps its own `width: inline | full`** (fill the card); it is not a media block. Only
   image, video, embed and card take the layout `width`.
6. **Document table widths** are stored as fractions; pixel widths the current resizable table stored read as
   fractions of the table's width on load.
