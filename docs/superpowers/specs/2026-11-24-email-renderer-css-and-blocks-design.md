# Email renderer: a product's own CSS and its own blocks

Decided 2026-11-24 with the owner. Extends `2026-11-23-email-sms-on-the-document-frame-design.md` and
`2026-11-23-variables-in-every-text-field-design.md`. Lands in `@zeroxsolutions/editor-core` 0.2.0, which is
not published yet, so its API may still break.

## Why

The owner: the renderer "binds you to one frame". A product can change only what `EmailTheme` names: seven
colours, a radius and a font. Each block's padding, type sizes, button shape, spacing and callout border are
fixed in its `render`, which builds table HTML strings by hand. Changing any of them, or adding a component,
means writing that HTML yourself, plus a separate editor feature, plus `extraKinds`, with nothing keeping the
three in step. A product with its own design system should bring its CSS and its components, not fit ours.

## Goals

1. A product passes its own CSS to `createEmailRenderer`, written by hand or compiled from its Tailwind or
   tokens. The renderer inlines it into each element's `style`, as mail clients need, and keeps what cannot
   be inlined (`@media`, dark mode, `@font-face`) in the head's `<style>`.
2. Every look the default blocks and the default layout have comes from one base stylesheet, keyed by
   classes. A product's rule beats ours by the normal cascade: specificity, then source order, product last.
   `EmailTheme` stays, as a shortcut that generates that base stylesheet's values.
3. A product adds a block with one call, `defineEmailBlock`, which gives the renderer's block and everything
   the editor needs (node, codec, slash item, block menu items) from one definition. Its render is built
   from a small set of primitives that already know mail-client HTML; nobody writes a `<table>`.
4. The default blocks' renders and the default layout are rewritten on those primitives and that stylesheet,
   so the API is the one we use ourselves. The default blocks keep their editor side as it is (the Document
   Editor's nodes, per the frame spec); `defineEmailBlock`'s editor half is for a product's own blocks.
5. A check names what a stylesheet does that common clients drop, so a product learns before it sends.

## Non-goals

- Tailwind class names in templates compiled at render time (a product passes Tailwind's compiled CSS).
- A visual CSS editor, or per-template CSS stored with the template. CSS belongs to the product's renderer.
- The editor drawing blocks in their email look. The editor keeps the Document Editor's look (frame spec);
  the email look is the Preview tab's.
- The native editor (project 4).

## Anti-goals

- A product needing to know table layout, `cellpadding`, `mso-` hacks or Gmail's class rules to style a block.
- A second source of truth for a block: a field declared in one place and repeated in another.
- A stored template changing shape. `EmailBlock[]` stays byte-for-byte the same wire; no migration.

## Approaches

CSS input (owner picked 1):

1. Plain CSS strings, inlined by the renderer over the primitives' element tree. Works in the browser and on
   the server, needs no HTML parser, and takes any CSS a product can produce, Tailwind's output included.
2. Tailwind class names compiled at render: pulls Tailwind into `editor-core`, heavy in the browser.
3. Style objects per block slot: simple, but not CSS, with no selectors or cascade.

Blocks (owner picked 1):

1. One `defineEmailBlock` with a schema and a primitives render, giving both the renderer's block and the
   editor's description; the defaults rewritten on it.
2. Keep two definitions and add helpers: cheaper, but the two still drift.

## Design

### Primitives

A render returns a tree of primitive nodes, not HTML. Each takes a `class` (one or more class names) and its
children or content:

| Primitive | Email HTML it stands for                                                     |
| --------- | ---------------------------------------------------------------------------- |
| `section` | a full-width row of the card: a presentation table with one cell             |
| `columns` | lanes side by side: a table row, one cell per `column`; stacks on narrow     |
| `column`  | one lane                                                                     |
| `text`    | a text cell; takes inline markup (`ctx.inline`) or plain text                |
| `heading` | a heading level 1 to 3                                                       |
| `button`  | a bulletproof link button: an anchor in a cell, with its href checked        |
| `image`   | an `img` with a required `alt`, a width and an optional link                 |
| `divider` | a rule drawn as a bordered cell                                              |
| `list`    | `ul` or `ol` of inline-markup items                                          |
| `code`    | a `pre` of escaped text                                                      |
| `spacer`  | vertical space of a given height                                             |
| `raw`     | the `html` block's markup as written (`ctx.markup`); never styled or inlined |

Primitives emit only the structure mail clients need (presentation roles, `cellpadding`/`cellspacing`, `width`
attributes, `align`), never a visual style. Every visual value is a rule in a stylesheet. A block's own
attribute values (`align`, `spaceAfter`, `tone`, `width`, ...) become modifier classes (`zx-align-center`,
`zx-space-large`) that the base stylesheet styles. The text arm is derived from the same tree.

### Styles and the inliner

- `createEmailRenderer({ theme?, css?, layout?, blocks?, extraBlocks? })`. `css` is a string or an array of
  strings. Order: the base stylesheet (from `theme`, or the ZUI defaults when no theme), then the product's.
- Inlined rules: class selectors only: `.a`, compound `.a.b`, descendant `.a .b`, child `.a > .b`. Each
  element's style is its matching declarations by specificity and order, `!important` kept. The base sheet
  uses the same selectors, so a product's rule of equal specificity wins by coming later.
- Head rules: `@media` (narrow screen, `prefers-color-scheme`) and `@font-face` are kept in the head's
  `<style>`, class-keyed as Gmail requires. The dark palette and the narrow-screen rules are base-sheet
  `@media` rules, overridable like any other.
- Custom properties: `--name: value` declared on `:root` or `.zx-root` are resolved into each `var()` at
  inline time, so a product can pass its design tokens as variables. A `var()` with no value is a problem.
- Refused, as a check problem with the rule's source position: element, id, attribute and pseudo selectors in
  inlined rules (not in `@media`, where Gmail would drop them anyway), `@import`.
- Flagged as unsupported by common clients (a warning that names the clients): `display: flex | grid`,
  `position`, `float`, `transform`, `oklch()`/`lab()`/`color-mix()`, `background-image` with gradients. The
  list is a table in code, sourced from caniemail.com, with its date.
- The inliner works on the primitives tree before serialising, so there is no HTML parsing.

### `defineEmailBlock`

```ts
const quote = defineEmailBlock({
  type: 'quote',
  label: 'Quote',
  fields: { text: richText(), author: plainText({ max: 120 }) },
  attributes: { tone: choice(['neutral', 'brand'], 'neutral') },
  render: ({ fields, attributes }, h) =>
    h.section({ class: ['zx-quote', `zx-tone-${attributes.tone}`] }, [
      h.text({ class: 'zx-quote-text', markup: fields.text }),
      h.text({ class: 'zx-quote-author', text: fields.author }),
    ]),
  sample: { fields: { text: '{{place}} changed my week.', author: 'Lan' }, variableTypes: { place: 'string' } },
});
```

- Field kinds: `richText()` (inline markup with variables; at most one per block, as the editable body),
  `plainText({ max })` and `link()` (single-line, variables allowed; `link` validated by the href rules),
  `imageUrl()`, and `lanes({ min, max })` for a lane-holding block.
- Attribute kinds: `choice(values, default)`, `toggle(default)`, `number({ min, max, default })`.
- From it come: the strict and the lenient zod schemas, `holdsText`, `holdsLanes`, `translate` (every
  `richText` and `plainText` field), the render over primitives, and the sample.
- The editor description: the node's name, its content (the `richText` field as its inline content), its
  other fields as attributes, the slash item (label, icon), and block menu items (a radio group per `choice`,
  a checkbox per `toggle`, a number field per `number`) with their labels. Every `label` is host-worded
  through the profile's messages when given.
- In the ui registry, `emailBlockFeature(definition, options?)` turns the description into an `EditorFeature`:
  a node view in the Document Editor's look, the body field as editable inline content, each other field as a
  `VariableTextField`, and an optional `nodeView` the product supplies. `EmailEditor`'s `blocks` prop takes
  definitions and does this itself, and adds their kinds to the profile, replacing `features` + `extraKinds`
  for blocks.

### What stays

- `EmailBlock[]`, the markup, validation kinds, variables, bounds, required blocks and locked structure.
- `BlockDefinition` stays the renderer's internal shape; `defineEmailBlock` produces one. `blocks` overrides
  keep working, now able to return a primitives tree.
- The default look. The rewrite must draw the same email; the existing render snapshots change only where
  the inliner orders style declarations differently, which the review checks by rendering both in a browser.

## Testing

- Inliner: specificity and order, `!important`, compound, descendant and child selectors, `var()` resolution,
  `@media` and `@font-face` kept in the head, refused selectors and `@import` reported with positions.
- Each primitive: HTML arm and text arm, escaping, href and image checks.
- Every default block and the default layout, before and after: a browser screenshot diff of the demo email
  in light, dark and at 375px, plus the renderer specs.
- `defineEmailBlock`: the derived schemas, translate, and an end-to-end custom block in the docs demo
  (inserted from the slash menu, edited, rendered with a product stylesheet overriding a default rule).
- The check's unsupported-property warnings.
- Docs: a "Styling" section and a "Your own blocks" section on the email editor page, with the example above.

## Calls made by the writer (2026-11-24, after the builder check)

The owner asked to proceed without another round; these were settled by the writer and are open to the
owner's review.

1. **Default blocks: renders only.** They keep `defineBlock` and their stored shapes (`list.items`,
   `columns.ratio`, multi-line `code` and `html`) and draw with primitives and the base sheet. Their editor
   side does not change. `defineEmailBlock`'s field kinds serve product blocks, which have no legacy shape.
2. **The layout is a primitives tree.** `EmailLayout` returns a tree, not a string; the renderer writes the
   doctype, the head (meta, the head `<style>`) and serialises. Shell primitives join the set: `preheader`
   (the hidden inbox line), `card` (the 600px card, with its Outlook `<!--[if mso]>` wrapper drawn by the
   serialiser), and `region` (header, body, footer, each a class `zx-region-<name>`). Blocks sit inside their
   region in the one tree, so `.zx-region-footer .zx-text` inlines; the footer's small muted text is such a
   rule in the base sheet, and `ctx.region` stays for a render that branches on it. A string layout is no
   longer accepted (0.2.0 is unpublished).
3. **Stylesheet errors throw at composition.** CSS that does not parse, a refused selector in an inlined
   rule, `@import`, and a `var()` with no value make `createEmailRenderer` throw `EmailStylesheetInvalid`
   with the sheet's index, line, column and the reason, as `EmailThemeInvalid` does for a theme. Unsupported
   properties are warnings, not errors: the renderer exposes them as `stylesheetWarnings` (each with its
   position, the property and the clients that drop it), and `checkEmailRenderer` reports them.
4. **Head rules get `!important`.** Inline styles beat any head rule, so the renderer adds `!important` to
   every declaration of a product's `@media` rule, as the base sheet's own rules carry it. Documented.
5. **New class attributes are accepted.** Elements keep their classes (Gmail's head rules need them), so
   render snapshots change in class attributes and declaration order. Sameness of the default look is
   proven by browser screenshot comparison of the demo email in light, dark and at 375px, not by
   byte-equal HTML.

## Left to the builder

- Module layout inside `template/email/`, primitive option names beyond those above, the exact base sheet.
- How the editor's node view lays out several plain fields.

## Revisions

- **2026-11-24, product queries.** The renderer no longer adds `!important` to every declaration of a product's
  `@media` or `@supports` rule. Copied into the head, those rules approximated the cascade and got it wrong:
  they beat a product's own later query, ignored `!important`, let a shorthand beat a more specific longhand,
  and missed a `:root` inside a nested query. For each query chain (nested queries flattened into it) the
  renderer now computes each element's style with the top-level rules and the chain's class-only rules, the
  chain's custom properties over the sheets', and where it differs from the inlined style gives the element a
  class (`zx-q<query>-<n>`) whose differing declarations are written under the chain, `!important`. Queries keep
  source order. A query selector that is not class-only is kept in the head as written, `!important`; the base
  sheet's head rules are unchanged.
- **2026-11-24, layout markup.** `h.raw` is also a tagged template that escapes every interpolated value; the
  options form writes trusted markup as given. A layout puts a person's value, such as the subject, only in
  text or in a tagged `raw`.
- **2026-11-24, query cascade.** A query also writes each declaration its own rules set where it equals the
  inlined one, so it beats the base sheet's head rules at equal specificity. Each written declaration keeps the
  specificity of its rule, the class repeated once per class, and the head writes them in their rules' order,
  so queries that hold at once cascade together, a nested query's rules included. In a block, a tagged `raw`
  fills each `{{name}}` in its literal parts, escaped. `validate` reports attributes the write check refuses
  as `attributes-invalid`.
- **2026-11-24, query cascade simplified.** The per-declaration specificity weighting above is withdrawn: it let
  an email's size grow with a selector's class count and let a one-class `!important` beat a two-class base
  rule. An element gets at most one class per query chain, holding that chain's style where it differs or the
  chain's rules set it, under a selector that repeats the class once more than the base sheet's widest rule, so
  a product query always beats the base's head rules on its element. A nested chain is computed from the
  top-level rules, every enclosing chain's rules and variables, and its own, outer to inner. Limitation: when
  two of your queries hold at once, a property both set on one element is decided by their order in your sheet,
  not by selector specificity. A tagged `raw` throws `EmailMarkupInvalid` for a value that is not text, a number,
  null or undefined, and for one inside an attribute that takes a link.
