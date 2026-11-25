# Block presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Product-declared block presets an author drags, clicks or slashes into the Document Editor and the email editor.

**Architecture:** A UI-free `definePreset` / `emailPreset` / `presetFits` in editor-core; a `presetsFeature` in the ui registry adding the `insertPreset` command, the "Presets" slash group and a drop handler; an `EditorPresetsPanel`; the email editor building that feature from a `presets` prop with the email rules; the library's general presets; a docs page.

**Tech Stack:** TypeScript, zod, the editor-core feature API (`advanced` subpath for the drop plugin), React, vitest (node and browser), fumadocs MDX.

**Spec:** `docs/superpowers/specs/2026-11-25-block-presets-design.md` (read its "Calls made by the writer").

## Global Constraints

- One definition for either editor; presets are data, never a second copy of a block.
- An inserted block gets `id: null`, a fresh `key`, and no `stored` attribute (as `duplicateBlock`'s `withoutIds`).
- An editor offers only presets it can hold: schema nodes, email `allow` kinds, no `block-not-carried` problem from `docProblems`, no `emailUnknown`; in a column, none holding `columns`, `hero` or `card`; none under `structure: 'locked'`.
- One insert is one undo step. Insert position: after the block holding the caret, at its level; a drop snaps to a block boundary at the level under the pointer, refused spots draw no indicator.
- Drag MIME type: `application/x-zui-preset`, payload the preset id.
- Every string the UI draws comes from `messages` (`ProfileEditorMessages` for email, a `PresetsMessages` object for the panel), English defaults.
- Document Editor look, light and dark; screenshots only in `.superpowers/sdd/2026-11-25-block-presets/` or `.playwright-mcp/`.
- Never stage `apps/registry-editor-docs-zone/next-env.d.ts`, `apps/registry-ui/next-env.d.ts`, `apps/native-preview-uniwind/uniwind-types.d.ts`. Commit headers at most 72 chars, ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Waits in tests are conditions, never timers.

## Review Focus

1. A preset dropped inside a column holding a card/hero/columns: nothing inserted, no indicator (Task 3 browser spec).
2. Inserting the same preset twice: two independent copies, distinct keys, both `id: null` (Task 2 spec).
3. A preset from `emailPreset` built from saved wire carrying ids and `stored`: none reach the document (Task 1 and Task 2 specs).
4. An email profile whose `allow` lacks `heading`: a preset with a heading is not offered anywhere (slash, "+", panel) (Task 3 spec).
5. Undo after a preset insert restores the document exactly, in one step (Task 2 spec).

---

### Task 1: The definition in editor-core

**Files:**

- Create: `packages/editor-core/src/blocks/preset.ts`, `packages/editor-core/src/blocks/preset.spec.ts`
- Create: `packages/editor-core/src/profiles/core/email-preset.ts`, `packages/editor-core/src/profiles/core/email-preset.spec.ts`
- Modify: `packages/editor-core/src/blocks/index.ts`, `packages/editor-core/src/profiles/core/index.ts` (exports)

**Interfaces:**

- Produces:
  - `interface BlockPreset { readonly id: string; readonly label: string; readonly icon: unknown; readonly description: string | null; readonly keywords: readonly string[]; readonly content: readonly NodeJSON[] }`
  - `definePreset(options: { id: string; label: string; icon?: unknown; description?: string; keywords?: readonly string[]; content: readonly NodeJSON[] }): BlockPreset` (deep-frozen; content run through `presetContent`)
  - `class PresetDefinitionInvalid extends Error { readonly id: string }`
  - `presetContent(content: readonly NodeJSON[]): NodeJSON[]`: a deep copy with `id` set to null, `key` removed and `stored` removed on every node that has them.
  - `presetFits(preset: BlockPreset, rules: { nodes: ReadonlySet<string>; kinds?: ReadonlySet<string> }): boolean`: every node name in `nodes` (marks ignored), and when `kinds` is given every email block kind the content maps to (heading, quote/blockquote, table, image, button, columns, the library kinds) in `kinds`; false when any node is `emailUnknown`.
  - `emailPreset(profile: EditorProfile, options: Omit<Parameters<typeof definePreset>[0], 'content'> & { blocks: readonly EditorEmailBlock[] }): BlockPreset`: converts with `fromEmailBlocks(blocks, codecs)` where `codecs` are `emailBlockCodec(...)` of the profile's `blocks`; throws `PresetDefinitionInvalid` when a block becomes `emailUnknown` or the profile is not email.

- [ ] **Step 1: Write the failing specs** — `definePreset`: throws for empty content, for an id not matching `/^[a-z0-9][a-z0-9-]*$/`, for a top-level node that is text or a mark; returns a frozen object (`Object.isFrozen(preset.content[0])`). `presetContent`: `{type:'paragraph',attrs:{id:'b1',key:'k',stored:'x'}}` becomes `{type:'paragraph',attrs:{id:null}}`, nested lanes too. `presetFits`: false when a node is missing from `nodes`, false when `kinds` lacks `heading` and content has a heading, true otherwise. `emailPreset`: a wire `[{ type:'heading', id:'srv-1', ... }]` gives content with `attrs.id === null`; a product block in the profile converts to its node, one not in the profile throws.
- [ ] **Step 2: Run** `pnpm nx test editor-core -- preset` — FAIL, modules missing.
- [ ] **Step 3: Implement** the files above; map node names to kinds with the email profile's own table (`email-nodes.ts` / `profile.ts`), not a new list.
- [ ] **Step 4: Run** `pnpm nx test editor-core` — PASS, no other spec changed.
- [ ] **Step 5: Commit** `feat(editor-core): define block presets`.

### Task 2: `presetsFeature` and `insertPreset`

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/document/features/presets/presets-feature.ts`, `index.ts`, `presets-feature.browser.spec.tsx`

**Interfaces:**

- Consumes: Task 1's `BlockPreset`, `presetContent`, `presetFits`.
- Produces:
  - `presetsFeature(presets: readonly BlockPreset[], options?: { fits?(preset: BlockPreset, editor: IEditor): boolean; group?: string }): EditorFeature` with id `presets`.
  - Command `insertPreset`, args `{ id: string; at?: number }`: `can` is false for an unknown id, a non-editable editor, or `fits` false (default: `presetFits` against the editor's schema nodes); `run` inserts `presetContent(preset.content)` at `at` or after the top-level-at-caret's block at its level, in one transaction, and selects the end of the inserted range.
  - Slash items: one per preset, `id: 'preset-<id>'`, `group` default `'Presets'`, `command: 'insertPreset'`, `args: { id }`, `keywords`.
  - A drop plugin (via the `advanced` subpath) reading `application/x-zui-preset`, snapping to a block boundary, asking `can('insertPreset', { id, at })`, drawing the existing drop cursor only when allowed.
  - Exported `PRESET_MIME = 'application/x-zui-preset'`.

- [ ] **Step 1: Write the failing browser specs** — insert a two-block preset after the caret's block: document JSON shows both blocks after it; insert twice: keys differ, ids null; one `undo` restores the original JSON; `can` false for unknown id and when not editable; the slash menu shows a "Presets" group listing the preset's label; a synthetic drop with the MIME at a boundary inserts there.
- [ ] **Step 2: Run** `pnpm nx test ui -- presets-feature` — FAIL.
- [ ] **Step 3: Implement.** If the slash menu shows items whose command `can` is false, make it hide them (one change in `slash-menu.tsx`, with its spec), since presets rely on it.
- [ ] **Step 4: Run** the spec and `pnpm nx test ui -- slash-menu` — PASS.
- [ ] **Step 5: Commit** `feat(ui): insert block presets by command, slash and drop`.

### Task 3: The panel and the email editor's presets

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/document/features/presets/presets-panel.tsx`, `presets-panel.browser.spec.tsx`
- Modify: `packages/ui/registry/bases/base-ui/editor/profiles/email/email-editor.tsx` (prop `presets`), `packages/ui/registry/bases/base-ui/editor/profiles/messages.ts` (`presetsGroup`, panel words), `email-editor.browser.spec.tsx`

**Interfaces:**

- Consumes: Task 2's feature and `PRESET_MIME`.
- Produces:
  - `EditorPresetsPanel({ editor, presets, messages?, className? })`: lists presets with `editor.can('insertPreset', { id })`, re-reading on selection updates; each row (icon, label, description) is `draggable` setting `PRESET_MIME`, and a click runs `insertPreset`; a search field shown when more than six presets; empty state text; drawn with the registry's list/item look in light and dark.
  - `interface PresetsMessages { title: string; search: string; empty: string }` with English defaults.
  - `EmailEditor` prop `presets?: readonly BlockPreset[]`: builds `presetsFeature(presets, { fits, group: text.presetsGroup })` where `fits` applies `presetFits` with the profile's kinds, `docProblems` (no `block-not-carried`), the lane rule (no `columns`/`hero`/`card` when `laneAt` the caret), and locked structure. It exposes the offered presets for the panel through `onReady`'s editor (`can`).
- [ ] **Step 1: Write the failing specs** — panel: lists only presets `can` allows; clicking inserts; dragging a row onto the editor inserts at the drop; search filters by label and keywords. Email: with `allow` lacking `heading`, a heading preset is in neither slash nor panel; caret in a column hides a preset with a card; `structure: 'locked'` offers none; an inserted preset exports through `toEmailBlocks` with no problem beyond empty-field ones.
- [ ] **Step 2: Run** `pnpm nx test ui -- presets-panel email-editor` — FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — PASS; screenshot the panel beside the Document Editor and the email editor, light and dark.
- [ ] **Step 5: Commit** `feat(ui): presets panel and the email editor's presets`.

### Task 4: The library's presets

**Files:**

- Create: `packages/ui/registry/bases/base-ui/editor/document/features/presets/library-presets.ts`, `library-presets.spec.ts`

**Interfaces:**

- Consumes: Task 1.
- Produces: `documentPresets(messages?: LibraryPresetMessages): BlockPreset[]` (two columns, FAQ of toggle headings, callout with a button, cards in columns) and `emailPresets(profile: EditorProfile, messages?: LibraryPresetMessages): BlockPreset[]` (header: logo image and divider; hero; call to action: heading, text, button; two-up: columns of image, heading, text, button; footer: social links and legal footer). Placeholder text from `LibraryPresetMessages` (English defaults), no variables, empty links and images.
- [ ] **Step 1: Write the failing spec** — each email preset fits the default email profile and `toEmailBlocks` of it renders through `createEmailRenderer()` without throwing; `docProblems` has no `block-not-carried`; each document preset fits the Document Editor's standard kit plus the library features.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS; render each email preset at 600px and 375px, light and dark, and look at the screenshots.
- [ ] **Step 5: Commit** `feat(ui): the library's block presets`.

### Task 5: Registry item and docs

**Files:**

- Modify: registry item list for `block-presets` (as `editor-callout` is registered), `packages/ui/src/site/constants/editor-docs-sections.ts`
- Create: `packages/editor-docs-web/content/docs/editor/block-presets.mdx` and its demos (Document Editor with panel; email editor with panel)
- Modify: `block-library.mdx` (link), `email-editor.mdx` (`presets` prop)

- [ ] **Step 1:** Write the page: what a preset is, `definePreset`, `emailPreset`, the panel, the prop, what is offered where; live demos for both editors.
- [ ] **Step 2:** Run the registry build and docs build targets via nx (`pnpm nx run-many -t build -p ui editor-docs-web` or the project's own target names); open the page at 1280 and 375 widths, light and dark; screenshot.
- [ ] **Step 3: Commit** `docs(editor): block presets page`.
