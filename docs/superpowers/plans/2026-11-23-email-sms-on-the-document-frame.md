# Email and SMS Editors on the Document Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `EmailEditor` and `SmsEditor` as the Document Editor plus profile features, with a grip-opened block menu in the Document Editor itself and a built-in preview, without changing the wire shapes.

**Architecture:** editor-core's `email-blocks` codec maps the email kinds onto the document's own nodes (`paragraph`, `bulletList`, `callout`, `codeBlock`, `horizontalRule`) and a new `docProblems` names what the export cannot carry. The registry's `Editor` opens the features' `blockMenu` items from the grip; `emailKit` becomes `standardKit` + `callout` + `codeBlock` + the email-only features (button, columns, html, variable, `emailLink`, attribute menu items). `EmailEditor` draws the frame the Mermaid editor draws: `CollapsibleCard` muted, toolbar in the header, editor and preview split or tabbed by `layout`.

**Tech Stack:** TypeScript, Tiptap 3 through editor-core, React 19, zod 4, vitest (jsdom and the `@zeroxsolutions/ui:browser` project), shadcn registry, Fumadocs.

**Spec:** `docs/superpowers/specs/2026-11-23-email-sms-on-the-document-frame-design.md`, revising `docs/superpowers/specs/2026-11-20-editor-profiles-design.md` (read both).

## Global Constraints

- Worktree `.claude/worktrees/email-editor-parity`, branch `fix/email-editor-parity` off `origin/master`; run `pnpm install` before the first code commit. Never touch the main checkout.
- Wire shapes unchanged: `toEmailBlocks(fromEmailBlocks(x))` equals `x` for every fixture under `packages/editor-core/src/profiles/core/fixtures`, and the SMS body string is unchanged. The existing round-trip, validation, markup and meter specs are not edited except where a task names a node rename.
- Email kinds: `paragraph`, `button`, `code`, `list`, `callout`, `divider`, `columns`, `html`. Attributes: `align` `left|center|right`; `spaceAfter` `small|medium|large`; `tone` `default|muted`; `width` `inline|full`; `ratio` per lane.
- Problem kinds: the 15 of the 2026-11-20 plan plus exactly one new one, `block-not-carried`.
- No copy of a document block, node view, menu or toolbar under `profiles/`. No control drawn inside the document flow for what a menu can hold.
- Icons: the registry's animated icons (`@/registry/bases/base-ui/icons/lucide/*`), never `lucide-react` directly, in chrome this plan touches.
- Chrome draws from style slots (`cn-*`), never a literal radius or shadow (`src/build/editor-chrome.spec.ts`).
- No deploy, no npm publish, no editor-core version bump in this plan.
- Toolchain: `export PATH=$HOME/.local/share/mise/installs/node/24.22.1/bin:$HOME/.local/share/mise/installs/pnpm/10.33.0:$PATH` before every command, a commit included. nx targets only (`CI=true pnpm nx run <project>:<target>`); never run e2e locally; never `pkill` or `killall` by name.
- Never stage `apps/registry-ui/next-env.d.ts`, `apps/registry-editor-docs-zone/next-env.d.ts`, `apps/native-preview-uniwind/uniwind-types.d.ts`.
- Commits: conventional, header at most 72 characters, `git commit -F`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; files plain ASCII.
- Before editing a file, open the gundam skill for its kind (component, unit test, component test, comment, prose).

## Rulings made while planning

- The link stays the email profile's own `emailLink` mark (attribute `variable`): the export stores a variable name, not an href, and `editor-link`'s mark holds an href. Its control moves into the one toolbar row (Task 5). Cost if wrong: swapping the mark's UI later, no wire change. The spec's block table is amended in Task 8.
- The email list is the document's `bulletList` > `listItem` > `paragraph`. `orderedList` and `taskList` are not offered; one reaching the document exports as `list` and is a `block-not-carried` problem.
- The callout is the document's `callout` with `variant: 'info'` fixed; the code block is the document's `codeBlock` with its language picker hidden and `language` dropped on export. Both features gain an option for that (Task 3).
- The grip selects its block (a `NodeSelection`) on press, so block menu items run ordinary selection commands; a drag still starts from the same press.

## Review Focus

1. A pasted heading or numbered list in the email editor: kept as text, exported as `paragraph` / `list`, and marked `block-not-carried`, never dropped. (Task 1 spec.)
2. Grip press then drag versus grip click: a drag moves the block and opens no menu; a click opens the menu and moves nothing. (Task 2 browser spec.)
3. Locked structure or a required block: every attribute item and Delete in the block menu is disabled with its reason. (Task 4 browser spec.)
4. A list item holding two paragraphs or a nested list: exported as one line (paragraphs joined by a space) and marked. (Task 1 spec.)
5. `layout="auto"` resized across the breakpoint keeps the document and caret (the editor is not remounted). (Task 5 browser spec.)

---

### Task 1: The email codec on the document's nodes

**Files:**

- Modify: `packages/editor-core/src/profiles/core/email-nodes.ts`, `email-blocks.ts`, `types.ts`, `validate.ts`, `index.ts`
- Modify: `packages/editor-core/src/profiles/editor/block-identity.ts`
- Create: `packages/editor-core/src/profiles/core/doc-problems.ts`
- Test: `email-blocks.spec.ts`, `doc-problems.spec.ts` (new), `block-identity.spec.ts`

**Interfaces:**

- Produces: `EMAIL_BLOCK_NODES` = `['bulletList', 'callout', 'codeBlock', 'horizontalRule', 'emailButton', 'emailColumns', 'emailHtml', 'emailUnknown', 'heading', 'orderedList', 'taskList', 'blockquote']` (the nodes `blockIdentity` keys, besides `paragraph`); `emailNodeSpecs.nodes` keeps only `emailButton`, `emailColumns`, `emailLane`, `emailHtml`, `emailUnknown`, `variable`; `EMAIL_GLOBAL_ATTRIBUTES: Record<string, string[]>` (node name to the email attributes it carries: paragraph `align spaceAfter tone source`, bulletList `align spaceAfter`, callout `align spaceAfter source`, codeBlock `align spaceAfter`, horizontalRule `spaceAfter`); `docProblems(doc: DocJSON): ProfileProblem[]`; problem kind `block-not-carried` with `blockId: string | null` and `blockKey: string`.
- Mapping: `list` <-> `bulletList` > `listItem` > `paragraph` (one per item, `source` on the paragraph); `callout` <-> `callout{variant:'info'}` > one `paragraph`; `code` <-> `codeBlock{language:'text', code}`; `divider` <-> `horizontalRule`.

- [ ] **Step 1: Failing tests.** In `email-blocks.spec.ts`, change the expected node names for the four kinds and add: `fromEmailBlocks` of a `list` block yields `bulletList` > `listItem` > `paragraph`; `toEmailBlocks` of a doc holding a `heading` with text `Hi` yields `{type:'paragraph', content:{text:'Hi'}}`; of an `orderedList` yields `type:'list'`; of a `listItem` with two paragraphs `a`, `b` yields item `'a b'`. Every fixture round-trips equal (`sameBlockContent`). In `doc-problems.spec.ts`: one `block-not-carried` each for `heading`, `orderedList`, `taskList`, `blockquote`, a two-paragraph `listItem`, a nested list, a two-paragraph `callout`; none for a doc built by `fromEmailBlocks` from the fixtures.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/profiles`; expected FAIL.
- [ ] **Step 3: Implement** the mapping in `importBlock`/`exportBlock`, `docProblems` walking top-level and lane blocks, the new kind in `types.ts` and its place in `validate.ts`'s kind list, `blockIdentity` keying `EMAIL_BLOCK_NODES` and `paragraph`, the exports in `index.ts`.
- [ ] **Step 4: Run** the same, then `CI=true pnpm nx run-many -t lint typecheck -p @zeroxsolutions/editor-core`; PASS.
- [ ] **Step 5: Commit** `feat(editor-core): read email blocks into the document's own nodes`.

### Task 2: A grip-opened block menu in the Document Editor

**Files:**

- Modify: `packages/editor-core/src/document/core/types/ui-contribution.ts`, `packages/editor-core/src/document/core/command/built-in-commands.ts`
- Modify: `packages/ui/registry/bases/base-ui/editor/document/react/editor.tsx`, `document/features/standard/standard-ui.ts`
- Delete: `packages/ui/registry/bases/base-ui/editor/document/ui/block-menu.tsx` (folded into the grip) and its uses in `chrome.spec.tsx` and `chrome-icon-size.browser.spec.tsx`
- Test: `document/react/editor-handle.browser.spec.tsx`, `built-in-commands` spec beside the file

**Interfaces:**

- Produces: `BlockMenuItem` gains `group?: string` (items sharing a group render as one labelled radio submenu), `active?(editor: IEditor): boolean`, `disabledReason?(editor: IEditor): string | null`. Built-in commands `selectBlockAt({ y: number })` (NodeSelection of the top-level or lane block under `y`), `duplicateBlock()` (copies the selected block below it, `id` attributes set to `null`, new `key`s left to `blockIdentity`), `deleteBlock()`. `standardKit` contributes block menu items `turn-into-*` (Text, Heading 1-3, Bulleted list, Numbered list, To-do list, Quote; group `Turn into`), `duplicate`, `delete` (separatorBefore).
- `Editor` computes `collectUiContributions(features).blockMenu` and renders it in the house `DropdownMenu` anchored to the grip; it is not a prop.

- [ ] **Step 1: Failing browser specs** in `editor-handle.browser.spec.tsx`: clicking the grip of the second block opens a menu named "Block actions" holding Duplicate and Delete; Delete removes that block only; Duplicate leaves two equal blocks; pressing the grip and dragging past the next block moves it and no menu opens; "Turn into" > "Heading 1" makes the block a heading. A unit spec: `duplicateBlock` sets `id` to `null` on the copy.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run --project @zeroxsolutions/ui:browser registry/bases/base-ui/editor/document/react`; FAIL.
- [ ] **Step 3: Implement.** The grip click is a `click` with no drag in between (pointer moved under 4px); it runs `selectBlockAt` with the grip's centre and opens the menu. Items honour `disabledReason` (disabled item with a tooltip naming the reason) and `active` (radio checked).
- [ ] **Step 4: Run** the same plus `CI=true pnpm nx run-many -t lint typecheck -p @zeroxsolutions/editor-core @zeroxsolutions/ui`; PASS.
- [ ] **Step 5: Commit** `feat(ui): open the block menu from the document editor's grip`.

### Task 3: Callout and code block options for a narrower profile

**Files:**

- Modify: `packages/ui/registry/bases/base-ui/editor/document/features/callout/callout.tsx`, `code-block/code-block.tsx`, `code-block/code-settings-menu.tsx`
- Test: `callout.spec.tsx`, `code-block.spec.tsx`

**Interfaces:**

- Produces: `callout(options?: { variants?: readonly CalloutVariant[] })` (default all; with one variant the view draws no variant picker and inserts that variant); `codeBlock(options?: { languagePicker?: boolean })` (default `true`; `false` hides the language control and inserts `language: 'text'`).

- [ ] **Step 1: Failing specs:** `callout({ variants: ['info'] })` view renders no variant picker; `codeBlock({ languagePicker: false })` view renders no language control; defaults unchanged (existing specs pass).
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run registry/bases/base-ui/editor/document/features`; FAIL.
- [ ] **Step 3: Implement** the options.
- [ ] **Step 4: Run** the same; PASS.
- [ ] **Step 5: Commit** `feat(ui): let a profile narrow the callout and code block`.

### Task 4: emailKit composed from the document's features

**Files:**

- Modify: `packages/ui/registry/bases/base-ui/editor/profiles/email/email-kit.ts`, `kit-context.ts`, `nodes/block-style.ts`, `nodes/button.tsx`, `nodes/columns.tsx`, `problem-decorations.ts`, `../variables/variable.tsx` (chip state)
- Delete: `profiles/email/nodes/code.tsx`, `list.tsx`, `callout.tsx`, `divider.tsx`, `profiles/email/block-attributes-menu.tsx`
- Modify: `profiles/sms/sms-kit.ts`
- Test: `email-kit.browser.spec.tsx`, `sms-editor.browser.spec.tsx`

**Interfaces:**

- Consumes: Task 1's specs and `EMAIL_GLOBAL_ATTRIBUTES`, Task 2's `BlockMenuItem` fields and commands, Task 3's options.
- Produces: `emailKit(profile, extra?, context)` returns `[standardKit({ placeholder }), callout({ variants: ['info'] }), codeBlock({ languagePicker: false }), ...emailFeatures]`, where the email features add the email-only nodes, the global attributes, `emailLink`, and block menu items per attribute (`group` `Align`, `Space after`, `Tone`, `Width`, `Lanes`; `disabledReason` from locked structure and required blocks; Delete's reason likewise). The kit's slash, toolbar and bubble items are filtered to the profile's kinds and marks (`emailUi(contributions, profile)`); `MAIL_LAYOUT_KINDS` narrows them the same way. `smsKit(profile)` returns `[standardKit({ placeholder, dragHandle: false }), variable feature]` with every slash, toolbar, bubble and block menu item filtered out but the variable's.
- The variable chip of an undeclared name uses the `destructive` token on its own border and text; the underline decoration is removed. Problem markers stay in the block's gutter row, right-aligned, never positioned over content.

- [ ] **Step 1: Failing browser specs:** the email editor's slash menu lists exactly Text, Bulleted list, Callout, Code, Divider, Button, Columns, HTML (profile with all kinds) and only the mail-layout five under `MAIL_LAYOUT_KINDS`; the grip and "+" are present (`.drag-handle`, `[data-editor-add]`); the block menu of a paragraph holds Align (Left, Center, Right) and setting Center exports `attributes.align: 'center'`; under `structure: 'locked'` every attribute item and Delete are disabled with the locked reason; a required block's Delete is disabled with the required reason; pasting `<h1>Hi</h1>` shows one problem marker; the SMS editor has no grip, no "+" and no slash menu.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run --project @zeroxsolutions/ui:browser registry/bases/base-ui/editor/profiles`; FAIL.
- [ ] **Step 3: Implement**, then delete the replaced files and every import of them.
- [ ] **Step 4: Run** the same plus `CI=true pnpm nx run-many -t lint typecheck -p @zeroxsolutions/ui`; PASS.
- [ ] **Step 5: Commit** `refactor(ui): compose the email kit from the document's features`.

### Task 5: The EmailEditor frame and its preview

**Files:**

- Modify: `packages/ui/registry/bases/base-ui/editor/profiles/email/email-editor.tsx`, `url-variable-picker.tsx`, `../variables/variable-menu.tsx`, `document/ui/editor-toolbar.tsx`, `profiles/messages.ts`
- Test: `email-editor.browser.spec.tsx`

**Interfaces:**

- Produces: `EmailEditorProps` gains `layout?: 'auto' | 'split' | 'tabs'` (default `'auto'`); messages gain `editTab` (`'Edit'`) and `previewTab` (`'Preview'`). `EditorToolbar` gains `end?: ReactNode`, drawn in its row after a separator; the link picker and the variable menu render there as icon buttons with tooltips, in the toolbar's own control style.
- Frame: `CollapsibleCard variant="muted"` with `data-slot="email-editor"`; header = `EditorToolbar`; body = the editor, and with a renderer the preview: `ResizablePanelGroup` (55/45) when split, `Tabs` with `editTab`/`previewTab` when tabbed; `'auto'` is split unless `useIsMobile()`. The editor instance is mounted once and moved between layouts without remount (render both layouts' slots around one `Editor` element via a stable container). The preview iframe fills its panel (`h-full`), no fixed height; the unplaced and preview problem lists sit in the frame's footer.

- [ ] **Step 1: Failing browser specs:** at 1280px wide with a renderer, the editor and an iframe titled by `emailPreview` are both visible; at 375px a tablist shows Edit and Preview and the iframe is visible only after Preview is chosen; typing, then resizing from 1280 to 375 and back, keeps the typed text and focusable caret; without a renderer there is no tablist and no iframe; the link picker and the variable menu are buttons inside the toolbar's `role="toolbar"`.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run --project @zeroxsolutions/ui:browser registry/bases/base-ui/editor/profiles/email/email-editor.browser.spec.tsx`; FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same plus every spec under `profiles/` and `document/`, and `CI=true pnpm nx run-many -t lint typecheck -p @zeroxsolutions/ui`; PASS.
- [ ] **Step 5: Commit** `feat(ui): draw the email editor in the editor frame with its preview`.

### Task 6: The SmsEditor frame

**Files:**

- Modify: `packages/ui/registry/bases/base-ui/editor/profiles/sms/sms-editor.tsx`, `sms-meter.tsx`
- Modify: `packages/ui/registry/bases/base-ui/examples/sms-editor-demo.tsx` (variable labels lower case, e.g. `code`)
- Test: `sms-editor.browser.spec.tsx`

**Interfaces:**

- Produces: the same `CollapsibleCard` frame as Task 5, header `EditorToolbar` with the variable menu in `end`, the meter in the frame's footer starting at the text's left edge.

- [ ] **Step 1: Failing browser spec:** the variable menu is inside `role="toolbar"`; the meter's left edge equals the editor content's left edge (within 1px); existing SMS specs pass.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run --project @zeroxsolutions/ui:browser registry/bases/base-ui/editor/profiles/sms`; FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same; PASS.
- [ ] **Step 5: Commit** `feat(ui): draw the sms editor in the editor frame`.

### Task 7: Registry items, demos and docs pages

**Files:**

- Modify: `packages/ui/registry.json` (email-editor and sms-editor files and `registryDependencies`: add `editor-callout`, `editor-code-block`, `collapsible-card`, `resizable`, `tabs`; drop deleted files), `packages/ui/registry/bases/base-ui/examples/email-editor-demo.tsx`
- Modify: `packages/editor-docs-web/content/docs/editor/email-editor.mdx`, `sms-editor.mdx`, `document-editor.mdx` (the grip's block menu)
- Modify: the site link that prefetches `/docs/editor` (it answers 404; point it at the editor docs' first page or add the index page the sidebar's "Editor" entry names)

**Interfaces:**

- Docs outline, as `document-editor.mdx`: demo, Installation, Usage (one short example), API reference (props table, one line per prop), then at most these sections: Variables, Validation (problem table), Markup. No "Travel" or "Hosting the value" section, no paragraph over four sentences; wording passes the `cutting-ai-tells` and `writing-prose` skills.

- [ ] **Step 1: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run registry/registry.spec.ts src/build`; note failures from Tasks 4-6's file moves.
- [ ] **Step 2: Implement** the registry entries, demos and pages.
- [ ] **Step 3: Run** the same plus `CI=true pnpm nx run-many -t lint typecheck build -p @zeroxsolutions/ui @zeroxsolutions/editor-docs-web`; PASS.
- [ ] **Step 4: Commit** `docs(editor): rewrite the email and sms editor pages`.

### Task 8: Side-by-side review and the spec amendment

**Files:**

- Modify: `docs/superpowers/specs/2026-11-23-email-sms-on-the-document-frame-design.md` (the link row: `emailLink`, email profile, per this plan's ruling)
- Create: `.superpowers/sdd/<plan workspace>/screens/` (not committed)

- [ ] **Step 1:** Start the editor docs zone locally (`CI=true pnpm nx run registry-editor-docs-zone:dev --port 3201`, background, own PID recorded) and screenshot, at 1440x1000 and 390x844, in light and dark: the Document Editor demo, the Email Editor demo (hover a block so grip and "+" show; open its block menu), the SMS Editor demo.
- [ ] **Step 2:** Compare each against the Document Editor: grip, "+", toolbar row, block menu, fonts, spacing. List every difference; fix each in the owning task's files and re-shoot.
- [ ] **Step 3:** Amend the spec's link row; commit `docs(spec): keep the email link a variable mark`.
- [ ] **Step 4:** Stop the dev server by its PID.

---

## Addendum (2026-11-23): variables in every text field

**Spec:** `docs/superpowers/specs/2026-11-23-variables-in-every-text-field-design.md`. Same Global Constraints.

### Task 9: Hrefs and labels as token strings in editor-core

**Files:** `packages/editor-core/src/template/markup/inline-markup.ts`, `template/email/context.ts`, `template/email/blocks/button.ts`, `profiles/core/validate.ts`, `profiles/core/types.ts`, `profiles/core/email-blocks.ts`, `profiles/core/email-nodes.ts`, their specs.

**Interfaces:**

- Produces: `InlineLink { kind: 'link'; href: string; label: InlineText[] }`; `hrefProblem(href: string, typeOf: (name: string) => VariableType | undefined): 'href-invalid' | null` (one function used by validate for buttons and links, exported from `template/index`); problem kinds `href-invalid`, `link-invalid` replace `href-not-url-variable`, `link-not-url-variable` (profiles and renderer); `emailLink` mark attrs `{ href: string }`; codec reads a legacy `emailLink{variable}` as `href: '{{variable}}'`.
- Renderer `ctx.href(template)`: leading `url` token filled raw (escaped, scheme-checked, `href-scheme-refused` as today); every other token `encodeURIComponent`-ed; fixed scheme literal required otherwise (`href-invalid`).

- [ ] Step 1: failing specs per the spec's Testing section (markup, validate, renderer, codec legacy mark).
- [ ] Step 2: run `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template src/profiles`; FAIL.
- [ ] Step 3: implement.
- [ ] Step 4: same run + lint/typecheck; PASS.
- [ ] Step 5: commit `feat(editor-core)!: let a link hold any text with variables` with a `BREAKING CHANGE:` paragraph naming the replaced problem kinds and `InlineLink.href`.

### Task 10: One variable text field for labels and hrefs

**Files:** create `packages/ui/registry/bases/base-ui/editor/profiles/variables/variable-text-field.tsx`; modify `profiles/email/nodes/button.tsx`, `profiles/email/email-kit.ts` (button Link item), `profiles/email/url-variable-picker.tsx` (becomes the link editor), `profiles/email/marks.ts`, `profiles/messages.ts`, registry.json; specs.

**Interfaces:**

- Produces: `VariableTextField({ value: string; onValueChange(value: string): void; declarations: () => VariableDeclaration[]; label: string; placeholder?: string; disabled?: boolean; invalid?: boolean })`: a single-line field built on the editor core with the variable feature (no blocks, no marks, no line breaks; Enter commits), tokens as chips, `{{` opens the variable menu, undeclared tokens marked.
- The button label edits inline through `VariableTextField`. The button's block menu "Link" item opens a popover holding a `VariableTextField` for the href plus the declared `url` variables as one-click choices. The toolbar's and bubble's link control opens the same popover for the selection's link (set, change, remove).
- Messages for `href-invalid` and `link-invalid` replace the removed kinds' messages.

- [ ] Step 1: failing browser specs: `{{` in the button label inserts a chip and exports `{{name}}`; typing `https://x.test/a?t={{token}}` as a link href exports that href; an undeclared token in an href is marked; a url-variable choice sets `{{trip_url}}`; locked structure disables the href field.
- [ ] Step 2-4: run the editor browser suite, `registry src/build`, lint/typecheck; FAIL then PASS.
- [ ] Step 5: commit `feat(ui): edit labels and links as text with variables`.

### Task 11: Variables in code and HTML blocks

**Files:** create `packages/ui/registry/bases/base-ui/editor/profiles/variables/code-mirror-variables.tsx` (CodeMirror extension, in the `email-editor` item); modify `document/features/code-block/code-block.tsx` (an option `extensions?: () => Extension`, built once per pane), `profiles/variables/variable.tsx` (the HTML block's tokens and text insert), `profiles/variables/variable-menu.tsx` (a focused code pane takes the toolbar's pick), `profiles/email/email-kit.ts`, the email docs page's Variables section; specs.

**Interfaces:**

- Produces: `codeMirrorVariables({ declarations, subscribe?, icon? }): Extension`: highlights `{{name}}`, marks undeclared names, redraws when `subscribe` signals (the variable feature's `watchDeclarations`), and completes on `{{` through `@codemirror/autocomplete`, taking in a `}}` already after the caret. `variablePaneOf(element)` and `insertPaneVariable(view, name)` let the toolbar's variable menu write into a focused pane. The HTML block keeps plain text: `variable.tsx` draws its tokens with a ProseMirror decoration and `insertVariable` writes literal `{{name}}` text there, so the export is unchanged.

- [ ] Step 1: failing browser specs: `{{` in a code block offers the declarations and inserts `{{name}}`; an undeclared token in code and in HTML is marked; exports unchanged.
- [ ] Step 2-4: run, FAIL then PASS, plus lint/typecheck and the docs zone build.
- [ ] Step 5: commit `feat(ui): detect variables in code and html blocks`.
