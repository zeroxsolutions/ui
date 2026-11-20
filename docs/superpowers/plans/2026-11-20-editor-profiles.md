# Editor profiles (email and SMS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the email and SMS profiles of the design system's editor, with typed variables, validation on the wire shape, inline marks, and the `EmailEditor` and `SmsEditor` registry items that let travel delete its block editor.

**Architecture:** Everything that renders nothing lives in `@zeroxsolutions/editor-core` under a new `src/profiles/` folder: the wire types, the profiles, `validate`, the email node specs, the `email-blocks` and `sms-text` codecs, and the block-identity engine plugin. The registry adds the React parts under `packages/ui/registry/bases/base-ui/editor/profiles/`: node views, the variable chip and its `{{` menu, the problem decorations, the SMS meter, and the two editor surfaces. Inline markup comes from `@zeroxsolutions/template`, never re-implemented.

**Tech Stack:** TypeScript, Tiptap 3 through editor-core, React 19, zod 4, vitest (jsdom and the `@zeroxsolutions/ui:browser` project), shadcn registry, Fumadocs.

**Spec:** `docs/superpowers/specs/2026-11-20-editor-profiles-design.md`. Prerequisite: `docs/superpowers/plans/2026-11-20-template-inline-markup.md` merged and the new `@zeroxsolutions/template` published (the owner's go).

## Global Constraints

- Worktree `.claude/worktrees/editor-profiles` off `origin/master`, branch `feat/editor-profiles`; `pnpm install` before the first commit. Never touch the main checkout.
- `@zeroxsolutions/editor-core` adds `@zeroxsolutions/template` (the version Plan A published) to `dependencies`; zod stays its own dependency.
- Variable types are the house `VARIABLE_TYPES` (`string`, `duration`, `url`, `email`); a token is `{{name}}`, `name` `\w+`.
- Email kinds: `paragraph`, `button`, `code`, `list`, `callout`, `divider`, `columns`, `html`. Mail-layout regions allow `paragraph`, `list`, `callout`, `divider`, `columns`.
- Bounds: text, label, href and list bounds from `@zeroxsolutions/template/email` (`BLOCK_TEXT_MAX_LENGTH` 5000, `BUTTON_LABEL_MAX_LENGTH` 200, `BUTTON_HREF_MAX_LENGTH` 2000, `LIST_MAX_ITEMS` 20); profile options with travel's defaults for the rest: `maxBlocks` 50 (lane children counted), `maxLanes` 4, `maxVariables` 20; one level of nesting.
- `align`: `left | center | right`; `spaceAfter`: `small | medium | large` (default `medium`); `tone`: `default | muted`; `width`: `inline | full`; `ratio`: 2..4 integers 1..12, one per lane.
- Marks in the email profile: bold, italic, link to one declared `url` variable; on paragraph, callout and list items only. SMS: no block but its body, no mark.
- Problem kinds, exactly: `variable-undeclared`, `href-not-url-variable`, `link-not-url-variable`, `required-variable-not-printed`, `markup-malformed`, `block-not-allowed`, `unknown-block-type`, `block-nested-too-deep`, `lanes-mismatch`, `text-empty`, `text-too-long`, `list-too-long`, `too-many-blocks`, `sms-segment-exceeded`, `sms-placeholder-malformed`.
- The editor never fills variables with real values and never refuses an edit because of a problem.
- Registry: item names `email-editor`, `sms-editor`, category `editor`, files targeting `components/editor/<path below editor/>`, one `<name>-demo` each; docs pages `packages/editor-docs-web/content/docs/editor/<name>.mdx`, listed under "Surfaces" in `packages/ui/src/site/constants/editor-docs-sections.ts`.
- Chrome draws from style slots (`cn-*`), never a literal radius or shadow (`src/build/editor-chrome.spec.ts` enforces it).
- Toolchain: `export PATH=$HOME/.local/share/mise/installs/node/24.22.1/bin:$HOME/.local/share/mise/installs/pnpm/10.33.0:$PATH` before every command, a commit included. nx targets only (`CI=true pnpm nx run <project>:<target>`); never run e2e locally; never `pkill` by name.
- Never stage `apps/registry-ui/next-env.d.ts`, `apps/registry-editor-docs-zone/next-env.d.ts`, `apps/native-preview-uniwind/uniwind-types.d.ts`.
- Commits: conventional, header at most 72 characters, `git commit -F`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; files plain ASCII.

## Rulings made while planning (the spec left these open or did not fit the code)

- `EditorProfile` in core carries kinds, variables, bounds and exports, not `features`: features carry React node views, which core cannot import. The registry's `emailKit(profile, extra?)` and `smsKit(profile)` build the feature list from a profile. Cost if wrong: one more function a host calls.
- The email paragraph is the core's built-in `paragraph`; its email attributes ride as global attributes from the email kit's engine extension. Every other email kind is its own node: `emailButton`, `emailCode`, `emailList` > `emailListItem`, `emailCallout`, `emailDivider`, `emailColumns` > `emailLane`, `emailHtml`; inline node `variable`; marks `bold`, `italic`, `emailLink` (attribute `variable`).
- A custom feature joins the email profile by giving its node codec `toEmailBlock(node)` and `fromEmailBlock(block)`; `emailKit` throws `EditorError('editor.profile.no_email_codec', ...)` naming a feature whose block node lacks them.
- `validate(value, profile)` takes the profile, not a loose rule list, so a server builds the same profile the editor used.

## Review Focus

1. A pasted text holding `{{name}}` for an undeclared name: becomes a `variable` node and a `variable-undeclared` problem, never plain text or a dropped token; pinned in Task 6.
2. A duplicated block (copy and paste, or Duplicate in the block menu) keeping its source's id, so two blocks share a translation key: pinned in Task 5 (`gives a pasted copy of a block a null id`).
3. A translated locale (`structure: 'locked'`) where Backspace at the start of a block merges it into the previous one: pinned in Task 5 (`refuses a join in locked structure`).
4. An emoji or CJK SMS body: the meter switches to UCS-2 and 70 units; pinned in Task 9.
5. A stored version that round-trips with a changed attribute order or a default made explicit, so travel sees an edit that did not happen: pinned in Task 4 (`sameBlockContent` on every travel default).

---

### Task 1: Wire types and profiles

**Files:**

- Create: `packages/editor-core/src/profiles/core/types.ts`, `profiles/core/profile.ts`, `profiles/core/index.ts`, `profiles/index.ts`
- Test: `packages/editor-core/src/profiles/core/profile.spec.ts`
- Modify: `packages/editor-core/package.json` (dependency)

**Interfaces:**

- Produces, from `@zeroxsolutions/editor-core/profiles/index`:

  ```ts
  type EmailBlockKind = 'paragraph' | 'button' | 'code' | 'list' | 'callout' | 'divider' | 'columns' | 'html';
  interface VariableDeclaration { name: string; type: VariableType; label?: string; sampleValue?: string; required?: boolean }
  interface EditorEmailBlock { id: string | null; key: string; type: string; attributes: Record<string, unknown>; content: Record<string, unknown>; lanes?: EditorEmailBlock[][] }
  interface ProfileProblem { kind: ProblemKind; block: string | null; field?: string; item?: number; offset?: number; name?: string }
  interface EmailBounds { text: number; label: number; href: number; listItems: number; blocks: number; lanes: number; variables: number }
  interface EditorProfile { id: 'email' | 'sms' | (string & {}); kinds: readonly string[]; variables: readonly VariableDeclaration[]; bounds: EmailBounds; maxSegments?: number; exports: readonly Format[] }
  function emailProfile(options?: { allow?: readonly EmailBlockKind[]; variables?: readonly VariableDeclaration[]; bounds?: Partial<EmailBounds>; extraKinds?: readonly string[] }): EditorProfile;
  function smsProfile(options?: { variables?: readonly VariableDeclaration[]; maxSegments?: number }): EditorProfile;
  const MAIL_LAYOUT_KINDS: readonly EmailBlockKind[]; // paragraph, list, callout, divider, columns
  ```

  `ProblemKind` is the union of the Global Constraints list. `block` holds the id, or the key when the id is null.

- [ ] **Step 1: Write the failing tests:** `emailProfile()` has all eight kinds, exports `['email-blocks', 'email-html', 'email-text']`, bounds `{ text: 5000, label: 200, href: 2000, listItems: 20, blocks: 50, lanes: 4, variables: 20 }`; `emailProfile({ allow: MAIL_LAYOUT_KINDS })` has those five; `allow` naming an unknown kind throws; `smsProfile()` has kinds `[]`, `maxSegments` 1, exports `['sms-text']`; a declaration list with a duplicate name or a name failing `\w+` (<= 64 chars) throws; more than `bounds.variables` declarations throws.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/profiles`; expected FAIL.
- [ ] **Step 3: Implement** the two files; the text bounds read the template constants.
- [ ] **Step 4: Run** the same, then `CI=true pnpm nx run-many -t lint typecheck -p @zeroxsolutions/editor-core`; PASS.
- [ ] **Step 5: Commit** `feat(editor-core): email and SMS profiles`.

### Task 2: Validating an email

**Files:**

- Create: `packages/editor-core/src/profiles/core/validate.ts` (email half), `profiles/core/validate.spec.ts`

**Interfaces:**

- Consumes: Task 1 types; `parseInlineMarkup`, `variableTokens` from `@zeroxsolutions/template`.
- Produces: `validate(value: readonly EditorEmailBlock[] | string, profile: EditorProfile): ProfileProblem[]` (a string goes to the SMS half, Task 3; until then it returns `[]`).

- [ ] **Step 1: Write the failing tests**, one per kind, each with the smallest input and the exact problem: `variable-undeclared` (`{ kind, block: 'k1', field: 'text', name: 'x' }`); `href-not-url-variable` (button href `{{name}}` where `name` is `string`, and href `https://x`); `link-not-url-variable` (paragraph `[a]({{name}})`); `required-variable-not-printed` (`block: null, name`); `markup-malformed` (`'**a'`, with `offset: 0`); `block-not-allowed` (a `button` under `MAIL_LAYOUT_KINDS`); `unknown-block-type`; `block-nested-too-deep` (columns in a lane); `lanes-mismatch` (`ratio` of 3 with 2 lanes); `text-empty` (paragraph `''`, list item `''` with `item`); `text-too-long` (5001 chars, markers counted); `list-too-long` (21 items); `too-many-blocks` (51 counting lane children, `block: null`); plus `returns nothing for a valid email` over a document holding every kind.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/profiles/core/validate.spec.ts`; FAIL.
- [ ] **Step 3: Implement** the email half: walk blocks and lanes once; text fields per kind: paragraph/callout `text`, list `items[i]`, button `label` (plain, tokens only) and `href`, code `code`, html `html`; markup is parsed only on the three marked kinds.
- [ ] **Step 4: Run**; PASS. Lint and typecheck as Task 1.
- [ ] **Step 5: Commit** `feat(editor-core): validate an email against its profile`.

### Task 3: SMS text and its checks

**Files:**

- Create: `packages/editor-core/src/profiles/core/sms-text.ts`, `sms-text.spec.ts`; Modify: `validate.ts`, `validate.spec.ts`

**Interfaces:**

- Produces: `toSmsText(doc: DocJSON): string`; `fromSmsText(body: string): DocJSON` (one `paragraph` per line, `{{name}}` as `variable` nodes, so a hard break survives); `measureSmsBody(body: string): { units: number; limit: number; encoding: SmsEncoding; segments: number }` from the house `measureSms`, tokens counted as their literal text.
- [ ] **Step 1: Write the failing tests:** round trip `'Hi {{name}},\nyour code is {{code}}.'` equal; `fromSmsText('{{a}}')` holds one `variable` node `a`; `sms-segment-exceeded` for 161 ASCII chars and for 71 chars with one Vietnamese `a` with dot below (U+1EA1, outside GSM-7); `^{}\[]~|` each cost two units (`'{'.repeat(81)` exceeds); `sms-placeholder-malformed` for `'Hi {{name}'` and `'Hi }}'` with the offset of the stray brace; `measureSmsBody('xin chao')` is GSM-7.
- [ ] **Step 2: Run** `... -- --run src/profiles/core`; FAIL.
- [ ] **Step 3: Implement**; the malformed check is travel's: remove valid tokens, then any `{{` or `}}` left is a problem.
- [ ] **Step 4: Run**; PASS.
- [ ] **Step 5: Commit** `feat(editor-core): export, import and check an SMS body`.

### Task 4: Email nodes and the email-blocks codec

**Files:**

- Create: `packages/editor-core/src/profiles/core/email-nodes.ts` (engine-free `NodeSpec`s and `MarkSpec`s for the names in the Rulings, no `render`), `email-blocks.ts`, `email-blocks.spec.ts`, `fixtures/travel-defaults.fixture.ts`
- Modify: `packages/editor-core/src/document/core/types/codec.ts` (`NodeCodec.toEmailBlock?`, `fromEmailBlock?`)

**Interfaces:**

- Produces: `emailNodeSpecs: { nodes: NodeSpec[]; marks: MarkSpec[] }`; `toEmailBlocks(doc: DocJSON, codecs?: readonly NodeCodec[]): EditorEmailBlock[]`; `fromEmailBlocks(blocks: readonly EditorEmailBlock[], codecs?: readonly NodeCodec[]): DocJSON`. Every block node has attributes `id: string | null`, `key: string`, plus its kind's attributes; marked text is written with `printInlineMarkup`, read with `parseInlineMarkup`; a `variable` node is `{{name}}`.
- [ ] **Step 1: Write the fixture:** the block arrays of travel's defaults at `origin/master` (`packages/notification/src/lib/constants/{auth,community,traveller,trip}-templates.ts` and `mail-layout-defaults.ts`), every locale, as `EditorEmailBlock[]` with `key` equal to a stable string per block; the file names the travel commit it was read at.
- [ ] **Step 2: Write the failing tests:** `round-trips every travel default` (`sameBlockContent(fromEmailBlocks -> toEmailBlocks, input)` and equal ids, keys, lanes, attributes, with no default made explicit); `writes marks as markup` (doc with bold, italic and an `emailLink` -> `'**a** _b_ [c]({{u}})'`); `reads markup into marks` (inverse); `keeps a literal star by escaping it`; `a custom node with an email codec round-trips` (a fake `quote` codec); `a block type with no codec imports as unknown-block-type content kept, not dropped` (stays in the doc as an opaque `emailUnknown` atom holding the raw block, exported back unchanged).
- [ ] **Step 3: Run** `... -- --run src/profiles/core/email-blocks.spec.ts`; FAIL.
- [ ] **Step 4: Implement.** Attributes absent on input stay absent on output.
- [ ] **Step 5: Run**; PASS. Lint and typecheck.
- [ ] **Step 6: Commit** `feat(editor-core): email nodes and the email-blocks codec`.

### Task 5: Block identity, required blocks and locked structure

**Files:**

- Create: `packages/editor-core/src/profiles/core/block-identity.ts`, `block-identity.spec.ts` (headless editor, as `document/advanced.spec.tsx` builds one)

**Interfaces:**

- Produces: `blockIdentity(options: { required?: () => readonly string[]; structure?: () => 'free' | 'locked' }): EditorFeature` (an `advanced` engine extension; the getters let a host change them without a remount) and the command `assignBlockIds` with args `{ ids: Record<string, string> }` (key -> id), run as `editor.run('assignBlockIds', { ids })`.
- [ ] **Step 1: Write the failing tests:** `gives every new block a key and a null id`; `keeps id and key across a text edit and a move`; `gives a pasted copy of a block a null id` (and a new key); `assignBlockIds sets ids without moving the selection`; `refuses deleting a required block` (state unchanged, `can('deleteBlock')` false for it); `refuses insert, delete, move, retype, attribute change and join in locked structure` while text typing and variable insertion pass; `refuses a join in locked structure` (Backspace at a block's start).
- [ ] **Step 2: Run**; FAIL.
- [ ] **Step 3: Implement** with `appendTransaction` (keys, null ids on duplicates) and `filterTransaction` (required, locked), via `@zeroxsolutions/editor-core/document/advanced`.
- [ ] **Step 4: Run**; PASS.
- [ ] **Step 5: Commit** `feat(editor-core): keep block ids, required blocks and locked structure`.

### Task 6: The variable feature

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/profiles/variables/variable.tsx`, `variable-menu.tsx`, `variable.browser.spec.tsx`

**Interfaces:**

- Consumes: Task 1 `VariableDeclaration`; the composer's `inlineToken`, `TriggerLayer`, `TriggerToken` (`composer/triggers/`).
- Produces: `variableFeature(getDeclarations: () => readonly VariableDeclaration[]): { feature: EditorFeature; token: TriggerToken }` (char `{{`, reference archetype, option label = declaration label or name, a type icon per type); `<VariableMenu editor declarations />` (toolbar "Variable" dropdown, filterable).
- [ ] **Step 1: Write the failing browser tests:** typing `{{na` opens the menu filtered to `name`, Enter inserts a `variable` chip reading its label; the toolbar menu inserts at the caret; pasting `Hi {{name}} {{ghost}}` yields two chips, `ghost` marked undeclared (`data-problem`); a chip renders as a Badge at the line's text size (existing pill rule).
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run --project @zeroxsolutions/ui:browser registry/bases/base-ui/editor/profiles/variables`; FAIL.
- [ ] **Step 3: Implement**; paste parsing goes through the feature's HTML/text import, using `VARIABLE_TOKEN`.
- [ ] **Step 4: Run**; PASS.
- [ ] **Step 5: Commit** `feat(ui): typed variables in the editor`.

### Task 7: The email kit

**Files:**

- Create under `packages/ui/registry/bases/base-ui/editor/profiles/email/`: `email-kit.ts`, `nodes/button.tsx`, `nodes/columns.tsx`, `nodes/code.tsx`, `nodes/html.tsx`, `nodes/list.tsx`, `nodes/callout.tsx`, `nodes/divider.tsx`, `marks.ts`, `url-variable-picker.tsx`, `block-attributes-menu.tsx`, `email-kit.browser.spec.tsx`

**Interfaces:**

- Consumes: Tasks 1, 4, 5, 6.
- Produces: `emailKit(profile: EditorProfile, extra?: readonly EditorFeature[]): EditorFeature[]` (only the profile's kinds; slash, toolbar and block menu offer only those; throws `editor.profile.no_email_codec` per the Rulings).
- [ ] **Step 1: Write the failing browser tests:** the slash menu under `MAIL_LAYOUT_KINDS` lists five kinds; a button's link picker lists only `url` declarations; the link mark's picker is the same picker; bold and italic toggle from the bubble menu and Mod-B / Mod-I; a code, html and button label refuse marks; the block menu sets `align`, `spaceAfter`, `tone` (paragraph), `width` (button) and `ratio` (columns, adding or removing a lane); columns refuse a columns block inside a lane; a custom feature without an email codec throws naming it.
- [ ] **Step 2: Run** (browser project, folder `profiles/email`); FAIL.
- [ ] **Step 3: Implement**; surfaces use `cn-*` slots (Button, Card, Alert, Separator, Item) like the document features after #137.
- [ ] **Step 4: Run**, plus `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run src/build/editor-chrome.spec.ts`; PASS.
- [ ] **Step 5: Commit** `feat(ui): the email profile's blocks and marks`.

### Task 8: EmailEditor

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/profiles/email/email-editor.tsx`, `problem-decorations.ts`, `email-editor.browser.spec.tsx`

**Interfaces:**

- Produces:
  ```ts
  interface EmailEditorProps {
    profile: EditorProfile;
    value: EditorEmailBlock[];
    features?: EditorFeature[];
    required?: readonly string[];
    structure?: 'free' | 'locked';
    renderer?: { render(input: RenderEmailInput<unknown>): RenderedEmail }; // the host's createEmailRenderer instance
    onChange?(blocks: EditorEmailBlock[]): void;
    onBlur?(): void;
    onValidate?(problems: ProfileProblem[]): void;
    renderBlockAdornment?(id: string | null, key: string): ReactNode;
    onReady?(editor: IEditor): void;
  }
  ```
  `preview` is drawn only when `renderer` is given, from `toEmailBlocks` with keys standing in for null ids and the declarations' sample values.
- [ ] **Step 1: Write the failing browser tests:** `value` loads and `onChange` reports the edited blocks; `onBlur` fires when focus leaves; a problem shows within one second as a decoration whose message reads on hover and focus, and `onValidate` gets the same list as `validate`; the adornment renders beside its block; a required block's remove is disabled with its reason; `structure: 'locked'` hides insert and remove; the preview HTML equals `renderer.render` for the same blocks; `assignBlockIds` after a save keeps the caret.
- [ ] **Step 2: Run** (browser project, `email-editor.browser.spec.tsx`); FAIL.
- [ ] **Step 3: Implement**; `validate` runs debounced, at most 300 ms after an edit.
- [ ] **Step 4: Run**; PASS.
- [ ] **Step 5: Commit** `feat(ui): the email editor`.

### Task 9: SmsEditor

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/profiles/sms/sms-editor.tsx`, `sms-meter.tsx`, `sms-editor.browser.spec.tsx`

**Interfaces:**

- Produces: `SmsEditorProps { profile: EditorProfile; value: string; onChange?(body: string): void; onBlur?(): void; onValidate?(problems: ProfileProblem[]): void }`; the meter reads `measureSmsBody`.
- [ ] **Step 1: Write the failing browser tests:** the meter reads `16 / 160 GSM-7` for `Hello {{a}}!` (tokens counted literally, each brace two units); typing an emoji flips it to `UCS-2` and `/ 70`; past the limit the meter and the decoration show `sms-segment-exceeded`; no bold or italic shortcut has effect; Enter makes a line break that `onChange` reports as `\n`.
- [ ] **Step 2: Run**; FAIL. **Step 3: Implement.** **Step 4: Run**; PASS.
- [ ] **Step 5: Commit** `feat(ui): the SMS editor and its segment meter`.

### Task 10: Registry items, demos and docs

**Files:**

- Modify: `packages/ui/registry.json` (items `email-editor`, `sms-editor`), `packages/ui/src/site/constants/editor-docs-sections.ts`, `packages/ui/src/build/editor-chrome.spec.ts` (new files listed)
- Create: `packages/ui/registry/bases/base-ui/examples/email-editor-demo.tsx`, `sms-editor-demo.tsx`, `packages/editor-docs-web/content/docs/editor/email-editor.mdx`, `sms-editor.mdx`
- Modify: the e2e page lists that name every editor page (grep `chat-input` under `apps/*-e2e`)

- [ ] **Step 1:** Add both items: files under `profiles/` (and `profiles/core` is not shipped: it is editor-core), `registryDependencies` from what the files import, `dependencies` `@zeroxsolutions/editor-core` and `@zeroxsolutions/template`. Run `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run registry/registry.spec.ts`; PASS (every editor file in exactly one item).
- [ ] **Step 2:** Demos: the email demo uses a travel-shaped template (greeting paragraph, a button to `{{trip_url}}`, a callout, a two-lane columns) with a `createEmailRenderer()` preview; the SMS demo a one-segment OTP body.
- [ ] **Step 3:** Docs pages shaped as `chat-input.mdx`: install, usage, props tables, the variables and validation sections, the markup grammar, the travel mapping note. Add both to "Surfaces".
- [ ] **Step 4: Run** `CI=true pnpm nx run-many -t lint typecheck test -p @zeroxsolutions/ui @zeroxsolutions/editor-core @zeroxsolutions/editor-docs-web` and `CI=true pnpm nx run @zeroxsolutions/ui:build-registry`; PASS. Then `pnpm nx affected -t lint typecheck`.
- [ ] **Step 5: Commit** `feat(ui): publish the email and SMS editors`; open the PR, wait on its checks, merge on green. Publishing editor-core waits for the owner's go.

---

Plan C (travel's switch) is written after this plan and Plan A are released, against travel's `origin/master` at that time.
