# Travel's Switch to the Email and SMS Editors Implementation Plan (Plan C)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Travel's back office authors its email templates, its mail layout and its SMS templates in the
registry's `EmailEditor` and `SmsEditor`, imports the template code from `@zeroxsolutions/editor-core`, and
deletes its own block editor.

**Architecture:** Two repos, in order. Part U (zeroxsolutions/ui) gives both editors what a localized host
needs and they lack today: a `messages` prop, a `readOnly` prop and an accessible `label`, then the docs site
is deployed so the shadcn CLI can install the items. Part T (zeroxsolutions/travel, one PR) moves every import
of `@zeroxsolutions/template` to `editor-core` 0.1.1 (or the release Part U cuts), keeps inline markup in
machine translations, installs the two items into `packages/ui`, maps travel's block tree to and from
`EditorEmailBlock[]` in `notification-staff-react`, mounts the editors on the three screens, and deletes the
old editor. Travel's API, tables and translation states do not change.

**Tech Stack:** React 19, Next.js on Workers, TanStack Query and Form, use-intl, Vitest browser mode,
Playwright, nx, pnpm catalogs, shadcn CLI, `@zeroxsolutions/editor-core`.

**Spec:** `docs/superpowers/specs/2026-11-20-editor-profiles-design.md` (this repo), section "Travel's
switch". Read travel only at `origin/master` until Part T's worktree exists; another session works in
travel's main checkout.

## Global Constraints

- Travel's switch replaces `block-editor.tsx`, `block-list.tsx`, `block-item.tsx`, `block-content-form.tsx`
  and the SMS textarea; its API, tables and translation states do not change (spec).
- Import mapping (spec): `@zeroxsolutions/template` -> `@zeroxsolutions/editor-core/template/index`,
  `/email` -> `template/email/index`, `/email/testing` -> `template/email/testing/index`, `/sms` ->
  `template/sms/index`. The names each entry lists do not change.
- Travel refuses malformed markup on write and keeps markup in translation drafts (spec).
- A translated locale is edited with `structure: 'locked'`; blocks printing a required variable are passed as
  `required` (spec).
- Travel saves on blur and after one second without an edit (spec, "Email export and import").
- Previews stay travel's own, over HTTP (spec non-goal): travel passes no `renderer` to `EmailEditor`.
- The registry items are installed with the shadcn CLI and their vendored files are never edited in travel;
  a defect in one is fixed in ui and the item added again (gundam `adding-a-design-system-component`).
- Travel's back office is localized (`messages/en.json`, `messages/vi.json`): every string the editors draw
  comes from those catalogs.
- No production deploy, npm publish or merge without the owner's go; Part U's deploy (`git push origin
  master:production` in ui) is one such go.
- Commit headers at most 72 characters, ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  PR bodies end with the Claude Code line. Plain ASCII in files.

## Spec amendments this plan makes (for the owner's review)

1. **The editors take `messages`, `readOnly` and `label`.** The spec left wording to the builder; Plan B
   shipped English literals, and the back office draws Vietnamese. A host passing nothing gets today's
   English.
2. **A write is withheld while the editor reports a problem.** The spec lets the host decide. Travel's
   server refuses every problem kind that has a server twin, so sending one costs a round trip and a second,
   less precise message. The in-place markers are the message; a line under the editor says the change is
   not saved yet and why. Server refusals keep their sentence above the editor, as now (`blocksRefusal`),
   for the checks with no editor twin (`staff.draft.*` codes the editor cannot know, a stale draft). This is
   how "mapping its refusal codes onto the editor's problem kinds" is met.
3. **A translated block with no text yet shows the source text.** It stays `missing` until the author changes
   it; an unchanged block is not written.
4. **SMS bodies declare their variables in travel's staff package**, one table by key, since the SMS API
   carries none: every key in `AUTH_SMS_TEMPLATE_KEYS` declares `code`, type `string`, required.
5. **A machine translation that drops a marker or a link is refused with a new reason, `markup_changed`**,
   beside `placeholders_changed`.

## Review Focus

1. A default template, layout or SMS body holding a literal `*`, `_`, `[` or `\` now parses as markup:
   every shipped default must still pass the renderer's strict content schema (Task T1's spec).
2. Two quick edits then a blur: the second edit must not be lost or sent against a stale draft (the draft
   provider's queue already reads the cache; Task T5's spec types twice within a second, then blurs, and
   asserts one request carrying both).
3. A host refetch landing mid-typing must not reset the caret: travel hands back exactly what `onChange`
   gave, and passes a new `value` only on a locale or draft change (Task T5's spec).
4. A translated locale on a block whose source changed (`stale`): the badge and provenance line still draw
   in the adornment, and Reset to translation still releases the text (Task T5's spec).
5. Viewer without the update grant, or no open draft: the editor is read-only, no menu opens, no write is
   sent (Task T5's spec).

---

## Part U - zeroxsolutions/ui

### Task U1: Localizable, read-only, labelled editors

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/profiles/messages.ts`
- Modify: `profiles/problem-messages.ts` (becomes the English defaults inside `messages.ts`, then deleted),
  `profiles/problem-marker.tsx`, `profiles/email/email-editor.tsx`, `profiles/email/kit-context.ts`,
  `profiles/email/block-attributes-menu.tsx`, `profiles/email/url-variable-picker.tsx`,
  `profiles/email/marks.ts`, `profiles/email/nodes/*.tsx`, `profiles/variables/variable-menu.tsx`,
  `profiles/variables/variable.tsx`, `profiles/sms/sms-editor.tsx`, `profiles/sms/sms-meter.tsx`,
  `profiles/sms/sms-problems.ts`, every file of `editor/document` the two items mount that draws a string;
  `registry.json` items `email-editor` and `sms-editor` (the new file); both docs pages in
  `packages/editor-docs-web/content/docs/editor/`
- Test: `profiles/messages.spec.ts`, `profiles/email/email-editor.browser.spec.tsx`,
  `profiles/sms/sms-editor.browser.spec.tsx`

**Interfaces:**

- Produces: `export interface ProfileEditorMessages` (every string either editor draws; parameterised ones
  are functions, e.g. `smsMeter(input: { units: number; limit: number; encoding: 'gsm7' | 'ucs2'; segments:
  number; maxSegments: number }): string`, `problem(problem: ProfileProblem): string`),
  `export const DEFAULT_PROFILE_MESSAGES: ProfileEditorMessages` (today's English, verbatim), and on both
  `EmailEditorProps` and `SmsEditorProps`: `messages?: Partial<ProfileEditorMessages>`, `readOnly?: boolean`,
  `label: string` (the editable surface's accessible name).

- [ ] **Step 1: Write the failing specs.** `messages.spec.ts`: no `.tsx`/`.ts` file under `profiles/` but
      `messages.ts` holds a JSX text node or an `aria-label`/`title`/`placeholder`/`label` string literal
      containing a letter (read the files with `fs`, match `/>\s*[A-Za-z][^<{]*</` and
      `/(aria-label|title|placeholder)="[^"]*[A-Za-z]/`). Browser specs: an `EmailEditor` given
      `messages={{ problem: () => 'Khoi trong' }}` and an empty paragraph shows `Khoi trong` in its marker;
      `readOnly` refuses typing (`userEvent.type` leaves `onChange` uncalled) and opens no block menu; the
      surface is found by `getByRole('textbox', { name: 'Body' })` for `label="Body"`; an `SmsEditor` with
      `messages={{ smsMeter: ({ units, limit }) => units + '/' + limit }}` shows `0/160` when empty.
- [ ] **Step 2: Run them, expect FAIL** - `pnpm nx test @zeroxsolutions/ui -- --run profiles` (one spec folder runs free;
      the project-wide run needs the gate).
- [ ] **Step 3: Implement.** Messages reach node views through the kit's existing context, merged over the
      defaults once per render; `readOnly` calls the facade's `setEditable(false)` and hides every menu trigger;
      `label` lands as `aria-label` on the contenteditable.
- [ ] **Step 4: Run the specs, expect PASS**; build the registry-ui app (`pnpm nx show projects | grep registry-ui` names it) and confirm
      `public/r/styles/base-nova/email-editor.json` lists `messages.ts`.
- [ ] **Step 5: Docs.** Each page's API table gains the three props, with one example passing Vietnamese
      messages.
- [ ] **Step 6: Commit** `feat(ui): let a host word, label and lock the profile editors`; PR, gate green,
      merge on the owner's standing go for PRs I open.

### Task U2: Deploy the registry site (owner's go)

- [ ] **Step 1:** With the owner's go, `git push origin master:production` in ui; wait on the `cd` run
      (gundam `waiting-on-a-run`). The last `cd` run, 2026-11-16, failed: read its log first and fix the cause
      in a PR before pushing.
- [ ] **Step 2: Verify** `curl -s -o /dev/null -w "%{http_code}"` answers 200 for
      `https://ui.zeroxsolutions.com/r/styles/base-nova/email-editor.json`, `.../sms-editor.json` and
      `https://ui.zeroxsolutions.com/docs/editor/email-editor`.
- [ ] **Step 3:** If Task U1 changed `editor-core` (it should not), release it by the release procedure and
      use that number in Task T1 instead of 0.1.1.

## Part T - zeroxsolutions/travel (one PR, branch `feat/email-sms-editors`)

Set up: a travel worktree under `.claude/worktrees/`, `pnpm install` before the first commit (AGENTS.md).
Claim or file the issue on the Travel board and move it to In progress first.

### Task T1: Import the template code from editor-core

**Files:**

- Modify: `pnpm-workspace.yaml` (catalog: drop `"@zeroxsolutions/template": "0.2.0"`, add
  `"@zeroxsolutions/editor-core": "0.1.1"`), every `package.json` that lists `@zeroxsolutions/template`
  (`apps/back-office-app`, `packages/api`, `banner`, `campaign`, `community`, `customer`,
  `notification-staff-react`, `notification-staff-web`, `notification`, `staff`), `knip.jsonc` (the five
  `ignoreDependencies` entries and their comments name `editor-core` and its `template/*/index` entries), and
  every source file `git grep -l "@zeroxsolutions/template" -- packages apps` lists.
- Test: `packages/notification/src/lib/constants/defaults-parse.spec.ts`

- [ ] **Step 1: Write the failing spec.** For every template default, the default mail layout and every
      `AUTH_SMS_TEMPLATE_DEFAULTS` body: each text-bearing block's content passes `EMAIL_RENDERER.contentOf`
      (non-null) and each SMS body leaves no stray brace. Name it `every shipped default parses under inline
  markup`. It fails until the imports move only if a default holds a literal marker; if it passes at once,
      keep it as the guard and note it in the report.
- [ ] **Step 2: Move the imports** by the table in Global Constraints; `pnpm install`.
- [ ] **Step 3: Verify** `git grep -n "@zeroxsolutions/template" -- packages apps knip.jsonc
  pnpm-workspace.yaml` prints nothing (docs keep their history), then `pnpm nx affected -t lint typecheck`
      and `pnpm nx run-many -t test -p notification banner` under the gate (`CI=true`, `--parallel=1`).
- [ ] **Step 4: Commit** `build: take the template code from editor-core`.

### Task T2: Keep markup in machine translations

**Files:**

- Modify: `packages/notification/src/lib/constants/translation-refusal-reason.ts` (add `'markup_changed'`
  after `'placeholders_changed'`), `packages/notification/src/lib/domain/draft-translation.ts` (after the
  `sameVariableTokens` check), whatever the typecheck then names in `packages/api` and the staff packages.
- Test: `packages/notification/src/lib/domain/draft-translation.spec.ts`,
  `packages/notification/src/lib/domain/block-content.spec.ts`

**Interfaces:**

- Produces: `markedTextsOf(type: BlockType, content: Record<string, unknown>): readonly string[]` in
  `block-content.ts`: a paragraph's and a callout's `text`, a list's `items`; `[]` for every other type.

- [ ] **Step 1: Failing specs.** `a machine translation that drops a bold span is refused as markup_changed`
      (source `{ text: '**Hi** {{name}}' }`, answer `{ text: 'Chao {{name}}' }`); `a machine translation that
  keeps every span is stored`; `a person's write of an unclosed marker is refused` (`{ text: '**Hi' }` ->
      `BlockContentInvalid`, which the renderer's strict schema already gives: the spec pins it).
- [ ] **Step 2: Run, expect FAIL** on the first.
- [ ] **Step 3: Implement** `if (!sameInlineMarkup(markedTextsOf(type, source), markedTextsOf(type,
  translation))) return 'markup_changed';`.
- [ ] **Step 4: Run, expect PASS**; typecheck the affected projects.
- [ ] **Step 5: Commit** `feat(notification): refuse a translation that drops its markup`.

### Task T3: Install the editors into travel's UI package

**Files:**

- Modify: `packages/ui/components.json` (`"registries": { "@zui":
  "https://ui.zeroxsolutions.com/r/styles/{style}/{name}.json" }`), whatever the CLI writes,
  `packages/browser-deps` (the editor's browser packages, read off the first failing browser spec)

- [ ] **Step 1:** From `packages/ui`, `pnpm dlx shadcn@latest add @zui/email-editor @zui/sms-editor`,
      answering no to every overwrite of an existing file; list each file it wrote and each dependency it added
      in the commit body.
- [ ] **Step 2: Verify** `pnpm nx run-many -t lint typecheck -p ui` green; no existing component changed
      (`git diff --stat -- packages/ui/src/components` lists only new files).
- [ ] **Step 3: Commit** `feat(ui): add the email and SMS editors from the zui registry`.

### Task T4: Map travel's blocks to the editor's

**Files:**

- Create: `packages/notification-staff-react/src/lib/editor-blocks.ts`,
  `packages/notification-staff-react/src/constants/sms-template-variables.ts`
- Test: `packages/notification-staff-react/src/lib/editor-blocks.spec.ts`

**Interfaces:**

- Consumes: `Block`, `BlockLocale` (`types/block.ts`), `withBlockText`, `withBlockReleased`, `textIn`,
  `carriesText` (`lib/block-edits.ts`).
- Produces:
  - `editorBlocksOf(blocks: readonly Block[], locale: BlockLocale, sourceLocale: BlockLocale):
    EditorEmailBlock[]` - `type` is `kind`, `key` is the id (or `new-<index>` for an id-less block),
    `content` is the locale's text, else the source's (amendment 3), lanes recursively.
  - `blocksWithEditorBlocks(blocks: readonly Block[], edited: readonly EditorEmailBlock[], locale,
    sourceLocale): Block[]` - in the source locale the edited list is the structure (an id-less block is new,
    `required: false`, its text `source`); in a translated locale the structure is `blocks`' and only a block
    whose content differs from what `editorBlocksOf` gave takes `withBlockText`.
  - `editorDeclarationsOf(variables: TemplateForEdit['variables']): VariableDeclaration[]` (`label` from the name, `sampleValue` and `required` kept).
  - `requiredIdsOf(blocks: readonly Block[]): string[]`.
  - `SMS_TEMPLATE_VARIABLES: Record<AuthSmsTemplateKey, readonly VariableDeclaration[]>` (amendment 4).

- [ ] **Step 1: Failing specs:** `a version round-trips unchanged` (`blocksWithEditorBlocks(b,
  editorBlocksOf(b, 'en', 'en'), 'en', 'en')` deep-equals `b`, lanes included); `an untouched missing
  translation stays missing`; `a changed translation becomes edited`; `an added block has a null id`;
      `a translated locale keeps the source structure` (an edited list with a block removed changes nothing).
- [ ] **Step 2-4:** run FAIL, implement, run PASS.
- [ ] **Step 5: Commit** `feat(notification-staff-react): map blocks to the email editor`.

### Task T5: The email template screen

**Files:**

- Create: `packages/notification-staff-web/src/components/data-entry/email-blocks-field.tsx` (one
  `EmailEditor` over one list, shared with Task T6),
  `packages/notification-staff-web/src/components/data-display/block-adornment.tsx` (the standing badge,
  provenance line and Reset to translation, moved out of `block-item.tsx`),
  `packages/notification-staff-web/src/hooks/use-editor-messages.ts`
- Modify: `pages/email-template-page.tsx`, `providers/email-template-draft-provider.tsx`,
  `messages/en.json`, `messages/vi.json` (namespace `blockEditor`: every `ProfileEditorMessages` key, and
  `notSaved` = "Not saved: {count, plural, one {# problem} other {# problems}} to fix")
- Test: `components/data-entry/email-blocks-field.spec.tsx` (browser)

**Interfaces:**

- `EmailBlocksField({ blocks, profile, label, readOnly, structure, required, onCommit(blocks: Block[]) })`:
  holds the editor's latest `EditorEmailBlock[]`, calls `onCommit` on blur and 1000 ms after the last
  change, never while `onValidate` reported a problem, and draws `notSaved` under the editor while one
  stands. `value` changes only when the draft id or the locale does.

- [ ] **Step 1: Failing specs** (MSW gateway, as the old `block-editor.spec.tsx` does): typing a line then
      waiting 1 s sends one edit with the line; two edits within a second then a blur send one request with
      both; an empty paragraph sends nothing and shows `notSaved`; a translated locale is locked (no block menu),
      its block shows the `edited` badge and Reset to translation sends a release; without the grant the editor is
      read-only; a refetch after a save does not move the caret (type, wait for the save, type again: text
      continuous).
- [ ] **Step 2-4:** run FAIL, implement (the provider passes `profile =
  emailProfile({ variables: editorDeclarationsOf(template.variables) })`; the page renders
      `EmailBlocksField` where `<BlockEditor>` was), run PASS.
- [ ] **Step 5: Commit** `feat(notification-staff-web): edit a template in the email editor`.

### Task T6: The mail layout screen

**Files:**

- Modify: `pages/mail-layout-page.tsx`, `providers/mail-layout-draft-provider.tsx`
- Test: `providers/mail-layout-draft-provider.spec.tsx`

- [ ] **Step 1: Failing spec:** the header and the footer are two editors labelled by their headings; the
      palette offers only `MAIL_LAYOUT_KINDS`; a footer missing `{{legal_name}}` shows its problem and is not
      sent; the header never asks for it.
- [ ] **Step 2-4:** run FAIL, implement (header profile: `emailProfile({ allow: MAIL_LAYOUT_KINDS, variables
  })` with no variable required; footer: the same with `recipient`, `legal_name`, `legal_address`
      required), run PASS.
- [ ] **Step 5: Commit** `feat(notification-staff-web): edit the mail layout in the email editor`.

### Task T7: The SMS sheet

**Files:**

- Modify: `components/data-entry/sms-template-sheet.tsx` (drop `SmsTemplateBodyNotes`, `segmentCountOf`
  and the textarea), `messages/en.json`, `messages/vi.json`
- Test: `components/data-entry/sms-template-sheet.spec.tsx`

- [ ] **Step 1: Failing spec:** the body is an `SmsEditor` labelled `Body`; typing `{{` offers `code`;
      a body without `{{code}}` disables Save with its problem shown; the meter reads the catalog's wording.
- [ ] **Step 2-4:** run FAIL, implement (`smsProfile({ variables: SMS_TEMPLATE_VARIABLES[row.key] })`, the
      form field's value and `handleChange` bound to `value`/`onChange`, Save disabled while problems stand),
      run PASS.
- [ ] **Step 5: Commit** `feat(notification-staff-web): write an SMS in the SMS editor`.

### Task T8: Delete the old editor and move the e2e specs

**Files:**

- Delete: `block-editor.tsx`, `block-list.tsx`, `block-item.tsx`, `block-content-form.tsx`,
  `new-block-item.tsx`, their specs, `providers/block-draft-provider.tsx`, `test/block-editor.tsx`,
  `hooks/use-block-name.ts` and `notification-staff-react/src/lib/block-drop.ts` with whatever knip then
  reports unused (the `@dnd-kit/*` dependencies, the `use-block-content-schema` hook, catalog keys)
- Modify: `apps/back-office-notification-zone-e2e/src/email-templates.spec.ts`, `mail-layout.spec.ts`,
  `sms-templates.spec.ts` (fill the editor by its label in place of `getByRole('textbox', { name: 'Text'
  })`; a blur is `press('Tab')` as before)

- [ ] **Step 1:** Delete; `pnpm nx run-many -t lint typecheck -p notification-staff-web
  notification-staff-react` and knip green.
- [ ] **Step 2:** Move the three e2e specs; run `pnpm nx e2e back-office-notification-zone-e2e` under the
      gate.
- [ ] **Step 3: Commit** `refactor(notification-staff-web): delete the block editor`; push; PR naming the
      issue (`Refs: #N`); green, then report for the owner's merge.

### After Part T merges (not tasks of this plan)

- Deprecate `@zeroxsolutions/template` on npm pointing at `@zeroxsolutions/editor-core` (owner's go).
- The Back Office Figma frames for the three screens still draw the old editor: redraw them from the
  shipped screens, per the design rules.
