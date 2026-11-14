# Editor in the web registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the editor chrome under `packages/ui/registry/bases/base-ui/editor/` as 19 `@zui/*` registry items, each documented on the web docs with a demo.

**Architecture:** Each item is an entry of `packages/ui/registry.json` whose files keep their tree under `editor/` in the consumer (`target: components/editor/<path below editor/>`), so the chrome's relative imports keep resolving after `shadcn add`. `registry.spec.ts` learns the editor's `.js` imports, its owners and its stylesheet, and gains a rule that every editor file ships in exactly one item. Docs pages live in a new `content/docs/editor/` section of `packages/ui-docs-web`.

**Tech Stack:** shadcn registry (`registry.json`, `shadcn build`), Vitest, Fumadocs MDX, Tiptap via `@zeroxsolutions/editor-core`.

**Spec:** `docs/superpowers/specs/2026-11-14-editor-registry-design.md`

## Global Constraints

- No behaviour change to the chrome or to `packages/editor-core`; moving or deleting a file only where the spec says (`shared/index.ts` is deleted).
- `katex` and `mermaid` stay in the core's `dependencies`; the core is neither changed nor released.
- Item names, exactly: `editor-theme`, `editor-code-mirror` (both `registry:lib`), `document-editor`, `editor-callout`, `editor-code-block`, `editor-embed`, `editor-image`, `editor-link`, `editor-math`, `editor-mention`, `editor-mermaid`, `editor-table`, `editor-toggle`, `editor-features`, `math-editor`, `mermaid-editor`, `code-editor`, `chat-input`; category `editor` for every one.
- Every component item has one `<name>-demo` example at `registry/bases/base-ui/examples/<name>-demo.tsx` (existing `demoProblems`); the two libs have none.
- Registry dependencies as the registry names them: `@shadcn/<name>` for vendored parts, `@zui/<name>` for this registry's items; `@zeroxsolutions/editor-core` in `dependencies` of every item importing it.
- Docs pages: `packages/ui-docs-web/content/docs/editor/index.mdx` and `editor/<item>.mdx`, shaped as `content/docs/components/base/editor-tab.mdx`; the section sits after `components` in `content/docs/meta.json`.
- Toolchain: prefix commands with `export PATH="$HOME/.local/share/mise/installs/node/24.22.1/bin:$HOME/.local/share/mise/installs/pnpm/10.33.0:$PATH"`; if `node_modules/.bin/nx` is missing after a commit hook, run `CI=true pnpm install --frozen-lockfile` again.
- Run tasks through nx (`CI=true pnpm nx run <project>:<target>`); never run e2e targets locally; never `pkill` by name.
- Never stage `apps/registry-ui/next-env.d.ts` or `apps/native-preview-uniwind/uniwind-types.d.ts`.
- Commits: conventional header of at most 72 characters, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; all authored text plain ASCII.

## Review Focus

1. A consumer installs `editor-math` without `document-editor`'s files landing where its relative imports expect them: pinned by the target rule in Task 1 (`editorProblems` reports a file whose `target` is not `components/editor/<path below editor/>`).
2. A project installing `chat-input` or `code-editor` receives KaTeX's stylesheet or the typography plugin: pinned in Task 4 (those items' `css` keys name neither `katex` nor `typography`).
3. An editor file added later in no item: pinned in Task 5 (the real-registry editor assertion).
4. A docs page whose demo throws during server render: Task 5 adds every editor page to the e2e page lists CI runs.
5. The chrome needing core API newer than the published 0.1.0: Task 5 typechecks the editor against the 0.1.0 tarball.

---

### Task 1: Teach the registry check the editor

**Files:**

- Modify: `packages/ui/registry/registry.spec.ts` (`sourceOf`, `ownersOf`, `stylesheetRule`, new `editorFiles`, `editorProblems`)
- Delete: `packages/ui/registry/bases/base-ui/editor/shared/index.ts`

**Interfaces:**

- Produces: `editorFiles(): string[]` (every non-spec `.ts`/`.tsx` under `${BASE}/editor/`, sorted); `editorProblems(items: RegistryItem[], files: string[]): string[]`.
- Produces: `sourceOf` resolves a relative `./x.js` / `../x.js` specifier to `x.ts` or `x.tsx`; `ownersOf` maps files under `${BASE}/editor/` to their item; `stylesheetRule(rule)` finds a rule in `base-ui/styles.css` or else `base-ui/editor/styles.css`.

- [ ] **Step 1: Write the failing tests** in a new `describe('editorProblems', ...)` with fixture items, as the file's other `describe` blocks do:
  - `reports an editor file no item ships` -> `['registry/bases/base-ui/editor/x.tsx: ships in no editor item']`
  - `reports an editor file two items ship` -> one problem naming both items
  - `reports an editor item outside the editor category` -> `'<name>: category should be editor'`
  - `reports a file whose target is not its path below editor/` -> `'<name>: <path> should target components/editor/<rest>'`
  - `reports nothing for one item per file with matching targets` -> `[]`
  - in `describe('declarationProblems', ...)`: `resolves a relative .js import to its .ts source` (fixture item whose file imports `./x.js`; expected no "resolves to no file" problem).
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run registry/registry.spec.ts`; expected: the new cases FAIL (functions undefined / `.js` unresolved).
- [ ] **Step 3: Implement** the four changes above. `.js` resolution: strip a trailing `.js` from the stem before trying the extension list. `editorProblems` treats an item as an editor item when any of its files is under `${BASE}/editor/` (files under `lib/`, `hooks/`, `types/` that `SHIPPED` covers are exempt from the target rule).
- [ ] **Step 4: Delete `shared/index.ts`** (it exports nothing; `grep -rn "shared/index" packages/ui` finds no importer).
- [ ] **Step 5: Run** the same command plus `CI=true pnpm nx run-many -t lint typecheck -p @zeroxsolutions/ui`; expected: PASS. The existing `registry.json` cases still pass because no editor item exists yet.
- [ ] **Step 6: Commit** `test(ui): check the editor's registry items`.

### Task 2: The libs, the document editor, and the Editor docs section

**Files:**

- Modify: `packages/ui/registry.json` (items `editor-theme`, `editor-code-mirror`, `document-editor`, example `document-editor-demo`)
- Create: `packages/ui/registry/bases/base-ui/examples/document-editor-demo.tsx`
- Create: `packages/ui-docs-web/content/docs/editor/{meta.json,index.mdx,document-editor.mdx,editor-theme.mdx,editor-code-mirror.mdx}`
- Modify: `packages/ui-docs-web/content/docs/meta.json` (`"editor"` after `"components"`)
- Modify: `apps/registry-ui/src/app/global.css` (import `@zeroxsolutions/ui/registry/bases/base-ui/editor/styles.css` after the base sheet)
- Regenerate: `packages/ui/registry/bases/base-ui/examples/__index__.tsx`, `__components__.tsx` with `packages/ui/tools/build-examples-index.mts` (find its nx target)

**Interfaces:**

- Consumes: Task 1's `editorProblems` target rule.
- Produces: item names `@zui/editor-theme`, `@zui/editor-code-mirror`, `@zui/document-editor` that later items depend on.

- [ ] **Step 1: Add the three items**, files per the spec's table (`editor-theme`: `shared/theme/**`; `editor-code-mirror`: `shared/code-mirror/**`; `document-editor`: `document/react/**`, `document/ui/**`, `document/node-view-adapter.tsx`, `document/serialize/**`, `document/features/standard/**`, `react-types.ts`), each file with `target: components/editor/<path below editor/>`. Fill `dependencies` and `registryDependencies` until `declarationProblems` reports none for them.
- [ ] **Step 2: `css` of `document-editor`**: the rules of `editor/styles.css` the document surfaces draw, including the `@plugin "@tailwindcss/typography"` line and the prose mapping, keyed the way `image-preview` keys `@utility bg-checkerboard`. Validate with `pnpm exec shadcn registry validate registry.json` in `packages/ui`. If the CLI refuses an at-rule key, ship the plugin as a `devDependencies` entry plus a manual step on the page, and write the ruling in the commit body.
- [ ] **Step 3: Demo** `DocumentEditorDemo(): ReactNode`: an `Editor` with the standard kit and a short seeded document (heading, paragraph, list, task list).
- [ ] **Step 4: Docs**: `editor/index.mdx` (what the core is, what the chrome is, `npm i @zeroxsolutions/editor-core`, which item to start from for a document, a code file, a chat input, a formula); `document-editor.mdx` like `editor-tab.mdx`; the two lib pages with install and usage, no `ComponentPreview`.
- [ ] **Step 5: Run** `CI=true pnpm nx run-many -t lint typecheck test -p @zeroxsolutions/ui @zeroxsolutions/ui-docs-web --parallel=1` and the ui project's registry build target; expected: PASS, and `git status` shows no stale generated file.
- [ ] **Step 6: Commit** `feat(ui): publish the document editor and its libs`.

### Task 3: The ten document features

**Files:**

- Modify: `packages/ui/registry.json` (items `editor-callout`, `editor-code-block`, `editor-embed`, `editor-image`, `editor-link`, `editor-math`, `editor-mention`, `editor-mermaid`, `editor-table`, `editor-toggle` and their `-demo` examples)
- Create: `examples/<item>-demo.tsx` x10; `packages/ui-docs-web/content/docs/editor/<item>.mdx` x10; extend `editor/meta.json`

**Interfaces:**

- Consumes: `@zui/document-editor`, `@zui/editor-code-mirror` (from `code-block.tsx`), `@zui/editor-theme`.

- [ ] **Step 1: Add the ten items**, files `document/features/<folder>/**` (folders: `callout`, `code-block`, `embed`, `image`, `link`, `math`, `mention`, `mermaid`, `table`, `toggle`), targets per Task 1, declarations until `declarationProblems` is clean. `css`: each feature's block rules from `editor/styles.css`; the `@import 'katex/dist/katex.min.css'` rule goes on `editor-math` only.
- [ ] **Step 2: Ten demos**, each an `Editor` with the standard kit plus that one feature and a document using it.
- [ ] **Step 3: Ten pages** like `document-editor.mdx`, install steps naming `@zui/document-editor` as the prerequisite.
- [ ] **Step 4: Run** as Task 2 Step 5; expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): publish the editor's document features`.

### Task 4: The barrel and the standalone surfaces

**Files:**

- Modify: `packages/ui/registry.json` (items `editor-features`, `math-editor`, `mermaid-editor`, `code-editor`, `chat-input` and their demos)
- Create: five demos, five pages; extend `editor/meta.json`
- Modify: `packages/ui/registry/registry.spec.ts` (Review Focus 2)

- [ ] **Step 1: Write the failing test** in `describe('registry.json', ...)`: `ships neither KaTeX's stylesheet nor the typography plugin with chat-input or code-editor` - for both items, `Object.keys(item.css ?? {})` has no key matching `/katex|typography/`, and both items exist.
- [ ] **Step 2: Run** the registry spec; expected: FAIL (items missing).
- [ ] **Step 3: Add the five items**: `editor-features` = `document/features/index.ts` (depends on all ten feature items); `math-editor` = `math/react/**` (carries the KaTeX import); `mermaid-editor` = `mermaid/react/**`; `code-editor` = `code/**`; `chat-input` = `composer/**`. Targets and declarations as before.
- [ ] **Step 4: Demos and pages** for the five.
- [ ] **Step 5: Run** as Task 2 Step 5; expected: PASS.
- [ ] **Step 6: Commit** `feat(ui): publish the standalone editor surfaces`.

### Task 5: Close the coverage, the lists and the published core

**Files:**

- Modify: `packages/ui/registry/registry.spec.ts` (real-registry editor case)
- Modify: every list that enumerates all items or all docs pages: `grep -rln "editor-tab" apps packages --include=*.spec.ts --include=*.spec.tsx` names the candidates (`apps/registry-ui-e2e/src/*.spec.ts`, `packages/ui/src/site/lib/*.spec.ts`, `packages/ui-docs-web/src/routes/index.spec.ts`, `apps/registry-ui/src/lib/source.spec.ts`); extend only lists meant to be exhaustive (a count or an "every" assertion).
- Modify: `README.md` if it lists the registry's items.

- [ ] **Step 1: Add** `it('ships every editor file in exactly one editor item', () => expect(editorProblems(REGISTRY.items, editorFiles())).toEqual([]))`; run; expected: PASS (fails only if Tasks 2-4 left a file out - then add it to its item).
- [ ] **Step 2: Extend the lists**; run their unit specs; expected: PASS.
- [ ] **Step 3: Typecheck against the published core**: in a scratch dir outside the repo, `npm pack @zeroxsolutions/editor-core@0.1.0` and unpack; add a temporary `tsconfig.core-check.json` in `packages/ui` extending its tsconfig with `paths` `"@zeroxsolutions/editor-core/*": ["<unpacked>/package/dist/*"]`, `include` the editor folder; run `pnpm exec tsc -p tsconfig.core-check.json --noEmit`; delete the temporary file. Expected: no errors. If there are errors, stop and report them: the core must be released first, which needs the owner.
- [ ] **Step 4: Run** `CI=true pnpm nx run-many -t lint typecheck test build -p @zeroxsolutions/ui @zeroxsolutions/ui-docs-web @zeroxsolutions/registry-ui --parallel=1`; expected: PASS and a clean `git status`.
- [ ] **Step 5: Commit** `test(ui): hold every editor file to a registry item`.
