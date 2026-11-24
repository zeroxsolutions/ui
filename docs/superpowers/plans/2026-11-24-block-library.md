# Block library - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** one `defineBlock` declares a block for the Document Editor, the email editor or both, and the library's
blocks (table in the spec) are built on it or on the renderer's built-ins, each reachable from the slash menu, the
"+" and the block menu, with docs and live demos.

**Architecture:** `defineBlock` lives in a new UI-free area, `editor-core/src/blocks/`, which may import the template
and the document's types. Its email side is built by the same template function `defineEmailBlock` uses, so a
definition with an email side only is a `defineEmailBlock` result. Its document side is a node description and a
generic, lossless HTML and Markdown codec (`<div data-block>` carrying the attributes as JSON). The ui registry's
`blockFeature(definition, { view, icon })` turns either side into an `EditorFeature`; the same view draws the block
in the Editor and the Viewer. Heading, quote, image and table become renderer built-ins mapped from the document's
own nodes by the email codec; spacer, social links, hero, card and legal footer are renderer built-ins defined
with the template's email builder.

**Tech Stack:** TypeScript, zod 4, vitest, React, Tiptap (registry only), Playwright (screenshots, browser specs).

**Spec:** `docs/superpowers/specs/2026-11-24-block-library-design.md`, building on
`docs/superpowers/specs/2026-11-24-email-renderer-css-and-blocks-design.md`.

## Global Constraints

- `@zeroxsolutions/editor-core` 0.2.0 is unpublished; its API may break. Each breaking commit carries a
  `BREAKING CHANGE:` footer. No hand-edited version fields.
- A stored `EmailBlock[]` does not change: phase (b) keeps the exported wire byte-identical; later phases only
  add types.
- The default email look does not change: the demo email and the kitchen sink, light, dark and 375px, differ by
  0 pixels from `.superpowers/sdd/2026-11-24-block-library/before` after every phase that touches email
  (`node capture.mjs <dir> && node kitchen.mjs <dir> && node diff.mjs before <dir> diff-<dir>` in that folder,
  after `pnpm nx run @zeroxsolutions/editor-core:build`).
- An email block holds up in Gmail web and app, Apple Mail, Outlook desktop and web: tables and attributes for
  layout, no flex, grid, position or background images, every image `https:` with an `alt`.
- Icons are the registry's animated icons (`@/registry/bases/base-ui/icons/lucide/*`).
- Checks run through nx: `pnpm nx run @zeroxsolutions/editor-core:test|typecheck|lint|lint-deps|build`,
  `pnpm nx run @zeroxsolutions/ui:test|typecheck|lint`.
- Commits: Conventional Commits, header <= 72 chars, plain ASCII, ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never stage `apps/registry-ui/next-env.d.ts`,
  `apps/registry-editor-docs-zone/next-env.d.ts` or `apps/native-preview-uniwind/uniwind-types.d.ts`.
- Waits in tests are conditions, never timers. Screenshots go under `.superpowers/sdd/2026-11-24-block-library/`.

## Review Focus

1. A field value holding `"><script>` or a `javascript:` address reaching the document codec's HTML, Markdown or
   the email render. Tests in Tasks 2 and 4.
2. A stored `items` entry that is not an object, or an item missing a sub-field, read by the render, the codec and
   `validate` without throwing. Tests in Task 2.
3. `validate` passing content the strict schema refuses, or reporting what it accepts: an empty required field, an
   item count outside its bounds, a newline in an address. Tests in Task 2.
4. A Markdown export of a block whose value holds a blank line or `-->`: it must stay one HTML token and read back
   as the same node. Test in Task 4.
5. A document-only definition handed to `emailProfile({ blocks })` or `createEmailRenderer`, which would offer a
   block the renderer cannot draw. Test in Task 4.

## Parallel split after phase (a)

Phase (a) is committed before the rest starts. The groups below own disjoint files; a file two groups need is
named under the group that edits it, and the other group reads it.

| Group               | Owns                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (b)+(c)+(d) email   | `editor-core/src/template/email/**` (blocks, primitives, base sheet, renderer), `editor-core/src/profiles/core/**`, `editor-core/src/blocks/card.ts`, registry `editor/profiles/**`, `editor/document/features/button/**`, `editor/document/features/columns/**`, `editor/document/features/image/**` (caption and link), `editor/styles.css` email rules, `examples/email-editor-demo.tsx`, `email-editor.mdx` |
| (e) document blocks | `editor-core/src/blocks/library/**` (bookmark, file, media, table of contents), registry `editor/document/blocks/**` (`blockFeature`), `editor/document/features/{card,bookmark,file,media,table-of-contents,toggle-heading}/**`, `editor/document/features/toggle/toggle.tsx` (decline a toggle heading's `details`), `editor/document/serialize/render-to-react.tsx`, `editor/document/react/viewer.tsx`      |
| (f) registry + docs | `packages/ui/registry.json`, `examples/editor-<block>-demo.tsx`, `examples/__*__.tsx` (generated), `editor-docs-web/content/docs/editor/{block-library,editor-<block>,document-editor,index}.mdx` and its `meta.json`                                                                                                                                                                                           |

(e) needs `blockFeature` before the card's document view; (b)+(c)+(d) needs it for the card in the email editor
and reads it from (e). (f) starts when a block's feature exists.

## File structure (phase a)

- `editor-core/src/template/email/block.ts` - the renderer's identity helper renamed `defineBlockType`.
- `editor-core/src/template/email/fields.ts` - `items()`, `required` on `plainText`, `link`, `imageUrl`.
- `editor-core/src/template/email/define-email-block.ts` - `emailBlockOf(options, node)`, which
  `defineEmailBlock` and `defineBlock` both call; `BlockEditor`, `BlockDefinitionInvalid`.
- `editor-core/src/blocks/define-block.ts` - `defineBlock`, `Block`.
- `editor-core/src/blocks/document-codec.ts` - the document side's node attributes, its HTML and Markdown codec,
  and the `markup` tagged template a definition writes its HTML with.
- `editor-core/src/blocks/inline-markup-nodes.ts` - a body's inline nodes to the inline markup and back, with the
  document's `bold`, `italic` and `link` marks.
- `editor-core/src/blocks/index.ts`, `editor-core/src/blocks/fence.spec.ts`.
- `editor-core/src/profiles/core/{profile,types,validate,email-block-codec}.ts` - items, required fields, a
  `Block` taken by `emailProfile`.
- registry `editor/profiles/email/email-block-feature.tsx`, `editor/profiles/messages.ts` - items edited in the
  block's view; `email-editor.tsx` takes a `Block`.

---

## Phase (a): `defineBlock` and the field kinds

### Task 1: Free the name `defineBlock`

**Files:** Modify `template/email/block.ts`, `template/email/blocks/{paragraph,button,code,list,callout,divider,columns,html}.ts`,
`template/email/index.ts`, `template/email/renderer.spec.ts`.

**Interfaces:** Produces `defineBlockType<const Type, Attributes, Content>(definition: BlockDefinition<Type, Attributes, Content>): BlockDefinition<Type, Attributes, Content>` (the old `defineBlock`, unchanged).

- [ ] **Step 1:** rename the function and every import; `pnpm nx run @zeroxsolutions/editor-core:typecheck` and `:test` - PASS.
- [ ] **Step 2: Commit** `refactor(editor-core)!: rename the renderer's defineBlock`, footer
      `BREAKING CHANGE: defineBlock from template/email is now defineBlockType; defineBlock is the block library's.`

### Task 2: `required` fields and the `items` field kind

**Files:** Modify `template/email/fields.ts`, `template/email/define-email-block.ts`, `template/email/index.ts`,
`profiles/core/email-block-codec.ts`, `profiles/core/validate.ts`. Test `template/email/define-email-block.spec.ts`,
`profiles/core/email-block-codec.spec.ts`, `profiles/core/validate.spec.ts`.

**Interfaces:**

- `plainText({ max?, label?, required? })`, `link({ label?, required? })`, `imageUrl({ label?, required? })`: each
  field type gains `readonly required: boolean` (false by default).
- `ITEMS_MAX = 20`; `items({ fields, min?, max, label? }): ItemsField` where `fields` maps names to `PlainTextField |
  LinkField | ImageUrlField`, `min` defaults to 0, `0 <= min <= max <= ITEMS_MAX`.
- Stored content of an items field: `readonly Readonly<Record<SubName, string>>[]`; `EmailBlockContent` and
  `EmailBlockFields` give it that type.
- `BlockEditor` (renamed from `EmailBlockEditor`) gains
  `readonly items: readonly { readonly name: string; readonly label: string; readonly min: number; readonly max: number; readonly fields: readonly BlockEditorField[] }[]`;
  `BlockEditorField` (renamed from `EmailBlockEditorField`) and every field gain `readonly required: boolean`.
- `BlockDefinitionInvalid` (renamed from `EmailBlockDefinitionInvalid`).

- [ ] **Step 1: Failing tests** in `define-email-block.spec.ts`:
  - a `social` block with `links: items({ fields: { label: plainText({ required: true }), icon: imageUrl({ required: true }), href: link({ required: true }) }, min: 1, max: 8 })`:
    the strict schema refuses `[]`, nine items, an item with an extra key, an item with `icon: 'javascript:x'`,
    `icon: 'mailto:a@b.c'` and `label: ''`; it accepts one full item;
  - the lenient read turns `links: 'x'` into `[]`, an entry `null` into an item of empty strings, and an item's
    number into `''`;
  - `translate` passes each item's plain sub-fields in order and copies links and images;
  - the render's view receives the items as stored; `editor.items` lists the field with its sub-fields;
  - refused at definition: an items field with a `richText`, `lanes` or `items` sub-field, `min > max`,
    `max > 20`, a sub-field named `id`;
  - `plainText({ required: true })` refuses `''` and a missing key; without it both pass.
- [ ] **Step 2: Failing tests** in `email-block-codec.spec.ts`: an items attribute exports as the array with each
      sub-field as text (a missing one `''`, a non-object entry an item of `''`), and imports back equal.
- [ ] **Step 3: Failing tests** in `validate.spec.ts` with a profile holding the `social` block: an empty required
      field is `text-empty` with `field`; no items is `text-empty` on `links`; nine items `list-too-long`; an item's
      faulty icon `href-invalid` with `field: 'links'` and `item`; an item's undeclared token
      `variable-undeclared` with `item`; a stored entry that is not an object `content-invalid` with `item`; each
      content that `validate` passes clean is accepted by `definition.content.safeParse` (a table of cases).
- [ ] **Step 4: Run** `pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template/email/define-email-block src/profiles/core` - FAIL.
- [ ] **Step 5: Implement.** Sub-field schemas reuse the text field schema; an items field adds no editor node
      content, its value is a node attribute.
- [ ] **Step 6: Run** the same - PASS; then `:typecheck`.
- [ ] **Step 7: Commit** `feat(editor-core)!: add items and required fields to email blocks`, footer naming the
      renamed `BlockEditor`, `BlockEditorField` and `BlockDefinitionInvalid`.

### Task 3: Edit items in a block's view

**Files:** Modify registry `editor/profiles/email/email-block-feature.tsx`, `editor/profiles/messages.ts`,
`editor/profiles/messages.spec.ts`. Test `editor/profiles/email/email-block-feature.browser.spec.tsx`.

**Interfaces:** `ProfileEditorMessages` gains `addItem: string` ("Add") and `removeItem: string` ("Remove");
`CustomBlockMessages.fields` words an items field and, as `<field>.<sub>`, its sub-fields.

- [ ] **Step 1: Failing browser tests:** a block with an items field shows one row per stored item, each sub-field
      a `VariableTextField` labelled by its sub-field; "Add" appends an item of empty strings and is disabled at
      `max`; "Remove" removes its row and is disabled at `min`; typing in a sub-field exports the item; in
      locked structure Add and Remove are disabled.
- [ ] **Step 2: Run** `pnpm nx run @zeroxsolutions/ui:test -- --run email-block-feature` - FAIL.
- [ ] **Step 3: Implement** in the block's field list, after the plain fields; the static `toReact` lists each
      item's sub-fields as text.
- [ ] **Step 4: Run** - PASS; `pnpm nx run @zeroxsolutions/ui:typecheck`.
- [ ] **Step 5: Commit** `feat(ui): edit a block's items in the email editor`.

### Task 4: `defineBlock`

**Files:** Create `blocks/define-block.ts`, `blocks/document-codec.ts`, `blocks/inline-markup-nodes.ts`,
`blocks/index.ts`, `blocks/fence.spec.ts`. Modify `template/email/define-email-block.ts` (extract `emailBlockOf`),
`profiles/core/profile.ts`, registry `editor/profiles/email/email-editor.tsx`. Test `blocks/define-block.spec.ts`,
`blocks/document-codec.spec.ts`, `profiles/core/profile.spec.ts`.

**Interfaces:**

- `emailBlockOf(options: EmailBlockOptions, node: string): EmailBlockDefinition` in `define-email-block.ts`, not in
  the area index: `defineEmailBlock(options)` is `emailBlockOf(options, 'email_' + type)` after its checks.
- `defineBlock(options: BlockOptions<Type, F, A>): Block<Type, F, A>` where `BlockOptions` = `{ type, label,
  description?, keywords?, icon?: unknown, fields: F, attributes?: A, email?: { render, sample }, document?: {
  html(view: DocumentBlockView<F, A>, markup: Markup): MarkupValue } }` (`render` and `sample` as in
  `EmailBlockOptions`).
- `Block` = `{ type, label, icon: unknown, editor: BlockEditor, email: EmailBlockDefinition | null, document:
  DocumentBlock | null }` (the description and keywords are the editor's); `editor.node` is the type with a
  document side, `email_<type>` without.
- `DocumentBlock` = `{ node: NodeSpec; codec: NodeCodec }`: the node is `content: 'inline*'` when a `richText`
  field is the body, else an atom; its `attrs` schema takes each field but the body, each items field and each
  attribute, all optional. A view is the registry's to add.
- `DocumentBlockView` = `{ fields, attributes, body: MarkupValue }`: text fields and items as stored, attributes
  with defaults, `body` the serialised body (empty without one).
- `Markup`: a tagged template that escapes every value (newlines included), takes a nested `MarkupValue` as
  written, and throws `BlockDefinitionInvalid` for a value in a link or source attribute other than
  `markup.url`'s, in an event handler or `style`, unquoted or loose inside a tag, or inside `script` or `style`;
  `markup.url(value)` is the value when it opens with `https:`, `http:` or `mailto:`, else `''`.
- HTML: `<div data-block="<type>" data-block-attrs="<escaped JSON of the node's attributes>">` + the definition's
  `html` + `</div>`, the body wrapped in `<div data-block-body>`. Markdown: the same, on one line, the JSON also
  holding the body as inline markup, so it is one HTML token; `fromMarkdown` reads that token, `fromHTML` the
  element. Attributes read back through the node's schema; an unreadable one is dropped, never thrown.
- Refused with `BlockDefinitionInvalid`: no side; a document side with a `lanes` field; a document type that names
  a Document Editor node (`paragraph`, `text`, `doc`, `heading`, `blockquote`, `bulletList`, `orderedList`,
  `listItem`, `taskList`, `taskItem`, `codeBlock`, `horizontalRule`, `hardBreak`, `image`, `table`, `tableRow`,
  `tableCell`, `tableHeader`, `callout`, `toggle`, `embed`, `math`, `mermaid`, `mention`, `button`, `columns`,
  `column`); an email side refused as `defineEmailBlock` refuses.
- `emailProfile({ blocks })` takes `{ editor: BlockEditor; email?: unknown }` and throws `EditorError`
  `editor.profile.block_not_email` for one whose `email` is null. `EmailEditor`'s `blocks` takes
  `EmailBlockDefinition | Block`; it reads only `editor`, and a block with no email side is never in a profile.

- [ ] **Step 1: Failing tests** in `define-block.spec.ts`: an email-only `defineBlock` equals `defineEmailBlock`
      on `editor`, schemas and render output; a both-sided block has `editor.node === type` and its email codec
      uses that node; the refusals above.
- [ ] **Step 2: Failing tests** in `document-codec.spec.ts` with a `note` block (`title: plainText()`,
      `url: link()`, `body: richText()`, `tone: choice(...)`, `tags: items(...)`): HTML and Markdown round trip
      through `importHTML`/`importMarkdown` with a codec registry, equal attrs and body; a title `"><script>x`
      prints escaped in both; a url `javascript:alert(1)` prints no `href` value; a title holding a blank line and
      `-->` exports as one Markdown HTML token and reads back; a stored `tone: 'x'` reads back without it; the
      definition's `html` putting a plain value in `href="` throws.
- [ ] **Step 3: Failing test** in `profile.spec.ts`: a document-only block in `emailProfile({ blocks })` throws
      `editor.profile.block_not_email`; a both-sided block's kind joins the profile.
- [ ] **Step 4: Run** `pnpm nx run @zeroxsolutions/editor-core:test -- --run src/blocks src/profiles/core/profile` - FAIL.
- [ ] **Step 5: Implement**; `blocks/fence.spec.ts` allows `blocks`, `template`, `profiles/core`,
      `document/core/types`, `document/core/errors.js` and `zod`, as the profile core's fence does.
- [ ] **Step 6: Run** - PASS; editor-core `typecheck`, `lint`, `lint-deps`; ui `typecheck`.
- [ ] **Step 7: Commit** `feat(editor-core): declare a block once for both editors`.

### Phase (a) close

- [ ] Build editor-core, capture `after-a`, diff against `before`: 0 pixels.
- [ ] Reviewer subagent on `git diff <phase start>..HEAD`, hostile-input brief (Review Focus 1-5, injection through
      fields and URLs, codec round trips, `validate` against the write check); fix what it confirms; one
      re-review at most.

---

## Phase (b): shared `button` and `columns` nodes (group: email)

Decisions: the Document Editor gains `button` (atom; attrs `label`, `href`, `align`, `spaceAfter`, `width`) and
`columns` (content `column{2,4}`; attrs `ratio`, `spaceAfter`) with `column` (content `block+`), as registry
features `editor/document/features/button` and `.../columns`, drawn as the email editor draws them today (move
`nodes/button.tsx`, `nodes/columns.tsx` views there). Markdown: a button is `[label](href)` on its own line,
imported back only from HTML; columns export each lane's Markdown in order, separated by a blank line, and import
from HTML (`<div data-columns data-ratio>` / `<div data-column>`). `emailNodeSpecs` drops `emailButton`,
`emailColumns`, `emailLane`; the email codec maps `button` and `columns` nodes to the unchanged wire types, and
a product lanes block's lanes become `column`. Every reference in `email-kit.ts`, `kit-context.ts`,
`email-block-feature.tsx`, `doc-problems.ts`, `email-nodes.ts`, `email-blocks.ts`, `email-block-codec.ts`,
`styles.css` and the specs moves to the new names.

- Task 5: document `button` and `columns` features with views, codecs, browser specs (slash insert, Viewer render,
  round trips). Files: registry `editor/document/features/{button,columns}/**`, `editor/styles.css`.
- Task 6: the email profile on the shared nodes. Files: `profiles/core/{email-nodes,email-blocks,email-block-codec,doc-problems}.ts`,
  registry `editor/profiles/email/**`. Test: a fixture of every stored block type exported before and after is
  byte-identical (`JSON.stringify`), plus the existing specs. `BREAKING CHANGE:` the node names.
- Close: pixel diff, review.

## Phase (c): email heading, quote, image and table (group: email)

Decisions: built-ins in `template/email/blocks/{heading,quote,image,table}.ts`, in `defaultBlocks`,
`EmailBlockKind`, `EMAIL_KINDS` (not `MAIL_LAYOUT_KINDS`), `CONTENT_KEYS` and `validate`.

- `heading`: attributes `level` 1-3 (default 2), `align`, `spaceAfter`; content `text` (inline markup). A document
  heading of level 4-6 exports as level 3.
- `quote`: attributes `align`, `spaceAfter`; content `text`; drawn as a section `zx-quote` (left border, muted
  text) in the base sheet.
- `image`: attributes `align`, `spaceAfter`, `width` (1-600, default 600); content `src` (`https:` or a url
  variable), `alt` (required), `caption?`, `href?`. The document image gains `caption` and `href` attributes and
  popover fields (group (b)+(c)+(d) owns `features/image`).
- `table`: attributes `header` (boolean), `spaceAfter`; content `rows: string[][]` (inline markup, cells may be
  empty), at most 20 rows and 6 columns, rows padded to the widest; a merged cell's span is padded with `''`. A
  new `table` primitive draws `th`/`td` with borders as attributes and base-sheet rules; its text arm joins cells
  with `|`. A table over the bounds is `table-too-large` (new `ProblemKind`, worded in `messages.ts`).
- Folding: `toEmailBlocks(doc, codecs, { kinds })` folds `heading` and `blockquote` to a paragraph when `kinds`
  lacks `heading` or `quote`, as now; an image or table the profile lacks stays a `block-not-carried` problem.
  The email kit includes `image()` and `table()` when allowed; the block menu gains Level for a heading.
- The demo's product `quote` block is renamed `testimonial` (the type is now reserved); docs' "Your own blocks"
  example follows, and so do the specs that declare a product `quote`: `define-email-block.spec.ts`,
  `email-blocks.spec.ts`, `email-block-codec.spec.ts` and the registry's `email-block-feature.browser.spec.tsx`.
- Close: pixel diff (existing blocks 0 pixels), screenshots of each new block, review.

## Phase (d): spacer, social links, hero, card, legal footer (group: email)

Decisions: each defined in `template/email/blocks/` with `emailBlockOf` (node `<type>`), in `defaultBlocks`, so
`defineEmailBlock` refuses the types; their editor features come from `blockFeature` with a view each.

- `spacer`: attribute `height` choice `small|medium|large` (8/16/32 px).
- `socialLinks`: field `links: items({ label (required, the alt), icon (imageUrl, required), href (link, required) },
  min 1, max 8)`; attributes `align`, `size` choice `small|medium` (24/32 px). A new `icons` primitive draws one
  linked image per item in a row cell; the text arm prints `label: href` lines.
- `hero`: fields `image` (required), `alt` (required), `heading` (plainText, required), `text` (richText),
  `buttonLabel`, `buttonHref` (link); attribute `align` `left|center`. The button is drawn only with both set;
  `validate` reports one of the two missing as `text-empty`.
- `card`: as the hero, without `align`, in a bordered section; `blocks/card.ts` is the `defineBlock` with its
  document side (HTML: figure, title, body, link), built through an internal path that skips the reserved-type
  check.
- `legalFooter`: fields `sender` (richText), `address` (plainText, required), `unsubscribe` (link, required),
  `reason` (plainText). Drawn in the footer's muted small text; the text arm prints `Unsubscribe: <url>`.
- Close: pixel diff, screenshots (Preview 600/375, light/dark), review.

## Phase (e): document blocks (group: document)

Decisions: `blockFeature(definition, { view, icon, insert? })` in registry `editor/document/blocks/block-feature.tsx`
builds node (`content: 'inline*'` for a body, else atom), view (editor and Viewer, the view receiving
`editable`), the definition's codec with a `toReact` drawing the same view, the slash item and block menu items
(radio per `choice`, checkbox per `toggle`). Definitions live in `editor-core/src/blocks/library/`.

- `bookmark`: fields `url` (link, required), `title`, `description`, `image`; the host passes
  `readLink(url) => Promise<{ title, description, image }>` to the feature; the view fills the fields once on
  paste of a url.
- `file`: fields `name` (required), `href` (link, required), `size` attribute (number, bytes, 0 to 2^31); drawn
  as a row with a file icon, name, size and a download link.
- `media`: fields `src` (link, required), `caption`, `poster` (imageUrl); attribute `kind` `video|audio`; drawn
  with `<video controls>` / `<audio controls>`; HTML exports the element.
- `tableOfContents`: no fields; the view lists the document's headings (level 1-3), a toggle heading's included,
  each linking to it; the Viewer reads the document through `ReactSerializeContext.doc` (added).
- `toggleHeading`: a feature like `toggle`, not `defineBlock` (it holds nested blocks, which no field kind
  declares): node `toggleHeading`, content `heading block*`, attribute `open`; HTML/Markdown
  `<details data-toggle-heading><summary>...</summary>...</details>`; `toggle`'s `fromHTML` declines that
  element.
- Each: codec round trip spec, Viewer render spec, browser spec inserting from the slash menu, screenshots in the
  Document Editor (edit and Viewer) beside a callout and a toggle.

## Phase (f): registry items and docs (group: registry + docs)

- Items `editor-button`, `editor-columns`, `editor-card`, `editor-bookmark`, `editor-file`, `editor-media`,
  `editor-table-of-contents`, `editor-toggle-heading` in `registry.json`, each with its files, icons, CSS and a
  `-demo` item, and `editor-block-feature` for `blockFeature`; `pnpm nx run @zeroxsolutions/ui:build-registry`
  and `:examples-index`.
- Docs: `block-library.mdx` (table of every block, the editors it is in, its item, how `defineBlock` declares one
  of your own, with a live demo), one page per item as `editor-callout.mdx` is, the email blocks in sections of
  `email-editor.mdx` with demos, `index.mdx` and `document-editor.mdx` linking the library.

## Deviations from the spec

- **`defineBlock` was taken.** The renderer's identity helper was already exported as `defineBlock`; it is
  renamed `defineBlockType` so the library's `defineBlock` can have the name the spec gives it.
- **Where `defineBlock` lives.** In a new area, `editor-core/blocks`, since the template may not import the
  document's types; its email side is built by the template function `defineEmailBlock` calls.
- **Markdown of a defined block** is its HTML on one line, as the toggle's is, so a block round-trips; the body's
  marks other than bold, italic and link do not survive Markdown.
- **Toggle heading is not on `defineBlock`**: it holds nested blocks, which no field kind declares and an email
  cannot store.
- **The demo's `quote` block** is renamed `testimonial`, since `quote` becomes a built-in type.
- **After the phase (a) reviews.** `markup` takes a value only in text or in a quoted value of an allow-listed
  attribute (`class`, `id`, `title`, `alt`, `data-*`, `aria-*` and the like), and a `markup.url` value only in `href`
  of `a`, `src` of `img`, `video`, `audio` and `source`, and `poster` of `video`; after a comment, a declaration or
  an element that runs, styles, frames or loads (`script`, `style`, `textarea`, `title`, `svg`, `link`, `meta`, ...)
  it takes no value at all. A fragment
  holding a value goes only in text, and a list of fragments draws an items field. A Markdown body keeps a link only
  to a web or mail address. A required field refuses a blank of spaces; a link or image field opens with a literal
  address or a whole variable token, as `validate` reads it; `translate` skips a field the content leaves out. The
  document serializer now escapes text in HTML, which it never did: a document's `<` or `&` reached every HTML
  export as markup. Left as found: an HTML import keeps a `javascript:` link mark in any paragraph (the registry's
  `link` codec), which the Markdown path of a defined block's body now drops.
