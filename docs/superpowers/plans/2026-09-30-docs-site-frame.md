# Docs Site Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/registry-ui` moves to base-nova and serves a docs site laid out like shadcn's `apps/v4` (fumadocs-mdx + fumadocs-core, our own shell), with every route, the content pipeline and one page of each kind, built as a Cloudflare Worker and tested against that worker.

**Architecture:** Tasks 1 and 2 move the registry to base-nova through the shadcn CLI and fix what `apply` gets wrong. Task 3 upgrades Next and the OpenNext adapter to the versions the pinned fumadocs and adapter need. Tasks 4 to 7 build the content pipeline, the demo index and MDX components, the shell and search. Tasks 8 and 9 add one page of each kind and the remaining routes; Task 10 records the site in `CLAUDE.md` and measures the worker. Every task was rehearsed on a throwaway worktree with the tasks before it applied; each `Expected:` line is real output from that stacked tree.

**Tech Stack:** Next.js 16.3.7 (Turbopack), React 19.2, fumadocs-mdx 15.4.5, fumadocs-core 16.15.17, shadcn 4.21.0 (base-nova), Base UI, Tailwind CSS v4, next-themes, @opennextjs/cloudflare 1.20.7 on Cloudflare Workers, Vitest + Testing Library (jsdom), msw 3, Playwright, nx 23, pnpm 10.33.0.

**Spec:** `docs/superpowers/specs/2026-09-30-docs-site-design.md`

## Global Constraints

- Vendored files (`registry/bases/base-ui/ui/`, `lib/utils.ts`, `hooks/use-mobile.ts`) change only through the shadcn CLI, and stay as it wrote them.
- Every route is fixed at build (`force-static`, full `generateStaticParams`, `dynamicParams = false`, or `revalidate = false`): the worker's `static-assets-incremental-cache` reads through `ASSETS` and writes nothing, and a Worker has no filesystem at request time.
- The build keeps Turbopack. `--webpack` is not added: the worker preview was measured serving highlighted code with no `No such module "shiki/core"`.
- `fumadocs-ui` is not added. `next` is one catalog entry pinned exactly; every other new package is a plain exact pin in its one declarer.
- The shell composes this registry's own primitives from `@/registry/bases/base-ui/ui/*`, lives in `src/components/<kind>/`, and declares paths once in `src/routes/`.
- `registry.json` and its specs from spec (b) keep holding: a demo added to `examples/` has an `EXPECTED_SLOT` row, and a docs-only demo is in no item.
- Every task is test-first where it changes behaviour: its failing spec and real RED output come before the change. Test output is pristine: zero `not wrapped in act` lines.
- `tsc --noEmit -p tsconfig.json` prints no error lines from Task 3 on.
- Commands run from `apps/registry-ui` unless the step says otherwise; `prettier --check` runs from the repo root. `$S` is a scratch directory outside the repository: `S=$(mktemp -d)` once, before Task 1.
- Commits name their paths (`git commit -q -F "$S/msg-tN.txt" -- <paths>`; new files `git add`ed first), the subject is at most 72 characters, the message comes from a file and ends with `Co-Authored-By:` naming the committing model. Never `--no-verify`, never `HUSKY=0`. The pre-commit hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`. After the commit, `git status --short` and `git diff HEAD` are empty.
- e2e runs never stop a process they did not start: port 3000 may hold someone else's `next dev`; stop only processes whose cwd is in this checkout's worker preview.
- Authored text is plain ASCII; comments name no rule and no skill.

## Review Focus

- `wrangler.jsonc`'s `"keep_names": false` has no case that fails without it, because every route is prerendered; a later route rendered at request time loses the theme script silently if the line goes (Task 6).
- The worker measures 6773 KiB gzipped, over the free plan's 3 MiB: a deploy on the free plan fails until the Shiki grammar copies, `next` or the share-image renderer are cut (Task 10 records it; the deploy spec decides).
- An e2e run interrupted by SIGTERM on the top nx process can end with nx printing `Successfully ran target e2e` and `flaky`; a green nx summary after an interrupt is not a pass (Task 10, Step 2).
- The install lines on the pages were produced by a real `shadcn init -b base -p nova` + `shadcn add` against a locally served registry; `https://ui.zeroxsolutions.com` does not resolve, so no case runs them against the published host (Task 8).
- `@zeroxsolutions/fluent-emoji` changes in Task 5 (`new URL('./assets')`); it is a publishable package, so its next release is a patch that nothing in this plan cuts.

---

### Task 1: Move the registry to base-nova

Spec (c) Part 1. The style moves through the CLI, `shadcn apply --preset nova --yes` (the CLI rejects `base-nova`), with `yes n |` answering every question on standard input. `apply` sets `components.json` `style` to `base-nova` and rewrites 45 of the 63 vendored primitives in `registry/bases/base-ui/ui/`; those stay byte for byte as it wrote them. What it gets wrong is in files that are ours: in `styles.css` it maps `--font-sans` to itself, which CSS resolves to nothing, so the page falls back to the browser's font with no error anywhere; it also imports `tw-animate-css` and `shadcn/tailwind.css` a second time in double quotes, moves `--background` and `--foreground` to the foot of `:root`, and drops the trailing newline. In `src/app/layout.tsx` it loads Geist through `next/font/google`, a network fetch at build time, while `styles.css` still imports Inter. `registry/styles.spec.ts` fails on the cycle, so the next `apply` cannot bring it back silently. The fix restores both files from `HEAD` and makes the two-line font change in `styles.css`: Geist from `@fontsource-variable/geist`, loaded the way Inter was, and Inter removed from the manifest. After it, `shadcn preset resolve` reports `style nova` and `font geist`. `CLAUDE.md`'s delivery line names `base-nova`.

**Files:**

- Create: `apps/registry-ui/registry/styles.spec.ts`
- Modify: `apps/registry-ui/components.json` (by `apply`), `apps/registry-ui/registry/bases/base-ui/ui/*.tsx` (45 files, by `apply`), `apps/registry-ui/registry/bases/base-ui/styles.css`, `apps/registry-ui/package.json` and `pnpm-lock.yaml` (by `pnpm remove` / `pnpm add`), `CLAUDE.md`
- Unchanged in the end: `apps/registry-ui/src/app/layout.tsx` (`apply` writes it; the step restores it)

**Interfaces:**

- Consumes: master `a404e5e` (86 items: 42 `registry:component`, 1 block, 43 `registry:example`; `style: base-vega`; Inter from `@fontsource-variable/inter`). Suite: 79 files, 529 tests.
- Produces:
  - `registry/styles.spec.ts`, module-local: `STYLES` (absolute path of `registry/bases/base-ui/styles.css`), `SELF_MAPPED` (the pattern), `selfMappedProperties(css: string): string[]` - every custom property whose value is `var()` of itself, with or without a fallback, in source order
  - `components.json` `"style": "base-nova"`; the nova primitives (e.g. `button`: default `h-9` to `h-8`, `icon` `size-9` to `size-8`, `icon-sm` `size-8` to `size-7`, `rounded-md` to `rounded-lg`, no `shadow-xs` on `outline`; `input` `h-9 rounded-md shadow-xs` to `h-8 rounded-lg`; `card` spacing 6 to 4, no `shadow-xs`, `CardContent` no longer `flex flex-col gap-3`, `CardFooter` a `border-t bg-muted/50` band; `popover` `p-4 gap-4 rounded-md` to `p-2.5 gap-2.5 rounded-lg`; `item` `rounded-md` to `rounded-lg`; menu items `rounded-sm px-2 py-1.5` to `rounded-md px-1.5 py-1`)
  - `styles.css` `--font-sans: 'Geist Variable', sans-serif;` over `@import '@fontsource-variable/geist';`
  - `@fontsource-variable/geist` `^5.3.0` in `apps/registry-ui` `dependencies` (one declarer, a plain pin); `@fontsource-variable/inter` removed
- Removed: `@fontsource-variable/inter`.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or name a repo-root file.

- [ ] **Step 1: Write the spec**

`apps/registry-ui/registry/styles.spec.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const STYLES = join(resolve(import.meta.dirname, '..'), 'registry/bases/base-ui/styles.css');

const SELF_MAPPED = /(--[\w-]+)\s*:\s*var\(\s*\1\s*[,)]/g;

/** Every custom property whose value reads itself; CSS resolves each to nothing and logs no error. */
function selfMappedProperties(css: string): string[] {
  return [...css.matchAll(SELF_MAPPED)].map(([, property]) => property);
}

describe('styles.css', () => {
  it('maps no custom property to itself', () => {
    expect(selfMappedProperties(readFileSync(STYLES, 'utf8'))).toEqual([]);
  });

  it('reports a custom property mapped to itself, with or without a fallback', () => {
    const css = [
      '@theme inline {',
      '  --font-sans: var(--font-sans);',
      '  --font-heading: var(--font-sans);',
      "  --font-mono: var(--font-mono, 'Geist Mono Variable');",
      '}',
    ].join('\n');

    expect(selfMappedProperties(css)).toEqual(['--font-sans', '--font-mono']);
  });
});
```

Run: `pnpm exec vitest run registry/styles.spec.ts 2>&1 | grep -E '✓|×|Test Files|^ +Tests'`
Expected (master has no cycle, so both pass here; the RED comes from `apply` in Step 3):

```
 ✓ |@zeroxsolutions/registry-ui| registry/styles.spec.ts (2 tests) 2ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

(The second case is the one a broken pattern turns red, measured: narrow `[,)]` to `\)` and it fails with `expected [ '--font-sans' ] to deeply equal [ '--font-sans', '--font-mono' ]`; replace the backreference `\1` with `--[\w-]+` and both cases fail, the first reporting `--font-heading` and 39 more.)

- [ ] **Step 2: Apply the nova preset through the CLI**

Run:

```bash
yes n | pnpm exec shadcn apply --preset nova --yes > "$S/apply-t1.log" 2>&1; echo "exit=$?"
tr '\r' '\n' < "$S/apply-t1.log" | grep -E '^(ℹ|Preset)'
git status --short -- registry/bases/base-ui/ui | wc -l
git status --short -- . ../../pnpm-lock.yaml | grep -v 'registry/bases/base-ui/ui/'
```

Expected:

```
exit=0
ℹ Updated 45 files:
ℹ Skipped 17 files: (files might be identical, use --overwrite to overwrite)
Preset applied successfully.
      45
 M components.json
 M registry/bases/base-ui/styles.css
 M src/app/layout.tsx
?? registry/styles.spec.ts
```

(`--yes` skips the confirmation only; `yes n` answers every other question. The 17 skipped are the primitives nova draws the same as vega, plus `lib/utils.ts` and `hooks/use-mobile.ts`. No manifest and no lockfile changes. `apply` reads the preset from shadcn's registry at run time, so a later upstream change to nova can change the count of 45; the step's check is that `components.json`, `styles.css` and `layout.tsx` are the only files outside `ui/` it touched.)

- [ ] **Step 3: Watch the spec fail on the cycle `apply` wrote**

`apply` wrote this into `registry/bases/base-ui/styles.css` (`git diff registry/bases/base-ui/styles.css`, abridged):

```diff
 @import '@fontsource-variable/inter';
+@import "tw-animate-css";
+@import "shadcn/tailwind.css";
 ...
-  --font-sans: 'Inter Variable', sans-serif;
+  --font-sans: var(--font-sans);
 ...
 :root {
-  --background: oklch(1 0 0);
-  --foreground: oklch(0.145 0 0);
 ...
+  --background: oklch(1 0 0);
+  --foreground: oklch(0.145 0 0);
 }
 ...
-}
+}
\ No newline at end of file
```

and into `src/app/layout.tsx` a `Geist` from `next/font/google` with `variable: '--font-sans'` and `className={cn("font-sans", geist.variable)}` on `<html>`.

Run: `pnpm exec vitest run registry/styles.spec.ts 2>&1 | grep -E '✓|×|AssertionError|Test Files|^ +Tests'`
Expected:

```
     × maps no custom property to itself 4ms
     ✓ reports a custom property mapped to itself, with or without a fallback 0ms
AssertionError: expected [ '--font-sans' ] to deeply equal []
 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
```

- [ ] **Step 4: Replace what `apply` got wrong in our own files; swap Inter for Geist**

Every change `apply` made to `styles.css` is one of the four above, and every change to `layout.tsx` is the `next/font/google` load, so both are restored from `HEAD` and the font change is made by hand:

```bash
git checkout -- src/app/layout.tsx registry/bases/base-ui/styles.css
pnpm remove @fontsource-variable/inter
pnpm add @fontsource-variable/geist
```

In `registry/bases/base-ui/styles.css`:

```diff
 @import 'tailwindcss';
 @import 'tw-animate-css';
 @import 'shadcn/tailwind.css';
-@import '@fontsource-variable/inter';
+@import '@fontsource-variable/geist';

 @custom-variant dark (&:is(.dark *));

 @theme inline {
   --font-heading: var(--font-sans);
-  --font-sans: 'Inter Variable', sans-serif;
+  --font-sans: 'Geist Variable', sans-serif;
```

(`'Geist Variable'` is the family `@fontsource-variable/geist/index.css` declares.) `layout.tsx` gains no font code, and the build fetches nothing.

`git diff package.json ../../pnpm-lock.yaml` shows:

```diff
-    "@fontsource-variable/inter": "^5.2.8",
+    "@fontsource-variable/geist": "^5.3.0",
```

and in the lockfile the importer entry, the `packages` entry and the `snapshots` entry for `@fontsource-variable/inter@5.2.8` replaced by `@fontsource-variable/geist@5.3.0` (6 lines out, 6 in).

In the repo-root `CLAUDE.md`, the delivery bullet:

```diff
-  `base-vega`, base color `neutral`, `lucide` icons, `rsc: false`. The registry publishes
+  `base-nova`, base color `neutral`, `lucide` icons, `rsc: false`. The registry publishes
```

- [ ] **Step 5: Watch the spec pass, and the preset resolve to nova and Geist**

Run:

```bash
pnpm exec vitest run registry/styles.spec.ts 2>&1 | grep -E '✓|×|Test Files|^ +Tests'
pnpm exec shadcn preset resolve 2>&1 | grep -E '^\s+(style|font|baseColor) '
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/styles.spec.ts (2 tests) 2ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
  style        nova
  baseColor    neutral
  font         geist
```

- [ ] **Step 6: Run the suite, the type check, lint, format, the build and the registry build**

Run (from `apps/registry-ui`; prettier from the repo root, where `.prettierignore` lives):

```bash
pnpm exec vitest run > "$S/vt-t1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t1.log"; grep -c 'not wrapped in act' "$S/vt-t1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t1.log" 2>&1; grep 'error TS' "$S/tsc-t1.log" | cut -c1-80
pnpm exec eslint registry/styles.spec.ts 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
(cd ../.. && pnpm exec prettier --check apps/registry-ui/registry/styles.spec.ts apps/registry-ui/registry/bases/base-ui/styles.css apps/registry-ui/components.json 2>&1 | tail -1)
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:build > "$S/build-t1.log" 2>&1; echo "build exit=$?")
grep -l 'Geist Variable' .next/static/chunks/*.css | wc -l; cat .next/static/chunks/*.css | grep -c 'Inter Variable'
rm -rf "$S/r-t1"; pnpm exec shadcn build -o "$S/r-t1" > "$S/sb-t1.log" 2>&1; tail -1 "$S/sb-t1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  80 passed (80)
      Tests  531 passed (531)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
build exit=0
       1
0
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(eslint prints no problem line. 529 + the 2 new cases = 531, 79 + 1 = 80 files: the 45 rewritten primitives turn no existing spec red. `package.json` and `CLAUDE.md` are on `.prettierignore`; the vendored `ui/` directory is too. `tsc` prints the same one baseline line as master. `registry.json` is untouched: `registry.spec.ts` rule 4 compares its `cssVars` with `styles.css`, and no `success`/`warning` value moved.)

- [ ] **Step 7: Commit**

`$S/msg-t1.txt`:

```
feat(registry-ui): move the registry to base-nova and load Geist

Why: the docs site shows the registry on base-nova, as upstream's
does. shadcn apply --preset nova rewrote 45 vendored primitives, kept
as written, but mapped --font-sans to itself, which CSS resolves to
nothing, and loaded Geist from next/font/google while styles.css still
imported Inter. Geist now loads from @fontsource-variable/geist the way
Inter did, and styles.spec.ts fails on any self-mapped property.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
git add apps/registry-ui/registry/styles.spec.ts
git commit -q -F "$S/msg-t1.txt" -- apps/registry-ui/registry apps/registry-ui/components.json apps/registry-ui/package.json pnpm-lock.yaml CLAUDE.md
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above; `git status --short` prints nothing (`src/app/layout.tsx` was restored in Step 4, so it is not in the commit).

### Task 2: Read the composed components against nova's primitives

Spec (c) Part 1, last paragraph. Task 1 moved the 45 vendored primitives to nova; the 42 composed components and the block were written against vega, and a class one of them hand-writes can restate a value vega's primitive used and nova's does not. A class counts only where the element plays a named primitive part, or is passed to one: it restates that part's recipe, and nova's recipe is now the truth. A hand-written surface that plays no primitive part keeps its own value; upstream's own nova examples keep `rounded-md border` on exactly such surfaces (`apps/v4/examples/base/data-table-demo.tsx:261`, `collapsible-demo.tsx:31`, read 2026-09-30). The read found two classes, both in `components/layout/model-list.tsx`. No new test: a class is not behaviour, and no spec asserts one; the gate and the before/after grep are the evidence.

**Files:**

- Modify: `apps/registry-ui/registry/bases/base-ui/components/layout/model-list.tsx`

**Interfaces:**

- Consumes: the Task 1 tree (`style: base-nova`; `ui/button.tsx` `icon-sm` is `size-7`, was `size-8`; `ui/item.tsx` root is `rounded-lg`, was `rounded-md`, and `size="sm"` is `gap-2.5 px-3 py-2.5` in both). Suite: 80 files, 531 tests.
- Produces: no new export; `ModelListItemRemove` renders at the `icon-sm` recipe's own size, and each `ModelListSkeleton` row has the radius of the `Item size="sm"` row it stands in for.
- Removed: nothing.

The two changes:

| File                                   | Element                                                                  | Class                        | vega                                                                                  | nova                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `components/layout/model-list.tsx:88`  | `ModelListItemRemove`, a `Button size="icon-sm"`                         | `size-7` removed             | the recipe drew `size-8` and this class shrank it to `size-7` from outside the recipe | the recipe draws `size-7`; the class restates it, so it goes and the recipe sizes the button |
| `components/layout/model-list.tsx:109` | `model-list-skeleton-item`, the placeholder for one `Item size="sm"` row | `rounded-md` to `rounded-lg` | `Item` root `rounded-md`                                                              | `Item` root `rounded-lg`                                                                     |

What the read kept, each a hand-written value that plays no primitive part, or a part nova draws as vega did:

| File:line                                                                                                | Class                           | Kept because                                                                                         |
| -------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `data-display/data-table.tsx:66`                                                                         | `rounded-md border`             | the table's own frame; upstream's nova data-table demo writes the same                               |
| `layout/collapsible-card.tsx:20`, `:21`                                                                  | `rounded-md`                    | a collapsible panel; upstream's nova collapsible demo writes `rounded-md border`                     |
| `layout/tool-call-card.tsx:42`, `data-display/image-preview.tsx:20`, `data-display/markdown-view.tsx:41` | `rounded-md`                    | own surfaces (a muted card, an image frame, prose images)                                            |
| `layout/file-tree.tsx:323`                                                                               | `h-7 rounded-md`                | the row mirrors `SidebarMenuButton size="sm"` (`h-7`, `rounded-md`), which nova left as vega drew it |
| `layout/panel-header.tsx:22`                                                                             | `h-9`                           | a header row's height, not a control's                                                               |
| `layout/avatar-picker.tsx:281`                                                                           | `size-9 rounded-full`           | colour swatches in a 6-column grid, not buttons                                                      |
| `layout/avatar-picker.tsx:292`                                                                           | `h-8 rounded-md`                | a native colour input; no primitive draws one                                                        |
| `layout/floating-toolbar.tsx:19`, `general/icon-chip.tsx:22`                                             | `rounded-sm`                    | own surfaces; no primitive part                                                                      |
| `data-display/data-table.tsx:141`                                                                        | `-ml-2.5` on `Button size="sm"` | aligns the header text with the cell; nova `sm` keeps `px-2.5`                                       |

(Also read and unchanged: every `className` passed to a primitive in the 43 files - `TabsTrigger px-0`, `Badge gap-1 pr-1`, `TabsContent p-0`/`p-3` inside a `p-0` `PopoverContent`, the `size-(--emoji-picker-cell)` override on `Button size="icon"`, `CardFooter mt-auto` - and the cross-check of every class string against the tokens nova removed from each primitive the file imports. No composed component uses `CardContent`, whose `flex flex-col gap-3` nova dropped.)

All paths below are relative to `apps/registry-ui/` unless they start with `apps/`.

- [ ] **Step 1: Record the grep before the change**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
G() { grep -rnE "(^|[\"' ])(h-9|size-9|h-10|size-10|min-h-9|shadow-xs|rounded-sm|rounded-md)([\"' ]|$)" components blocks --include='*.tsx' | grep -v '\.spec\.tsx' | grep -v '^components/docs/' | cut -d: -f1,2; }
G; G | wc -l
grep -rn 'size-7' components blocks --include='*.tsx' | grep -v '\.spec\.tsx'
```

Expected:

```
components/general/icon-chip.tsx:22
components/layout/file-tree.tsx:323
components/layout/model-list.tsx:109
components/layout/avatar-picker.tsx:281
components/layout/avatar-picker.tsx:292
components/layout/floating-toolbar.tsx:19
components/layout/collapsible-card.tsx:20
components/layout/collapsible-card.tsx:21
components/layout/tool-call-card.tsx:42
components/layout/panel-header.tsx:22
components/data-display/image-preview.tsx:20
components/data-display/data-table.tsx:66
      12
components/layout/model-list.tsx:88:      className={cn('text-muted-foreground hover:text-destructive size-7', className)}
```

(Every line but `model-list.tsx:109` is a row of the kept table above.)

- [ ] **Step 2: Change the two classes**

In `apps/registry-ui/registry/bases/base-ui/components/layout/model-list.tsx`:

```diff
       aria-label="Remove model"
       variant="ghost"
       size="icon-sm"
-      className={cn('text-muted-foreground hover:text-destructive size-7', className)}
+      className={cn('text-muted-foreground hover:text-destructive', className)}
       {...props}
     >
```

```diff
       {Array.from({ length: count }, (_, index) => (
-        <div key={index} data-slot="model-list-skeleton-item" className="flex items-center gap-3 rounded-md p-2.5">
+        <div key={index} data-slot="model-list-skeleton-item" className="flex items-center gap-3 rounded-lg p-2.5">
           <Skeleton className="size-8 shrink-0 rounded-lg" />
```

- [ ] **Step 3: The grep after**

Run (from `apps/registry-ui/registry/bases/base-ui`, with `G` from Step 1):

```bash
G | wc -l; G | grep -c model-list
grep -rn 'size-7' components blocks --include='*.tsx' | grep -v '\.spec\.tsx' | wc -l
```

Expected:

```
      11
0
       0
```

- [ ] **Step 4: Run the specs, the suite, the type check, lint, format and the registry build**

Run (from `apps/registry-ui`; prettier from the repo root):

```bash
L=registry/bases/base-ui/components/layout
pnpm exec vitest run $L/model-list.spec.tsx registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '✓ \||×|Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t2.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t2.log"; grep -c 'not wrapped in act' "$S/vt-t2.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t2.log" 2>&1; grep 'error TS' "$S/tsc-t2.log" | cut -c1-80
pnpm exec eslint $L/model-list.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
(cd ../.. && pnpm exec prettier --check apps/registry-ui/$L/model-list.tsx 2>&1 | tail -1)
rm -rf "$S/r-t2"; pnpm exec shadcn build -o "$S/r-t2" > "$S/sb-t2.log" 2>&1; tail -1 "$S/sb-t2.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/components/layout/model-list.spec.tsx (8 tests) 65ms
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (64 tests) 337ms
 Test Files  2 passed (2)
      Tests  72 passed (72)
 Test Files  80 passed (80)
      Tests  531 passed (531)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(eslint prints no problem line. Counts equal Task 1's: no case added or removed. `registry.json` is untouched; `shadcn build` copies the changed file into `model-list`'s item.)

- [ ] **Step 5: Commit**

`$S/msg-t2.txt`:

```
fix(registry-ui): size model-list parts by nova's recipes

Why: two classes in model-list restated vega. The remove button
shrank icon-sm from vega's size-8 to size-7, which nova's recipe now
draws itself, and the skeleton row kept vega's Item radius, rounded-md,
where nova's Item is rounded-lg. The other 41 components and the block
hand-write no value a nova primitive dropped.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
git commit -q -F "$S/msg-t2.txt" -- apps/registry-ui/registry/bases/base-ui/components/layout/model-list.tsx
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above; `git status --short` prints nothing.

### Task 3: Upgrade Next to 16.3.7 and the adapter to 1.20.7

The content pipeline needs a newer Next than the app pins. `fumadocs-mdx` 15.4.5 gives Turbopack a rule with `condition: { query }`, and Next accepts that key only from 16.2.0. The app pins `next ~16.1.6`, which resolves to 16.1.7. `@opennextjs/cloudflare` 1.20.7, the adapter's latest release, peers `next ">=15.5.26 <16 || >=16.3.6"`. Its changelog gives the reason: Next 16.2.0 through 16.3.5 carry CVE-2026-94545, a `next/og` remote code execution. 1.20.7 also patches `loadCustomCacheHandlers` for Next 16.3; without that patch every worker request on 16.3.x returns 500. So this task moves `next` to 16.3.7 (npm `latest`, read 2026-09-30) and the adapter to 1.20.7, and changes only what the two force. `next` has two declarers, the repo root (the nx workspace generator wrote that entry) and this app, so the version becomes one catalog entry that both take. nx 23 reads a `catalog:` reference back.

The upgrade forces three changes to the app:

- Next 16.3 type-checks with the TypeScript CLI by default (`experimental.useTypeScriptCli: true` in `dist/server/config-shared.js`). The check now covers the whole `tsconfig.json` project, spec files included. Up to 16.2, `runTypeCheck` dropped every diagnostic in a `*.spec.*` file. The one line `tsc` has always printed (`installation.spec.tsx` TS6307, `registry.json` is not listed in the project) now fails `next build`, so `tsconfig.json` lists `registry.json`.
- Next 16.3's `types/global.d.ts` declares `import.meta.glob` for Turbopack, and that declaration takes no type argument. Vite's declaration does take one. Next's wins in this program, so `examples.spec.tsx`'s `import.meta.glob<...>(...)` is TS2558. The spec now asserts the module shape with a cast instead. That is the same unchecked claim the type argument made.
- When a coding agent runs `next dev` on 16.3, Next writes an `AGENTS.md` and a `CLAUDE.md` (`@AGENTS.md`) into the app (`dist/server/lib/generate-agent-files.js`). It happened on this task's first e2e run. `agentRules: false` turns that off, and the repo keeps one `CLAUDE.md`.

`next build` also adds one line to `next-env.d.ts`. Next writes that file, so it is committed as written.

Left as they are: `wrangler` resolves to 4.142.0, which already meets the adapter's `^4.125.0` peer, so the catalog range is untouched. `eslint-config-next` and `@next/eslint-plugin-next` resolve to 16.2.10 through the root's `^16.1.6`. Neither peers on `next`, and nx wrote both, so neither is forced to move.

**Files:**

- Modify: `pnpm-workspace.yaml`, `package.json`, `apps/registry-ui/package.json`, `pnpm-lock.yaml` (by `pnpm add`), `apps/registry-ui/tsconfig.json`, `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, `apps/registry-ui/next.config.mjs`, `apps/registry-ui/next-env.d.ts` (written by `next build`)

**Interfaces:**

- Consumes: the Task 2 tree. Suite 80 files, 531 tests. `tsc` prints the one TS6307 line. `pnpm install` warns `✕ unmet peer next@">=15.5.24 <16 || >=16.3.3": found 16.1.7` for the adapter.
- Produces:
  - catalog entry `next: "16.3.7"`, which the root and `@zeroxsolutions/registry-ui` take as `catalog:`
  - `@opennextjs/cloudflare` pinned at `1.20.7` (it pulls `@opennextjs/aws` 4.1.6)
  - `tsc --noEmit -p tsconfig.json` prints no error line (the TS6307 baseline is gone), and `next build` runs that same check
  - `next.config.mjs`: `agentRules: false`
- Removed: nothing.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or name a repo-root file. Expected output is shown without the terminal control codes (colour, cursor), which nx and Next write into the logs.

- [ ] **Step 1: Move `next` to the catalog at 16.3.7, and the adapter to 1.20.7**

Run: `pnpm add --save-catalog next@16.3.7`

`pnpm` writes the entry as `next: ~16.3.7`, at the foot of the catalog. It keeps the range operator of the old specifier, even with `--save-exact`. Catalog entries pin exact versions, so edit the entry by hand in `pnpm-workspace.yaml`:

```diff
 catalog:
   "wrangler": "^4.105.0"
   "lucide-react": "^1.21.0"
+  "next": "16.3.7"
```

Run (from the repo root): `pnpm add -w next@catalog:`

Run: `pnpm add --save-exact @opennextjs/cloudflare@1.20.7 2>&1 | grep -c 'unmet peer'`
Expected: `0`

Run (from the repo root):

```bash
git diff package.json apps/registry-ui/package.json pnpm-workspace.yaml | grep '^[-+] '
grep -c 'next@16.1.7' pnpm-lock.yaml
pnpm install --frozen-lockfile 2>&1 | grep -E 'Lockfile|peer'
pnpm exec nx reset > /dev/null
```

Expected:

```
-    "@opennextjs/cloudflare": "1.20.6",
+    "@opennextjs/cloudflare": "1.20.7",
-    "next": "~16.1.6",
+    "next": "catalog:",
+  "next": "16.3.7"
-    "next": "~16.1.6",
+    "next": "catalog:",
0
Lockfile is up to date, resolution step is skipped
```

(`nx reset` stops the daemon. Otherwise the daemon started before the install keeps the old store path, and the next nx command fails with `Failed to load 1 Nx plugin(s): - @nx/next/plugin: Cannot find module '@nx/next/plugin'`. That was measured, and `node -e "require('@nx/next/plugin')"` loads fine at the same moment.)

- [ ] **Step 2: Watch the build fail on the type check**

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui:build --skip-nx-cache 2>&1 | grep -E '▲ Next.js|Running TypeScript|error TS|Failed to type' | sed "s|$PWD|<repo>|g"`
Expected:

```
▲ Next.js 16.3.7 (Turbopack)
  Running TypeScript ...
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307: File '<repo>/apps/registry-ui/registry.json' is not listed within the file list of project '<repo>/apps/registry-ui/tsconfig.json'. Projects must list all files or use an 'include' pattern.
registry/bases/base-ui/examples/examples.spec.tsx(37,34): error TS2558: Expected 0 type arguments, but got 1.
Failed to type check.
```

Run: `pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep 'error TS' | cut -c1-90`
Expected (the same two lines. By hand, `tsc` now also reports the TS2558 that Next's types cause):

```
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307: File '
registry/bases/base-ui/examples/examples.spec.tsx(37,34): error TS2558: Expected 0 type a
```

- [ ] **Step 3: List `registry.json`, assert the glob's module shape, and turn off the agent files**

In `apps/registry-ui/tsconfig.json`, `include`:

```diff
     "registry/**/*.ts",
     "registry/**/*.tsx",
+    "registry.json",
     "../../apps/registry-ui/.next/types/**/*.ts",
```

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`:

```diff
-const MODULES = import.meta.glob<Record<string, ComponentType>>(['./*.tsx', '!./*.spec.tsx'], { eager: true });
+/** What one example file exports, by export name. */
+type ExampleModule = Record<string, ComponentType>;
+
+// Next's global types declare `import.meta.glob` without Vite's module type parameter, and theirs is
+// the declaration that wins, so the module shape is asserted here instead.
+const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx'], { eager: true }) as Record<string, ExampleModule>;
```

In `apps/registry-ui/next.config.mjs`:

```diff
   output: 'standalone',
+  // Unset, `next dev` run by a coding agent writes an AGENTS.md and a CLAUDE.md into this app,
+  // beside the repo's own CLAUDE.md, and re-creates them whenever they are deleted.
+  agentRules: false,
 };
```

Run: `pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -c 'error TS'`
Expected: `0`

- [ ] **Step 4: Watch the build and the worker build pass, and the worker serve**

Run (from the repo root):

```bash
pnpm exec nx run @zeroxsolutions/registry-ui:build --skip-nx-cache 2>&1 | grep -E '▲ Next.js|TypeScript|^[┌├└]|Successfully ran'
git diff --stat apps/registry-ui/next-env.d.ts | head -1
pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:build --skip-nx-cache 2>&1 | grep -E 'ERROR|Failed|Worker saved|Successfully ran'
```

Expected:

```
▲ Next.js 16.3.7 (Turbopack)
  Running TypeScript ...
  Finished TypeScript in 1560ms ...
┌ ○ /
├ ○ /_not-found
└ ƒ /api/hello
 NX   Successfully ran target build for project @zeroxsolutions/registry-ui and 4 tasks it depends on
 apps/registry-ui/next-env.d.ts | 1 +
Worker saved in `.open-next/worker.js` 🚀
 NX   Successfully ran target wrangler:build for project @zeroxsolutions/registry-ui and 4 tasks it depends on
```

(The `next-env.d.ts` line is `import "./.next/types/root-params.d.ts";`. `next build` writes it. The adapter prints no `ERROR` line.)

Run:

```bash
(pnpm exec opennextjs-cloudflare preview --env development > "$S/prev-t3.log" 2>&1 &)
until curl -sf -o /dev/null http://localhost:8787/; do sleep 2; done
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8787/
curl -s -w ' %{http_code}\n' http://localhost:8787/api/hello
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8787/nope
pkill -INT -f 'opennextjs-cloudflare preview'
```

Expected:

```
200
Hello, from API! 200
404
```

(`/api/hello` is the one route rendered at request time, so it goes through the `loadCustomCacheHandlers` patch that 1.20.7 fixed for 16.3. On 1.20.6, the adapter's changelog says every such request returns 500. SIGINT stops the preview process but can leave `workerd` listening on 8787. Check with `lsof -nP -iTCP:8787 -sTCP:LISTEN` and stop that PID. Task 4's e2e setup handles this for the suite.)

- [ ] **Step 5: Run the suite, lint, format, the registry build and the existing e2e suite**

Run (from `apps/registry-ui`; prettier and nx from the repo root):

```bash
pnpm exec vitest run > "$S/vt-t3.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t3.log"; grep -c 'not wrapped in act' "$S/vt-t3.log"
pnpm exec eslint next.config.mjs registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
(cd ../.. && pnpm exec prettier --check apps/registry-ui/next.config.mjs apps/registry-ui/tsconfig.json apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx apps/registry-ui/package.json package.json pnpm-workspace.yaml 2>&1 | tail -1)
rm -rf "$S/r-t3"; pnpm exec shadcn build -o "$S/r-t3" > "$S/sb-t3.log" 2>&1; tail -1 "$S/sb-t3.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache > "$S/e2e-t3.log" 2>&1; grep -E ' passed| failed|Successfully ran' "$S/e2e-t3.log")
ls AGENTS.md CLAUDE.md 2>&1 | grep -c 'No such file'
```

Expected:

```
 Test Files  80 passed (80)
      Tests  531 passed (531)
0
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 86 items.
  3 passed (3.1s)
 NX   Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 1 task it depends on
2
```

(eslint prints no problem line. The suite's counts are unchanged, because the task adds no case: the build's type check is the test that failed and now passes. The e2e suite still runs `example.spec.ts` on `next dev`, one test in three browsers, and after it no `AGENTS.md` or `CLAUDE.md` exists in the app. If another checkout's `next dev` already holds port 3000, the inferred `dev` task moves to 3001, and `reuseExistingServer` tests the other checkout. In that case run with `BASE_URL=http://localhost:3001`. When `next dev` stops, it prints one `Fatal uncaught kj::Exception ... SQLITE_BUSY` from the miniflare that `initOpenNextCloudflareForDev` starts, and the target still succeeds. Task 4 moves the suite off `next dev`.)

- [ ] **Step 6: Commit**

`$S/msg-t3.txt`:

```
build(registry-ui): upgrade next to 16.3.7 and the adapter to 1.20.7

Why: fumadocs-mdx 15.4 needs a Turbopack rule key Next accepts from
16.2, and @opennextjs/cloudflare 1.20.7 peers next >=16.3.6, below
which next/og carries CVE-2026-94545. next moves to the catalog, as
the root and the app both declare it. Next 16.3 type-checks the whole
project with tsc, specs included, so registry.json is listed and the
examples spec asserts its glob's module shape, since Next's
import.meta.glob takes no type argument. agentRules is off so next
dev writes no AGENTS.md or CLAUDE.md into the app.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
A=apps/registry-ui
git commit -q -F "$S/msg-t3.txt" -- pnpm-workspace.yaml package.json pnpm-lock.yaml $A/package.json $A/tsconfig.json $A/next.config.mjs $A/next-env.d.ts $A/registry/bases/base-ui/examples/examples.spec.tsx
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects and 1 task they depend on`. The log shows the subject above, and `git status --short` prints nothing.

### Task 4: Content pipeline, the worker preview target, and the e2e suite on it

Spec (c) Part 2, "Packages" and "Content pipeline", and the Tests section's `wrangler:dev`. `content/docs` becomes MDX read by `fumadocs-mdx` and `fumadocs-core`: `source.config.ts` declares the collection, the `fumadocs-mdx` CLI writes `.source/` (gitignored already), `src/lib/source.ts` is the `loader()` over it, and `/docs/[[...slug]]` renders a page's compiled body, fixed at build. A new target, `fumadocs-generate`, runs the CLI; `build`, `wrangler:build` and `test` depend on it, and `tsc` needs it too, because `src/lib/source.ts` imports `collections/server`, which exists only once `.source/` does. `src/lib/source.spec.ts` starts with rule 4: every page is reached from some `meta.json`.

The pins are the spec's: `fumadocs-mdx` 15.4.5 and `fumadocs-core` 16.15.17. 15.4.5's peer is `fumadocs-core ^16.15.3`. From 15.0.13 on, `createMDX()` gives Turbopack a rule with `condition: { query }` for `*.json` and `*.yaml`. Next's config schema accepts that key from 16.2.0, and Task 3 moved the app to 16.3.7. On 16.1.7, the same `createMDX()` panics with `Unrecognized key(s) in object: 'query' at "turbopack.rules.*.json.condition"`, then `TurbopackInternalError: failed to parse next.config.js`. That was measured before the upgrade. The add prints no peer warning.

The e2e project moves from `next dev` to the worker: a `wrangler:dev` target runs the adapter's preview, depends on `wrangler:build` and is continuous, and the Playwright `webServer` starts it. Two things break silently with that switch, and the task fixes both. `@nx/playwright/plugin` infers the e2e target's `dependsOn` from the `webServer` command and splits `registry-ui:wrangler:dev` at the first colon, so it becomes a dependency on a target named `wrangler`, which does not exist, and nothing builds before the suite; the e2e project now declares `dependsOn` on `wrangler:build` itself. And Playwright stops a `webServer` with SIGKILL by default, which kills nx but not the worker nx started: after a green run, `wrangler dev` and two `workerd` processes were still up and holding port 8787 (measured again on Next 16.3.7), and with `reuseExistingServer` the next run would have tested that old worker. `gracefulShutdown` with SIGINT lets nx stop its children.

Shiki on Workers, measured here as the spec asks: with the Turbopack build, the worker preview answers `/docs` 200 with the fenced block highlighted (`class="shiki shiki-themes github-light github-dark"`), and the preview log has no `No such module "shiki/core"`. The page is prerendered, so highlighting ran at build and the worker only serves the result. `--webpack` is not added.

**Files:**

- Create: `apps/registry-ui/source.config.ts`, `apps/registry-ui/content/docs/meta.json`, `apps/registry-ui/content/docs/index.mdx`, `apps/registry-ui/src/lib/source.ts`, `apps/registry-ui/src/lib/source.spec.ts`, `apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx`, `apps/registry-ui-e2e/src/docs.spec.ts`
- Modify: `apps/registry-ui/package.json` and `pnpm-lock.yaml` (by `pnpm add`, then the `nx` targets by hand), `apps/registry-ui/next.config.mjs`, `apps/registry-ui/tsconfig.json`, `apps/registry-ui/eslint.config.mjs`, `.prettierignore`, `apps/registry-ui-e2e/playwright.config.mts`, `apps/registry-ui-e2e/package.json`

**Interfaces:**

- Consumes: the Task 3 tree (Next 16.3.7, `@opennextjs/cloudflare` 1.20.7, suite 80 files, 531 tests, `tsc` prints no error line). `.gitignore` already lists `.source`.
- Produces:
  - `src/lib/source.ts`: `source`, the `loader()` output (`getPage`, `getPages`, `generateParams`, `pageTree`), base URL `/docs`
  - `source.config.ts`: `docs` (the `content/docs` collection, `postprocess.includeProcessedMarkdown: true`) and the default config (`rehypeCodeOptions.themes` `github-light` / `github-dark`)
  - `tsconfig.json` path `collections/*` -> `./.source/*`
  - targets on `@zeroxsolutions/registry-ui`: `fumadocs-generate` (runs `fumadocs-mdx`, output `.source`, cached); `wrangler:dev` (`opennextjs-cloudflare preview --env development`, depends on `wrangler:build`, continuous); `fumadocs-generate` added to `dependsOn` of `build`, `wrangler:build` and `test`
  - `@zeroxsolutions/registry-ui-e2e:e2e` depends on `@zeroxsolutions/registry-ui:wrangler:build`, `parallelism: false`; the suite runs against `http://localhost:8787`
  - `src/lib/source.spec.ts`, module-local: `DocsTree`, `readDocsTree(root)`, `unreachedPages(tree): string[]`
  - route `/docs/[[...slug]]`: `force-static`, `dynamicParams = false`, `revalidate = false`, `generateStaticParams` from `source`
- Removed: nothing.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or name a repo-root file. Expected output is shown without the terminal control codes (colour, cursor), which nx and Playwright write into the logs.

- [ ] **Step 1: Write the spec for rule 4**

`apps/registry-ui/src/lib/source.spec.ts`:

```ts
// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const CONTENT = join(resolve(import.meta.dirname, '../..'), 'content/docs');

/** The content tree: every page's slug (`components/button`), and each folder's `meta.json` pages by folder (`''` is the root). */
interface DocsTree {
  pages: string[];
  metas: Record<string, string[]>;
}

/** A `pages` entry that takes every page of its folder not listed before it. */
const REST = /^(\.\.\.|z\.\.\.a)$/;

/** A `pages` entry linking into the docs, `[Label](/docs/<slug>)`; the slug is captured. */
const DOCS_LINK = /^\[[^\]]*\]\(\/docs\/?([^)#]*)\)$/;

function readDocsTree(root: string): DocsTree {
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' });
  const pages = files.filter((file) => file.endsWith('.mdx')).map((file) => file.slice(0, -'.mdx'.length));
  const metas = Object.fromEntries(
    files
      .filter((file) => file === 'meta.json' || file.endsWith('/meta.json'))
      .map((file) => [
        file.slice(0, -'meta.json'.length).replace(/\/$/, ''),
        (JSON.parse(readFileSync(join(root, file), 'utf8')) as { pages?: string[] }).pages ?? [],
      ]),
  );
  return { pages: pages.sort(), metas };
}

/** Every page no `meta.json` reaches: neither listed down a chain of folders from the root, nor linked from any entry. */
function unreachedPages({ pages, metas }: DocsTree): string[] {
  const listed = (folder: string, name: string): boolean =>
    (metas[folder] ?? []).some((entry) => entry === name || REST.test(entry));
  const linked = new Set(
    Object.values(metas)
      .flat()
      .flatMap((entry) => {
        const slug = DOCS_LINK.exec(entry)?.[1]?.replace(/\/$/, '');
        if (slug === undefined) return [];
        return slug === '' ? ['index'] : [slug, `${slug}/index`];
      }),
  );

  return pages.filter((page) => {
    const parts = page.split('/');
    const reached = parts.every((name, depth) => listed(parts.slice(0, depth).join('/'), name));
    return !reached && !linked.has(page);
  });
}

describe('content/docs', () => {
  it('reaches every page from a meta.json', () => {
    expect(unreachedPages(readDocsTree(CONTENT))).toEqual([]);
  });

  it('reports a page no meta.json lists or links', () => {
    const tree: DocsTree = {
      pages: ['blocks/ai-provider-picker', 'blocks/chat', 'components/button', 'index', 'installation'],
      metas: {
        '': ['index', 'components', '[AI Provider Picker](/docs/blocks/ai-provider-picker)'],
        components: ['...'],
      },
    };

    expect(unreachedPages(tree)).toEqual(['blocks/chat', 'installation']);
  });
});
```

Run: `pnpm exec vitest run src/lib/source.spec.ts 2>&1 | grep -E '✓|×|Test Files|^ +Tests|Error'`
Expected:

```
     × reaches every page from a meta.json 2ms
     ✓ reports a page no meta.json lists or links 1ms
Error: ENOENT: no such file or directory, scandir '<repo>/apps/registry-ui/content/docs'
 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
```

(The second case is the one a broken rule turns red, measured: drop `&& !linked.has(page)` and it fails with `expected [ 'blocks/ai-provider-picker', …(2) ] to deeply equal [ 'blocks/chat', 'installation' ]`; drop `|| REST.test(entry)` and it fails with `expected [ 'blocks/chat', …(2) ] to deeply equal [ 'blocks/chat', 'installation' ]`.)

- [ ] **Step 2: Add the two packages**

Run: `pnpm add --save-exact fumadocs-mdx@15.4.5 fumadocs-core@16.15.17 2>&1 | grep -c 'unmet peer'`
Expected: `0`

Run: `git diff package.json | grep '^[-+] '`
Expected:

```
+    "fumadocs-core": "16.15.17",
+    "fumadocs-mdx": "15.4.5",
```

(Each has one declarer, so each is an exact pin in this app's `dependencies`, no catalog entry. `fumadocs-ui` is not added.)

- [ ] **Step 3: The collection, the content, the loader and the MDX plugin**

`apps/registry-ui/source.config.ts`:

```ts
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: { postprocess: { includeProcessedMarkdown: true } },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
```

`apps/registry-ui/content/docs/meta.json`:

```json
{
  "root": true,
  "pages": ["index"]
}
```

`apps/registry-ui/content/docs/index.mdx`:

````mdx
---
title: Introduction
description: Composed Base UI components and blocks, published as a shadcn registry.
---

This registry publishes composed items: components, blocks and the demos that show them. Each one is
built from shadcn's own primitives, which a consuming app installs from shadcn's registry rather
than from this one.

```bash
npx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json
```
````

`apps/registry-ui/src/lib/source.ts`:

```ts
import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
```

In `apps/registry-ui/tsconfig.json` (the `include` entries are needed because the base config is `composite`: without them `tsc` reports `TS6307 ... .source/server.ts is not listed within the file list of project`):

```diff
     "paths": {
       "@/*": ["./src/*"],
-      "@/registry/*": ["./registry/*"]
+      "@/registry/*": ["./registry/*"],
+      "collections/*": ["./.source/*"]
     },
```

```diff
     "registry/**/*.tsx",
     "registry.json",
+    "source.config.ts",
+    ".source/**/*.ts",
     "../../apps/registry-ui/.next/types/**/*.ts",
```

In `apps/registry-ui/next.config.mjs`:

```diff
 import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
+import { createMDX } from 'fumadocs-mdx/next';
 import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';
```

```diff
   output: 'standalone',
 };

+const withMDX = createMDX();
+
 /**
```

```diff
   if (phase === PHASE_DEVELOPMENT_SERVER) await initOpenNextCloudflareForDev();
-  return nextConfig;
+  return withMDX(nextConfig);
 }
```

The generated `.source/` must be neither linted nor formatted. In `apps/registry-ui/eslint.config.mjs`:

```diff
-    ignores: ['.next/**/*', '**/out-tsc'],
+    ignores: ['.next/**/*', '.source/**/*', '**/out-tsc'],
```

In `.prettierignore` (repo root), in the block that mirrors `.gitignore`:

```diff
 .next
 .open-next
+.source
 .wrangler
```

Run: `pnpm exec fumadocs-mdx && ls .source && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep 'error TS'`
Expected:

```
[MDX] generated files in <n>ms
browser.ts
dynamic.ts
server.ts
source.config.mjs
```

(`tsc` prints no error line after the list.)

- [ ] **Step 4: Watch rule 4 pass**

Run: `pnpm exec vitest run src/lib/source.spec.ts 2>&1 | grep -E '✓|×|Test Files|^ +Tests'`
Expected:

```
 ✓ |@zeroxsolutions/registry-ui| src/lib/source.spec.ts (2 tests) 2ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

- [ ] **Step 5: The targets, the e2e switch, and the failing e2e case**

In `apps/registry-ui/package.json`, `nx.targets` (the file is prettier-ignored, so this is its final shape). Add `test` at the head of `targets`, and add `fumadocs-generate` to the two existing `dependsOn`:

```json
      "test": {
        "dependsOn": [
          "^build",
          "fumadocs-generate"
        ]
      },
      "build": {
        "dependsOn": [
          "^build",
          "shadcn-build",
          "fumadocs-generate"
        ]
      },
```

```diff
       "wrangler:build": {
         "executor": "nx:run-commands",
         "dependsOn": [
           "^build",
-          "shadcn-build"
+          "shadcn-build",
+          "fumadocs-generate"
         ],
```

After `wrangler:build`, before `wrangler:typegen`:

```json
      "wrangler:dev": {
        "executor": "nx:run-commands",
        "dependsOn": [
          "wrangler:build"
        ],
        "continuous": true,
        "options": {
          "cwd": "{projectRoot}",
          "command": "opennextjs-cloudflare preview --env development"
        }
      },
```

After `shadcn-build`, last:

```json
      "fumadocs-generate": {
        "executor": "nx:run-commands",
        "outputs": [
          "{projectRoot}/.source"
        ],
        "cache": true,
        "options": {
          "cwd": "{projectRoot}",
          "command": "fumadocs-mdx"
        }
      }
```

(`next build` also writes `.source/` itself, through `createMDX()`; the edge on `build` and `wrangler:build` puts the generation in the graph where `tsc` and the specs can rely on it rather than on a build having run. The app has no `typecheck` target, so `tsc` runs by hand after this target in the gate.)

In `apps/registry-ui-e2e/playwright.config.mts`:

```diff
-const baseURL = process.env['BASE_URL'] || 'http://localhost:3000';
+const baseURL = process.env['BASE_URL'] || 'http://localhost:8787';
```

```diff
-  /* Run your local dev server before starting the tests */
+  /* Run the worker the adapter builds before starting the tests */
   webServer: {
-    command: 'pnpm exec nx run @zeroxsolutions/registry-ui:dev',
-    url: 'http://localhost:3000',
+    command: 'pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:dev',
+    url: 'http://localhost:8787',
     reuseExistingServer: true,
     cwd: workspaceRoot,
+    // Starting includes the worker build; the 60s default is timed for a server that only boots.
+    timeout: 300_000,
+    // Unset, Playwright SIGKILLs nx and the worker nx started keeps port 8787, so the next run's
+    // reuseExistingServer tests that stale worker instead of the one it just built.
+    gracefulShutdown: { signal: 'SIGINT', timeout: 10_000 },
   },
```

`apps/registry-ui-e2e/package.json`, whole file:

```json
{
  "name": "@zeroxsolutions/registry-ui-e2e",
  "version": "0.0.1",
  "private": true,
  "nx": {
    "implicitDependencies": ["@zeroxsolutions/registry-ui"],
    "targets": {
      "e2e": {
        "dependsOn": [
          {
            "projects": ["@zeroxsolutions/registry-ui"],
            "target": "wrangler:build"
          }
        ],
        "parallelism": false
      }
    }
  }
}
```

`apps/registry-ui-e2e/src/docs.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('/docs renders the introduction page', async ({ page }) => {
  await page.goto('/docs');

  await expect(page.getByRole('heading', { level: 1, name: 'Introduction' })).toBeVisible();
});
```

Run (from the repo root): `pnpm exec nx show project @zeroxsolutions/registry-ui-e2e --json | jq -c '.targets.e2e | {dependsOn, parallelism}'`
Expected:

```
{"dependsOn":[{"projects":["@zeroxsolutions/registry-ui"],"target":"wrangler:build"}],"parallelism":false}
```

(Without the `targets` block the plugin infers `{"dependsOn":[{"projects":["@zeroxsolutions/registry-ui"],"target":"wrangler"}],"parallelism":true}`, measured; on master, with `:dev`, it inferred `"target":"dev"`.)

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache > "$S/e2e-t4-red.log" 2>&1; grep -E ' passed| failed|Locator:|Error: element' "$S/e2e-t4-red.log"`
Expected (no route serves `/docs` yet; `example.spec.ts` still passes on `/`):

```
    Locator: getByRole('heading', { name: 'Introduction', level: 1 })
    Error: element(s) not found
    Locator: getByRole('heading', { name: 'Introduction', level: 1 })
    Error: element(s) not found
    Locator: getByRole('heading', { name: 'Introduction', level: 1 })
    Error: element(s) not found
  3 failed
  3 passed (36.5s)
```

- [ ] **Step 6: The docs route**

`apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { source } from '@/lib/source';

export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.generateParams();
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();

  return { title: page.data.title, description: page.data.description };
}

export default async function DocsPage({ params }: DocsPageProps): Promise<ReactNode> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();

  const Body = page.data.body;

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{page.data.title}</h1>
        <p className="text-muted-foreground">{page.data.description}</p>
      </header>
      <Body />
    </article>
  );
}
```

- [ ] **Step 7: The e2e suite against the worker, and the port it leaves**

Run (from the repo root):

```bash
pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache > "$S/e2e-t4.log" 2>&1; grep -E ' passed| failed|Successfully ran' "$S/e2e-t4.log"
sleep 3; lsof -nP -iTCP:8787 -sTCP:LISTEN | wc -l
```

Expected:

```
  6 passed (28.8s)
 NX   Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 6 tasks it depends on
       0
```

(Two tests in three browsers. The six tasks are `wrangler:build`, `shadcn-build`, `fumadocs-generate` and the three package builds. Without `gracefulShutdown` the same run left the `opennextjs-cloudflare preview` process, `wrangler dev` and two `workerd` processes running, with `workerd` listening on 8787 and 9229.)

- [ ] **Step 8: Measure Shiki on the worker**

Run (from the repo root):

```bash
(pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:dev > "$S/dev-t4.log" 2>&1 &)
until curl -sf -o /dev/null http://localhost:8787/docs; do sleep 2; done
curl -s -o "$S/docs-t4.html" -w '%{http_code}\n' http://localhost:8787/docs
grep -o 'class="shiki[^"]*"' "$S/docs-t4.html"
grep -o '<span style="[^"]*">npx</span>' "$S/docs-t4.html"
grep -cE 'No such module|shiki/core' "$S/dev-t4.log"
pkill -INT -f 'nx run @zeroxsolutions/registry-ui:wrangler:dev'; sleep 5; lsof -nP -iTCP:8787 -sTCP:LISTEN | wc -l
```

Expected:

```
200
class="shiki shiki-themes github-light github-dark"
<span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0">npx</span>
0
       0
```

(The build is Turbopack's, as upstream's is. `/docs` is prerendered, so Shiki ran during `next build` and the worker serves static HTML; fumadocs#2800's `No such module "shiki/core"` is a request-time highlight on a Turbopack bundle, and nothing here highlights at request time. `--webpack` is not added. The token carries only the two custom properties because fumadocs' `rehypeCode` defaults `defaultColor` to `false`; Task 5's code block paints from them.)

- [ ] **Step 9: Run the spec, the suite, the type check, lint, format and both builds**

Run (from `apps/registry-ui`; prettier and nx from the repo root):

```bash
pnpm exec vitest run src/lib/source.spec.ts 2>&1 | grep -E '✓ \||×|Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t4.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t4.log"; grep -c 'not wrapped in act' "$S/vt-t4.log"
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:fumadocs-generate > /dev/null)
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t4.log" 2>&1; grep -c 'error TS' "$S/tsc-t4.log"
pnpm exec eslint source.config.ts next.config.mjs eslint.config.mjs src/lib/source.ts src/lib/source.spec.ts 'src/app/(app)/docs/[[...slug]]/page.tsx' 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
(cd ../registry-ui-e2e && pnpm exec eslint playwright.config.mts src/docs.spec.ts 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)')
(cd ../.. && pnpm exec prettier --check apps/registry-ui/source.config.ts apps/registry-ui/next.config.mjs apps/registry-ui/tsconfig.json apps/registry-ui/eslint.config.mjs apps/registry-ui/content/docs/meta.json apps/registry-ui/content/docs/index.mdx apps/registry-ui/src/lib/source.ts apps/registry-ui/src/lib/source.spec.ts 'apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx' apps/registry-ui-e2e/playwright.config.mts apps/registry-ui-e2e/src/docs.spec.ts 2>&1 | tail -1)
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:build --skip-nx-cache 2>&1 | grep -E '/docs|Successfully ran')
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:build 2>&1 | grep -E 'Worker saved|Successfully ran')
rm -rf "$S/r-t4"; pnpm exec shadcn build -o "$S/r-t4" > "$S/sb-t4.log" 2>&1; tail -1 "$S/sb-t4.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| src/lib/source.spec.ts (2 tests) 2ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
 Test Files  81 passed (81)
      Tests  533 passed (533)
0
0
All matched files use Prettier code style!
└   /docs/[[...slug]]
  └ ● /docs
 NX   Successfully ran target build for project @zeroxsolutions/registry-ui and 5 tasks it depends on
Worker saved in `.open-next/worker.js` 🚀
 NX   Successfully ran target wrangler:build for project @zeroxsolutions/registry-ui and 5 tasks it depends on
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(eslint prints no problem line; each project's files are linted from that project, since eslint run from `apps/registry-ui` reports the e2e files as `File ignored because outside of base path`. 531 after Task 3 + the 2 new cases = 533, and one more file. `tsc` prints no error line; before `fumadocs-generate` has run it prints `src/lib/source.ts(1,22): error TS2307: Cannot find module 'collections/server' or its corresponding type declarations.`, measured with `.source` moved aside. Next 16.3's route table lists the dynamic route bare and marks the prerendered `/docs` under it. `eslint .` over the app still prints the one warning it printed on master, `src/app/api/hello/route.ts` 1:27, which Task 6 deletes.)

- [ ] **Step 10: Commit**

`$S/msg-t4.txt`:

```
feat(registry-ui): add the fumadocs content pipeline and wrangler:dev

Why: the docs site needs MDX pages read at build and served by the
worker that deploys. The e2e suite now starts wrangler:dev; the playwright plugin
split that target name at its first colon, so e2e declares its
dependency on wrangler:build itself, and a SIGINT shutdown stops the
worker nx started instead of leaving it on port 8787.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
A=apps/registry-ui; E=apps/registry-ui-e2e
git add $A/source.config.ts $A/content/docs/meta.json $A/content/docs/index.mdx $A/src/lib/source.ts $A/src/lib/source.spec.ts "$A/src/app/(app)/docs/[[...slug]]/page.tsx" $E/src/docs.spec.ts
git commit -q -F "$S/msg-t4.txt" -- $A/source.config.ts $A/content $A/src/lib "$A/src/app/(app)" $A/package.json $A/next.config.mjs $A/tsconfig.json $A/eslint.config.mjs $E/playwright.config.mts $E/package.json $E/src/docs.spec.ts .prettierignore pnpm-lock.yaml
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects and 2 tasks they depend on`; the log shows the subject above; `git status --short` prints nothing.

### Task 5: The fluent-emoji fix, the demo index and the MDX components

Spec (c) Part 2, "Content pipeline", its `src/mdx-components.tsx` row and the paragraph under it, and Tests rule 2. A new target, `examples-index`, runs `tools/build-examples-index.mts`, which writes the demo index from `examples/*.tsx` and from `registry.json`'s components and block: `ComponentSource` is also given an item name (`<ComponentSource name="status-indicator" />` on a composed-item page), so the items are in the index beside the demos. The index is upstream's shape with no style key, and like upstream it is two files (`apps/v4/scripts/build-registry.mts` writes `examples/__index__.tsx` with `name` and `filePath`, and `examples/__components__/` with the `React.lazy` entries, read 2026-09-30). Here the split is required, not only a matter of memory: every demo and component uses hooks and carries no client directive (the registry is `rsc: false`), so a server module that imports the lazy map fails the Turbopack build with `You're importing a component that needs createContext. This React Hook only works in a Client Component` for each of them. The server reads `__index__.tsx` for paths; only the client module `ComponentPreviewDemo` imports `__components__.tsx`. Both files are gitignored, so `build`, `wrangler:build` and `test` depend on the target, and a graph missing that edge fails on a missing module (`Cannot find package '@/registry/bases/base-ui/examples/__index__'`) rather than going green.

`ComponentPreview` shows a demo live under a Preview tab and its source under a Code tab; `ComponentSource` reads the file at build and highlights it with the same themes as the MDX fences, which are now one constant both read. The docs code block is `DocsCodeBlock`, a highlighted `<pre>` with the registry's own `CopyButton`, used by both `ComponentSource` and the MDX `pre`. `src/mdx-components.tsx` follows upstream's `mdx-components.tsx` (read 2026-09-30): headings with an anchor to themselves, `pre`/`code`, `Steps`/`Step`, the `Tabs` parts, `CodeTabs`, `Callout`, `ComponentPreview`, `ComponentSource`. `CodeTabs` and `Callout` are entries of the map, not files: each is one primitive (`Tabs` opening on `cli`, `Alert`), and a file whose whole body is one call to a primitive is a wrapper. `Steps` and `Step` are map entries as upstream has them. `index.mdx` gains a preview, a heading and a callout, so the build renders every part once.

Rendering every demo exposed a defect in `@zeroxsolutions/fluent-emoji`: `emoji-picker` imports it, and its default base, `new URL('./assets', import.meta.url)`, fails the Turbopack build of any app that bundles it (`./packages/fluent-emoji/dist/index.js:9652:18 Module not found: Can't resolve './assets'`; Turbopack resolves that form to a file and `assets` is a directory). Moving the module URL into a variable does not help (the dist then reads `o = import.meta.url, s = new URL("./assets", o).href` and Turbopack follows it); building the string from the module URL's text does. That fix is its own commit, first, because it changes a publishable package. On Next 16.3.7 the failure is the same, measured again with the old package source and this task's index: `./packages/fluent-emoji/dist/index.js:9652:18`, `Error: Module not found: Can't resolve './assets'`.

`ComponentSource` reads a file from a path built at render time. Next 16.3's Turbopack warns about this twice (`Warning: Dynamic filesystem access causes tracing of the whole project`, on `readFile` and on `join(process.cwd(), ...)`) and traces the whole project into the route's server output. The docs route's `page.js.nft.json` listed 1613 files, among them all of `registry/` and `apps/registry-ui-e2e/out-tsc`, and the adapter copied `registry/` (1.9 MB) into `.open-next/server-functions`. The route is prerendered, so no server bundle ever reads those files. `/* turbopackIgnore: true */` on `process.cwd()` clears both warnings: the trace drops to 1142 files and `registry/` is no longer copied. Turbopack's own message offers this remedy. The path cannot be scoped to one folder, because an item's file can live anywhere under `registry/`.

**Files:**

- Modify: `packages/fluent-emoji/src/lib/fluent-emoji-url.ts`, `packages/fluent-emoji/src/lib/fluent-emoji.spec.tsx` (first commit)
- Create: `apps/registry-ui/tools/build-examples-index.mts`, `apps/registry-ui/src/constants/code-themes.ts`, `apps/registry-ui/src/components/data-display/docs-code-block.tsx`, `apps/registry-ui/src/components/data-display/component-source.tsx`, `apps/registry-ui/src/components/data-display/component-preview.tsx`, `apps/registry-ui/src/components/data-display/component-preview-demo.tsx`, `apps/registry-ui/src/mdx-components.tsx`
- Modify: `apps/registry-ui/src/lib/source.spec.ts`, `apps/registry-ui/package.json`, `apps/registry-ui/source.config.ts`, `apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx`, `apps/registry-ui/content/docs/index.mdx`, `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, `apps/registry-ui/eslint.config.mjs`, `.gitignore`, `.prettierignore`
- Generated, gitignored: `apps/registry-ui/registry/bases/base-ui/examples/__index__.tsx`, `apps/registry-ui/registry/bases/base-ui/examples/__components__.tsx`

**Interfaces:**

- Consumes: the Task 4 tree (`source`, `docs`, `fumadocs-generate`, `wrangler:dev`, the e2e suite on the worker; suite 81 files, 533 tests; `tsc` prints no error line); the registry's `CopyButton` (`components/feedback/copy-button.tsx`), `ui/tabs.tsx`, `ui/alert.tsx`; `fumadocs-core/highlight`'s `highlight(code, options): Promise<ReactNode>`.
- Produces:
  - `packages/fluent-emoji`: `fluentEmojiUrl` with no base resolves to the module's own directory plus `assets`, as before, now from the module URL's text
  - target `examples-index` on `@zeroxsolutions/registry-ui` (`node tools/build-examples-index.mts`, both generated files as outputs, cached), added to `dependsOn` of `test`, `build` and `wrangler:build`
  - `examples/__index__.tsx`: `Index: Record<string, { name: string; filePath: string }>` (59 demos and 43 items, `filePath` relative to the app root)
  - `examples/__components__.tsx`: `Components: Record<string, LazyExoticComponent<ComponentType>>`, each entry the first function its file exports
  - `src/constants/code-themes.ts`: `CODE_THEMES` (`{ light: 'github-light', dark: 'github-dark' }`), read by `source.config.ts` and `ComponentSource`
  - `DocsCodeBlock({ code, ...figure props, children })`, `ComponentSource({ name, ...DocsCodeBlock props but code })` (async, server), `ComponentPreview({ name, ...Tabs props })`, `ComponentPreviewDemo({ name })` (client)
  - `src/mdx-components.tsx`: `mdxComponents`; the docs page passes it to the compiled body
  - `src/lib/source.spec.ts`, module-local: `readPageSources`, `readItemNames`, `NAMED_SOURCE`, `unresolvedNames`, `misplacedFirstPreviews`
- Removed: nothing.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or `packages/`, or name a repo-root file. Expected output is shown without the terminal control codes (colour, cursor), which nx and the adapter write into the logs.

- [ ] **Step 1: Pin fluent-emoji's default base and watch it fail**

In `packages/fluent-emoji/src/lib/fluent-emoji.spec.tsx`, first case of `describe('fluentEmojiUrl')`:

```diff
 describe('fluentEmojiUrl', () => {
+  it("resolves against the package's own assets directory when no base is set", () => {
+    // Through a variable, so Vite leaves this `new URL` alone; it rewrites the literal form.
+    const specUrl = import.meta.url;
+    expect(fluentEmojiUrl('🤯')).toBe(new URL('./assets/3d/1f92f.webp', specUrl).href);
+  });
+
   it('builds a <base>/3d/<code>.webp URL by default', () => {
```

Run (from `packages/fluent-emoji`): `pnpm exec vitest run src/lib/fluent-emoji.spec.tsx 2>&1 | grep -E '×|Expected|Received|^ +Tests'`
Expected:

```
     × resolves against the package's own assets directory when no base is set 4ms
Expected: "file:///<repo>/packages/fluent-emoji/src/lib/assets/3d/1f92f.webp"
Received: "http://localhost:3000/src/lib/assets/3d/1f92f.webp"
      Tests  1 failed | 24 passed (25)
```

(The same fault as the app build's, in a different bundler: a bundler rewrites `new URL('./assets', import.meta.url)` instead of leaving it as URL math, Vite here into a dev-server path, Turbopack into a module it cannot resolve.)

- [ ] **Step 2: Build the default base from the module URL's text**

In `packages/fluent-emoji/src/lib/fluent-emoji-url.ts`:

```diff
 // via setFluentEmojiBase (or a per-call `base`).
 //
-// Vite leaves this literal (no asset extension → not transformed/inlined), so it
-// is plain URL math at runtime, not a bundled asset.
-const DEFAULT_BASE = new URL('./assets', import.meta.url).href;
+// Built from the module URL's text, not `new URL('./assets', import.meta.url)`:
+// Turbopack resolves that form to a file when an app builds, follows it through
+// a variable too, and fails the build on a directory ("Module not found: Can't
+// resolve './assets'").
+const DEFAULT_BASE = import.meta.url.replace(/[^/]*$/, 'assets');
```

Both files already fail `prettier --check` on master (lines wrapped at 80 against the repo's width), and the pre-commit hook formats each staged file whole, so format them now and the commit shows what the hook would have made of it:

Run (from the repo root): `pnpm exec prettier --write packages/fluent-emoji/src/lib/fluent-emoji-url.ts packages/fluent-emoji/src/lib/fluent-emoji.spec.tsx > /dev/null`

- [ ] **Step 3: Watch it pass, and read the built form**

Run (from the repo root):

```bash
(cd packages/fluent-emoji && pnpm exec vitest run 2>&1 | grep -E '×|Test Files|^ +Tests')
pnpm exec nx run fluent-emoji:build --skip-nx-cache > "$S/fe-build-t5.log" 2>&1; echo "exit=$?"
grep -o 'import.meta.url.replace([^)]*)' packages/fluent-emoji/dist/index.js
grep -c 'new URL("./assets"' packages/fluent-emoji/dist/index.js
(cd packages/fluent-emoji && pnpm exec eslint src/lib/fluent-emoji-url.ts src/lib/fluent-emoji.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)')
pnpm exec prettier --check packages/fluent-emoji/src/lib/fluent-emoji-url.ts packages/fluent-emoji/src/lib/fluent-emoji.spec.tsx 2>&1 | tail -1
```

Expected:

```
 Test Files  2 passed (2)
      Tests  33 passed (33)
exit=0
import.meta.url.replace(/[^/]*$/, "assets")
0
All matched files use Prettier code style!
```

(eslint prints no problem line. 32 cases before + the new one = 33.)

- [ ] **Step 4: Commit the package fix**

`$S/msg-t5a.txt`:

```
fix(fluent-emoji): build the default base without new URL

Why: an app that bundles the package with Turbopack failed to build
with "Module not found: Can't resolve './assets'": Turbopack resolves
new URL('./assets', import.meta.url) to a file, and assets is a
directory. The base is the same URL, now built from the module URL's
text, which no bundler rewrites.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
git commit -q -F "$S/msg-t5a.txt" -- packages/fluent-emoji/src/lib/fluent-emoji-url.ts packages/fluent-emoji/src/lib/fluent-emoji.spec.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

- [ ] **Step 5: Write rule 2 and watch it fail**

In `apps/registry-ui/src/lib/source.spec.ts`:

```diff
 import { describe, expect, it } from 'vitest';

-const CONTENT = join(resolve(import.meta.dirname, '../..'), 'content/docs');
+import { Index } from '@/registry/bases/base-ui/examples/__index__';
+
+const APP = resolve(import.meta.dirname, '../..');
+const CONTENT = join(APP, 'content/docs');
```

After `readDocsTree`, before `unreachedPages`:

```ts
/** Each page's MDX source, by slug. */
function readPageSources(root: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(root, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => [file.slice(0, -'.mdx'.length), readFileSync(join(root, file), 'utf8')]),
  );
}

/** The names of the components and the block `registry.json` publishes, which an item page is named for. */
function readItemNames(): Set<string> {
  const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
    items: { name: string; type: string }[];
  };
  return new Set(items.filter((item) => item.type !== 'registry:example').map((item) => item.name));
}

const NAMED_SOURCE = /<(ComponentPreview|ComponentSource)\b[^>]*?\bname="([^"]+)"/g;

/** Every `ComponentPreview` or `ComponentSource` name the index lacks, as `<slug>: <name>`. */
function unresolvedNames(sources: Record<string, string>, index: Set<string>): string[] {
  return Object.entries(sources).flatMap(([slug, source]) =>
    [...source.matchAll(NAMED_SOURCE)].filter(([, , name]) => !index.has(name)).map(([, , name]) => `${slug}: ${name}`),
  );
}

/** Every item page under `components/` or `blocks/` whose first `ComponentPreview` is not `<name>-demo`. */
function misplacedFirstPreviews(sources: Record<string, string>, items: Set<string>): string[] {
  return Object.entries(sources)
    .filter(([slug]) => /^(components|blocks)\//.test(slug) && items.has(slug.split('/').pop() ?? ''))
    .filter(([slug, source]) => {
      const first = [...source.matchAll(NAMED_SOURCE)].find(([, component]) => component === 'ComponentPreview');
      return first?.[2] !== `${slug.split('/').pop()}-demo`;
    })
    .map(([slug]) => slug);
}
```

At the foot of `describe('content/docs')`:

```ts
it('names only demos and items the examples index holds', () => {
  expect(unresolvedNames(readPageSources(CONTENT), new Set(Object.keys(Index)))).toEqual([]);
});

it('reports a name the examples index lacks', () => {
  const sources = {
    'components/status-indicator':
      '<ComponentPreview name="status-indicator-demo" />\n<ComponentSource name="status-indicator-missing" />',
  };

  expect(unresolvedNames(sources, new Set(['status-indicator', 'status-indicator-demo']))).toEqual([
    'components/status-indicator: status-indicator-missing',
  ]);
});

it("opens every item page with the item's own demo", () => {
  expect(misplacedFirstPreviews(readPageSources(CONTENT), readItemNames())).toEqual([]);
});

it("reports an item page whose first preview is not the item's demo", () => {
  const sources = {
    'blocks/ai-provider-picker': '<ComponentPreview name="ai-provider-picker-demo" />',
    'components/button': '<ComponentPreview name="button-outline" />',
    'components/status-indicator':
      '<ComponentPreview name="status-indicator-tones" />\n<ComponentPreview name="status-indicator-demo" />',
    'components/tag-input': '<ComponentSource name="tag-input" />',
  };

  expect(misplacedFirstPreviews(sources, new Set(['ai-provider-picker', 'status-indicator', 'tag-input']))).toEqual([
    'components/status-indicator',
    'components/tag-input',
  ]);
});
```

Run: `pnpm exec vitest run src/lib/source.spec.ts 2>&1 | grep -E 'FAIL|Error|Test Files|^ +Tests'`
Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| src/lib/source.spec.ts [ src/lib/source.spec.ts ]
Error: Cannot find package '@/registry/bases/base-ui/examples/__index__' imported from <repo>/apps/registry-ui/src/lib/source.spec.ts
 Test Files  1 failed (1)
      Tests  no tests
```

(The wrong-fragment cases are the ones a broken rule turns red, measured once the index exists: drop `.filter(([, , name]) => !index.has(name))` and the second case fails with `expected [ …(2) ] to deeply equal [ Array(1) ]`; replace the `first?.[2] !==` comparison with `first === undefined` and the fourth fails with `expected [ 'components/tag-input' ] to deeply equal [ 'components/status-indicator', …(1) ]`.)

- [ ] **Step 6: The generator and its target**

`apps/registry-ui/tools/build-examples-index.mts`:

```ts
/**
 * Writes the docs' demo index from `examples/` and `registry.json`: every demo and every published
 * component and block, by name. `examples/__index__.tsx` maps a name to its file path, which
 * `ComponentSource` reads at build; `examples/__components__.tsx` maps it to a lazy import of the
 * component the file exports, which `ComponentPreview` renders. They are two files because the
 * components use hooks and carry no client directive, so only a client module may import them,
 * while the paths are read on the server.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const APP = resolve(import.meta.dirname, '..');
const EXAMPLES = 'registry/bases/base-ui/examples';
const HEADER = '// Written by tools/build-examples-index.mts from examples/ and registry.json.';

interface RegistryItem {
  name: string;
  type: string;
  files: { path: string }[];
}

const demos = readdirSync(join(APP, EXAMPLES))
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.spec.tsx') && !file.startsWith('__'))
  .map((file) => ({ name: file.slice(0, -'.tsx'.length), filePath: `${EXAMPLES}/${file}` }));

// A registry:example item is one of the demo files above, under the same name.
const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as { items: RegistryItem[] };
const published = items
  .filter((item) => item.type !== 'registry:example')
  .map((item) => ({ name: item.name, filePath: item.files[0].path }));

const entries = [...demos, ...published].sort((a, b) => a.name.localeCompare(b.name));
const duplicate = entries.find((entry, i) => entries[i + 1]?.name === entry.name);
if (duplicate) throw new Error(`examples index: "${duplicate.name}" names both a demo and a registry item`);

writeFileSync(
  join(APP, EXAMPLES, '__index__.tsx'),
  `${HEADER}
interface IndexEntry {
  name: string;
  filePath: string;
}

export const Index: Record<string, IndexEntry> = {
${entries.map(({ name, filePath }) => `  '${name}': { name: '${name}', filePath: '${filePath}' },`).join('\n')}
};
`,
);

writeFileSync(
  join(APP, EXAMPLES, '__components__.tsx'),
  `${HEADER}
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

function firstComponent(module: Record<string, unknown>): { default: ComponentType } {
  return { default: Object.values(module).find((value) => typeof value === 'function') as ComponentType };
}

export const Components: Record<string, LazyExoticComponent<ComponentType>> = {
${entries
  .map(
    ({ name, filePath }) =>
      `  '${name}': lazy(() => import('@/${filePath.replace(/\.tsx$/, '')}').then(firstComponent)),`,
  )
  .join('\n')}
};
`,
);

console.log(`examples index: ${demos.length} demos, ${published.length} registry items`);
```

In `apps/registry-ui/package.json`, `nx.targets`: add `"examples-index"` as the last entry of the `dependsOn` of `test`, `build` and `wrangler:build` (each then ends `"fumadocs-generate", "examples-index"`), and after `fumadocs-generate`, last:

```json
      "examples-index": {
        "executor": "nx:run-commands",
        "outputs": [
          "{projectRoot}/registry/bases/base-ui/examples/__index__.tsx",
          "{projectRoot}/registry/bases/base-ui/examples/__components__.tsx"
        ],
        "cache": true,
        "options": {
          "cwd": "{projectRoot}",
          "command": "node tools/build-examples-index.mts"
        }
      }
```

In `.gitignore` (repo root), after the `public/r` entry:

```diff
 # Generated shadcn registry JSON (emitted by @zeroxsolutions/registry-ui:shadcn-build)
 apps/registry-ui/public/r

+# The docs' demo index (emitted by @zeroxsolutions/registry-ui:examples-index)
+apps/registry-ui/registry/bases/base-ui/examples/__index__.tsx
+apps/registry-ui/registry/bases/base-ui/examples/__components__.tsx
+
 # Playwright e2e artifacts (regenerated screenshots + reports)
```

In `.prettierignore`:

```diff
 .open-next
 .source
+apps/registry-ui/registry/bases/base-ui/examples/__index__.tsx
+apps/registry-ui/registry/bases/base-ui/examples/__components__.tsx
 .wrangler
```

`apps/registry-ui/eslint.config.mjs`, the ignores entry:

```diff
   {
-    ignores: ['.next/**/*', '.source/**/*', '**/out-tsc'],
+    ignores: [
+      '.next/**/*',
+      '.source/**/*',
+      'registry/bases/base-ui/examples/__index__.tsx',
+      'registry/bases/base-ui/examples/__components__.tsx',
+      '**/out-tsc',
+    ],
   },
```

Run: `node tools/build-examples-index.mts && git status --short --ignored registry/bases/base-ui/examples | grep __`
Expected:

```
examples index: 59 demos, 43 registry items
!! registry/bases/base-ui/examples/__components__.tsx
!! registry/bases/base-ui/examples/__index__.tsx
```

The examples spec globs `./*.tsx`, so it now finds the two generated files. Run: `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^ +×|AssertionError|^\+   "|Test Files|^ +Tests'`
Expected:

```
     × has a row for every example file and a file for every row 4ms
     × '__components__' renders 'Components' with its data-slot 7ms
     × '__index__' renders 'Index' with its data-slot 1ms
AssertionError: expected [ Array(61) ] to deeply equal [ 'ai-provider-card-demo', …(58) ]
+   "__components__",
+   "__index__",
 Test Files  1 failed (1)
      Tests  3 failed | 63 passed (66)
```

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx` (the wrapping is prettier's):

```diff
-const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx'], { eager: true }) as Record<string, ExampleModule>;
+const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx', '!./__index__.tsx', '!./__components__.tsx'], {
+  eager: true,
+}) as Record<string, ExampleModule>;
```

- [ ] **Step 7: Watch rule 2 and the examples spec pass**

Run: `pnpm exec vitest run src/lib/source.spec.ts registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '✓ \||×|Test Files|^ +Tests'`
Expected:

```
 ✓ |@zeroxsolutions/registry-ui| src/lib/source.spec.ts (6 tests) 6ms
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (64 tests) 440ms
 Test Files  2 passed (2)
      Tests  70 passed (70)
```

(`index.mdx` names no demo yet, so the two real-tree cases pass on an empty set here; Step 8's preview gives the first one a name to resolve.)

- [ ] **Step 8: The code themes, the components and the MDX map**

`apps/registry-ui/src/constants/code-themes.ts`:

```ts
/** The Shiki themes of every code block on the site: MDX fences when content compiles, `ComponentSource` at build. */
export const CODE_THEMES = { light: 'github-light', dark: 'github-dark' } as const;
```

In `apps/registry-ui/source.config.ts` (`fumadocs-mdx` bundles the config with the app's path aliases, so `@/` resolves: its `.source/source.config.mjs` inlines `var CODE_THEMES = { light: "github-light", dark: "github-dark" }`):

```diff
 import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

+import { CODE_THEMES } from '@/constants/code-themes';
+
 export const docs = defineDocs({
```

```diff
   mdxOptions: {
-    rehypeCodeOptions: { themes: { light: 'github-light', dark: 'github-dark' } },
+    rehypeCodeOptions: { themes: CODE_THEMES },
   },
```

`apps/registry-ui/src/components/data-display/docs-code-block.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';

import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface DocsCodeBlockProps extends ComponentProps<'figure'> {
  /** The source a copy writes to the clipboard: the block's text as the reader sees it. */
  code: string;
}

/**
 * A highlighted `<pre>`, passed as children, with a copy button over its corner. Shiki highlights
 * it with both themes and no default colour, so each token carries only `--shiki-light` and
 * `--shiki-dark`, and this block paints it from the one the page's theme selects.
 */
function DocsCodeBlock({ code, className, children, ...props }: DocsCodeBlockProps): ReactNode {
  return (
    <figure
      data-slot="docs-code-block"
      className={cn(
        'bg-muted/50 relative overflow-hidden rounded-xl border text-sm',
        '[&_pre]:max-h-96 [&_pre]:overflow-auto [&_pre]:px-4 [&_pre]:py-3.5 [&_pre]:font-mono',
        '[&_pre_span]:text-(--shiki-light) dark:[&_pre_span]:text-(--shiki-dark)',
        className,
      )}
      {...props}
    >
      {children}
      <div className="absolute top-2 right-2">
        <CopyButton value={code} />
      </div>
    </figure>
  );
}

export { DocsCodeBlock };
```

`apps/registry-ui/src/components/data-display/component-source.tsx`:

```tsx
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { highlight } from 'fumadocs-core/highlight';
import type { ComponentProps, ReactNode } from 'react';

import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { CODE_THEMES } from '@/constants/code-themes';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

interface ComponentSourceProps extends Omit<ComponentProps<typeof DocsCodeBlock>, 'code'> {
  /** A demo or registry item name in the examples index. */
  name: string;
}

/**
 * The source file of a demo or registry item, highlighted. It reads the file from disk while it
 * renders, so it belongs only on a route rendered whole at build (`force-static` with every param
 * listed): the worker that serves the route has no such file. Throws for a name the index lacks.
 */
async function ComponentSource({ name, ...props }: ComponentSourceProps): Promise<ReactNode> {
  const entry = Index[name];
  if (!entry) throw new Error(`ComponentSource: "${name}" is not in the examples index`);

  // Untraced: the route is prerendered, so no server bundle reads the file. Traced, the path is too
  // dynamic to scope and Turbopack copies the whole project into the server output.
  const code = await readFile(join(/* turbopackIgnore: true */ process.cwd(), entry.filePath), 'utf8');

  return (
    <DocsCodeBlock code={code} {...props}>
      {await highlight(code, { lang: 'tsx', themes: CODE_THEMES, defaultColor: false })}
    </DocsCodeBlock>
  );
}

export { ComponentSource };
```

`apps/registry-ui/src/components/data-display/component-preview-demo.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';

import { Components } from '@/registry/bases/base-ui/examples/__components__';

/**
 * Renders the demo the examples index holds under `name`. The demos and the components they compose
 * use hooks and carry no client directive, since the registry ships without one, so their lazy
 * imports have to sit on this side of the client boundary.
 */
function ComponentPreviewDemo({ name }: { name: string }): ReactNode {
  const Demo = Components[name];

  return <Demo />;
}

export { ComponentPreviewDemo };
```

`apps/registry-ui/src/components/data-display/component-preview.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';

import { ComponentPreviewDemo } from '@/components/data-display/component-preview-demo';
import { ComponentSource } from '@/components/data-display/component-source';
import { Index } from '@/registry/bases/base-ui/examples/__index__';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

interface ComponentPreviewProps extends ComponentProps<typeof Tabs> {
  /** A demo name in the examples index. */
  name: string;
}

/**
 * A demo rendered live under a Preview tab, and its source under a Code tab. Throws for a name the
 * index lacks, so a page naming a missing demo fails its build.
 */
function ComponentPreview({ name, className, ...props }: ComponentPreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);

  return (
    <Tabs data-slot="component-preview" defaultValue="preview" className={cn('gap-3', className)} {...props}>
      <TabsList variant="line">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="flex min-h-72 items-center justify-center rounded-xl border p-10">
        <ComponentPreviewDemo name={name} />
      </TabsContent>
      <TabsContent value="code">
        <ComponentSource name={name} />
      </TabsContent>
    </Tabs>
  );
}

export { ComponentPreview };
```

`apps/registry-ui/src/mdx-components.tsx`:

```tsx
import { isValidElement, type ComponentProps, type ReactNode } from 'react';

import { ComponentPreview } from '@/components/data-display/component-preview';
import { ComponentSource } from '@/components/data-display/component-source';
import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/registry/bases/base-ui/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

/** The text a node renders, as a reader would copy it. */
function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return '';
}

/** A heading's text as a link to itself; the id comes from the MDX compiler, which slugs every heading. */
function HeadingAnchor({ id, children }: { id?: string; children: ReactNode }): ReactNode {
  if (!id) return children;

  return (
    <a href={`#${id}`} className="group/heading-anchor">
      {children}
      <span aria-hidden="true" className="text-muted-foreground ml-2 opacity-0 group-hover/heading-anchor:opacity-100">
        #
      </span>
    </a>
  );
}

/** Every element and component a page in `content/docs` may use, passed to its compiled body. */
export const mdxComponents = {
  h2: ({ id, className, children, ...props }: ComponentProps<'h2'>) => (
    <h2 id={id} className={cn('mt-10 scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h2>
  ),
  h3: ({ id, className, children, ...props }: ComponentProps<'h3'>) => (
    <h3 id={id} className={cn('mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h3>
  ),
  h4: ({ id, className, children, ...props }: ComponentProps<'h4'>) => (
    <h4 id={id} className={cn('mt-6 scroll-m-20 font-semibold tracking-tight', className)} {...props}>
      <HeadingAnchor id={id}>{children}</HeadingAnchor>
    </h4>
  ),
  p: ({ className, ...props }: ComponentProps<'p'>) => <p className={cn('leading-7', className)} {...props} />,
  code: ({ className, ...props }: ComponentProps<'code'>) =>
    typeof props.children === 'string' ? (
      <code className={cn('bg-muted rounded-md px-1.5 py-0.5 font-mono text-[0.9em]', className)} {...props} />
    ) : (
      <code className={className} {...props} />
    ),
  pre: ({ children, ...props }: ComponentProps<'pre'>) => (
    <DocsCodeBlock code={nodeText(children)}>
      <pre {...props}>{children}</pre>
    </DocsCodeBlock>
  ),
  Steps: ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('ml-4 border-l pl-8 [counter-reset:step]', className)} {...props} />
  ),
  Step: ({ className, ...props }: ComponentProps<'h3'>) => (
    <h3
      className={cn(
        'mt-8 font-semibold [counter-increment:step]',
        'before:bg-muted before:mr-4 before:-ml-12 before:inline-flex before:size-8 before:items-center before:justify-center before:rounded-full before:text-sm before:content-[counter(step)]',
        className,
      )}
      {...props}
    />
  ),
  CodeTabs: (props: ComponentProps<typeof Tabs>) => <Tabs defaultValue="cli" {...props} />,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Callout: Alert,
  AlertTitle,
  AlertDescription,
  ComponentPreview,
  ComponentSource,
};
```

In `apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx`:

```diff
 import { source } from '@/lib/source';
+import { mdxComponents } from '@/mdx-components';
```

```diff
-      <Body />
+      <Body components={mdxComponents} />
```

`apps/registry-ui/content/docs/index.mdx`, whole file:

````mdx
---
title: Introduction
description: Composed Base UI components and blocks, published as a shadcn registry.
---

This registry publishes composed items: components, blocks and the demos that show them. Each one is
built from shadcn's own primitives, which a consuming app installs from shadcn's registry rather
than from this one.

<ComponentPreview name="status-indicator-demo" />

## Install an item

Each item is addressed by its URL:

```bash
npx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json
```

<Callout>
  <AlertTitle>Primitives come from shadcn</AlertTitle>
  <AlertDescription>
    An item that composes a primitive names it as a registry dependency, and the CLI installs it from shadcn's own
    registry.
  </AlertDescription>
</Callout>
````

- [ ] **Step 9: Build the worker and read the page it serves**

Run (from the repo root):

```bash
pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:build > "$S/wb-t5.log" 2>&1; grep -E 'examples index|Dynamic filesystem|Worker saved|Successfully ran|Failed to copy' "$S/wb-t5.log" | sed "s|$PWD|<repo>|"
(pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:dev > "$S/dev-t5.log" 2>&1 &)
until curl -sf -o /dev/null http://localhost:8787/docs; do sleep 2; done
curl -s -o "$S/docs-t5.html" -w '%{http_code}\n' http://localhost:8787/docs
for s in component-preview tabs-trigger status-indicator docs-code-block copy-button alert; do echo "$s: $(grep -o "data-slot=\"$s\"" "$S/docs-t5.html" | wc -l | tr -d ' ')"; done
grep -o 'href="#install-an-item"' "$S/docs-t5.html"
grep -o 'function StatusIndicatorDemo' "$S/docs-t5.html"
pkill -INT -f 'nx run @zeroxsolutions/registry-ui:wrangler:dev'; sleep 5; lsof -nP -iTCP:8787 -sTCP:LISTEN | wc -l
```

Expected:

```
examples index: 59 demos, 43 registry items
ERROR Failed to copy <repo>/node_modules/.pnpm/hast-util-to-html@9.0.5/node_modules/hast-util-to-html
ERROR Failed to copy <repo>/node_modules/.pnpm/hast-util-whitespace@3.0.0/node_modules/hast-util-whitespace
ERROR Failed to copy <repo>/node_modules/.pnpm/property-information@7.2.0/node_modules/property-information
Worker saved in `.open-next/worker.js` 🚀
 NX   Successfully ran target wrangler:build for project @zeroxsolutions/registry-ui and 6 tasks it depends on
200
component-preview: 1
tabs-trigger: 2
status-indicator: 5
docs-code-block: 1
copy-button: 1
alert: 1
href="#install-an-item"
function StatusIndicatorDemo
       0
```

(No `Dynamic filesystem access` warning is printed. Without the ignore comment there are two, and `jq '.files|length' '.next/server/app/(app)/docs/[[...slug]]/page.js.nft.json'` reads 1613 instead of 1142. The three `Failed to copy` lines, measured again on `@opennextjs/cloudflare` 1.20.7, come from the adapter's server bundling of the packages `fumadocs-core/highlight` pulls in; the build goes on and succeeds, and `/docs` is prerendered, so the worker never loads them. The Code tab's panel is not mounted until it is chosen, so its source is in the page's RSC payload, which is what the `StatusIndicatorDemo` line finds, rather than in its markup. In a browser, choosing Code shows `function StatusIndicatorDemo` with its keywords painted `rgb(215, 58, 73)`, github-light's, and the page logs no error.)

- [ ] **Step 10: Run the specs, the suite, the type check, lint, format, the builds and the e2e suite**

Run (from `apps/registry-ui`; prettier and nx from the repo root):

```bash
pnpm exec vitest run src/lib/source.spec.ts registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '✓ \||×|Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t5.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t5.log"; grep -c 'not wrapped in act' "$S/vt-t5.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t5.log" 2>&1; grep -c 'error TS' "$S/tsc-t5.log"
pnpm exec eslint tools/build-examples-index.mts src/constants/code-themes.ts source.config.ts src/components/data-display/*.tsx src/mdx-components.tsx src/lib/source.spec.ts 'src/app/(app)/docs/[[...slug]]/page.tsx' registry/bases/base-ui/examples/examples.spec.tsx eslint.config.mjs 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
(cd ../.. && pnpm exec prettier --check apps/registry-ui/tools/build-examples-index.mts apps/registry-ui/src/constants/code-themes.ts apps/registry-ui/source.config.ts apps/registry-ui/src/components/data-display/*.tsx apps/registry-ui/src/mdx-components.tsx apps/registry-ui/src/lib/source.spec.ts 'apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx' apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx apps/registry-ui/eslint.config.mjs apps/registry-ui/content/docs/index.mdx 2>&1 | tail -1)
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:build --skip-nx-cache 2>&1 | grep -E '/docs|Successfully ran')
rm -rf "$S/r-t5"; pnpm exec shadcn build -o "$S/r-t5" > "$S/sb-t5.log" 2>&1; tail -1 "$S/sb-t5.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e > "$S/e2e-t5.log" 2>&1; grep -E ' passed| failed|Successfully ran' "$S/e2e-t5.log")
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| src/lib/source.spec.ts (6 tests) 6ms
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (64 tests) 440ms
 Test Files  2 passed (2)
      Tests  70 passed (70)
 Test Files  81 passed (81)
      Tests  537 passed (537)
0
0
All matched files use Prettier code style!
└   /docs/[[...slug]]
  └ ● /docs
 NX   Successfully ran target build for project @zeroxsolutions/registry-ui and 6 tasks it depends on
✔ Building registry.
✔ Checked 1 registry file and 86 items.
  6 passed (15.8s)
 NX   Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on
```

(eslint prints no problem line. 533 after Task 4 + the 4 new cases = 537, in the same 81 files. `tsc` needs both generated sources; they exist from Step 6 and Step 9's build. The e2e suite is Task 4's two tests in three browsers; this task adds no e2e case, since the spec's Code tab case belongs to the status-indicator page in Task 8. `registry.json` is untouched, so `shadcn` still reads 86 items.)

- [ ] **Step 11: Commit**

`$S/msg-t5.txt`:

```
feat(registry-ui): add the demo index and the docs' MDX components

Why: a page previews a demo and shows a file's source by name, so a
generated index maps each demo and item to its file and a lazy import.
It is two files because the components use hooks without a client
directive and only a client module may import them, while the paths
are read on the server at build. The index is gitignored, so build,
wrangler:build and test depend on the target that writes it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
A=apps/registry-ui
git add $A/tools/build-examples-index.mts $A/src/constants/code-themes.ts $A/src/components/data-display $A/src/mdx-components.tsx
git commit -q -F "$S/msg-t5.txt" -- $A/tools $A/src/constants $A/src/components $A/src/mdx-components.tsx $A/src/lib/source.spec.ts $A/package.json $A/source.config.ts "$A/src/app/(app)/docs/[[...slug]]/page.tsx" $A/content/docs/index.mdx $A/registry/bases/base-ui/examples/examples.spec.tsx $A/eslint.config.mjs .gitignore .prettierignore
git log -2 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects and 3 tasks they depend on`; the log shows this subject over Step 4's; `git status --short` prints nothing.

### Task 6: The docs shell and the site's theme

Spec (c) Part 2, "Shell", the `wrangler.jsonc` paragraph under "Routes", and the Tests section's shell specs and its dark color-scheme e2e case. Every page under `(app)` gets a header (the site's name, a Docs link, a menu of the docs on a narrow screen, the theme switch) and a footer; every docs page gets a sidebar grouped as the content's `meta.json` files order it, a table of contents that marks the heading in view, and a pager to the pages before and after it. The shell follows upstream's shell files (`apps/v4/components/{site-header,site-footer,docs-sidebar,docs-toc,mobile-nav,mode-switcher}.tsx`, `app/(app)/layout.tsx`, `app/(app)/docs/layout.tsx`, `app/layout.tsx`, read 2026-09-30) and composes this registry's own primitives (`sidebar`, `popover`, `button`), so it shows base-nova. The theme is `next-themes`, composed in `providers/app-providers.tsx`, which carries no client directive: `next-themes` ships its own, so the tree under it stays server-rendered.

Four decisions go past the spec. First, the table of contents uses `fumadocs-core/toc` (`AnchorProvider`, `useActiveAnchor`) for the heading in view, where upstream hand-writes an `IntersectionObserver`: the library the pipeline already runs owns it. Second, the links are the route units the house package `@zeroxsolutions/routing` (0.0.7, npm `latest`, read 2026-09-30) builds, so `/` and `/docs` are spelled once in `src/routes/app-routes.ts`, and the loader's `baseUrl` reads `docsRoute` too. Only paths with a page get a unit now; `/docs/components` and `/blocks` join the header in Task 8 with their pages. The sidebar marks the current page with the package's `isMatch`, a full match, so `/docs` is not lit on its children. Third, the pager and the header's Docs link are `next/link` anchors styled with `buttonVariants`, not `Button render={<Link />}`: Base UI's `Button` sets `role="button"` on the anchor (measured: the spec found `button` "Previous: Introduction", not a link), and upstream's base Button page says the same ("Do not use `<Button render={<a />} nativeButton={false} />` for links", `content/docs/components/base/button.mdx`, read 2026-09-30). Fourth, `DocsSidebar` wraps itself in `SidebarProvider`. The vendored `ui/sidebar.tsx` creates its context at module load and has no client directive, so the docs layout, a server component, cannot import the provider: the build failed with `Error: Failed to collect configuration for /docs/[[...slug]]` / `TypeError: d.createContext is not a function`. The sidebar never collapses, so nothing else reads the provider.

`wrangler.jsonc` gains `"keep_names": false`. The spec's reason holds, measured here: on a page the worker renders at request time (a throwaway `force-dynamic` page, not committed), the served HTML carried `next-themes`' inline script with `__name(k4, "k4");` in its body, which the browser does not define; with `"keep_names": false` the same page's HTML had no `__name`. Every route in this frame is prerendered by `next build`, where no `__name` is added, so the e2e case below does not fail without the line: it checks the theme is set before hydration on a prerendered page, and the line keeps it so for the first page rendered in the worker. The case is not vacuous: with the provider's `attribute="class"` removed, all three browsers failed it with `Expected: "lab(2.75381 0 0)"` / `Received: "lab(100 0 0)"`.

`registry/bases/base-ui/components/docs/` (five parts, an index and one spec) and `src/app/api/hello` are deleted. No item published the docs parts, and `registry.spec.ts` drops the clause that skipped them.

**Files:**

- Create: `apps/registry-ui/src/routes/app-routes.ts`, `apps/registry-ui/src/routes/app-routes.spec.ts`, `apps/registry-ui/src/lib/page-tree.ts`, `apps/registry-ui/src/lib/page-tree.spec.ts`, `apps/registry-ui/src/providers/app-providers.tsx`, `apps/registry-ui/src/components/general/mode-switcher.tsx`, `apps/registry-ui/src/components/general/mode-switcher.spec.tsx`, `apps/registry-ui/src/components/navigation/docs-sidebar.tsx`, `apps/registry-ui/src/components/navigation/docs-sidebar.spec.tsx`, `apps/registry-ui/src/components/navigation/docs-toc.tsx`, `apps/registry-ui/src/components/navigation/docs-toc.spec.tsx`, `apps/registry-ui/src/components/navigation/docs-pager.tsx`, `apps/registry-ui/src/components/navigation/docs-pager.spec.tsx`, `apps/registry-ui/src/components/navigation/mobile-nav.tsx`, `apps/registry-ui/src/components/layout/site-header.tsx`, `apps/registry-ui/src/components/layout/site-footer.tsx`, `apps/registry-ui/src/app/(app)/layout.tsx`, `apps/registry-ui/src/app/(app)/docs/layout.tsx`, `apps/registry-ui-e2e/src/theme.spec.ts`
- Modify: `apps/registry-ui/package.json` and `pnpm-lock.yaml` (by `pnpm add`), `apps/registry-ui/src/lib/source.ts`, `apps/registry-ui/src/app/layout.tsx`, `apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx`, `apps/registry-ui/registry/registry.spec.ts`, `apps/registry-ui/wrangler.jsonc`
- Delete: `apps/registry-ui/registry/bases/base-ui/components/docs/` (`doc-page.tsx`, `index.ts`, `installation.tsx`, `installation.spec.tsx`, `on-this-page.tsx`, `preview-code.tsx`, `usage.tsx`), `apps/registry-ui/src/app/api/hello/route.ts`

**Interfaces:**

- Consumes: the Task 5 tree (`source`, `mdxComponents`, the docs route, the e2e suite on the worker; suite 81 files, 537 tests; `tsc` prints no error line); the vendored `ui/sidebar.tsx`, `ui/popover.tsx`, `ui/button.tsx` (`Button`, `buttonVariants`); `fumadocs-core/page-tree` (`Root`, `Item`, `Node`, `findNeighbour`); `fumadocs-core/toc` (`AnchorProvider`, `useActiveAnchor`, `TableOfContents`, `TOCItemType`); `next-themes` 0.4.6 (already declared).
- Produces:
  - `src/routes/app-routes.ts`: `homeRoute` (`/`), `docsRoute` (`/docs`), each a `StaticRoute`
  - `src/lib/page-tree.ts`: `PageTreeGroup { name?: ReactNode; pages: Item[] }`, `pageTreeGroups(tree: Root): PageTreeGroup[]`
  - `src/providers/app-providers.tsx`: `AppProviders({ children })`, the theme as a class on `<html>`, following the system until switched
  - `ModeSwitcher(props: ComponentProps<typeof Button>)`, `DocsSidebar({ tree, ...Sidebar props })`, `DocsToc({ toc, ...nav props })`, `DocsPager({ tree, url, ...nav props })`, `MobileNav({ tree })`, `SiteHeader({ tree, ...header props })`, `SiteFooter(footer props)`
  - `(app)/layout.tsx` sets `--header-height` (`--spacing(14)`) for the header, the sidebar and the TOC
  - `wrangler.jsonc`: `"keep_names": false`
- Removed: `DocPage`, `Installation`, `OnThisPage`, `PreviewCode`, `Usage` (unpublished), `GET /api/hello`.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or name a repo-root file. Expected output is shown without the terminal control codes (colour, cursor), which nx, vitest and Playwright write into the logs.

- [ ] **Step 1: Add the house route package**

Run: `pnpm add --save-exact @zeroxsolutions/routing@0.0.7 2>&1 | grep -c 'unmet peer'`
Expected: `0`

Run: `git diff package.json | grep '^[-+] '`
Expected:

```
+    "@zeroxsolutions/routing": "0.0.7",
```

(One declarer, so a plain pin in this app's `dependencies` and no catalog entry. The travel repo's catalog pins the same 0.0.7.)

- [ ] **Step 2: Write the specs and watch them fail**

`apps/registry-ui/src/routes/app-routes.spec.ts`:

```ts
// @vitest-environment node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as appRoutes from './app-routes';

const APP_DIR = join(import.meta.dirname, '..', 'app');

/**
 * Every pathname a page in the app tree answers, read off the tree. A group folder is absent from the
 * URL, a private `_` folder is not routable, and an optional catch-all `[[...x]]` answers its parent's
 * path as well as every path below it.
 */
function pagePathnames(directory: string, segments: readonly string[] = []): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const found = entries.some((entry) => entry.isFile() && entry.name === 'page.tsx') ? [`/${segments.join('/')}`] : [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const pathless = entry.name.startsWith('(') || entry.name.startsWith('[[...');
    found.push(...pagePathnames(join(directory, entry.name), pathless ? segments : [...segments, entry.name]));
  }
  return found;
}

describe('app routes', () => {
  const routes = Object.values(appRoutes);

  // The pathname and the builder are two independent values, so nothing else pairs them.
  it.each(routes)('$pathname builds and matches its own pathname', (route) => {
    expect(route.build()).toBe(route.pathname);
    expect(route.matcher(route.pathname)).toBeTruthy();
  });

  it('names only paths a page answers', () => {
    const pages = new Set(pagePathnames(APP_DIR));

    expect(routes.map((route) => route.pathname).filter((pathname) => !pages.has(pathname))).toEqual([]);
  });
});
```

`apps/registry-ui/src/lib/page-tree.spec.ts`:

```ts
// @vitest-environment node
import type { Item, Root } from 'fumadocs-core/page-tree';
import { describe, expect, it } from 'vitest';

import { pageTreeGroups } from './page-tree';

function page(name: string, url: string): Item {
  return { type: 'page', name, url };
}

describe('pageTreeGroups', () => {
  it('groups pages under the separator or folder that precedes them, in tree order', () => {
    const tree: Root = {
      name: 'Docs',
      children: [
        page('Introduction', '/docs'),
        { type: 'separator', name: 'Get Started' },
        page('Installation', '/docs/installation'),
        {
          type: 'folder',
          name: 'Components',
          index: page('Components', '/docs/components'),
          children: [
            page('Button', '/docs/components/button'),
            {
              type: 'folder',
              name: 'Feedback',
              children: [page('Status Indicator', '/docs/components/status-indicator')],
            },
          ],
        },
        page('Changelog', '/docs/changelog'),
      ],
    };

    expect(
      pageTreeGroups(tree).map((group) => ({ name: group.name, urls: group.pages.map((item) => item.url) })),
    ).toEqual([
      { name: undefined, urls: ['/docs'] },
      { name: 'Get Started', urls: ['/docs/installation'] },
      { name: 'Components', urls: ['/docs/components', '/docs/components/button'] },
      { name: 'Feedback', urls: ['/docs/components/status-indicator'] },
      { name: undefined, urls: ['/docs/changelog'] },
    ]);
  });

  it('drops a separator or folder with no page under it', () => {
    const tree: Root = {
      name: 'Docs',
      children: [
        { type: 'separator', name: 'Empty' },
        { type: 'folder', name: 'Blocks', children: [] },
        page('Introduction', '/docs'),
      ],
    };

    expect(pageTreeGroups(tree).map((group) => group.name)).toEqual([undefined]);
  });
});
```

`apps/registry-ui/src/components/navigation/docs-sidebar.spec.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsSidebar } from './docs-sidebar';

vi.mock('next/navigation', () => ({ usePathname: (): string => '/docs/installation' }));

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    { type: 'page', name: 'Installation', url: '/docs/installation' },
    {
      type: 'folder',
      name: 'Components',
      children: [{ type: 'page', name: 'Button', url: '/docs/components/button' }],
    },
  ],
};

beforeEach(() => {
  // jsdom has no matchMedia; the sidebar's provider reads it to tell a phone from a desktop.
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('DocsSidebar', () => {
  it('marks the current page, and no other', () => {
    render(<DocsSidebar tree={tree} />);

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Introduction' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Button' }).getAttribute('aria-current')).toBeNull();
  });
});
```

`apps/registry-ui/src/components/navigation/docs-toc.spec.tsx`:

```tsx
import { act, cleanup, render, screen } from '@testing-library/react';
import type { TableOfContents } from 'fumadocs-core/toc';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsToc } from './docs-toc';

const toc: TableOfContents = [
  { title: 'Installation', url: '#installation', depth: 2 },
  { title: 'Usage', url: '#usage', depth: 2 },
];

/** The callback the TOC handed the last observer it made; a case calls it to scroll a heading into view. */
let reportIntersections: (entries: IntersectionObserverEntry[]) => void = () => undefined;

// jsdom has no IntersectionObserver, and nothing in it scrolls; this one reports what a case says.
class FakeIntersectionObserver {
  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    reportIntersections = callback;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** What an observer reports for the heading with `id` as it scrolls into or out of view. */
function intersection(id: string, isIntersecting: boolean): IntersectionObserverEntry {
  const target = document.getElementById(id);
  if (!target) throw new Error(`no heading #${id} in the document`);
  const rect = target.getBoundingClientRect();
  return {
    target,
    isIntersecting,
    rootBounds: null,
    boundingClientRect: rect,
    intersectionRect: rect,
    intersectionRatio: isIntersecting ? 1 : 0,
    time: 0,
  };
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('DocsToc', () => {
  it('marks the heading in view, and moves the mark as another scrolls in', () => {
    render(
      <>
        <h2 id="installation">Installation</h2>
        <h2 id="usage">Usage</h2>
        <DocsToc toc={toc} />
      </>,
    );

    act(() => reportIntersections([intersection('installation', true), intersection('usage', false)]));

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBe('location');
    expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('aria-current')).toBeNull();

    act(() => reportIntersections([intersection('installation', false), intersection('usage', true)]));

    expect(screen.getByRole('link', { name: 'Installation' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('aria-current')).toBe('location');
  });
});
```

`apps/registry-ui/src/components/navigation/docs-pager.spec.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { afterEach, describe, expect, it } from 'vitest';

import { DocsPager } from './docs-pager';

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    { type: 'page', name: 'Installation', url: '/docs/installation' },
    {
      type: 'folder',
      name: 'Components',
      children: [{ type: 'page', name: 'Button', url: '/docs/components/button' }],
    },
  ],
};

afterEach(cleanup);

describe('DocsPager', () => {
  it('links back to the page before and on to the page after, across a folder', () => {
    render(<DocsPager tree={tree} url="/docs/installation" />);

    expect(screen.getByRole('link', { name: 'Previous: Introduction' }).getAttribute('href')).toBe('/docs');
    expect(screen.getByRole('link', { name: 'Next: Button' }).getAttribute('href')).toBe('/docs/components/button');
  });

  it('links only forward from the first page, and only back from the last', () => {
    const { rerender } = render(<DocsPager tree={tree} url="/docs" />);

    expect(screen.queryByRole('link', { name: /^Previous/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Next: Installation' }).getAttribute('href')).toBe('/docs/installation');

    rerender(<DocsPager tree={tree} url="/docs/components/button" />);

    expect(screen.getByRole('link', { name: 'Previous: Installation' }).getAttribute('href')).toBe(
      '/docs/installation',
    );
    expect(screen.queryByRole('link', { name: /^Next/ })).toBeNull();
  });
});
```

`apps/registry-ui/src/components/general/mode-switcher.spec.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@/providers/app-providers';

import { ModeSwitcher } from './mode-switcher';

beforeEach(() => {
  // jsdom has no matchMedia; the theme provider reads it for the system's colour scheme, light here,
  // and subscribes through the older addListener.
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addListener: () => undefined,
    removeListener: () => undefined,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.className = '';
});

describe('ModeSwitcher', () => {
  it('switches the page from the system theme to dark, and back', async () => {
    render(
      <AppProviders>
        <ModeSwitcher />
      </AppProviders>,
    );
    const toggle = screen.getByRole('button', { name: 'Toggle theme' });

    await waitFor(() => expect(document.documentElement.classList.contains('light')).toBe(true));

    fireEvent.click(toggle);
    await waitFor(() => expect(document.documentElement.classList.contains('dark')).toBe(true));

    fireEvent.click(toggle);
    await waitFor(() => expect(document.documentElement.classList.contains('light')).toBe(true));
  });
});
```

(The specs run in jsdom and drive the components with `fireEvent`, as the app's other component specs do. The globals jsdom lacks, `matchMedia` and `IntersectionObserver`, are stubbed per spec with `vi.stubGlobal` and removed after each case, so no other spec runs under them. The mode switcher is rendered inside `AppProviders`, the provider the app renders, so the case also holds the provider's `attribute="class"`.)

Run: `pnpm exec vitest run src/routes src/lib/page-tree.spec.ts src/components/navigation src/components/general 2>&1 | grep -E 'FAIL|Test Files|^ +Tests|Error:'`
Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| src/lib/page-tree.spec.ts [ src/lib/page-tree.spec.ts ]
Error: Cannot find module './page-tree' imported from <repo>/apps/registry-ui/src/lib/page-tree.spec.ts
 FAIL  |@zeroxsolutions/registry-ui| src/routes/app-routes.spec.ts [ src/routes/app-routes.spec.ts ]
Error: Cannot find module './app-routes' imported from <repo>/apps/registry-ui/src/routes/app-routes.spec.ts
 FAIL  |@zeroxsolutions/registry-ui| src/components/general/mode-switcher.spec.tsx [ src/components/general/mode-switcher.spec.tsx ]
Error: Failed to resolve import "./mode-switcher" from "src/components/general/mode-switcher.spec.tsx". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| src/components/navigation/docs-pager.spec.tsx [ src/components/navigation/docs-pager.spec.tsx ]
Error: Failed to resolve import "./docs-pager" from "src/components/navigation/docs-pager.spec.tsx". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| src/components/navigation/docs-sidebar.spec.tsx [ src/components/navigation/docs-sidebar.spec.tsx ]
Error: Failed to resolve import "./docs-sidebar" from "src/components/navigation/docs-sidebar.spec.tsx". Does the file exist?
 FAIL  |@zeroxsolutions/registry-ui| src/components/navigation/docs-toc.spec.tsx [ src/components/navigation/docs-toc.spec.tsx ]
Error: Failed to resolve import "./docs-toc" from "src/components/navigation/docs-toc.spec.tsx". Does the file exist?
 Test Files  6 failed (6)
      Tests  no tests
```

- [ ] **Step 3: The route units, the page-tree groups and the loader's base URL**

`apps/registry-ui/src/routes/app-routes.ts`:

```ts
import { createStaticRoute } from '@zeroxsolutions/routing';

/** The registry's home page. */
export const homeRoute = createStaticRoute('/', () => '/');

/** The docs; the content loader serves every page beneath this path. */
export const docsRoute = createStaticRoute('/docs', () => '/docs');
```

`apps/registry-ui/src/lib/page-tree.ts`:

```ts
import type { Item, Node, Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

/** A run of pages under one label, as the docs navigation lists them. */
export interface PageTreeGroup {
  /** The separator's or the folder's name; none for pages the tree lists before either. */
  name?: ReactNode;
  pages: Item[];
}

/**
 * The tree's pages in the groups its `meta.json` files declare, in tree order. A separator opens a
 * group under its name; a folder is a group of its index page and its own pages, followed by the
 * groups of the folders inside it. A group with no page is dropped.
 */
export function pageTreeGroups(tree: Root): PageTreeGroup[] {
  const groups: PageTreeGroup[] = [];

  function collect(nodes: Node[], name?: ReactNode, index?: Item): void {
    let group: PageTreeGroup = { name, pages: index ? [index] : [] };
    groups.push(group);
    for (const node of nodes) {
      if (node.type === 'page') {
        group.pages.push(node);
        continue;
      }
      if (node.type === 'folder') collect(node.children, node.name, node.index);
      group = { name: node.type === 'separator' ? node.name : undefined, pages: [] };
      groups.push(group);
    }
  }

  collect(tree.children);
  return groups.filter((group) => group.pages.length > 0);
}
```

(The sidebar and the mobile menu both list these groups, and Task 7's command menu is the third reader, so it is its own module. Upstream's `lib/page-tree.ts` does the same job for its radix/base folders.)

In `apps/registry-ui/src/lib/source.ts`, replace the file with:

```ts
import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';

import { docsRoute } from '@/routes/app-routes';

export const source = loader({
  baseUrl: docsRoute.build(),
  source: docs.toFumadocsSource(),
});
```

- [ ] **Step 4: The provider and the shell's components**

`apps/registry-ui/src/providers/app-providers.tsx`:

```tsx
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * The providers every page renders inside. The theme is a class on `<html>`, which the stylesheet's
 * `dark` variant reads; left unset, the provider follows the system's colour scheme.
 */
function AppProviders({ children }: { children: ReactNode }): ReactNode {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

export { AppProviders };
```

`apps/registry-ui/src/components/general/mode-switcher.tsx`:

```tsx
'use client';

import { SunMoonIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ComponentProps, ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

/** A button that switches the site between its light and dark theme. */
function ModeSwitcher(props: ComponentProps<typeof Button>): ReactNode {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      {...props}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <SunMoonIcon />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { ModeSwitcher };
```

`apps/registry-ui/src/components/navigation/docs-sidebar.tsx`:

```tsx
'use client';

import { isMatch } from '@zeroxsolutions/routing';
import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { pageTreeGroups } from '@/lib/page-tree';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/registry/bases/base-ui/ui/sidebar';

interface DocsSidebarProps extends ComponentProps<typeof Sidebar> {
  /** The docs page tree; its separators and folders become the sidebar's groups. */
  tree: Root;
}

/**
 * The docs' page list, grouped as the content's `meta.json` files order it, with the current page marked.
 * It carries its own provider, whose wrapper is a full-height flex box: the sidebar never collapses, so
 * nothing outside it reads the provider, and the wrapper takes the height its container gives it.
 */
function DocsSidebar({ tree, ...props }: DocsSidebarProps): ReactNode {
  const pathname = usePathname();

  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" {...props}>
        <SidebarContent>
          {pageTreeGroups(tree).map((group) => (
            <SidebarGroup key={group.pages[0]?.url}>
              {group.name ? <SidebarGroupLabel>{group.name}</SidebarGroupLabel> : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.pages.map((page) => {
                    const current = isMatch(page.url, pathname);
                    return (
                      <SidebarMenuItem key={page.url}>
                        <SidebarMenuButton
                          isActive={current}
                          render={<Link href={page.url} aria-current={current ? 'page' : undefined} />}
                        >
                          {page.name}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

export { DocsSidebar };
```

`apps/registry-ui/src/components/navigation/docs-toc.tsx`:

```tsx
'use client';

import { AnchorProvider, useActiveAnchor, type TableOfContents, type TOCItemType } from 'fumadocs-core/toc';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface DocsTocProps extends ComponentProps<'nav'> {
  /** The page's headings, as the MDX compiler lists them. */
  toc: TableOfContents;
}

/** The page's headings as in-page links, with the heading in view marked. Renders nothing for a page without one. */
function DocsToc({ toc, className, ...props }: DocsTocProps): ReactNode {
  if (toc.length === 0) return null;

  return (
    <AnchorProvider toc={toc}>
      <nav aria-label="On this page" className={cn('flex flex-col gap-2 text-sm', className)} {...props}>
        <p className="text-muted-foreground text-xs font-medium">On this page</p>
        {toc.map((item) => (
          <DocsTocLink key={item.url} item={item} />
        ))}
      </nav>
    </AnchorProvider>
  );
}

function DocsTocLink({ item }: { item: TOCItemType }): ReactNode {
  const active = useActiveAnchor() === item.url.slice(1);

  return (
    <a
      href={item.url}
      aria-current={active ? 'location' : undefined}
      data-active={active}
      data-depth={item.depth}
      className="text-muted-foreground hover:text-foreground data-[active=true]:text-foreground text-[0.8rem] transition-colors data-[active=true]:font-medium data-[depth=3]:pl-4 data-[depth=4]:pl-6"
    >
      {item.title}
    </a>
  );
}

export { DocsToc };
```

`apps/registry-ui/src/components/navigation/docs-pager.tsx`:

```tsx
import { findNeighbour, type Root } from 'fumadocs-core/page-tree';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';

interface DocsPagerProps extends ComponentProps<'nav'> {
  /** The docs page tree, read in order across its folders. */
  tree: Root;
  /** The current page's URL. */
  url: string;
}

/** Links to the page before and the page after the current one. Renders nothing for a page with neither. */
function DocsPager({ tree, url, className, ...props }: DocsPagerProps): ReactNode {
  const { previous, next } = findNeighbour(tree, url);
  if (!previous && !next) return null;

  return (
    <nav aria-label="Pager" className={cn('flex items-center justify-between gap-2', className)} {...props}>
      {previous ? (
        <Link href={previous.url} rel="prev" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
          <ArrowLeftIcon data-icon="inline-start" />
          <span className="sr-only">Previous: </span>
          {previous.name}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.url} rel="next" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
          <span className="sr-only">Next: </span>
          {next.name}
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      ) : null}
    </nav>
  );
}

export { DocsPager };
```

`apps/registry-ui/src/components/navigation/mobile-nav.tsx`:

```tsx
'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { pageTreeGroups } from '@/lib/page-tree';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';

/** The docs' page list behind a menu button, for a screen too narrow for the sidebar. A link closes it. */
function MobileNav({ tree }: { tree: Root }): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" />}>
        <MenuIcon />
        <span className="sr-only">Menu</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-(--available-height) w-64 overflow-y-auto">
        <nav aria-label="Docs" className="flex flex-col gap-4">
          {pageTreeGroups(tree).map((group) => (
            <div key={group.pages[0]?.url} className="flex flex-col gap-1">
              {group.name ? <p className="text-muted-foreground text-xs font-medium">{group.name}</p> : null}
              {group.pages.map((page) => (
                <Link key={page.url} href={page.url} onClick={() => setOpen(false)} className="py-1 font-medium">
                  {page.name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </PopoverContent>
    </Popover>
  );
}

export { MobileNav };
```

`apps/registry-ui/src/components/layout/site-header.tsx`:

```tsx
import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { ModeSwitcher } from '@/components/general/mode-switcher';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { docsRoute, homeRoute } from '@/routes/app-routes';

interface SiteHeaderProps extends ComponentProps<'header'> {
  /** The docs page tree, which the menu lists on a narrow screen. */
  tree: Root;
}

/** The bar across the top of every page: the site's name, its sections, and the theme switch. */
function SiteHeader({ tree, className, ...props }: SiteHeaderProps): ReactNode {
  return (
    <header className={cn('bg-background sticky top-0 z-50 w-full border-b', className)} {...props}>
      <div className="flex h-(--header-height) items-center gap-2 px-4 md:px-6">
        <div className="lg:hidden">
          <MobileNav tree={tree} />
        </div>
        <Link href={homeRoute.build()} className="font-semibold">
          ZeroXSolutions UI
        </Link>
        <nav aria-label="Main" className="hidden items-center lg:flex">
          <Link href={docsRoute.build()} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Docs
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}

export { SiteHeader };
```

`apps/registry-ui/src/components/layout/site-footer.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/** The strip across the foot of every page: what the registry is built from. */
function SiteFooter({ className, ...props }: ComponentProps<'footer'>): ReactNode {
  return (
    <footer className={cn('border-t', className)} {...props}>
      <p className="text-muted-foreground px-4 py-6 text-center text-sm md:px-6">
        Composed from{' '}
        <a href="https://ui.shadcn.com" className="text-foreground font-medium underline underline-offset-4">
          shadcn/ui
        </a>{' '}
        primitives on{' '}
        <a href="https://base-ui.com" className="text-foreground font-medium underline underline-offset-4">
          Base UI
        </a>
        .
      </p>
    </footer>
  );
}

export { SiteFooter };
```

(The footer names no GitHub link, where upstream's does: `zeroxsolutions/ui-sdk` is a private repository, read with `gh repo view` on 2026-09-30. The header gets its search box in Task 7.)

- [ ] **Step 5: Watch the specs pass**

Run: `pnpm exec vitest run src/routes src/lib/page-tree.spec.ts src/components/navigation src/components/general 2>&1 | grep -E '✓ \||×|Test Files|^ +Tests'`
Expected:

```
 ✓ |@zeroxsolutions/registry-ui| src/lib/page-tree.spec.ts (2 tests) 4ms
 ✓ |@zeroxsolutions/registry-ui| src/routes/app-routes.spec.ts (3 tests) 4ms
 ✓ |@zeroxsolutions/registry-ui| src/components/navigation/docs-toc.spec.tsx (1 test) 37ms
 ✓ |@zeroxsolutions/registry-ui| src/components/navigation/docs-pager.spec.tsx (2 tests) 42ms
 ✓ |@zeroxsolutions/registry-ui| src/components/general/mode-switcher.spec.tsx (1 test) 54ms
 ✓ |@zeroxsolutions/registry-ui| src/components/navigation/docs-sidebar.spec.tsx (1 test) 37ms
 Test Files  6 passed (6)
      Tests  10 passed (10)
```

(Measured red by a production edit: the sidebar marking by prefix, `pathname.startsWith(page.url)`, fails `marks the current page` with `expected 'page' to be null`, since `/docs` then lights on its children; `pageTreeGroups` opening a new group only at a separator fails both cases, `expected [ { name: undefined, …(1) }, …(3) ] to deeply equal [ { name: undefined, …(1) }, …(4) ]` and `expected [ 'Empty' ] to deeply equal [ undefined ]`.)

- [ ] **Step 6: The layouts, the docs page, and the deletions**

`apps/registry-ui/src/app/(app)/layout.tsx`:

```tsx
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { source } from '@/lib/source';

export default function AppLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex min-h-svh flex-col [--header-height:--spacing(14)]">
      <SiteHeader tree={source.pageTree} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
```

`apps/registry-ui/src/app/(app)/docs/layout.tsx`:

```tsx
import type { ReactNode } from 'react';

import { DocsSidebar } from '@/components/navigation/docs-sidebar';
import { source } from '@/lib/source';

export default function DocsLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-1 items-start">
      <aside className="sticky top-(--header-height) hidden h-[calc(100svh-var(--header-height))] shrink-0 lg:block">
        <DocsSidebar tree={source.pageTree} className="bg-transparent" />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
```

(The layouts read `source.pageTree` and pass it down, so no component reads the loader itself. `bg-transparent` overrides the sidebar recipe's `bg-sidebar` on purpose, as upstream's docs sidebar does: the docs column sits on the page background.)

In `apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx`, add two imports above `import { source } from '@/lib/source';`:

```tsx
import { DocsPager } from '@/components/navigation/docs-pager';
import { DocsToc } from '@/components/navigation/docs-toc';
```

and replace the returned `<article>` with:

```tsx
return (
  <div className="flex items-start gap-10 px-6 py-10">
    <article className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{page.data.title}</h1>
        <p className="text-muted-foreground">{page.data.description}</p>
      </header>
      <Body components={mdxComponents} />
      <DocsPager tree={source.pageTree} url={page.url} className="mt-6 border-t pt-6" />
    </article>
    <aside className="sticky top-[calc(var(--header-height)+--spacing(10))] hidden w-56 shrink-0 xl:block">
      <DocsToc toc={page.data.toc} />
    </aside>
  </div>
);
```

Replace `apps/registry-ui/src/app/layout.tsx` with (the file was not in Prettier's format; this is the formatted file the hook would write):

```tsx
import type { Metadata } from 'next';

import { AppProviders } from '@/providers/app-providers';

import './global.css';

export const metadata: Metadata = {
  title: 'ZeroXSolutions UI',
  description: 'Base UI components and blocks, distributed as a shadcn registry.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme provider sets the theme class on <html> before hydration, so the server's markup differs.
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
```

In `apps/registry-ui/registry/registry.spec.ts`, `familyFiles()` loses the clause that skipped the docs parts:

```ts
/** Every family file: a component under a kind folder or a block, specs left out. */
function familyFiles(): string[] {
  return ['components', 'blocks']
    .flatMap((dir) =>
      readdirSync(join(APP, BASE, dir), { recursive: true, encoding: 'utf8' }).map((path) => `${BASE}/${dir}/${path}`),
    )
    .filter((path) => FAMILY.test(path) && !path.endsWith('.spec.tsx'))
    .sort();
}
```

Run (from the repo root):

```bash
git rm -r -q apps/registry-ui/registry/bases/base-ui/components/docs apps/registry-ui/src/app/api/hello
grep -rn 'components/docs\|api/hello' apps/registry-ui/src apps/registry-ui/registry apps/registry-ui-e2e/src; echo "exit $?"
```

Expected: `exit 1` (nothing names either path any more).

Run: `pnpm exec vitest run registry/registry.spec.ts 2>&1 | grep -E 'Test Files|^ +Tests'`
Expected:

```
 Test Files  1 passed (1)
      Tests  27 passed (27)
```

- [ ] **Step 7: Keep the theme script whole in the worker, and check a page loads dark before it hydrates**

In `apps/registry-ui/wrangler.jsonc`, after the `"compatibility_flags"` line:

```jsonc
  // next-themes inlines its theme script from the function's own source. With the bundler's name-keeping
  // on, a page rendered in the worker carries a script calling `__name`, which the browser never
  // defines, so it throws and the theme is set only after hydration.
  "keep_names": false,
```

`apps/registry-ui-e2e/src/theme.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

/** `--background` under `.dark`, `oklch(0.145 0 0)` in the stylesheet, which the build compiles to `lab()`. */
const DARK_BACKGROUND = 'lab(2.75381 0 0)';

test.use({ colorScheme: 'dark' });

test('with a dark colour scheme and the app bundles blocked, a page loads dark', async ({ page }) => {
  // Nothing hydrates, so only the theme script inlined in the page can have set the theme.
  await page.route('**/_next/static/**/*.js', (route) => route.abort());
  await page.goto('/docs');

  await expect(page.getByRole('banner')).toHaveCSS('background-color', DARK_BACKGROUND);
});
```

(The page's own inline scripts still run; only the app's bundles are blocked, so React never hydrates and whatever colour the header has was set by the theme script before the first paint. The value is what Chromium, Firefox and WebKit all report: the built stylesheet declares `.dark{--background:lab(2.75381% 0 0)}` beside a `#0a0a0a` fallback. The light theme reports `lab(100 0 0)`, measured with the provider's `attribute="class"` removed: 3 failed, `Expected: "lab(2.75381 0 0)"`, `Received: "lab(100 0 0)"`.)

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache 2>&1 | grep -E ' passed| failed|Successfully ran'`
Expected:

```
  9 passed (31.7s)
 NX   Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on
```

(Nine: Task 4's two tests and this one, in three browsers. The build also prints the three `ERROR Failed to copy` lines Task 5 recorded, unchanged. The case passes without the `keep_names` line too, because `/docs` is prerendered by `next build`, which adds no `__name`. What the line does was measured on a throwaway `force-dynamic` page, not committed: without it the worker's HTML for that page held `__name(k4, "k4");` inside the theme script, and with it no `__name`. After the run, `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing.)

- [ ] **Step 8: Run the specs, the suite, the type check, lint, format and the builds**

Run (from `apps/registry-ui`; prettier and nx from the repo root):

```bash
pnpm exec vitest run src/routes src/lib/page-tree.spec.ts src/components/navigation src/components/general registry/registry.spec.ts 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t6.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t6.log"; grep -c 'not wrapped in act' "$S/vt-t6.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t6.log" 2>&1; grep -c 'error TS' "$S/tsc-t6.log"
pnpm exec eslint src/routes src/lib/page-tree.ts src/lib/page-tree.spec.ts src/lib/source.ts src/providers src/components/general src/components/navigation src/components/layout 'src/app/(app)/layout.tsx' 'src/app/(app)/docs/layout.tsx' 'src/app/(app)/docs/[[...slug]]/page.tsx' src/app/layout.tsx registry/registry.spec.ts 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
(cd ../registry-ui-e2e && pnpm exec eslint src/theme.spec.ts 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)')
(cd ../.. && pnpm exec prettier --check apps/registry-ui/src/routes apps/registry-ui/src/lib apps/registry-ui/src/providers apps/registry-ui/src/components/general apps/registry-ui/src/components/navigation apps/registry-ui/src/components/layout 'apps/registry-ui/src/app/(app)' apps/registry-ui/src/app/layout.tsx apps/registry-ui/registry/registry.spec.ts apps/registry-ui/wrangler.jsonc apps/registry-ui/package.json apps/registry-ui-e2e/src/theme.spec.ts 2>&1 | tail -1)
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:build --skip-nx-cache 2>&1 | grep -E '○ /|● /|/docs/\[|Successfully ran')
rm -rf "$S/r-t6"; pnpm exec shadcn build -o "$S/r-t6" > "$S/sb-t6.log" 2>&1; tail -1 "$S/sb-t6.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  7 passed (7)
      Tests  37 passed (37)
 Test Files  86 passed (86)
      Tests  546 passed (546)
0
0
All matched files use Prettier code style!
┌ ○ /
├ ○ /_not-found
└   /docs/[[...slug]]
  └ ● /docs
 NX   Successfully ran target build for project @zeroxsolutions/registry-ui and 6 tasks it depends on
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(eslint prints no problem line in either project. 537 after Task 5, less the deleted `installation.spec.tsx`'s one case, plus the 10 new = 546, in 81 - 1 + 6 = 86 files. `/api/hello` is gone from the route table. The e2e suite ran in Step 7, and it builds the worker through `wrangler:build`.)

- [ ] **Step 9: Commit**

`$S/msg-t6.txt`:

```
feat(registry-ui): add the docs shell and the site theme

Why: the docs pages had no way around them: no header, sidebar, table
of contents or pager, and no dark theme. The shell composes the
registry's own primitives, so the site shows base-nova, and it replaces
the unpublished components/docs parts and the scaffold's api/hello.
keep_names is off so the theme script a worker-rendered page inlines
does not call a helper the browser lacks.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
A=apps/registry-ui
git add $A/src/routes $A/src/lib/page-tree.ts $A/src/lib/page-tree.spec.ts $A/src/providers $A/src/components/general $A/src/components/navigation $A/src/components/layout "$A/src/app/(app)/layout.tsx" "$A/src/app/(app)/docs/layout.tsx" apps/registry-ui-e2e/src/theme.spec.ts
git commit -q -F "$S/msg-t6.txt" -- $A/src/routes $A/src/lib $A/src/providers $A/src/components/general $A/src/components/navigation $A/src/components/layout "$A/src/app/(app)" $A/src/app/layout.tsx $A/src/app/api/hello $A/registry/bases/base-ui/components/docs $A/registry/registry.spec.ts $A/wrangler.jsonc $A/package.json pnpm-lock.yaml apps/registry-ui-e2e/src/theme.spec.ts
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects and 3 tasks they depend on`; the log shows the subject above; `git status --short` prints nothing.

### Task 7: Search: the static index and the command menu

Spec (c) Part 2, the `/api/search` row of "Routes", the `command-menu.tsx` row of "Shell", and the Tests section's command-menu spec and e2e case. `src/app/api/search/route.ts` exports the whole search index once, at build, with `fumadocs-core`'s `staticGET`, and the header's command menu downloads it on the first query and searches it in the browser with `staticClient` from `fumadocs-core/search/client/orama-static` (the client adapter `useDocsSearch` takes as `client`; read in the installed 16.15.17's `dist/client-*.d.ts`). This is fumadocs' static mode, which its search docs give for a static site (`staticGET: GET`, `revalidate = false`, `staticClient()`), where upstream's `apps/v4/app/api/search/route.ts` runs a search per request (`export const { GET } = createFromSource(source)`, read 2026-09-29). Every route here is fixed at build, and OpenNext's static-assets cache writes nothing, so a per-request search route has nowhere to cache.

`revalidate = false` is what makes the handler static. Without it, the build's route table reads `ƒ /api/search`, a handler run on every request; with it, `○ /api/search` (both measured with `next build` on this tree).

The command menu follows upstream's `components/command-menu.tsx` (read 2026-09-30) at a smaller size: a button in the header, `Ctrl+K`, `Cmd+K` or `/` opens a dialog with this registry's `command` primitives; with no query it lists the docs' pages in the sidebar's groups (`pageTreeGroups` from Task 6), and with one it lists what the index finds, each result going to its page or heading. Four choices differ from upstream. The shortcut opens and never toggles, since the dialog closes on Escape; a toggle would close the dialog when a second press lands. `Command` does not filter (`shouldFilter={false}`), because the index already chose the results. A result's `content` carries each matched term in `<mark>` (fumadocs' `highlightMarkdown`, `dist/search/index.js`), so the item draws the marks bold, inside one span, where upstream prints the string: rendered bare, the item's flex layout split the text at every mark (seen in a screenshot of the worker preview). The keyboard hint reads `Ctrl K` in plain ASCII.

The component spec fakes the network at the request layer with `msw`: a handler answers `GET /api/search` with an index that `fumadocs-core`'s own `createSearchAPI` exports, so the menu's real client fetches, loads and searches it. `msw` is new to this repo; 3.0.0 is npm `latest` (published 2026-09-28, read 2026-09-30), it runs no install script, and its peers (`vite`, `typescript`, `graphql`) are all optional. One API change from 2.x matters and fails silently under vitest: the unhandled-request option is now `onUnhandledFrame`, and the 2.x name `onUnhandledRequest` is ignored at run time and caught only by `tsc` (`TS2353: ... 'onUnhandledRequest' does not exist in type ...`, measured through `next build`'s type check).

**Files:**

- Create: `apps/registry-ui/src/app/api/search/route.ts`, `apps/registry-ui/src/components/navigation/command-menu.tsx`, `apps/registry-ui/src/components/navigation/command-menu.spec.tsx`, `apps/registry-ui-e2e/src/search.spec.ts`
- Modify: `apps/registry-ui/package.json` and `pnpm-lock.yaml` (by `pnpm add`), `apps/registry-ui/src/components/layout/site-header.tsx`

**Interfaces:**

- Consumes: the Task 6 tree (`source`, `pageTreeGroups`, `SiteHeader`, the e2e suite; suite 86 files, 546 tests; `tsc` prints no error line); the vendored `ui/command.tsx` (`Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`), `ui/kbd.tsx`, `ui/button.tsx`; `fumadocs-core/search/server` (`createFromSource`, `createSearchAPI`), `fumadocs-core/search/client` (`useDocsSearch`), `fumadocs-core/search/client/orama-static` (`staticClient`).
- Produces:
  - route `GET /api/search`: the exported index as JSON, prerendered (`○`), `revalidate = false`
  - `CommandMenu({ tree }: { tree: Root })` (client), in `SiteHeader` from `md` up
  - dev dependency `msw` 3.0.0 on `@zeroxsolutions/registry-ui`
- Removed: nothing.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or name a repo-root file. Expected output is shown without the terminal control codes (colour, cursor), which nx, vitest and Playwright write into the logs.

- [ ] **Step 1: Add msw**

Run: `pnpm add -D --save-exact msw@3.0.0 2>&1 | grep -c 'unmet peer'`
Expected: `0`

Run: `git diff package.json | grep '^[-+] '`
Expected:

```
+    "msw": "3.0.0",
```

(One declarer, the app whose spec uses it, so a plain pin in its `devDependencies` and no catalog entry.)

- [ ] **Step 2: Write the spec and watch it fail**

`apps/registry-ui/src/components/navigation/command-menu.spec.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { createSearchAPI } from 'fumadocs-core/search/server';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandMenu } from './command-menu';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => undefined }) }));

const tree: Root = { name: 'Docs', children: [{ type: 'page', name: 'Introduction', url: '/docs' }] };

/** The search index `/api/search` exports at build, here built from one page by the same library. */
const searchAPI = createSearchAPI('advanced', {
  indexes: [
    {
      id: '/docs/components/status-indicator',
      title: 'Status Indicator',
      description: 'A dot and a label for a status.',
      url: '/docs/components/status-indicator',
      structuredData: { headings: [], contents: [] },
    },
  ],
});

const server = setupServer(http.get('/api/search', () => searchAPI.staticGET()));

// jsdom has no ResizeObserver; the command list measures its height with one.
class FakeResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeAll(() => {
  // jsdom does not scroll; the command list scrolls the selected item into view.
  Element.prototype.scrollIntoView = () => undefined;
  server.listen({ onUnhandledFrame: 'error' });
});
beforeEach(() => vi.stubGlobal('ResizeObserver', FakeResizeObserver));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

describe('CommandMenu', () => {
  it('opens on Ctrl+K and lists the pages the search index finds', async () => {
    render(<CommandMenu tree={tree} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'status' } });

    expect(await screen.findByRole('option', { name: 'Status Indicator' })).toBeTruthy();
  });
});
```

(`useRouter` is the one module faked: the case never selects a result. The client fetches the relative `/api/search`, which msw's interceptor resolves against jsdom's `location`. The `scrollIntoView` assignment follows `emoji-picker.spec.tsx`; vitest gives each spec file its own environment, so it does not reach another file.)

Run: `pnpm exec vitest run src/components/navigation/command-menu.spec.tsx 2>&1 | grep -E 'FAIL|Test Files|^ +Tests|Error:'`
Expected:

```
 FAIL  |@zeroxsolutions/registry-ui| src/components/navigation/command-menu.spec.tsx [ src/components/navigation/command-menu.spec.tsx ]
Error: Failed to resolve import "./command-menu" from "src/components/navigation/command-menu.spec.tsx". Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```

- [ ] **Step 3: The static index route and the command menu**

`apps/registry-ui/src/app/api/search/route.ts`:

```ts
import { createFromSource } from 'fumadocs-core/search/server';

import { source } from '@/lib/source';

// Unset, the handler runs on every request; `false` runs it once at build, so the worker serves the
// exported index as a file and the browser searches it.
export const revalidate = false;

export const { staticGET: GET } = createFromSource(source);
```

`apps/registry-ui/src/components/navigation/command-menu.tsx`:

```tsx
'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { pageTreeGroups } from '@/lib/page-tree';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/bases/base-ui/ui/command';
import { Kbd, KbdGroup } from '@/registry/bases/base-ui/ui/kbd';

/** Reads the index `/api/search` exports at build, once, and searches it in the browser. */
const searchClient = staticClient();

/** Whether a key press lands in a field the user is typing into, where `/` is a character and not a shortcut. */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * A search box that opens on Ctrl+K, Cmd+K or `/`, and closes on Escape. Empty, it lists the docs'
 * pages; with a query, the pages and headings the search index finds. Choosing one navigates to it.
 */
function CommandMenu({ tree }: { tree: Root }): ReactNode {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { search, setSearch, query } = useDocsSearch({ client: searchClient });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !isTyping(event.target))) {
        event.preventDefault();
        setOpen(true);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function go(url: string): void {
    setOpen(false);
    router.push(url);
  }

  const results = search.trim() && Array.isArray(query.data) ? query.data : [];

  return (
    <>
      <Button variant="outline" className="text-muted-foreground w-full justify-start" onClick={() => setOpen(true)}>
        <SearchIcon data-icon="inline-start" />
        Search docs...
        <KbdGroup className="ml-auto">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search docs" description="Find a page or a heading.">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search docs..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{query.isLoading ? 'Searching...' : 'No results found.'}</CommandEmpty>
            {search.trim() ? (
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <CommandItem key={result.id} value={result.id} onSelect={() => go(result.url)}>
                    <CommandMenuResult content={result.content} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              pageTreeGroups(tree).map((group) => (
                <CommandGroup key={group.pages[0]?.url} heading={group.name}>
                  {group.pages.map((page) => (
                    <CommandItem key={page.url} value={page.url} onSelect={() => go(page.url)}>
                      {page.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

/**
 * A result's text on one line; the index marks each matched term with `<mark>`, drawn bold here. One
 * span holds it all, so the item's flex layout does not split the text at each mark.
 */
function CommandMenuResult({ content }: { content: string }): ReactNode {
  return (
    <span className="line-clamp-1">
      {content.split(/<mark>(.*?)<\/mark>/g).map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="text-foreground bg-transparent font-semibold">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export { CommandMenu };
```

(The vendored `CommandDialog` wraps its children in `DialogContent` and adds no `Command` of its own, so the menu passes one. `justify-start` on the button overrides the recipe's `justify-center` on purpose, as upstream's search button does, so the label and the hint read left to right; `w-full` fills the slot the header gives it.)

- [ ] **Step 4: Watch the spec pass**

Run: `pnpm exec vitest run src/components/navigation/command-menu.spec.tsx 2>&1 | grep -E '✓ \||×|Test Files|^ +Tests'`
Expected:

```
 ✓ |@zeroxsolutions/registry-ui| src/components/navigation/command-menu.spec.tsx (1 test) 211ms
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

(Measured red by an edit each way: the shortcut on `'j'` fails with `Unable to find role="combobox"`, and the handler's index titled `Spinner` instead fails with `Unable to find role="option" and name "Status Indicator"`, so the listed option comes from the index the handler served.)

- [ ] **Step 5: Write the e2e case and watch it fail**

`apps/registry-ui-e2e/src/search.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('the command menu finds a heading and goes to it', async ({ page }) => {
  await page.goto('/docs');

  // The shortcut listens only once the page has hydrated, so it is pressed until the search opens.
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('combobox').fill('install');
  await page.getByRole('option', { name: 'Install an item' }).click();

  await expect(page).toHaveURL(/\/docs#install-an-item$/);
});
```

(The key is a lowercase `k`: Playwright's `ControlOrMeta+K` sends `event.key` `'K'`, which the handler does not take, measured in Chromium: 0 dialogs after `+K`, 1 after `+k`. Pressing until the dialog shows is safe only because the shortcut opens and never toggles. `Install an item` is `index.mdx`'s one heading; the spec's own case, finding Status Indicator, needs that page, which Task 8 writes.)

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache 2>&1 | grep -E ' passed| failed|Locator:|element\(s\)'`
Expected:

```
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('dialog')
    Error: element(s) not found
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('dialog')
    Error: element(s) not found
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('dialog')
    Error: element(s) not found
  3 failed
  9 passed (1.0m)
 NX   Running target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on failed
```

(The new case fails in each of the three browsers: the header does not render the menu yet, so no key press opens a dialog. The nine that pass are Task 6's suite.)

- [ ] **Step 6: Put the menu in the header**

In `apps/registry-ui/src/components/layout/site-header.tsx`, add the import below the `ModeSwitcher` import:

```tsx
import { CommandMenu } from '@/components/navigation/command-menu';
```

change the prop's and the component's docblocks to:

```tsx
/** The docs page tree, which the search lists before a query and the menu lists on a narrow screen. */
```

```tsx
/** The bar across the top of every page: the site's name, its sections, the search and the theme switch. */
```

and replace the trailing `<div className="ml-auto flex items-center gap-1">` block with:

```tsx
<div className="ml-auto flex items-center gap-2">
  <div className="hidden w-56 md:block">
    <CommandMenu tree={tree} />
  </div>
  <ModeSwitcher />
</div>
```

(The wrapper places the search and hides it below `md`, as upstream's header does; the shortcut still opens it there, and the mobile menu lists the pages.)

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache 2>&1 | grep -E ' passed| failed|Successfully ran'`
Expected:

```
  12 passed (35.5s)
 NX   Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on
```

(After the run, `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing.)

- [ ] **Step 7: Run the spec, the suite, the type check, lint, format and the builds**

Run (from `apps/registry-ui`; prettier and nx from the repo root):

```bash
pnpm exec vitest run src/components/navigation/command-menu.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t7.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t7.log"; grep -c 'not wrapped in act' "$S/vt-t7.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t7.log" 2>&1; grep -c 'error TS' "$S/tsc-t7.log"
pnpm exec eslint src/app/api/search/route.ts src/components/navigation/command-menu.tsx src/components/navigation/command-menu.spec.tsx src/components/layout/site-header.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
(cd ../registry-ui-e2e && pnpm exec eslint src/search.spec.ts 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)')
(cd ../.. && pnpm exec prettier --check apps/registry-ui/src/app/api/search/route.ts apps/registry-ui/src/components/navigation/command-menu.tsx apps/registry-ui/src/components/navigation/command-menu.spec.tsx apps/registry-ui/src/components/layout/site-header.tsx apps/registry-ui/package.json apps/registry-ui-e2e/src/search.spec.ts 2>&1 | tail -1)
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:build --skip-nx-cache 2>&1 | grep -E '○ /|● /|/docs/\[|Successfully ran')
rm -rf "$S/r-t7"; pnpm exec shadcn build -o "$S/r-t7" > "$S/sb-t7.log" 2>&1; tail -1 "$S/sb-t7.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  1 passed (1)
 Test Files  87 passed (87)
      Tests  547 passed (547)
0
0
All matched files use Prettier code style!
┌ ○ /
├ ○ /_not-found
├ ○ /api/search
└   /docs/[[...slug]]
  └ ● /docs
 NX   Successfully ran target build for project @zeroxsolutions/registry-ui and 6 tasks it depends on
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(eslint prints no problem line in either project. 546 after Task 6 + 1 = 547, in 87 files. `○ /api/search` is the prerendered index; without `revalidate = false` the line reads `ƒ /api/search`.)

- [ ] **Step 8: Commit**

`$S/msg-t7.txt`:

```
feat(registry-ui): search the docs from a command menu

Why: the docs had no search. The index is exported once at build and
searched in the browser, because every route here is fixed at build and
the worker's cache writes nothing, so a search run per request has
nowhere to live. The menu opens on Ctrl+K, Cmd+K or / and lists the
pages until a query is typed.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
A=apps/registry-ui
git add $A/src/app/api/search/route.ts $A/src/components/navigation/command-menu.tsx $A/src/components/navigation/command-menu.spec.tsx apps/registry-ui-e2e/src/search.spec.ts
git commit -q -F "$S/msg-t7.txt" -- $A/src/app/api/search $A/src/components/navigation $A/src/components/layout/site-header.tsx $A/package.json pnpm-lock.yaml apps/registry-ui-e2e/src/search.spec.ts
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects and 3 tasks they depend on`; the log shows the subject above; `git status --short` prints nothing.

### Task 8: Pages: one of each kind, the blocks routes, and the content rules that hold them

Spec (c) Part 2, "Content tree", the `/blocks` and `/view/<name>` rows of "Routes", and the Tests section's rules 1 and 3 and their e2e cases. The docs get one page of each kind: `installation.mdx`, the components index, Status Indicator (the composed-item page), Button (the primitive page), AI Provider Picker (the block page) and the icons package page. `/blocks` frames every published block, and `/view/<name>` renders one block alone, which is what the frames and the block page's preview load. The header gains its Components and Blocks links, and the search e2e case now finds Status Indicator, which Task 7 left to this task.

Facts this task rests on, each measured on 2026-09-30:

- `shadcn init --base base --preset nova` (4.21.0) writes a `components.json` with `"style": "base-nova"`. `shadcn add` of the built `status-indicator.json` into that app writes `components/feedback/status-indicator.tsx` and `lib/status-tone.ts`, rewrites the imports to `@/lib/utils` and `@/lib/status-tone`, and adds `--color-success`/`--color-warning` under `@theme inline` and `--success`/`--warning` under `:root` and `.dark`. The block lands in `components/ai-provider-picker.tsx`. `shadcn add utils` writes `lib/utils.ts`. `installation.mdx` and the manual steps state these paths.
- The 23 primitives the published items name as `@shadcn/<x>` (all but `utils`) each answer 200 at `https://ui.shadcn.com/docs/components/base/<x>`. `components/meta.json` lists them under `---Primitives---`: Button as this site's page, the other 22 as links there.
- A `meta.json` link is a page node whose `url` is the other site's (`fumadocs-core` 16.15.17, `dist/dynamic-*.js`, `resolveLink`). The sidebar's `isMatch(page.url, pathname)` throws on it: `TypeError: Missing parameter name at index 6: https://ui.shadcn.com/docs/components/base/badge`, which would fail the build at the first docs page. `findNeighbour` counts it as a page, so the pager on Button would have linked "Next: Badge" off the site. Both now step over a link that leaves the site (`isExternal`, read the way fumadocs' own `Link` reads it).
- The item pages rest on the examples index. A composed item ships more files than its component (Status Indicator also ships `types/status-tone.ts`), and the manual steps copy each one. The index now records every file an item ships, and `ComponentSource` takes a `file` naming one of them; it throws for a file the item does not ship, like it does for a name the index lacks.

Decided here, where the spec left it open:

- Kind groups in `components/meta.json` are separators (`---Feedback---`), not folders, so every page stays at `/docs/components/<name>` as the spec's content tree and e2e case write it. Only kinds with a page get a separator; the rest arrive with their pages. Rule 1 reads "the primitives listed in `components/meta.json`" as the page entries after `---Primitives---`.
- The block page previews through `/view/<name>` with a `view` prop on `ComponentPreview`: the Preview tab frames the block's page, and the first preview is still `<name>-demo`, which rule 2 requires. `/view/<name>` renders the published block itself (the index holds it under its item name), with its own sample entries.
- The Status Indicator examples are one demo per tone and one for `pulse` (`status-indicator-<variant>.tsx`); the package page's live demo is `icons-demo.tsx`, which lays the icons out in the vendored `Item`, since an icon sets no `data-slot` for the examples spec to find.
- `ComponentsList` (the components index) links an item to its page only where one exists; the other 41 items are listed by title and description until theirs is written. It reads the content loader, which vitest cannot import (`collections/server` loads the MDX), so it has no component spec; the build renders it.
- The root `meta.json` has no Editor entry: there is no editor content to hide yet.

**Files:**

- Create: `apps/registry-ui/content/docs/installation.mdx`, `apps/registry-ui/content/docs/components/{meta.json,index.mdx,status-indicator.mdx,button.mdx}`, `apps/registry-ui/content/docs/blocks/{meta.json,ai-provider-picker.mdx}`, `apps/registry-ui/content/docs/packages/{meta.json,icons.mdx}`, `apps/registry-ui/registry/bases/base-ui/examples/status-indicator-{online,offline,busy,idle,pulse}.tsx`, `apps/registry-ui/registry/bases/base-ui/examples/icons-demo.tsx`, `apps/registry-ui/src/lib/registry.ts`, `apps/registry-ui/src/components/data-display/block-frame.tsx`, `apps/registry-ui/src/components/navigation/components-list.tsx`, `apps/registry-ui/src/app/(app)/blocks/page.tsx`, `apps/registry-ui/src/app/(view)/view/[name]/page.tsx`, `apps/registry-ui-e2e/src/component-page.spec.ts`, `apps/registry-ui-e2e/src/view.spec.ts`
- Modify: `apps/registry-ui/content/docs/meta.json`, `apps/registry-ui/tools/build-examples-index.mts`, `apps/registry-ui/src/components/data-display/{component-source,component-preview}.tsx`, `apps/registry-ui/src/components/layout/site-header.tsx`, `apps/registry-ui/src/components/navigation/{docs-pager,docs-sidebar}.tsx` and their specs, `apps/registry-ui/src/lib/{page-tree,source}.ts`, `apps/registry-ui/src/lib/source.spec.ts`, `apps/registry-ui/src/mdx-components.tsx`, `apps/registry-ui/src/routes/app-routes.ts` and its spec, `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, `apps/registry-ui-e2e/src/search.spec.ts`

**Interfaces:**

- Consumes: the Task 7 tree (suite 87 files, 547 tests; `tsc` prints no error line; e2e 12 passed); `source`, `pageTreeGroups`, `DocsSidebar`, `DocsPager`, `SiteHeader`, `ComponentPreview`, `ComponentSource`, `ComponentPreviewDemo`, the examples index and its target; `@zeroxsolutions/routing` (`createStaticRoute`, `createDynamicRoute`, `isMatch`); `fumadocs-core/page-tree` (`flattenTree`); the vendored `ui/table.tsx` and `ui/item.tsx`.
- Produces:
  - route units `blocksRoute` (`/blocks`) and `viewRoute` (`/view/:name`, `build({ name })`)
  - routes `/blocks` (static) and `/view/[name]` (`force-static`, `dynamicParams = false`, one param per published block)
  - `src/lib/registry.ts`: `PublishedItem`, `publishedItems`, `publishedBlocks`
  - `src/lib/source.ts`: `docsPageUrl(slugs): string` (throws for a missing page)
  - `src/lib/page-tree.ts`: `isExternal(page: Item): boolean`
  - examples index entries `{ name, files: string[] }` (was `{ name, filePath }`); `ComponentSource` prop `file?: string`; `ComponentPreview` prop `view?: string`
  - `BlockFrame({ name, title })`, `ComponentsList()`; MDX map gains `a`, `ul`, the table elements and `ComponentsList`
  - `src/lib/source.spec.ts` rules 1 and 3 (`unnamedPages`, `missingInstallCommands`)
  - header links Docs, Components (`/docs/components`) and Blocks (`/blocks`)
- Removed: the index entry's `filePath` (replaced by `files[0]`).

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or name a repo-root file. Expected output is shown without the terminal control codes (colour, cursor), which nx, vitest and Playwright write into the logs.

- [ ] **Step 1: Write the specs and watch them fail**

In `apps/registry-ui/src/components/navigation/docs-sidebar.spec.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/components/navigation/docs-sidebar.spec.tsx b/apps/registry-ui/src/components/navigation/docs-sidebar.spec.tsx
--- a/apps/registry-ui/src/components/navigation/docs-sidebar.spec.tsx
+++ b/apps/registry-ui/src/components/navigation/docs-sidebar.spec.tsx
@@ -42,4 +42,14 @@ describe('DocsSidebar', () => {
     expect(screen.getByRole('link', { name: 'Introduction' }).getAttribute('aria-current')).toBeNull();
     expect(screen.getByRole('link', { name: 'Button' }).getAttribute('aria-current')).toBeNull();
   });
+
+  it('lists a link to another site, and never marks it', () => {
+    const badge = 'https://ui.shadcn.com/docs/components/base/badge';
+    render(
+      <DocsSidebar tree={{ ...tree, children: [...tree.children, { type: 'page', name: 'Badge', url: badge }] }} />,
+    );
+
+    expect(screen.getByRole('link', { name: 'Badge' }).getAttribute('href')).toBe(badge);
+    expect(screen.getByRole('link', { name: 'Badge' }).getAttribute('aria-current')).toBeNull();
+  });
 });
```

In `apps/registry-ui/src/components/navigation/docs-pager.spec.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/components/navigation/docs-pager.spec.tsx b/apps/registry-ui/src/components/navigation/docs-pager.spec.tsx
--- a/apps/registry-ui/src/components/navigation/docs-pager.spec.tsx
+++ b/apps/registry-ui/src/components/navigation/docs-pager.spec.tsx
@@ -40,4 +40,21 @@ describe('DocsPager', () => {
     );
     expect(screen.queryByRole('link', { name: /^Next/ })).toBeNull();
   });
+
+  it('steps over a link to another site', () => {
+    const withLink: Root = {
+      name: 'Docs',
+      children: [
+        { type: 'page', name: 'Button', url: '/docs/components/button' },
+        { type: 'page', name: 'Badge', url: 'https://ui.shadcn.com/docs/components/base/badge' },
+        { type: 'page', name: 'AI Provider Picker', url: '/docs/blocks/ai-provider-picker' },
+      ],
+    };
+
+    render(<DocsPager tree={withLink} url="/docs/components/button" />);
+
+    expect(screen.getByRole('link', { name: 'Next: AI Provider Picker' }).getAttribute('href')).toBe(
+      '/docs/blocks/ai-provider-picker',
+    );
+  });
 });
```

In `apps/registry-ui/src/routes/app-routes.spec.ts` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/routes/app-routes.spec.ts b/apps/registry-ui/src/routes/app-routes.spec.ts
--- a/apps/registry-ui/src/routes/app-routes.spec.ts
+++ b/apps/registry-ui/src/routes/app-routes.spec.ts
@@ -2,6 +2,7 @@
 import { readdirSync } from 'node:fs';
 import { join } from 'node:path';

+import type { StaticRoute } from '@zeroxsolutions/routing';
 import { describe, expect, it } from 'vitest';

 import * as appRoutes from './app-routes';
@@ -9,9 +10,10 @@ import * as appRoutes from './app-routes';
 const APP_DIR = join(import.meta.dirname, '..', 'app');

 /**
- * Every pathname a page in the app tree answers, read off the tree. A group folder is absent from the
- * URL, a private `_` folder is not routable, and an optional catch-all `[[...x]]` answers its parent's
- * path as well as every path below it.
+ * Every pathname a page in the app tree answers, read off the tree, with a dynamic segment `[x]` spelled
+ * as the route pattern spells it, `:x`. A group folder is absent from the URL, a private `_` folder is
+ * not routable, and an optional catch-all `[[...x]]` answers its parent's path as well as every path
+ * below it.
  */
 function pagePathnames(directory: string, segments: readonly string[] = []): string[] {
   const entries = readdirSync(directory, { withFileTypes: true });
@@ -19,20 +21,28 @@ function pagePathnames(directory: string, segments: readonly string[] = []): str
   for (const entry of entries) {
     if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
     const pathless = entry.name.startsWith('(') || entry.name.startsWith('[[...');
-    found.push(...pagePathnames(join(directory, entry.name), pathless ? segments : [...segments, entry.name]));
+    const segment = entry.name.replace(/^\[(\w+)\]$/, ':$1');
+    found.push(...pagePathnames(join(directory, entry.name), pathless ? segments : [...segments, segment]));
   }
   return found;
 }

 describe('app routes', () => {
   const routes = Object.values(appRoutes);
+  const staticRoutes = routes.filter((route): route is StaticRoute => route.build.length === 0);

   // The pathname and the builder are two independent values, so nothing else pairs them.
-  it.each(routes)('$pathname builds and matches its own pathname', (route) => {
+  it.each(staticRoutes)('$pathname builds and matches its own pathname', (route) => {
     expect(route.build()).toBe(route.pathname);
     expect(route.matcher(route.pathname)).toBeTruthy();
   });

+  it('builds a view path its own pattern reads the name back from', () => {
+    expect(appRoutes.viewRoute.matcher(appRoutes.viewRoute.build({ name: 'ai-provider-picker' }))).toMatchObject({
+      params: { name: 'ai-provider-picker' },
+    });
+  });
+
   it('names only paths a page answers', () => {
     const pages = new Set(pagePathnames(APP_DIR));
```

(The walker now spells `[name]` as `:name`, so a dynamic unit compares with the page that answers it. `build.length === 0` tells a static unit from a dynamic one, whose builder takes its params.)

In `apps/registry-ui/src/lib/source.spec.ts` (a unified diff against the tree before this task):

````diff
diff --git a/apps/registry-ui/src/lib/source.spec.ts b/apps/registry-ui/src/lib/source.spec.ts
--- a/apps/registry-ui/src/lib/source.spec.ts
+++ b/apps/registry-ui/src/lib/source.spec.ts
@@ -44,12 +44,78 @@ function readPageSources(root: string): Record<string, string> {
   );
 }

-/** The names of the components and the block `registry.json` publishes, which an item page is named for. */
-function readItemNames(): Set<string> {
+/** What an item page repeats of its item: the `title` and `description` in `registry.json`. */
+interface ItemText {
+  title: string;
+  description: string;
+}
+
+/** The components and the block `registry.json` publishes, by the name an item page is named for. */
+function readItems(): Map<string, ItemText> {
   const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as {
-    items: { name: string; type: string }[];
+    items: (ItemText & { name: string; type: string })[];
   };
-  return new Set(items.filter((item) => item.type !== 'registry:example').map((item) => item.name));
+  return new Map(
+    items
+      .filter((item) => item.type !== 'registry:example')
+      .map(({ name, title, description }) => [name, { title, description }]),
+  );
+}
+
+/** The pages `components/meta.json` lists after its `---Primitives---` separator, up to the next one. */
+function readPrimitives(root: string): Set<string> {
+  const { pages } = JSON.parse(readFileSync(join(root, 'components/meta.json'), 'utf8')) as { pages: string[] };
+  const after = pages.slice(pages.indexOf('---Primitives---') + 1);
+  const end = after.findIndex((entry) => entry.startsWith('---'));
+  return new Set((end === -1 ? after : after.slice(0, end)).filter((entry) => /^[a-z0-9-]+$/.test(entry)));
+}
+
+/** A page's frontmatter `title` and `description`, each an unquoted value on one line. */
+function readFrontmatter(source: string): Partial<ItemText> {
+  const block = /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
+  const field = (key: string): string | undefined => new RegExp(`^${key}: *(.*)$`, 'm').exec(block)?.[1];
+  return { title: field('title'), description: field('description') };
+}
+
+/** The pages under `components/` and `blocks/` that document one item or primitive each, which leaves out a folder's index. */
+function namedPages(sources: Record<string, string>): [slug: string, name: string, source: string][] {
+  return Object.entries(sources)
+    .filter(([slug]) => /^(components|blocks)\/[^/]+$/.test(slug) && !slug.endsWith('/index'))
+    .map(([slug, source]) => [slug, slug.split('/')[1] ?? '', source]);
+}
+
+/**
+ * Every page under `components/` or `blocks/` that is neither a registry item nor a primitive
+ * `components/meta.json` lists, and every item page whose title or description is not the item's.
+ */
+function unnamedPages(
+  sources: Record<string, string>,
+  items: Map<string, ItemText>,
+  primitives: Set<string>,
+): string[] {
+  return namedPages(sources).flatMap(([slug, name, source]) => {
+    const item = items.get(name);
+    if (!item) return primitives.has(name) ? [] : [`${slug}: is neither a registry item nor a listed primitive`];
+    const { title, description } = readFrontmatter(source);
+    return [
+      ...(title === item.title ? [] : [`${slug}: title is not "${item.title}"`]),
+      ...(description === item.description ? [] : [`${slug}: description is not the item's`]),
+    ];
+  });
+}
+
+/** The command a page installs its subject with: an item by its URL here, a primitive by its name at shadcn. */
+function installCommand(name: string, items: Map<string, ItemText>): string {
+  return items.has(name)
+    ? `npx shadcn@latest add https://ui.zeroxsolutions.com/r/${name}.json`
+    : `npx shadcn@latest add ${name}`;
+}
+
+/** Every item or primitive page with no line that is exactly its install command. */
+function missingInstallCommands(sources: Record<string, string>, items: Map<string, ItemText>): string[] {
+  return namedPages(sources)
+    .filter(([, name, source]) => !source.split('\n').some((line) => line.trim() === installCommand(name, items)))
+    .map(([slug, name]) => `${slug}: has no \`${installCommand(name, items)}\``);
 }

 const NAMED_SOURCE = /<(ComponentPreview|ComponentSource)\b[^>]*?\bname="([^"]+)"/g;
@@ -126,7 +192,7 @@ describe('content/docs', () => {
   });

   it("opens every item page with the item's own demo", () => {
-    expect(misplacedFirstPreviews(readPageSources(CONTENT), readItemNames())).toEqual([]);
+    expect(misplacedFirstPreviews(readPageSources(CONTENT), new Set(readItems().keys()))).toEqual([]);
   });

   it("reports an item page whose first preview is not the item's demo", () => {
@@ -143,4 +209,40 @@ describe('content/docs', () => {
       'components/tag-input',
     ]);
   });
+
+  it("documents only items and listed primitives, and repeats an item's title and description", () => {
+    expect(unnamedPages(readPageSources(CONTENT), readItems(), readPrimitives(CONTENT))).toEqual([]);
+  });
+
+  it('reports a page for nothing published or listed, and an item page that renames its item', () => {
+    const items = new Map([['status-indicator', { title: 'Status Indicator', description: 'A small dot.' }]]);
+    const sources = {
+      'components/index': '---\ntitle: Components\n---',
+      'components/button': '---\ntitle: Button\n---',
+      'components/card': '---\ntitle: Card\n---',
+      'components/status-indicator': '---\ntitle: Status\ndescription: A small dot.\n---',
+    };
+
+    expect(unnamedPages(sources, items, new Set(['button']))).toEqual([
+      'components/card: is neither a registry item nor a listed primitive',
+      'components/status-indicator: title is not "Status Indicator"',
+    ]);
+  });
+
+  it('installs each item by its URL here and each primitive by its name at shadcn', () => {
+    expect(missingInstallCommands(readPageSources(CONTENT), readItems())).toEqual([]);
+  });
+
+  it('reports a page that installs its subject some other way', () => {
+    const items = new Map([['status-indicator', { title: 'Status Indicator', description: 'A small dot.' }]]);
+    const sources = {
+      'components/button': '```bash\nnpx shadcn@latest add button-group\n```',
+      'components/status-indicator': '```bash\nnpx shadcn@latest add status-indicator\n```',
+    };
+
+    expect(missingInstallCommands(sources, items)).toEqual([
+      'components/button: has no `npx shadcn@latest add button`',
+      'components/status-indicator: has no `npx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json`',
+    ]);
+  });
 });
````

(Rule 1 reads frontmatter as one unquoted line per key, which every page here uses; a registry description with `: ` in it would need quoting and a YAML parser. Rule 3 compares whole lines, so `add button-group` does not pass for `add button`.)

Run: `pnpm exec vitest run src/components/navigation/docs-sidebar.spec.tsx src/components/navigation/docs-pager.spec.tsx 2>&1 | grep -E '✓|×|Test Files|^ +Tests|Error'`
Expected:

```
     ✓ links back to the page before and on to the page after, across a folder 33ms
     ✓ links only forward from the first page, and only back from the last 6ms
     × steps over a link to another site 9ms
     ✓ marks the current page, and no other 96ms
     × lists a link to another site, and never marks it 13ms
TestingLibraryElementError: Unable to find an accessible element with the role "link" and name "Next: AI Provider Picker"
 ❯ Object.getElementError ../../node_modules/.pnpm/@testing-library+dom@10.4.0/node_modules/@testing-library/dom/dist/config.js:37:19
TypeError: Missing parameter name at index 6: https://ui.shadcn.com/docs/components/base/badge; visit https://git.new/pathToRegexpError for info
 Test Files  2 failed (2)
      Tests  2 failed | 3 passed (5)
```

Run: `pnpm exec vitest run src/lib/source.spec.ts src/routes/app-routes.spec.ts 2>&1 | grep -E '×|Test Files|^ +Tests|Error'`
Expected:

```
     × builds a view path its own pattern reads the name back from 2ms
     × documents only items and listed primitives, and repeats an item's title and description 3ms
TypeError: Cannot read properties of undefined (reading 'matcher')
Error: ENOENT: no such file or directory, open '<repo>/apps/registry-ui/content/docs/components/meta.json'
 Test Files  2 failed (2)
      Tests  2 failed | 12 passed (14)
```

(The two wrong-fragment cases pass already, because the rules are functions in the spec. They are what a broken rule turns red, measured by an edit each: rule 1 ignoring the primitives list fails both of its cases (`expected [ Array(1) ] to deeply equal []`); rule 1 skipping the title fails `reports a page for nothing published or listed, ...` (`expected [ Array(1) ] to deeply equal [ …(2) ]`); rule 3 matching a substring instead of a whole line fails `reports a page that installs its subject some other way`.)

- [ ] **Step 2: Write the e2e cases and watch them fail**

`apps/registry-ui-e2e/src/component-page.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('a component page previews the item, shows its source, and pages on', async ({ page }) => {
  await page.goto('/docs/components/status-indicator');

  const preview = page.getByRole('tabpanel', { name: 'Preview' }).first();
  await expect(preview.getByText('Connecting')).toBeVisible();

  await page.getByRole('tab', { name: 'Code' }).first().click();
  await expect(page.getByRole('tabpanel', { name: 'Code' }).first()).toContainText('function StatusIndicatorDemo');

  await page.getByRole('link', { name: 'Next: Button' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
});
```

`apps/registry-ui-e2e/src/view.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('/view/ai-provider-picker renders the block alone', async ({ page }) => {
  await page.goto('/view/ai-provider-picker');

  await expect(page.getByText('Anthropic Claude')).toBeVisible();
  await expect(page.getByRole('banner')).toHaveCount(0);
});
```

In `apps/registry-ui-e2e/src/search.spec.ts` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui-e2e/src/search.spec.ts b/apps/registry-ui-e2e/src/search.spec.ts
--- a/apps/registry-ui-e2e/src/search.spec.ts
+++ b/apps/registry-ui-e2e/src/search.spec.ts
@@ -1,6 +1,6 @@
 import { expect, test } from '@playwright/test';

-test('the command menu finds a heading and goes to it', async ({ page }) => {
+test('the command menu finds a page and goes to it', async ({ page }) => {
   await page.goto('/docs');

   // The shortcut listens only once the page has hydrated, so it is pressed until the search opens.
@@ -8,8 +8,8 @@ test('the command menu finds a heading and goes to it', async ({ page }) => {
     await page.keyboard.press('ControlOrMeta+k');
     await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1_000 });
   }).toPass();
-  await page.getByRole('combobox').fill('install');
-  await page.getByRole('option', { name: 'Install an item' }).click();
+  await page.getByRole('combobox').fill('status');
+  await page.getByRole('option', { name: 'Status Indicator', exact: true }).click();

-  await expect(page).toHaveURL(/\/docs#install-an-item$/);
+  await expect(page).toHaveURL(/\/docs\/components\/status-indicator$/);
 });
```

(`exact: true`, because `installation.mdx` has a sentence starting "Status Indicator lands in", and the index returns it as a result whose accessible name contains the title. The view case also asserts that the page has no header: `/view` sits outside the `(app)` group.)

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache > "$S/e2e-t8-red.log" 2>&1; grep -E ' passed| failed|Locator:|Error: ' "$S/e2e-t8-red.log"`
Expected:

```
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('tabpanel', { name: 'Preview' }).first().getByText('Connecting')
    Error: element(s) not found
    Error: expect(locator).toBeVisible() failed
    Locator: getByText('Anthropic Claude')
    Error: element(s) not found
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('tabpanel', { name: 'Preview' }).first().getByText('Connecting')
    Error: element(s) not found
    Error: expect(locator).toBeVisible() failed
    Locator: getByText('Anthropic Claude')
    Error: element(s) not found
    Error: locator.click: Test timeout of 30000ms exceeded.
    Error: expect(locator).toBeVisible() failed
    Locator: getByRole('tabpanel', { name: 'Preview' }).first().getByText('Connecting')
    Error: element(s) not found
    Error: expect(locator).toBeVisible() failed
    Locator: getByText('Anthropic Claude')
    Error: element(s) not found
    Error: locator.click: Test timeout of 30000ms exceeded.
    Error: locator.click: Test timeout of 30000ms exceeded.
  9 failed
  9 passed (2.1m)
 NX   Running target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on failed
```

(Three cases fail in each of three browsers: neither page exists, and the search finds no Status Indicator option to click. The nine that pass are the earlier cases. Port 8787 is free after the run.)

- [ ] **Step 3: Step over links that leave the site**

In `apps/registry-ui/src/lib/page-tree.ts` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/lib/page-tree.ts b/apps/registry-ui/src/lib/page-tree.ts
--- a/apps/registry-ui/src/lib/page-tree.ts
+++ b/apps/registry-ui/src/lib/page-tree.ts
@@ -33,3 +33,11 @@ export function pageTreeGroups(tree: Root): PageTreeGroup[] {
   collect(tree.children);
   return groups.filter((group) => group.pages.length > 0);
 }
+
+/**
+ * Whether a page in the tree leaves the site: a `meta.json` link to another origin. Unmarked, it is
+ * read off the URL as fumadocs' own link does, by a scheme or a leading `//`.
+ */
+export function isExternal(page: Item): boolean {
+  return page.external ?? /^(\w+:|\/\/)/.test(page.url);
+}
```

In `apps/registry-ui/src/components/navigation/docs-sidebar.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/components/navigation/docs-sidebar.tsx b/apps/registry-ui/src/components/navigation/docs-sidebar.tsx
--- a/apps/registry-ui/src/components/navigation/docs-sidebar.tsx
+++ b/apps/registry-ui/src/components/navigation/docs-sidebar.tsx
@@ -6,7 +6,7 @@ import Link from 'next/link';
 import { usePathname } from 'next/navigation';
 import type { ComponentProps, ReactNode } from 'react';

-import { pageTreeGroups } from '@/lib/page-tree';
+import { isExternal, pageTreeGroups } from '@/lib/page-tree';
 import {
   Sidebar,
   SidebarContent,
@@ -25,7 +25,8 @@ interface DocsSidebarProps extends ComponentProps<typeof Sidebar> {
 }

 /**
- * The docs' page list, grouped as the content's `meta.json` files order it, with the current page marked.
+ * The docs' page list, grouped as the content's `meta.json` files order it, with the current page marked;
+ * a link to another site is listed and never marked.
  * It carries its own provider, whose wrapper is a full-height flex box: the sidebar never collapses, so
  * nothing outside it reads the provider, and the wrapper takes the height its container gives it.
  */
@@ -42,7 +43,7 @@ function DocsSidebar({ tree, ...props }: DocsSidebarProps): ReactNode {
               <SidebarGroupContent>
                 <SidebarMenu>
                   {group.pages.map((page) => {
-                    const current = isMatch(page.url, pathname);
+                    const current = !isExternal(page) && isMatch(page.url, pathname);
                     return (
                       <SidebarMenuItem key={page.url}>
                         <SidebarMenuButton
```

In `apps/registry-ui/src/components/navigation/docs-pager.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/components/navigation/docs-pager.tsx b/apps/registry-ui/src/components/navigation/docs-pager.tsx
--- a/apps/registry-ui/src/components/navigation/docs-pager.tsx
+++ b/apps/registry-ui/src/components/navigation/docs-pager.tsx
@@ -1,8 +1,9 @@
-import { findNeighbour, type Root } from 'fumadocs-core/page-tree';
+import { flattenTree, type Root } from 'fumadocs-core/page-tree';
 import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
 import Link from 'next/link';
 import type { ComponentProps, ReactNode } from 'react';

+import { isExternal } from '@/lib/page-tree';
 import { cn } from '@/registry/bases/base-ui/lib/utils';
 import { buttonVariants } from '@/registry/bases/base-ui/ui/button';

@@ -13,9 +14,17 @@ interface DocsPagerProps extends ComponentProps<'nav'> {
   url: string;
 }

-/** Links to the page before and the page after the current one. Renders nothing for a page with neither. */
+/**
+ * Links to the page before and the page after the current one, stepping over a link to another site.
+ * Renders nothing for a page with neither.
+ */
 function DocsPager({ tree, url, className, ...props }: DocsPagerProps): ReactNode {
-  const { previous, next } = findNeighbour(tree, url);
+  // fumadocs' findNeighbour counts a meta.json link to another site as a page, so the pager walks the
+  // flattened tree itself.
+  const pages = flattenTree(tree.children).filter((page) => !isExternal(page));
+  const index = pages.findIndex((page) => page.url === url);
+  const previous = index > 0 ? pages[index - 1] : undefined;
+  const next = index === -1 ? undefined : pages[index + 1];
   if (!previous && !next) return null;

   return (
```

Run: `pnpm exec vitest run src/components/navigation/docs-sidebar.spec.tsx src/components/navigation/docs-pager.spec.tsx 2>&1 | grep -E 'Test Files|^ +Tests'`
Expected:

```
 Test Files  2 passed (2)
      Tests  5 passed (5)
```

- [ ] **Step 4: The route units, the published-item list, and the index's files**

In `apps/registry-ui/src/routes/app-routes.ts` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/routes/app-routes.ts b/apps/registry-ui/src/routes/app-routes.ts
--- a/apps/registry-ui/src/routes/app-routes.ts
+++ b/apps/registry-ui/src/routes/app-routes.ts
@@ -1,7 +1,13 @@
-import { createStaticRoute } from '@zeroxsolutions/routing';
+import { createDynamicRoute, createStaticRoute } from '@zeroxsolutions/routing';

 /** The registry's home page. */
 export const homeRoute = createStaticRoute('/', () => '/');

 /** The docs; the content loader serves every page beneath this path. */
 export const docsRoute = createStaticRoute('/docs', () => '/docs');
+
+/** Every block the registry publishes, each in a frame. */
+export const blocksRoute = createStaticRoute('/blocks', () => '/blocks');
+
+/** One block alone on a page, which the docs and the blocks page frame. */
+export const viewRoute = createDynamicRoute<{ name: string }>('/view/:name', ({ name }) => `/view/${name}`);
```

`apps/registry-ui/src/lib/registry.ts`:

```ts
import registry from '../../registry.json';

/** A component or block `registry.json` publishes, as the docs list it. */
export interface PublishedItem {
  name: string;
  type: 'registry:component' | 'registry:block';
  title: string;
  description: string;
  /** The kind folder the item's family file sits in, or `blocks`. */
  category: string;
}

/** Every component and block the registry publishes, in `registry.json`'s order; the demos are left out. */
export const publishedItems: PublishedItem[] = registry.items.flatMap((item) =>
  item.type === 'registry:component' || item.type === 'registry:block'
    ? [
        {
          name: item.name,
          type: item.type,
          title: item.title,
          description: item.description,
          category: item.categories?.[0] ?? '',
        },
      ]
    : [],
);

/** The blocks the registry publishes, each of which `/view/<name>` renders alone. */
export const publishedBlocks = publishedItems.filter((item) => item.type === 'registry:block');
```

In `apps/registry-ui/src/lib/source.ts` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/lib/source.ts b/apps/registry-ui/src/lib/source.ts
--- a/apps/registry-ui/src/lib/source.ts
+++ b/apps/registry-ui/src/lib/source.ts
@@ -7,3 +7,10 @@ export const source = loader({
   baseUrl: docsRoute.build(),
   source: docs.toFumadocsSource(),
 });
+
+/** The URL of the docs page at `slugs`. Throws for a page the content lacks, so a link to one fails the build. */
+export function docsPageUrl(slugs: string[]): string {
+  const page = source.getPage(slugs);
+  if (!page) throw new Error(`docsPageUrl: no docs page at "${slugs.join('/')}"`);
+  return page.url;
+}
```

`apps/registry-ui/tools/build-examples-index.mts`, the whole file (the entry's `filePath` becomes `files`, the item's whole `files` list, or the demo's one file):

`apps/registry-ui/tools/build-examples-index.mts`:

```ts
/**
 * Writes the docs' demo index from `examples/` and `registry.json`: every demo and every published
 * component and block, by name. `examples/__index__.tsx` maps a name to the files it ships, first the
 * one whose component it names (a demo is one file; an item lists its whole `files`), which
 * `ComponentSource` reads at build; `examples/__components__.tsx` maps it to a lazy import of the
 * component that first file exports, which `ComponentPreview` renders. They are two files because the
 * components use hooks and carry no client directive, so only a client module may import them,
 * while the paths are read on the server.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const APP = resolve(import.meta.dirname, '..');
const EXAMPLES = 'registry/bases/base-ui/examples';
const HEADER = '// Written by tools/build-examples-index.mts from examples/ and registry.json.';

interface RegistryItem {
  name: string;
  type: string;
  files: { path: string }[];
}

const demos = readdirSync(join(APP, EXAMPLES))
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.spec.tsx') && !file.startsWith('__'))
  .map((file) => ({ name: file.slice(0, -'.tsx'.length), files: [`${EXAMPLES}/${file}`] }));

// A registry:example item is one of the demo files above, under the same name.
const { items } = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as { items: RegistryItem[] };
const published = items
  .filter((item) => item.type !== 'registry:example')
  .map((item) => ({ name: item.name, files: item.files.map((file) => file.path) }));

const entries = [...demos, ...published].sort((a, b) => a.name.localeCompare(b.name));
const duplicate = entries.find((entry, i) => entries[i + 1]?.name === entry.name);
if (duplicate) throw new Error(`examples index: "${duplicate.name}" names both a demo and a registry item`);

writeFileSync(
  join(APP, EXAMPLES, '__index__.tsx'),
  `${HEADER}
interface IndexEntry {
  name: string;
  files: string[];
}

export const Index: Record<string, IndexEntry> = {
${entries.map(({ name, files }) => `  '${name}': { name: '${name}', files: ${JSON.stringify(files)} },`).join('\n')}
};
`,
);

writeFileSync(
  join(APP, EXAMPLES, '__components__.tsx'),
  `${HEADER}
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

function firstComponent(module: Record<string, unknown>): { default: ComponentType } {
  return { default: Object.values(module).find((value) => typeof value === 'function') as ComponentType };
}

export const Components: Record<string, LazyExoticComponent<ComponentType>> = {
${entries
  .map(
    ({ name, files: [file] }) =>
      `  '${name}': lazy(() => import('@/${file.replace(/\.tsx$/, '')}').then(firstComponent)),`,
  )
  .join('\n')}
};
`,
);

console.log(`examples index: ${demos.length} demos, ${published.length} registry items`);
```

In `apps/registry-ui/src/components/data-display/component-source.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/components/data-display/component-source.tsx b/apps/registry-ui/src/components/data-display/component-source.tsx
--- a/apps/registry-ui/src/components/data-display/component-source.tsx
+++ b/apps/registry-ui/src/components/data-display/component-source.tsx
@@ -11,20 +11,25 @@ import { Index } from '@/registry/bases/base-ui/examples/__index__';
 interface ComponentSourceProps extends Omit<ComponentProps<typeof DocsCodeBlock>, 'code'> {
   /** A demo or registry item name in the examples index. */
   name: string;
+  /** One of the files the item ships, when it is not the first: a type or a helper the item carries beside its component. */
+  file?: string;
 }

 /**
- * The source file of a demo or registry item, highlighted. It reads the file from disk while it
- * renders, so it belongs only on a route rendered whole at build (`force-static` with every param
- * listed): the worker that serves the route has no such file. Throws for a name the index lacks.
+ * A source file of a demo or registry item, highlighted: its first file, or the one `file` names. It
+ * reads the file from disk while it renders, so it belongs only on a route rendered whole at build
+ * (`force-static` with every param listed): the worker that serves the route has no such file. Throws
+ * for a name the index lacks, or a file the item does not ship.
  */
-async function ComponentSource({ name, ...props }: ComponentSourceProps): Promise<ReactNode> {
+async function ComponentSource({ name, file, ...props }: ComponentSourceProps): Promise<ReactNode> {
   const entry = Index[name];
   if (!entry) throw new Error(`ComponentSource: "${name}" is not in the examples index`);
+  const path = file ?? entry.files[0];
+  if (!entry.files.includes(path)) throw new Error(`ComponentSource: "${name}" does not ship ${path}`);

   // Untraced: the route is prerendered, so no server bundle reads the file. Traced, the path is too
   // dynamic to scope and Turbopack copies the whole project into the server output.
-  const code = await readFile(join(/* turbopackIgnore: true */ process.cwd(), entry.filePath), 'utf8');
+  const code = await readFile(join(/* turbopackIgnore: true */ process.cwd(), path), 'utf8');

   return (
     <DocsCodeBlock code={code} {...props}>
```

- [ ] **Step 5: The block frame, the preview's `view`, the components list, the MDX map, the two routes and the header**

`apps/registry-ui/src/components/data-display/block-frame.tsx`:

```tsx
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { viewRoute } from '@/routes/app-routes';

interface BlockFrameProps extends ComponentProps<'iframe'> {
  /** A block `registry.json` publishes. */
  name: string;
  /** What the frame shows, which a screen reader announces for it. */
  title: string;
}

/** A published block on its own page, in a frame as wide as its container, so its breakpoints answer to the frame. */
function BlockFrame({ name, className, ...props }: BlockFrameProps): ReactNode {
  return (
    <iframe
      data-slot="block-frame"
      src={viewRoute.build({ name })}
      loading="lazy"
      className={cn('bg-background h-[36rem] w-full rounded-xl border', className)}
      {...props}
    />
  );
}

export { BlockFrame };
```

In `apps/registry-ui/src/components/data-display/component-preview.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/components/data-display/component-preview.tsx b/apps/registry-ui/src/components/data-display/component-preview.tsx
--- a/apps/registry-ui/src/components/data-display/component-preview.tsx
+++ b/apps/registry-ui/src/components/data-display/component-preview.tsx
@@ -1,7 +1,9 @@
 import type { ComponentProps, ReactNode } from 'react';

+import { BlockFrame } from '@/components/data-display/block-frame';
 import { ComponentPreviewDemo } from '@/components/data-display/component-preview-demo';
 import { ComponentSource } from '@/components/data-display/component-source';
+import { publishedBlocks } from '@/lib/registry';
 import { Index } from '@/registry/bases/base-ui/examples/__index__';
 import { cn } from '@/registry/bases/base-ui/lib/utils';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
@@ -9,14 +11,19 @@ import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-
 interface ComponentPreviewProps extends ComponentProps<typeof Tabs> {
   /** A demo name in the examples index. */
   name: string;
+  /** A published block to show under the Preview tab on its own page, in a frame, in place of the demo. */
+  view?: string;
 }

 /**
- * A demo rendered live under a Preview tab, and its source under a Code tab. Throws for a name the
- * index lacks, so a page naming a missing demo fails its build.
+ * A demo rendered live under a Preview tab, and its source under a Code tab; with `view`, the Preview
+ * tab frames that block's own page instead, so the block lays out at the frame's width. Throws for a
+ * name the index lacks or a view that is no published block, so a page naming either fails its build.
  */
-function ComponentPreview({ name, className, ...props }: ComponentPreviewProps): ReactNode {
+function ComponentPreview({ name, view, className, ...props }: ComponentPreviewProps): ReactNode {
   if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
+  const block = view === undefined ? undefined : publishedBlocks.find((item) => item.name === view);
+  if (view !== undefined && !block) throw new Error(`ComponentPreview: "${view}" is not a published block`);

   return (
     <Tabs data-slot="component-preview" defaultValue="preview" className={cn('gap-3', className)} {...props}>
@@ -24,9 +31,15 @@ function ComponentPreview({ name, className, ...props }: ComponentPreviewProps):
         <TabsTrigger value="preview">Preview</TabsTrigger>
         <TabsTrigger value="code">Code</TabsTrigger>
       </TabsList>
-      <TabsContent value="preview" className="flex min-h-72 items-center justify-center rounded-xl border p-10">
-        <ComponentPreviewDemo name={name} />
-      </TabsContent>
+      {block ? (
+        <TabsContent value="preview">
+          <BlockFrame name={block.name} title={block.title} />
+        </TabsContent>
+      ) : (
+        <TabsContent value="preview" className="flex min-h-72 items-center justify-center rounded-xl border p-10">
+          <ComponentPreviewDemo name={name} />
+        </TabsContent>
+      )}
       <TabsContent value="code">
         <ComponentSource name={name} />
       </TabsContent>
```

`apps/registry-ui/src/components/navigation/components-list.tsx`:

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

import { publishedItems } from '@/lib/registry';
import { source } from '@/lib/source';

/** A category as a heading: `data-display` reads `Data display`. */
function categoryLabel(category: string): string {
  const words = category.replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Every component and block the registry publishes, under its category in `registry.json`'s order. An
 * item with a docs page links to it; the rest are listed by title until theirs is written.
 */
function ComponentsList(): ReactNode {
  return (
    <div className="flex flex-col gap-8">
      {[...Map.groupBy(publishedItems, (item) => item.category)].map(([category, items]) => (
        <section key={category} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{categoryLabel(category)}</h2>
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {items.map((item) => {
              const page = source.getPage([item.type === 'registry:block' ? 'blocks' : 'components', item.name]);
              return (
                <li key={item.name} className="flex flex-col gap-1">
                  {page ? (
                    <Link href={page.url} className="font-medium underline underline-offset-4">
                      {item.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{item.title}</span>
                  )}
                  <span className="text-muted-foreground text-sm">{item.description}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export { ComponentsList };
```

In `apps/registry-ui/src/mdx-components.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/mdx-components.tsx b/apps/registry-ui/src/mdx-components.tsx
--- a/apps/registry-ui/src/mdx-components.tsx
+++ b/apps/registry-ui/src/mdx-components.tsx
@@ -3,8 +3,10 @@ import { isValidElement, type ComponentProps, type ReactNode } from 'react';
 import { ComponentPreview } from '@/components/data-display/component-preview';
 import { ComponentSource } from '@/components/data-display/component-source';
 import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
+import { ComponentsList } from '@/components/navigation/components-list';
 import { cn } from '@/registry/bases/base-ui/lib/utils';
 import { Alert, AlertDescription, AlertTitle } from '@/registry/bases/base-ui/ui/alert';
+import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/bases/base-ui/ui/table';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

 /** The text a node renders, as a reader would copy it. */
@@ -47,6 +49,18 @@ export const mdxComponents = {
     </h4>
   ),
   p: ({ className, ...props }: ComponentProps<'p'>) => <p className={cn('leading-7', className)} {...props} />,
+  a: ({ className, ...props }: ComponentProps<'a'>) => (
+    <a className={cn('font-medium underline underline-offset-4', className)} {...props} />
+  ),
+  ul: ({ className, ...props }: ComponentProps<'ul'>) => (
+    <ul className={cn('ml-6 list-disc leading-7 [&>li]:mt-2', className)} {...props} />
+  ),
+  table: Table,
+  thead: TableHeader,
+  tbody: TableBody,
+  tr: TableRow,
+  th: TableHead,
+  td: TableCell,
   code: ({ className, ...props }: ComponentProps<'code'>) =>
     typeof props.children === 'string' ? (
       <code className={cn('bg-muted rounded-md px-1.5 py-0.5 font-mono text-[0.9em]', className)} {...props} />
@@ -81,4 +95,5 @@ export const mdxComponents = {
   AlertDescription,
   ComponentPreview,
   ComponentSource,
+  ComponentsList,
 };
```

(The table elements map to the vendored `ui/table.tsx` parts, so an API Reference table is drawn as the registry draws a table. `a` and `ul` are styled because Tailwind's preflight strips both.)

`apps/registry-ui/src/app/(app)/blocks/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BlockFrame } from '@/components/data-display/block-frame';
import { publishedBlocks } from '@/lib/registry';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Blocks',
  description: 'Every block the registry publishes, each on its own page in a frame.',
};

export default function BlocksPage(): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Blocks</h1>
        <p className="text-muted-foreground">
          A block is a whole surface composed from this registry&apos;s components. Each is framed at the width of this
          column, so its layout answers to the frame and not to the window.
        </p>
      </header>
      {publishedBlocks.map((block) => {
        const page = source.getPage(['blocks', block.name]);
        return (
          <section key={block.name} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">
                {page ? (
                  <Link href={page.url} className="underline underline-offset-4">
                    {block.title}
                  </Link>
                ) : (
                  block.title
                )}
              </h2>
              <p className="text-muted-foreground text-sm">{block.description}</p>
            </div>
            <BlockFrame name={block.name} title={block.title} />
          </section>
        );
      })}
    </div>
  );
}
```

`apps/registry-ui/src/app/(view)/view/[name]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { ComponentPreviewDemo } from '@/components/data-display/component-preview-demo';
import { publishedBlocks } from '@/lib/registry';

export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

interface ViewPageProps {
  params: Promise<{ name: string }>;
}

export function generateStaticParams(): { name: string }[] {
  return publishedBlocks.map(({ name }) => ({ name }));
}

export async function generateMetadata({ params }: ViewPageProps): Promise<Metadata> {
  const { name } = await params;
  const block = publishedBlocks.find((item) => item.name === name);
  if (!block) notFound();

  return { title: block.title, description: block.description };
}

/** One block alone, with no site chrome, as the frames on the docs and the blocks page show it. */
export default async function ViewPage({ params }: ViewPageProps): Promise<ReactNode> {
  const { name } = await params;

  return (
    <main className="p-6">
      <ComponentPreviewDemo name={name} />
    </main>
  );
}
```

(`(view)` has no layout of its own, so the page gets the root layout's providers and no header or footer. `dynamicParams = false` with one param per block answers any other name with the not-found page.)

In `apps/registry-ui/src/components/layout/site-header.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/components/layout/site-header.tsx b/apps/registry-ui/src/components/layout/site-header.tsx
--- a/apps/registry-ui/src/components/layout/site-header.tsx
+++ b/apps/registry-ui/src/components/layout/site-header.tsx
@@ -5,9 +5,10 @@ import type { ComponentProps, ReactNode } from 'react';
 import { ModeSwitcher } from '@/components/general/mode-switcher';
 import { CommandMenu } from '@/components/navigation/command-menu';
 import { MobileNav } from '@/components/navigation/mobile-nav';
+import { docsPageUrl } from '@/lib/source';
 import { cn } from '@/registry/bases/base-ui/lib/utils';
 import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
-import { docsRoute, homeRoute } from '@/routes/app-routes';
+import { blocksRoute, docsRoute, homeRoute } from '@/routes/app-routes';

 interface SiteHeaderProps extends ComponentProps<'header'> {
   /** The docs page tree, which the search lists before a query and the menu lists on a narrow screen. */
@@ -29,6 +30,12 @@ function SiteHeader({ tree, className, ...props }: SiteHeaderProps): ReactNode {
           <Link href={docsRoute.build()} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
             Docs
           </Link>
+          <Link href={docsPageUrl(['components'])} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
+            Components
+          </Link>
+          <Link href={blocksRoute.build()} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
+            Blocks
+          </Link>
         </nav>
         <div className="ml-auto flex items-center gap-2">
           <div className="hidden w-56 md:block">
```

(Components is a docs page, whose URL the content loader owns, so the header asks `docsPageUrl`; a deleted `components/index.mdx` then fails the build instead of leaving a dead link. Blocks is an app page and has a route unit.)

- [ ] **Step 6: The demos**

`apps/registry-ui/registry/bases/base-ui/examples/status-indicator-online.tsx`:

```tsx
import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** The online tone beside the state it reports. */
function StatusIndicatorOnline(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="online" />
      <span>Connected</span>
    </div>
  );
}

export { StatusIndicatorOnline };
```

`apps/registry-ui/registry/bases/base-ui/examples/status-indicator-offline.tsx`:

```tsx
import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** The offline tone beside the state it reports. */
function StatusIndicatorOffline(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="offline" />
      <span>Disconnected</span>
    </div>
  );
}

export { StatusIndicatorOffline };
```

`apps/registry-ui/registry/bases/base-ui/examples/status-indicator-busy.tsx`:

```tsx
import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** The busy tone beside the state it reports. */
function StatusIndicatorBusy(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="busy" />
      <span>Unavailable</span>
    </div>
  );
}

export { StatusIndicatorBusy };
```

`apps/registry-ui/registry/bases/base-ui/examples/status-indicator-idle.tsx`:

```tsx
import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** The idle tone beside the state it reports. */
function StatusIndicatorIdle(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="idle" />
      <span>Away</span>
    </div>
  );
}

export { StatusIndicatorIdle };
```

`apps/registry-ui/registry/bases/base-ui/examples/status-indicator-pulse.tsx`:

```tsx
import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** A pulsing online dot, for a connection still being made. */
function StatusIndicatorPulse(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusIndicator tone="online" pulse />
      <span>Connecting</span>
    </div>
  );
}

export { StatusIndicatorPulse };
```

`apps/registry-ui/registry/bases/base-ui/examples/icons-demo.tsx`:

```tsx
import { ClaudeMark } from '@zeroxsolutions/icons/brands/claude';
import { GeminiMark } from '@zeroxsolutions/icons/brands/gemini';
import { OpenaiMark } from '@zeroxsolutions/icons/brands/openai';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
import type { ReactNode } from 'react';

import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/registry/bases/base-ui/ui/item';

/** A brand mark in three of its variants and a file-type icon, each beside the element that draws it. */
function IconsDemo(): ReactNode {
  return (
    <ItemGroup className="w-full max-w-sm">
      <Item>
        <ItemMedia>
          <OpenaiMark size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>OpenAI, the base mark</ItemTitle>
          <ItemDescription>{'<OpenaiMark size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <GeminiMark.Color size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Gemini, in colour</ItemTitle>
          <ItemDescription>{'<GeminiMark.Color size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <ClaudeMark.Avatar size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Claude, as an avatar</ItemTitle>
          <ItemDescription>{'<ClaudeMark.Avatar size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <TypescriptIcon size={24} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>A TypeScript file</ItemTitle>
          <ItemDescription>{'<TypescriptIcon size={24} />'}</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

export { IconsDemo };
```

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx b/apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx
--- a/apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx
+++ b/apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx
@@ -77,6 +77,7 @@ const EXPECTED_SLOT: Record<string, string> = {
   'highlighted-code-demo': 'highlighted-code',
   'icon-chip-demo': 'icon-chip',
   'icon-label-demo': 'icon-label',
+  'icons-demo': 'item',
   'image-preview-demo': 'image-preview',
   'input-group-search': 'input-group',
   'language-combobox-demo': 'combobox-trigger',
@@ -97,7 +98,12 @@ const EXPECTED_SLOT: Record<string, string> = {
   'resize-handle-demo': 'resize-handle',
   'sidebar-group-collapsible': 'sidebar-group',
   'sidebar-menu-collapsible': 'sidebar-menu-sub',
+  'status-indicator-busy': 'status-indicator',
   'status-indicator-demo': 'status-indicator',
+  'status-indicator-idle': 'status-indicator',
+  'status-indicator-offline': 'status-indicator',
+  'status-indicator-online': 'status-indicator',
+  'status-indicator-pulse': 'status-indicator',
   'tab-close-button-demo': 'tab-close-button',
   'tag-input-demo': 'tag-input',
   'toggle-toolbar': 'tooltip-trigger',
```

(These are docs-only demos: no `registry.json` item names them, so `registry.spec.ts`'s one-demo-per-item rule does not count them.)

Run: `node tools/build-examples-index.mts && pnpm exec vitest run registry/bases/base-ui/examples 2>&1 | grep -E 'examples index|Test Files|^ +Tests'`
Expected:

```
examples index: 65 demos, 43 registry items
 Test Files  1 passed (1)
      Tests  70 passed (70)
```

- [ ] **Step 7: The pages**

In `apps/registry-ui/content/docs/meta.json` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/content/docs/meta.json b/apps/registry-ui/content/docs/meta.json
--- a/apps/registry-ui/content/docs/meta.json
+++ b/apps/registry-ui/content/docs/meta.json
@@ -1,4 +1,4 @@
 {
   "root": true,
-  "pages": ["index"]
+  "pages": ["---Get Started---", "index", "installation", "components", "blocks", "packages"]
 }
```

`apps/registry-ui/content/docs/installation.mdx`:

````mdx
---
title: Installation
description: Set up an app to install items from this registry with the shadcn CLI.
---

The shadcn CLI installs every item. It reads the app's `components.json` to decide where each file goes and how
its imports are written.

## Create components.json

The items compose the Base UI build of shadcn's primitives and are drawn in the nova style, so `components.json`
names `base-nova` as its `style`. An app that has no `components.json` gets one on that base and style from:

```bash
npx shadcn@latest init --base base --preset nova
```

In an app that already has one, `style` has to start with `base-`. A Radix style installs the Radix build of each
primitive, and the items' imports do not match it.

## Install an item

Each item is addressed by its URL:

```bash
npx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json
```

The CLI writes the item's files under the aliases in `components.json` and rewrites its imports to match. With
the aliases `init` writes, Status Indicator lands in `components/feedback/status-indicator.tsx`, its tone type in
`lib/status-tone.ts`, and the component imports them as `@/lib/utils` and `@/lib/status-tone`.

## Items that use other items

An item names each item it composes by that item's URL, `https://ui.zeroxsolutions.com/r/<name>.json`, and each
shadcn primitive it composes as `@shadcn/<name>`. The CLI fetches the first kind from this registry and the second
from shadcn's, so `components.json` needs no `registries` entry for either. Tab Close Button, for example, names
`https://ui.zeroxsolutions.com/r/unsaved-indicator.json` and `@shadcn/button`.

## Colours

An item that paints a status uses two colours shadcn's theme does not define, `success` and `warning`. It carries
both as `cssVars`, and the CLI adds them to the CSS file `components.json` names: `--color-success` and
`--color-warning` under `@theme inline`, and `--success` and `--warning` under `:root` and `.dark`. An item copied
by hand needs the same entries, copied from the `cssVars` in its JSON.
````

`apps/registry-ui/content/docs/components/meta.json`:

```json
{
  "title": "Components",
  "pages": [
    "index",
    "---Feedback---",
    "status-indicator",
    "---Primitives---",
    "[Badge](https://ui.shadcn.com/docs/components/base/badge)",
    "[Bubble](https://ui.shadcn.com/docs/components/base/bubble)",
    "button",
    "[Button Group](https://ui.shadcn.com/docs/components/base/button-group)",
    "[Card](https://ui.shadcn.com/docs/components/base/card)",
    "[Collapsible](https://ui.shadcn.com/docs/components/base/collapsible)",
    "[Combobox](https://ui.shadcn.com/docs/components/base/combobox)",
    "[Command](https://ui.shadcn.com/docs/components/base/command)",
    "[Dropdown Menu](https://ui.shadcn.com/docs/components/base/dropdown-menu)",
    "[Empty](https://ui.shadcn.com/docs/components/base/empty)",
    "[Field](https://ui.shadcn.com/docs/components/base/field)",
    "[Input](https://ui.shadcn.com/docs/components/base/input)",
    "[Input Group](https://ui.shadcn.com/docs/components/base/input-group)",
    "[Item](https://ui.shadcn.com/docs/components/base/item)",
    "[Label](https://ui.shadcn.com/docs/components/base/label)",
    "[Message](https://ui.shadcn.com/docs/components/base/message)",
    "[Popover](https://ui.shadcn.com/docs/components/base/popover)",
    "[Scroll Area](https://ui.shadcn.com/docs/components/base/scroll-area)",
    "[Skeleton](https://ui.shadcn.com/docs/components/base/skeleton)",
    "[Switch](https://ui.shadcn.com/docs/components/base/switch)",
    "[Table](https://ui.shadcn.com/docs/components/base/table)",
    "[Tabs](https://ui.shadcn.com/docs/components/base/tabs)",
    "[Toggle Group](https://ui.shadcn.com/docs/components/base/toggle-group)",
    "[Tooltip](https://ui.shadcn.com/docs/components/base/tooltip)"
  ]
}
```

`apps/registry-ui/content/docs/components/index.mdx`:

```mdx
---
title: Components
description: Every component and block this registry publishes, by category.
---

Each item below composes shadcn's own primitives, listed under Primitives in the sidebar. An item's title links to
its page once that page is written.

<ComponentsList />
```

`apps/registry-ui/content/docs/components/status-indicator.mdx`:

````mdx
---
title: Status Indicator
description: A small decorative dot colored by a semantic status tone (online, offline, busy or idle), which can pulse for a state still in progress.
---

<ComponentPreview name="status-indicator-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
npx shadcn@latest add https://ui.zeroxsolutions.com/r/status-indicator.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Add shadcn's `utils`, which gives the component `cn`.</Step>

```bash
npx shadcn@latest add utils
```

<Step>Copy the component into `components/feedback/status-indicator.tsx`.</Step>

<ComponentSource name="status-indicator" />

<Step>Copy the tone type into `lib/status-tone.ts`.</Step>

<ComponentSource name="status-indicator" file="registry/bases/base-ui/types/status-tone.ts" />

<Step>Add the `success` and `warning` colours, as [Installation](/docs/installation#colours) describes.</Step>

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { StatusIndicator } from '@/components/feedback/status-indicator';
```

The dot is hidden from assistive technology, so the text beside it carries the status:

```tsx
<div className="flex items-center gap-2">
  <StatusIndicator tone="online" />
  <span>Online</span>
</div>
```

It is not for an identity colour, and not for an unsaved-changes flag, which is Unsaved Indicator.

## Examples

### Online

For connected, enabled or active.

<ComponentPreview name="status-indicator-online" />

### Offline

For disconnected or disabled.

<ComponentPreview name="status-indicator-offline" />

### Busy

For an error, or unavailable.

<ComponentPreview name="status-indicator-busy" />

### Idle

For pending or away.

<ComponentPreview name="status-indicator-idle" />

### Pulse

`pulse` animates the dot, for a state still in progress such as connecting or live.

<ComponentPreview name="status-indicator-pulse" />

## API Reference

### StatusIndicator

Renders a `span` and takes every prop a `span` takes, plus:

| Prop    | Type                                        | Default  |
| ------- | ------------------------------------------- | -------- |
| `tone`  | `'online' \| 'offline' \| 'busy' \| 'idle'` | required |
| `pulse` | `boolean`                                   | `false`  |

It sets `data-slot="status-indicator"`, `data-tone` to its tone, `data-pulse` while it pulses, and
`aria-hidden`.
````

`apps/registry-ui/content/docs/components/button.mdx`:

````mdx
---
title: Button
description: A button in the default, secondary, outline, destructive, ghost or link variant.
---

<ComponentPreview name="button-demo" />

Button is one of shadcn's primitives, and this registry does not publish it. Its full reference, sizes and API
included, is on [ui.shadcn.com](https://ui.shadcn.com/docs/components/base/button).

## Installation

```bash
npx shadcn@latest add button
```

## Examples

### Default

<ComponentPreview name="button-default" />

### Secondary

<ComponentPreview name="button-secondary" />

### Outline

<ComponentPreview name="button-outline" />

### Destructive

<ComponentPreview name="button-destructive" />

### Ghost

<ComponentPreview name="button-ghost" />
````

`apps/registry-ui/content/docs/blocks/meta.json`:

```json
{
  "title": "Blocks",
  "pages": ["ai-provider-picker"]
}
```

`apps/registry-ui/content/docs/blocks/ai-provider-picker.mdx`:

````mdx
---
title: AI Provider Picker
description: A responsive grid of AI provider cards, from the host's entries or a sample, that calls back with the provider key a card selects.
---

<ComponentPreview name="ai-provider-picker-demo" view="ai-provider-picker" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>

<TabsContent value="cli">

```bash
npx shadcn@latest add https://ui.zeroxsolutions.com/r/ai-provider-picker.json
```

</TabsContent>

<TabsContent value="manual">

<Steps>

<Step>Install the icon package, which draws each provider's mark.</Step>

```bash
npm install @zeroxsolutions/icons
```

<Step>Add shadcn's `card` and this registry's AI Provider Card.</Step>

```bash
npx shadcn@latest add card https://ui.zeroxsolutions.com/r/ai-provider-card.json
```

<Step>Copy the block into `components/ai-provider-picker.tsx`.</Step>

<ComponentSource name="ai-provider-picker" />

<Step>Update the import paths to match your project.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```tsx
import { AiProviderPicker } from '@/components/ai-provider-picker';
```

With no `entries`, the block shows its sample providers. A card becomes selectable once `onSelect` is passed:

```tsx
<AiProviderPicker onSelect={(provider) => setProvider(provider)} />
```

## API Reference

### AiProviderPicker

Renders a `div` with `data-slot="ai-provider-picker"`.

| Prop        | Type                         | Default                                                |
| ----------- | ---------------------------- | ------------------------------------------------------ |
| `entries`   | `AiProviderPickerEntry[]`    | `DEFAULT_AI_PROVIDER_ENTRIES`                          |
| `onSelect`  | `(provider: string) => void` | none, and no card is selectable                        |
| `className` | `string`                     | `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` |

`className` replaces the grid's classes rather than adding to them, so a caller that passes one sets the whole
layout.

### AiProviderPickerEntry

One card's data.

| Field         | Type               | Holds                                               |
| ------------- | ------------------ | --------------------------------------------------- |
| `provider`    | `string`           | the key `AiProviderIcon` resolves, such as `openai` |
| `name`        | `string`           | the card's title                                    |
| `description` | `string`           | the text under the title, clamped to two lines      |
| `meta`        | `string`, optional | the muted footer note, such as `12 models`          |

### DEFAULT_AI_PROVIDER_ENTRIES

The sample entries the block shows with no `entries`: providers the `@zeroxsolutions/icons` brand set has a mark
for, with names, blurbs and model counts only.
````

`apps/registry-ui/content/docs/packages/meta.json`:

```json
{
  "title": "Packages",
  "pages": ["icons"]
}
```

`apps/registry-ui/content/docs/packages/icons.mdx`:

````mdx
---
title: Icons
description: Brand marks and file-type icons as React components, one import path per icon.
---

`@zeroxsolutions/icons` is an npm package, not a registry item. The AI Provider Picker block depends on it, and an
app can import from it directly.

<ComponentPreview name="icons-demo" />

## Installation

```bash
pnpm add @zeroxsolutions/icons react react-dom
```

`react` and `react-dom` are peer dependencies, on React 19.

## Usage

Each icon has its own import path, `@zeroxsolutions/icons/<category>/<name>`:

```tsx
import { GeminiMark } from '@zeroxsolutions/icons/brands/gemini';
import { OpenaiMark } from '@zeroxsolutions/icons/brands/openai';
import { TypescriptIcon } from '@zeroxsolutions/icons/material/typescript';
```

```tsx
<OpenaiMark size="1.25rem" />
<GeminiMark.Color size="1.5rem" />
<GeminiMark.Avatar size={32} />
<TypescriptIcon size="1.5rem" />
```

## Categories

### brands

Brand marks: AI labs and inference hosts, developer and cloud tools, social networks and workspace apps. The
export is the name in PascalCase plus `Mark`, so `brands/openai` exports `OpenaiMark`. The base component draws
the mark in `currentColor`, and a mark carries the variants its source has, each as a property of the base:

- `.Color`, the brand's own colours
- `.Mono`, the mark in `currentColor`
- `.Avatar`, the mark on a filled background
- `.Text`, the wordmark
- `.Combine`, the mark and the wordmark together

A variant a mark does not have is a type error. `GithubMark` is the one mark that takes standard SVG props and
is sized with `className`.

### material

The Material Icon Theme's file-type icons, in full colour. The export is the name in PascalCase plus `Icon`, so
`material/typescript` exports `TypescriptIcon`. An icon with artwork for a light background also exports it as
`.Light`.
````

(`blocks/` and `packages/` need a `meta.json` each: rule 4 reaches a page only down a chain of listing folders. The API Reference tables are written from the family files: `status-indicator.tsx` and `types/status-tone.ts`, and `blocks/ai-provider-picker.tsx`, whose `className` replaces the grid's classes rather than merging them, as the page says.)

Run: `pnpm exec fumadocs-mdx > /dev/null && pnpm exec vitest run src/lib src/routes src/components 2>&1 | grep -E '×|Test Files|^ +Tests'`
Expected:

```
 Test Files  8 passed (8)
      Tests  25 passed (25)
```

- [ ] **Step 8: Watch the e2e cases pass**

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache > "$S/e2e-t8.log" 2>&1; grep -E ' passed| failed|Successfully ran' "$S/e2e-t8.log"`
Expected:

```
  18 passed (41.8s)
 NX   Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on
```

(After the run, `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing. Checked once by eye in Chromium against the worker preview: the Status Indicator page draws its tables through the `ui/table` parts, the block page's Preview tab frames `/view/ai-provider-picker` with all six sample cards, and the sidebar lists Get Started, Components, Feedback and Primitives with the 22 links.)

- [ ] **Step 9: Run the specs, the suite, the type check, lint, format and the builds**

Run (from `apps/registry-ui`; prettier and nx from the repo root):

```bash
pnpm exec vitest run src/lib/source.spec.ts src/routes/app-routes.spec.ts src/components/navigation/docs-pager.spec.tsx src/components/navigation/docs-sidebar.spec.tsx registry/bases/base-ui/examples 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t8.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t8.log"; grep -c 'not wrapped in act' "$S/vt-t8.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t8.log" 2>&1; grep -c 'error TS' "$S/tsc-t8.log"
(cd ../.. && pnpm exec prettier --check apps/registry-ui-e2e/src/component-page.spec.ts apps/registry-ui-e2e/src/search.spec.ts apps/registry-ui-e2e/src/view.spec.ts apps/registry-ui/content/docs/blocks/ai-provider-picker.mdx apps/registry-ui/content/docs/blocks/meta.json apps/registry-ui/content/docs/components/button.mdx apps/registry-ui/content/docs/components/index.mdx apps/registry-ui/content/docs/components/meta.json apps/registry-ui/content/docs/components/status-indicator.mdx apps/registry-ui/content/docs/installation.mdx apps/registry-ui/content/docs/meta.json apps/registry-ui/content/docs/packages/icons.mdx apps/registry-ui/content/docs/packages/meta.json apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx apps/registry-ui/registry/bases/base-ui/examples/icons-demo.tsx apps/registry-ui/registry/bases/base-ui/examples/status-indicator-busy.tsx apps/registry-ui/registry/bases/base-ui/examples/status-indicator-idle.tsx apps/registry-ui/registry/bases/base-ui/examples/status-indicator-offline.tsx apps/registry-ui/registry/bases/base-ui/examples/status-indicator-online.tsx apps/registry-ui/registry/bases/base-ui/examples/status-indicator-pulse.tsx 'apps/registry-ui/src/app/(app)/blocks/page.tsx' 'apps/registry-ui/src/app/(view)/view/[name]/page.tsx' apps/registry-ui/src/components/data-display/block-frame.tsx apps/registry-ui/src/components/data-display/component-preview.tsx apps/registry-ui/src/components/data-display/component-source.tsx apps/registry-ui/src/components/layout/site-header.tsx apps/registry-ui/src/components/navigation/components-list.tsx apps/registry-ui/src/components/navigation/docs-pager.spec.tsx apps/registry-ui/src/components/navigation/docs-pager.tsx apps/registry-ui/src/components/navigation/docs-sidebar.spec.tsx apps/registry-ui/src/components/navigation/docs-sidebar.tsx apps/registry-ui/src/lib/page-tree.ts apps/registry-ui/src/lib/registry.ts apps/registry-ui/src/lib/source.spec.ts apps/registry-ui/src/lib/source.ts apps/registry-ui/src/mdx-components.tsx apps/registry-ui/src/routes/app-routes.spec.ts apps/registry-ui/src/routes/app-routes.ts apps/registry-ui/tools/build-examples-index.mts 2>&1 | tail -1)
pnpm exec eslint registry/bases/base-ui/examples/examples.spec.tsx registry/bases/base-ui/examples/icons-demo.tsx registry/bases/base-ui/examples/status-indicator-busy.tsx registry/bases/base-ui/examples/status-indicator-idle.tsx registry/bases/base-ui/examples/status-indicator-offline.tsx registry/bases/base-ui/examples/status-indicator-online.tsx registry/bases/base-ui/examples/status-indicator-pulse.tsx 'src/app/(app)/blocks/page.tsx' 'src/app/(view)/view/[name]/page.tsx' src/components/data-display/block-frame.tsx src/components/data-display/component-preview.tsx src/components/data-display/component-source.tsx src/components/layout/site-header.tsx src/components/navigation/components-list.tsx src/components/navigation/docs-pager.spec.tsx src/components/navigation/docs-pager.tsx src/components/navigation/docs-sidebar.spec.tsx src/components/navigation/docs-sidebar.tsx src/lib/page-tree.ts src/lib/registry.ts src/lib/source.spec.ts src/lib/source.ts src/mdx-components.tsx src/routes/app-routes.spec.ts src/routes/app-routes.ts tools/build-examples-index.mts 2>&1 | grep -cE '^ +[0-9]+:[0-9]+ '
(cd ../registry-ui-e2e && pnpm exec eslint src 2>&1 | grep -cE '^ +[0-9]+:[0-9]+ ')
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:build --skip-nx-cache 2>&1 | grep -E '^[┌├└│ ]+[○●]|/docs/\[|/view/\[|Successfully ran')
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:build --skip-nx-cache 2>&1 | grep -E 'Failed to copy|Successfully ran' | sed 's|/.*node_modules/|.../|')
rm -rf "$S/r-t8"; pnpm exec shadcn build -o "$S/r-t8" > "$S/sb-t8.log" 2>&1; tail -1 "$S/sb-t8.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  5 passed (5)
      Tests  90 passed (90)
 Test Files  87 passed (87)
      Tests  561 passed (561)
0
0
All matched files use Prettier code style!
0
0
┌ ○ /
├ ○ /_not-found
├ ○ /api/search
├ ○ /blocks
├   /docs/[[...slug]]
│ ├ ● /docs/blocks/ai-provider-picker
│ ├ ● /docs/components/button
│ ├ ● /docs/components
│ └ ● [+4 more paths]
└   /view/[name]
  └ ● /view/ai-provider-picker
 NX   Successfully ran target build for project @zeroxsolutions/registry-ui and 6 tasks it depends on
ERROR Failed to copy .../hast-util-to-html
ERROR Failed to copy .../hast-util-whitespace
ERROR Failed to copy .../property-information
 NX   Successfully ran target wrangler:build for project @zeroxsolutions/registry-ui and 6 tasks it depends on
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(547 after Task 7 + 14: rules 1 and 3 add four cases, the route spec two (`/blocks` joins the static `it.each`, and the view case), the pager and the sidebar one each, and the examples spec six rows. The three `Failed to copy` lines are the ones Task 5 recorded, unchanged; the build succeeds. The examples index is not a registry item, so `shadcn` still counts 86.)

- [ ] **Step 10: Commit**

`$S/msg-t8.txt`:

```
feat(registry-ui): write one docs page of each kind and the blocks routes

Why: the frame had no page to hold its rules against. Installation,
the components index, Status Indicator, Button, AI Provider Picker and
the icons package are one page of each kind; /blocks and /view/<name>
show blocks framed and alone. Rules 1 and 3 hold every component and
block page to its registry item and its install command, and the
sidebar and pager step over the links to shadcn's primitive pages.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
A=apps/registry-ui
git add $A/content/docs $A/registry/bases/base-ui/examples $A/src apps/registry-ui-e2e/src
git commit -q -F "$S/msg-t8.txt" -- $A/content/docs $A/registry/bases/base-ui/examples $A/src $A/tools/build-examples-index.mts apps/registry-ui-e2e/src
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects and 3 tasks they depend on`; the log shows the subject above; `git status --short` prints nothing.

### Task 9: Markdown for language models, share images, sitemap, robots, the landing page and the not-found page

Spec (c) Part 2, the `/`, `/llms.txt`, OG image and `/sitemap.xml` rows of "Routes", and the Tests section's e2e cases for them plus the one unhappy-path case. Every route added here is fixed at build, as the rest of the site is: the worker's cache reads the build's output back and writes nothing.

- `/llms.txt`, `/llms-full.txt` and `/docs/<slug>.md` come from fumadocs' `llms()` (`fumadocs-core/source`, read in the installed 16.15.17's `dist/source/llms.d.ts`): `index()`, `full()` and `page(page)`, with `renderPage` putting the title and URL over `page.data.getText('processed')`, which `source.config.ts` already enables (`postprocess.includeProcessedMarkdown`). The routes follow fumadocs' own Next example (`examples/next/app/llms.mdx/docs/[[...slug]]/route.ts`, read 2026-09-30): a page's Markdown lives at `/llms.mdx/docs/<slug>/content.md`, the extra segment keeping a folder's index apart from its pages, and `next.config.mjs` rewrites `/docs/<slug>.md` to it. Upstream lists no `.md` path and reads the file with `fs.readFileSync` on the first request; here `generateStaticParams` lists every page, so each is rendered at build. Measured on the worker preview: `/docs/components/status-indicator.md` answers 200 `text/markdown; charset=utf-8` through the rewrite, and so does `/docs.md`.
- The spec's `opengraph-image.tsx` beside the docs page does not build. Next 16.3.7 refuses it inside the optional catch-all: `Error: Optional catch-all must be the last part of the URL in route "/docs/[[...slug]]/opengraph-image-17w2o3".` The image is a route handler instead, as fumadocs' example draws it: `/og/docs/<slug>/image.png`, one param per page so each is drawn at build, and the docs page's `generateMetadata` names it in `openGraph.images`. The worker answers `/og/docs/components/status-indicator/image.png` 200 `image/png` with `x-nextjs-cache: HIT`, and the page's HTML carries `<meta property="og:image" content="https://ui.zeroxsolutions.com/og/docs/components/status-indicator/image.png"/>`.
- The site's origin is `registry.json`'s `homepage`, `https://ui.zeroxsolutions.com`, which the items already name each other by. `src/lib/registry.ts` exports it; the sitemap, robots and the root layout's `metadataBase` read it, so the origin has one spelling.
- `/` moves into the `(app)` group, so it gets the header Task 7 left it without. It says what the registry is, shows one install line and links to Components and Blocks. The root `not-found.tsx` answers every unknown path with a 404, including a docs path the content lacks (`dynamicParams = false`).
- The e2e cases replace `example.spec.ts`, which asserted the old home page's `h1`, with one case per feature: the landing page, the Markdown routes, the sitemap, and the unhappy path.

**Files:**

- Create: `apps/registry-ui/src/app/(app)/page.tsx`, `apps/registry-ui/src/app/not-found.tsx`, `apps/registry-ui/src/app/llms.txt/route.ts`, `apps/registry-ui/src/app/llms-full.txt/route.ts`, `apps/registry-ui/src/app/llms.mdx/docs/[[...slug]]/route.ts`, `apps/registry-ui/src/app/og/docs/[...slug]/route.tsx`, `apps/registry-ui/src/app/sitemap.ts`, `apps/registry-ui/src/app/robots.ts`, `apps/registry-ui-e2e/src/{home,llms,sitemap,not-found}.spec.ts`
- Modify: `apps/registry-ui/next.config.mjs`, `apps/registry-ui/src/app/layout.tsx`, `apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx`, `apps/registry-ui/src/lib/source.ts`, `apps/registry-ui/src/lib/registry.ts`
- Delete: `apps/registry-ui/src/app/page.tsx`, `apps/registry-ui-e2e/src/example.spec.ts`

**Interfaces:**

- Consumes: the Task 8 tree (suite 87 files, 561 tests; `tsc` prints no error line; e2e 18 passed); `source`, `docsPageUrl`, `publishedItems`, `homeRoute`, `docsRoute`, `blocksRoute`, `DocsCodeBlock`, `buttonVariants`; `fumadocs-core/source` (`llms`); `next/og` (`ImageResponse`).
- Produces:
  - `src/lib/source.ts`: `docsLlms` (`index()`, `page(page)`, `full()`), `docsPageImage(page): { segments, url }`
  - `src/lib/registry.ts`: `registryHomepage`
  - routes, all prerendered: `/llms.txt`, `/llms-full.txt`, `/llms.mdx/docs/[[...slug]]` (one param per page, `.../content.md`), `/og/docs/[...slug]` (one per page, `.../image.png`), `/sitemap.xml`, `/robots.txt`, `/` in `(app)`, the root not-found page
  - rewrites `/docs.md` and `/docs/:path*.md` to the Markdown route
  - the root layout's `metadataBase`; the docs page's `openGraph.images`
- Removed: `src/app/page.tsx` (the old home page and its `ButtonDemo`), `example.spec.ts`.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or name a repo-root file. Expected output is shown without the terminal control codes (colour, cursor), which nx and Playwright write into the logs.

- [ ] **Step 1: Write the e2e cases and watch them fail**

Delete `apps/registry-ui-e2e/src/example.spec.ts` (`git rm`), then create:

`apps/registry-ui-e2e/src/home.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('/ says what the registry is and links to its components', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'ZeroXSolutions UI' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Browse components' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeVisible();
});
```

`apps/registry-ui-e2e/src/llms.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('/llms.txt indexes the pages and /docs/<slug>.md answers with one page as Markdown', async ({ request }) => {
  const index = await request.get('/llms.txt');
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain('[Status Indicator](/docs/components/status-indicator)');

  const page = await request.get('/docs/components/status-indicator.md');
  expect(page.status()).toBe(200);
  expect(page.headers()['content-type']).toContain('text/markdown');
  const text = await page.text();
  expect(text).toContain('# Status Indicator (/docs/components/status-indicator)');
  expect(text).toContain('The dot is hidden from assistive technology, so the text beside it carries the status');
});
```

`apps/registry-ui-e2e/src/sitemap.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('/sitemap.xml lists the pages at the registry host', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);

  const sitemap = await response.text();
  expect(sitemap).toContain('<loc>https://ui.zeroxsolutions.com/docs/components/status-indicator</loc>');
  expect(sitemap).toContain('<loc>https://ui.zeroxsolutions.com/blocks</loc>');
});
```

`apps/registry-ui-e2e/src/not-found.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('an unknown docs path answers 404 with the not-found page', async ({ page }) => {
  const response = await page.goto('/docs/components/nope');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the docs' })).toHaveAttribute('href', '/docs');
});
```

(The Markdown and sitemap cases use Playwright's `request` fixture, since what they check is the response and not a rendered page. The home case clicks the link inside `main`: the header links to Components as well.)

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache > "$S/e2e-t9-red.log" 2>&1; grep -E '^ +[0-9]+\) \[|^ +[0-9]+ (passed|failed)' "$S/e2e-t9-red.log" | sed 's/ *─*$//' | awk '!seen[$0]++'`
Expected:

```
  1) [chromium] › src/llms.spec.ts:3:5 › /llms.txt indexes the pages and /docs/<slug>.md answers with one page as Markdown
  2) [chromium] › src/sitemap.spec.ts:3:5 › /sitemap.xml lists the pages at the registry host
  3) [firefox] › src/llms.spec.ts:3:5 › /llms.txt indexes the pages and /docs/<slug>.md answers with one page as Markdown
  4) [chromium] › src/not-found.spec.ts:3:5 › an unknown docs path answers 404 with the not-found page
  5) [firefox] › src/sitemap.spec.ts:3:5 › /sitemap.xml lists the pages at the registry host
  6) [firefox] › src/not-found.spec.ts:3:5 › an unknown docs path answers 404 with the not-found page
  7) [webkit] › src/llms.spec.ts:3:5 › /llms.txt indexes the pages and /docs/<slug>.md answers with one page as Markdown
  8) [webkit] › src/not-found.spec.ts:3:5 › an unknown docs path answers 404 with the not-found page
  9) [webkit] › src/sitemap.spec.ts:3:5 › /sitemap.xml lists the pages at the registry host
  10) [chromium] › src/home.spec.ts:3:5 › / says what the registry is and links to its components
  11) [firefox] › src/home.spec.ts:3:5 › / says what the registry is and links to its components
  12) [webkit] › src/home.spec.ts:3:5 › / says what the registry is and links to its components
  12 failed
  15 passed (1.2m)
```

(`/llms.txt` and `/sitemap.xml` answer 404 (`Expected: 200`, `Received: 404`); the not-found case gets its 404 already, from Next's default page, and fails on the heading `Page not found`; the home case finds no `Browse components` link and times out on the click. The 15 that pass are Task 8's suite. Port 8787 is free after the run.)

- [ ] **Step 2: The Markdown routes**

In `apps/registry-ui/src/lib/source.ts` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/lib/source.ts b/apps/registry-ui/src/lib/source.ts
--- a/apps/registry-ui/src/lib/source.ts
+++ b/apps/registry-ui/src/lib/source.ts
@@ -1,5 +1,5 @@
 import { docs } from 'collections/server';
-import { loader } from 'fumadocs-core/source';
+import { llms, loader } from 'fumadocs-core/source';

 import { docsRoute } from '@/routes/app-routes';

@@ -14,3 +14,18 @@ export function docsPageUrl(slugs: string[]): string {
   if (!page) throw new Error(`docsPageUrl: no docs page at "${slugs.join('/')}"`);
   return page.url;
 }
+
+/**
+ * The docs as Markdown, for a language model: `index()` is `llms.txt`, `page()` one page, `full()` every
+ * page in one file. A page is its title and URL over the Markdown fumadocs-mdx keeps of its body, where
+ * a component such as `ComponentPreview` stays as its JSX line.
+ */
+export const docsLlms = llms(source, {
+  renderPage: async (page) => `# ${page.data.title} (${page.url})\n\n${await page.data.getText('processed')}`,
+});
+
+/** The address of a docs page's share image, which `/og/docs/[...slug]` draws at build, and its segments there. */
+export function docsPageImage(page: { slugs: string[] }): { segments: string[]; url: string } {
+  const segments = [...page.slugs, 'image.png'];
+  return { segments, url: `/og/docs/${segments.join('/')}` };
+}
```

`apps/registry-ui/src/app/llms.txt/route.ts`:

```ts
import { docsLlms } from '@/lib/source';

// Unset, the handler runs on every request; `false` runs it once at build and the worker serves the file.
export const revalidate = false;

export async function GET(): Promise<Response> {
  return new Response(await docsLlms.index());
}
```

`apps/registry-ui/src/app/llms-full.txt/route.ts`:

```ts
import { docsLlms } from '@/lib/source';

// Unset, the handler runs on every request; `false` runs it once at build and the worker serves the file.
export const revalidate = false;

export async function GET(): Promise<Response> {
  return new Response(await docsLlms.full());
}
```

`apps/registry-ui/src/app/llms.mdx/docs/[[...slug]]/route.ts`:

```ts
import { notFound } from 'next/navigation';

import { docsLlms, source } from '@/lib/source';

export const revalidate = false;
export const dynamicParams = false;

/** The file name each page's Markdown is served under, so the docs index and a folder page never share a path. */
const MARKDOWN_FILE = 'content.md';

/**
 * One docs page as Markdown, at `/llms.mdx/docs/<slug>/content.md`; `next.config.mjs` rewrites
 * `/docs/<slug>.md` here. Every page is listed, so each is rendered at build: the worker has no content
 * files to render one from on a first request.
 */
export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: [...page.slugs, MARKDOWN_FILE] }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug?: string[] }> }): Promise<Response> {
  const { slug = [] } = await params;
  const page = slug.at(-1) === MARKDOWN_FILE ? source.getPage(slug.slice(0, -1)) : undefined;
  if (!page) notFound();

  return new Response(await docsLlms.page(page), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
```

(The handler types its params by hand. Next 16.3's global `RouteContext<'/llms.mdx/docs/[[...slug]]'>` is generated by `next build`, so a `tsc` run before the first build fails with `TS2344: ... does not satisfy the constraint '"/api/search"'`, measured.)

In `apps/registry-ui/next.config.mjs` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/next.config.mjs b/apps/registry-ui/next.config.mjs
--- a/apps/registry-ui/next.config.mjs
+++ b/apps/registry-ui/next.config.mjs
@@ -12,6 +12,12 @@ const nextConfig = {
   // Unset, `next dev` run by a coding agent writes an AGENTS.md and a CLAUDE.md into this app,
   // beside the repo's own CLAUDE.md, and re-creates them whenever they are deleted.
   agentRules: false,
+  // A docs page's Markdown is a route handler under /llms.mdx; a path cannot end a catch-all segment in
+  // `.md`, so the address readers use is rewritten to it.
+  rewrites: async () => [
+    { source: '/docs.md', destination: '/llms.mdx/docs/content.md' },
+    { source: '/docs/:path*.md', destination: '/llms.mdx/docs/:path*/content.md' },
+  ],
 };

 const withMDX = createMDX();
```

(`/docs.md` has its own rule because `:path*` needs a `/` before `.md`, which the index page's address does not have.)

- [ ] **Step 3: The share images, the origin, the sitemap and robots**

In `apps/registry-ui/src/lib/registry.ts` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/lib/registry.ts b/apps/registry-ui/src/lib/registry.ts
--- a/apps/registry-ui/src/lib/registry.ts
+++ b/apps/registry-ui/src/lib/registry.ts
@@ -1,5 +1,8 @@
 import registry from '../../registry.json';

+/** The origin the registry is served from, which its items name each other by and the sitemap lists pages at. */
+export const registryHomepage = registry.homepage;
+
 /** A component or block `registry.json` publishes, as the docs list it. */
 export interface PublishedItem {
   name: string;
```

`apps/registry-ui/src/app/og/docs/[...slug]/route.tsx`:

```tsx
import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import { docsPageImage, source } from '@/lib/source';

export const revalidate = false;
export const dynamicParams = false;

/** A share image is 1200 by 630, the size Open Graph readers crop to. */
const SIZE = { width: 1200, height: 630 };

/**
 * Every docs page's share image, listed so each is drawn once at build. A page cannot carry an
 * `opengraph-image` file here: Next refuses one inside the optional catch-all `[[...slug]]`.
 */
export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: docsPageImage(page).segments }));
}

/** A docs page's share image: the site's name over the page's title and description. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }): Promise<Response> {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page || docsPageImage(page).segments.join('/') !== slug.join('/')) notFound();

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 80,
        background: '#0a0a0a',
        color: '#fafafa',
      }}
    >
      <div style={{ fontSize: 32, color: '#a1a1a1' }}>ZeroXSolutions UI</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 72 }}>{page.data.title}</div>
        <div style={{ fontSize: 32, color: '#a1a1a1' }}>{page.data.description}</div>
      </div>
    </div>,
    SIZE,
  );
}
```

In `apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx b/apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx
--- a/apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx
+++ b/apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx
@@ -4,7 +4,7 @@ import type { ReactNode } from 'react';

 import { DocsPager } from '@/components/navigation/docs-pager';
 import { DocsToc } from '@/components/navigation/docs-toc';
-import { source } from '@/lib/source';
+import { docsPageImage, source } from '@/lib/source';
 import { mdxComponents } from '@/mdx-components';

 export const revalidate = false;
@@ -23,7 +23,11 @@ export async function generateMetadata({ params }: DocsPageProps): Promise<Metad
   const page = source.getPage((await params).slug);
   if (!page) notFound();

-  return { title: page.data.title, description: page.data.description };
+  return {
+    title: page.data.title,
+    description: page.data.description,
+    openGraph: { images: docsPageImage(page).url },
+  };
 }

 export default async function DocsPage({ params }: DocsPageProps): Promise<ReactNode> {
```

In `apps/registry-ui/src/app/layout.tsx` (a unified diff against the tree before this task):

```diff
diff --git a/apps/registry-ui/src/app/layout.tsx b/apps/registry-ui/src/app/layout.tsx
--- a/apps/registry-ui/src/app/layout.tsx
+++ b/apps/registry-ui/src/app/layout.tsx
@@ -1,10 +1,13 @@
 import type { Metadata } from 'next';

+import { registryHomepage } from '@/lib/registry';
 import { AppProviders } from '@/providers/app-providers';

 import './global.css';

 export const metadata: Metadata = {
+  // The share images' URLs resolve against it; unset, the build warns and falls back to localhost.
+  metadataBase: new URL(registryHomepage),
   title: 'ZeroXSolutions UI',
   description: 'Base UI components and blocks, distributed as a shadcn registry.',
 };
```

`apps/registry-ui/src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';

import { registryHomepage } from '@/lib/registry';
import { source } from '@/lib/source';
import { blocksRoute, homeRoute } from '@/routes/app-routes';

export const revalidate = false;

/** Every page a reader lands on: the home page, the blocks page and every docs page, at the registry's host. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [homeRoute.build(), blocksRoute.build(), ...source.getPages().map((page) => page.url)].map((path) => ({
    url: new URL(path, registryHomepage).href,
  }));
}
```

`apps/registry-ui/src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';

import { registryHomepage } from '@/lib/registry';

export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', registryHomepage).href,
  };
}
```

(The image uses `next/og`'s default font; the one weight it carries is why the title sets no `fontWeight`.)

- [ ] **Step 4: The landing page and the not-found page**

Delete `src/app/page.tsx` (`git rm`), then create:

`apps/registry-ui/src/app/(app)/page.tsx`:

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { registryHomepage } from '@/lib/registry';
import { docsPageUrl } from '@/lib/source';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { blocksRoute } from '@/routes/app-routes';

const INSTALL = `npx shadcn@latest add ${new URL('/r/status-indicator.json', registryHomepage).href}`;

export default function HomePage(): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">ZeroXSolutions UI</h1>
        <p className="text-muted-foreground text-lg">
          Composed Base UI components and blocks, published as a shadcn registry. Each item is built from shadcn&apos;s
          own primitives, and the shadcn CLI installs it from its URL.
        </p>
      </header>
      <DocsCodeBlock code={INSTALL}>
        <pre>
          <code>{INSTALL}</code>
        </pre>
      </DocsCodeBlock>
      <div className="flex flex-wrap gap-3">
        <Link href={docsPageUrl(['components'])} className={buttonVariants()}>
          Browse components
        </Link>
        <Link href={blocksRoute.build()} className={buttonVariants({ variant: 'outline' })}>
          See the blocks
        </Link>
      </div>
    </div>
  );
}
```

`apps/registry-ui/src/app/not-found.tsx`:

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { docsRoute } from '@/routes/app-routes';

/** What every unknown path answers, with its 404: a docs path the content lacks and any other. */
export default function NotFound(): ReactNode {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">No page is published at this address.</p>
      <Link href={docsRoute.build()} className={buttonVariants({ variant: 'outline' })}>
        Go to the docs
      </Link>
    </main>
  );
}
```

(The not-found page sits at the root, outside `(app)`: Next renders only the root one for a path no route matches, so it has no header. It links to `/docs` through the route unit.)

- [ ] **Step 5: Watch the e2e cases pass, and read what the worker answers**

Run (from the repo root): `pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache > "$S/e2e-t9.log" 2>&1; grep -E ' passed| failed|Successfully ran' "$S/e2e-t9.log"`
Expected:

```
  27 passed (40.2s)
 NX   Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on
```

Run (from `apps/registry-ui`, with the worker preview started by `pnpm exec opennextjs-cloudflare preview --env development` in another shell):

```bash
for u in / /llms.txt /llms-full.txt /docs.md /docs/components/status-indicator.md /og/docs/components/status-indicator/image.png /og/docs/image.png /sitemap.xml /robots.txt /docs/nope /view/nope /nope; do curl -s -o /dev/null -w "$u %{http_code} %{content_type}\n" "http://localhost:8787$u"; done
curl -s http://localhost:8787/robots.txt
curl -s http://localhost:8787/docs/components/status-indicator | grep -o '<meta property="og:image"[^>]*>'
```

Expected:

```
/ 200 text/html; charset=utf-8
/llms.txt 200 text/plain;charset=UTF-8
/llms-full.txt 200 text/plain;charset=UTF-8
/docs.md 200 text/markdown; charset=utf-8
/docs/components/status-indicator.md 200 text/markdown; charset=utf-8
/og/docs/components/status-indicator/image.png 200 image/png
/og/docs/image.png 200 image/png
/sitemap.xml 200 application/xml
/robots.txt 200 text/plain
/docs/nope 404 text/html; charset=utf-8
/view/nope 404 text/html; charset=utf-8
/nope 404 text/html; charset=utf-8
User-Agent: *
Allow: /

Sitemap: https://ui.zeroxsolutions.com/sitemap.xml
<meta property="og:image" content="https://ui.zeroxsolutions.com/og/docs/components/status-indicator/image.png"/>
```

(Stop the preview with Ctrl-C; then `lsof -nP -iTCP:8787 -sTCP:LISTEN` prints nothing. In the Markdown, an MDX component stays as its JSX, `<ComponentPreview name="status-indicator-demo" />`, which is what fumadocs' `remarkLLMs` writes by default.)

- [ ] **Step 6: Run the suite, the type check, lint, format and the builds**

Run (from `apps/registry-ui`; prettier and nx from the repo root):

```bash
pnpm exec vitest run > "$S/vt-t9.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t9.log"; grep -c 'not wrapped in act' "$S/vt-t9.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t9.log" 2>&1; grep -c 'error TS' "$S/tsc-t9.log"
(cd ../.. && pnpm exec prettier --check apps/registry-ui-e2e/src/home.spec.ts apps/registry-ui-e2e/src/llms.spec.ts apps/registry-ui-e2e/src/not-found.spec.ts apps/registry-ui-e2e/src/sitemap.spec.ts apps/registry-ui/next.config.mjs 'apps/registry-ui/src/app/(app)/docs/[[...slug]]/page.tsx' 'apps/registry-ui/src/app/(app)/page.tsx' apps/registry-ui/src/app/layout.tsx apps/registry-ui/src/app/llms-full.txt/route.ts 'apps/registry-ui/src/app/llms.mdx/docs/[[...slug]]/route.ts' apps/registry-ui/src/app/llms.txt/route.ts apps/registry-ui/src/app/not-found.tsx 'apps/registry-ui/src/app/og/docs/[...slug]/route.tsx' apps/registry-ui/src/app/robots.ts apps/registry-ui/src/app/sitemap.ts apps/registry-ui/src/lib/registry.ts apps/registry-ui/src/lib/source.ts 2>&1 | tail -1)
pnpm exec eslint next.config.mjs 'src/app/(app)/docs/[[...slug]]/page.tsx' 'src/app/(app)/page.tsx' src/app/layout.tsx src/app/llms-full.txt/route.ts 'src/app/llms.mdx/docs/[[...slug]]/route.ts' src/app/llms.txt/route.ts src/app/not-found.tsx 'src/app/og/docs/[...slug]/route.tsx' src/app/robots.ts src/app/sitemap.ts src/lib/registry.ts src/lib/source.ts 2>&1 | grep -cE '^ +[0-9]+:[0-9]+ '
(cd ../registry-ui-e2e && pnpm exec eslint src 2>&1 | grep -cE '^ +[0-9]+:[0-9]+ ')
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:build --skip-nx-cache 2>&1 | grep -E '^[┌├└│ ]+[○●]|\]$|Successfully ran')
(cd ../.. && pnpm exec nx run @zeroxsolutions/registry-ui:wrangler:build --skip-nx-cache 2>&1 | grep -E 'Failed to copy|Successfully ran' | sed 's|/.*node_modules/|.../|')
rm -rf "$S/r-t9"; pnpm exec shadcn build -o "$S/r-t9" > "$S/sb-t9.log" 2>&1; tail -1 "$S/sb-t9.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  87 passed (87)
      Tests  561 passed (561)
0
0
All matched files use Prettier code style!
0
0
┌ ○ /
├ ○ /_not-found
├ ○ /api/search
├ ○ /blocks
├   /docs/[[...slug]]
│ ├ ● /docs/blocks/ai-provider-picker
│ ├ ● /docs/components/button
│ ├ ● /docs/components
│ └ ● [+4 more paths]
├ ○ /llms-full.txt
├   /llms.mdx/docs/[[...slug]]
│ ├ ● /llms.mdx/docs/blocks/ai-provider-picker/content.md
│ ├ ● /llms.mdx/docs/components/button/content.md
│ ├ ● /llms.mdx/docs/components/content.md
│ └ ● [+4 more paths]
├ ○ /llms.txt
├   /og/docs/[...slug]
│ ├ ● /og/docs/blocks/ai-provider-picker/image.png
│ ├ ● /og/docs/components/button/image.png
│ ├ ● /og/docs/components/image.png
│ └ ● [+4 more paths]
├ ○ /robots.txt
├ ○ /sitemap.xml
└   /view/[name]
  └ ● /view/ai-provider-picker
 NX   Successfully ran target build for project @zeroxsolutions/registry-ui and 6 tasks it depends on
ERROR Failed to copy .../hast-util-to-html
ERROR Failed to copy .../hast-util-whitespace
ERROR Failed to copy .../property-information
 NX   Successfully ran target wrangler:build for project @zeroxsolutions/registry-ui and 6 tasks it depends on
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(No unit spec changes: what this task adds is routes whose whole behaviour is the response the worker gives, which the e2e cases read. Every new route shows `○` or `●`; none is `ƒ`, so none renders on a request.)

- [ ] **Step 7: Commit**

`$S/msg-t9.txt`:

```
feat(registry-ui): serve llms.txt, page Markdown, share images and a sitemap

Why: the docs had no Markdown for a language model, no share image, no
sitemap and a home page outside the site's chrome. Every new route is
rendered at build, the page Markdown included, because the worker has
no content files to render one from on a request. The share image is a
route handler: Next refuses an opengraph-image file inside the docs'
optional catch-all.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
A=apps/registry-ui
git add $A/src/app apps/registry-ui-e2e/src
git commit -q -F "$S/msg-t9.txt" -- $A/src $A/next.config.mjs apps/registry-ui-e2e/src
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects and 3 tasks they depend on`; the log shows the subject above; `git status --short` prints nothing.

### Task 10: CLAUDE.md for the docs site, the worker's size, and the e2e staleness check

Spec (c)'s "Not covered" line on the worker's size ("The first build measures it"), the Part 1 `CLAUDE.md` line, and writing-e2e-tests' staleness check, run once for the new suite. Three facts are measured here and written into `CLAUDE.md`, where the next person to change the build reads them:

- The e2e target rebuilds the worker it tests. With `.open-next` deleted and the task cache skipped, the suite rebuilds it and passes.
- The worker is 6773 KiB gzipped (`wrangler deploy --dry-run --env production`, 2026-09-30). That is above the free plan's 3 MiB and below the paid plan's 10 MiB. The spec's remedy, moving the demos behind lazy imports, is already in place (`examples/__components__.tsx`) and does not shrink the upload: a lazy chunk still ships in the worker. What does weigh is two copies of Shiki's grammars, `next` itself, and the share images' `resvg.wasm`. Cutting it belongs to the deploy work (`docs/superpowers/specs/2026-09-28-registry-ui-deploy-design.md`), where the plan is chosen; this task records it.
- A run ended by SIGTERM leaves no server behind. writing-e2e-tests asks for a reporter that forwards SIGTERM to Playwright's interrupt, from its measurement on Playwright 1.62.1, where SIGTERM skipped every teardown and held the port. Measured here on the installed 1.61.1 under nx: SIGTERM to the Playwright runner, and separately to the top `nx run` process, each left port 8787 free and no process of the run alive within 15 seconds. The nx-run `webServer` goes down with its parent. No reporter is added; the step below is the check to re-run if Playwright or nx changes.

`CLAUDE.md` also gains the docs site's own line (the content pipeline, its two generated outputs and the targets that make them, and why every route is prerendered), the e2e suite's move onto the worker, and a house-library row for `@zeroxsolutions/routing`, which Task 6 adopted. The icons row said "not consumed here"; the AI Provider Picker block and the docs' icons page import it, so the row is corrected in this change.

**Files:**

- Modify: `CLAUDE.md`

**Interfaces:**

- Consumes: the Task 9 tree (e2e 27 passed; suite 87 files, 561 tests).
- Produces: `CLAUDE.md` lines for the e2e suite on the worker, the docs site, the worker's size, the workspace entry, and the `@zeroxsolutions/routing` and `@zeroxsolutions/icons` rows.
- Removed: nothing.

Commands run from the repo root unless a step says otherwise. Expected output is shown without the terminal control codes (colour, cursor), which nx and Playwright write into the logs.

- [ ] **Step 1: Read the e2e dependency back, and run the suite against a deleted worker with the cache skipped**

Run:

```bash
pnpm exec nx show project @zeroxsolutions/registry-ui-e2e --json | jq -c '.targets.e2e.dependsOn'
rm -rf apps/registry-ui/.open-next
pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e --skip-nx-cache > "$S/e2e-t10-stale.log" 2>&1; grep -E ' passed| failed|Successfully ran|"wrangler:build"' "$S/e2e-t10-stale.log"
ls apps/registry-ui/.open-next/worker.js
```

Expected:

```
[{"projects":["@zeroxsolutions/registry-ui"],"target":"wrangler:build"}]
> nx run @zeroxsolutions/registry-ui:"wrangler:build"
  27 passed (55.6s)
 NX   Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on
apps/registry-ui/.open-next/worker.js
```

(A pass with the output deleted and no cache to replay shows the declared dependency rebuilt the worker the suite started. Port 8787 is free after the run.)

- [ ] **Step 2: End a run with SIGTERM and look for what it left**

Run, once for the Playwright runner and once for the top process:

```bash
pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e > "$S/e2e-t10-term.log" 2>&1 &
until lsof -nP -iTCP:8787 -sTCP:LISTEN > /dev/null; do sleep 1; done
kill -TERM "$(pgrep -f '@playwright/test/cli.js test')"
sleep 15; lsof -nP -iTCP:8787 -sTCP:LISTEN; pgrep -fl 'workerd|wrangler dev|opennextjs-cloudflare preview'
```

```bash
pnpm exec nx run @zeroxsolutions/registry-ui-e2e:e2e > "$S/e2e-t10-term.log" 2>&1 &
until lsof -nP -iTCP:8787 -sTCP:LISTEN > /dev/null; do sleep 1; done
kill -TERM $!
sleep 15; lsof -nP -iTCP:8787 -sTCP:LISTEN; pgrep -fl 'workerd|wrangler dev|opennextjs-cloudflare preview'
```

Expected: both print nothing after the `sleep`. The first log ends with `Running target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on failed`. The second shows `Warning: command "playwright test" exited with non-zero status code`, then `Successfully ran target e2e for project @zeroxsolutions/registry-ui-e2e and 7 tasks it depends on` and `Nx detected a flaky task`.

(So an nx run ended by SIGTERM at the top can report success. Judge a run cut short this way by Playwright's own line, not by nx's last line.)

(On a machine running another checkout's worker, `pgrep` lists that one too; filter by this checkout's path. If either run ever leaves 8787 held, the fix is writing-e2e-tests' reporter, whose constructor forwards SIGTERM to SIGINT, listed beside the preset's reporter in `playwright.config.mts`.)

- [ ] **Step 3: Measure the worker**

Run (from `apps/registry-ui`, after Step 1 rebuilt `.open-next`):

```bash
rm -rf "$S/wdry"; pnpm exec wrangler deploy --dry-run --outdir "$S/wdry" --env production 2>&1 | grep 'Total Upload'
(cd .open-next/server-functions/default/node_modules/.pnpm && for d in @shikijs+langs@4.4.3 @shikijs+langs@4.2.0 next@16*; do printf '%s %s KiB gz\n' "${d%%_*}" "$(find "$d" -type f -name '*.*js' -exec cat {} + | gzip -c | wc -c | awk '{print int($1/1024)}')"; done)
for f in "$S"/wdry/*.wasm; do printf '%s %s KiB gz\n' "${f##*-}" "$(gzip -c "$f" | wc -c | awk '{print int($1/1024)}')"; done
```

Expected:

```
Total Upload: 35440.53 KiB / gzip: 6773.16 KiB
@shikijs+langs@4.4.3 1268 KiB gz
@shikijs+langs@4.2.0 1213 KiB gz
next@16.3.7 2705 KiB gz
resvg.wasm 516 KiB gz
yoga.wasm 27 KiB gz
```

(The package figures gzip each whole package directory the adapter copied into the server output, so they bound what the bundle takes from it rather than measure it exactly. `resvg.wasm`, `yoga.wasm` and a Geist font file (57 KiB gzipped) are uploaded beside `worker.js` for `next/og`, which only the share-image route imports.)

- [ ] **Step 4: Write it into CLAUDE.md**

In `CLAUDE.md` (a unified diff against the tree before this task):

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -35,6 +35,28 @@ its cost are here.
 - **Build & test tooling** - `@nx/js/typescript` (build + typecheck), `@nx/vite`, `@nx/next/plugin`
   for the registry app; **vitest** for unit, **Playwright** for e2e, `@nx/eslint` for lint. One
   unit runner throughout - this repo has no jest, where the backend repos deliberately split.
+  The e2e suite runs against the worker, not `next dev`. Its `webServer` starts
+  `registry-ui:wrangler:dev` (the adapter's preview on port 8787), and the e2e target declares
+  `wrangler:build` itself, because the Playwright plugin splits `wrangler:dev` at the colon and
+  infers a target named `wrangler`. With `.open-next` deleted and `--skip-nx-cache`, the suite
+  rebuilds the worker and passes (measured 2026-09-30).
+- **The docs site is MDX through fumadocs, and every route is rendered at build.** `content/docs`
+  is read by `fumadocs-mdx` 15.4.5 and `fumadocs-core` 16.15.17 on Next 16.3.7 (`fumadocs-mdx`
+  needs Next >= 16.2.0, `@opennextjs/cloudflare` 1.20.7 >= 16.3.6), inside a shell built from this
+  registry's own primitives. Two generated outputs are gitignored: `.source/` (target
+  `fumadocs-generate`) and the demo index `examples/__index__.tsx` + `__components__.tsx` (target
+  `examples-index`). `build`, `wrangler:build` and `test` depend on both; a `tsc` run by hand
+  before them fails with `Cannot find module 'collections/server'`. Every route is prerendered,
+  the search index, each page's `.md` and each share image included. The worker's incremental
+  cache is `static-assets-incremental-cache`, which reads the build's output back and writes
+  nothing, so a route rendered on a request has nowhere to be kept. `src/lib/source.spec.ts`
+  holds each page to its registry item, its demo and its install command.
+- **The worker is 6773 KiB gzipped**, measured with `wrangler deploy --dry-run --env production`
+  on 2026-09-30. That is above the free plan's 3 MiB and below the paid plan's 10 MiB. In the
+  server output, the two Shiki grammar packages gzip to 1268 KiB (4.4.3, through fumadocs-core)
+  and 1213 KiB (4.2.0, through the registry's own highlighter), the `next` package to 2705 KiB,
+  and the share images' `resvg.wasm` to 516 KiB. The demos are lazy imports already, and a lazy
+  chunk still ships in the worker. A deploy on the free plan needs that cut first.
 - **No project carries a `wrangler:deploy` target yet.** `registry-ui` has its worker config
   and `wrangler:build`, but `cd.yml` asks `nx-deploy` for `wrangler:deploy`, and until that
   target exists the job is a **green no-op**: `nx run-many -t wrangler:deploy` matches no
@@ -97,7 +119,7 @@ its cost are here.
 ## Workspace

 - `apps/registry-ui` (`@zeroxsolutions/registry-ui`, private) - the Next.js registry host: the
-  component source, `registry.json`, and the site that serves them.
+  component source, `registry.json`, and the site that serves them with its docs at `/docs`.
 - `apps/registry-ui-e2e` (`@zeroxsolutions/registry-ui-e2e`, private) - its Playwright pair.
 - `packages/editor-core` (`@zeroxsolutions/editor-core`) - publishable.
 - `packages/fluent-emoji` (`@zeroxsolutions/fluent-emoji`) - publishable.
@@ -135,9 +157,10 @@ cat <project>/node_modules/@zeroxsolutions/<lib>/README.md

 | Asset | Concern | Used by | This repo's choice |
 | --- | --- | --- | --- |
-| `@zeroxsolutions/icons` | the org's icon set | any frontend | authored here, not consumed here |
+| `@zeroxsolutions/icons` | the org's icon set | any frontend | authored here; the AI Provider Picker block and the docs' icons page import it |
 | `@zeroxsolutions/fluent-emoji` | Fluent emoji assets | any frontend | authored here, not consumed here |
 | `@zeroxsolutions/editor-core` | editor primitives | any frontend | authored here |
+| `@zeroxsolutions/routing` | route units: a path's pattern and its URL builder | any frontend | `0.0.7`, one declarer; `src/routes/app-routes.ts` declares each path the site links to, and `app-routes.spec.ts` holds each to a page |
 | shadcn registry | composed UI items | any frontend | this repo **is** the registry - see the first choice above |
 | `@lucide-animated` | animated icons | any frontend | consumed as a registry dependency, never vendored - see the choice above |
```

Run: `python3 -c "import subprocess; d = subprocess.run(['git', 'diff', 'CLAUDE.md'], capture_output=True, text=True).stdout; print([c for c in d if ord(c) > 127])"`
Expected: `[]`

- [ ] **Step 5: Commit**

`$S/msg-t10.txt`:

```
docs: record the docs site, the worker's size and the e2e's rebuild

Why: CLAUDE.md said nothing of the docs site, its generated inputs or
why every route is prerendered, and nobody had measured the worker. It
is 6773 KiB gzipped, over the free plan's 3 MiB, and the lazy demos the
spec expected to fix that already ship in it. The routing package the
route units use had no house-library row.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run:

```bash
git commit -q -F "$S/msg-t10.txt" -- CLAUDE.md
git log -1 --format='%h %s'
git status --short
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects and 3 tasks they depend on`; the log shows the subject above; `git status --short` prints nothing.
