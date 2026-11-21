# Template into editor-core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `@zeroxsolutions/template` into `@zeroxsolutions/editor-core` as `src/template/`, fence it so a worker loads nothing else, tidy editor-core's entries, and remove the package from zeroxsolutions.

**Architecture:** The template's `src/lib/<x>/` becomes `packages/editor-core/src/template/<x>/` and its root barrel becomes `src/template/index.ts`; editor-core's wildcard entry map publishes every barrel as a subpath, so no entry map changes. A spec inside `src/template/` fails any import that leaves the folder or names a package other than `zod` and `get-east-asian-width`. The same branch deletes editor-core's empty barrels, replaces its one `export *`, adds `composer/index`, and moves every consumer to an area's `index`, with a spec in each consuming project keeping it so.

**Tech Stack:** TypeScript, vite 8 library build with per-file entries, vitest, oxlint, knip, nx release (independent, conventional commits).

**Spec:** `docs/superpowers/specs/2026-11-20-editor-profiles-design.md`, sections "The template code moves into editor-core" and "editor-core's entries".

## Global Constraints

- ui worktree `.claude/worktrees/template-into-editor-core` off `origin/master`, branch `refactor/template-into-editor-core`; `pnpm install` before the first commit. Never touch the main checkouts (`/Users/tus/ZeroXSolutions/ui`, `/Users/tus/ZeroXSolutions/zeroxsolutions`); read zeroxsolutions through `git -C /Users/tus/ZeroXSolutions/zeroxsolutions show|archive 5bb8d693 ...` only.
- Source commit: zeroxsolutions `5bb8d693` (master after #103). Copy, do not import history.
- Entry mapping, exactly: `.` -> `template/index`, `./email` -> `template/email/index`, `./email/testing` -> `template/email/testing/index`, `./sms` -> `template/sms/index`. The names each entry lists do not change.
- `src/template/` imports only files inside `src/template/`, `zod`, and `get-east-asian-width` (with subpaths). No `@/` alias, no `node:` module, no other package.
- `get-east-asian-width` joins editor-core's `dependencies` at `1.6.0`, the pin the template had; zod stays editor-core's own `^4.6.7`.
- Allowed consumer paths, exactly: `@zeroxsolutions/editor-core/<folders>/index`, `@zeroxsolutions/editor-core/document/advanced`, `@zeroxsolutions/editor-core/package.json`.
- Toolchain: `export PATH=$HOME/.local/share/mise/installs/node/24.22.1/bin:$HOME/.local/share/mise/installs/pnpm/10.33.0:$PATH` before every command, a commit included. nx targets only (`CI=true pnpm nx run <project>:<target>`); never run e2e locally; never `pkill` by name; never `git checkout -- .`, `git reset --hard`, `git clean` or `git stash` on uncommitted work.
- Never stage `apps/registry-ui/next-env.d.ts`, `apps/registry-editor-docs-zone/next-env.d.ts`, `apps/native-preview-uniwind/uniwind-types.d.ts`.
- Commits: conventional, header at most 72 characters, `git commit -F`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; files plain ASCII.
- No release and no npm command in this plan: the template ships in the editor-core release after the profiles plan, on the owner's go.

## Rulings made while planning

- The template's specs keep running in a node environment through a `// @vitest-environment node` first line in each template spec, since editor-core's default is jsdom and a DOM global in worker code must fail a test. Cost if wrong: one comment line per spec file.
- Spec-only helpers (`*.fixture.ts`) are excluded from the library build, the lib tsconfig and knip's production files, and included in the spec tsconfig. Cost if wrong: none shipped either way; the build would otherwise publish two test generators.
- The entries check is two short specs, one in `packages/ui` and one in `packages/editor-docs-web`, each scanning its own project, because an nx test's cache inputs are its own project's files: one spec reading another project's files would answer from a stale cache. Cost: one regex written twice.
- This plan ships as its own pull request before the profiles plan starts, not on the profiles branch: it is a move plus a tidy a reviewer can check by itself, and the profiles plan then starts from master with the template already in place.

## Review Focus

1. A worker importing `template/email/index` from the built package pulls in an editor-core chunk holding engine code: the build's per-file entries emit no shared chunk that mixes template and non-template modules; Task 1 asserts `dist/template/**` imports nothing outside `dist/template/` but `zod` and `get-east-asian-width`.
2. A template module touching `document` or `window`: caught by the node environment in its spec (ruling above).
3. A consumer name only a deep file exported, lost when the import moves to the area index: Task 3 adds it to the index, or to `document/advanced` when its declaration names an engine type (the build's `assert-engine-free-dts` fails otherwise).
4. Travel importing a path that does not exist: the mapping above, pinned by Task 1's dist listing.
5. zeroxsolutions removing the package while a build there still references it: Task 4 runs the whole graph's typecheck and build.

---

### Task 1: Copy the template into editor-core

**Files:**

- Create: `packages/editor-core/src/template/**` (every file of zeroxsolutions `packages/template/src/` at `5bb8d693`, `lib/` dropped from each path, `index.ts` to `template/index.ts`)
- Modify: `packages/editor-core/package.json` (dependency), `packages/editor-core/vite.config.mts` (glob ignore), `packages/editor-core/tsconfig.lib.json` (exclude), `packages/editor-core/tsconfig.spec.json` (include), `knip.jsonc` (ignore), `packages/editor-core/README.md` (a section)

**Interfaces:**

- Produces: the four entries in the mapping, with the names they list at `5bb8d693`; later tasks and the profiles plan import them relatively from inside editor-core (`../template/...`) and consumers through the mapping.

- [ ] **Step 1: Confirm the red state.** Run `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template`; expected: vitest reports no test files found.
- [ ] **Step 2: Copy.** `git -C /Users/tus/ZeroXSolutions/zeroxsolutions archive 5bb8d693 packages/template/src | tar -x -C <scratch>`, then move `<scratch>/packages/template/src/lib/*` to `packages/editor-core/src/template/` and `<scratch>/packages/template/src/index.ts` to `packages/editor-core/src/template/index.ts`. In `template/index.ts` only, drop the `./lib` segment from every path. Inner relative imports need no change. Add `// @vitest-environment node` as the first line of every `src/template/**/*.spec.ts`.
- [ ] **Step 3: Config.** `package.json` `dependencies`: `"get-east-asian-width": "1.6.0"`. `vite.config.mts` glob `ignore`: add `'src/**/*.fixture.ts'`. `tsconfig.lib.json` `exclude`: add `"src/**/*.fixture.ts"`. `tsconfig.spec.json` `include`: add `"src/**/*.fixture.ts"`. `knip.jsonc` `packages/*` `ignore`: add `"src/**/*.fixture.ts"` beside the spec glob. `pnpm install`.
- [ ] **Step 4: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template`; expected PASS with the same test count `pnpm nx run @zeroxsolutions/template:test` reported at `5bb8d693` (220).
- [ ] **Step 5: Build and read the dist.** `CI=true pnpm nx run-many -t lint typecheck build -p @zeroxsolutions/editor-core`; PASS. Then:
  - `ls packages/editor-core/dist/template/index.js packages/editor-core/dist/template/email/index.js packages/editor-core/dist/template/email/testing/index.js packages/editor-core/dist/template/sms/index.js` lists all four, each with its `.d.ts`;
  - `find packages/editor-core/dist -name '*fixture*'` prints nothing;
  - `grep -rhoE "from ['\"][^'\"]+['\"]" packages/editor-core/dist/template | sort -u` shows only relative paths inside `dist/template/`, `zod` and `get-east-asian-width`.
- [ ] **Step 6: README.** Add a section `## Message templates - template/` to `packages/editor-core/README.md`: the four entries with what each lists (from the template README at `5bb8d693`, paths rewritten by the mapping), the fence in one sentence, and that the code came from zeroxsolutions `5bb8d693`. Fix the README's own import examples to the `/index` paths the wildcard map resolves (`document/core/index`, not `document/core`).
- [ ] **Step 7: Commit** `feat(editor-core): carry the message template code` with a body naming the source commit and the entry mapping.

### Task 2: The fence

**Files:**

- Create: `packages/editor-core/src/template/fence.spec.ts`

**Interfaces:**

- Consumes: the folder Task 1 created.

- [ ] **Step 1: Write the failing spec** (`// @vitest-environment node` first). Inside it, two helpers the tests call: `importsOf(source: string): string[]` (every specifier of `from '...'`, `import '...'` and `import('...')`) and `fenceViolations(file: string, specifiers: string[]): string[]` (a specifier that resolves outside `src/template/`, starts with `@/` or `node:`, or names a package other than `zod` and `get-east-asian-width`). Tests:
  - `refuses an engine import`: `fenceViolations('<root>/template/index.ts', ['@tiptap/core'])` equals `['@tiptap/core']`.
  - `refuses a relative path out of the folder`: from `<root>/template/index.ts`, `['../document/core/index.js']` is refused; from `<root>/template/email/blocks/list.ts`, `['../../variables/interpolate.js']` is not.
  - `refuses the alias and node modules`: `['@/document/core/index.js', 'node:fs']` both refused.
  - `allows zod and the width table`: `['zod', 'zod/v4', 'get-east-asian-width']` none refused.
  - `holds for every shipped template file`: every `.ts` under `src/template/` that is not a `.spec.ts` or `.fixture.ts` has no violation; the failure message names the file and the specifier.
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/editor-core:test -- --run src/template/fence.spec.ts`; FAIL while the helpers are stubs returning `[]` (the four unit cases).
- [ ] **Step 3: Implement** the two helpers in the spec file.
- [ ] **Step 4: Run** the same; PASS. Prove the last test can fail: add `import '@tiptap/core';` to `src/template/text/display-width.ts`, run, see it name that file, remove the line, run again; PASS.
- [ ] **Step 5: Commit** `test(editor-core): fence the template folder`.

### Task 3: editor-core's entries

**Files:**

- Delete: `packages/editor-core/src/{index,document/index,math/index,mermaid/index,migrate/index}.ts`
- Modify: `packages/editor-core/vite.config.mts` (drop the `src/index.ts` ignore), `packages/editor-core/src/document/core/index.ts:9`, `packages/editor-core/src/document/advanced.ts`
- Create: `packages/editor-core/src/composer/index.ts`, `packages/ui/src/build/editor-core-entries.spec.ts`, `packages/editor-docs-web/src/editor-core-entries.spec.ts`
- Modify: every file in `packages/ui` and `packages/editor-docs-web` importing an `@zeroxsolutions/editor-core/` path that is not allowed (about 80 and 13 files at `origin/master`)

**Interfaces:**

- Produces: `composer/index` listing every name of `composer-types.ts`, `message-payload.ts` and `triggers/trigger-token.ts`; `document/advanced` adding `facadeFor` (from `core/engine/facade-registry.js`) and `type EngineHandle` (from `core/engine/engine-handle.js`).

- [ ] **Step 1: Write the two failing specs.** Each reads every `.ts`, `.tsx` and `.mdx` file of its project (`packages/ui`: `registry/` and `src/`; `packages/editor-docs-web`: `content/` and `src/`), collects each `@zeroxsolutions/editor-core/...` specifier, and asserts the list of those not matching `/^@zeroxsolutions\/editor-core\/(?:(?:[a-z-]+\/)*index|document\/advanced|package\.json)$/` is `[]`, printing file and specifier. The `packages/ui` spec also asserts no file under `packages/editor-core/src` contains `export *` (that project's spec may read editor-core: editor-core is in its dependency graph, so its files are in the test's inputs).
- [ ] **Step 2: Run** `CI=true pnpm nx run @zeroxsolutions/ui:test -- --run src/build/editor-core-entries.spec.ts` and `CI=true pnpm nx run @zeroxsolutions/editor-docs-web:test -- --run src/editor-core-entries.spec.ts`; both FAIL, listing the deep imports and the one `export *`.
- [ ] **Step 3: editor-core.** Delete the five barrels and the vite ignore entry. Replace `export * from './types/index.js'` with an explicit list of every name `types/index.ts` exports (types as `export type`). Write `composer/index.ts`. Add the two engine names to `document/advanced.ts`.
- [ ] **Step 4: Consumers.** Rewrite each refused specifier by its folder: under `document/core/engine/` -> `document/advanced`; any other path under `document/core/` -> `document/core/index`; `document/serialize/**` -> `document/serialize/index`; `document/migrate/**` -> `document/migrate/index`; `document/ui/**` -> `document/ui/index`; `math/core/**` -> `math/core/index`; `mermaid/core/**` -> `mermaid/core/index`; `composer/**` -> `composer/index`. Merge imports a file now takes twice from one entry. A name the area index does not list goes into that index, or into `document/advanced` if its declaration imports an engine type.
- [ ] **Step 5: Run** both specs; PASS. Then `CI=true pnpm nx run-many -t lint typecheck test build -p @zeroxsolutions/editor-core @zeroxsolutions/ui @zeroxsolutions/editor-docs-web` and `CI=true pnpm nx run @zeroxsolutions/ui:build-registry`; PASS (the build's `assert-engine-free-dts` included).
- [ ] **Step 6: Commit** in two commits: `refactor(editor-core): list each entry's names in its index` (editor-core files) and `refactor(ui): import editor-core through its entries` (the two consuming projects and their specs).

### Task 4: Remove the package from zeroxsolutions

Runs after the ui pull request of Tasks 1-3 merges.

**Files (zeroxsolutions repo):**

- Delete: `packages/template/`
- Modify: `tsconfig.json` (drop `{ "path": "./packages/template" }` from `references`), `README.md:29` (the `template` row becomes a line saying it moved to `@zeroxsolutions/editor-core`'s `template/*` entries in zeroxsolutions/ui), `pnpm-lock.yaml` (by `pnpm install`)

- [ ] **Step 1:** Worktree `/Users/tus/ZeroXSolutions/zeroxsolutions/.claude/worktrees/remove-template` off `origin/master`, branch `refactor/remove-template`; `pnpm install`.
- [ ] **Step 2:** `git grep -n -E "packages/template|@zeroxsolutions/template"` outside `docs/plans/` and `packages/template/` lists only the two files above; edit them, delete the folder, `pnpm install`.
- [ ] **Step 3: Run** `CI=true pnpm nx run-many -t lint typecheck build test`; PASS. `pnpm nx release version --dry-run` names no `template` project.
- [ ] **Step 4: Commit** `chore: remove the template package, now in editor-core`, with a body naming the ui pull request and the entry mapping. Not `refactor!`: the published versions stay on npm and nothing here is released.

### Finishing

- [ ] ui: push `refactor/template-into-editor-core`, open the pull request (body: the mapping, the fence, the entries tidy, no release), merge on green.
- [ ] zeroxsolutions: Task 4's pull request, merge on green.
- [ ] Deprecating `@zeroxsolutions/template` on npm waits for travel's switch and the owner's go.
