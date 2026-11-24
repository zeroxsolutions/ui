# Email renderer: a product's own CSS and blocks - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `createEmailRenderer` takes a product's CSS and inlines it, every default look comes from one base
stylesheet keyed by classes, and a product adds a block with one `defineEmailBlock` call that also feeds the
email editor.

**Architecture:** A render builds a tree of primitive nodes (`section`, `text`, `button`, ...). The tree is
expanded into an element tree (tag, attributes, classes, children), the composed stylesheet is matched
against the element tree's classes and written into each element's `style`, and the element tree is
serialised. The text arm is read off the primitive tree. Head rules (`@media`, `@font-face`) are kept as
text in the head's `<style>`. `defineEmailBlock` derives a `BlockDefinition` plus an editor description,
and the ui registry turns the description into an `EditorFeature`.

**Tech Stack:** TypeScript, zod 4, postcss 8 (parser only), vitest, React (ui registry), Playwright for the
screenshot comparison.

**Spec:** `docs/superpowers/specs/2026-11-24-email-renderer-css-and-blocks-design.md`

## Global Constraints

- `@zeroxsolutions/editor-core` 0.2.0 is unpublished: API may break; each breaking commit carries a
  `BREAKING CHANGE:` footer. No hand-edited version fields.
- Stored `EmailBlock[]` is unchanged on the wire. No migration.
- The default look must not change: the demo email and a kitchen-sink email of every default block, in
  light, dark and at 375px, compare pixel-equal before and after (`.superpowers/sdd/2026-11-24-email-renderer-css-and-blocks/`).
- Class-keyed selectors only in inlined rules: `.a`, `.a.b`, `.a .b`, `.a > .b`.
- No HTML parser. The CSS parser is postcss, used for parsing alone (its `browser` field stubs `fs`,
  `path` and `url`, so it bundles for the browser).
- Checks run through nx targets: `pnpm nx run @zeroxsolutions/editor-core:test`, `:typecheck`, `:lint`,
  `:lint-deps`; `pnpm nx run @zeroxsolutions/ui:test` for the registry.
- Commits: Conventional Commits, header <= 72 chars, plain ASCII, ending with the Co-Authored-By line.

## Review Focus

1. A product sheet that sets a longhand (`padding-bottom`) over a base shorthand (`padding`): the inline
   style must keep both, in cascade order, so the longhand wins. Test in Task 1.
2. A product declaration value holding `"` (a quoted font family) must not close the `style` attribute.
   Test in Task 2.
3. A product `@media` rule's text holding `</style>` must not end the head's style. Test in Task 4.
4. A block render that returns the legacy `{ html, text }` rows still renders, unstyled, in its place. Test
   in Task 4.
5. A product block whose type collides with a default, or whose field is named `id` or `key`, is refused
   at definition. Test in Task 6.

## File structure

Created under `packages/editor-core/src/template/email/`:

- `css/selector.ts` - parse a class-only selector, its specificity, and whether it matches an element.
- `css/stylesheet.ts` - parse the sheets with postcss into inline rules, head text and custom
  properties; `EmailStylesheetInvalid`.
- `css/inline-styles.ts` - write each element's style from the inline rules.
- `css/unsupported.ts` - the caniemail table and the warnings it raises.
- `css/base-stylesheet.ts` - the base sheet text from an `EmailTheme`.
- `primitives/nodes.ts` - the `EmailNode` union and `createPrimitives` (`h`).
- `primitives/elements.ts` - expand nodes into `EmailElement`s.
- `primitives/serialise.ts` - elements to HTML.
- `primitives/plain-text.ts` - nodes to the text arm.
- `define-email-block.ts`, `fields.ts` - `defineEmailBlock` and its field and attribute kinds.

Deleted: `color-scheme.ts`, `narrow-screen.ts` (their rules move into the base sheet).

Modified: `renderer.ts`, `block.ts`, `context.ts`, `layout.ts`, `theme.ts`, `blocks/*.ts`, `testing/index.ts`,
`index.ts`; `profiles/core/email-blocks.ts` (lanes of a codec's block). In the ui registry:
`profiles/email/email-block-feature.tsx` (new), `email-editor.tsx`, `messages.ts`,
`document/react/editor-block-menu.tsx`. Docs: `packages/editor-docs-web/content/docs/editor/email-editor.mdx`,
`packages/ui/registry/bases/base-ui/examples/email-editor-demo.tsx`.

---

### Task 1: CSS parser and inliner

**Files:**

- Modify: `packages/editor-core/package.json` (add `"postcss": "^8.5.32"` to `dependencies`; one declarer, so a plain pin, not a catalog entry)
- Create: `css/selector.ts`, `css/stylesheet.ts`, `css/inline-styles.ts`
- Test: `css/stylesheet.spec.ts`, `css/inline-styles.spec.ts`

**Interfaces:**

- Produces:
  - `interface ClassSelector { readonly compounds: readonly (readonly string[])[]; readonly combinators: readonly ('descendant' | 'child')[]; readonly specificity: number }`
  - `parseClassSelector(text: string): ClassSelector | SelectorRefusal` where `SelectorRefusal = { refused: 'element' | 'id' | 'attribute' | 'pseudo' | 'universal' | 'combinator' }`
  - `interface StyledElement { readonly classes: readonly string[]; readonly parent: StyledElement | null }` and `selectorMatches(selector, element): boolean`
  - `interface InlineRule { readonly selector: ClassSelector; readonly declarations: readonly Declaration[]; readonly order: number }`, `interface Declaration { readonly property: string; readonly value: string; readonly important: boolean }`
  - `interface ComposedStylesheet { readonly rules: readonly InlineRule[]; readonly head: string; readonly darkScheme: boolean; readonly warnings: readonly StylesheetWarning[] }`
  - `composeStylesheets(base: string, sheets: readonly string[]): ComposedStylesheet`, throws `EmailStylesheetInvalid`
  - `class EmailStylesheetInvalid extends Error { sheet: number; line: number; column: number; reason: 'unparsable' | 'selector-refused' | 'import-refused' | 'variable-undefined'; detail: string }` (`sheet` is the index in the product's `css`; the base sheet is never refused)
  - `inlineStyle(rules: readonly InlineRule[], element: StyledElement): string` - `prop:value;` per winning declaration, `!important` kept.

- [ ] **Step 1: Failing tests** (`stylesheet.spec.ts`, `inline-styles.spec.ts`), one case each:
  - `.a{color:red}` then `.a{color:blue}` -> `color:blue;`; `.a.b{color:red}` beats a later `.b{color:blue}`; a
    `!important` declaration beats a later, more specific normal one and prints `color:red !important;`.
  - descendant `.r .t` matches through any depth, child `.r > .t` only one level.
  - base `.a{padding:0 0 10px}` then product `.a{padding-bottom:30px}` -> `padding:0 0 10px;padding-bottom:30px;`.
  - `:root{--brand:#123456}` and `.zx-root{--gap:4px}` resolve `var(--brand)` and `var(--gap)`; `var(--x, red)`
    falls back; `var(--missing)` throws `EmailStylesheetInvalid` with `reason: 'variable-undefined'`, `detail: '--missing'`.
  - `@media (max-width:600px){.a{color:red}}` and `@font-face{...}` land in `head`, not in `rules`; a
    product's `@media` declaration gains `!important`; `p{}`/`#x{}`/`[a]{}`/`.a:hover{}` throw
    `selector-refused` at the rule's line and column, inside `@media` they do not; `@import url(x.css);`
    throws `import-refused`; `.a{` throws `unparsable`; each names the sheet's index.
  - `darkScheme` is true when any sheet holds a `prefers-color-scheme: dark` media query.
- [ ] **Step 2: Run** `pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template/email/css` - FAIL (no module).
- [ ] **Step 3: Implement.** postcss `parse(css, { from: undefined })`; a `CssSyntaxError` maps to `unparsable`
      at its `line`/`column`. Custom properties are read first from every sheet, then substituted into every value
      (inline and head), recursively, a cycle being `variable-undefined`. Rule order is global, base first.
      Head rules are re-stringified with postcss after `!important` is set on a product's declarations.
- [ ] **Step 4: Run** the same command - PASS.
- [ ] **Step 5: Commit** `feat(editor-core): parse and inline a product's email CSS` (with `pnpm-lock.yaml`).
      Before it, run the lockfile's second-copy listing and record that it names nothing new.

### Task 2: Primitives, the serialiser and the text arm

**Files:**

- Create: `primitives/nodes.ts`, `primitives/elements.ts`, `primitives/serialise.ts`, `primitives/plain-text.ts`
- Test: `primitives/primitives.spec.ts`

**Interfaces:**

- Consumes: `inlineStyle`, `InlineRule` (Task 1); `RenderContext` reads (`html`, `text`, `inline`, `href`, `markup`).
- Produces:
  - `type ClassList = string | readonly (string | false | null | undefined)[]`
  - `type EmailNode` = union by `kind`: `section`, `columns`, `column`, `text`, `heading`, `button`, `image`,
    `divider`, `list`, `code`, `spacer`, `raw`, plus shell kinds `preheader`, `card`, `region`.
  - `interface EmailPrimitives` (`h`): `section(options, children)`, `columns(options, columns)`, `column({ weight, class? }, children)`,
    `text({ class?, markup? | text?, textEnd?: 'paragraph' | 'line' })`, `heading({ level: 1|2|3, class?, markup? | text? })`,
    `button({ class?, href, label })`, `image({ class?, src, alt, width, href? })`, `divider({ class? })`,
    `list({ class?, ordered?, items })`, `code({ class?, text })`, `spacer({ class?, height })`, `raw({ markup })`,
    `preheader({ text })`, `card({ class? }, children)`, `region(name, children, { textEnd? })`.
  - `createPrimitives(reader: PrimitiveReader): EmailPrimitives` where `PrimitiveReader` fills a template:
    the block's context reader interpolates and reports, `literalReader` prints as given (the layout's).
  - `expandNodes(nodes: readonly EmailNode[]): ElementChild[]`; `serialiseElements(children, rules): string`;
    `plainTextOf(nodes): string`.
- Intrinsic classes: `text` -> `zx-text`, `heading` -> `zx-text zx-heading zx-heading-N`, `button` -> `zx-button`,
  `image` -> `zx-image`, `divider` -> `zx-divider`, `list` -> `zx-text zx-list`, `code` -> `zx-code`,
  `spacer` -> `zx-spacer`, `column` -> `zx-lane` (+ `zx-lane-last`), `card` -> `zx-card` (with `zx-canvas`,
  `zx-outer`, `zx-inner` on its wrappers), `region` -> `zx-region zx-region-<name>`, `preheader` -> `zx-preheader`.
- Structure: a `section` in a stack (`card`, `region`, `column`) is `<tr><td>`, elsewhere a presentation table
  with one cell; any other node in a stack is wrapped in `<tr><td>`, but `raw` is written as is (a legacy
  render's rows). `text` is a `div`, `code` a `div` (a `pre` brings UA margins and font rules the base sheet
  would have to undo), `divider` a `div` holding `&nbsp;`, `button` an anchor, `card` writes Outlook's
  `<!--[if mso]>` 600px table around itself. Text arm: `text`/`heading`/`code` end with a blank line
  (`textEnd: 'line'` ends with one line break), `button` prints `label: href`, `list` prints `- item` lines,
  `divider` a line break, a linked `image` prints `alt: href`, `region` trims its blocks' text and ends as
  its `textEnd` says, `card` trims.

- [ ] **Step 1: Failing tests**: each primitive's HTML and text arm; `.zx-text{color:red}` reaches the `text`
      div; a value `"Brand" Sans` in a font-family prints `&quot;`; an author's `<b>` in `text` escapes; a refused
      button href prints `href=""` and reports `href-scheme-refused`; an image with a `javascript:` src draws
      nothing; markup `**a** [b]({{u}})` draws `<strong>a</strong>` and `<a href=... class="zx-link">`; a section
      inside a section is a table, inside a region a row; `raw` in a region is written unwrapped.
- [ ] **Step 2: Run** `pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template/email/primitives` - FAIL.
- [ ] **Step 3: Implement** the four modules.
- [ ] **Step 4: Run** - PASS.
- [ ] **Step 5: Commit** `feat(editor-core): draw an email from primitives`.

### Task 3: The base stylesheet from `EmailTheme`

**Files:**

- Create: `css/base-stylesheet.ts`; Modify: `theme.ts` (export `DEFAULT_EMAIL_THEME`, the ZUI palette with its dark one)
- Test: `css/base-stylesheet.spec.ts`

**Interfaces:**

- Produces: `baseStylesheet(theme: EmailTheme): string`, `DEFAULT_EMAIL_THEME: EmailTheme`.
- The rules (values as the current renders draw them): `.zx-body`, `.zx-canvas`, `.zx-outer`, `.zx-card`, `.zx-inner`,
  `.zx-preheader`, `.zx-image`, `.zx-logo`, `.zx-align-left|center|right`, `.zx-space-small|medium|large`,
  `.zx-text`, `.zx-tone-muted`, `.zx-link`, `.zx-list`, `.zx-callout`, `.zx-code`, `.zx-button`,
  `.zx-button.zx-width-full`, `.zx-divider`, `.zx-lane`, `.zx-lane-last`, `.zx-footer`, `.zx-footer-line`,
  `.zx-region-footer .zx-text`; then `@media only screen and (max-width:600px){...}` (the six current
  narrow rules, plus footer text kept at 12px/17px), then, with `theme.dark` only,
  `@media (prefers-color-scheme:dark){...}` repainting every class the current paint classes repaint.

- [ ] **Step 1: Failing tests**: the sheet composes with no refusal; `.zx-text` inlines the font stack, 14px/20px and
      the foreground; `.zx-region-footer .zx-text` inlines 12px/17px muted; the head holds the narrow media rule;
      the dark media rule is present with `dark` and absent without it.
- [ ] **Step 2-4:** run, implement, run.
- [ ] **Step 5: Commit** `feat(editor-core): style the default email from one base sheet`.

### Task 4: Default layout and blocks on primitives; the renderer composes the sheets

**Files:**

- Modify: `renderer.ts`, `block.ts`, `context.ts`, `layout.ts`, `blocks/*.ts`, `index.ts`, the specs beside them,
  `fixtures.fixture.ts`; delete `color-scheme.ts`, `narrow-screen.ts`, `color-scheme.spec.ts` (its cases move
  to `renderer.spec.ts` as dark-scheme cases).

**Interfaces:**

- `EmailRendererOptions`: `theme?: EmailTheme` (default `DEFAULT_EMAIL_THEME`), `css?: string | readonly string[]`,
  `layout?`, `blocks?`, `extraBlocks?`.
- `BlockRenderer` returns `BlockRendering = EmailNode | readonly EmailNode[] | RenderedBlock`; a node result
  is placed in the renderer's row `section({ class: ['zx-block', 'zx-block-<type>', 'zx-align-<align>', 'zx-space-<spaceAfter>'] })`
  (`align` and `spaceAfter` read from the block's attributes when they are strings, else `left` and `medium`);
  a `RenderedBlock` result is placed as `raw`, as before.
- `RenderContext` gains `h: EmailPrimitives`; `lane(index)` returns `readonly EmailNode[]`; `laneCount: number`.
- `EmailLayout<Props> = (input: LayoutInput<Props>) => EmailNode | readonly EmailNode[]`;
  `LayoutInput` = `{ body, regions: { header, footer }, subject, preheader, locale, props, h }`, nodes not strings.
  The renderer writes the doctype, `<html lang>`, the head (charset, viewport, color-scheme metas when the
  composed sheet has a dark scheme, title, `<style>` with the head rules, `</` written `<\/`) and
  `<body class="zx-body">`.
- `EmailRenderer` gains `stylesheetWarnings: readonly StylesheetWarning[]` (empty until Task 5).

- [ ] **Step 1: Update the specs** to the new shapes: layout spec builds a tree; block specs assert classes and
      the inlined declarations (`color:#09090B`, `padding:0 0 20px`, `text-align:center`); the regionless snapshot
      is re-recorded; new cases: a product sheet `.zx-button{border-radius:0}` beats the base; a legacy
      `{ html, text }` render still prints its rows; a `css` that refuses throws at composition; the dark-scheme
      cases from `color-scheme.spec.ts`.
- [ ] **Step 2: Run** the email specs - FAIL.
- [ ] **Step 3: Implement**; delete the paint-class modules.
- [ ] **Step 4: Run** `pnpm nx run @zeroxsolutions/editor-core:test`, `:typecheck` - PASS.
- [ ] **Step 5: Compare the look.** `pnpm nx run @zeroxsolutions/editor-core:build`, then
      `node capture.mjs after-4 && node kitchen.mjs after-4 && node diff.mjs before after-4 diff-4` in the sdd dir.
      Expected: 0 differing pixels in every image. A difference is a bug in the base sheet or the expansion.
- [ ] **Step 6: Commit** `feat(editor-core)!: draw the default email from primitives and CSS`, with
      `BREAKING CHANGE:` naming the layout returning a tree, `lane()` returning nodes, the removed paint classes.

### Task 5: Stylesheet warnings and `checkEmailRenderer`

**Files:** Create `css/unsupported.ts`; Modify `css/stylesheet.ts`, `renderer.ts`, `testing/index.ts`; Test `css/unsupported.spec.ts`, `testing/index.spec.ts`.

**Interfaces:**

- `interface StylesheetWarning { readonly sheet: number; readonly line: number; readonly column: number; readonly property: string; readonly value: string; readonly clients: readonly string[] }`
- `UNSUPPORTED_CSS` table in code: `display: flex | inline-flex | grid | inline-grid`, `position`, `float`,
  `transform`, `oklch()`, `lab()`, `color-mix()`, gradients in `background` and `background-image`; each with
  the clients caniemail.com lists as not supporting it, and the date the table was read.
- `ConformanceFailure` becomes a union: the block failures as now, and
  `{ problem: 'stylesheet-unsupported'; warning: StylesheetWarning }`.

- [ ] Steps: failing tests (a `.a{display:flex}` warns at its line naming the clients; `color:oklch(...)` warns;
      `display:block` does not; `checkEmailRenderer` lists a renderer's warnings), run, implement, run, commit
      `feat(editor-core): warn of CSS that common mail clients drop`.

### Task 6: `defineEmailBlock`

**Files:** Create `fields.ts`, `define-email-block.ts`; Modify `index.ts`, `profiles/core/email-blocks.ts`; Test `define-email-block.spec.ts`, `profiles/core/email-blocks.spec.ts`.

**Interfaces:**

- Field kinds: `richText(options?: { max?: number })`, `plainText(options?: { max?: number })`, `link()`,
  `imageUrl()`, `lanes({ min, max })`. Attribute kinds: `choice(values, default)`, `toggle(default)`,
  `number({ min, max, default })`. Each takes an optional `label`.
- `defineEmailBlock({ type, label, description?, keywords?, fields, attributes?, render, sample })` returns
  `EmailBlockDefinition<Type, Fields, Attributes>` = `BlockDefinition<Type, AttributesOf, ContentOf>` plus
  `editor: EmailBlockEditor` (node name `email_<type>`, `body` field name or null, plain fields, `lanes`, attributes with labels,
  slash label, description, keywords) and `codec: NodeCodec` (the node's email codec, engine free).
- `render(view: { id, fields, attributes, region }, h, ctx)`; text fields reach it as templates, a `lanes`
  field as the rendered lanes.
- Refused at definition with `EmailBlockDefinitionInvalid`: two `richText` fields, two `lanes` fields, a field
  or attribute named `id`, `key` or `source`, a name both a field and an attribute, a type not matching
  `/^[a-z][a-zA-Z0-9]*$/`.
- `exportBlock`/`importBlock` carry the lanes of a codec's node whose children are `emailLane`s.

- [ ] Steps: failing tests (strict schema refuses a missing field, an unknown attribute, a choice outside its
      values, a too-long plain text, malformed markup in the rich text; the lenient read degrades and applies
      defaults; `holdsText`, `holdsLanes`; `translate` passes each rich and plain field and copies links; the
      spec's `quote` example renders through `createEmailRenderer({ extraBlocks: [quote] })` and passes
      `checkEmailRenderer`; the codec round-trips a block), run, implement, run, commit
      `feat(editor-core): define an email block once for renderer and editor`.

### Task 7: `emailBlockFeature` and the `blocks` prop

**Files:** Create `profiles/email/email-block-feature.tsx`; Modify `email-editor.tsx`, `messages.ts`,
`document/react/editor-block-menu.tsx`, editor-core `document/core/types/ui-contribution.ts` (a block menu
item may be a `checkbox`); Test `email-block-feature.browser.spec.tsx`, `email-editor.browser.spec.tsx`.

**Interfaces:**

- `emailBlockFeature(definition: EmailBlockDefinition, options?: { icon?: unknown; nodeView?: (props: NodeViewProps) => ReactNode; messages?: () => ProfileEditorMessages }): EditorFeature`
- `EmailEditorProps.blocks?: readonly EmailBlockDefinition[]` - adds a feature per definition, adds the
  types to `profile.kinds`, read once like `features`.
- `ProfileEditorMessages.customBlocks?: Partial<Record<string, { title?: string; description?: string; fields?: Record<string, string>; attributes?: Record<string, string>; values?: Record<string, string> }>>`.
- Block menu: a radio group per `choice`, a checkbox per `toggle`. A `number` attribute is a field in the
  node view, beside the plain fields (the block menu draws no input).

- [ ] Steps: failing browser tests (the slash menu inserts the custom block; typing in its body and its
      plain field exports the block; a `choice` set from the block menu exports; the editor reports no
      `unknown-block-type`), run through `pnpm nx run @zeroxsolutions/ui:test`, implement, run, commit
      `feat(ui): add an email block from its definition`.

### Task 8: Docs and demo

**Files:** `email-editor.mdx` (new sections "Styling" and "Your own blocks"; the `features`/`extraKinds` rows
name `blocks` for blocks), `email-editor-demo.tsx` (a `quote` block from `defineEmailBlock`, a product sheet
overriding `.zx-callout`'s border colour, the quote in the initial blocks).

- [ ] Steps: write, rebuild editor-core and the registry, check the page in the running docs server, commit
      `docs(ui): style the email and add a block of your own`.

### Task 9: Final comparison and checks

- [ ] Recapture after the demo change: the demo now holds the quote and the product sheet, so the "before"
      comparison runs on the kitchen sink and on a capture of the demo with `blocks` and `css` removed.
- [ ] Run editor-core `test`, `typecheck`, `lint`, `lint-deps`, `build`; ui `test`, `typecheck`, `lint`.

## Deviations from the spec

Each kept the design's intent; the reason follows it.

- **Lockfile.** `node_modules` was installed by a newer pnpm than the pinned 10.33.0, so `pnpm add` refused
  the store and a lockfile-only install rewrote unrelated lines. The `postcss` importer entry was added to
  `pnpm-lock.yaml` by hand and checked with `pnpm install --lockfile-only --frozen-lockfile` under 10.33.0;
  the local `packages/editor-core/node_modules/postcss` link was made by hand and is not tracked.
- **Template fence.** `fence.spec.ts` now admits `postcss` among the template's imports, since the parser is
  the template's.
- **Primitives drawn for the old pixels.** `text` and `code` draw a `div` (not `p` or `pre`), `heading` carries
  no `zx-text`, and `button` is the anchor alone with no extra cell. Each matches what the old blocks wrote, so
  the default look stays pixel-identical.
- **The block row is the renderer's.** Each block's primitives go in a row whose classes are `zx-block`,
  `zx-block-<type>`, `zx-align-<align>` and `zx-space-<spaceAfter>`, read from any block's attributes, with
  `left` and `medium` when unset. The default classes (`zx-tone-default`, `zx-width-inline`) are always written,
  so a product sheet can select them.
- **Regions and the text arm.** `region` takes a `textEnd` (paragraph or line), and the default footer's
  region ends each line with one newline, so the text arm is unchanged. An image is on the text arm only
  when it is linked, as before.
- **Layout input.** It carries `h` and no `theme`: the theme reaches the email through the base sheet.
- **Warnings.** caniemail.com has no `color-mix()` entry; it takes the modern colour functions' clients.
  Rules under `@supports` and cascade keywords (`inherit`, `initial`, `unset`) do not warn.
- **CSS cycles.** A `var()` whose variable is in a cycle takes its own fallback, and is refused without one,
  as a browser reads it, rather than refusing every cycle.
- **defineEmailBlock.** A block holds either a rich text body or lanes, not both, since its editor node holds
  one kind of content. A field but the body may be empty, as the editor exports it. `link` and `imageUrl` are
  checked by scheme in the strict schema (web or mail address, or a variable); whether a variable is a url is
  checked where it is rendered, since `validate()` does not know a product block's fields. A lanes block is
  refused inside a lane, as columns are.
- **Where the codec lives.** The editor codec is `emailBlockCodec(definition.editor)` in `profiles/core`, since
  template code may not import the document's types.
- **Block menu.** A `number` attribute is a field in the block's view, not a block menu item, since the menu
  draws no input. A product block's items reach the kit's menu through a registry the feature fills, so they
  sit before Duplicate and Delete. Its commands are per type: `insertEmailBlock:<type>` and
  `setEmailBlockAttribute:<type>`. A product block has no Align or Space after item; it renders `left` and
  `medium`.
- **Commit messages.** `4d8faebf` did not name two of its breaking changes (a block render returns
  `BlockRendering`; `color-scheme`, `narrow-screen` and the row and text-style helpers of `blocks/shared` are
  gone); `0a08760d`'s body records them.
- **After the final review.** A plain text field may hold a stored newline (it draws as a space), and a field
  but the body may be left out, so the write check refuses no content `validate` lets pass: `validate` reports
  content that is not an object, and each key the type's content does not have, as `content-invalid`. A
  block's attribute values are not checked by `validate`, as a default block's are not. `extraKinds` stays, for blocks of
  hand-written features, but `EmailEditor` needs a `blocks` definition in the profile's own `blocks`. A
  product's queries are computed per element (see the spec's Revisions), and a layout's person values go
  through a tagged `raw`, which escapes them; its images may also be `data:image/` and `cid:`.
