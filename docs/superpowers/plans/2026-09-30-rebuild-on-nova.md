# Rebuild on base-nova Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the docs shell and every composed registry item take their look from the vendored base-nova
primitives, the rails stop jolting, code preview and code blocks match upstream, the primitive pages
go, icons are `@lucide-animated`, and the copy is sentence case - with two gate specs that hold it.

**Architecture:** two source-reading unit specs land first with a shrinking "pending" list of files
that still break a rule; every later task rebuilds a set of files and removes them from that list,
and the last task deletes the list. The shell follows upstream `shadcn-ui/ui@main` `apps/v4`, read
live.

**Tech Stack:** Next 16.3.7, React 19.2, fumadocs-mdx 15.4.5 / fumadocs-core 16.15.17, shadcn 4.21.0
(`base-nova`), Base UI, Tailwind v4, `@lucide-animated` (Motion), TypeScript compiler API (specs),
Vitest, Playwright on the worker.

**Spec:** `docs/superpowers/specs/2026-09-30-rebuild-on-nova-design.md`

## Global Constraints

- The visual reference is the base-nova preview on `ui.shadcn.com/create`; its cards are upstream
  `apps/v4/registry/bases/base/blocks/preview*/cards/*.tsx`. The shell reference is upstream
  `apps/v4` (`app/(app)/docs/layout.tsx`, `components/docs-sidebar.tsx`, `components/docs-toc.tsx`,
  `components/site-header.tsx`, `components/main-nav.tsx`, `components/site-footer.tsx`,
  `components/mobile-nav.tsx`, `components/command-menu.tsx`, `components/mode-switcher.tsx`,
  `components/component-preview-tabs.tsx`, `components/component-preview.tsx`,
  `components/code-block-command.tsx`, `components/code-collapsible-wrapper.tsx`,
  `components/copy-button.tsx`, `components/docs-copy-page.tsx`, `lib/highlight-code.ts`,
  `mdx-components.tsx`). Read each live before writing its counterpart:
  `gh api 'repos/shadcn-ui/ui/contents/apps/v4/<path>' --jq .content | base64 -d`. Never from memory.
- Upstream uses `@/registry/new-york-v4/ui/*` in its own site; here every primitive is
  `@/registry/bases/base-ui/ui/*` (Base UI API: `render` prop, not `asChild`).
- Rules 1-7 of the spec bind every file under `apps/registry-ui/src/` and
  `apps/registry-ui/registry/bases/base-ui/{components,blocks,examples}/`. Files under
  `registry/bases/base-ui/ui/` are vendored `shadcn add` output and are never edited.
- A primitive or icon that is missing is added with `pnpm --dir apps/registry-ui exec shadcn add <item> -o -y`
  (icons: `https://lucide-animated.com/r/<icon>.json`), byte for byte, and never hand-edited.
- A registry item that imports an animated icon lists `https://lucide-animated.com/r/<icon>.json` in
  its `registryDependencies` in `registry.json`.
- Every item keeps its props, its behaviour, its registry entry and its existing spec; a spec that
  asserted a class the rules remove is rewritten to assert behaviour, not deleted.
- UI copy is sentence case; names stay as named; display capitals come from CSS `uppercase`.
- Every text file stays plain ASCII.
- Commit on `master`, one or more commits per task; never `--no-verify`, never `HUSKY=0`.
- Port 3000 may hold the user's own `next dev`; never kill a process you did not start. A dev server
  you start rewrites `apps/registry-ui/next-env.d.ts`; restore it with `git restore` before committing.

## Review Focus

1. A long docs page scrolled to its end at 1440x900: the sidebar's box ends above the footer's, and a
   wheel or drag at either end of the sidebar or TOC does not move the page. (Task 3's e2e.)
2. Dark mode: every rebuilt surface (code block, preview card, install tabs, sidebar active item)
   stays readable in dark, since token swaps are the change most likely to lose a dark value.
   (Task 5 and Task 12 screenshots.)
3. A phone at 390 wide: the mobile nav opens, the page header's buttons wrap instead of overflowing,
   and a code block scrolls sideways inside itself, never the page. (Task 5 e2e.)
4. An item whose look depended on a removed class still renders and still passes its own spec,
   i.e. a behaviour spec is not quietly weakened into asserting nothing. (Tasks 7-11 review.)
5. The copy rule on a name inside a sentence (`Open in Base UI docs`) passes, and a stray Title Case
   word (`Copy Page`) fails. (Task 2's unit cases.)

---

### Task 1: Vendor the animated icons

**Files:**

- Create: `apps/registry-ui/registry/bases/base-ui/ui/<icon>.tsx` for each icon below (CLI output)
- Modify: `apps/registry-ui/package.json` only if the CLI adds a dependency (`motion` is expected to
  be declared already)

**Interfaces:**

- Produces: one module per icon at `@/registry/bases/base-ui/ui/<icon>`, exporting the component and
  its `<Name>IconHandle` type, as lucide-animated publishes them.

- [ ] **Step 1: List the glyphs in use.** Run
      `grep -rhoE "import \{[^}]+\} from 'lucide-react'" apps/registry-ui/src apps/registry-ui/registry/bases/base-ui/{components,blocks,examples}`
      and map each lucide name to its kebab-case id (`ChevronDown` -> `chevron-down`,
      `CheckCircle2` -> `circle-check`, `Loader2` -> `loader`, `XCircle` -> `circle-x`).
- [ ] **Step 2: Keep only the ids lucide-animated has.** `curl -sL https://lucide-animated.com/r/registry.json | jq -r '.items[].name'`
      and intersect. Known present (checked 2026-09-30): arrow-left, arrow-right, arrow-up, check,
      chevron-down, chevron-right, circle-check, copy, download, eye, eye-off, file-text, grip-vertical,
      link, loader, lock, menu, message-square, palette, panel-left-close, plus, rotate-ccw, rotate-cw,
      search, settings, smile, sparkles, sun-moon, upload, x. Known absent: trash-2, info, circle-x.
- [ ] **Step 3: Add them.** `cd apps/registry-ui && pnpm exec shadcn add $(for i in <ids>; do printf 'https://lucide-animated.com/r/%s.json ' $i; done) -o -y`.
      Confirm each file landed in `registry/bases/base-ui/ui/` and that `git diff` touches nothing else
      except, possibly, `package.json` / the lockfile.
- [ ] **Step 4: Gate.** `pnpm nx run-many -t lint typecheck build test -p @zeroxsolutions/registry-ui` passes.
- [ ] **Step 5: Commit** `feat(registry-ui): vendor the lucide-animated icons the site uses`.

### Task 2: The two gate specs, with a pending list

**Files:**

- Create: `apps/registry-ui/src/test/tsx-source.ts`
- Create: `apps/registry-ui/classes.spec.ts`
- Create: `apps/registry-ui/copy.spec.ts`
- Modify: `apps/registry-ui/vitest.config.mts` (include `'*.spec.ts'`)
- Modify: `apps/registry-ui/tsconfig.json` (include `"*.spec.ts"`, so the two are type-checked)

**Interfaces:**

- Produces: `PENDING` arrays at the top of each spec (repo-relative paths from `apps/registry-ui/`).
  Every later task removes the files it rebuilt from both lists.

- [ ] **Step 1: Write the shared reader.**

```ts
// apps/registry-ui/src/test/tsx-source.ts
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import ts from 'typescript';

/** The app's root; every path this module returns is relative to it. */
export const APP_ROOT = resolve(import.meta.dirname, '../..');

const SCANNED = [
  'src',
  'registry/bases/base-ui/components',
  'registry/bases/base-ui/blocks',
  'registry/bases/base-ui/examples',
];

function walk(dir: string, ext: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path, ext);
    return entry.name.endsWith(ext) && !entry.name.includes('.spec.') && !entry.name.startsWith('__') ? [path] : [];
  });
}

/** Every authored `.tsx` module the rules bind, generated indexes and specs excluded. */
export function authoredTsx(): string[] {
  return SCANNED.flatMap((dir) => walk(join(APP_ROOT, dir), '.tsx'))
    .map((path) => relative(APP_ROOT, path))
    .sort();
}

/** Every MDX page under `content/docs`. */
export function docsPages(): string[] {
  return walk(join(APP_ROOT, 'content/docs'), '.mdx')
    .map((path) => relative(APP_ROOT, path))
    .sort();
}

export function parseTsx(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(join(APP_ROOT, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

export function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

/** The literal text pieces inside an expression: strings, and a template's static parts. */
export function literalTexts(node: ts.Node): string[] {
  const texts: string[] = [];
  const visit = (child: ts.Node): void => {
    if (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) texts.push(child.text);
    else if (ts.isTemplateExpression(child)) {
      texts.push(child.head.text, ...child.templateSpans.map((span) => span.literal.text));
      child.templateSpans.forEach((span) => visit(span.expression));
    } else ts.forEachChild(child, visit);
  };
  visit(node);
  return texts;
}
```

- [ ] **Step 2: Write `classes.spec.ts` with its rule function and unit cases first.**

```ts
// apps/registry-ui/classes.spec.ts
// @vitest-environment node
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { authoredTsx, lineOf, literalTexts, parseTsx } from './src/test/tsx-source';

/** Files not rebuilt on base-nova yet; each task that rebuilds one removes it. */
const PENDING: readonly string[] = [
  // filled in Step 4
];

const PALETTE =
  /^-?(?:text|bg|border(?:-[xytrbl])?|ring|fill|stroke|outline|from|via|to|decoration|divide|shadow|accent|caret|placeholder)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)(?:-\d{2,3})?(?:\/\d+)?$/;
const PRIMITIVE_LOOK =
  /^-?(?:h|min-h|max-h|size|p[xytrblse]?|rounded(?:-[a-z]+)?|text|font|leading|tracking|bg|border(?:-[xytrbl])?|ring|shadow)(?:-|$)/;
const LAYOUT_KEPT =
  /^(?:(?:h|min-h|max-h|size)-(?:full|auto|0|fit|min|max|none|svh)|text-(?:left|center|right|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)|font-(?:mono|sans))$/;
const VARIABLE_DECLARATION = /^\[--[\w-]+:/;
const PRIMITIVE_MODULE = /\/registry\/bases\/base-ui\/ui\//;

/** A class with its variants (`md:`, `data-[x]:`, `[&_svg]:`) and importance marks removed. */
function utilityOf(className: string): string {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < className.length; i++) {
    const char = className[i];
    if (char === '[' || char === '(') depth++;
    else if (char === ']' || char === ')') depth--;
    else if (char === ':' && depth === 0) start = i + 1;
  }
  return className.slice(start).replace(/^!|!$/g, '');
}

/** Which rule a class breaks, or null. `onPrimitive` is whether it sits on a vendored primitive. */
export function classViolation(className: string, onPrimitive: boolean): string | null {
  const utility = utilityOf(className);
  if (PALETTE.test(utility)) return 'palette colour';
  if (utility.includes('[') && !VARIABLE_DECLARATION.test(utility)) return 'arbitrary value';
  if (onPrimitive && PRIMITIVE_LOOK.test(utility) && !LAYOUT_KEPT.test(utility)) return 'restyles a primitive';
  return null;
}

interface Violation {
  file: string;
  line: number;
  className: string;
  rule: string;
}

function violationsIn(file: string): Violation[] {
  const source = parseTsx(file);
  const primitives = new Set<string>();
  source.statements.forEach((statement) => {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return;
    if (!PRIMITIVE_MODULE.test(statement.moduleSpecifier.text)) return;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) bindings.elements.forEach((e) => primitives.add(e.name.text));
  });

  const found: Violation[] = [];
  const check = (node: ts.Node, onPrimitive: boolean): void => {
    literalTexts(node)
      .flatMap((text) => text.split(/\s+/).filter(Boolean))
      .forEach((className) => {
        const rule = classViolation(className, onPrimitive);
        if (rule) found.push({ file, line: lineOf(source, node), className, rule });
      });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'className' && node.initializer) {
      const element = node.parent.parent;
      const tag =
        ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element) ? element.tagName.getText(source) : '';
      check(node.initializer, primitives.has(tag.split('.')[0]));
      return;
    }
    if (ts.isCallExpression(node) && ['cn', 'cva'].includes(node.expression.getText(source))) {
      node.arguments.forEach((argument) => check(argument, false));
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('classViolation', () => {
  it.each([
    ['text-emerald-600', false, 'palette colour'],
    ['dark:bg-blue-500/20', false, 'palette colour'],
    ['text-[0.85em]', false, 'arbitrary value'],
    ['top-[calc(var(--x)+1px)]', false, 'arbitrary value'],
    ['h-8', true, 'restyles a primitive'],
    ['px-6', true, 'restyles a primitive'],
    ['rounded-full', true, 'restyles a primitive'],
    ['text-muted-foreground', true, 'restyles a primitive'],
    ['[&_svg]:size-3', true, 'restyles a primitive'],
  ])('%s (on a primitive: %s) breaks "%s"', (className, onPrimitive, rule) => {
    expect(classViolation(className, onPrimitive)).toBe(rule);
  });

  it.each([
    ['w-full', true],
    ['md:flex', true],
    ['h-full', true],
    ['text-left', true],
    ['data-[active=true]:flex', true],
    ['[--sidebar-width:--spacing(72)]', false],
    ['w-(--sidebar-width)', false],
    ['text-muted-foreground', false],
    ['px-6', false],
  ])('%s (on a primitive: %s) is allowed', (className, onPrimitive) => {
    expect(classViolation(className, onPrimitive)).toBeNull();
  });
});

describe('the authored modules', () => {
  const files = authoredTsx();

  it('keep every rebuilt module to the class rules', () => {
    expect(files.filter((file) => !PENDING.includes(file)).flatMap(violationsIn)).toEqual([]);
  });

  it('list as pending only modules that still break a rule', () => {
    expect(PENDING.filter((file) => !files.includes(file) || violationsIn(file).length === 0)).toEqual([]);
  });
});
```

- [ ] **Step 3: Write `copy.spec.ts`.**

````ts
// apps/registry-ui/copy.spec.ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { APP_ROOT, authoredTsx, docsPages, lineOf, parseTsx } from './src/test/tsx-source';

/** Files whose copy is not sentence case yet; each task that rebuilds one removes it. */
const PENDING: readonly string[] = [
  // filled in Step 4
];

/** Names that keep their capitals wherever they sit in a sentence, beside the registry's item titles. */
const NAMES: readonly string[] = [
  'ZeroXSolutions UI',
  'ZeroXSolutions',
  'Base UI',
  'Next.js',
  'React',
  'Tailwind CSS',
  'Tailwind',
  'GitHub',
  'Markdown',
  'Lucide',
  'Geist',
  'Cloudflare',
  'Motion',
  'Fluent',
];

const ITEM_TITLES: readonly string[] = (
  JSON.parse(readFileSync(join(APP_ROOT, 'registry.json'), 'utf8')) as { items: { title?: string }[] }
).items.flatMap((item) => (item.title ? [item.title] : []));

const COPY_ATTRIBUTES = new Set(['title', 'aria-label', 'placeholder', 'label', 'description', 'alt']);
const ACRONYM = /^[A-Z0-9]{2,}s?$/;

/** The first word that is capitalised mid-sentence without being a name or an acronym, or null. */
export function casingViolation(text: string, names: readonly string[]): string | null {
  const stripped = [...names]
    .sort((a, b) => b.length - a.length)
    .reduce((rest, name) => rest.split(name).join('name'), text.replace(/`[^`]*`/g, 'code'));
  for (const sentence of stripped.split(/(?<=[.!?:])\s+/)) {
    const words = sentence.split(/\s+/).filter(Boolean);
    for (const raw of words.slice(1)) {
      const word = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
      if (/^[A-Z][a-z]/.test(word) && !ACRONYM.test(word)) return word;
    }
  }
  return null;
}

interface CopyUse {
  file: string;
  line: number;
  text: string;
}

function tsxCopy(file: string): CopyUse[] {
  const source = parseTsx(file);
  const found: CopyUse[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, ' ').trim();
      if (/[A-Za-z]/.test(text)) found.push({ file, line: lineOf(source, node), text });
    } else if (ts.isJsxAttribute(node) && COPY_ATTRIBUTES.has(node.name.getText(source)) && node.initializer) {
      const init = node.initializer;
      const literal = ts.isStringLiteral(init)
        ? init
        : ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)
          ? init.expression
          : null;
      if (literal) found.push({ file, line: lineOf(source, node), text: literal.text });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function mdxCopy(file: string): CopyUse[] {
  let fenced = false;
  return readFileSync(join(APP_ROOT, file), 'utf8')
    .split('\n')
    .flatMap((line, index) => {
      if (line.startsWith('```')) fenced = !fenced;
      const heading = !fenced && /^#{1,6}\s+(.+)$/.exec(line);
      const description = /^description:\s*(.+)$/.exec(line);
      const text = heading?.[1] ?? description?.[1];
      return text ? [{ file, line: index + 1, text }] : [];
    });
}

function violationsIn(file: string): (CopyUse & { word: string })[] {
  const names = [...NAMES, ...ITEM_TITLES];
  return (file.endsWith('.mdx') ? mdxCopy(file) : tsxCopy(file)).flatMap((use) => {
    const word = casingViolation(use.text, names);
    return word ? [{ ...use, word }] : [];
  });
}

describe('casingViolation', () => {
  it.each([
    ['Copy Page', 'Page'],
    ['On This Page', 'This'],
    ['Context Length', 'Length'],
  ])('%s breaks sentence case at "%s"', (text, word) => {
    expect(casingViolation(text, NAMES)).toBe(word);
  });

  it.each([
    'Copy page',
    'Open in Base UI docs',
    'Built on Next.js and React.',
    'Run `npx shadcn add Button` first',
    'Use the AI provider',
    'Saved. Next one',
  ])('%s is sentence case', (text) => {
    expect(casingViolation(text, NAMES)).toBeNull();
  });
});

describe('the copy', () => {
  const files = [...authoredTsx(), ...docsPages()];

  it('is sentence case in every rebuilt file', () => {
    expect(files.filter((file) => !PENDING.includes(file)).flatMap(violationsIn)).toEqual([]);
  });

  it('lists as pending only files that still break it', () => {
    expect(PENDING.filter((file) => !files.includes(file) || violationsIn(file).length === 0)).toEqual([]);
  });
});
````

- [ ] **Step 4: Fill both `PENDING` lists from the current tree.** Run the specs once with `PENDING`
      empty (`pnpm nx test @zeroxsolutions/registry-ui -- classes copy`), take the set of files in the
      failure output, and write them into each list, sorted. The unit cases must pass as written; if one
      fails, fix the rule function, not the case. Then run again: both specs pass.
- [ ] **Step 5: Wire the includes.** Add `'*.spec.ts'` to `test.include` in `vitest.config.mts` and
      `"*.spec.ts"` to `include` in `tsconfig.json`. Confirm with a deliberate type error in
      `classes.spec.ts` that `pnpm nx build @zeroxsolutions/registry-ui` fails, then revert it.
- [ ] **Step 6: Gate and commit** `test(registry-ui): hold the source to the class and copy rules`.

### Task 3: Port upstream's docs layout, sidebar and TOC - the scroll defect

This task was first done as a restyle behind the class rules (9d52613: a wrapper `nav`, a
`ScrollArea`, a client provider wrapper). The spec now makes the shell a **port** of upstream's own
shell; this task redoes it that way on top of 9d52613.

**Files:**

- Modify: `apps/registry-ui/src/app/layout.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/docs/layout.tsx`,
  `src/app/(app)/docs/[[...slug]]/page.tsx`, `src/components/layout/site-footer.tsx`,
  `src/app/global.css` (only the upstream utilities the port needs)
- Modify: `src/components/navigation/docs-sidebar.tsx` (+ spec), `src/components/navigation/docs-toc.tsx` (+ spec)
- Create: `src/lib/docs-sidebar-scroll.ts` (upstream's restore key and inline script)
- Modify: `apps/registry-ui/classes.spec.ts`, `apps/registry-ui/src/test/tsx-source.ts` (class rules scan the
  registry's `components`, `blocks`, `examples` only; drop every `src/` entry from its `PENDING`)
- Modify: `apps/registry-ui-e2e/src/docs-rails.spec.ts`

- [ ] **Step 1: Read upstream live, whole files:** `app/layout.tsx` (the `<body>` classes),
      `app/(app)/layout.tsx`, `app/(app)/docs/layout.tsx`, `app/(app)/docs/[[...slug]]/page.tsx`,
      `components/docs-sidebar.tsx`, `lib/docs-sidebar-scroll.ts`, `components/docs-toc.tsx`,
      `components/site-footer.tsx`, and wherever `scroll-fade`, `scrollbar-none`, `no-scrollbar` are
      defined (`app/globals.css`, `app/style-registry.css`, or a package). Write down, in the report, the
      element tree from `<body>` to a sidebar link and to a TOC link, with each element's classes.
- [ ] **Step 2: Rewrite the e2e first (RED on the current tree where it can be):** at 1440x900 and
      1024x768 on the longest docs page, scrolled to the end, the sidebar's top is not above the header's
      bottom; the site footer is not visible on a docs page and is visible on `/blocks`; with the
      sidebar's scroller at its end, `page.mouse.wheel(0, 400)` over it leaves `window.scrollY` unchanged
      (same for the TOC's scroller if its list overflows; otherwise assert its scroller computes
      `overscroll-behavior-y: none`); `document.scrollingElement` computes `overscroll-behavior-y: none`.
- [ ] **Step 3: Port.** Reproduce Step 1's tree here: body `group/body overscroll-none` + footer
      height variable; the docs layout's `SidebarProvider` grid; `Sidebar` itself sticky, bounded,
      `collapsible="none"`, `overflow-hidden overscroll-none bg-transparent`, its edge line; `SidebarContent`
      as the scroller with the ref, the restore effect, the scroll listener and the fade; `SidebarMenuButton`
      with upstream's classes, rendered through Base UI's `render={<Link .../>}` in place of `asChild`;
      the restore script inlined before paint as upstream does; the TOC column and its scroller; the
      footer hidden on docs pages. Keep this site's data (`meta.json` groups, `isMatch`, routes). Remove
      what 9d52613 added that upstream does not have (the wrapper `nav`, the `ScrollArea`s); keep a client
      boundary only where the server layout needs one, and say why. Sentence-case copy still holds.
- [ ] **Step 4: Scope the class rules to the registry** in `tsx-source.ts` / `classes.spec.ts` and drop
      the `src/` entries from its `PENDING`; `copy.spec.ts` keeps scanning `src/`.
- [ ] **Step 5:** unit specs of sidebar and TOC updated (landmarks, restore for same / other pathname,
      throwing storage); the e2e GREEN in all three browsers; full unit and e2e; commit
      `fix(registry-ui): port upstream's docs layout, sidebar and TOC`.

### Task 4: Port the header, mobile nav, command menu, mode switcher

**Files:**

- Modify: `src/components/layout/site-header.tsx`, `src/components/layout/site-footer.tsx`,
  `src/components/navigation/mobile-nav.tsx`, `src/components/navigation/command-menu.tsx` (+ spec),
  `src/components/general/mode-switcher.tsx` (+ spec), `src/app/not-found.tsx`

- [ ] **Step 1:** read upstream `site-header.tsx`, `main-nav.tsx`, `site-footer.tsx`, `mobile-nav.tsx`,
      `command-menu.tsx`, `mode-switcher.tsx` live and port each: upstream's structure and classes,
      adapted only for Base UI's API (`render` for `asChild`) and this site's data, keeping this site's routes (`@/routes/app-routes`), its search client, and its existing behaviour
      (the platform modifier hint, the phone search trigger, the theme toggle). Icons from Task 1's
      animated set where the glyph exists; an animated icon inside a button animates on the button's
      hover/focus through its handle (`startAnimation` / `stopAnimation`).
- [ ] **Step 2:** copy is sentence case (`Search docs...`, `Toggle theme`, `Page not found`).
- [ ] **Step 3:** existing unit and e2e specs pass (`search.spec.ts`, `theme.spec.ts`,
      `not-found.spec.ts`); remove the touched files from `copy.spec.ts`'s `PENDING`; commit
      `feat(registry-ui): port the site header and menus from upstream`.

### Task 5: Code preview, code blocks, install command, page header

**Files:**

- Create: `src/lib/highlight-code.ts` (+ `highlight-code.spec.ts`)
- Create: `src/components/data-display/code-block-command.tsx` (+ spec), `src/components/data-display/copy-page-button.tsx` (+ spec)
- Modify: `src/components/data-display/component-preview.tsx`, `component-preview-demo.tsx`,
  `component-source.tsx`, `docs-code-block.tsx`, `block-frame.tsx`, `src/mdx-components.tsx`,
  `src/app/(app)/docs/[[...slug]]/page.tsx`, `src/components/navigation/docs-pager.tsx`
- Modify: `apps/registry-ui-e2e/src/component-page.spec.ts`

**Interfaces:**

- Produces: `highlightCode(code: string, language?: string): Promise<string>` - HTML with
  `github-light` / `github-dark` dual themes, the only Shiki entry point in `src/`.

- [ ] **Step 0:** this is a port of upstream's files (spec, "The docs shell"): its structure and
      classes, adapted only for Base UI's API and this site's data; the class rules do not bind `src/`.
      Port onto THIS repo's base-nova primitives (`Tabs`, `Button`, `Tooltip`, ...), never upstream's
      new-york-v4 ones. Where upstream's shell uses a colour token `styles.css` lacks (a code surface,
      `surface`, ...), define it in `styles.css` from base-nova's own neutral tokens, light and dark;
      never copy upstream's theme values. Screenshot the component page and a docs page with code in
      light and dark next to upstream's and the base-nova preview; list the differences in the report.
- [ ] **Step 1:** read upstream `lib/highlight-code.ts`, `component-preview.tsx`,
      `component-preview-tabs.tsx`, `code-collapsible-wrapper.tsx`, `code-block-command.tsx`,
      `copy-button.tsx`, `docs-copy-page.tsx` and the code parts of `mdx-components.tsx` live.
- [ ] **Step 2: Write the failing unit specs.** `highlightCode('const a = 1', 'ts')` returns HTML
      holding both themes' colours; `CodeBlockCommand` given `npx shadcn@latest add x` shows `pnpm dlx
shadcn@latest add x` under `pnpm`, switches to `npx ...` under `npm`, and the copy button copies
      the visible command; `CopyPageButton` fetches `<url>.md` and writes it to the clipboard. An MDX fence ` ```tsx ` renders a block whose header shows `tsx`; one with `title="app.tsx"` shows the title too.
- [ ] **Step 3: Build them.** Preview: one card, demo above, source below collapsed with a
      `View code` button, no `Preview`/`Code` tabs. Install: package-manager tabs remembered in
      `localStorage` (read and written inside `try`). Code block: a header bar that always shows the fence's language (label and icon; the fence's
      title beside it when given), copy button,
      horizontal overflow inside the block. Page header: title, description, `Copy page`, previous /
      next icon buttons (`aria-label`s `Previous page` / `Next page`).
- [ ] **Step 4: Update the e2e** `component-page.spec.ts` to the new shape (the demo renders, `View code`
      expands the source, the install block switches managers), and add: at 390x844 a code block's
      width does not exceed the viewport and the page does not scroll sideways.
- [ ] **Step 5:** run unit + e2e; remove touched files from both `PENDING` lists; commit
      `feat(registry-ui): rebuild the code preview, code blocks and page header on upstream's shape`.

### Task 6: Drop the primitive pages

**Files:**

- Modify: `content/docs/components/meta.json`, `content/docs/components/index.mdx`,
  `src/components/navigation/components-list.tsx`, `src/lib/source.spec.ts`
- Delete: `content/docs/components/button.mdx` and the example files only it renders (find them with
  `grep -o 'name="[^"]*"' content/docs/components/button.mdx`, and confirm no other page and no
  `registry.json` entry names each before deleting it)

- [ ] **Step 1:** add to `source.spec.ts` a failing case: every page under `content/docs/components/`
      (index aside) names a `registry:component` item in `registry.json`. It fails on `button.mdx`.
- [ ] **Step 2:** delete the page and its demos, drop the `Primitives` group from `meta.json`.
      Each remaining item page lists the primitives it depends on under `## Dependencies`, each linking
      to `https://ui.shadcn.com/docs/components/base/<name>` - only where a page exists already.
- [ ] **Step 3:** rerun `examples-index`, unit, e2e, `shadcn build` + `validate`; remove touched files
      from `PENDING`; commit `feat(registry-ui): drop the primitive pages from the docs`.

### Task 7: Rebuild `general`, `feedback`, `navigation`

**Files:** every `.tsx` under `registry/bases/base-ui/components/{general,feedback,navigation}/`
(9 modules + specs), their examples under `registry/bases/base-ui/examples/`, and their entries in
`registry.json` (animated-icon `registryDependencies`).

- [ ] **Step 1:** for each module, read the upstream base-nova preview card closest to it (the list:
      `gh api 'repos/shadcn-ui/ui/contents/apps/v4/registry/bases/base/blocks/preview-02/cards' --jq '.[].name'`)
      to see how the same primitives compose there.
- [ ] **Step 2:** remove the module and its examples from both `PENDING` lists; run the two specs:
      they now FAIL and name each class and string to change.
- [ ] **Step 3:** rebuild: each removed class is replaced by the primitive's own variant or size
      prop, or dropped for the primitive's default; each palette colour becomes a theme token (add a
      missing status token to `styles.css` with light and dark values); icons from Task 1; copy to
      sentence case. Props and behaviour unchanged.
- [ ] **Step 4:** the item's own spec still passes; a case that asserted a removed class is rewritten
      to assert the behaviour it stood for. `shadcn build` + `validate` pass. Commit
      `refactor(registry-ui): rebuild the general, feedback and navigation items on base-nova`.

### Task 8: Rebuild `data-display`

Same steps as Task 7, for every `.tsx` under `registry/bases/base-ui/components/data-display/`
(10 modules), their examples and their `registry.json` entries. `code-block.tsx` and
`highlighted-code.tsx` take the same themes as Task 5's `highlightCode` but stay self-contained,
because a consumer installs them without this site. Commit
`refactor(registry-ui): rebuild the data-display items on base-nova`.

### Task 9: Rebuild `data-entry`

Same steps as Task 7, for every `.tsx` under `registry/bases/base-ui/components/data-entry/`
(10 modules), their examples and their `registry.json` entries. Commit
`refactor(registry-ui): rebuild the data-entry items on base-nova`.

### Task 10: Rebuild `layout`

Same steps as Task 7, for every `.tsx` under `registry/bases/base-ui/components/layout/`
(13 modules), their examples and their `registry.json` entries. Commit
`refactor(registry-ui): rebuild the layout items on base-nova`.

### Task 11: Rebuild the block and the remaining examples and pages

Same steps as Task 7, for `registry/bases/base-ui/blocks/`, every example still in a `PENDING` list,
every remaining `src/` module and every MDX page still listed. Commit
`refactor(registry-ui): rebuild the block and the remaining examples on base-nova`.

### Task 12: Close the lists, record the choices, show the result

**Files:**

- Modify: `apps/registry-ui/classes.spec.ts`, `apps/registry-ui/copy.spec.ts`, `AGENTS.md`

- [ ] **Step 1:** both `PENDING` lists are empty; delete the constant and the "lists as pending" case
      from each spec, so each holds the whole tree.
- [ ] **Step 2:** `AGENTS.md` (`CLAUDE.md` imports it): replace the animated-icons choice's "never
      vendored" with what is true now - vendored as `shadcn add` output under `registry/bases/base-ui/ui/`
      like the primitives, never published, and named by URL in items' `registryDependencies`; add one
      choice line for the two gate specs and the sentence-case rule.
- [ ] **Step 3:** full gate, `wrangler:build`, e2e, `shadcn build` + `validate`.
- [ ] **Step 4:** with a dev server you start on a free port (never 3000), screenshot `/docs`,
      `/docs/components/status-indicator`, `/blocks` at 1440x900 and 390x844, light and dark, into
      `.playwright-mcp/c2/`, and the same pages upstream into the same folder; list them in the report.
      Stop the server and `git restore apps/registry-ui/next-env.d.ts`.
- [ ] **Step 5: Commit** `docs: record the base-nova rules and the vendored animated icons`.
