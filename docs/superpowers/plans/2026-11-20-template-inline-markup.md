# Inline markup in @zeroxsolutions/template Implementation Plan

> **Executed:** zeroxsolutions#103, merged at `5bb8d693`, never published. The code then moved into ui's editor-core (`2026-11-21-template-into-editor-core.md`).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach the house email renderer bold, italic and variable links inside paragraph, callout and list text, through one inline markup grammar the package owns.

**Architecture:** A pure grammar module (`src/lib/markup/`) parses a text field into runs and prints runs back; it leaves through the root `.` so the editor and travel's server import it without the renderer. The renderer gains `ctx.inline(template)`, which draws the runs on both arms; the three text blocks render through it and refuse malformed markup in their strict content schema, so every product's write check refuses it with no change of its own.

**Tech Stack:** TypeScript, zod 4, vitest (node), nx 23 in the `zeroxsolutions` repo.

**Spec:** `docs/superpowers/specs/2026-11-20-editor-profiles-design.md` in the ui repo (section "Inline marks in email text"). This plan runs in `/Users/tus/ZeroXSolutions/zeroxsolutions`, package `packages/template`.

## Global Constraints

- Work in a worktree of the zeroxsolutions repo off `origin/master`, branch `feat/template-inline-markup`; run `pnpm install` before the first commit.
- Grammar, exactly: `**bold**`, `_italic_`, `[label]({{name}})`; `\` escapes `*`, `_`, `[`, `]` and `\`; any other `\x` is the two characters as written.
- Marks apply to paragraph `text`, callout `text` and each list item. Button label, code, html and every SMS body stay plain.
- A text field stays a string; `BLOCK_TEXT_MAX_LENGTH` (5000) counts the stored string, markers included.
- A link's href passes the same check as a button's (`ctx.href`): one `url` variable, scheme `http`, `https` or `mailto`; a refused link renders its label as plain text and reports as the button does.
- The text arm drops markers and prints a link as `label (url)`; a refused link prints the label alone.
- The change is breaking (text with a literal `**` or `_` now renders as markup): the commit header carries `!`; the version is read off `nx release version --dry-run`, never written by hand.
- Toolchain: `export PATH=$HOME/.local/share/mise/installs/node/24.22.1/bin:$HOME/.local/share/mise/installs/pnpm/10.33.0:$PATH` before every command, a commit included.
- Run tasks through nx: `CI=true pnpm nx run @zeroxsolutions/template:test`, `... :typecheck`, `... :lint`, `... :build`.
- Commits: conventional, header at most 72 characters, `git commit -F`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; files plain ASCII.
- Publishing waits for the owner's go; this plan ends at a merged pull request.

## Review Focus

1. A variable token holding `_` (`{{first_name}}`) read as an italic marker: pinned in Task 1 (`parses a variable token with an underscore as text`).
2. A variable value holding markup characters (`*`, `_`, `<`) changing the rendered marks or escaping: pinned in Task 2 (`fills a value as text after the marks are drawn`).
3. A link whose variable is filled with `javascript:` text: pinned in Task 2 (`renders a refused link's label as plain text`).
4. A malformed text stored before this release reaching a render: render degrades it to its plain characters rather than throwing, pinned in Task 2 (`renders malformed markup as its literal text`).
5. A translation that keeps the words but drops a bold span or swaps a link's variable: pinned in Task 1 (`sameInlineMarkup` cases).

---

### Task 1: The grammar

**Files:**

- Create: `packages/template/src/lib/markup/inline-markup.ts`
- Create: `packages/template/src/lib/markup/inline-markup.spec.ts`
- Modify: `packages/template/src/index.ts`

**Interfaces:**

- Produces, from `@zeroxsolutions/template`:
  ```ts
  interface InlineText {
    readonly kind: 'text';
    readonly text: string;
    readonly bold: boolean;
    readonly italic: boolean;
  }
  interface InlineLink {
    readonly kind: 'link';
    readonly variable: string;
    readonly label: readonly InlineText[];
  }
  type InlineRun = InlineText | InlineLink;
  type InlineMarkupProblem =
    | 'marker-unclosed'
    | 'link-unclosed'
    | 'link-target-not-one-token'
    | 'link-label-empty'
    | 'link-nested';
  type ParsedInlineMarkup =
    | { readonly ok: true; readonly runs: readonly InlineRun[] }
    | { readonly ok: false; readonly problem: InlineMarkupProblem; readonly offset: number };
  function parseInlineMarkup(source: string): ParsedInlineMarkup;
  function printInlineMarkup(runs: readonly InlineRun[]): string;
  function plainInlineText(source: string): string; // markers dropped, escapes resolved, a link as its label
  function sameInlineMarkup(source: unknown, translation: unknown): boolean;
  ```
- `text` in a run keeps `{{name}}` tokens verbatim; adjacent runs with the same marks are merged; an empty text run is never emitted.

- [ ] **Step 1: Write the failing tests** in `inline-markup.spec.ts`:
  - `parses plain text as one run`: `'Hi {{name}},'` -> `[{ kind: 'text', text: 'Hi {{name}},', bold: false, italic: false }]`
  - `parses bold, italic and both`: `'a **b** _c_ **_d_**'` -> runs `a ` / `b` bold / ` ` / `c` italic / ` ` / `d` bold+italic
  - `parses a link with a marked label`: `'[Open **now**]({{trip_url}})'` -> one `link` run, variable `trip_url`, label runs `Open ` and `now` bold
  - `parses a variable token with an underscore as text`: `'{{first_name}}'` -> one plain run `{{first_name}}`
  - `resolves escapes`: `'\\*\\*x\\_ \\[y\\] \\\\'` -> one plain run `**x_ [y] \`; `'\\n'` -> plain run `\n` (backslash kept)
  - `keeps a lone star as text`: `'5 * 3'` -> one plain run `5 * 3`
  - refusals, each with its offset: `'**a'` -> `marker-unclosed` at 0; `'_a'` -> `marker-unclosed` at 0; `'[a'` -> `link-unclosed` at 0; `'[a](https://x)'` -> `link-target-not-one-token` at 3; `'[a]({{u}} {{v}})'` -> `link-target-not-one-token`; `'[]({{u}})'` -> `link-label-empty` at 0; `'[[a]({{u}})]({{v}})'` -> `link-nested` at 1
  - `prints what it parsed`: for every accepted input above, `printInlineMarkup(parse(x).runs)` parsed again deep-equals the first parse; for the canonical inputs `'a **b** _c_'` and `'[Open **now**]({{trip_url}})'` the print equals the input
  - `escapes markers in text when printing`: runs `[{ text: 'a*b_[c]\\', plain }]` -> `'a\\*b\\_\\[c\\]\\\\'`
  - `plainInlineText` of `'**Hi** [there]({{u}}) \\_'` -> `'Hi there _'`
  - `sameInlineMarkup`: true for `'**a** [b]({{u}})'` vs `'[x]({{u}}) **y**'`; false when a bold span is dropped, when a link's variable differs, when an italic span is added, and when the translation is malformed; reads strings nested in arrays and objects like `sameVariableTokens` (`{ items: ['**a**'] }` vs `{ items: ['b'] }` -> false)
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/template:test -- --run src/lib/markup/inline-markup.spec.ts`; expected FAIL (module missing).
- [ ] **Step 3: Implement** in `inline-markup.ts`. A single left-to-right scan: at each position try, in order, a `{{\w+}}` token (copied into text whole, so its `_` is never a marker), an escape, `**`, `_`, `[`, `]`; a lone `*` is text. `sameInlineMarkup` compares, per string, the sorted list of `bold`/`italic` span counts and link variable names, as `sameVariableTokens` compares tokens; a malformed side compares false. Export the names above from `src/index.ts`.
- [ ] **Step 4: Run** the same command; expected PASS. Then `CI=true pnpm nx run-many -t lint typecheck -p @zeroxsolutions/template`; expected PASS.
- [ ] **Step 5: Commit** `feat(template): parse and print inline markup`.

### Task 2: The renderer draws it

**Files:**

- Modify: `packages/template/src/lib/email/block.ts` (`RenderContext.inline`)
- Modify: `packages/template/src/lib/email/context.ts`
- Modify: `packages/template/src/lib/email/blocks/shared.ts` (`inlineText` schema), `paragraph.ts`, `callout.ts`, `list.ts`
- Modify: `packages/template/src/lib/email/index.ts` (export the bounds)
- Modify: `packages/template/README.md` (a "Inline markup" section after "Variables")
- Test: `packages/template/src/lib/email/renderer.spec.ts`, `packages/template/src/lib/email/blocks/index.spec.ts`

**Interfaces:**

- Consumes: `parseInlineMarkup`, `plainInlineText` (Task 1).
- Produces: `RenderContext.inline(template: string): RenderedBlock`; `inlineText` (`blockText` refined so `parseInlineMarkup(x).ok`); `@zeroxsolutions/template/email` exports `BLOCK_TEXT_MAX_LENGTH`, `BUTTON_LABEL_MAX_LENGTH`, `BUTTON_HREF_MAX_LENGTH`, `LIST_MAX_ITEMS`.

- [ ] **Step 1: Write the failing tests** in `renderer.spec.ts`, rendering one paragraph through `createEmailRenderer` with `variableTypes: { u: 'url', name: 'string' }`:
  - `draws bold, italic and a link`: text `'**Hi** _{{name}}_ [open]({{u}})'`, values `{ name: 'Mai', u: 'https://x.test/a?b=1&c=2' }` -> html contains `<strong>Hi</strong>`, `<em>Mai</em>`, `<a href="https://x.test/a?b=1&amp;c=2"` and `>open</a>`; text arm contains `Hi Mai open (https://x.test/a?b=1&c=2)`
  - `fills a value as text after the marks are drawn`: value `name: '**<b>_x_</b>**'` inside `_{{name}}_` -> html contains `<em>**&lt;b&gt;_x_&lt;/b&gt;**</em>` and no `<strong>`
  - `renders a refused link's label as plain text`: `u: 'javascript:alert(1)'` -> html has no `<a`, contains `open`; problems include `{ kind: 'href-scheme-refused', name: 'u' }`; same for a link naming the `string` variable `name` -> `href-not-url-variable`
  - `renders malformed markup as its literal text`: `readContent` path with text `'**a'` -> html contains `**a`, no throw
  - `draws marks in a callout and in each list item` (one assertion each)
  - in `blocks/index.spec.ts`: `refuses malformed markup on write`: `renderer.contentOf('paragraph', { text: '**a' })` -> `null`; same for `callout` and a list item; `contentOf('button', { label: '**a', href: '{{u}}' })` stays accepted (labels are plain)
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/template:test -- --run src/lib/email`; expected the new cases FAIL.
- [ ] **Step 3: Implement.** `inline(template)` in `createRenderContext`: report missing variables once for the whole template as `html()` does; parse; on failure fall back to `{ html: this.html(template), text: this.text(template) }`; on success draw each text run as `escapeHtml(interpolate(run.text, values, 'text'))` wrapped in `<strong>`/`<em>`, and each link through `href(token)`: a non-empty href draws `<a href="..." style="color:${theme.colors.primary};">label</a>`, an empty one draws the label alone. Paragraph, callout and list call `ctx.inline` where they call `ctx.html`/`ctx.text` today, and use `inlineText` in their strict content schema. Export the four bounds from `email/index.ts`. README: the grammar, the three blocks it applies to, the text arm's form, one example.
- [ ] **Step 4: Run** `CI=true pnpm nx run-many -t lint typecheck test build -p @zeroxsolutions/template`; expected PASS, the `checkEmailRenderer` conformance spec included.
- [ ] **Step 5: Commit** `feat(template)!: draw inline markup in text blocks`, body naming the break: a literal `**` or `_` in a paragraph, callout or list item now renders as a mark and is refused on write unless escaped.

### Task 3: Pull request

- [ ] **Step 1:** `nx release version --projects=@zeroxsolutions/template --dry-run` and record the version it prints in the PR body (do not run it without `--dry-run`).
- [ ] **Step 2:** Push and open the PR; body lists the grammar, the breaking note, the dry-run version, and ends with the Claude Code line. Wait on its checks (gundam `waiting-on-a-run`); merge on green per the owner's standing rule.
- [ ] **Step 3:** Report the merged commit; the release (version, changelog, publish) runs only on the owner's go, by the `zeroxsolutions` CLAUDE.md procedure.
