# Block layout and text styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** every block takes one token-based layout (align, width fraction or full, space before and after), columns,
tables and a new section block are laid out by hand, and text takes alignment, token colours and lead/small
paragraph styles, the same in the Document Editor, the Viewer, the email editor and the sent email.

**Architecture:** the model is UI-free and lives in `editor-core/src/template/layout/` (types, tokens, zod shapes,
snapping, legacy readers), where the template, `blocks/`, `profiles/` and `document/` may all import it. The
Document side gets one engine feature, `blockLayout()`, declaring the attributes as global attributes with `data-*`
HTML, plus two colour marks; the email wire grows new attribute names and an inline colour marker the renderer
draws with class rules built from `EmailTheme`. The ui registry gets one shared layout kit
(`editor/document/layout/`: a block toolbar, align and width controls, resize handles, `layoutProps`) that every
feature's view and `toReact` codec use, so the Viewer draws what the Editor draws.

**Tech Stack:** TypeScript, zod 4, Tiptap 3 (registry and `profiles/editor` only), React, registry `ToggleGroup`,
`Toggle`, `Button`, `Popover`, `Tooltip`, vitest (node, jsdom, Chromium browser mode), Playwright screenshots.

**Spec:** `docs/superpowers/specs/2026-11-26-block-layout-and-text-design.md`, including "Calls made by the writer".

## Global Constraints

- Documents hold tokens and fractions only: no `px`, no `#hex`, no `rgb()`, no CSS string in `getJSON()`, an HTML
  export, a Markdown export or the email wire. Pixels appear only in the email renderer's output, computed from a
  fraction. Width: `0.25 <= w <= 1` or `'full'`; a drag snaps to steps of `0.05`.
- Closed token sets, exactly: align `start | center | end`; space `none | small | medium | large`; text align
  `start | center | end | justify` (email: no `justify`); colour `default | muted | primary | accent | red | orange |
  amber | green | teal | blue | violet | pink`; section padding `none | small | medium | large`, section width
  `content | wide | full`; columns `valign` `top | center | bottom`; paragraph `size` `lead | small`.
- The email offers only what its renderer draws in Gmail, Apple Mail and Outlook: no `full` media or section width,
  no `justify`, image widths capped at `CONTENT_WIDTH` (566px). Email `align` stays `left | center | right` on the
  wire; the editor maps `start`/`end` to them.
- Nothing stored breaks: a Document image's numeric `width` reads as `px / 720`, an email image's whole-pixel
  `width` (1 to 566) as `px / 566`, a Document table's pixel `colwidth`s as fractions of their sum; each clamped to
  `[0.25, 1]` (columns: `[0.05, 1]`) and rounded to `0.05`. New values are written as fractions.
- Default emails stay 0px diff: the demo email and the kitchen sink, light, dark and 375px, differ by 0 pixels from
  `.superpowers/sdd/2026-11-26-block-layout/before` after every task that touches the renderer, the base sheet or
  the wire (`node capture.mjs <dir> && node kitchen.mjs <dir> && node diff.mjs before <dir> diff-<dir>`, scripts
  copied from `.superpowers/sdd/2026-11-24-block-library/`, after `pnpm nx run @zeroxsolutions/editor-core:build`).
  An absent attribute renders exactly as today: no new class, no new attribute on the element.
- Viewer = editor: each block's `toReact` and its node view call the same `layoutProps(attrs)`; each track has a
  spec drawing one document in both and comparing the layout `data-*` attributes and the drawn width ratio.
- Every control is a registry component (`ToggleGroup`, `Toggle`, `Button`, `Popover`, `Tooltip`, `DropdownMenu`)
  and every surface the editor draws itself takes a `cn-editor-*` slot defined in all 8
  `packages/ui/registry/styles/style-*.css`; no hand-drawn chrome with fixed radius, ring or shadow utilities.
  `src/build/editor-chrome.spec.ts` must pass for every style.
- Every string the UI draws comes from messages: `LayoutWords` for the Document Editor, `ProfileEditorMessages.layout`
  for the email editor, English defaults. Icons are the registry's animated icons
  (`@/registry/bases/base-ui/icons/lucide/*`).
- No `blob:`, `data:` or hex value reaches the document, `onChange`, an export or a send.
- `@zeroxsolutions/editor-core` 0.2.0 is unpublished: a breaking commit carries a `BREAKING CHANGE:` footer; no
  hand-edited version fields.
- Checks through nx: `CI=true pnpm nx run @zeroxsolutions/editor-core:test|typecheck|lint|lint-deps|build`,
  `CI=true pnpm nx run @zeroxsolutions/ui:test|typecheck|lint|build-registry`; a focused spec with
  `... :test -- --run <path>`. Push and let the pre-push hook and CI run the full gate.
- Commits: Conventional Commits, header at most 72 characters, plain ASCII, message ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Stage by path only. Never stage
  `apps/registry-ui/next-env.d.ts`, `apps/registry-editor-docs-zone/next-env.d.ts` or
  `apps/native-preview-uniwind/uniwind-types.d.ts`. Never bare `git stash`; never `git reset --hard`, `git clean`
  or `git checkout -- .` over uncommitted work.
- Waits in tests are conditions (`expect.poll`, `waitFor`, a locator), never timers. Screenshots only under
  `.superpowers/sdd/2026-11-26-block-layout/` or `.playwright-mcp/`.

## Review Focus

1. A drag-resize at a narrow width (375px, touch pointer): the handles stay inside the block (no horizontal scroll),
   the width stays in `[0.25, 1]` and snaps to `0.05`, and the whole drag is one undo step; Escape mid-drag restores
   the start width with no history entry. Tests in Tasks 7 and B1.
2. An email holding a `full` width image or section, or an image width above 566px, from a paste, an export of a
   Document or a stored wire: `validate` reports `attributes-invalid`, the export clamps (`full` -> `1`, section
   `full` -> `wide`), and the renderer never draws wider than the card. Tests in Tasks 2, 4 and 5.
3. Stored content in the old shapes: a Document image `width: 360`, an email image `width: 283`, a table with pixel
   `colwidth`s, an email paragraph `align: 'right'`; each opens, draws as before and writes fractions and the
   new names on the next edit. Tests in Tasks 1, 5, 6, B1 and C2.
4. HTML pasted with inline styles (`style="color:#ff0000;text-align:right;width:300px;background:rgb(1,2,3)"`):
   `text-align` maps to `textAlign`, a colour maps only when it is a `data-color`/`data-bg` token or a CSS named
   colour equal to a hue name, anything else is dropped; no `px` or hex survives in `getJSON()`. Tests in Tasks 6
   and E2.
5. A section placed where it may not sit (in a lane, in another section, by paste, drag or a stored wire): the
   editors refuse it by content expression, `validate` reports `block-nested-too-deep`, the renderer draws nothing
   for it and reports the same. Tests in Tasks 2, 4 and D1.

---

## Phase (a): the shared model, sequential

Phase (a) is committed on `fix/email-editor-parity` before any track starts. Every name a later track imports is
in an Interfaces block below; a track that needs a name not listed here stops and asks.

### Task 1: The layout model and its tokens

**Files:**

- Create: `packages/editor-core/src/template/layout/{layout.ts,tokens.ts,ratio.ts,index.ts}`, spec
  `packages/editor-core/src/template/layout/layout.spec.ts` (`// @vitest-environment node` first line)
- Modify: `packages/editor-core/src/template/index.ts` (re-export `./layout/index.js`)

**Interfaces:**

- Produces (`@zeroxsolutions/editor-core/template/layout/index`):
  - `ALIGNS = ['start','center','end'] as const`, `type LayoutAlign`
  - `SPACES = ['none','small','medium','large'] as const`, `type LayoutSpace`
  - `BREAKPOINTS = ['sm','md','lg'] as const`, `type Breakpoint`
  - `WIDTH_MIN = 0.25`, `WIDTH_STEP = 0.05`, `type LayoutWidth = number | 'full'`
  - `interface Layout { align?: LayoutAlign; width?: LayoutWidth; spaceBefore?: LayoutSpace; spaceAfter?:
    LayoutSpace; responsive?: Partial<Record<Breakpoint, Partial<Omit<Layout, 'responsive'>>>> }`
  - `layoutSchema: z.ZodType<Layout>` (strict), `readLayout(raw: unknown): Layout` (lenient: drops what is invalid)
  - `snapWidth(fraction: number): number` (clamp to `[WIDTH_MIN, 1]`, round to `WIDTH_STEP`)
  - `widthFromPixels(px: number, base: number): number` (= `snapWidth(px / base)`)
  - `DOCUMENT_CONTENT_WIDTH = 720`
  - `TEXT_ALIGNS = ['start','center','end','justify'] as const`, `type TextAlign`
  - `HUES = ['red','orange','amber','green','teal','blue','violet','pink'] as const`, `type Hue`
  - `COLOR_TOKENS = ['default','muted','primary','accent', ...HUES] as const`, `type ColorToken`
  - `SECTION_BACKGROUNDS = ['none','muted','primary','accent', ...HUES] as const`, `type SectionBackground`
  - `SECTION_PADDINGS = SPACES`, `SECTION_WIDTHS = ['content','wide','full'] as const`, `type SectionWidth`
  - `interface SectionLayout { background?: SectionBackground; padding?: LayoutSpace; width?: SectionWidth }`
  - `VALIGNS = ['top','center','bottom'] as const`, `type VAlign`
  - `PARAGRAPH_SIZES = ['lead','small'] as const`, `type ParagraphSize`
  - `RATIO_SNAPS: readonly number[]` (`1/4, 1/3, 1/2, 2/3, 3/4`), `snapRatio(fractions: readonly number[]):
    number[]` returning whole weights summing to 12, each 1 to 12, `ratioFractions(weights: readonly number[]):
    number[]`
  - `LAYOUT_NODES: Readonly<Record<string, readonly (keyof Layout)[]>>`: `image, media, embed, card` take
    `align, width, spaceBefore, spaceAfter`; `bookmark, file` take `align, spaceBefore, spaceAfter`; `table` takes
    `width` (`'full'` only), `spaceBefore, spaceAfter`; every other top-level block (`paragraph, heading,
    blockquote, bulletList, orderedList, taskList, codeBlock, callout, columns, section, button, horizontalRule,
    toggle, math, mermaid`) takes `spaceBefore, spaceAfter`.
  - `TEXT_ALIGN_NODES = ['paragraph','heading'] as const` (text in a quote or a list item is aligned through its
    paragraphs)

- [ ] **Step 1: Write the failing spec** `layout.spec.ts`:
  - `snapWidth snaps and clamps`: `snapWidth(0.512) === 0.5`, `snapWidth(0.1) === 0.25`, `snapWidth(1.4) === 1`.
  - `widthFromPixels reads legacy pixels`: `(360, 720) === 0.5`, `(283, 566) === 0.5`, `(2000, 720) === 1`,
    `(10, 566) === 0.25`.
  - `layoutSchema refuses pixels and unknown tokens`: `{ width: 300 }`, `{ width: 0.2 }`, `{ align: 'left' }`,
    `{ spaceBefore: 'huge' }` fail; `{ width: 'full', align: 'center', spaceBefore: 'none' }` passes.
  - `responsive is validated and nests one level`: `{ responsive: { sm: { width: 1 } } }` passes;
    `{ responsive: { xl: {} } }` and `{ responsive: { sm: { responsive: {} } } }` fail.
  - `readLayout drops what is invalid and keeps the rest`: `readLayout({ align: 'left', width: 0.5 })` deep-equals
    `{ width: 0.5 }`; `readLayout('x')` is `{}`.
  - `snapRatio snaps to thirds, halves and quarters`: `snapRatio([0.64, 0.36])` -> `[8, 4]`,
    `snapRatio([0.52, 0.48])` -> `[6, 6]`, `snapRatio([0.27, 0.73])` -> `[3, 9]`, three lanes `[0.34,0.33,0.33]`
    -> `[4,4,4]`; every result sums to 12.
  - `the colour set is closed`: `COLOR_TOKENS.length === 12`, `HUES` equals the eight names in order.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template/layout`;
      expected FAIL (module missing).
- [ ] **Step 3: Implement** the files above; zod only, no import outside `src/template/` (the template fence spec
      `src/template/fence.spec.ts` must stay green).
- [ ] **Step 4: Run** the focused spec and `src/template/fence.spec.ts`; expected PASS.
- [ ] **Step 5: Commit** `feat(editor-core): a token layout model for every block`.

### Task 2: The email wire's new shapes and `validate`

**Files:**

- Modify: `packages/editor-core/src/template/email/blocks/shared.ts`, `blocks/{image,paragraph,heading,quote,list,
  columns,table}.ts`, `blocks/default-types.ts`, `blocks/index.ts`; create `blocks/section.ts`
- Modify: `packages/editor-core/src/profiles/core/{types.ts,profile.ts,validate.ts}`
- Test: `packages/editor-core/src/profiles/core/validate.spec.ts`, `src/template/email/blocks/index.spec.ts`

**Interfaces:**

- Consumes: Task 1's tokens.
- Produces:
  - `shared.ts`: `SPACES` grows `'none'`; `spaceBefore = z.enum(SPACES).optional()`; `imageWidth` schema accepting
    a fraction in `[0.25, 1]` or a legacy whole pixel `1..CONTENT_WIDTH`; `emailAlignOf(align: LayoutAlign):
    Align` and `layoutAlignOf(align: Align): LayoutAlign`.
  - Every default block's `attributes` gains `spaceBefore`; `paragraph` gains `size: z.enum(PARAGRAPH_SIZES)`;
    `columns` gains `valign: z.enum(VALIGNS)`; `table` gains `columnWidths: z.array(z.number().min(0.05).max(1))`.
  - `section` block type (`blocks/section.ts`): attributes `{ background?: Exclude<SectionBackground, never>;
    padding?: LayoutSpace; width?: 'content' | 'wide'; spaceBefore?; spaceAfter? }`, content `{}`,
    `holdsLanes: true`, `laneBounds: { min: 1, max: 1 }`, `section: true`.
  - `BlockDefinition.section?: boolean` in `template/email/block.ts`: a block that holds one lane of blocks and
    sits at the top only.
  - `EmailBlockKind` and `EMAIL_KINDS` gain `'section'`; `DEFAULT_BLOCK_TYPES` gains `'section'`.
  - `validate` walks with `type Nesting = 'top' | 'section' | 'lane'` instead of `depth`: in a lane, a
    lanes block, a wide block or a section is `block-nested-too-deep`; in a section, a section is.
- [ ] **Step 1: Failing specs** in `validate.spec.ts`:
  - `a section holds columns, a hero and a card`: no problem for `section > columns > lane > paragraph`.
  - `a section in a lane or in a section is nested too deep`: both report `block-nested-too-deep` with the inner
    section's id.
  - `a section holds exactly one lane`: zero or two lanes report `lanes-count`.
  - `the email refuses what it cannot draw`: image `width: 'full'`, image `width: 600`, section `width: 'full'`,
    paragraph `align: 'justify'`, `background: 'magenta'` each report `attributes-invalid` on that field.
  - `legacy and new widths both pass`: image `width: 283` and `width: 0.5` report nothing.
  - `new attributes pass`: `spaceBefore: 'none'`, `size: 'lead'`, columns `valign: 'center'`, table
    `columnWidths: [0.3, 0.7]`.
  - in `index.spec.ts`: `every default block reads spaceBefore` (each block's `readAttributes` keeps a valid one
    and drops `'huge'`).
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/profiles/core/validate.spec.ts
  src/template/email/blocks`; expected FAIL.
- [ ] **Step 3: Implement**; `section.render` is Task 4's, so here it returns `[]`.
- [ ] **Step 4: Run** the same; expected PASS. Run `src/profiles/core` whole; expected PASS (existing wires valid).
- [ ] **Step 5: Commit** `feat(editor-core)!: section, space before and widths on the email wire` with a
      `BREAKING CHANGE:` footer naming `EMAIL_KINDS` and the `Nesting` walk.

### Task 3: Inline colour markup

**Files:**

- Modify: `packages/editor-core/src/template/markup/inline-markup.ts`, `inline-markup.fixture.ts`,
  `packages/editor-core/src/template/sms/` (its plain-text reader), `src/template/email/primitives/nodes.ts`
  (`TextRunText`)
- Test: `packages/editor-core/src/template/markup/inline-markup.spec.ts`

**Interfaces:**

- Produces: `InlineText` and `TextRunText` gain `readonly color?: ColorToken; readonly background?: ColorToken`
  (absent for `default`); `InlineMarkupProblem` gains `'color-unclosed' | 'color-token-unknown' | 'color-nested'`;
  `parseInlineMarkup`, `printInlineMarkup`, `plainInlineText` and `sameInlineMarkup` read and write
  `{color=<token>}text{/color}` and `{bg=<token>}text{/bg}`.
- [ ] **Step 1: Failing spec cases:**
  - `parses a colour run`: `'a {color=red}b{/color}'` -> runs `[text 'a ']`, `[text 'b', color 'red']`.
  - `colour and background nest, bold inside`: `'{bg=amber}{color=blue}**x**{/color}{/bg}'` -> one run, bold,
    `color: 'blue'`, `background: 'amber'`.
  - `round-trips`: `printInlineMarkup(parse(s).runs) === s` for each fixture above.
  - `refuses`: `{color=red}x` -> `color-unclosed`; `{color=magenta}x{/color}` -> `color-token-unknown`;
    `{color=red}{color=blue}x{/color}{/color}` -> `color-nested`.
  - `old strings are unchanged`: `'a {b} c'`, `'{{name}}'`, `'{ color=red }'` parse to one plain run with that
    exact text; `'\\{color=red}'` is the literal text `{color=red}`.
  - `plainInlineText strips markers`; `sameInlineMarkup` is false when a translation drops or changes a colour
    marker and true when only the text changes.
  - `a colour marker inside a {{token}} refuses as marker-inside-token`.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template/markup`;
      expected FAIL.
- [ ] **Step 3: Implement**: only the four sequences above are markers; `\{` escapes a `{` that would open one;
      every other `{` stays literal. The SMS reader prints the plain text.
- [ ] **Step 4: Run** `src/template` whole; expected PASS.
- [ ] **Step 5: Commit** `feat(editor-core): colour markers in inline markup`.

### Task 4: `EmailTheme` and the renderer

**Files:**

- Modify: `packages/editor-core/src/template/email/{theme.ts,renderer.ts,context.ts}`,
  `css/base-stylesheet.ts`, `primitives/{nodes.ts,elements.ts}`, `blocks/{section,image,columns,table,paragraph,
  heading,quote,list}.ts`, `index.ts`
- Test: `theme.spec.ts`, `renderer.spec.ts`, `renderer.dark-scheme.spec.ts`, `primitives/primitives.spec.ts`

**Interfaces:**

- Produces:
  - `EmailColors` gains `readonly accent?: string; readonly hues?: Partial<Record<Hue, string>>` (light palette in
    `colors`, dark in `dark`); `DEFAULT_EMAIL_THEME` fills both (Tailwind 600 light, 400 dark, as hex);
    `resolveEmailTheme(theme: EmailTheme): ResolvedEmailTheme` fills absent ones from the default;
    `assertEmailTheme` checks every hue and `accent`.
  - `tint(hue: string, base: string, amount: number): string` (hex mix, `amount = 0.15`) for a background colour.
  - Base sheet classes, emitted only for tokens a block uses: `zx-color-<token>`, `zx-bg-<token>` (text runs),
    `zx-section`, `zx-section-bg-<token>`, `zx-section-pad-<space>`, `zx-space-before-<space>`, `zx-text-lead`,
    `zx-text-small`, `zx-valign-<v>`; each with its dark rule when `theme.dark` is set.
  - `RenderContext.available: number`: the pixel width the block is drawn in (566 at the top and in a `content`
    section, `566 * weight / total` less the lane gutter in a lane, the card's inner width in a `wide` section).
  - `renderOne(state, block, nesting: Nesting)` with Task 2's rules; a `wide` section splits the body into padded
    runs around an unpadded row.
  - The image draws `width = round(fraction * available)`; a legacy pixel width draws as today.
- [ ] **Step 1: Copy the capture scripts and take `before`** in `.superpowers/sdd/2026-11-26-block-layout/` from
      the commit before Task 2; commit nothing there.
- [ ] **Step 2: Failing specs:**
  - `renderer.spec.ts`: `an absent layout renders byte-identical html` (the kitchen-sink fixture's HTML equals the
    `before` capture's); `a section draws its background and padding as a table row`; `a wide section reaches the
    card's inner edges and no further` (no element wider than 598px); `an image at 0.5 is 283px at the top and
    half its lane in a lane`; `an image never exceeds 566px` (stored `width: 1` and legacy `900`);
    `columns valign sets valign on each lane cell`; `table columnWidths draw as width percentages`;
    `a colour run draws a span with zx-color-red and its dark rule`; `lead and small paragraphs take their class`;
    `spaceBefore none and large`; `a section in a lane reports block-nested-too-deep and draws nothing`.
  - `theme.spec.ts`: `a hue that is not hex is refused at its path` (`colors.hues.red`); `an absent hue takes the
    default`.
- [ ] **Step 3: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template/email`;
      expected FAIL.
- [ ] **Step 4: Implement.**
- [ ] **Step 5: Run** the same; expected PASS. Build editor-core, run the capture into `after-a4`, diff against
      `before`; expected 0 pixels for every capture.
- [ ] **Step 6: Commit** `feat(editor-core): draw sections, widths and colours in email`.

### Task 5: The email codec between the document and the wire

**Files:**

- Modify: `packages/editor-core/src/profiles/core/{email-nodes.ts,email-blocks.ts,email-block-codec.ts,
  email-preset.ts}`, `src/blocks/inline-markup-nodes.ts`
- Test: `email-blocks.spec.ts`, `email-wire.spec.ts`, `email-content-blocks.spec.ts`

**Interfaces:**

- Consumes: Tasks 1 to 4.
- Produces:
  - `EMAIL_BLOCK_NODES` gains `'section'`; `EMAIL_GLOBAL_ATTRIBUTES` is replaced by
    `EMAIL_LAYOUT_ATTRIBUTES: Record<string, readonly string[]>` derived from `LAYOUT_NODES` plus the email's own
    (`tone`, `source`, `stored`); text nodes carry `textAlign` and `size`, not `align`.
  - `sectionNodeSpecs(sectionContent = 'sectionBlock+'): NodeSpec[]`: a `section` node (attrs `SectionLayout`,
    group `block`, content of every block but `section`), shared by both editors. The group name
    `sectionBlock` is added to every block node but `section` by `blockLayout()` (Task 6).
  - `columnsNodeSpecs` gains `valign` and `spaceBefore`.
  - `toEmailBlocks` maps: Layout `align` -> `left|center|right`; `textAlign` -> `align` (`justify` -> `left`,
    reported by `docProblems` as `attributes-invalid`); width `'full'` -> `1`, section `full` -> `wide`; a quote's
    and a list's `align` from its first paragraph's `textAlign`; `textColor`/`textBackground` marks -> colour
    markers. `fromEmailBlocks` maps back and reads a legacy pixel width with `widthFromPixels(px, 566)`.
- [ ] **Step 1: Failing specs:**
  - `email-wire.spec.ts`: `a document with every layout value round-trips through the wire` (export, import,
    deep-equal; `full` comes back as `1`); `an old wire with align right and width 283 imports as end and 0.5 and
    exports as right and 0.5`; `a coloured bold run exports as {color=red}**x**{/color}`; `a section with columns
    inside exports as one section lane holding a columns block`.
  - `email-blocks.spec.ts`: `justify exports as left with a docProblems entry`; `an export holds no px and no hex`
    (serialized JSON matches neither `/\d+px/` nor `/#[0-9a-f]{3,8}/i`).
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/profiles/core`; expected
      FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same and the capture diff; expected PASS and 0 pixels.
- [ ] **Step 5: Commit** `feat(editor-core)!: carry layout and colour between document and email` with a
      `BREAKING CHANGE:` footer naming `EMAIL_GLOBAL_ATTRIBUTES`.

### Task 6: `blockLayout()`, the colour marks and the HTML mapping

**Files:**

- Create: `packages/editor-core/src/document/layout/{layout-html.ts,index.ts}`,
  `packages/editor-core/src/profiles/editor/block-layout.ts`; specs beside each
- Modify: `packages/editor-core/src/profiles/editor/index.ts`, `src/blocks/define-block.ts` (`DOCUMENT_NODES` gains
  `section`, `DOCUMENT_MARKS` gains `textColor`, `textBackground`)

**Interfaces:**

- Produces:
  - `layout-html.ts` (DOM only, no engine): `layoutDataAttributes(attrs: Layout & { textAlign?; size? }):
    Record<string, string>` writing `data-align`, `data-width`, `data-space-before`, `data-space-after`,
    `data-layout-responsive` (JSON), `data-text-align`, `data-size`; `layoutFromElement(element: HTMLElement,
    legacyPixelBase?: number): Layout & { textAlign?: TextAlign; size?: ParagraphSize }`, reading those, a
    `style="text-align"` and an `<img width>` in pixels; `colorTokenFromElement(element: HTMLElement, property:
    'color' | 'background'): ColorToken | null` (a `data-color`/`data-bg` token, or a CSS named colour equal to a
    hue name; else null).
  - `blockLayout(options?: { types?: Record<string, readonly string[]>; email?: boolean }): EditorFeature`
    (`id: 'blockLayout'`): global attributes from `LAYOUT_NODES` and `TEXT_ALIGN_NODES`, parsed and rendered with
    `layout-html.ts`; the `sectionBlock` group on every block node but `section`; marks `textColor` and
    `textBackground` (attr `token: ColorToken`, `<span data-color>`/`<span data-bg>`); commands, each one undo
    step and `can` false where the node does not take the attribute or `email` refuses the value:
    - `setBlockLayout({ pos?: number; layout: Partial<Layout> })`
    - `setTextAlign({ align: TextAlign | null })`
    - `setParagraphSize({ size: ParagraphSize | null })`
    - `setTextColor({ token: ColorToken | null })`, `setTextBackground({ token: ColorToken | null })`
    - `setColumnsLayout({ pos?: number; ratio?: number[]; valign?: VAlign; lanes?: number })`
    - `setTableLayout({ pos?: number; columnWidths?: number[] | null })`
    - `setSectionLayout({ pos?: number; layout: Partial<SectionLayout> })`
  - On load, a legacy image `width` in pixels becomes `widthFromPixels(px, 720)` and a table's pixel `colwidth`s
    become `columnWidths`, without a history entry.
- [ ] **Step 1: Failing specs** (`block-layout.spec.ts`, jsdom, a headless document editor with `blockLayout()`):
  - `setBlockLayout on an image is one undo step`; `on a paragraph sets no width` (`can` false).
  - `layout survives HTML export and import` for every `LAYOUT_NODES` entry; `Markdown keeps the text and drops
    the layout`.
  - `a stored image width 360 opens as 0.5`, `a table with colwidth 100 and 300 opens as [0.25, 0.75]`; neither
    leaves an undo step.
  - `pasted inline styles map to tokens or drop` (Review Focus 4): the pasted HTML from that line yields
    `textAlign: 'end'` and no colour mark; `<span style="color:red">` yields `textColor` `red`; `getJSON()` matches
    neither `/\d+px/` nor `/#[0-9a-f]{3,8}/i`.
  - `a section refuses a section inside by paste and by setContent` (Review Focus 5).
  - `email mode refuses full, justify and a section width full` (`can` false).
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/profiles/editor
  src/document/layout`; expected FAIL.
- [ ] **Step 3: Implement**; `lint-deps` and the `advanced`-only engine type check stay green.
- [ ] **Step 4: Run** the same, then `CI=true pnpm nx run @zeroxsolutions/editor-core:build`; expected PASS.
- [ ] **Step 5: Commit** `feat(editor-core): block layout attributes, colour marks and commands`.

### Task 7: The registry's layout kit, slots, hues and words

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/document/layout/{layout-words.ts,layout-props.ts,
  block-toolbar.tsx,align-control.tsx,width-toggle.tsx,resize-handles.tsx,index.ts}`, specs
  `resize-handles.browser.spec.tsx`, `block-toolbar.browser.spec.tsx`, `layout-props.spec.ts`
- Modify: `editor/styles.css` (layout rules, and one empty `/* MARK: layout - <track> */` region each for tracks
  b, c, d, e), all 8 `packages/ui/registry/styles/style-*.css` (slot `cn-editor-handle`, the cn-button radius and
  focus ring of each style), `src/build/editor-chrome.spec.ts`, `registry/bases/base-ui/styles.css` (hue variables),
  `packages/ui/registry.json` (new item `editor-layout`; `cssVars` light and dark for the hues on
  `document-editor`), `editor/profiles/messages.ts`, `editor/document/features/standard/standard-kit.ts`
  (register `blockLayout()`), `editor/profiles/email/email-kit.ts` (register `blockLayout({ email: true })`, drop
  `emailGlobalAttributes` for it, map `align` names), `editor/document/serialize/render-to-react.tsx` if the
  walker needs the props

**Interfaces:**

- Consumes: Task 6's commands and `layoutDataAttributes`.
- Produces:
  - `LayoutWords` with `DEFAULT_LAYOUT_WORDS` holding every string the tracks draw: align start/center/end,
    full width, width handle (`Resize, {percent}%`), space before/after and the four sizes, text align four,
    text colour, background, the twelve colour names, lead, small, section and its background, padding and width
    names, add column, remove column, vertical align three, column divider, table column border, reset width.
    `ProfileEditorMessages.layout: LayoutWords`.
  - `layoutProps(attrs: Record<string, unknown>): { 'data-align'?: string; 'data-width'?: string; style?:
    CSSProperties; ... }` (the `--layout-width` custom property holds the fraction; the rules in `styles.css`
    draw it), used by every node view and every `toReact`.
  - `BlockToolbar({ editor, pos, anchor, children, label })`: a `Popover` anchored to the selected block's DOM
    rect, `role="toolbar"`, `cn-editor-toolbar`, shown while that block is node-selected or holds the caret, never
    stealing focus.
  - `AlignControl({ value, onChange, words })`: a `ToggleGroup` of three with `text-align-*` icons and tooltips.
  - `WidthToggle({ full, onChange, words })`: a `Toggle`.
  - `ResizeHandles({ value, onPreview, onCommit, onCancel, words, min?, step? })` with `useResize(...)`: pointer
    events (mouse, pen, touch), a `role="slider"` handle on each side with `aria-valuenow` in percent, arrow keys
    by `0.05`, Escape cancels; the preview changes `--layout-width` only, `onCommit` dispatches one command.
- [ ] **Step 1: Failing specs:**
  - `resize-handles.browser.spec.tsx`: `a drag commits once on release and is one undo step`; `Escape mid-drag
    restores the start width and leaves no history`; `at 375px with touch the handles stay inside the block and
    the page does not scroll sideways` (`document.scrollingElement.scrollWidth <= 375`); `the value stays in
    [0.25, 1] and snaps to 0.05`; `arrow keys step by 5 percent`.
  - `block-toolbar.browser.spec.tsx`: `selecting an image opens the toolbar without moving focus`; `every control is
    reachable by Tab and named from words`.
  - `layout-props.spec.ts`: `an absent layout yields no attribute`; `0.5 yields data-width and --layout-width`.
  - `editor-chrome.spec.ts`: `cn-editor-handle is defined in every style`.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run registry/bases/base-ui/editor/document/layout
  src/build/editor-chrome.spec.ts`; expected FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same and `profiles/email` specs; expected PASS. `CI=true pnpm nx run
  @zeroxsolutions/ui:build-registry`; PASS. Email capture diff; 0 pixels.
- [ ] **Step 5: Commit** `feat(ui): a shared layout kit for the editors' blocks`.

---

## Parallel split

After Task 7 is committed, each track runs in its own worktree on a branch cut from that commit
(`layout/b-media`, `layout/c-columns-table`, `layout/d-section`, `layout/e-text`) and touches only the files it
owns. A file in "Shared, by region" is edited only inside the named region.

| Track                     | Owns                                                                                                                                                                                                                                                                                                                        | Shared, by region                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (b) media                 | `editor/document/features/{image,media,embed,card,bookmark,file}/**`, `editor/document/blocks/**` (the library blocks' view props), `editor/profiles/email/email-feature-view.tsx`, `editor-core/src/blocks/{card.ts,library/{media,bookmark,file}.ts}` (HTML of the layout)                                                | `styles.css` region `layout - media`; `registry.json` entries of those six items                                                                                                |
| (c) columns and table     | `editor/document/features/{columns,table}/**`, `editor/profiles/email/nodes/columns.tsx`                                                                                                                                                                                                                                    | `styles.css` region `layout - columns`; `registry.json` `editor-columns`, `editor-table`; `email-kit.ts` `ratioChoices`/`setRatio` and the columns and table block menu items   |
| (d) section               | create `editor/document/features/section/**`, `editor/profiles/email/nodes/section.tsx`, `examples/editor-section-demo.tsx`                                                                                                                                                                                                 | `styles.css` region `layout - section`; `registry.json` new items `editor-section`, `editor-section-demo`; `email-kit.ts` `NEW_BLOCKS.section`, `SLASH_ORDER`, its feature line |
| (e) text                  | `editor/document/features/standard/{standard-codecs.tsx,standard-ui.tsx}`, `editor/document/ui/{bubble-menu.tsx,color-menu.tsx}` (new), `editor/document/react/editor-block-menu.tsx`, `editor/profiles/email/{marks.ts,email-inline-field.tsx,email-block-items.tsx}`, `editor/profiles/variables/variable-text-field.tsx` | `styles.css` region `layout - text`; `registry.json` `document-editor` files; `email-kit.ts` `MARK_ITEMS`, `EMAIL_MARKS`, `TURNABLE_BLOCKS`                                     |
| (f) docs and verification | `packages/editor-docs-web/content/docs/editor/**` (new `layout.mdx`, `meta.json`), `examples/editor-*-demo.tsx` other than (d)'s, `examples/__*__.tsx` (generated)                                                                                                                                                          | `registry.json` `*-demo` entries                                                                                                                                                |

**Merge order:** (a) is on the branch; then (b), (c), (d), (e) in that order, each rebased on the branch tip before
it merges; then (f), cut from the branch after (e). (b) to (e) may run at once; (f) starts after (e) merges.

**Conflict points and how to resolve them:**

- `registry.json`: each track edits only its own items' entries. On a conflict keep both sides' entries, then run
  `CI=true pnpm nx run @zeroxsolutions/ui:build-registry` and commit what it regenerates; never hand-merge a
  generated file, regenerate it.
- `editor/styles.css`: each track writes only inside its `MARK` region seeded by Task 7, so the regions merge
  cleanly; a rule a track needs outside its region goes to the Task 7 owner (the branch), not into the track.
- `editor/profiles/messages.ts`: no track edits it; every word is in Task 7's `LayoutWords`. A missing word is added
  on the branch first and the track rebases.
- `editor/profiles/email/email-kit.ts`: each track touches only the identifiers named in its row. Conflicts are
  adjacent additions to the same array or record (the feature list `emailKit` returns, `SLASH_ORDER`): keep both,
  in the merge order above, and run the `profiles/email` browser specs.
- `examples/__*__.tsx`: generated; regenerate after the merge rather than resolving lines.

---

## Track (b): media layout controls and resize handles

### Task B1: Image, media, embed and card

**Files:** the four feature folders, `email-feature-view.tsx` (the email card), their specs.

**Interfaces:** consumes `BlockToolbar`, `AlignControl`, `WidthToggle`, `ResizeHandles`, `layoutProps`,
`setBlockLayout`.

- [ ] **Step 1: Failing browser specs** per feature (`<feature>.browser.spec.tsx`):
  - `align from the block toolbar sets data-align and survives the Viewer` (Editor and `Viewer` of the same JSON
    carry equal `data-align`, `data-width` and a drawn width ratio within 1%).
  - `dragging the right handle to half the column stores 0.5`; `one drag is one undo step`.
  - `Full width bleeds to the editor's edges`; `full width is not offered in the email editor`
    (`email-kit.browser.spec.tsx` for the image and card).
  - `in the email editor a drag past 566px stops at 1`.
  - image only: `a stored width 360 draws at half and the old width field is gone` (the pixel `Input` in the image
    popover is removed); `getJSON has no px`.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run registry/bases/base-ui/editor/document/features/{image,media,embed,card}`;
      expected FAIL.
- [ ] **Step 3: Implement**: each view wraps its figure in `layoutProps`, shows `BlockToolbar` with
      `AlignControl`, `WidthToggle` and `ResizeHandles`; each `toReact` and `toHTML` uses `layoutProps` /
      `layoutDataAttributes`.
- [ ] **Step 4: Run** the same; PASS. Commit `feat(ui): align and resize media blocks`.

### Task B2: Bookmark and file

- [ ] **Step 1: Failing browser specs:** `align sets data-align in the Editor and the Viewer`; `no resize handle
  and no full width toggle is drawn`.
- [ ] **Step 2: Run, implement, run** as B1; PASS. Commit `feat(ui): align bookmarks and files`.

## Track (c): columns and table

### Task C1: Columns

**Files:** `features/columns/**`, `profiles/email/nodes/columns.tsx`, `email-kit.ts` (row (c) only).

**Interfaces:** consumes `setColumnsLayout`, `snapRatio`, `ratioFractions`, `BlockToolbar`.

- [ ] **Step 1: Failing browser specs** in `columns.browser.spec.tsx` and `email-kit.browser.spec.tsx`:
  - `dragging the divider to two thirds stores [8, 4]`, `to a quarter stores [3, 9]`; `one drag is one undo step`.
  - `the divider is a slider named from words and moves by keyboard to the next snap`.
  - `add column from the toolbar adds an empty lane up to 4, remove takes the last empty one down to 2` (remove of
    a lane holding text asks nothing and keeps the text by moving it into the previous lane).
  - `valign center sets data-valign in the Editor and the Viewer`.
  - `under 480px the lanes stack and no divider is drawn`.
  - `the same controls work in the email editor` and `the email ratio menu keeps its choices`.
- [ ] **Step 2: Run, implement, run**; PASS. Commit `feat(ui): weigh, add and align columns by hand`.

### Task C2: Table

**Files:** `features/table/**`.

**Interfaces:** consumes `setTableLayout`, `WidthToggle`, `BlockToolbar`.

- [ ] **Step 1: Failing specs** (`table.spec.tsx`, new `table.browser.spec.tsx`):
  - `dragging a column border stores fractions summing to 1`; `one drag is one undo step`; `no column goes below
    0.05`.
  - `a stored table with pixel colwidths opens with the same proportions` (Review Focus 3).
  - `Full width bleeds to the editor's edges and the Viewer draws the same`; `the email editor offers no full
    width and exports columnWidths`.
  - `HTML export carries data-column-widths and imports back`.
- [ ] **Step 2: Run, implement, run**: TableKit's own `resizable` is turned off so pixel widths are never written.
      PASS. Commit `feat(ui): size table columns as fractions`.

## Track (d): the section block

### Task D1: Section in both editors

**Files:** create `features/section/{section.tsx,index.ts,section.spec.tsx,section.browser.spec.tsx}`,
`profiles/email/nodes/section.tsx`, `examples/editor-section-demo.tsx`; `email-kit.ts` and `registry.json` rows
(d).

**Interfaces:** consumes `sectionNodeSpecs`, `setSectionLayout`, `layoutProps`, `BlockToolbar`, `SECTION_*`
tokens. Produces `section(options?: { messages?: Partial<LayoutWords> }): EditorFeature`.

- [ ] **Step 1: Failing specs:**
  - `inserting a section from the slash menu wraps an empty paragraph`; `blocks drag into it and out`.
  - `background, padding and width from the toolbar` set `data-background`, `data-padding`, `data-width` in the
    Editor and the Viewer; the background uses the hue's surface variable in light and dark (computed colour
    differs between modes).
  - `a section cannot be dropped or pasted into a section or a lane` (Review Focus 5).
  - `the email editor offers content and wide only and the preview draws the section`.
  - `HTML and the email wire round-trip a section holding columns`.
- [ ] **Step 2: Run, implement, run**; PASS. Commit `feat(ui): a section block for both editors`.

## Track (e): text styling

### Task E1: Alignment and paragraph styles

**Files:** `standard-codecs.tsx`, `standard-ui.tsx`, `editor-block-menu.tsx`, `profiles/email/email-block-items.tsx`,
`email-kit.ts` row (e).

**Interfaces:** consumes `setTextAlign`, `setParagraphSize`.

- [ ] **Step 1: Failing specs:**
  - `the toolbar's align group sets textAlign on the paragraphs of the selection, in a quote and a list too`.
  - `justify is offered in the Document Editor and not in the email editor`.
  - `turn into Lead and Small from the block menu, and back to Paragraph`; `a heading turned into Lead keeps its
    text`.
  - `the Viewer draws the same alignment and size` (computed `text-align` and font size equal).
  - `HTML carries data-text-align and data-size; Markdown keeps only the text`.
- [ ] **Step 2: Run, implement, run**; PASS. Commit `feat(ui): align text and pick lead or small paragraphs`.

### Task E2: Text and background colour on the bubble

**Files:** `bubble-menu.tsx`, create `document/ui/color-menu.tsx`, `standard-ui.tsx`, `profiles/email/marks.ts`,
`email-inline-field.tsx`, `variables/variable-text-field.tsx`.

**Interfaces:** consumes `setTextColor`, `setTextBackground`, `COLOR_TOKENS`. Produces `ColorMenu({ editor, words
})`: a `Popover` of two `ToggleGroup`s (text, background), each swatch a `Toggle` named from words.

- [ ] **Step 1: Failing specs:**
  - `bubble-menu.browser.spec.tsx`: `picking red colours the selection with the textColor mark`; `Default removes
    it`; `the swatches are reachable by keyboard and named`; `the bubble keeps the selection while the menu is open`.
  - `the colour reads in light and dark from the hue variables` (computed colour changes with `.dark`).
  - `the email inline fields carry the colour as {color=red}...{/color} and the preview draws it`.
  - `pasted HTML with inline colours maps or drops` (Review Focus 4, through the editor's paste).
  - `getJSON and onChange hold no hex`.
- [ ] **Step 2: Run, implement, run**; PASS. Commit `feat(ui): token text and background colours`.

## Track (f): docs, demos and verification

### Task F1: Docs pages and demos

**Files:** create `packages/editor-docs-web/content/docs/editor/layout.mdx`; modify `meta.json`,
`document-editor.mdx` (a "Text styling" section), `email-editor.mdx`, `editor-{image,media,embed,card,bookmark,
file,columns,table}.mdx`, the matching `examples/editor-*-demo.tsx`, `examples/email-editor-demo.tsx`,
`registry.json` demo entries.

- [ ] **Step 1:** The Layout page: the model (tokens, fractions, `full`, space, the reserved `responsive`), the
      section block, what the email offers and why (566px, no bleed), the migration of old pixel widths and align
      names; a live demo in the Document Editor and one in the email editor.
- [ ] **Step 2:** The "Text styling" section: alignment, the colour set (the products' `EmailTheme.hues` and
      `accent` and the registry hue variables), lead and small; both editors' demos.
- [ ] **Step 3:** Each changed block's page names its layout controls in one paragraph.
- [ ] **Step 4:** Regenerate the examples index and the registry (`build-registry`); `CI=true pnpm nx run
  @zeroxsolutions/editor-docs-web:typecheck|test`; PASS. Commit `docs(editor): layout and text styling`.

### Task F2: Browser verification

- [ ] **Step 1:** Run the docs zone; on every changed page, at 1280 and 375, light and dark, in 2 registry styles
      (nova and one other), resize an image, drag a column divider, colour a word, add a section; screenshots to
      `.superpowers/sdd/2026-11-26-block-layout/`. The controls follow the style's radius and ring.
- [ ] **Step 2:** The email capture diff against `before`: 0 pixels for the default emails; a kitchen sink with a
      section, a half-width image and coloured text sent through the renderer and opened in the preview.
- [ ] **Step 3:** Fix what fails in the owning track's files, commit `fix(ui): ...` per fix; the user deploys once
      at the end.
