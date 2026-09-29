# Registry Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/registry-ui/registry.json` publishes all 42 composed families and the one block, each named after its file, described by its current API, declaring exactly what its files import and carrying the theme tokens it paints with, each with one published `<name>-demo`; two specs in the gate hold all of it.

**Architecture:** Task 1 writes `registry/registry.spec.ts` with the rules that an item declares what its files import and carries the tokens it paints with, and brings the seven existing items and the block up to them. Task 2 gives `examples/` its demo shape and `examples/examples.spec.tsx`, which renders every example. Tasks 3 to 8 publish the families one kind folder at a time, in the order their items depend on each other; Task 9 adds the docs-only demos of the compositions that replaced removed components; Task 10 adds the rules that every family is one item and every item has one demo. Every task was rehearsed on a throwaway worktree with the tasks before it applied; each `Expected:` line is real output from that stacked tree.

**Tech Stack:** shadcn 4.21.0 (base-vega), React 19, Base UI, Tailwind CSS v4, Vitest + Testing Library (jsdom; the registry spec runs in the node environment), TypeScript, nx 23, pnpm 10.33.0.

**Spec:** `docs/superpowers/specs/2026-09-29-registry-items-design.md`

## Global Constraints

- Nothing is published and nothing consumes the registry: item names change freely, no alias items, no compatibility shims.
- `registry/bases/base-ui/ui/`, `lib/utils.ts` and `hooks/use-mobile.ts` are vendored: never edited, never shipped as a file; they map to `@shadcn/<x>`, `@shadcn/utils`, `@shadcn/use-mobile`. No task changes a component's code.
- An item's `files` are its family file (or demo file) first, then every `lib/`, `hooks/`, `types/` file it imports, transitively (dynamic `import()` included), as `registry:lib` or `registry:hook`, with no `target`. Another item's file is its URL `https://ui.zeroxsolutions.com/r/<name>.json`; a bare import is its npm package in `dependencies`; `react` and `react-dom` are never listed.
- Item fields in this key order: `name`, `type`, `title`, `description`, `categories`, `dependencies`, `registryDependencies`, `cssVars`, `files`. `name` is the file basename, `title` the root in words, `description` one sentence on the current API, `categories` the kind folder (`blocks` for the block, `examples` for a demo). Arrays sorted, except `files`.
- Registry order: component items grouped by kind folder (`data-display`, `data-entry`, `feedback`, `general`, `layout`, `navigation`), alphabetical inside a group; then the block; then the demos in their items' order.
- `cssVars` only on an item whose files paint with `success` or `warning`, carrying only the tokens used: `theme` maps `color-<token>` to `var(--<token>)`, `light` and `dark` copy `styles.css`'s `:root` and `.dark` values.
- `examples/` is flat. An item's demo is `examples/<name>-demo.tsx`, exporting `<Root>Demo` at the foot, returning `ReactNode`; it is the `registry:example` item `<name>-demo`. A primitive's demo or a removed component's composition is a docs-only file no item names.
- Every task is test-first: its failing spec cases and their real RED output come before the change. Test output is pristine: zero `not wrapped in act` lines, fixed in the spec.
- Every command runs from `apps/registry-ui` unless the step says otherwise. `$S` is a scratch directory outside the repository: `S=$(mktemp -d)` once, before Task 1, reused by every task.
- Commits name their paths (`git commit -q -F "$S/msg-tN.txt" -- <paths>`; new files `git add`ed first), the message comes from a file and ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never `--no-verify`, never `HUSKY=0`. The pre-commit hook must print `Successfully ran targets lint, typecheck, build, test for 5 projects`; the rehearsal could not run the hook (a worktree has no husky install), so this line is the one `Expected` not measured there. After the commit, `git status --short` and `git diff HEAD` are empty; a stale index entry the hook's formatter leaves is cleared by `git add` of that path, with no new commit.
- `tsc` prints exactly the one baseline line `registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307` at every task.
- Authored text is plain ASCII; comments name no rule and no skill.

## Review Focus

- A family whose root renders no element of its own (NumberField, PasswordInput over upstream `input-group`; EmojiPicker, LanguageCombobox, AvatarPicker over a context-only root) is checked in `examples.spec.tsx` by a slot another demo could also render; the reviewer checks each such row names the most specific slot the demo renders from that family (Tasks 3, 6).
- A demo rendered into a portal (CommandMenu) is found with `document.querySelector`; every case must `cleanup` after itself or a later row passes on a leftover node; Task 2 gives the spec `afterEach(cleanup)` and Task 5 widens the query, so the reviewer checks both together.
- A shipped `lib/` file that loads another file only through `import()` (the Shiki highlighter) must still ship that file; Task 1's rule reads dynamic imports and Task 7's `code-block` item is where it bites.
- A consumer's project that already defines `--success` or `--warning` receives this registry's values through `cssVars`; shadcn merges them into the project's CSS. No check covers the merge, because `https://ui.zeroxsolutions.com` does not resolve and no `shadcn add` runs against these items.
- A removed component's composition must behave as the component did, including the defect it fixed: `alert-dialog-confirm` closes its dialog after confirming (Task 9 pins it).

---

### Task 1: Hold registry.json to what its items import and paint with

Spec (b) rules 3 and 4. `registry/registry.spec.ts` reads `registry.json` and the source tree and reports, per item, every file, upstream item and package its files import but it does not declare (and the reverse), and every `success`/`warning` token its files paint with that its `cssVars` do not carry (and the reverse). Each report the two rules can make has a case fed a deliberately wrong fragment over the real source files. Run against master, the rules find `demo-page-hero` importing a page no item ships and two items painting with `success`/`warning` without the tokens. The same commit renames `status-dot`, `field-grid` and `field-group` after their files, rewrites the seven component items and the block (title, description and category from each file's current API, the key order the plan fixes, `cssVars` where they paint with the tokens), deletes `demo-page`, `pages/demo-page.tsx` and `demo-page-hero`, and corrects the spec's path to the new test. The rules live in the spec file itself: they have one reader, and `vitest.config.mts` only collects `registry/**` and `src/**`.

**Files:**

- Create: `apps/registry-ui/registry/registry.spec.ts`
- Modify: `apps/registry-ui/registry.json` (rewritten), `docs/superpowers/specs/2026-09-29-registry-items-design.md` (Tests section)
- Delete: `apps/registry-ui/registry/bases/base-ui/pages/demo-page.tsx` (and so `pages/`), `apps/registry-ui/registry/bases/base-ui/examples/demo-page-hero.tsx`

**Interfaces:**

- Consumes: master `310a841` (the plan B tree): 7 `registry:component` items, 1 block, 1 page, 13 examples, 22 items.
- Produces, module-local in `apps/registry-ui/registry/registry.spec.ts` (nothing is exported; later tasks add cases and rules to this file):
  - types `RegistryFile { path; type; target? }`, `RegistryItem { name; type; dependencies?; registryDependencies?; cssVars?; files }`, `CssVars = Record<'theme' | 'light' | 'dark', Record<string, string>>`, `Declaration { files; registryDependencies; dependencies }` (all `string[]`; a file is spelled `<path> (<type>)`)
  - constants `APP` (the app root, absolute), `BASE = 'registry/bases/base-ui'`, `ITEM_URL = 'https://ui.zeroxsolutions.com/r/'`, `REGISTRY: { items: RegistryItem[] }` (parsed `registry.json`)
  - `importsOf(path: string): string[]` - specifiers of `import ... from`, `export ... from`, `import '...'` and `import('...')` in an app-relative file; `import type` of a package is skipped, of a `@/` or relative file is kept
  - `sourceOf(importer: string, specifier: string): string | undefined` - the app-relative file (`.ts`, `.tsx`, `/index.ts(x)`), `undefined` for a package; throws for a `@/` specifier outside `registry/` or one that resolves to no file
  - `upstreamOf(source: string): string | undefined` - `ui/<x>` to `@shadcn/<x>`, `lib/utils.ts` to `@shadcn/utils`, `hooks/use-mobile.ts` to `@shadcn/use-mobile`
  - `packageOf(specifier: string): string`
  - `ownersOf(items: RegistryItem[]): Map<string, string>` - every `components/` or `blocks/` file an item lists, to that item's name
  - `expectedDeclaration(item: RegistryItem, owners: ReadonlyMap<string, string>): Declaration` - sorted; throws `<importer> imports <specifier>, which no registry item ships`
  - `declarationProblems(item: RegistryItem, owners: ReadonlyMap<string, string>): string[]` - `<item>: <field> lacks <value>`, `<item>: <field> declares <value>, which its files do not import`, or `<item>: <thrown message>`
  - `themeValue(selector: ':root' | '.dark', token: string): string` - from `registry/bases/base-ui/styles.css`
  - `cssVarsProblems(item: RegistryItem): string[]` - `<item>: paints with <tokens joined by " and "> but carries no cssVars`, `<item>: carries cssVars but paints with neither success nor warning`, `<item>: cssVars should be <JSON>`
  - fixtures `treeItem`, `aiProviderPicker`, `statusIndicator` (correct declarations of those three items)
  - registry order: `ai-provider-card`, `chat-message`, `model-info-card` (data-display), `tree-item` (data-entry), `status-indicator` (feedback), `panel-field-group`, `panel-row` (layout), `ai-provider-picker` (block), then the examples; 20 items
- Removed: items `status-dot`, `field-grid`, `field-group` (renamed `status-indicator`, `panel-field-group`, `panel-row`), `demo-page`, `demo-page-hero`; `DemoPage`, `DemoPageProps`, `DemoPageHero`.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/` or `docs/`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/registry.spec.ts`:

```text
// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { describe, expect, it } from 'vitest';

interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

type CssVars = Record<'theme' | 'light' | 'dark', Record<string, string>>;

interface RegistryItem {
  name: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
  cssVars?: CssVars;
  files: RegistryFile[];
}

/** What an item's files import, as its three declaration fields spell it; a file reads `<path> (<type>)`. */
interface Declaration {
  files: string[];
  registryDependencies: string[];
  dependencies: string[];
}

const APP = resolve(import.meta.dirname, '..');
const BASE = 'registry/bases/base-ui';
const ITEM_URL = 'https://ui.zeroxsolutions.com/r/';

const REGISTRY = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as { items: RegistryItem[] };

describe('registry.json', () => {
  it('declares exactly the files, upstream items and packages each item imports', () => {
    const owners = ownersOf(REGISTRY.items);
    expect(REGISTRY.items.flatMap((item) => declarationProblems(item, owners))).toEqual([]);
  });

  it('carries the success and warning tokens an item paints with, and no others', () => {
    expect(REGISTRY.items.flatMap(cssVarsProblems)).toEqual([]);
  });
});

const treeItem: RegistryItem = {
  name: 'tree-item',
  type: 'registry:component',
  dependencies: ['lucide-react'],
  registryDependencies: ['@shadcn/button', '@shadcn/input', '@shadcn/item', '@shadcn/utils'],
  files: [
    { path: `${BASE}/components/data-entry/tree-item.tsx`, type: 'registry:component' },
    { path: `${BASE}/lib/ime.ts`, type: 'registry:lib' },
  ],
};

const aiProviderPicker: RegistryItem = {
  name: 'ai-provider-picker',
  type: 'registry:block',
  dependencies: ['@zeroxsolutions/icons'],
  registryDependencies: ['@shadcn/card', `${ITEM_URL}ai-provider-card.json`],
  files: [{ path: `${BASE}/blocks/ai-provider-picker.tsx`, type: 'registry:block' }],
};

describe('declarationProblems', () => {
  it('reports nothing for an item declaring exactly what its files import', () => {
    expect(declarationProblems(treeItem, new Map())).toEqual([]);
  });

  it('reports a lib file the item imports but does not ship', () => {
    const item = { ...treeItem, files: treeItem.files.slice(0, 1) };
    expect(declarationProblems(item, new Map())).toEqual([
      'tree-item: files lacks registry/bases/base-ui/lib/ime.ts (registry:lib)',
    ]);
  });

  it('reports a shipped file no file of the item imports', () => {
    const item = {
      ...treeItem,
      files: [...treeItem.files, { path: `${BASE}/types/status-tone.ts`, type: 'registry:lib' }],
    };
    expect(declarationProblems(item, new Map())).toEqual([
      'tree-item: files declares registry/bases/base-ui/types/status-tone.ts (registry:lib), which its files do not import',
    ]);
  });

  it('reports an upstream part the item imports but does not declare', () => {
    const item = { ...treeItem, registryDependencies: ['@shadcn/input', '@shadcn/item', '@shadcn/utils'] };
    expect(declarationProblems(item, new Map())).toEqual(['tree-item: registryDependencies lacks @shadcn/button']);
  });

  it('reports a registry dependency no file of the item imports', () => {
    const item = { ...treeItem, registryDependencies: [...(treeItem.registryDependencies ?? []), '@shadcn/card'] };
    expect(declarationProblems(item, new Map())).toEqual([
      'tree-item: registryDependencies declares @shadcn/card, which its files do not import',
    ]);
  });

  it('reports a package the item imports but does not declare', () => {
    const item = { ...treeItem, dependencies: [] };
    expect(declarationProblems(item, new Map())).toEqual(['tree-item: dependencies lacks lucide-react']);
  });

  it('reports a package no file of the item imports', () => {
    const item = { ...treeItem, dependencies: ['lucide-react', 'shiki'] };
    expect(declarationProblems(item, new Map())).toEqual([
      'tree-item: dependencies declares shiki, which its files do not import',
    ]);
  });

  it('names the item that ships a component file by its URL', () => {
    const owners = new Map([[`${BASE}/components/data-display/ai-provider-card.tsx`, 'ai-provider-card']]);
    expect(declarationProblems(aiProviderPicker, owners)).toEqual([]);
  });

  it('reports a component file the item imports that no item ships', () => {
    expect(declarationProblems(aiProviderPicker, new Map())).toEqual([
      'ai-provider-picker: registry/bases/base-ui/blocks/ai-provider-picker.tsx imports @/registry/bases/base-ui/components/data-display/ai-provider-card, which no registry item ships',
    ]);
  });
});

const statusIndicator: RegistryItem = {
  name: 'status-indicator',
  type: 'registry:component',
  registryDependencies: ['@shadcn/utils'],
  files: [
    { path: `${BASE}/components/feedback/status-indicator.tsx`, type: 'registry:component' },
    { path: `${BASE}/types/status-tone.ts`, type: 'registry:lib' },
  ],
};

describe('cssVarsProblems', () => {
  it('reports an item that paints with success or warning and carries no cssVars', () => {
    expect(cssVarsProblems(statusIndicator)).toEqual([
      'status-indicator: paints with success and warning but carries no cssVars',
    ]);
  });

  it('reports cssVars on an item that paints with neither token', () => {
    const item = { ...treeItem, cssVars: { theme: {}, light: {}, dark: {} } };
    expect(cssVarsProblems(item)).toEqual(['tree-item: carries cssVars but paints with neither success nor warning']);
  });

  it('reports cssVars that leave out a token the item paints with', () => {
    const item = {
      ...statusIndicator,
      cssVars: {
        theme: { 'color-success': 'var(--success)' },
        light: { success: 'oklch(0.627 0.19 149)' },
        dark: { success: 'oklch(0.723 0.19 149)' },
      },
    };
    expect(cssVarsProblems(item)).toEqual([
      'status-indicator: cssVars should be {"theme":{"color-success":"var(--success)","color-warning":"var(--warning)"},"light":{"success":"oklch(0.627 0.19 149)","warning":"oklch(0.681 0.162 75.834)"},"dark":{"success":"oklch(0.723 0.19 149)","warning":"oklch(0.79 0.155 80)"}}',
    ]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/registry.spec.ts > "$S/red-t1.log" 2>&1; grep -E 'ReferenceError|Test Files|^ +Tests' "$S/red-t1.log" | sort | uniq -c`
Expected:

```
   1       Tests  14 failed (14)
   1  Test Files  1 failed (1)
   4 ReferenceError: cssVarsProblems is not defined
   9 ReferenceError: declarationProblems is not defined
   1 ReferenceError: ownersOf is not defined
```

- [ ] **Step 3: Add the rules**

In `apps/registry-ui/registry/registry.spec.ts`, insert between the `const REGISTRY = ...` line (and the blank line after it) and `describe('registry.json', () => {`:

```text
const FROM_IMPORT = /^\s*(?:import|export)\s+(type\s+)?[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/gm;
const BARE_IMPORT = /^\s*import\s*['"]([^'"]+)['"]/gm;
const DYNAMIC_IMPORT = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
const SHIPPED = /^registry\/bases\/base-ui\/(lib|hooks|types)\//;
const TOKEN_CLASS = /\b(?:bg|text|border|ring|fill|stroke)-(success|warning)(?![\w-])/g;

/** The specifiers a source file imports; a type-only import of a package is left out, since nothing installs for it. */
function importsOf(path: string): string[] {
  const source = readFileSync(join(APP, path), 'utf8');
  return [
    ...[...source.matchAll(FROM_IMPORT)]
      .filter(([, typeOnly, specifier]) => !typeOnly || specifier.startsWith('@/') || specifier.startsWith('.'))
      .map(([, , specifier]) => specifier),
    ...[...source.matchAll(BARE_IMPORT)].map(([, specifier]) => specifier),
    ...[...source.matchAll(DYNAMIC_IMPORT)].map(([, specifier]) => specifier),
  ];
}

/** The app-relative file a specifier names, or undefined for a package. */
function sourceOf(importer: string, specifier: string): string | undefined {
  let stem: string;
  if (specifier.startsWith('@/registry/')) stem = specifier.slice('@/'.length);
  else if (specifier.startsWith('.')) stem = join(dirname(importer), specifier);
  else if (specifier.startsWith('@/')) throw new Error(`${importer} imports ${specifier}, which is app code`);
  else return undefined;
  const found = ['.ts', '.tsx', '/index.ts', '/index.tsx']
    .map((ext) => stem + ext)
    .find((p) => existsSync(join(APP, p)));
  if (found === undefined) throw new Error(`${importer} imports ${specifier}, which resolves to no file`);
  return found;
}

/** The upstream item a vendored file is, or undefined for a file this registry owns. */
function upstreamOf(source: string): string | undefined {
  const part = /^registry\/bases\/base-ui\/ui\/([^/]+)\.tsx?$/.exec(source);
  if (part) return `@shadcn/${part[1]}`;
  if (source === `${BASE}/lib/utils.ts`) return '@shadcn/utils';
  if (source === `${BASE}/hooks/use-mobile.ts`) return '@shadcn/use-mobile';
  return undefined;
}

function packageOf(specifier: string): string {
  return specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/');
}

/** Each component or block file an item ships, mapped to that item's name. */
function ownersOf(items: RegistryItem[]): Map<string, string> {
  return new Map(
    items.flatMap((item) =>
      item.files
        .filter((file) => file.path.startsWith(`${BASE}/components/`) || file.path.startsWith(`${BASE}/blocks/`))
        .map((file) => [file.path, item.name] as const),
    ),
  );
}

/**
 * What the item has to declare for `shadcn add` to write files that compile: its own files (every one
 * outside lib/, hooks/ and types/), the lib/, hooks/ and types/ files they reach, the upstream item for a
 * vendored file, another item's URL for a file that item ships, and the package for a bare import.
 */
function expectedDeclaration(item: RegistryItem, owners: ReadonlyMap<string, string>): Declaration {
  const roots = item.files.filter((file) => !SHIPPED.test(file.path));
  const files = new Set(roots.map((file) => `${file.path} (${file.type})`));
  const registryDependencies = new Set<string>();
  const dependencies = new Set<string>();
  const seen = new Set(roots.map((file) => file.path));
  const pending = [...seen];
  for (let importer = pending.pop(); importer !== undefined; importer = pending.pop()) {
    for (const specifier of importsOf(importer)) {
      const source = sourceOf(importer, specifier);
      const upstream = source === undefined ? undefined : upstreamOf(source);
      if (source === undefined) {
        const name = packageOf(specifier);
        if (name !== 'react' && name !== 'react-dom') dependencies.add(name);
      } else if (upstream !== undefined) {
        registryDependencies.add(upstream);
      } else if (SHIPPED.test(source)) {
        if (!seen.has(source)) {
          seen.add(source);
          pending.push(source);
          files.add(`${source} (${source.startsWith(`${BASE}/hooks/`) ? 'registry:hook' : 'registry:lib'})`);
        }
      } else {
        const owner = owners.get(source);
        if (owner === undefined) throw new Error(`${importer} imports ${specifier}, which no registry item ships`);
        if (owner !== item.name) registryDependencies.add(`${ITEM_URL}${owner}.json`);
      }
    }
  }
  const sorted = (values: Set<string>): string[] => [...values].sort();
  return {
    files: sorted(files),
    registryDependencies: sorted(registryDependencies),
    dependencies: sorted(dependencies),
  };
}

function declarationProblems(item: RegistryItem, owners: ReadonlyMap<string, string>): string[] {
  let expected: Declaration;
  try {
    expected = expectedDeclaration(item, owners);
  } catch (error) {
    return [`${item.name}: ${(error as Error).message}`];
  }
  const declared: Declaration = {
    files: item.files.map((file) => `${file.path} (${file.type})`),
    registryDependencies: item.registryDependencies ?? [],
    dependencies: item.dependencies ?? [],
  };
  return (['files', 'registryDependencies', 'dependencies'] as const).flatMap((field) => [
    ...expected[field]
      .filter((value) => !declared[field].includes(value))
      .map((value) => `${item.name}: ${field} lacks ${value}`),
    ...declared[field]
      .filter((value) => !expected[field].includes(value))
      .map((value) => `${item.name}: ${field} declares ${value}, which its files do not import`),
  ]);
}

/** A custom property's value inside one top-level block of the base stylesheet. */
function themeValue(selector: ':root' | '.dark', token: string): string {
  const css = readFileSync(join(APP, BASE, 'styles.css'), 'utf8');
  const block = new RegExp(`^${selector.replace('.', '\\.')} \\{\\n([\\s\\S]*?)^\\}`, 'm').exec(css)?.[1] ?? '';
  const value = new RegExp(`^\\s*--${token}:\\s*([^;]+);`, 'm').exec(block)?.[1];
  if (value === undefined) throw new Error(`styles.css declares no --${token} under ${selector}`);
  return value;
}

function cssVarsProblems(item: RegistryItem): string[] {
  const tokens = [
    ...new Set(
      item.files.flatMap((file) =>
        [...readFileSync(join(APP, file.path), 'utf8').matchAll(TOKEN_CLASS)].map(([, token]) => token),
      ),
    ),
  ].sort();
  if (tokens.length === 0) {
    return item.cssVars ? [`${item.name}: carries cssVars but paints with neither success nor warning`] : [];
  }
  if (!item.cssVars) return [`${item.name}: paints with ${tokens.join(' and ')} but carries no cssVars`];
  const expected: CssVars = {
    theme: Object.fromEntries(tokens.map((token) => [`color-${token}`, `var(--${token})`])),
    light: Object.fromEntries(tokens.map((token) => [token, themeValue(':root', token)])),
    dark: Object.fromEntries(tokens.map((token) => [token, themeValue('.dark', token)])),
  };
  return isDeepStrictEqual(item.cssVars, expected)
    ? []
    : [`${item.name}: cssVars should be ${JSON.stringify(expected)}`];
}
```

- [ ] **Step 4: Run it: the rule cases pass and the real registry fails**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/registry.spec.ts`
Expected (excerpt):

```
 ❯ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests | 2 failed)
     × declares exactly the files, upstream items and packages each item imports
     × carries the success and warning tokens an item paints with, and no others
     ✓ reports nothing for an item declaring exactly what its files import
     ✓ reports a lib file the item imports but does not ship
     ✓ reports a shipped file no file of the item imports
     ✓ reports an upstream part the item imports but does not declare
     ✓ reports a registry dependency no file of the item imports
     ✓ reports a package the item imports but does not declare
     ✓ reports a package no file of the item imports
     ✓ names the item that ships a component file by its URL
     ✓ reports a component file the item imports that no item ships
     ✓ reports an item that paints with success or warning and carries no cssVars
     ✓ reports cssVars on an item that paints with neither token
     ✓ reports cssVars that leave out a token the item paints with
+   "demo-page-hero: registry/bases/base-ui/examples/demo-page-hero.tsx imports @/registry/bases/base-ui/pages/demo-page, which no registry item ships",
+   "status-dot: paints with success and warning but carries no cssVars",
+   "ai-provider-card: paints with success and warning but carries no cssVars",
 Test Files  1 failed (1)
      Tests  2 failed | 12 passed (14)
```

(Every other item already declares what it imports; plan B Task 32 settled that. `demo-page` is a page, and `ownersOf` maps `components/` and `blocks/` files only, so nothing may import it.)

- [ ] **Step 5: Rewrite registry.json and delete the page**

Run (from `apps/registry-ui`):

```bash
git rm -q registry/bases/base-ui/pages/demo-page.tsx registry/bases/base-ui/examples/demo-page-hero.tsx
```

`apps/registry-ui/registry.json` (whole file; the examples keep their names and fields, only `field-group-hero` changes: its two item URLs follow the renames and its `registryDependencies` are sorted, and they move below the block, item demos first in item order, the docs-only Button examples last):

```text
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "zeroxsolutions-ui",
  "homepage": "https://ui.zeroxsolutions.com",
  "items": [
    {
      "name": "ai-provider-card",
      "type": "registry:component",
      "title": "AI Provider Card",
      "description": "A small card for one AI provider in an overview grid, whose status tones its footer note and whose covering trigger selects it.",
      "categories": ["data-display"],
      "registryDependencies": ["@shadcn/card", "@shadcn/utils"],
      "cssVars": {
        "theme": {
          "color-success": "var(--success)",
          "color-warning": "var(--warning)"
        },
        "light": {
          "success": "oklch(0.627 0.19 149)",
          "warning": "oklch(0.681 0.162 75.834)"
        },
        "dark": {
          "success": "oklch(0.723 0.19 149)",
          "warning": "oklch(0.79 0.155 80)"
        }
      },
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/ai-provider-card.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/types/status-tone.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "chat-message",
      "type": "registry:component",
      "title": "Chat Message",
      "description": "One chat message row over upstream Message, with a leading-edge accent while its text is still streaming.",
      "categories": ["data-display"],
      "registryDependencies": ["@shadcn/message", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/chat-message.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "model-info-card",
      "type": "registry:component",
      "title": "Model Info Card",
      "description": "The detail panel for one model: an identity header composed from Item parts over titled sections.",
      "categories": ["data-display"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/model-info-card.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "tree-item",
      "type": "registry:component",
      "title": "Tree Item",
      "description": "One row of a hierarchy tree over upstream Item, with a depth indent and disclosure, a clickable label and an inline rename input.",
      "categories": ["data-entry"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/button", "@shadcn/input", "@shadcn/item", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/tree-item.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/lib/ime.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "status-indicator",
      "type": "registry:component",
      "title": "Status Indicator",
      "description": "A small decorative dot coloured by a semantic status tone (online, offline, busy or idle), which can pulse for a state still in progress.",
      "categories": ["feedback"],
      "registryDependencies": ["@shadcn/utils"],
      "cssVars": {
        "theme": {
          "color-success": "var(--success)",
          "color-warning": "var(--warning)"
        },
        "light": {
          "success": "oklch(0.627 0.19 149)",
          "warning": "oklch(0.681 0.162 75.834)"
        },
        "dark": {
          "success": "oklch(0.723 0.19 149)",
          "warning": "oklch(0.79 0.155 80)"
        }
      },
      "files": [
        {
          "path": "registry/bases/base-ui/components/feedback/status-indicator.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/types/status-tone.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "panel-field-group",
      "type": "registry:component",
      "title": "Panel Field Group",
      "description": "The tight grid for paired and triplet inputs in a property panel, with any number of columns.",
      "categories": ["layout"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/panel-field-group.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "panel-row",
      "type": "registry:component",
      "title": "Panel Row",
      "description": "One row of a property section, its fields beside a trailing action column that keeps every row's right edge aligned.",
      "categories": ["layout"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/panel-row.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "ai-provider-picker",
      "type": "registry:block",
      "title": "AI Provider Picker",
      "description": "A responsive grid of AI provider cards, from the host's entries or a sample, that calls back with the provider key a card selects.",
      "categories": ["blocks"],
      "dependencies": ["@zeroxsolutions/icons"],
      "registryDependencies": ["@shadcn/card", "https://ui.zeroxsolutions.com/r/ai-provider-card.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/blocks/ai-provider-picker.tsx",
          "type": "registry:block"
        }
      ]
    },
    {
      "name": "chat-message-hero",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "ChatMessage Hero",
      "description": "A user bubble plus an assistant row - monochrome.",
      "registryDependencies": [
        "https://ui.zeroxsolutions.com/r/chat-message.json",
        "@shadcn/bubble",
        "@shadcn/message"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/chat-message-hero.tsx",
          "type": "registry:example",
          "target": "examples/chat-message-hero.tsx"
        }
      ]
    },
    {
      "name": "tree-hero",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "TreeItem Hero",
      "description": "A small hierarchy tree of TreeItem rows.",
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/tree-item.json", "@shadcn/item"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/tree-hero.tsx",
          "type": "registry:example",
          "target": "examples/tree-hero.tsx"
        }
      ]
    },
    {
      "name": "field-group-hero",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "FieldGroup Hero",
      "description": "A two-column field grid with a trailing action slot.",
      "dependencies": ["lucide-react"],
      "registryDependencies": [
        "@shadcn/button",
        "@shadcn/input",
        "@shadcn/label",
        "https://ui.zeroxsolutions.com/r/panel-field-group.json",
        "https://ui.zeroxsolutions.com/r/panel-row.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/field-group-hero.tsx",
          "type": "registry:example",
          "target": "examples/field-group-hero.tsx"
        }
      ]
    },
    {
      "name": "ai-provider-picker-hero",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "AiProviderPicker Hero",
      "description": "The AiProviderPicker block rendering its default provider grid.",
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/ai-provider-picker.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/ai-provider-picker-hero.tsx",
          "type": "registry:example",
          "target": "examples/ai-provider-picker-hero.tsx"
        }
      ]
    },
    {
      "name": "button-hero",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "Button Hero",
      "description": "All Button variants in one row - the hero preview for the Button doc page.",
      "registryDependencies": ["@shadcn/button"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/button-hero.tsx",
          "type": "registry:example",
          "target": "examples/button-hero.tsx"
        }
      ]
    },
    {
      "name": "button-default",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "Button Default",
      "description": "The default Button variant.",
      "registryDependencies": ["@shadcn/button"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/button-default.tsx",
          "type": "registry:example",
          "target": "examples/button-default.tsx"
        }
      ]
    },
    {
      "name": "button-secondary",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "Button Secondary",
      "description": "The secondary Button variant.",
      "registryDependencies": ["@shadcn/button"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/button-secondary.tsx",
          "type": "registry:example",
          "target": "examples/button-secondary.tsx"
        }
      ]
    },
    {
      "name": "button-outline",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "Button Outline",
      "description": "The outline Button variant.",
      "registryDependencies": ["@shadcn/button"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/button-outline.tsx",
          "type": "registry:example",
          "target": "examples/button-outline.tsx"
        }
      ]
    },
    {
      "name": "button-destructive",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "Button Destructive",
      "description": "The destructive Button variant.",
      "registryDependencies": ["@shadcn/button"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/button-destructive.tsx",
          "type": "registry:example",
          "target": "examples/button-destructive.tsx"
        }
      ]
    },
    {
      "name": "button-ghost",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "Button Ghost",
      "description": "The ghost Button variant.",
      "registryDependencies": ["@shadcn/button"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/button-ghost.tsx",
          "type": "registry:example",
          "target": "examples/button-ghost.tsx"
        }
      ]
    },
    {
      "name": "split-button-hero",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "SplitButton Hero",
      "description": "A divided control - a primary action segment plus a caret that opens a menu.",
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/button", "@shadcn/button-group", "@shadcn/dropdown-menu"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/split-button-hero.tsx",
          "type": "registry:example",
          "target": "examples/split-button-hero.tsx"
        }
      ]
    },
    {
      "name": "menu-button-hero",
      "type": "registry:example",
      "categories": ["examples"],
      "title": "MenuButton Hero",
      "description": "A remembered-default split control - the primary repeats the selected action.",
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/button", "@shadcn/button-group", "@shadcn/dropdown-menu"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/menu-button-hero.tsx",
          "type": "registry:example",
          "target": "examples/menu-button-hero.tsx"
        }
      ]
    }
  ]
}
```

- [ ] **Step 6: Correct the spec's path to the test**

`docs/superpowers/specs/2026-09-29-registry-items-design.md`, in `## Tests`:

```diff
-`apps/registry-ui/registry.spec.ts` reads `registry.json` and the source tree and asserts:
+`apps/registry-ui/registry/registry.spec.ts` reads `registry.json` and the source tree and asserts:
```

```diff
 Each rule has a case that feeds it a deliberately wrong `registry.json` fragment and expects
-the failure, so a rule that cannot fail is caught. The three uncommitted scripts of plan B are
-the reference for rules 1 and 3; the family-name and part-shape scripts check components, not
-the registry, and stay out.
+the failure, so a rule that cannot fail is caught.
```

- [ ] **Step 7: Run the spec, the suite, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run registry/registry.spec.ts 2>&1 | grep -E 'Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t1.log"; grep -c 'not wrapped in act' "$S/vt-t1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t1.log" 2>&1; grep 'error TS' "$S/tsc-t1.log" | cut -c1-80
pnpm exec eslint registry/registry.spec.ts 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/registry.spec.ts registry.json ../../docs/superpowers/specs/2026-09-29-registry-items-design.md 2>&1 | tail -1
rm -rf "$S/r-t1"; pnpm exec shadcn build -o "$S/r-t1" > "$S/sb-t1.log" 2>&1; tail -1 "$S/sb-t1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 Test Files  1 passed (1)
      Tests  14 passed (14)
 Test Files  80 passed (80)
      Tests  456 passed (456)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 20 items.
```

(eslint prints no problem line. 79 files / 442 tests on master, plus this file's 14.)

- [ ] **Step 8: Commit**

`$S/msg-t1.txt`:

```
test(registry-ui): hold registry items to their imports and theme tokens

Why: nothing checked that an item declares what its files import or
the success and warning tokens it paints with, so shadcn add could
write a file that does not compile or a class with no colour. The new
spec reports both per item. Items take their file's name
(status-indicator, panel-field-group, panel-row) and a description of
their current API, the two items painting with the tokens carry them,
and the demo page goes: it only illustrated a page item.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add apps/registry-ui/registry/registry.spec.ts
git commit -q -F "$S/msg-t1.txt" -- apps/registry-ui/registry.json apps/registry-ui/registry/registry.spec.ts $B/pages/demo-page.tsx $B/examples/demo-page-hero.tsx docs/superpowers/specs/2026-09-29-registry-items-design.md
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 2: Examples take the demo shape, and one spec renders them all

Spec (b) Examples and Tests. The four examples of an item become its `<name>-demo` (file, component, registry item); the Button examples leave the registry as docs-only demos under upstream's names, and so do the two compositions that replaced `SplitButton` and `MenuButton` (`button-group-split`, `button-group-menu`). Every example takes the plan's shape: a plain `function` returning `ReactNode`, one `export { }` at the foot. `examples/examples.spec.tsx` renders every file the directory holds and checks the `data-slot` of what it demonstrates, so a new example without a row, or a row without a file, fails. It replaces the two `*-hero.spec.tsx`: their behaviour cases move in as named cases (both exercise the example's own wiring - the caret trigger, the radio group's `onValueChange` feeding the primary button - which no other spec covers), and their render-only cases go, the slot check carrying them.

**Files:**

- Create: `examples/examples.spec.tsx`
- Rename (and rewrite): `examples/chat-message-hero.tsx` to `examples/chat-message-demo.tsx`, `examples/tree-hero.tsx` to `examples/tree-item-demo.tsx`, `examples/field-group-hero.tsx` to `examples/panel-row-demo.tsx`, `examples/ai-provider-picker-hero.tsx` to `examples/ai-provider-picker-demo.tsx`, `examples/button-hero.tsx` to `examples/button-demo.tsx`, `examples/split-button-hero.tsx` to `examples/button-group-split.tsx`, `examples/menu-button-hero.tsx` to `examples/button-group-menu.tsx`
- Modify: `examples/button-default.tsx`, `examples/button-secondary.tsx`, `examples/button-outline.tsx`, `examples/button-destructive.tsx`, `examples/button-ghost.tsx`, `apps/registry-ui/src/app/page.tsx`, `apps/registry-ui/registry.json`
- Delete: `examples/split-button-hero.spec.tsx`, `examples/menu-button-hero.spec.tsx`

**Interfaces:**

- Consumes: the Task 1 tree.
- Produces:
  - from `examples/<file>`: `ChatMessageDemo`, `TreeItemDemo`, `PanelRowDemo`, `AiProviderPickerDemo`, `ButtonDemo`, `ButtonDefault`, `ButtonSecondary`, `ButtonOutline`, `ButtonDestructive`, `ButtonGhost`, `ButtonGroupSplit`, `ButtonGroupMenu`, each `(): ReactNode`
  - `examples/examples.spec.tsx`: `MODULES` (the eager `import.meta.glob` of `['./*.tsx', '!./*.spec.tsx']`), `EXPECTED_SLOT: Record<string, string>` (file basename to `data-slot`, one row per example file; a later task adds its rows), `EXAMPLES` (one `{ file, exportName, Example }` per export)
  - registry items `chat-message-demo`, `tree-item-demo`, `panel-row-demo`, `ai-provider-picker-demo`, appended after the block in item order; 12 items
- Removed: `ChatMessageHero`, `TreeHero`, `FieldGroupHero`, `AiProviderPickerHero`, `ButtonHero`, `SplitButtonHero`, `MenuButtonHero`; the registry items `chat-message-hero`, `tree-hero`, `field-group-hero`, `ai-provider-picker-hero`, `button-hero`, `button-default`, `button-secondary`, `button-outline`, `button-destructive`, `button-ghost`, `split-button-hero`, `menu-button-hero`.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the failing spec**

`apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`:

```text
/// <reference types="vite/client" />
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ButtonGroupMenu } from './button-group-menu';
import { ButtonGroupSplit } from './button-group-split';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

const MODULES = import.meta.glob<Record<string, ComponentType>>(['./*.tsx', '!./*.spec.tsx'], { eager: true });

/** Each example file, by basename, and the `data-slot` of the component it demonstrates. */
const EXPECTED_SLOT: Record<string, string> = {
  'ai-provider-picker-demo': 'ai-provider-picker',
  'button-default': 'button',
  'button-demo': 'button',
  'button-destructive': 'button',
  'button-ghost': 'button',
  'button-group-menu': 'button-group',
  'button-group-split': 'button-group',
  'button-outline': 'button',
  'button-secondary': 'button',
  'chat-message-demo': 'chat-message',
  'panel-row-demo': 'panel-row',
  'tree-item-demo': 'tree-item',
};

const EXAMPLES = Object.entries(MODULES).flatMap(([path, module]) =>
  Object.entries(module).map(([exportName, Example]) => ({
    file: path.slice('./'.length, -'.tsx'.length),
    exportName,
    Example,
  })),
);

describe('examples', () => {
  it('has a row for every example file and a file for every row', () => {
    const files = Object.keys(MODULES).map((path) => path.slice('./'.length, -'.tsx'.length));
    expect(files.sort()).toEqual(Object.keys(EXPECTED_SLOT).sort());
  });

  it.each(EXAMPLES)('$file renders $exportName with its data-slot', async ({ file, Example }) => {
    const { container } = render(<Example />);
    // An upstream ScrollArea measures its viewport in a queueMicrotask outside
    // render's own act() batch; settle it so no example leaves a state update
    // to land after the test has moved on.
    await act(async () => {});
    expect(container.querySelector(`[data-slot="${EXPECTED_SLOT[file]}"]`)).not.toBeNull();
  });

  it('button-group-split opens its related actions from the caret', async () => {
    render(<ButtonGroupSplit />);
    fireEvent.click(screen.getByRole('button', { name: 'More action options' }));
    expect(await screen.findByRole('menuitem', { name: 'Second' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Third' })).toBeTruthy();
  });

  it('button-group-menu makes the picked option the primary action', async () => {
    render(<ButtonGroupMenu />);
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Change action' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Always allow' }));
    expect(await screen.findByRole('button', { name: 'Always allow' })).toBeTruthy();
  });
});
```

(`import.meta.glob` is Vite's; the reference line gives `tsc` its type. The negative pattern keeps the spec out of its own glob. The row case settles once after `render`: no example here needs it yet, but the `emoji-picker`, `code-block` and `tool-call-card` demos of Tasks 3, 7 and 8 mount upstream's `ScrollArea`, whose viewport measurement lands outside `render`'s `act()` and would otherwise leave a `not wrapped in act` warning in the log.)

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^Error|Test Files|^ +Tests'`
Expected:

```
Error: Failed to resolve import "./button-group-menu" from "registry/bases/base-ui/examples/examples.spec.tsx". Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```

- [ ] **Step 3: Rename the examples and drop the two old specs**

Run (from `apps/registry-ui/registry/bases/base-ui/examples`):

```bash
git mv chat-message-hero.tsx chat-message-demo.tsx
git mv tree-hero.tsx tree-item-demo.tsx
git mv field-group-hero.tsx panel-row-demo.tsx
git mv ai-provider-picker-hero.tsx ai-provider-picker-demo.tsx
git mv button-hero.tsx button-demo.tsx
git mv split-button-hero.tsx button-group-split.tsx
git mv menu-button-hero.tsx button-group-menu.tsx
git rm -q split-button-hero.spec.tsx menu-button-hero.spec.tsx
```

- [ ] **Step 4: Write each example in the demo shape**

`apps/registry-ui/registry/bases/base-ui/examples/chat-message-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { ChatMessage } from '@/registry/bases/base-ui/components/data-display/chat-message';
import { Bubble, BubbleContent } from '@/registry/bases/base-ui/ui/bubble';
import { MessageContent, MessageHeader } from '@/registry/bases/base-ui/ui/message';

/** A user bubble and the assistant's reply. */
function ChatMessageDemo(): ReactNode {
  return (
    <div className="flex w-full flex-col gap-3">
      <ChatMessage align="end">
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>Hello - any updates?</BubbleContent>
          </Bubble>
        </MessageContent>
      </ChatMessage>
      <ChatMessage>
        <MessageContent>
          <MessageHeader>Assistant</MessageHeader>
          <Bubble variant="ghost">
            <BubbleContent>Looking now - will report back shortly.</BubbleContent>
          </Bubble>
        </MessageContent>
      </ChatMessage>
    </div>
  );
}

export { ChatMessageDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/tree-item-demo.tsx`:

```text
'use client';

import type { ReactNode } from 'react';

import { TreeItem, TreeItemIndent, TreeItemLabel } from '@/registry/bases/base-ui/components/data-entry/tree-item';
import { ItemTitle } from '@/registry/bases/base-ui/ui/item';

/** A folder expanded over two files. */
function TreeItemDemo(): ReactNode {
  return (
    <div className="flex w-full flex-col gap-1">
      <TreeItem expanded>
        <TreeItemIndent depth={0} hasChildren onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>src</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
      <TreeItem>
        <TreeItemIndent depth={1} hasChildren={false} onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>index.ts</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
      <TreeItem>
        <TreeItemIndent depth={1} hasChildren={false} onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>page.tsx</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
    </div>
  );
}

export { TreeItemDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/panel-row-demo.tsx`:

```text
import { LockIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { PanelFieldGroup } from '@/registry/bases/base-ui/components/layout/panel-field-group';
import { PanelRow, PanelRowAction } from '@/registry/bases/base-ui/components/layout/panel-row';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Label } from '@/registry/bases/base-ui/ui/label';

/** A two-column `PanelFieldGroup` in a `PanelRow` with a trailing lock action. */
function PanelRowDemo(): ReactNode {
  return (
    <div className="flex w-full flex-col gap-4">
      <PanelRow>
        <PanelFieldGroup cols={2}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="preview-x">X</Label>
            <Input id="preview-x" defaultValue="100" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="preview-y">Y</Label>
            <Input id="preview-y" defaultValue="200" />
          </div>
        </PanelFieldGroup>
        <PanelRowAction>
          <Button variant="ghost" size="icon" aria-label="Lock aspect ratio">
            <LockIcon />
          </Button>
        </PanelRowAction>
      </PanelRow>
    </div>
  );
}

export { PanelRowDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/ai-provider-picker-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { AiProviderPicker, DEFAULT_AI_PROVIDER_ENTRIES } from '@/registry/bases/base-ui/blocks/ai-provider-picker';

/** The AiProviderPicker block over its sample providers. */
function AiProviderPickerDemo(): ReactNode {
  return (
    <div className="w-full">
      <AiProviderPicker entries={DEFAULT_AI_PROVIDER_ENTRIES} />
    </div>
  );
}

export { AiProviderPickerDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/button-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

/** Every Button variant on one row. */
function ButtonDemo(): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  );
}

export { ButtonDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/button-default.tsx`:

```text
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

function ButtonDefault(): ReactNode {
  return <Button>Default</Button>;
}

export { ButtonDefault };
```

`apps/registry-ui/registry/bases/base-ui/examples/button-secondary.tsx`:

```text
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

function ButtonSecondary(): ReactNode {
  return <Button variant="secondary">Secondary</Button>;
}

export { ButtonSecondary };
```

`apps/registry-ui/registry/bases/base-ui/examples/button-outline.tsx`:

```text
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

function ButtonOutline(): ReactNode {
  return <Button variant="outline">Outline</Button>;
}

export { ButtonOutline };
```

`apps/registry-ui/registry/bases/base-ui/examples/button-destructive.tsx`:

```text
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

function ButtonDestructive(): ReactNode {
  return <Button variant="destructive">Destructive</Button>;
}

export { ButtonDestructive };
```

`apps/registry-ui/registry/bases/base-ui/examples/button-ghost.tsx`:

```text
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';

function ButtonGhost(): ReactNode {
  return <Button variant="ghost">Ghost</Button>;
}

export { ButtonGhost };
```

`apps/registry-ui/registry/bases/base-ui/examples/button-group-split.tsx`:

```text
'use client';

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

/** A primary action plus a caret menu of related actions, composed from upstream parts. */
function ButtonGroupSplit(): ReactNode {
  return (
    <ButtonGroup aria-label="Allow">
      <Button variant="outline">Action</Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="More action options" />}>
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuItem onClick={() => {}}>Second</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>Third</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

export { ButtonGroupSplit };
```

`apps/registry-ui/registry/bases/base-ui/examples/button-group-menu.tsx`:

```text
'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

const OPTIONS = [
  { value: 'once', label: 'Allow once' },
  { value: 'session', label: 'Allow this session' },
  { value: 'always', label: 'Always allow' },
] as const;

type OptionValue = (typeof OPTIONS)[number]['value'];

/** A remembered-default action whose caret menu picks the default, composed from upstream parts. */
function ButtonGroupMenu(): ReactNode {
  const [value, setValue] = useState<OptionValue>('once');
  const current = OPTIONS.find((option) => option.value === value);

  return (
    <ButtonGroup aria-label="Remembered action">
      <Button variant="outline">{current?.label}</Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="Change action" />}>
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuRadioGroup value={value} onValueChange={(next) => setValue(next as OptionValue)}>
            {OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

export { ButtonGroupMenu };
```

- [ ] **Step 5: Point the home page at ButtonDemo**

`apps/registry-ui/src/app/page.tsx`:

```diff
-import { ButtonHero } from '@/registry/bases/base-ui/examples/button-hero';
+import { ButtonDemo } from '@/registry/bases/base-ui/examples/button-demo';
```

```diff
-        <ButtonHero />
+        <ButtonDemo />
```

(The pre-commit formatter also folds the file's `<h1>` onto one line, `<h1 className="text-2xl font-semibold tracking-tight">ZeroXSolutions UI</h1>`; the file was not Prettier-clean on master.)

- [ ] **Step 6: Publish the four demos and drop every other example from registry.json**

In `apps/registry-ui/registry.json`, delete all twelve `"type": "registry:example"` items (everything after the `ai-provider-picker` block item) and put these four there, so the block is followed by:

```text
    {
      "name": "chat-message-demo",
      "type": "registry:example",
      "title": "Chat Message Demo",
      "description": "A user bubble and the assistant's reply, each a ChatMessage row.",
      "categories": ["examples"],
      "registryDependencies": [
        "@shadcn/bubble",
        "@shadcn/message",
        "https://ui.zeroxsolutions.com/r/chat-message.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/chat-message-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "tree-item-demo",
      "type": "registry:example",
      "title": "Tree Item Demo",
      "description": "A folder expanded over two files, each a TreeItem row.",
      "categories": ["examples"],
      "registryDependencies": ["@shadcn/item", "https://ui.zeroxsolutions.com/r/tree-item.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/tree-item-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "panel-row-demo",
      "type": "registry:example",
      "title": "Panel Row Demo",
      "description": "A PanelRow holding a two-column PanelFieldGroup of inputs beside a lock action.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": [
        "@shadcn/button",
        "@shadcn/input",
        "@shadcn/label",
        "https://ui.zeroxsolutions.com/r/panel-field-group.json",
        "https://ui.zeroxsolutions.com/r/panel-row.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/panel-row-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "ai-provider-picker-demo",
      "type": "registry:example",
      "title": "AI Provider Picker Demo",
      "description": "The AiProviderPicker block over its sample providers.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/ai-provider-picker.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/ai-provider-picker-demo.tsx",
          "type": "registry:example"
        }
      ]
    }
```

- [ ] **Step 7: Run both registry specs, the suite, the type check, lint and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t2.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t2.log"; grep -c 'not wrapped in act' "$S/vt-t2.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t2.log" 2>&1; grep 'error TS' "$S/tsc-t2.log" | cut -c1-80
pnpm exec eslint $E/*.tsx src/app/page.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check $E/*.tsx src/app/page.tsx registry.json 2>&1 | tail -1
rm -rf "$S/r-t2"; pnpm exec shadcn build -o "$S/r-t2" > "$S/sb-t2.log" 2>&1; tail -1 "$S/sb-t2.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (15 tests)
 Test Files  2 passed (2)
      Tests  29 passed (29)
 Test Files  79 passed (79)
      Tests  467 passed (467)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 12 items.
```

(eslint prints no problem line. 456 - 4 cases in the two deleted specs + 15 = 467; 80 - 2 + 1 = 79 files. The 15: the row check, one render per example (12), and the two behaviour cases.)

- [ ] **Step 8: Commit**

`$S/msg-t2.txt`:

```
feat(registry-ui): publish one demo per item and render every example

Why: examples were named after a hero preview, not the item they
belong to, and the Button and button-group examples were published
though the registry publishes composed items only. Each item's example
is now its <name>-demo item; the rest stay as docs-only files. One spec
renders every example file and fails on a file with no row, replacing
the two per-example specs and keeping their behaviour cases.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
E=apps/registry-ui/registry/bases/base-ui/examples
git add $E/examples.spec.tsx
git commit -q -F "$S/msg-t2.txt" -- $E apps/registry-ui/src/app/page.tsx apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 3: Publish the data-entry families

Spec (b) Items and Examples, for the nine composed families under `components/data-entry/` that master
(the 2026-09-28 refactor, commits `376ced3` and `3e80ca9`) already carries but the registry does not yet
publish: `chat-suggestion-item`, `emoji-appearance-toggle-group`, `emoji-picker`, `language-combobox`,
`language-toggle-group`, `number-field`, `password-input`, `resize-handle`, `tag-input`. Each gets one
`registry:component` item and one `<name>-demo` example, both derived from what its file (or demo file)
actually imports. `NumberField` and `PasswordInput` keep upstream's shared `data-slot="input-group"` on
their root and declare no slot of their own anywhere in the file, so their `EXPECTED_SLOT` rows fall back
to it. `EmojiPicker` and `LanguageCombobox` render no DOM at their own root at all (a bare context
provider), so their rows point at the most specific slot their demo actually renders in the DOM:
`emoji-picker-content` for the picker (`combobox-value` looked more specific for the combobox, but Base
UI's `Combobox.Value` never wraps its render-prop output in an element, so the `data-slot` `ui/combobox.tsx`
gives it never reaches the DOM - `combobox-trigger` does). `EmojiPickerContent` always renders upstream's
`ScrollArea`, whose viewport measurement lands in a `queueMicrotask` after `render`; the `act()` the row case
awaits since Task 2 settles it, so the demo leaves no `not wrapped in act` line in the log. This task runs
before the layout task that publishes `avatar-picker` (Task 6), whose file imports `EmojiPicker` and so
needs this item's URL.

**Files:**

- Create: `examples/chat-suggestion-item-demo.tsx`, `examples/emoji-appearance-toggle-group-demo.tsx`,
  `examples/emoji-picker-demo.tsx`, `examples/language-combobox-demo.tsx`,
  `examples/language-toggle-group-demo.tsx`, `examples/number-field-demo.tsx`,
  `examples/password-input-demo.tsx`, `examples/resize-handle-demo.tsx`, `examples/tag-input-demo.tsx`
- Modify: `examples/examples.spec.tsx`, `apps/registry-ui/registry.json`

**Interfaces:**

- Consumes: the Task 2 tree (12 items: 7 `registry:component`, 1 block, 4 demos) plus master's nine
  data-entry families under `components/data-entry/` (none published yet).
- Produces:
  - from `examples/<name>-demo.tsx`: `ChatSuggestionItemDemo`, `EmojiAppearanceToggleGroupDemo`,
    `EmojiPickerDemo`, `LanguageComboboxDemo`, `LanguageToggleGroupDemo`, `NumberFieldDemo`,
    `PasswordInputDemo`, `ResizeHandleDemo`, `TagInputDemo`, each `(): ReactNode`
  - 9 rows in `examples/examples.spec.tsx`'s `EXPECTED_SLOT`
  - registry items `chat-suggestion-item`, `emoji-appearance-toggle-group`, `emoji-picker`,
    `language-combobox`, `language-toggle-group`, `number-field`, `password-input`, `resize-handle`,
    `tag-input` (inserted after `model-info-card`, before `tree-item`), and their demo items
    `chat-suggestion-item-demo`, `emoji-appearance-toggle-group-demo`, `emoji-picker-demo`,
    `language-combobox-demo`, `language-toggle-group-demo`, `number-field-demo`, `password-input-demo`,
    `resize-handle-demo`, `tag-input-demo` (inserted after `chat-message-demo`, before `tree-item-demo`);
    30 items total (16 `registry:component`, 1 block, 13 `registry:example`)
- Removed: nothing.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Add the new rows to the spec**

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`:

```diff
   'chat-message-demo': 'chat-message',
+  'chat-suggestion-item-demo': 'chat-suggestion-item',
+  'emoji-appearance-toggle-group-demo': 'emoji-appearance-toggle-group',
+  'emoji-picker-demo': 'emoji-picker-content',
+  'language-combobox-demo': 'combobox-trigger',
+  'language-toggle-group-demo': 'language-toggle-group',
+  'number-field-demo': 'input-group',
   'panel-row-demo': 'panel-row',
+  'password-input-demo': 'input-group',
+  'resize-handle-demo': 'resize-handle',
+  'tag-input-demo': 'tag-input',
   'tree-item-demo': 'tree-item',
 };
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx`
Expected (excerpt):

```
 ❯ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (15 tests | 1 failed)
     × has a row for every example file and a file for every row
     ✓ 'ai-provider-picker-demo' renders 'AiProviderPickerDemo' with its data-slot
     ... (11 more passing, the Task 2 rows)

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx > examples > has a row for every example file and a file for every row
AssertionError: expected [ 'ai-provider-picker-demo', …(11) ] to deeply equal [ 'ai-provider-picker-demo', …(20) ]

- Expected
+ Received

@@ -7,17 +7,8 @@
    "button-group-menu",
    "button-group-split",
    "button-outline",
    "button-secondary",
    "chat-message-demo",
-   "chat-suggestion-item-demo",
-   "emoji-appearance-toggle-group-demo",
-   "emoji-picker-demo",
-   "language-combobox-demo",
-   "language-toggle-group-demo",
-   "number-field-demo",
    "panel-row-demo",
-   "password-input-demo",
-   "resize-handle-demo",
-   "tag-input-demo",
    "tree-item-demo",
  ]

 Test Files  1 failed (1)
      Tests  1 failed | 14 passed (15)
```

(Every row added this task has no file yet, so the "row for every file" check lists all nine as missing.)

- [ ] **Step 3: Write each demo**

`apps/registry-ui/registry/bases/base-ui/examples/chat-suggestion-item-demo.tsx`:

```text
import { FileText, Lightbulb, Sparkles } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { ChatSuggestionItem } from '@/registry/bases/base-ui/components/data-entry/chat-suggestion-item';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/registry/bases/base-ui/ui/empty';
import { ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/registry/bases/base-ui/ui/item';

/** An empty conversation with two starter prompts. */
function ChatSuggestionItemDemo(): ReactNode {
  const [sent, setSent] = useState<string | null>(null);

  return (
    <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Sparkles />
        </EmptyMedia>
        <EmptyTitle>Start a conversation</EmptyTitle>
        <EmptyDescription>{sent ? `Sent: "${sent}"` : 'Ask anything, or pick a starter'}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ItemGroup>
          <ChatSuggestionItem prompt="Summarise this document" onSelectPrompt={setSent}>
            <ItemMedia>
              <FileText />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Summarise this document</ItemTitle>
            </ItemContent>
          </ChatSuggestionItem>
          <ChatSuggestionItem prompt="Suggest three ideas" onSelectPrompt={setSent}>
            <ItemMedia>
              <Lightbulb />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Suggest three ideas</ItemTitle>
            </ItemContent>
          </ChatSuggestionItem>
        </ItemGroup>
      </EmptyContent>
    </Empty>
  );
}

export { ChatSuggestionItemDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/emoji-appearance-toggle-group-demo.tsx`:

```text
import type { FluentEmojiStyle } from '@zeroxsolutions/fluent-emoji';
import { useState, type ReactNode } from 'react';

import {
  EmojiAppearanceToggleGroup,
  EmojiAppearanceToggleGroupItem,
} from '@/registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group';

/** Every Fluent artwork style, previewed and picked from one row. */
function EmojiAppearanceToggleGroupDemo(): ReactNode {
  const [style, setStyle] = useState<FluentEmojiStyle>('3d');

  return (
    <EmojiAppearanceToggleGroup value={style} onValueChange={setStyle}>
      <EmojiAppearanceToggleGroupItem value="3d">3D</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="flat">Flat</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="modern">Modern</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="mono">Mono</EmojiAppearanceToggleGroupItem>
      <EmojiAppearanceToggleGroupItem value="anim">Animated</EmojiAppearanceToggleGroupItem>
    </EmojiAppearanceToggleGroup>
  );
}

export { EmojiAppearanceToggleGroupDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/emoji-picker-demo.tsx`:

```text
import { useState, type ReactNode } from 'react';

import { EmojiPicker } from '@/registry/bases/base-ui/components/data-entry/emoji-picker';

/** The default picker over a small frequent row. */
function EmojiPickerDemo(): ReactNode {
  const [picked, setPicked] = useState('😀');

  return (
    <div className="flex w-72 flex-col gap-2">
      <p className="text-sm">Picked: {picked}</p>
      <EmojiPicker onSelect={setPicked} frequent={['🍕', '🎉']} />
    </div>
  );
}

export { EmojiPickerDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/language-combobox-demo.tsx`:

```text
import { useState, type ReactNode } from 'react';

import { LanguageCombobox } from '@/registry/bases/base-ui/components/data-entry/language-combobox';
import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/registry/bases/base-ui/ui/combobox';

/** The built-in code-language options, picked from a trigger showing the current one. */
function LanguageComboboxDemo(): ReactNode {
  const [value, setValue] = useState('typescript');

  return (
    <LanguageCombobox kind="code" value={value} onValueChange={setValue}>
      <ComboboxTrigger render={<Button variant="outline" size="sm" />} aria-label="Select language">
        <ComboboxValue>
          {(option) => (
            <>
              {option?.icon}
              <span>{option?.label ?? 'Select'}</span>
            </>
          )}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.value} value={option}>
              {option.icon}
              <span>{option.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </LanguageCombobox>
  );
}

export { LanguageComboboxDemo };
```

(No `types/language-option` import: leaving the render-prop parameters unannotated lets TypeScript infer
them from context, so this item ships only its own file.)

`apps/registry-ui/registry/bases/base-ui/examples/language-toggle-group-demo.tsx`:

```text
import { useState, type ReactNode } from 'react';

import { LanguageToggleGroup } from '@/registry/bases/base-ui/components/data-entry/language-toggle-group';
import { ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'vi', label: 'Vietnamese' },
] as const;

/** A fixed three-language switch, always one language pressed. */
function LanguageToggleGroupDemo(): ReactNode {
  const [value, setValue] = useState('en');

  return (
    <LanguageToggleGroup value={value} onValueChange={setValue} aria-label="Language">
      {LANGUAGES.map((language) => (
        <ToggleGroupItem key={language.value} value={language.value}>
          {language.label}
        </ToggleGroupItem>
      ))}
    </LanguageToggleGroup>
  );
}

export { LanguageToggleGroupDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/number-field-demo.tsx`:

```text
import { useState, type ReactNode } from 'react';

import { NumberField, NumberFieldInput } from '@/registry/bases/base-ui/components/data-entry/number-field';
import { InputGroupAddon, InputGroupText } from '@/registry/bases/base-ui/ui/input-group';

/** A width field: arithmetic input, clamped and stepped. */
function NumberFieldDemo(): ReactNode {
  const [width, setWidth] = useState(320);

  return (
    <NumberField value={width} onValueChange={setWidth} min={0} max={1000} step={1} className="w-32">
      <InputGroupAddon>
        <InputGroupText>W</InputGroupText>
      </InputGroupAddon>
      <NumberFieldInput />
      <InputGroupAddon align="inline-end">
        <InputGroupText>px</InputGroupText>
      </InputGroupAddon>
    </NumberField>
  );
}

export { NumberFieldDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/password-input-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { PasswordInput } from '@/registry/bases/base-ui/components/data-entry/password-input';
import { Label } from '@/registry/bases/base-ui/ui/label';

/** A labelled password field with its show/hide toggle. */
function PasswordInputDemo(): ReactNode {
  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="preview-password">Password</Label>
      <PasswordInput id="preview-password" defaultValue="hunter2" autoComplete="current-password" />
    </div>
  );
}

export { PasswordInputDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/resize-handle-demo.tsx`:

```text
import { useState, type ReactNode } from 'react';

import { ResizeHandle } from '@/registry/bases/base-ui/components/data-entry/resize-handle';

const MIN_WIDTH = 120;
const MAX_WIDTH = 320;
const COLLAPSED_WIDTH = 48;

/** A side panel next to its content, resized by dragging the handle or toggled shut by a double-click. */
function ResizeHandleDemo(): ReactNode {
  const [width, setWidth] = useState(200);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-40 w-full border">
      <div
        className="bg-muted shrink-0 overflow-hidden p-2 text-sm"
        style={{ width: collapsed ? COLLAPSED_WIDTH : width }}
      >
        {collapsed ? 'Panel' : `Side panel (${width}px)`}
      </div>
      <ResizeHandle
        onDrag={(dx) => {
          if (!collapsed) setWidth((current) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, current + dx)));
        }}
        onToggle={() => setCollapsed((current) => !current)}
      />
      <div className="flex-1 p-2 text-sm">Content</div>
    </div>
  );
}

export { ResizeHandleDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/tag-input-demo.tsx`:

```text
import { useState, type ReactNode } from 'react';

import { TagInput } from '@/registry/bases/base-ui/components/data-entry/tag-input';

/** A tag editor over two starting tags. */
function TagInputDemo(): ReactNode {
  const [tags, setTags] = useState(['design', 'ui']);

  return <TagInput value={tags} onValueChange={setTags} placeholder="Add a tag" className="w-64" />;
}

export { TagInputDemo };
```

- [ ] **Step 4: Publish the nine component items and their demos**

In `apps/registry-ui/registry.json`, insert after `model-info-card` and before `tree-item`:

```text
    {
      "name": "chat-suggestion-item",
      "type": "registry:component",
      "title": "Chat Suggestion Item",
      "description": "One starter prompt in an empty conversation, an upstream Item rendered as a button that hands its prompt to onSelectPrompt when picked.",
      "categories": ["data-entry"],
      "registryDependencies": ["@shadcn/item", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/chat-suggestion-item.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "emoji-appearance-toggle-group",
      "type": "registry:component",
      "title": "Emoji Appearance Toggle Group",
      "description": "A single-select row of swatches for choosing the Fluent Emoji artwork style, each previewing the same sample emoji in its own style.",
      "categories": ["data-entry"],
      "dependencies": ["@zeroxsolutions/fluent-emoji"],
      "registryDependencies": ["@shadcn/toggle-group", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/emoji-appearance-toggle-group.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "emoji-picker",
      "type": "registry:component",
      "title": "Emoji Picker",
      "description": "A searchable, categorized emoji grid with an optional frequent row and a category nav, windowed so opening the catalog renders only what is in view.",
      "categories": ["data-entry"],
      "dependencies": ["@zeroxsolutions/fluent-emoji", "lucide-react"],
      "registryDependencies": [
        "@shadcn/button",
        "@shadcn/empty",
        "@shadcn/input-group",
        "@shadcn/scroll-area",
        "@shadcn/tabs",
        "@shadcn/utils"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/emoji-picker.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "language-combobox",
      "type": "registry:component",
      "title": "Language Combobox",
      "description": "A searchable language picker over upstream Combobox that maps a BCP-47 code or code-language id to its option and reports the value the consumer picks.",
      "categories": ["data-entry"],
      "dependencies": ["@base-ui/react", "@zeroxsolutions/icons"],
      "registryDependencies": ["@shadcn/combobox"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/language-combobox.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/hooks/use-language-options.ts",
          "type": "registry:hook"
        },
        {
          "path": "registry/bases/base-ui/lib/language-options.tsx",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/types/language-option.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "language-toggle-group",
      "type": "registry:component",
      "title": "Language Toggle Group",
      "description": "Every language shown inline as a single-select toggle group for a small fixed set, which never deselects so a language is always chosen.",
      "categories": ["data-entry"],
      "registryDependencies": ["@shadcn/toggle-group"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/language-toggle-group.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "number-field",
      "type": "registry:component",
      "title": "Number Field",
      "description": "A compact numeric field for a property inspector that parses arithmetic expressions, clamps to min and max, and steps on the arrow keys.",
      "categories": ["data-entry"],
      "registryDependencies": ["@shadcn/input-group", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/number-field.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/lib/expr-eval.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "password-input",
      "type": "registry:component",
      "title": "Password Input",
      "description": "A password field with a show or hide toggle packaged into the addon, so a call site never wires the eye button itself.",
      "categories": ["data-entry"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/input-group"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/password-input.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "resize-handle",
      "type": "registry:component",
      "title": "Resize Handle",
      "description": "A vertical resize grip for a side or floating panel that only starts dragging once the pointer crosses a small movement threshold.",
      "categories": ["data-entry"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/resize-handle.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/lib/resize-drag.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "tag-input",
      "type": "registry:component",
      "title": "Tag Input",
      "description": "A tag editor with removable chips above an input that commits a new tag on Enter, comma, or blur.",
      "categories": ["data-entry"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/badge", "@shadcn/button", "@shadcn/input", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-entry/tag-input.tsx",
          "type": "registry:component"
        }
      ]
    },
```

And after `chat-message-demo`, before `tree-item-demo`:

```text
    {
      "name": "chat-suggestion-item-demo",
      "type": "registry:example",
      "title": "Chat Suggestion Item Demo",
      "description": "An empty conversation with two starter prompts, each a ChatSuggestionItem.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": [
        "@shadcn/empty",
        "@shadcn/item",
        "https://ui.zeroxsolutions.com/r/chat-suggestion-item.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/chat-suggestion-item-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "emoji-appearance-toggle-group-demo",
      "type": "registry:example",
      "title": "Emoji Appearance Toggle Group Demo",
      "description": "Every Fluent artwork style previewed and picked from one EmojiAppearanceToggleGroup row.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/emoji-appearance-toggle-group.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/emoji-appearance-toggle-group-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "emoji-picker-demo",
      "type": "registry:example",
      "title": "Emoji Picker Demo",
      "description": "The default EmojiPicker composition over a small frequent row.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/emoji-picker.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/emoji-picker-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "language-combobox-demo",
      "type": "registry:example",
      "title": "Language Combobox Demo",
      "description": "The built-in code-language options, picked from a LanguageCombobox trigger showing the current one.",
      "categories": ["examples"],
      "registryDependencies": [
        "@shadcn/button",
        "@shadcn/combobox",
        "https://ui.zeroxsolutions.com/r/language-combobox.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/language-combobox-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "language-toggle-group-demo",
      "type": "registry:example",
      "title": "Language Toggle Group Demo",
      "description": "A fixed three-language LanguageToggleGroup, always one language pressed.",
      "categories": ["examples"],
      "registryDependencies": ["@shadcn/toggle-group", "https://ui.zeroxsolutions.com/r/language-toggle-group.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/language-toggle-group-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "number-field-demo",
      "type": "registry:example",
      "title": "Number Field Demo",
      "description": "A width NumberField with unit addons, its arithmetic input clamped and stepped.",
      "categories": ["examples"],
      "registryDependencies": ["@shadcn/input-group", "https://ui.zeroxsolutions.com/r/number-field.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/number-field-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "password-input-demo",
      "type": "registry:example",
      "title": "Password Input Demo",
      "description": "A labelled PasswordInput with its show or hide toggle.",
      "categories": ["examples"],
      "registryDependencies": ["@shadcn/label", "https://ui.zeroxsolutions.com/r/password-input.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/password-input-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "resize-handle-demo",
      "type": "registry:example",
      "title": "Resize Handle Demo",
      "description": "A side panel resized by dragging its ResizeHandle or collapsed by a double-click.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/resize-handle.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/resize-handle-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "tag-input-demo",
      "type": "registry:example",
      "title": "Tag Input Demo",
      "description": "A TagInput over two starting tags.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/tag-input.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/tag-input-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
```

- [ ] **Step 5: Run both registry specs, the suite, the type check, lint, prettier and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t3.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t3.log"; grep -c 'not wrapped in act' "$S/vt-t3.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t3.log" 2>&1; grep 'error TS' "$S/tsc-t3.log" | cut -c1-80
pnpm exec eslint $E/*-demo.tsx $E/examples.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check $E/*-demo.tsx $E/examples.spec.tsx registry.json 2>&1 | tail -1
rm -rf "$S/r-t3"; pnpm exec shadcn build -o "$S/r-t3" > "$S/sb-t3.log" 2>&1; tail -1 "$S/sb-t3.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (24 tests)
 Test Files  2 passed (2)
      Tests  38 passed (38)
 Test Files  79 passed (79)
      Tests  476 passed (476)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 30 items.
```

(eslint prints no problem line. 467 after Task 2 + 9 new row cases = 476 tests
across the same 79 files - no new spec files, only new example files rendered by the existing row test.
`registry.spec.ts`'s 14 tests are unchanged in count; its two real-registry cases now check all 30 items,
including these 9 and their demos, and passed on the first run - every `files`/`registryDependencies`/
`dependencies` entry above was traced by hand from each file's own imports before this run.)

- [ ] **Step 6: Commit**

`$S/msg-t3.txt`:

```
feat(registry-ui): publish the data-entry families

Why: chat-suggestion-item, emoji-appearance-toggle-group, emoji-picker,
language-combobox, language-toggle-group, number-field, password-input,
resize-handle and tag-input were composed but never published. Each
gets one registry:component item, traced to what its file imports,
and one <name>-demo example.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
E=apps/registry-ui/registry/bases/base-ui/examples
git add $E/chat-suggestion-item-demo.tsx $E/emoji-appearance-toggle-group-demo.tsx $E/emoji-picker-demo.tsx \
  $E/language-combobox-demo.tsx $E/language-toggle-group-demo.tsx $E/number-field-demo.tsx \
  $E/password-input-demo.tsx $E/resize-handle-demo.tsx $E/tag-input-demo.tsx
git commit -q -F "$S/msg-t3.txt" -- $E apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log
shows the subject above.

---

### Task 4: Publish the feedback families

Spec (b) Items and Examples. Four more family files under `components/feedback/` become items -
`copy-button`, `permission-card`, `tab-close-button`, `unsaved-indicator` - each with a title,
description, category and declared imports read off its current file; `permission-card` paints
with `text-success` (its `PermissionCardStatus` icon for the `approved` state), so it carries
`cssVars` for `success` only - it never uses a `warning` class. Each new item gets its
`<name>-demo`, and `status-indicator` - already an item since Task 1 - gets the
`status-indicator-demo` it was missing. Nine items in all: nine rows in `EXPECTED_SLOT`, four
component items, five example items. `PermissionCard`'s doc comment composes a `CodeBlock` for the
command it asks about; the demo shows the command as a plain description line instead, because the
`code-block` item is published only in Task 7 and a demo naming its URL now would fail rule 3.

**Files:**

- Create: `apps/registry-ui/registry/bases/base-ui/examples/copy-button-demo.tsx`,
  `apps/registry-ui/registry/bases/base-ui/examples/permission-card-demo.tsx`,
  `apps/registry-ui/registry/bases/base-ui/examples/status-indicator-demo.tsx`,
  `apps/registry-ui/registry/bases/base-ui/examples/tab-close-button-demo.tsx`,
  `apps/registry-ui/registry/bases/base-ui/examples/unsaved-indicator-demo.tsx`
- Modify: `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx` (new
  `EXPECTED_SLOT` rows), `apps/registry-ui/registry.json` (four component items, five example
  items)

**Interfaces:**

- Consumes: the Task 3 tree (30 items: 16 `registry:component`, 1 block, 13 demos).
- Produces:
  - registry items `copy-button`, `permission-card`, `tab-close-button`, `unsaved-indicator`
    (`registry:component`, category `feedback`), inserted alphabetically into the existing
    `feedback` group beside `status-indicator`
  - registry items `copy-button-demo`, `permission-card-demo`, `status-indicator-demo`,
    `tab-close-button-demo`, `unsaved-indicator-demo` (`registry:example`), inserted after
    `tree-item-demo` and before `panel-row-demo`, in the same order as their items
  - from `examples/copy-button-demo.tsx`: `CopyButtonDemo(): ReactNode`
  - from `examples/permission-card-demo.tsx`: `PermissionCardDemo(): ReactNode`
  - from `examples/status-indicator-demo.tsx`: `StatusIndicatorDemo(): ReactNode`
  - from `examples/tab-close-button-demo.tsx`: `TabCloseButtonDemo(): ReactNode`
  - from `examples/unsaved-indicator-demo.tsx`: `UnsavedIndicatorDemo(): ReactNode`
  - 39 items total (20 `registry:component`, 1 block, 18 `registry:example`)
- Removed: nothing.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with
`apps/`.

- [ ] **Step 1: RED - add the five rows to EXPECTED_SLOT**

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, add these rows to `EXPECTED_SLOT`, each at its place in key order (the table stays alphabetical):

```text
  'copy-button-demo': 'copy-button',
  'permission-card-demo': 'permission-card',
  'status-indicator-demo': 'status-indicator',
  'tab-close-button-demo': 'tab-close-button',
  'unsaved-indicator-demo': 'unsaved-indicator',
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^ +×|AssertionError|^-   "|Test Files|^ +Tests'`
Expected:

```
     × has a row for every example file and a file for every row
AssertionError: expected [ 'ai-provider-picker-demo', …(20) ] to deeply equal [ 'ai-provider-picker-demo', …(25) ]
-   "copy-button-demo",
-   "permission-card-demo",
-   "status-indicator-demo",
-   "tab-close-button-demo",
-   "unsaved-indicator-demo",
 Test Files  1 failed (1)
      Tests  1 failed | 23 passed (24)
```

(Every new row has no file yet - the `-` lines are the five rows the glob cannot find.)

- [ ] **Step 3: Write the five demos**

`apps/registry-ui/registry/bases/base-ui/examples/copy-button-demo.tsx`:

```text
'use client';

import { useState, type ReactNode } from 'react';

import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';

/** An install command with its own copy button, announcing the copy inline. */
function CopyButtonDemo(): ReactNode {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-2 rounded-md border px-3 py-2">
      <code className="font-mono text-sm">pnpm add @zeroxsolutions/icons</code>
      <div className="flex items-center gap-2">
        {copied && <span className="text-muted-foreground text-xs">Copied</span>}
        <CopyButton value="pnpm add @zeroxsolutions/icons" onCopied={() => setCopied(true)} />
      </div>
    </div>
  );
}

export { CopyButtonDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/permission-card-demo.tsx`:

```text
'use client';

import { CheckCircle2, Wrench, XCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardHeader,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
} from '@/registry/bases/base-ui/components/feedback/permission-card';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import { CardDescription } from '@/registry/bases/base-ui/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

const STATUS_WORD = { pending: 'Pending', approved: 'Allowed', denied: 'Denied' } as const;

/** A deploy-approval request the visitor can deny or allow, once or for the session. */
function PermissionCardDemo(): ReactNode {
  const [status, setStatus] = useState<'pending' | 'approved' | 'denied'>('pending');

  return (
    <PermissionCard status={status} className="w-full max-w-sm rounded-lg border p-4">
      <PermissionCardHeader>
        <Wrench className="text-muted-foreground size-3.5" />
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
        <PermissionCardStatus>{STATUS_WORD[status]}</PermissionCardStatus>
      </PermissionCardHeader>
      <CardDescription>Deploy the web app to production</CardDescription>
      <PermissionCardActions>
        <Button variant="ghost" onClick={() => setStatus('denied')}>
          Deny
        </Button>
        <ButtonGroup>
          <Button onClick={() => setStatus('approved')}>Allow once</Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="icon" aria-label="More allow options" />} />
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem onClick={() => setStatus('approved')}>Allow this session</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </PermissionCardActions>
      {status === 'approved' && (
        <PermissionCardResolved>
          <CheckCircle2 className="size-3.5" /> Allowed once - 2:14pm
        </PermissionCardResolved>
      )}
      {status === 'denied' && (
        <PermissionCardResolved>
          <XCircle className="size-3.5" /> Denied - 2:14pm
        </PermissionCardResolved>
      )}
    </PermissionCard>
  );
}

export { PermissionCardDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/status-indicator-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { StatusIndicator } from '@/registry/bases/base-ui/components/feedback/status-indicator';

/** Every status tone beside its label, with a pulsing connecting state. */
function StatusIndicatorDemo(): ReactNode {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <StatusIndicator tone="online" />
        <span>Online</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator tone="online" pulse />
        <span>Connecting</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator tone="idle" />
        <span>Idle</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator tone="busy" />
        <span>Busy</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusIndicator tone="offline" />
        <span>Offline</span>
      </div>
    </div>
  );
}

export { StatusIndicatorDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/tab-close-button-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { TabCloseButton } from '@/registry/bases/base-ui/components/feedback/tab-close-button';

/** Two editor tabs: one saved, one with unsaved changes. */
function TabCloseButtonDemo(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="group/tab flex items-center gap-2 rounded-md border px-3 py-1.5">
        <span>index.ts</span>
        <TabCloseButton />
      </div>
      <div className="group/tab flex items-center gap-2 rounded-md border px-3 py-1.5">
        <span>page.tsx</span>
        <TabCloseButton dirty />
      </div>
    </div>
  );
}

export { TabCloseButtonDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/unsaved-indicator-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { UnsavedIndicator } from '@/registry/bases/base-ui/components/feedback/unsaved-indicator';

/** The unsaved dot beside a tab label with pending edits. */
function UnsavedIndicatorDemo(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>page.tsx</span>
      <UnsavedIndicator />
    </div>
  );
}

export { UnsavedIndicatorDemo };
```

- [ ] **Step 4: Add the four component items and five example items to registry.json**

In `apps/registry-ui/registry.json`, between `status-indicator`'s predecessor position and
`panel-field-group` (the `feedback` group, alphabetical, `status-indicator` already there),
insert `copy-button` and `permission-card` before it and `tab-close-button` and
`unsaved-indicator` after it:

```text
    {
      "name": "copy-button",
      "type": "registry:component",
      "title": "Copy Button",
      "description": "An icon button that copies its value to the clipboard, showing a check and carrying data-copied until its timeout resets it.",
      "categories": ["feedback"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/button"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/feedback/copy-button.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "permission-card",
      "type": "registry:component",
      "title": "Permission Card",
      "description": "An inline, non-modal AI-consent request that stays in scrollback after it resolves, switching between its decision and resolved parts as the host settles its status.",
      "categories": ["feedback"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/utils"],
      "cssVars": {
        "theme": {
          "color-success": "var(--success)"
        },
        "light": {
          "success": "oklch(0.627 0.19 149)"
        },
        "dark": {
          "success": "oklch(0.723 0.19 149)"
        }
      },
      "files": [
        {
          "path": "registry/bases/base-ui/components/feedback/permission-card.tsx",
          "type": "registry:component"
        }
      ]
    },
```

(`status-indicator`'s existing block is unchanged, then:)

```text
    {
      "name": "tab-close-button",
      "type": "registry:component",
      "title": "Tab Close Button",
      "description": "The trailing control on an editor tab, showing the unsaved dot until the tab's hover, focus or active state reveals its close X.",
      "categories": ["feedback"],
      "dependencies": ["lucide-react"],
      "registryDependencies": [
        "@shadcn/button",
        "@shadcn/utils",
        "https://ui.zeroxsolutions.com/r/unsaved-indicator.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/components/feedback/tab-close-button.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "unsaved-indicator",
      "type": "registry:component",
      "title": "Unsaved Indicator",
      "description": "The unsaved-changes dot an editor shows on a tab, announced as an image named Unsaved changes.",
      "categories": ["feedback"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/feedback/unsaved-indicator.tsx",
          "type": "registry:component"
        }
      ]
    },
```

Then, between `tree-item-demo` and `panel-row-demo` in the examples section:

```text
    {
      "name": "copy-button-demo",
      "type": "registry:example",
      "title": "Copy Button Demo",
      "description": "An install command with its own copy button, announcing the copy inline.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/copy-button.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/copy-button-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "permission-card-demo",
      "type": "registry:example",
      "title": "Permission Card Demo",
      "description": "A deploy-approval request whose decision buttons resolve into a resolved outcome.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": [
        "@shadcn/button",
        "@shadcn/button-group",
        "@shadcn/card",
        "@shadcn/dropdown-menu",
        "https://ui.zeroxsolutions.com/r/permission-card.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/permission-card-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "status-indicator-demo",
      "type": "registry:example",
      "title": "Status Indicator Demo",
      "description": "Every status tone beside its label, with a pulsing connecting state.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/status-indicator.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/status-indicator-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "tab-close-button-demo",
      "type": "registry:example",
      "title": "Tab Close Button Demo",
      "description": "Two editor tabs, one saved and one with unsaved changes.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/tab-close-button.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/tab-close-button-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "unsaved-indicator-demo",
      "type": "registry:example",
      "title": "Unsaved Indicator Demo",
      "description": "The unsaved dot beside a tab label with pending edits.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/unsaved-indicator.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/unsaved-indicator-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
```

- [ ] **Step 5: GREEN - both registry specs, the suite, the type check, lint, prettier and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t4.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t4.log"; grep -c 'not wrapped in act' "$S/vt-t4.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t4.log" 2>&1; grep 'error TS' "$S/tsc-t4.log" | cut -c1-80
pnpm exec eslint $E/examples.spec.tsx $E/copy-button-demo.tsx $E/permission-card-demo.tsx $E/status-indicator-demo.tsx $E/tab-close-button-demo.tsx $E/unsaved-indicator-demo.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check $E/examples.spec.tsx $E/copy-button-demo.tsx $E/permission-card-demo.tsx $E/status-indicator-demo.tsx $E/tab-close-button-demo.tsx $E/unsaved-indicator-demo.tsx registry.json 2>&1 | tail -1
rm -rf "$S/r-t4"; pnpm exec shadcn build -o "$S/r-t4" > "$S/sb-t4.log" 2>&1; tail -1 "$S/sb-t4.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (29 tests)
 Test Files  2 passed (2)
      Tests  43 passed (43)
 Test Files  79 passed (79)
      Tests  481 passed (481)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 39 items.
```

(eslint prints no problem line. `registry.spec.ts` stays at 14 tests; `examples.spec.tsx` goes from 24 to 29, five new renders. 476 after Task 3 + 5 = 481 tests, still 79 files: no spec file is added. 39 items: 30 + 4 components + 5 demos.)

- [ ] **Step 6: Commit**

`$S/msg-t4.txt`:

```
feat(registry-ui): publish the feedback family items

Why: copy-button, permission-card, tab-close-button and
unsaved-indicator were composed families with no registry entry, and
status-indicator had no demo. Each gets its item - permission-card
carrying cssVars for the success token its approved icon paints with
- and its <name>-demo.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
E=apps/registry-ui/registry/bases/base-ui/examples
git add $E/copy-button-demo.tsx $E/permission-card-demo.tsx $E/status-indicator-demo.tsx $E/tab-close-button-demo.tsx $E/unsaved-indicator-demo.tsx
git commit -q -F "$S/msg-t4.txt" -- $E/copy-button-demo.tsx $E/permission-card-demo.tsx $E/status-indicator-demo.tsx $E/tab-close-button-demo.tsx $E/unsaved-indicator-demo.tsx $E/examples.spec.tsx apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`;
the log shows the subject above.

---

### Task 5: Publish the general and navigation families

Spec (b) Items and Examples. `components/general/` holds three family files (`icon-chip`,
`icon-label`, `panel-field-label`) and `components/navigation/` holds one (`command-menu`); this
task gives each its `registry:component` item and its one published demo, and adds the four
example files' rows to `examples/examples.spec.tsx`. IconChip and IconLabel are meant to be
composed as a Tooltip's `render` target (their own doc comments show it), which is also how each
gets the accessible name a bare icon needs; that composition overwrites the `data-slot` Base UI's
`TooltipTrigger` puts on the rendered element with `tooltip-trigger`, so each demo also renders one
plain, un-Tooltipped instance to keep its own slot observable. `PanelFieldLabel` keeps upstream's
`data-slot="field-label"` rather than a slot of its own (its doc comment says so, and its own spec
asserts it), so its row reads `field-label`, not `panel-field-label`. `CommandMenu` wraps a
`CommandDialog`, whose content is a Base UI `Dialog.Popup` rendered through a portal into
`document.body`; that content is not a descendant of `render`'s `container` div, so the per-example
row check - `container.querySelector(...)` - can never find it no matter the dialog's open state.
This task widens that one line to `document.querySelector(...)`, which is a superset of `container`
for every existing example and is how `command-menu.spec.tsx` already queries the family's own
`data-slot`. `CommandMenu` does not import `useCommandShortcut` itself (the hook is a companion the
consumer wires in), so the demo - which does, to open the palette on Ctrl/Cmd+K - ships
that hook as a second `files` entry on `command-menu-demo`, the same way a component item ships a
`lib/` or `hooks/` file it reaches.

**Files:**

- Modify: `apps/registry-ui/registry.json`, `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`
- Create: `apps/registry-ui/registry/bases/base-ui/examples/icon-chip-demo.tsx`,
  `apps/registry-ui/registry/bases/base-ui/examples/icon-label-demo.tsx`,
  `apps/registry-ui/registry/bases/base-ui/examples/panel-field-label-demo.tsx`,
  `apps/registry-ui/registry/bases/base-ui/examples/command-menu-demo.tsx`

**Interfaces:**

- Consumes: the Task 4 tree (39 items: 20 `registry:component`, 1 block, 18 demos;
  `examples/examples.spec.tsx` with 25 `EXPECTED_SLOT` rows).
- Produces:
  - registry items `icon-chip`, `icon-label`, `panel-field-label` (`general`), `command-menu`
    (`navigation`), each `registry:component`; `icon-chip-demo`, `icon-label-demo`,
    `panel-field-label-demo`, `command-menu-demo`, each `registry:example`; placed by kind-folder
    and item order; 47 items (24 components, 1 block, 22 demos).
  - `examples/icon-chip-demo.tsx`: `IconChipDemo(): ReactNode`
  - `examples/icon-label-demo.tsx`: `IconLabelDemo(): ReactNode`
  - `examples/panel-field-label-demo.tsx`: `PanelFieldLabelDemo(): ReactNode`
  - `examples/command-menu-demo.tsx`: `CommandMenuDemo(): ReactNode`
  - `examples/examples.spec.tsx`: four new `EXPECTED_SLOT` rows; the per-file case now asserts
    against `document` instead of `container`'s return value.
- Removed: nothing.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Write the failing rows**

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, add these rows to `EXPECTED_SLOT`, each at its place in key order (the table stays alphabetical):

```text
  'command-menu-demo': 'command-menu',
  'icon-chip-demo': 'icon-chip',
  'icon-label-demo': 'icon-label',
  'panel-field-label-demo': 'field-label',
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^ +×|AssertionError|^-   "|Test Files|^ +Tests'`
Expected:

```
     × has a row for every example file and a file for every row
AssertionError: expected [ 'ai-provider-picker-demo', …(25) ] to deeply equal [ 'ai-provider-picker-demo', …(29) ]
-   "command-menu-demo",
-   "icon-chip-demo",
-   "icon-label-demo",
-   "panel-field-label-demo",
 Test Files  1 failed (1)
      Tests  1 failed | 28 passed (29)
```

(The four rows have no file yet; the other 23 cases - the 21 existing renders and the two
behaviour cases - still pass.)

- [ ] **Step 3: Widen the per-file check to look past the container**

`CommandMenu`'s own `data-slot` sits on the `Command` inside a `CommandDialog`, whose popup Base
UI portals into `document.body` - a sibling of `render`'s `container` div, never a descendant of
it, open or closed. `document.querySelector` finds it (and finds everything `container` already
did, since `container` is itself appended under `document.body`), which is why
`command-menu.spec.tsx` already queries `document`, not `container`.

```diff
   it.each(EXAMPLES)('$file renders $exportName with its data-slot', async ({ file, Example }) => {
-    const { container } = render(<Example />);
+    render(<Example />);
     // An upstream ScrollArea measures its viewport in a queueMicrotask outside
     // render's own act() batch; settle it so no example leaves a state update
     // to land after the test has moved on.
     await act(async () => {});
-    expect(container.querySelector(`[data-slot="${EXPECTED_SLOT[file]}"]`)).not.toBeNull();
+    expect(document.querySelector(`[data-slot="${EXPECTED_SLOT[file]}"]`)).not.toBeNull();
   });
```

- [ ] **Step 4: Write each demo**

`registry/bases/base-ui/examples/icon-chip-demo.tsx`:

```text
import { Eye, MessageSquare, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconChip } from '@/registry/bases/base-ui/components/general/icon-chip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/** A chat-ability chip named by its own caption, beside two chips named only through a composed tooltip. */
function IconChipDemo(): ReactNode {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <IconChip aria-label="Chat" className="bg-violet-500/15 text-violet-600">
            <MessageSquare className="size-3" />
          </IconChip>
          <span className="text-sm">Chat</span>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={<IconChip aria-label="Vision input" className="bg-emerald-500/15 text-emerald-600" />}
          >
            <Eye className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Vision input</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<IconChip aria-label="Tool use" className="bg-sky-500/15 text-sky-600" />}>
            <Wrench className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Tool use</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export { IconChipDemo };
```

(The first chip keeps its own `data-slot="icon-chip"`, since it is not a Tooltip's render target;
the other two, composed exactly as the family's doc comment shows, render with
`data-slot="tooltip-trigger"` instead - Base UI's trigger overwrites a plain attribute like
`data-slot` on the element it renders, merging only `className` and the event handlers. The
family's own `icon-chip.spec.tsx` already stops asserting `data-slot` in that composed case for
the same reason.)

`registry/bases/base-ui/examples/icon-label-demo.tsx`:

```text
import { Blend, RotateCw, Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { IconLabel } from '@/registry/bases/base-ui/components/general/icon-label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/** A universally-read field icon beside two others whose meaning is revealed through a composed tooltip. */
function IconLabelDemo(): ReactNode {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <IconLabel aria-label="Search">
            <Search />
          </IconLabel>
          <input className="border-input h-8 w-24 rounded-md border px-2 text-sm" placeholder="Filter..." />
        </div>
        <Tooltip>
          <TooltipTrigger render={<IconLabel aria-label="Rotation" />}>
            <RotateCw />
          </TooltipTrigger>
          <TooltipContent>Rotation</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<IconLabel aria-label="Opacity" />}>
            <Blend />
          </TooltipTrigger>
          <TooltipContent>Opacity</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export { IconLabelDemo };
```

`registry/bases/base-ui/examples/panel-field-label-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { PanelFieldLabel } from '@/registry/bases/base-ui/components/general/panel-field-label';
import { Field } from '@/registry/bases/base-ui/ui/field';

/** A PanelFieldLabel naming a fill swatch that carries no inline label of its own. */
function PanelFieldLabelDemo(): ReactNode {
  return (
    <Field className="w-40 gap-1">
      <PanelFieldLabel htmlFor="fill">Fill</PanelFieldLabel>
      <input id="fill" type="color" defaultValue="#f97316" className="border-input h-8 w-full rounded-md border p-1" />
    </Field>
  );
}

export { PanelFieldLabelDemo };
```

`registry/bases/base-ui/examples/command-menu-demo.tsx`:

```text
'use client';

import { useState, type ReactNode } from 'react';

import { CommandMenu, CommandMenuItem } from '@/registry/bases/base-ui/components/navigation/command-menu';
import { useCommandShortcut } from '@/registry/bases/base-ui/hooks/use-command-shortcut';
import { CommandEmpty, CommandInput, CommandList } from '@/registry/bases/base-ui/ui/command';

const FILES = ['SKILL.md', 'scripts/run.py', 'settings.json'] as const;

/** A command palette, reopened by Ctrl/Cmd+K, that reports the chosen file. */
function CommandMenuDemo(): ReactNode {
  const [open, setOpen] = useState(true);
  const [picked, setPicked] = useState<string>('SKILL.md');
  useCommandShortcut({ key: 'k', onTrigger: () => setOpen(true) });

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-muted-foreground text-sm">Picked: {picked}</p>
      <CommandMenu open={open} onOpenChange={setOpen} onValueChange={setPicked}>
        <CommandInput placeholder="Jump to file..." />
        <CommandList>
          <CommandEmpty>No file found.</CommandEmpty>
          {FILES.map((file) => (
            <CommandMenuItem key={file} value={file}>
              {file}
            </CommandMenuItem>
          ))}
        </CommandList>
      </CommandMenu>
    </div>
  );
}

export { CommandMenuDemo };
```

(`open` starts `true`: a closed `CommandDialog` renders nothing at all - Base UI unmounts the
popup, it does not just hide it - so a demo that opened only on the shortcut would fail its own
row check on the very first render. `useCommandShortcut` still does real work here: pressing
Ctrl/Cmd+K after a close re-opens the palette.)

- [ ] **Step 5: Publish the four items and their four demos**

In `apps/registry-ui/registry.json`, insert `icon-chip`, `icon-label`, `panel-field-label` after
`unsaved-indicator` (the last `feedback` item) and before `panel-field-group`:

```text
    {
      "name": "icon-chip",
      "type": "registry:component",
      "title": "Icon Chip",
      "description": "A small square that holds one glyph, tinted through the caller's className.",
      "categories": ["general"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/general/icon-chip.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "icon-label",
      "type": "registry:component",
      "title": "Icon Label",
      "description": "An icon that stands in for a field's text label in a dense panel, sizing an unclassed child svg to a compact glyph.",
      "categories": ["general"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/general/icon-label.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "panel-field-label",
      "type": "registry:component",
      "title": "Panel Field Label",
      "description": "The dense, muted label a property panel puts over a control with no inline label of its own, keeping upstream's field-label slot.",
      "categories": ["general"],
      "registryDependencies": ["@shadcn/field", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/general/panel-field-label.tsx",
          "type": "registry:component"
        }
      ]
    },
```

Insert `command-menu` after `panel-row` and before the `ai-provider-picker` block item:

```text
    {
      "name": "command-menu",
      "type": "registry:component",
      "title": "Command Menu",
      "description": "A command palette for jumping to a target: a controlled CommandDialog holding a Command that reports the chosen item's value and closes on select.",
      "categories": ["navigation"],
      "registryDependencies": ["@shadcn/command"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/navigation/command-menu.tsx",
          "type": "registry:component"
        }
      ]
    },
```

Insert `icon-chip-demo`, `icon-label-demo`, `panel-field-label-demo` after `unsaved-indicator-demo`
and before `panel-row-demo` (their items sit between `unsaved-indicator` and `panel-field-group`,
which has no demo until Task 8):

```text
    {
      "name": "icon-chip-demo",
      "type": "registry:example",
      "title": "Icon Chip Demo",
      "description": "A chat-ability chip named by its own caption, beside two chips named only through a composed tooltip.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/tooltip", "https://ui.zeroxsolutions.com/r/icon-chip.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/icon-chip-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "icon-label-demo",
      "type": "registry:example",
      "title": "Icon Label Demo",
      "description": "A universally-read field icon beside two others whose meaning is revealed through a composed tooltip.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/tooltip", "https://ui.zeroxsolutions.com/r/icon-label.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/icon-label-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "panel-field-label-demo",
      "type": "registry:example",
      "title": "Panel Field Label Demo",
      "description": "A PanelFieldLabel naming a fill swatch that carries no inline label of its own.",
      "categories": ["examples"],
      "registryDependencies": ["@shadcn/field", "https://ui.zeroxsolutions.com/r/panel-field-label.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/panel-field-label-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
```

Insert `command-menu-demo` after `panel-row-demo` and before `ai-provider-picker-demo`:

```text
    {
      "name": "command-menu-demo",
      "type": "registry:example",
      "title": "Command Menu Demo",
      "description": "A command palette, reopened by Ctrl/Cmd+K, that reports the chosen file.",
      "categories": ["examples"],
      "registryDependencies": ["@shadcn/command", "https://ui.zeroxsolutions.com/r/command-menu.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/command-menu-demo.tsx",
          "type": "registry:example"
        },
        {
          "path": "registry/bases/base-ui/hooks/use-command-shortcut.ts",
          "type": "registry:hook"
        }
      ]
    },
```

(`command-menu-demo` ships `use-command-shortcut.ts` itself, the same way a component item ships
a `lib/` or `hooks/` file it reaches: `command-menu.tsx` does not import the hook - the family's
own doc comment says the consumer wires it in - so it is the demo's own import of it that puts it
under `registry:hook`, not a mapping through `command-menu`'s URL.)

- [ ] **Step 6: Run both registry specs, the suite, the type check, lint, prettier and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t5.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t5.log"; grep -c 'not wrapped in act' "$S/vt-t5.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t5.log" 2>&1; grep 'error TS' "$S/tsc-t5.log" | cut -c1-80
pnpm exec eslint $E/icon-chip-demo.tsx $E/icon-label-demo.tsx $E/panel-field-label-demo.tsx $E/command-menu-demo.tsx $E/examples.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check $E/icon-chip-demo.tsx $E/icon-label-demo.tsx $E/panel-field-label-demo.tsx $E/command-menu-demo.tsx $E/examples.spec.tsx registry.json 2>&1 | tail -1
rm -rf "$S/r-t5"; pnpm exec shadcn build -o "$S/r-t5" > "$S/sb-t5.log" 2>&1; tail -1 "$S/sb-t5.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (33 tests)
 Test Files  2 passed (2)
      Tests  47 passed (47)
 Test Files  79 passed (79)
      Tests  485 passed (485)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 47 items.
```

(eslint prints no problem line. 481 after Task 4 + 4 new rows = 485; 79 files, since no spec file is added. 47 items: 39 + 4 components + 4 demos.)

- [ ] **Step 7: Commit**

`$S/msg-t5.txt`:

```
feat(registry-ui): publish the general and navigation families

Why: icon-chip, icon-label and panel-field-label round out the general
kind folder and command-menu is the sole navigation family; each
needed a registry item, one demo and an examples.spec.tsx row before
shadcn add could reach them. Composing IconChip or IconLabel as a
Tooltip's render target - the way their own doc comments show, and how
each gets an accessible name - overwrites their own data-slot with
tooltip-trigger, so each demo keeps one plain instance too. CommandMenu's
data-slot lives inside a Dialog portal outside the render container, so
the per-example check now reads document instead of container.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
B=apps/registry-ui/registry/bases/base-ui
git add $B/examples/icon-chip-demo.tsx $B/examples/icon-label-demo.tsx $B/examples/panel-field-label-demo.tsx $B/examples/command-menu-demo.tsx
git commit -q -F "$S/msg-t5.txt" -- apps/registry-ui/registry.json $B/examples/examples.spec.tsx $B/examples/icon-chip-demo.tsx $B/examples/icon-label-demo.tsx $B/examples/panel-field-label-demo.tsx $B/examples/command-menu-demo.tsx
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`;
the log shows the subject above.

---

### Task 6: Publish avatar-picker, center, collapsible-card, file-tree, floating-toolbar and frontmatter-form

Spec (b) Items and Examples. Six composed families under `components/layout/` - `avatar-picker`,
`center`, `collapsible-card`, `file-tree`, `floating-toolbar` and `frontmatter-form` - have no
registry item and no demo, so a consuming app cannot install any of them. Each gets one
`registry:component` item (name from its file, description from its current API, `files`/
`dependencies`/`registryDependencies` from what it imports) and one `<name>-demo` example that
composes its parts the way its own doc comment shows. None of the six paints with a `success` or
`warning` class, so none carries `cssVars`. `file-tree` is the only one that ships a second file:
`hooks/use-controllable-state.ts`, already present on this tree. `avatar-picker.tsx` imports
`EmojiPicker`, so its item names the `emoji-picker` item's URL, which exists from Task 3; this task
comes after it. `collapsible-card` is published here and not by the data-display task that first
needs it (Task 7, whose `code-block` and `markdown-view` import it).

**Files:**

- Create: `examples/avatar-picker-demo.tsx`, `examples/center-demo.tsx`, `examples/collapsible-card-demo.tsx`, `examples/file-tree-demo.tsx`, `examples/floating-toolbar-demo.tsx`, `examples/frontmatter-form-demo.tsx`
- Modify: `examples/examples.spec.tsx`, `apps/registry-ui/registry.json`

**Interfaces:**

- Consumes: the Task 5 tree (47 items: 24 `registry:component`, 1 block, 22 demos), which carries the `emoji-picker` item from Task 3.
- Produces, each imported through `@/registry/bases/base-ui/examples/...`:
  - `AvatarPickerDemo`, `CenterDemo`, `CollapsibleCardDemo`, `FileTreeDemo`, `FloatingToolbarDemo`, `FrontmatterFormDemo`, each `(): ReactNode`
  - registry items `avatar-picker`, `center`, `collapsible-card`, `file-tree`, `floating-toolbar`, `frontmatter-form` (`registry:component`, category `layout`), inserted alphabetically between `panel-field-label` and `panel-field-group`
  - registry items `avatar-picker-demo`, `center-demo`, `collapsible-card-demo`, `file-tree-demo`, `floating-toolbar-demo`, `frontmatter-form-demo` (`registry:example`), inserted between `panel-field-label-demo` and `panel-row-demo`; 59 items (30 `registry:component`, 1 block, 28 `registry:example`)
  - six new rows in `examples/examples.spec.tsx`'s `EXPECTED_SLOT`
- Removed: none.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Add the EXPECTED_SLOT rows (RED)**

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, add these rows to `EXPECTED_SLOT`, each at its place in key order (the table stays alphabetical):

```text
  'avatar-picker-demo': 'avatar-picker-trigger',
  'center-demo': 'center',
  'collapsible-card-demo': 'collapsible-card',
  'file-tree-demo': 'file-tree',
  'floating-toolbar-demo': 'floating-toolbar',
  'frontmatter-form-demo': 'frontmatter-form',
```

(`avatar-picker`'s root is `<Popover data-slot="avatar-picker" ...>`, upstream's `Popover.Root`,
which renders no DOM element of its own and never opens by default, so neither that `data-slot`
nor the popover's content pane are ever in the document for a plain render. The most specific
slot the demo does render is `AvatarPickerTrigger`'s own `avatar-picker-trigger`.)

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^ +×|AssertionError|^-   "|Test Files|^ +Tests'`
Expected:

```
     × has a row for every example file and a file for every row
AssertionError: expected [ 'ai-provider-picker-demo', …(29) ] to deeply equal [ 'ai-provider-picker-demo', …(35) ]
-   "avatar-picker-demo",
-   "center-demo",
-   "collapsible-card-demo",
-   "file-tree-demo",
-   "floating-toolbar-demo",
-   "frontmatter-form-demo",
 Test Files  1 failed (1)
      Tests  1 failed | 32 passed (33)
```

- [ ] **Step 3: Write the six demos**

`apps/registry-ui/registry/bases/base-ui/examples/avatar-picker-demo.tsx`:

```text
'use client';

import { Palette, Smile } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  AvatarPicker,
  AvatarPickerColor,
  AvatarPickerContent,
  AvatarPickerEmoji,
  AvatarPickerRemove,
  AvatarPickerTrigger,
  type AvatarPickerValue,
} from '@/registry/bases/base-ui/components/layout/avatar-picker';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

/** A round tile, tinted by the picked colour, that opens an emoji + colour editor. */
function AvatarPickerDemo(): ReactNode {
  const [avatar, setAvatar] = useState<AvatarPickerValue>({ color: '#6366f1' });

  return (
    <AvatarPicker value={avatar} onValueChange={setAvatar}>
      <AvatarPickerTrigger
        className="flex size-10 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: avatar.emoji ? undefined : (avatar.color ?? undefined) }}
      >
        {avatar.emoji}
      </AvatarPickerTrigger>
      <AvatarPickerContent>
        <Tabs defaultValue="emoji" className="gap-0">
          <div className="flex items-center gap-1 p-2">
            <TabsList variant="line">
              <TabsTrigger value="emoji" aria-label="Emoji" className="flex-none px-2">
                <Smile />
              </TabsTrigger>
              <TabsTrigger value="color" aria-label="Color" className="flex-none px-2">
                <Palette />
              </TabsTrigger>
            </TabsList>
            <AvatarPickerRemove className="ml-auto" />
          </div>
          <AvatarPickerEmoji />
          <AvatarPickerColor />
        </Tabs>
      </AvatarPickerContent>
    </AvatarPicker>
  );
}

export { AvatarPickerDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/center-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { Center } from '@/registry/bases/base-ui/components/layout/center';

/** A dashed frame with its content centred on both axes. */
function CenterDemo(): ReactNode {
  return (
    <Center className="border-border text-muted-foreground h-32 w-full rounded-md border border-dashed text-sm">
      Centered content
    </Center>
  );
}

export { CenterDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/collapsible-card-demo.tsx`:

```text
import type { ReactNode } from 'react';

import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';

/** A bordered card whose body collapses behind its own trigger. */
function CollapsibleCardDemo(): ReactNode {
  return (
    <CollapsibleCard className="w-full max-w-sm">
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>Layers</CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CollapsibleCardContent className="px-3 pb-3">Background, Shadow, Text</CollapsibleCardContent>
    </CollapsibleCard>
  );
}

export { CollapsibleCardDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/file-tree-demo.tsx`:

```text
import type { ReactNode } from 'react';

import {
  FileTree,
  FileTreeGroup,
  FileTreeItem,
  FileTreeLabel,
} from '@/registry/bases/base-ui/components/layout/file-tree';

/** A small file tree with one folder expanded and a leaf selected by default. */
function FileTreeDemo(): ReactNode {
  return (
    <FileTree aria-label="Files" defaultExpanded={['src']} defaultValue="src/index.ts" className="w-full max-w-xs">
      <FileTreeItem value="src">
        <FileTreeLabel>src</FileTreeLabel>
        <FileTreeGroup>
          <FileTreeItem value="src/index.ts">
            <FileTreeLabel>index.ts</FileTreeLabel>
          </FileTreeItem>
          <FileTreeItem value="src/util.ts">
            <FileTreeLabel>util.ts</FileTreeLabel>
          </FileTreeItem>
        </FileTreeGroup>
      </FileTreeItem>
      <FileTreeItem value="README.md">
        <FileTreeLabel>README.md</FileTreeLabel>
      </FileTreeItem>
    </FileTree>
  );
}

export { FileTreeDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/floating-toolbar-demo.tsx`:

```text
import { Bold, Italic, Underline } from 'lucide-react';
import type { ReactNode } from 'react';

import { FloatingToolbar } from '@/registry/bases/base-ui/components/layout/floating-toolbar';
import { Button } from '@/registry/bases/base-ui/ui/button';

/** A row of formatting buttons in the toolbar's own shell. */
function FloatingToolbarDemo(): ReactNode {
  return (
    <FloatingToolbar aria-label="Text formatting">
      <Button variant="ghost" size="icon-sm" aria-label="Bold">
        <Bold />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Italic">
        <Italic />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Underline">
        <Underline />
      </Button>
    </FloatingToolbar>
  );
}

export { FloatingToolbarDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/frontmatter-form-demo.tsx`:

```text
'use client';

import { useState, type ReactNode } from 'react';

import {
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
  FrontmatterFormFieldLabel,
  type FrontmatterFormValue,
} from '@/registry/bases/base-ui/components/layout/frontmatter-form';
import { FieldDescription } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';

/** A skill's frontmatter: a name and its one-line description, each bound to an Input. */
function FrontmatterFormDemo(): ReactNode {
  const [value, setValue] = useState<FrontmatterFormValue>({
    name: 'pdf-toolkit',
    description: 'Fill and flatten PDF forms.',
  });

  return (
    <FrontmatterForm value={value} onValueChange={setValue} className="w-full max-w-sm">
      <FrontmatterFormField name="name">
        <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input placeholder="my-skill" />} />
        <FieldDescription>Lowercase, dash-separated.</FieldDescription>
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
      <FrontmatterFormField name="description">
        <FrontmatterFormFieldLabel>Description</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input />} />
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
    </FrontmatterForm>
  );
}

export { FrontmatterFormDemo };
```

- [ ] **Step 4: Add the six component items and their demos to registry.json**

Derived by reading each family file's imports (`ui/<x>` to `@shadcn/<x>`, `lib/utils` to
`@shadcn/utils`, a bare import to its package, `hooks/use-controllable-state.ts` shipped alongside
`file-tree`); `registry.spec.ts`'s real-registry cases confirm each below.

In `apps/registry-ui/registry.json`, insert after `panel-field-label` and before `panel-field-group`:

```text
    {
      "name": "avatar-picker",
      "type": "registry:component",
      "title": "Avatar Picker",
      "description": "A Popover-based avatar editor whose emoji, upload and colour panes edit one avatar value.",
      "categories": ["layout"],
      "dependencies": ["lucide-react"],
      "registryDependencies": [
        "@shadcn/button",
        "@shadcn/popover",
        "@shadcn/tabs",
        "@shadcn/utils",
        "https://ui.zeroxsolutions.com/r/emoji-picker.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/avatar-picker.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "center",
      "type": "registry:component",
      "title": "Center",
      "description": "A box that centres its children on both axes, in block or inline flow, with its element swappable through render.",
      "categories": ["layout"],
      "dependencies": ["@base-ui/react", "class-variance-authority"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/center.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "collapsible-card",
      "type": "registry:component",
      "title": "Collapsible Card",
      "description": "A collapsible card with a header and body, open by default, in a bordered, muted or plain surface variant.",
      "categories": ["layout"],
      "dependencies": ["class-variance-authority", "lucide-react"],
      "registryDependencies": ["@shadcn/button", "@shadcn/collapsible", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/collapsible-card.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "file-tree",
      "type": "registry:component",
      "title": "File Tree",
      "description": "An accessible file tree that drives keyboard navigation and owns selection and folder expansion, controlled or uncontrolled.",
      "categories": ["layout"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/file-tree.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/hooks/use-controllable-state.ts",
          "type": "registry:hook"
        }
      ]
    },
    {
      "name": "floating-toolbar",
      "type": "registry:component",
      "title": "Floating Toolbar",
      "description": "A floating, blurred card-colour toolbar shell, a toolbar landmark around the tools the caller composes.",
      "categories": ["layout"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/floating-toolbar.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "frontmatter-form",
      "type": "registry:component",
      "title": "Frontmatter Form",
      "description": "A frontmatter editor whose root holds the document and field setters for the consumer's composed fields.",
      "categories": ["layout"],
      "registryDependencies": ["@shadcn/field", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/frontmatter-form.tsx",
          "type": "registry:component"
        }
      ]
    },
```

And insert after `panel-field-label-demo` and before `panel-row-demo`:

```text
    {
      "name": "avatar-picker-demo",
      "type": "registry:example",
      "title": "Avatar Picker Demo",
      "description": "A colour-tinted tile that opens an emoji and colour editor over AvatarPicker.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/tabs", "https://ui.zeroxsolutions.com/r/avatar-picker.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/avatar-picker-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "center-demo",
      "type": "registry:example",
      "title": "Center Demo",
      "description": "A dashed frame with its content centred on both axes.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/center.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/center-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "collapsible-card-demo",
      "type": "registry:example",
      "title": "Collapsible Card Demo",
      "description": "A bordered card whose body collapses behind its own trigger.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/collapsible-card.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/collapsible-card-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "file-tree-demo",
      "type": "registry:example",
      "title": "File Tree Demo",
      "description": "A small file tree with one folder expanded and a leaf selected by default.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/file-tree.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/file-tree-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "floating-toolbar-demo",
      "type": "registry:example",
      "title": "Floating Toolbar Demo",
      "description": "A row of formatting buttons in the toolbar's own shell.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/button", "https://ui.zeroxsolutions.com/r/floating-toolbar.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/floating-toolbar-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "frontmatter-form-demo",
      "type": "registry:example",
      "title": "Frontmatter Form Demo",
      "description": "A skill's frontmatter, a name and its description, each bound through FrontmatterFormFieldControl.",
      "categories": ["examples"],
      "registryDependencies": [
        "@shadcn/field",
        "@shadcn/input",
        "https://ui.zeroxsolutions.com/r/frontmatter-form.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/frontmatter-form-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
```

- [ ] **Step 5: Run both registry specs, the suite, the type check, lint, prettier and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t6.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t6.log"; grep -c 'not wrapped in act' "$S/vt-t6.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t6.log" 2>&1; grep 'error TS' "$S/tsc-t6.log" | cut -c1-80
pnpm exec eslint $E/avatar-picker-demo.tsx $E/center-demo.tsx $E/collapsible-card-demo.tsx $E/file-tree-demo.tsx $E/floating-toolbar-demo.tsx $E/frontmatter-form-demo.tsx $E/examples.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check $E/avatar-picker-demo.tsx $E/center-demo.tsx $E/collapsible-card-demo.tsx $E/file-tree-demo.tsx $E/floating-toolbar-demo.tsx $E/frontmatter-form-demo.tsx $E/examples.spec.tsx registry.json 2>&1 | tail -1
rm -rf "$S/r-t6"; pnpm exec shadcn build -o "$S/r-t6" > "$S/sb-t6.log" 2>&1; tail -1 "$S/sb-t6.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (39 tests)
 Test Files  2 passed (2)
      Tests  53 passed (53)
 Test Files  79 passed (79)
      Tests  491 passed (491)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 59 items.
```

(eslint prints no problem line. 485 after Task 5 + 6 new row cases = 491; 79 files, since no spec file is added. 59 items: 47 + 6 components + 6 demos.)

- [ ] **Step 6: Commit**

`$S/msg-t6.txt`:

```
feat(registry-ui): publish six layout items and their demos

Why: avatar-picker, center, collapsible-card, file-tree,
floating-toolbar and frontmatter-form were composed families under
components/layout/ with no registry item and no demo, so a consuming
app could not install any of them. Each takes its file's name, a
description of its current API, and one demo composed the way its own
doc comment shows.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
E=apps/registry-ui/registry/bases/base-ui/examples
git add $E/avatar-picker-demo.tsx $E/center-demo.tsx $E/collapsible-card-demo.tsx $E/file-tree-demo.tsx $E/floating-toolbar-demo.tsx $E/frontmatter-form-demo.tsx
git commit -q -F "$S/msg-t6.txt" -- $E/avatar-picker-demo.tsx $E/center-demo.tsx $E/collapsible-card-demo.tsx $E/file-tree-demo.tsx $E/floating-toolbar-demo.tsx $E/frontmatter-form-demo.tsx $E/examples.spec.tsx apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 7: Publish the data-display families

Spec (b) Items and Examples, for the `data-display` kind. Seven family files under
`components/data-display/` - `code-block`, `data-table`, `file-type-icon`, `font-preview`,
`highlighted-code`, `image-preview`, `markdown-view` - become `registry:component` items, each with one
`<name>-demo` example. The two data-display items Task 1 already carries but that have no demo yet
(`ai-provider-card`, `model-info-card`) get their demo now too; `chat-message-demo` already exists from
Task 2 and is untouched. Two of the new files reach outside `data-display`: `code-block.tsx` imports
`components/feedback/copy-button` and `components/layout/collapsible-card`, and `markdown-view.tsx` imports
`collapsible-card`'s header parts for its fenced-code mode. Both are items already (`copy-button` from Task 4,
`collapsible-card` from Task 6), which is why this task comes after both: before them, `registry.spec.ts`'s
real-registry case reports each import as "no registry item ships". `code-block` also carries the heaviest
transitive chain in the registry: its language-icon lib and its read-only Shiki highlighter, each with their
own further shipped files and packages.

**Files:**

- Create: `apps/registry-ui/registry/bases/base-ui/examples/ai-provider-card-demo.tsx`,
  `code-block-demo.tsx`, `data-table-demo.tsx`, `file-type-icon-demo.tsx`, `font-preview-demo.tsx`,
  `highlighted-code-demo.tsx`, `image-preview-demo.tsx`, `markdown-view-demo.tsx`, `model-info-card-demo.tsx`
- Modify: `apps/registry-ui/registry.json`,
  `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`

**Interfaces:**

- Consumes: the Task 6 tree: 59 items (30 `registry:component`, 1 block, 28 demos), including `copy-button` (Task 4) and `collapsible-card` (Task 6).
- Produces:
  - from each new `examples/<file>`: `AiProviderCardDemo`, `CodeBlockDemo`, `DataTableDemo`,
    `FileTypeIconDemo`, `FontPreviewDemo`, `HighlightedCodeDemo`, `ImagePreviewDemo`, `MarkdownViewDemo`,
    `ModelInfoCardDemo`, each `(): ReactNode`
  - registry items `code-block`, `data-table`, `file-type-icon`, `font-preview`, `highlighted-code`,
    `image-preview`, `markdown-view` (data-display), and demos `ai-provider-card-demo`, `code-block-demo`,
    `data-table-demo`, `file-type-icon-demo`, `font-preview-demo`, `highlighted-code-demo`,
    `image-preview-demo`, `markdown-view-demo`, `model-info-card-demo` - 75 items total (37
    `registry:component`, 1 block, 37 `registry:example`)
  - `examples/examples.spec.tsx` gains nine `EXPECTED_SLOT` rows and a `vi.mock('../lib/shiki', ...)`
- Removed: nothing.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start with `apps/`.

- [ ] **Step 1: Add the nine rows and watch them fail**

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, add these rows to `EXPECTED_SLOT`, each at its place in key order (the table stays alphabetical):

```text
  'ai-provider-card-demo': 'ai-provider-card',
  'code-block-demo': 'code-block',
  'data-table-demo': 'data-table',
  'file-type-icon-demo': 'file-type-icon',
  'font-preview-demo': 'font-preview',
  'highlighted-code-demo': 'highlighted-code',
  'image-preview-demo': 'image-preview',
  'markdown-view-demo': 'markdown-view',
  'model-info-card-demo': 'model-info-card',
```

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^ +×|AssertionError|^-   "|Test Files|^ +Tests'`
Expected:

```
     × has a row for every example file and a file for every row
AssertionError: expected [ 'ai-provider-picker-demo', …(35) ] to deeply equal [ 'ai-provider-card-demo', …(44) ]
-   "ai-provider-card-demo",
-   "code-block-demo",
-   "data-table-demo",
-   "file-type-icon-demo",
-   "font-preview-demo",
-   "highlighted-code-demo",
-   "image-preview-demo",
-   "markdown-view-demo",
-   "model-info-card-demo",
 Test Files  1 failed (1)
      Tests  1 failed | 38 passed (39)
```

(The row check fails: nine rows name a file that does not exist yet. Every other case still passes.)

- [ ] **Step 2: Write the nine demos**

`examples/ai-provider-card-demo.tsx`:

```text
'use client';

import { useState, type ReactNode } from 'react';

import {
  AiProviderCard,
  AiProviderCardAction,
  AiProviderCardDescription,
  AiProviderCardStatus,
  AiProviderCardTrigger,
} from '@/registry/bases/base-ui/components/data-display/ai-provider-card';
import { CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';

const PROVIDERS = [
  {
    name: 'OpenAI',
    description: 'GPT reasoning and chat models for general-purpose assistance.',
    status: 'online' as const,
    note: '12 models',
  },
  {
    name: 'Local model',
    description: 'Runs on this machine, no network required.',
    status: 'idle' as const,
    note: 'Starting up',
  },
];

/** Two AiProviderCard tiles - one online, one idle - each toggled independently and reporting the last selection. */
function AiProviderCardDemo(): ReactNode {
  const [selected, setSelected] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ OpenAI: true, 'Local model': false });

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <AiProviderCard key={provider.name} status={provider.status}>
            <CardHeader>
              <CardTitle>{provider.name}</CardTitle>
              <AiProviderCardDescription>{provider.description}</AiProviderCardDescription>
            </CardHeader>
            <CardFooter className="mt-auto justify-between">
              <AiProviderCardStatus>{provider.note}</AiProviderCardStatus>
              <AiProviderCardAction>
                <button
                  type="button"
                  aria-pressed={enabled[provider.name]}
                  className="text-muted-foreground aria-pressed:text-foreground text-xs underline-offset-2 hover:underline"
                  onClick={() => setEnabled((current) => ({ ...current, [provider.name]: !current[provider.name] }))}
                >
                  {enabled[provider.name] ? 'Enabled' : 'Disabled'}
                </button>
              </AiProviderCardAction>
            </CardFooter>
            <AiProviderCardTrigger aria-label={`Select ${provider.name}`} onClick={() => setSelected(provider.name)} />
          </AiProviderCard>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">{selected ? `Selected: ${selected}` : 'No provider selected'}</p>
    </div>
  );
}

export { AiProviderCardDemo };
```

`examples/code-block-demo.tsx`:

```text
import type { ReactNode } from 'react';

import {
  CodeBlock,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';

const SOURCE = 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}';

/** A collapsible TypeScript block with its language, a copy action and a collapse toggle. */
function CodeBlockDemo(): ReactNode {
  return (
    <CodeBlock code={SOURCE} language="ts">
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeBlockLanguage />
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CodeBlockCopy />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
    </CodeBlock>
  );
}

export { CodeBlockDemo };
```

`examples/data-table-demo.tsx`:

```text
'use client';

import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  DataTableView,
  DataTableViewOptions,
} from '@/registry/bases/base-ui/components/data-display/data-table';

interface FileRow {
  name: string;
  size: string;
}

const DATA: FileRow[] = [
  { name: 'report.pdf', size: '2.4 MB' },
  { name: 'invoice.csv', size: '12 KB' },
  { name: 'logo.png', size: '340 KB' },
];

const COLUMNS: ColumnDef<FileRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column}>Name</DataTableColumnHeader>,
  },
  {
    accessorKey: 'size',
    header: ({ column }) => <DataTableColumnHeader column={column}>Size</DataTableColumnHeader>,
  },
];

/** A small, paginated file table with sortable columns and a view-options menu. */
function DataTableDemo(): ReactNode {
  const table = useReactTable({
    data: DATA,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 2 } },
  });

  return (
    <DataTable table={table} className="w-full">
      <DataTableToolbar className="justify-end">
        <DataTableViewOptions />
      </DataTableToolbar>
      <DataTableView />
      <DataTablePagination>
        {`Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
      </DataTablePagination>
    </DataTable>
  );
}

export { DataTableDemo };
```

`examples/file-type-icon-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { FileTypeIcon } from '@/registry/bases/base-ui/components/data-display/file-type-icon';

const FILES = ['run.py', 'logo.png', 'Inter.woff2', 'notes.md', 'archive.zip'];

/** A row of file names, each with the icon FileTypeIcon resolves for its extension. */
function FileTypeIconDemo(): ReactNode {
  return (
    <ul className="flex flex-col gap-2">
      {FILES.map((name) => (
        <li key={name} className="flex items-center gap-2 text-sm">
          <FileTypeIcon name={name} className="text-muted-foreground size-4" />
          {name}
        </li>
      ))}
    </ul>
  );
}

export { FileTypeIconDemo };
```

`examples/font-preview-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { FontPreview } from '@/registry/bases/base-ui/components/data-display/font-preview';

/** A specimen of a variable sans-serif at its four default sizes. */
function FontPreviewDemo(): ReactNode {
  return <FontPreview src="/fonts/inter-variable.woff2" />;
}

export { FontPreviewDemo };
```

`examples/highlighted-code-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { HighlightedCode } from '@/registry/bases/base-ui/components/data-display/highlighted-code';

/** Pre-tokenized lines styled with the same tokens the shared Shiki theme paints with. */
function HighlightedCodeDemo(): ReactNode {
  return (
    <pre className="bg-muted m-0 rounded-md p-3 text-xs leading-relaxed">
      <HighlightedCode
        lines={[
          [
            { content: 'function', style: { color: 'var(--code-keyword)' } },
            { content: ' greet(' },
            { content: 'name', style: { color: 'var(--code-parameter)' } },
            { content: ') {' },
          ],
          [
            { content: '  return', style: { color: 'var(--code-keyword)' } },
            { content: ' `Hello, ' },
            { content: '${name}', style: { color: 'var(--code-string-escape)' } },
            { content: '!`;', style: { color: 'var(--code-string)' } },
          ],
          [{ content: '}' }],
        ]}
      />
    </pre>
  );
}

export { HighlightedCodeDemo };
```

(No `lib/shiki` import: `HighlightLine[]` is checked structurally through the `lines` prop, so the demo item
stays to its own one file: a type import of `lib/shiki` would make rule 3 ship the whole Shiki chain with
the demo.)

`examples/image-preview-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { ImagePreview } from '@/registry/bases/base-ui/components/data-display/image-preview';

const SAMPLE_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="32" fill="#4f46e5"/></svg>',
  );

/** A small sample graphic over the transparency checkerboard, contained within its sized wrapper. */
function ImagePreviewDemo(): ReactNode {
  return (
    <div className="size-32">
      <ImagePreview src={SAMPLE_IMAGE} alt="Sample circular graphic" />
    </div>
  );
}

export { ImagePreviewDemo };
```

`examples/markdown-view-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { MarkdownView } from '@/registry/bases/base-ui/components/data-display/markdown-view';

const SOURCE = [
  '## Release notes',
  '',
  '**v1.2** adds GFM tables and task lists. See the [changelog](https://example.test/changelog) for details.',
  '',
  '- [x] Ship the parser',
  '- [ ] Document the API',
  '',
  '| Feature | Status |',
  '| --- | --- |',
  '| Tables | Done |',
  '| Autolinks | Done |',
].join('\n');

/** A short GFM document: a heading, bold text, a link, a task list and a table. */
function MarkdownViewDemo(): ReactNode {
  return <MarkdownView>{SOURCE}</MarkdownView>;
}

export { MarkdownViewDemo };
```

`examples/model-info-card-demo.tsx`:

```text
import type { ReactNode } from 'react';

import {
  ModelInfoCard,
  ModelInfoCardBadge,
  ModelInfoCardSection,
} from '@/registry/bases/base-ui/components/data-display/model-info-card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item';
import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';

/** The identity header for one model over two detail sections: context length and pricing. */
function ModelInfoCardDemo(): ReactNode {
  return (
    <ModelInfoCard className="w-full max-w-sm">
      <Item size="xs" className="p-0">
        <ItemMedia>
          <AiProviderIcon provider="openai" type="avatar" size={32} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>GPT-4o</ItemTitle>
          <ItemDescription>OpenAI</ItemDescription>
        </ItemContent>
        <ItemFooter className="text-muted-foreground font-mono text-xs">gpt-4o</ItemFooter>
      </Item>
      <ModelInfoCardSection>
        <Item size="xs">
          <ModelInfoCardBadge className="bg-blue-500" />
          <ItemContent>
            <ItemTitle>Context length</ItemTitle>
          </ItemContent>
          <ItemActions>128K tokens</ItemActions>
        </Item>
      </ModelInfoCardSection>
      <ModelInfoCardSection>
        <Item size="xs">
          <ModelInfoCardBadge className="bg-emerald-500" />
          <ItemContent>
            <ItemTitle>Pricing</ItemTitle>
          </ItemContent>
          <ItemActions>$5.00 / 1M tokens</ItemActions>
        </Item>
      </ModelInfoCardSection>
    </ModelInfoCard>
  );
}

export { ModelInfoCardDemo };
```

- [ ] **Step 3: Mock the Shiki highlighter in the spec**

`code-block-demo` renders a live `CodeBlock`, whose `useHighlightedLines` hook calls the real, async
`highlightToLines`. Its `ScrollArea` measurement is already settled by the `act()` the row case awaits
(Task 2); the highlight is mocked the way `code-block.spec.tsx` mocks it for its own tests, so no example
depends on when the real grammar loads:

```diff
 import type { ComponentType } from 'react';
-import { afterEach, beforeAll, describe, expect, it } from 'vitest';
+import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
+
+// code-block-demo renders CodeBlock, which highlights asynchronously through the
+// shared Shiki highlighter; mocking it keeps this spec deterministic, the same
+// way code-block.spec.tsx does for the component's own tests.
+vi.mock('../lib/shiki', async (importOriginal) => {
+  const actual = await importOriginal<typeof import('../lib/shiki')>();
+  return { ...actual, highlightToLines: vi.fn().mockResolvedValue(null) };
+});

 import { ButtonGroupMenu } from './button-group-menu';
```

- [ ] **Step 4: Add the seven component items and the nine demos**

In `apps/registry-ui/registry.json`, insert `code-block` through `markdown-view` between `chat-message` and
`model-info-card` (alphabetical within the `data-display` group):

```text
    {
      "name": "code-block",
      "type": "registry:component",
      "title": "Code Block",
      "description": "Read-only source over a collapsible card, highlighted through the shared Shiki highlighter and falling back to plain mono while the grammar loads.",
      "categories": ["data-display"],
      "dependencies": ["@base-ui/react", "@shikijs/langs", "@zeroxsolutions/icons", "shiki"],
      "registryDependencies": [
        "@shadcn/scroll-area",
        "@shadcn/utils",
        "https://ui.zeroxsolutions.com/r/collapsible-card.json",
        "https://ui.zeroxsolutions.com/r/copy-button.json",
        "https://ui.zeroxsolutions.com/r/highlighted-code.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/code-block.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/hooks/use-highlighted-lines.ts",
          "type": "registry:hook"
        },
        {
          "path": "registry/bases/base-ui/lib/code-language.ts",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/lib/code-theme.ts",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/lib/language-options.tsx",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/lib/mermaid-grammar.ts",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/lib/shiki.ts",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/types/language-option.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "data-table",
      "type": "registry:component",
      "title": "Data Table",
      "description": "The composable parts of a @tanstack/react-table view - toolbar, view, column header actions, pagination and view options - reading one shared table instance from context.",
      "categories": ["data-display"],
      "dependencies": ["@tanstack/react-table", "lucide-react"],
      "registryDependencies": ["@shadcn/button", "@shadcn/dropdown-menu", "@shadcn/table", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/data-table.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "file-type-icon",
      "type": "registry:component",
      "title": "File Type Icon",
      "description": "A lucide icon chosen for a file's type from its extension, decorative unless paired with the visible file name or given an aria-label.",
      "categories": ["data-display"],
      "dependencies": ["lucide-react"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/file-type-icon.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/lib/file-type.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "font-preview",
      "type": "registry:component",
      "title": "Font Preview",
      "description": "A specimen of a font file at several sizes, one row per size, loaded through an @font-face scoped to the instance.",
      "categories": ["data-display"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/font-preview.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/lib/font-format.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "highlighted-code",
      "type": "registry:component",
      "title": "Highlighted Code",
      "description": "A mono code element that renders tokenized lines from the shared Shiki highlighter, falling back to its raw children until they arrive.",
      "categories": ["data-display"],
      "dependencies": ["@shikijs/langs", "shiki"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/highlighted-code.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/lib/code-theme.ts",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/lib/mermaid-grammar.ts",
          "type": "registry:lib"
        },
        {
          "path": "registry/bases/base-ui/lib/shiki.ts",
          "type": "registry:lib"
        }
      ]
    },
    {
      "name": "image-preview",
      "type": "registry:component",
      "title": "Image Preview",
      "description": "Shows an image contained within its filled wrapper, over a checkerboard so transparent pixels read clearly.",
      "categories": ["data-display"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/image-preview.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "markdown-view",
      "type": "registry:component",
      "title": "Markdown View",
      "description": "Renders a GitHub-Flavored Markdown string styled to the design tokens, with fenced code optionally rendered as a CodeBlock instead of a plain pre.",
      "categories": ["data-display"],
      "dependencies": ["class-variance-authority", "react-markdown", "remark-gfm"],
      "registryDependencies": [
        "@shadcn/utils",
        "https://ui.zeroxsolutions.com/r/code-block.json",
        "https://ui.zeroxsolutions.com/r/collapsible-card.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/components/data-display/markdown-view.tsx",
          "type": "registry:component"
        },
        {
          "path": "registry/bases/base-ui/lib/code-language.ts",
          "type": "registry:lib"
        }
      ]
    },
```

Then, among the examples (after the `ai-provider-picker` block item), insert `ai-provider-card-demo` before
`chat-message-demo` (so it is first, matching `ai-provider-card` now being the first data-display item):

```text
    {
      "name": "ai-provider-card-demo",
      "type": "registry:example",
      "title": "AI Provider Card Demo",
      "description": "Two AiProviderCard tiles - one online, one idle - each toggled independently and reporting the last selection.",
      "categories": ["examples"],
      "registryDependencies": ["@shadcn/card", "https://ui.zeroxsolutions.com/r/ai-provider-card.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/ai-provider-card-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
```

Insert `code-block-demo` through `model-info-card-demo` between `chat-message-demo` and `chat-suggestion-item-demo`:

```text
    {
      "name": "code-block-demo",
      "type": "registry:example",
      "title": "Code Block Demo",
      "description": "A collapsible TypeScript block with its language, a copy action and a collapse toggle.",
      "categories": ["examples"],
      "registryDependencies": [
        "https://ui.zeroxsolutions.com/r/code-block.json",
        "https://ui.zeroxsolutions.com/r/collapsible-card.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/code-block-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "data-table-demo",
      "type": "registry:example",
      "title": "Data Table Demo",
      "description": "A small, paginated file table with sortable columns and a view-options menu.",
      "categories": ["examples"],
      "dependencies": ["@tanstack/react-table"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/data-table.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/data-table-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "file-type-icon-demo",
      "type": "registry:example",
      "title": "File Type Icon Demo",
      "description": "A row of file names, each with the icon FileTypeIcon resolves for its extension.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/file-type-icon.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/file-type-icon-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "font-preview-demo",
      "type": "registry:example",
      "title": "Font Preview Demo",
      "description": "A specimen of a variable sans-serif at its four default sizes.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/font-preview.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/font-preview-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "highlighted-code-demo",
      "type": "registry:example",
      "title": "Highlighted Code Demo",
      "description": "Pre-tokenized lines styled with the same tokens the shared Shiki theme paints with.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/highlighted-code.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/highlighted-code-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "image-preview-demo",
      "type": "registry:example",
      "title": "Image Preview Demo",
      "description": "A small sample graphic over the transparency checkerboard, contained within its sized wrapper.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/image-preview.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/image-preview-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "markdown-view-demo",
      "type": "registry:example",
      "title": "Markdown View Demo",
      "description": "A short GFM document: a heading, bold text, a link, a task list and a table.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/markdown-view.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/markdown-view-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "model-info-card-demo",
      "type": "registry:example",
      "title": "Model Info Card Demo",
      "description": "The identity header for one model over two detail sections: context length and pricing.",
      "categories": ["examples"],
      "dependencies": ["@zeroxsolutions/icons"],
      "registryDependencies": ["@shadcn/item", "https://ui.zeroxsolutions.com/r/model-info-card.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/model-info-card-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
```

Every other item keeps its place and its fields.

- [ ] **Step 5: Run both registry specs, the suite, the type check, lint, prettier and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t7.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t7.log"; grep -c 'not wrapped in act' "$S/vt-t7.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t7.log" 2>&1; grep 'error TS' "$S/tsc-t7.log" | cut -c1-80
pnpm exec eslint $E/ai-provider-card-demo.tsx $E/code-block-demo.tsx $E/data-table-demo.tsx $E/file-type-icon-demo.tsx $E/font-preview-demo.tsx $E/highlighted-code-demo.tsx $E/image-preview-demo.tsx $E/markdown-view-demo.tsx $E/model-info-card-demo.tsx $E/examples.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check $E/ai-provider-card-demo.tsx $E/code-block-demo.tsx $E/data-table-demo.tsx $E/file-type-icon-demo.tsx $E/font-preview-demo.tsx $E/highlighted-code-demo.tsx $E/image-preview-demo.tsx $E/markdown-view-demo.tsx $E/model-info-card-demo.tsx $E/examples.spec.tsx registry.json 2>&1 | tail -1
rm -rf "$S/r-t7"; pnpm exec shadcn build -o "$S/r-t7" > "$S/sb-t7.log" 2>&1; tail -1 "$S/sb-t7.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (48 tests)
 Test Files  2 passed (2)
      Tests  62 passed (62)
 Test Files  79 passed (79)
      Tests  500 passed (500)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 75 items.
```

(eslint prints no problem line. 491 after Task 6 + 9 new row cases = 500; 79 files, since no spec file is added. 75 items: 59 + 7 components + 9 demos.)

- [ ] **Step 6: Commit**

`$S/msg-t7.txt`:

```
feat(registry-ui): publish the data-display families

Why: seven data-display components (code-block, data-table,
file-type-icon, font-preview, highlighted-code, image-preview,
markdown-view) had no registry item yet, and ai-provider-card and
model-info-card had no demo. Each new item gets one published demo;
examples.spec.tsx mocks code-block-demo's async Shiki highlight the
way code-block.spec.tsx already does.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
E=apps/registry-ui/registry/bases/base-ui/examples
git add $E/ai-provider-card-demo.tsx $E/code-block-demo.tsx $E/data-table-demo.tsx $E/file-type-icon-demo.tsx $E/font-preview-demo.tsx $E/highlighted-code-demo.tsx $E/image-preview-demo.tsx $E/markdown-view-demo.tsx $E/model-info-card-demo.tsx
git commit -q -F "$S/msg-t7.txt" -- $E apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log
shows the subject above.

---

### Task 8: Publish the second half of the layout families

Spec (b) Items and Examples, for the five `components/layout/` families Task 6 leaves
unpublished: `model-list`, `page-container`, `panel-header`, `reasoning-collapsible`,
`tool-call-card`. Each becomes a `registry:component` item named, titled and described from its
current file, placed alphabetically in the `layout` group. Each gets its own `<name>-demo`;
`panel-field-group` also gets `panel-field-group-demo` here, since Task 1 published the item but no
task since has given it a demo (`panel-row-demo` already exists, from Task 2). `tool-call-card`
paints with `success` (a `CheckCircle2` shown only in its `output-available` state); it carries
`cssVars` for that one token, not `warning`, because nothing in the file uses `warning`. Two
families' doc comments compose a `data-display` part published in Task 7, which is why this task
comes after it: `reasoning-collapsible`'s shows `<MarkdownView codeBlocks>{text}</MarkdownView>`
inside its content slot, and `tool-call-card`'s shows `<CodeBlock code={...} language="json" />`
inside a section. `reasoning-collapsible-demo` composes `MarkdownView` (without `codeBlocks`, since a
plain rendered note is all the disclosure needs), and `tool-call-card-demo` composes `CodeBlock` for
the call's JSON parameters, exactly as the doc comment shows; its `ScrollArea` is settled by the row
case's `act()` (Task 2) and its highlight by the Shiki mock (Task 7), so the log stays free of
`not wrapped in act` lines. Each demo item names the URL of the item it composes.

**Files:**

- Modify: `registry.json`, `examples/examples.spec.tsx`
- Create: `examples/model-list-demo.tsx`, `examples/page-container-demo.tsx`,
  `examples/panel-field-group-demo.tsx`, `examples/panel-header-demo.tsx`,
  `examples/reasoning-collapsible-demo.tsx`, `examples/tool-call-card-demo.tsx`

**Interfaces:**

- Consumes: the Task 7 tree (75 items: 37 `registry:component`, 1 block, 37 `registry:example`),
  including the `markdown-view` and `code-block` items the two demos compose.
- Produces:
  - from `examples/<file>`: `ModelListDemo`, `PageContainerDemo`, `PanelFieldGroupDemo`,
    `PanelHeaderDemo`, `ReasoningCollapsibleDemo`, `ToolCallCardDemo`, each `(): ReactNode`
  - registry items `model-list`, `page-container`, `panel-header`, `reasoning-collapsible`,
    `tool-call-card` (`registry:component`, inserted into the `layout` group alphabetically)
    and `model-list-demo`, `page-container-demo`, `panel-field-group-demo`,
    `panel-header-demo`, `reasoning-collapsible-demo`, `tool-call-card-demo`
    (`registry:example`, inserted after the block in item order); 86 items
    (42 `registry:component`, 1 block, 43 `registry:example`)
  - `examples/examples.spec.tsx`: six new `EXPECTED_SLOT` rows
- Removed: nothing.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start
with `apps/`.

- [ ] **Step 1: Add the six rows and watch them fail**

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, add these rows to `EXPECTED_SLOT`, each at its place in key order (the table stays alphabetical):

```text
  'model-list-demo': 'model-list',
  'page-container-demo': 'page-container',
  'panel-field-group-demo': 'panel-field-group',
  'panel-header-demo': 'panel-header',
  'reasoning-collapsible-demo': 'reasoning-collapsible',
  'tool-call-card-demo': 'tool-call-card',
```

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^ +×|AssertionError|^-   "|Test Files|^ +Tests'`
Expected:

```
     × has a row for every example file and a file for every row
AssertionError: expected [ 'ai-provider-card-demo', …(44) ] to deeply equal [ 'ai-provider-card-demo', …(50) ]
-   "model-list-demo",
-   "page-container-demo",
-   "panel-field-group-demo",
-   "panel-header-demo",
-   "reasoning-collapsible-demo",
-   "tool-call-card-demo",
 Test Files  1 failed (1)
      Tests  1 failed | 47 passed (48)
```

- [ ] **Step 2: Write the six demos**

`apps/registry-ui/registry/bases/base-ui/examples/model-list-demo.tsx`:

```text
'use client';

import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';
import { useState, type ReactNode } from 'react';

import {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListItemRemove,
  ModelListTitle,
} from '@/registry/bases/base-ui/components/layout/model-list';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item';
import { Switch } from '@/registry/bases/base-ui/ui/switch';

interface ModelEntry {
  id: string;
  provider: string;
  title: string;
  description: string;
  enabled: boolean;
}

const INITIAL_MODELS: ModelEntry[] = [
  { id: 'gpt-4o', provider: 'openai', title: 'GPT-4o', description: 'gpt-4o', enabled: true },
  { id: 'claude-opus', provider: 'claude', title: 'Claude Opus', description: 'claude-opus-4-5', enabled: true },
  { id: 'gemini-pro', provider: 'gemini', title: 'Gemini Pro', description: 'gemini-2.5-pro', enabled: false },
];

/** A model list with two enabled providers, one unavailable, each toggleable and removable. */
function ModelListDemo(): ReactNode {
  const [models, setModels] = useState(INITIAL_MODELS);

  return (
    <div className="flex h-72 w-full flex-col rounded-lg border">
      <ModelList>
        <ModelListHeader>
          <ModelListTitle>Model list</ModelListTitle>
          <ModelListAction>
            <span className="text-muted-foreground text-xs">{models.length} models</span>
          </ModelListAction>
        </ModelListHeader>
        <ModelListContent>
          <ItemGroup>
            {models.map((model) => (
              <Item key={model.id} size="sm" data-unavailable={!model.enabled}>
                <ItemMedia>
                  <AiProviderIcon provider={model.provider} type="avatar" size={24} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{model.title}</ItemTitle>
                  <ItemDescription>{model.description}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch
                    checked={model.enabled}
                    onCheckedChange={(checked) =>
                      setModels((current) =>
                        current.map((entry) => (entry.id === model.id ? { ...entry, enabled: checked } : entry)),
                      )
                    }
                  />
                  <ModelListItemRemove
                    aria-label={`Remove ${model.title}`}
                    onClick={() => setModels((current) => current.filter((entry) => entry.id !== model.id))}
                  />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </ModelListContent>
      </ModelList>
    </div>
  );
}

export { ModelListDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/page-container-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { PageContainer } from '@/registry/bases/base-ui/components/layout/page-container';

/** A small, centered content column inside a wider surface. */
function PageContainerDemo(): ReactNode {
  return (
    <div className="bg-muted w-full rounded-lg p-4">
      <PageContainer size="sm" className="bg-background rounded-md border p-6">
        <h3 className="text-base font-semibold">Account settings</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Centered and capped, however wide the surface around it is.
        </p>
      </PageContainer>
    </div>
  );
}

export { PageContainerDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/panel-field-group-demo.tsx`:

```text
import type { ReactNode } from 'react';

import { PanelFieldGroup } from '@/registry/bases/base-ui/components/layout/panel-field-group';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Label } from '@/registry/bases/base-ui/ui/label';

/** A three-column PanelFieldGroup for a position's X, Y and Z. */
function PanelFieldGroupDemo(): ReactNode {
  return (
    <PanelFieldGroup cols={3} className="w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <Label htmlFor="preview-pos-x">X</Label>
        <Input id="preview-pos-x" defaultValue="0" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="preview-pos-y">Y</Label>
        <Input id="preview-pos-y" defaultValue="0" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="preview-pos-z">Z</Label>
        <Input id="preview-pos-z" defaultValue="0" />
      </div>
    </PanelFieldGroup>
  );
}

export { PanelFieldGroupDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/panel-header-demo.tsx`:

```text
import { PanelLeftClose } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderRow,
  PanelHeaderTitle,
} from '@/registry/bases/base-ui/components/layout/panel-header';
import { Button } from '@/registry/bases/base-ui/ui/button';

/** A single-row panel header: a title beside a trailing collapse action. */
function PanelHeaderDemo(): ReactNode {
  return (
    <PanelHeader className="bg-card w-full max-w-sm">
      <PanelHeaderRow>
        <PanelHeaderTitle>Properties</PanelHeaderTitle>
        <PanelHeaderActions>
          <Button variant="ghost" size="icon-sm" aria-label="Collapse panel">
            <PanelLeftClose />
          </Button>
        </PanelHeaderActions>
      </PanelHeaderRow>
    </PanelHeader>
  );
}

export { PanelHeaderDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/reasoning-collapsible-demo.tsx`:

```text
'use client';

import { useState, type ReactNode } from 'react';

import { MarkdownView } from '@/registry/bases/base-ui/components/data-display/markdown-view';
import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
  useReasoningCollapsible,
} from '@/registry/bases/base-ui/components/layout/reasoning-collapsible';
import { Button } from '@/registry/bases/base-ui/ui/button';

const REASONING_TEXT = "Checking the last deploy's logs for the timeout, then narrowing it to the retry policy.";

/** The trigger's label, worded from the live reasoning state. */
function ReasoningLabel(): ReactNode {
  const { streaming, duration } = useReasoningCollapsible();
  return streaming ? 'Thinking...' : `Thought for ${duration ?? 'a few'} seconds`;
}

/** A reasoning disclosure the caller starts and stops streaming. */
function ReasoningCollapsibleDemo(): ReactNode {
  const [streaming, setStreaming] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3">
      <Button size="sm" variant="outline" className="w-fit" onClick={() => setStreaming((current) => !current)}>
        {streaming ? 'Stop stream' : 'Start stream'}
      </Button>
      <ReasoningCollapsible streaming={streaming}>
        <ReasoningCollapsibleTrigger>
          <ReasoningLabel />
        </ReasoningCollapsibleTrigger>
        <ReasoningCollapsibleContent>
          <MarkdownView>{REASONING_TEXT}</MarkdownView>
        </ReasoningCollapsibleContent>
      </ReasoningCollapsible>
    </div>
  );
}

export { ReasoningCollapsibleDemo };
```

`apps/registry-ui/registry/bases/base-ui/examples/tool-call-card-demo.tsx`:

```text
import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { CodeBlock } from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  ToolCallCard,
  ToolCallCardContent,
  ToolCallCardDescription,
  ToolCallCardSection,
  ToolCallCardSectionTitle,
  ToolCallCardStatus,
  ToolCallCardTitle,
  ToolCallCardTrigger,
} from '@/registry/bases/base-ui/components/layout/tool-call-card';

const PARAMETERS = JSON.stringify({ query: 'design system tokens', limit: 5 }, null, 2);

/** A completed search call, its parameters shown under the trigger. */
function ToolCallCardDemo(): ReactNode {
  return (
    <ToolCallCard state="output-available" defaultOpen className="w-full max-w-md">
      <ToolCallCardTrigger>
        <Search />
        <ToolCallCardTitle>search</ToolCallCardTitle>
        <ToolCallCardDescription>5 results</ToolCallCardDescription>
        <ToolCallCardStatus>Completed</ToolCallCardStatus>
      </ToolCallCardTrigger>
      <ToolCallCardContent>
        <ToolCallCardSection>
          <ToolCallCardSectionTitle>Parameters</ToolCallCardSectionTitle>
          <CodeBlock code={PARAMETERS} language="json" />
        </ToolCallCardSection>
      </ToolCallCardContent>
    </ToolCallCard>
  );
}

export { ToolCallCardDemo };
```

- [ ] **Step 3: Publish the five component items**

In `apps/registry-ui/registry.json`, insert `model-list` and `page-container` after `frontmatter-form` and
before `panel-field-group`:

```text
    {
      "name": "model-list",
      "type": "registry:component",
      "title": "Model List",
      "description": "The frame for a model list section: a header over a scrolling content area that dims any item marked unavailable.",
      "categories": ["layout"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/button", "@shadcn/skeleton", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/model-list.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "page-container",
      "type": "registry:component",
      "title": "Page Container",
      "description": "The centred, max-width content column of a full-width surface, sized from a named max-width scale.",
      "categories": ["layout"],
      "dependencies": ["class-variance-authority"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/page-container.tsx",
          "type": "registry:component"
        }
      ]
    },
```

Insert `panel-header` after `panel-field-group` and before `panel-row`:

```text
    {
      "name": "panel-header",
      "type": "registry:component",
      "title": "Panel Header",
      "description": "The top strip of a side panel: one or more rows of a title and trailing actions over a bottom border.",
      "categories": ["layout"],
      "registryDependencies": ["@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/panel-header.tsx",
          "type": "registry:component"
        }
      ]
    },
```

Insert `reasoning-collapsible` and `tool-call-card` after `panel-row` and before `command-menu`:

```text
    {
      "name": "reasoning-collapsible",
      "type": "registry:component",
      "title": "Reasoning Collapsible",
      "description": "A thinking disclosure that opens itself while a reasoning stream is live and closes shortly after the stream ends.",
      "categories": ["layout"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/collapsible", "@shadcn/utils"],
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/reasoning-collapsible.tsx",
          "type": "registry:component"
        }
      ]
    },
    {
      "name": "tool-call-card",
      "type": "registry:component",
      "title": "Tool Call Card",
      "description": "One tool invocation in a chat transcript: a trigger row over collapsible sections, whose status badge follows the call's lifecycle state.",
      "categories": ["layout"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/badge", "@shadcn/collapsible", "@shadcn/utils"],
      "cssVars": {
        "theme": {
          "color-success": "var(--success)"
        },
        "light": {
          "success": "oklch(0.627 0.19 149)"
        },
        "dark": {
          "success": "oklch(0.723 0.19 149)"
        }
      },
      "files": [
        {
          "path": "registry/bases/base-ui/components/layout/tool-call-card.tsx",
          "type": "registry:component"
        }
      ]
    },
```

(`tool-call-card` carries only `success`: its one house-token class is
`text-success ... group-data-[state=output-available]/tool-call-card:block` on the status
icon; nothing in the file uses `warning`.)

- [ ] **Step 4: Publish the six demos**

In `apps/registry-ui/registry.json`, insert `model-list-demo`, `page-container-demo`,
`panel-field-group-demo` and `panel-header-demo` after `frontmatter-form-demo` and before
`panel-row-demo`:

```text
    {
      "name": "model-list-demo",
      "type": "registry:example",
      "title": "Model List Demo",
      "description": "A model list of three providers, one dimmed as unavailable, each toggleable and removable.",
      "categories": ["examples"],
      "dependencies": ["@zeroxsolutions/icons"],
      "registryDependencies": ["@shadcn/item", "@shadcn/switch", "https://ui.zeroxsolutions.com/r/model-list.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/model-list-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "page-container-demo",
      "type": "registry:example",
      "title": "Page Container Demo",
      "description": "A small, centered content column inside a wider surface.",
      "categories": ["examples"],
      "registryDependencies": ["https://ui.zeroxsolutions.com/r/page-container.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/page-container-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "panel-field-group-demo",
      "type": "registry:example",
      "title": "Panel Field Group Demo",
      "description": "A three-column PanelFieldGroup for a position's X, Y and Z.",
      "categories": ["examples"],
      "registryDependencies": [
        "@shadcn/input",
        "@shadcn/label",
        "https://ui.zeroxsolutions.com/r/panel-field-group.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/panel-field-group-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "panel-header-demo",
      "type": "registry:example",
      "title": "Panel Header Demo",
      "description": "A single-row panel header: a title beside a trailing collapse action.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": ["@shadcn/button", "https://ui.zeroxsolutions.com/r/panel-header.json"],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/panel-header-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
```

Insert `reasoning-collapsible-demo` and `tool-call-card-demo` after `panel-row-demo` and before
`command-menu-demo`:

```text
    {
      "name": "reasoning-collapsible-demo",
      "type": "registry:example",
      "title": "Reasoning Collapsible Demo",
      "description": "A reasoning disclosure the caller starts and stops streaming, its body a rendered Markdown note.",
      "categories": ["examples"],
      "registryDependencies": [
        "@shadcn/button",
        "https://ui.zeroxsolutions.com/r/markdown-view.json",
        "https://ui.zeroxsolutions.com/r/reasoning-collapsible.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/reasoning-collapsible-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
    {
      "name": "tool-call-card-demo",
      "type": "registry:example",
      "title": "Tool Call Card Demo",
      "description": "A completed search call, its parameters shown under the trigger.",
      "categories": ["examples"],
      "dependencies": ["lucide-react"],
      "registryDependencies": [
        "https://ui.zeroxsolutions.com/r/code-block.json",
        "https://ui.zeroxsolutions.com/r/tool-call-card.json"
      ],
      "files": [
        {
          "path": "registry/bases/base-ui/examples/tool-call-card-demo.tsx",
          "type": "registry:example"
        }
      ]
    },
```

- [ ] **Step 5: Run both registry specs, the suite, the type check, lint, format and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t8.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t8.log"; grep -c 'not wrapped in act' "$S/vt-t8.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t8.log" 2>&1; grep 'error TS' "$S/tsc-t8.log" | cut -c1-80
pnpm exec eslint $E/model-list-demo.tsx $E/page-container-demo.tsx $E/panel-field-group-demo.tsx $E/panel-header-demo.tsx $E/reasoning-collapsible-demo.tsx $E/tool-call-card-demo.tsx $E/examples.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check $E/model-list-demo.tsx $E/page-container-demo.tsx $E/panel-field-group-demo.tsx $E/panel-header-demo.tsx $E/reasoning-collapsible-demo.tsx $E/tool-call-card-demo.tsx $E/examples.spec.tsx registry.json 2>&1 | tail -1
rm -rf "$S/r-t8"; pnpm exec shadcn build -o "$S/r-t8" > "$S/sb-t8.log" 2>&1; tail -1 "$S/sb-t8.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (54 tests)
 Test Files  2 passed (2)
      Tests  68 passed (68)
 Test Files  79 passed (79)
      Tests  506 passed (506)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(eslint prints no problem line; the act count is 0 with `tool-call-card-demo` mounting a live `CodeBlock`. 500 after Task 7 + 6 new row cases = 506; 79 files, since no spec file is added. 86 items: 75 + 5 components + 6 demos, every family now published.)

- [ ] **Step 6: Commit**

`$S/msg-t8.txt`:

```
feat(registry-ui): publish the remaining layout families

Why: model-list, page-container, panel-header, reasoning-collapsible
and tool-call-card had no registry item and no demo, so a consumer
could not shadcn add them. Each is now named and described from its
current file and placed in the layout group; tool-call-card carries
cssVars for the success token its status icon paints with, and its
demo composes CodeBlock as its doc comment shows. panel-field-group,
published without a demo, gets one here too.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
E=apps/registry-ui/registry/bases/base-ui/examples
git add $E/model-list-demo.tsx $E/page-container-demo.tsx $E/panel-field-group-demo.tsx $E/panel-header-demo.tsx $E/reasoning-collapsible-demo.tsx $E/tool-call-card-demo.tsx
git commit -q -F "$S/msg-t8.txt" -- $E apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 9: Docs-only demos for the compositions that replaced removed components

Spec (b) Examples, "Docs only" table. `ConfirmButton`, `PopoverIconButton`, `ToolbarButton`,
`SearchInput`, `BinaryFileCard`, `SidebarGroupCollapsible`, `SidebarMenuCollapsible` and
`Section` were removed because each only re-assembled parts upstream already publishes (spec
2026-09-28, "Removed components"); the consumer now composes those parts directly, and each
page that used to document the removed wrapper needs a demo of that composition instead. None
of the eight is a registry item - the registry publishes composed items only - so each is a
file in `examples/` that no `registry.json` entry names, and `registry.json` is untouched by
this task. Each composes exactly the parts its row of the removed-components table names, plus
whatever structural parts (a dialog's `Content`, a tooltip's own `Content`) that composition
cannot render without. The two `Sidebar*Collapsible` demos follow upstream's own Sidebar
composition, fetched from the `shadcn-ui/ui` repo's `base` variant (URLs and read date in the
doc comment of each file). `ConfirmButton`
never closed its dialog after `onConfirm` (`confirm-button.tsx:77-80`, deleted in
`4489137`, since `AlertDialogAction` is a plain `Button`); `alert-dialog-confirm` fixes this by
owning its own `open` state and closing it from `AlertDialogAction`'s `onClick`, and a named
case in `examples.spec.tsx` proves it.

**Files:**

- Modify: `examples/examples.spec.tsx`
- Create: `examples/alert-dialog-confirm.tsx`, `examples/popover-icon-trigger.tsx`,
  `examples/toggle-toolbar.tsx`, `examples/input-group-search.tsx`, `examples/empty-file.tsx`,
  `examples/sidebar-group-collapsible.tsx`, `examples/sidebar-menu-collapsible.tsx`,
  `examples/collapsible-card-section.tsx`

**Interfaces:**

- Consumes: the Task 8 tree (86 items: 42 `registry:component`, 1 block, 43
  `registry:example`); the already-refactored `ui/alert-dialog.tsx`, `ui/popover.tsx`,
  `ui/tooltip.tsx`, `ui/toggle.tsx`, `ui/kbd.tsx`, `ui/input-group.tsx`, `ui/empty.tsx`,
  `ui/sidebar.tsx`, `ui/collapsible.tsx`, `ui/badge.tsx`, `ui/button.tsx`; the
  `components/layout/collapsible-card.tsx` family (an item since Task 6).
- Produces:
  - from `examples/<file>`: `AlertDialogConfirm`, `PopoverIconTrigger`, `ToggleToolbar`,
    `InputGroupSearch`, `EmptyFile`, `SidebarGroupCollapsible`, `SidebarMenuCollapsible`,
    `CollapsibleCardSection`, each `(): ReactNode`
  - `examples/examples.spec.tsx`: eight new `EXPECTED_SLOT` rows, a `window.matchMedia` stub in
    `beforeAll` (the two sidebar demos mount `SidebarProvider`, whose `useIsMobile` hook calls
    `window.matchMedia`, unimplemented in jsdom), and one named case proving
    `alert-dialog-confirm` closes after confirming
  - registry items: none. `registry.json` is unchanged (still 86 items).
- Removed: nothing.

All paths below are relative to `apps/registry-ui/registry/bases/base-ui/` unless they start
with `apps/`.

- [ ] **Step 1: Add the eight rows and watch them fail**

In `apps/registry-ui/registry/bases/base-ui/examples/examples.spec.tsx`, add these rows to `EXPECTED_SLOT`, each at its place in key order (the table stays alphabetical):

```text
  'alert-dialog-confirm': 'alert-dialog-trigger',
  'collapsible-card-section': 'collapsible-card',
  'empty-file': 'empty',
  'input-group-search': 'input-group',
  'popover-icon-trigger': 'tooltip-trigger',
  'sidebar-group-collapsible': 'collapsible',
  'sidebar-menu-collapsible': 'collapsible',
  'toggle-toolbar': 'tooltip-trigger',
```

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples/examples.spec.tsx 2>&1 | grep -E '^ +×|AssertionError|^-   "|Test Files|^ +Tests'`
Expected:

```
     × has a row for every example file and a file for every row
AssertionError: expected [ 'ai-provider-card-demo', …(50) ] to deeply equal [ 'ai-provider-card-demo', …(58) ]
-   "alert-dialog-confirm",
-   "collapsible-card-section",
-   "empty-file",
-   "input-group-search",
-   "popover-icon-trigger",
-   "sidebar-group-collapsible",
-   "sidebar-menu-collapsible",
-   "toggle-toolbar",
 Test Files  1 failed (1)
      Tests  1 failed | 53 passed (54)
```

- [ ] **Step 2: Write the eight demos**

`apps/registry-ui/registry/bases/base-ui/examples/alert-dialog-confirm.tsx`:

```text
'use client';

import { useState, type ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/registry/bases/base-ui/ui/alert-dialog';
import { Button } from '@/registry/bases/base-ui/ui/button';

/**
 * A destructive action gated behind an AlertDialog confirm, composed from
 * upstream parts. AlertDialogAction is a plain Button, so the caller closes
 * the dialog itself once the confirmed action runs.
 */
function AlertDialogConfirm(): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>Delete project</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>This removes every file in it. The action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => setOpen(false)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { AlertDialogConfirm };
```

`apps/registry-ui/registry/bases/base-ui/examples/popover-icon-trigger.tsx`:

```text
import { SlidersHorizontalIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/**
 * A ghost icon button whose tooltip describes the popover it opens, composed
 * from upstream parts: Popover wraps Tooltip so the TooltipTrigger's render
 * chain (PopoverTrigger, then Button) labels the trigger without stealing its
 * click.
 */
function PopoverIconTrigger(): ReactNode {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={<PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="Display settings" />} />}
        >
          <SlidersHorizontalIcon />
        </TooltipTrigger>
        <TooltipContent>Display settings</TooltipContent>
      </Tooltip>
      <PopoverContent align="end">
        <p className="text-muted-foreground text-sm">Adjust font size, line height and theme.</p>
      </PopoverContent>
    </Popover>
  );
}

export { PopoverIconTrigger };
```

`apps/registry-ui/registry/bases/base-ui/examples/toggle-toolbar.tsx`:

```text
import { BoldIcon, ItalicIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Kbd } from '@/registry/bases/base-ui/ui/kbd';
import { Toggle } from '@/registry/bases/base-ui/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';

/**
 * An editor toolbar's active/inactive controls, composed from upstream parts:
 * a real Toggle carries `aria-pressed`, and its Tooltip surfaces the shortcut
 * as a Kbd chip.
 */
function ToggleToolbar(): ReactNode {
  return (
    <div role="toolbar" aria-label="Text formatting" className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger render={<Toggle aria-label="Bold" defaultPressed />}>
          <BoldIcon />
        </TooltipTrigger>
        <TooltipContent>
          Bold <Kbd>B</Kbd>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Toggle aria-label="Italic" />}>
          <ItalicIcon />
        </TooltipTrigger>
        <TooltipContent>
          Italic <Kbd>I</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export { ToggleToolbar };
```

`apps/registry-ui/registry/bases/base-ui/examples/input-group-search.tsx`:

```text
import { SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/registry/bases/base-ui/ui/input-group';

/** A search field: a leading magnifier addon beside the control, composed from upstream parts. */
function InputGroupSearch(): ReactNode {
  return (
    <InputGroup className="w-64">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput type="search" placeholder="Search files" />
    </InputGroup>
  );
}

export { InputGroupSearch };
```

`apps/registry-ui/registry/bases/base-ui/examples/empty-file.tsx`:

```text
import { FileIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

/** A fallback for a file with no inline viewer: an icon and its name, composed from upstream parts. */
function EmptyFile(): ReactNode {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileIcon />
        </EmptyMedia>
        <EmptyTitle>invoice.pdf</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export { EmptyFile };
```

`apps/registry-ui/registry/bases/base-ui/examples/sidebar-group-collapsible.tsx`:

```text
import { ChevronDownIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarProvider,
} from '@/registry/bases/base-ui/ui/sidebar';

/**
 * A collapsible group in a sidebar, as upstream's own Sidebar docs compose it:
 * https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/base/sidebar.mdx
 * ("SidebarGroup" section, base variant, read 2026-09-29).
 */
function SidebarGroupCollapsible(): ReactNode {
  return (
    <SidebarProvider>
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel render={<CollapsibleTrigger />}>
            Help
            <ChevronDownIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <p className="text-muted-foreground px-2 text-sm">Docs, changelog and support.</p>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </SidebarProvider>
  );
}

export { SidebarGroupCollapsible };
```

`apps/registry-ui/registry/bases/base-ui/examples/sidebar-menu-collapsible.tsx`:

```text
import { ChevronRightIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from '@/registry/bases/base-ui/ui/sidebar';

/**
 * A collapsible section inside a sidebar menu, as upstream's own Sidebar docs
 * compose it:
 * https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/blocks/sidebar-07/components/nav-main.tsx
 * (`nav-main.tsx`, base variant, read 2026-09-29). The `tooltip` prop `nav-main`
 * passes to `SidebarMenuButton` is specific to that block's icon-collapsed
 * sidebar and is left out here.
 */
function SidebarMenuCollapsible(): ReactNode {
  return (
    <SidebarProvider>
      <SidebarMenu>
        <Collapsible defaultOpen className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger render={<SidebarMenuButton />}>
            <span>Topics</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#">Getting started</SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#">Installation</SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarProvider>
  );
}

export { SidebarMenuCollapsible };
```

`apps/registry-ui/registry/bases/base-ui/examples/collapsible-card-section.tsx`:

```text
import type { ReactNode } from 'react';

import {
  CollapsibleCard,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { Badge } from '@/registry/bases/base-ui/ui/badge';

/**
 * A titled, collapsible group of rows in a panel: `CollapsibleCard`'s `plain`
 * variant, its row count carried by a Badge instead of a baked-in `count` prop.
 */
function CollapsibleCardSection(): ReactNode {
  return (
    <CollapsibleCard variant="plain">
      <CollapsibleCardHeader>
        <CollapsibleCardTrigger />
        <CollapsibleCardTitle>
          Environment variables
          <Badge variant="secondary">3</Badge>
        </CollapsibleCardTitle>
      </CollapsibleCardHeader>
      <CollapsibleCardContent>
        <div className="flex flex-col gap-2 px-2.5 pb-2.5 text-sm">
          <div>API_URL</div>
          <div>NODE_ENV</div>
          <div>LOG_LEVEL</div>
        </div>
      </CollapsibleCardContent>
    </CollapsibleCard>
  );
}

export { CollapsibleCardSection };
```

- [ ] **Step 3: Wire the spec: the matchMedia stub the sidebar demos need, and the case proving alert-dialog-confirm closes after confirming**

`SidebarProvider` (`ui/sidebar.tsx`) calls `useIsMobile`, which calls `window.matchMedia` -
unimplemented in jsdom, so both sidebar demos throw on render without a stub beside the other
jsdom shims already in `beforeAll`.

```diff
   globalThis.ResizeObserver ??= class {
     observe() {}
     unobserve() {}
     disconnect() {}
   } as unknown as typeof ResizeObserver;
+  window.matchMedia ??= () =>
+    ({
+      matches: false,
+      addEventListener: () => {},
+      removeEventListener: () => {},
+    }) as unknown as MediaQueryList;
 });
```

```diff
-import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
+import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
```

```diff
 });

+import { AlertDialogConfirm } from './alert-dialog-confirm';
 import { ButtonGroupMenu } from './button-group-menu';
 import { ButtonGroupSplit } from './button-group-split';
```

```diff
+  it('alert-dialog-confirm closes the dialog after confirming', async () => {
+    render(<AlertDialogConfirm />);
+    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }));
+    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
+    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
+  });
+
   it('button-group-split opens its related actions from the caret', async () => {
```

(`AlertDialogContent` renders `role="alertdialog"` - Base UI's own `alert-dialog/handle.js` -
and unmounts when closed, so `queryByRole('alertdialog')` returning `null` after the click is
the dialog actually gone, not merely hidden.)

- [ ] **Step 4: Run both registry specs, the suite, the type check, lint, format and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t9.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t9.log"; grep -c 'not wrapped in act' "$S/vt-t9.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t9.log" 2>&1; grep 'error TS' "$S/tsc-t9.log" | cut -c1-80
pnpm exec eslint $E/alert-dialog-confirm.tsx $E/collapsible-card-section.tsx $E/empty-file.tsx $E/input-group-search.tsx $E/popover-icon-trigger.tsx $E/sidebar-group-collapsible.tsx $E/sidebar-menu-collapsible.tsx $E/toggle-toolbar.tsx $E/examples.spec.tsx 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check $E/alert-dialog-confirm.tsx $E/collapsible-card-section.tsx $E/empty-file.tsx $E/input-group-search.tsx $E/popover-icon-trigger.tsx $E/sidebar-group-collapsible.tsx $E/sidebar-menu-collapsible.tsx $E/toggle-toolbar.tsx $E/examples.spec.tsx 2>&1 | tail -1
rm -rf "$S/r-t9"; pnpm exec shadcn build -o "$S/r-t9" > "$S/sb-t9.log" 2>&1; tail -1 "$S/sb-t9.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (14 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (63 tests)
 Test Files  2 passed (2)
      Tests  77 passed (77)
 Test Files  79 passed (79)
      Tests  515 passed (515)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(eslint prints no problem line. 506 after Task 8 + 8 new row cases + the `alert-dialog-confirm` case = 515; 79 files. `registry.json` is untouched, so `shadcn` still reads 86 items.)

- [ ] **Step 5: Commit**

`$S/msg-t9.txt`:

```
feat(registry-ui): add docs-only demos for the compositions that replaced removed components

Why: ConfirmButton, PopoverIconButton, ToolbarButton, SearchInput,
BinaryFileCard, SidebarGroupCollapsible, SidebarMenuCollapsible and
Section were removed because each only re-assembled upstream parts;
their pages need a demo of that composition, but none of them is a
registry item (the registry publishes composed items only), so each
is a docs-only example instead. ConfirmButton never closed its dialog
after onConfirm; alert-dialog-confirm fixes that by closing its own
`open` state from AlertDialogAction, and a named case proves it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
E=apps/registry-ui/registry/bases/base-ui/examples
git add $E/alert-dialog-confirm.tsx $E/popover-icon-trigger.tsx $E/toggle-toolbar.tsx $E/input-group-search.tsx $E/empty-file.tsx $E/sidebar-group-collapsible.tsx $E/sidebar-menu-collapsible.tsx $E/collapsible-card-section.tsx
git commit -q -F "$S/msg-t9.txt" -- $E
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 10: Hold every family to one item and every item to one demo

Spec (b) rules 1 and 2, the last two of the four `registry/registry.spec.ts` holds. Tasks 1 and 3 to 8
published all 42 families and the block, each with its `<name>-demo`, and Task 9 added the docs-only demos that no
item names; nothing yet fails when a family file is added without an item, an item is named or
categorised off its file, an item has no demo or two, or an example is published that demonstrates no
item. Rule 1 reads the family files from the tree - every `.tsx` under a kind folder of `components/`
(the `docs/` pages aside, and specs left out) and under `blocks/` - and requires each to be the first file
of exactly one `registry:component` or `registry:block` item, and each such item's first file to be one,
with `name` its basename and `categories` its kind folder (`blocks` for a block). Rule 2 requires each
such item to have exactly one `registry:example` named `<name>-demo`, and every `registry:example` to be
one of those. Both are pure functions over the parsed items (rule 1 also takes the family list), each
with one deliberately wrong fragment per report it can make, over two fixtures the earlier cases already
declare (`tree-item`, `ai-provider-picker`). With every item published, the two real-registry cases pass
on the first run; `CLAUDE.md`'s registry line and the spec's text are brought to what shipped.

**Files:**

- Modify: `apps/registry-ui/registry/registry.spec.ts`, `CLAUDE.md`,
  `docs/superpowers/specs/2026-09-29-registry-items-design.md`

**Interfaces:**

- Consumes: the Task 9 tree (86 items: 42 `registry:component`, 1 block, 43 `registry:example`; 63
  cases in `examples.spec.tsx`, 14 in `registry.spec.ts`).
- Produces, module-local in `apps/registry-ui/registry/registry.spec.ts`:
  - `RegistryItem` gains `categories?: string[]`
  - constants `FAMILY` (a family path: kind folder or `blocks`, then basename) and `PUBLISHED`
    (`['registry:component', 'registry:block']`)
  - `familyFiles(): string[]` - the app-relative family files in the tree, sorted
  - `familyProblems(items: RegistryItem[], families: string[]): string[]` -
    `<file>: is the first file of no item`, `<file>: is the first file of <a> and <b>`,
    `<item>: first file <path> is not a family file`, `<item>: name should be <basename>`,
    `<item>: categories should be <JSON>`
  - `demoProblems(items: RegistryItem[]): string[]` - `<item>: has no <item>-demo example`,
    `<item>: has <n> <item>-demo examples`, `<example>: is the demo of no item`
  - fixtures `FAMILIES`, `familyItems`, `treeItemDemo`, `aiProviderPickerDemo`
- Removed: nothing.

All paths below are relative to `apps/registry-ui/` unless they start with `apps/`, `docs/` or are
`CLAUDE.md`.

- [ ] **Step 1: Write the failing cases**

In `registry/registry.spec.ts`, give `RegistryItem` its `categories`:

```diff
 interface RegistryItem {
   name: string;
   type: string;
+  categories?: string[];
   dependencies?: string[];
```

Add the two real-registry cases at the end of `describe('registry.json', ...)`:

```diff
   it('carries the success and warning tokens an item paints with, and no others', () => {
     expect(REGISTRY.items.flatMap(cssVarsProblems)).toEqual([]);
   });
+
+  it('publishes each family file as one item named and categorised after it', () => {
+    expect(familyProblems(REGISTRY.items, familyFiles())).toEqual([]);
+  });
+
+  it('publishes one demo per item and no other example', () => {
+    expect(demoProblems(REGISTRY.items)).toEqual([]);
+  });
 });
```

And append, after `describe('cssVarsProblems', ...)` at the end of the file:

```text
const FAMILIES = [`${BASE}/blocks/ai-provider-picker.tsx`, `${BASE}/components/data-entry/tree-item.tsx`];

const familyItems: RegistryItem[] = [
  { ...treeItem, categories: ['data-entry'] },
  { ...aiProviderPicker, categories: ['blocks'] },
];

const treeItemDemo: RegistryItem = {
  name: 'tree-item-demo',
  type: 'registry:example',
  files: [{ path: `${BASE}/examples/tree-item-demo.tsx`, type: 'registry:example' }],
};

const aiProviderPickerDemo: RegistryItem = {
  name: 'ai-provider-picker-demo',
  type: 'registry:example',
  files: [{ path: `${BASE}/examples/ai-provider-picker-demo.tsx`, type: 'registry:example' }],
};

describe('familyProblems', () => {
  it('reports nothing for items named and categorised after their family files', () => {
    expect(familyProblems([...familyItems, treeItemDemo], FAMILIES)).toEqual([]);
  });

  it('reports a family file no item publishes', () => {
    expect(familyProblems(familyItems.slice(1), FAMILIES)).toEqual([
      'registry/bases/base-ui/components/data-entry/tree-item.tsx: is the first file of no item',
    ]);
  });

  it('reports a family file two items publish', () => {
    const twin = { ...familyItems[0], name: 'tree-row' };
    expect(familyProblems([...familyItems, twin], FAMILIES)).toEqual([
      'registry/bases/base-ui/components/data-entry/tree-item.tsx: is the first file of tree-item and tree-row',
      'tree-row: name should be tree-item',
    ]);
  });

  it('reports an item whose first file is not a family file', () => {
    const item = {
      name: 'ime',
      type: 'registry:component',
      categories: ['data-entry'],
      files: [{ path: `${BASE}/lib/ime.ts`, type: 'registry:lib' }],
    };
    expect(familyProblems([...familyItems, item], FAMILIES)).toEqual([
      'ime: first file registry/bases/base-ui/lib/ime.ts is not a family file',
    ]);
  });

  it('reports an item not named after its family file', () => {
    expect(familyProblems([{ ...familyItems[0], name: 'tree-row' }, familyItems[1]], FAMILIES)).toEqual([
      'tree-row: name should be tree-item',
    ]);
  });

  it('reports an item not categorised under its kind folder', () => {
    expect(familyProblems([{ ...familyItems[0], categories: ['data-display'] }, familyItems[1]], FAMILIES)).toEqual([
      'tree-item: categories should be ["data-entry"]',
    ]);
  });
});

describe('demoProblems', () => {
  it('reports nothing when each item has one demo and each example is a demo', () => {
    expect(demoProblems([...familyItems, treeItemDemo, aiProviderPickerDemo])).toEqual([]);
  });

  it('reports an item with no demo', () => {
    expect(demoProblems([...familyItems, treeItemDemo])).toEqual([
      'ai-provider-picker: has no ai-provider-picker-demo example',
    ]);
  });

  it('reports an item with two demos', () => {
    expect(demoProblems([...familyItems, treeItemDemo, treeItemDemo, aiProviderPickerDemo])).toEqual([
      'tree-item: has 2 tree-item-demo examples',
    ]);
  });

  it('reports an example that is the demo of no item', () => {
    const example = {
      name: 'button-demo',
      type: 'registry:example',
      files: [{ path: `${BASE}/examples/button-demo.tsx`, type: 'registry:example' }],
    };
    expect(demoProblems([...familyItems, treeItemDemo, aiProviderPickerDemo, example])).toEqual([
      'button-demo: is the demo of no item',
    ]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/registry.spec.ts > "$S/red-t10.log" 2>&1; grep -E 'ReferenceError|Test Files|^ +Tests' "$S/red-t10.log" | sort | uniq -c`
Expected:

```
   1       Tests  12 failed | 14 passed (26)
   1  Test Files  1 failed (1)
   5 ReferenceError: demoProblems is not defined
   7 ReferenceError: familyProblems is not defined
```

(Twelve new cases, all failing on the missing functions; the 14 cases of Task 1 still pass.)

- [ ] **Step 3: Add the two rules**

In `registry/registry.spec.ts`, import `readdirSync`:

```diff
-import { existsSync, readFileSync } from 'node:fs';
+import { existsSync, readdirSync, readFileSync } from 'node:fs';
```

Add the two constants after `TOKEN_CLASS`:

```diff
 const TOKEN_CLASS = /\b(?:bg|text|border|ring|fill|stroke)-(success|warning)(?![\w-])/g;
+const FAMILY = /^registry\/bases\/base-ui\/(?:components\/([^/]+)|(blocks))\/([^/]+)\.tsx$/;
+const PUBLISHED = ['registry:component', 'registry:block'];
```

And insert, after `cssVarsProblems` and before `describe('registry.json', () => {`:

```text
/** Every family file: a component under a kind folder (the docs pages aside) or a block, specs left out. */
function familyFiles(): string[] {
  return ['components', 'blocks']
    .flatMap((dir) =>
      readdirSync(join(APP, BASE, dir), { recursive: true, encoding: 'utf8' }).map((path) => `${BASE}/${dir}/${path}`),
    )
    .filter((path) => FAMILY.test(path) && !path.endsWith('.spec.tsx') && !path.startsWith(`${BASE}/components/docs/`))
    .sort();
}

/** Each family file is the first file of exactly one component or block item, which takes its name and kind folder. */
function familyProblems(items: RegistryItem[], families: string[]): string[] {
  const published = items.filter((item) => PUBLISHED.includes(item.type));
  const unowned = families.flatMap((family) => {
    const owners = published.filter((item) => item.files[0]?.path === family).map((item) => item.name);
    if (owners.length === 0) return [`${family}: is the first file of no item`];
    return owners.length === 1 ? [] : [`${family}: is the first file of ${owners.join(' and ')}`];
  });
  const misnamed = published.flatMap((item) => {
    const path = item.files[0]?.path ?? '';
    const match = families.includes(path) ? FAMILY.exec(path) : null;
    if (match === null) return [`${item.name}: first file ${path} is not a family file`];
    const [, kind, blocks, name] = match;
    const categories = [kind ?? blocks];
    return [
      ...(item.name === name ? [] : [`${item.name}: name should be ${name}`]),
      ...(isDeepStrictEqual(item.categories, categories)
        ? []
        : [`${item.name}: categories should be ${JSON.stringify(categories)}`]),
    ];
  });
  return [...unowned, ...misnamed];
}

/** Each component or block item has exactly one `<name>-demo` example, and every example is one of those. */
function demoProblems(items: RegistryItem[]): string[] {
  const names = items.filter((item) => PUBLISHED.includes(item.type)).map((item) => item.name);
  const examples = items.filter((item) => item.type === 'registry:example').map((item) => item.name);
  return [
    ...names.flatMap((name) => {
      const count = examples.filter((example) => example === `${name}-demo`).length;
      if (count === 0) return [`${name}: has no ${name}-demo example`];
      return count === 1 ? [] : [`${name}: has ${count} ${name}-demo examples`];
    }),
    ...examples
      .filter((example) => !names.some((name) => example === `${name}-demo`))
      .map((example) => `${example}: is the demo of no item`),
  ];
}
```

- [ ] **Step 4: Run it: every case passes**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/registry.spec.ts 2>&1 | grep -E '×|Test Files|^ +Tests'`
Expected:

```
 Test Files  1 passed (1)
      Tests  26 passed (26)
```

(The real-registry cases are live. Rehearsed with the `center` and `tag-input-demo` items deleted from
`registry.json`, three real-registry cases went red: rule 3 on `center-demo`'s import, rule 1 with
`registry/bases/base-ui/components/layout/center.tsx: is the first file of no item`, rule 2 with
`tag-input: has no tag-input-demo example` and `center-demo: is the demo of no item`.)

- [ ] **Step 5: Bring CLAUDE.md and the spec to what shipped**

`CLAUDE.md`, in the first choice (the item count; "which does not resolve yet" stays):

```diff
-  (registry name `zeroxsolutions-ui`, 22 items: 7 `registry:component`, 13 `registry:example`,
-  1 block, 1 page) at `https://ui.zeroxsolutions.com`, **which does not resolve yet**. Style
+  (registry name `zeroxsolutions-ui`, 86 items: 42 `registry:component`, 1 `registry:block`,
+  43 `registry:example`) at `https://ui.zeroxsolutions.com`, **which does not resolve yet**. Style
```

(The hook's `nx format:write` leaves `CLAUDE.md` alone, and it was not Prettier-clean on master - its
tables are unaligned - so only these two lines change.)

`docs/superpowers/specs/2026-09-29-registry-items-design.md`: the family files exclude the `docs/` pages,
`dependencies` drop `react-dom` and type-only imports as rule 3 does, a demo declares by the same rule as
an item (Task 5's `command-menu-demo` ships a hook, Task 8's `tool-call-card-demo` names another item),
the row check asserts a slot the demo actually renders, rule 1 names the `blocks` category, and the
scope lists the `CLAUDE.md` count:

```diff
 ## Scope

 In: `registry.json`, `examples/`, `pages/demo-page.tsx`, the import of an example in
-`src/app/page.tsx`, and the new `registry.spec.ts` and `examples/examples.spec.tsx`.
+`src/app/page.tsx`, the new `registry.spec.ts` and `examples/examples.spec.tsx`, and the item
+count in `CLAUDE.md`.

 Out: the MDX pages, `meta.json`, sidebar, table of contents, pager, header and footer, and the
 choice to build them on `fumadocs-mdx` and `fumadocs-core` as upstream's `apps/v4` does (spec
```

```diff

 ## Items

-One `registry:component` item per family file under `components/`, 42 of them, and one
-`registry:block`, `ai-provider-picker`.
+One `registry:component` item per family file under `components/` (the `docs/` pages aside),
+42 of them, and one `registry:block`, `ai-provider-picker`.

 | Field                  | Value                                                                                                                                                                                                |
 | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
```

```diff
 | `categories`           | the kind folder: `data-display`, `data-entry`, `feedback`, `general`, `layout`, `navigation`; `blocks` for the block                                                                                 |
 | `files`                | the family file (`registry:component`, or `registry:block`), then every `lib/`, `hooks/` and `types/` file it imports, transitively, as `registry:lib` or `registry:hook`, without `target`          |
 | `registryDependencies` | `@shadcn/<x>` for each `ui/<x>` imported, `@shadcn/utils` for `cn`, `https://ui.zeroxsolutions.com/r/<name>.json` for another item, `https://lucide-animated.com/r/<icon>.json` for an animated icon |
-| `dependencies`         | each npm package imported, other than `react`                                                                                                                                                        |
+| `dependencies`         | each npm package imported at runtime, other than `react` and `react-dom`                                                                                                                             |
 | `cssVars`              | only on an item whose files paint with a house token (below)                                                                                                                                         |

 Renamed items: `status-dot` is `status-indicator`, `field-grid` is `panel-field-group`,
```

```diff
 `<name>-<variant>.tsx`.

 **Published.** Each item has exactly one `examples/<name>-demo.tsx`, published as the
-`registry:example` item `<name>-demo`, whose `registryDependencies` name the item's URL plus
-each upstream part the demo composes. The demo is the preview at the top of the item's page.
+`registry:example` item `<name>-demo` and declared by the same rule as an item: its
+`registryDependencies` name the item's URL plus each other item and upstream part the demo
+composes, its `dependencies` each package it imports, and its `files` any `lib/`, `hooks/` or
+`types/` file it reaches. The demo is the preview at the top of the item's page.
 Existing examples are renamed to it: `chat-message-hero` to `chat-message-demo`, `tree-hero` to
 `tree-item-demo`, `field-group-hero` to `panel-row-demo`, `ai-provider-picker-hero` to
 `ai-provider-picker-demo`. The other 39 are written.
```

```diff

 ## Tests

-`examples/examples.spec.tsx` renders every file in `examples/` once and asserts the
-`data-slot` of the component it demonstrates is in the document. It replaces
+`examples/examples.spec.tsx` renders every file in `examples/` once and asserts a `data-slot`
+of the component it demonstrates is in the document: the root's own where the root renders
+one, else the most specific one the demo puts in the DOM. It replaces
 `split-button-hero.spec.tsx` and `menu-button-hero.spec.tsx`.

 `apps/registry-ui/registry/registry.spec.ts` reads `registry.json` and the source tree and asserts:

-1. every family file under `components/` and `blocks/` is the first file of exactly one item,
-   and every component or block item's first file is one; `name` is the file's basename and
-   `categories` its kind folder;
+1. every family file under `components/` (the `docs/` pages aside) and `blocks/` is the first
+   file of exactly one component or block item, and every such item's first file is one;
+   `name` is the file's basename and `categories` its kind folder, `blocks` for a block;
 2. every component or block item has exactly one `<name>-demo` example, and every
    `registry:example` is some item's demo;
 3. each item's `files`, `registryDependencies` and `dependencies` equal what its files import;
```

- [ ] **Step 6: Run both registry specs, the suite, the type check, lint, prettier and the registry build**

Run (from `apps/registry-ui`):

```bash
E=registry/bases/base-ui/examples
pnpm exec vitest run $E/examples.spec.tsx registry/registry.spec.ts 2>&1 | grep -E '✓ \||Test Files|^ +Tests'
pnpm exec vitest run > "$S/vt-t10.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t10.log"; grep -c 'not wrapped in act' "$S/vt-t10.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t10.log" 2>&1; grep 'error TS' "$S/tsc-t10.log" | cut -c1-80
pnpm exec eslint registry/registry.spec.ts 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)'
pnpm exec prettier --check registry/registry.spec.ts ../../docs/superpowers/specs/2026-09-29-registry-items-design.md 2>&1 | tail -1
rm -rf "$S/r-t10"; pnpm exec shadcn build -o "$S/r-t10" > "$S/sb-t10.log" 2>&1; tail -1 "$S/sb-t10.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected:

```
 ✓ |@zeroxsolutions/registry-ui| registry/registry.spec.ts (26 tests)
 ✓ |@zeroxsolutions/registry-ui| registry/bases/base-ui/examples/examples.spec.tsx (63 tests)
 Test Files  2 passed (2)
      Tests  89 passed (89)
 Test Files  79 passed (79)
      Tests  527 passed (527)
0
registry/bases/base-ui/components/docs/installation.spec.tsx(4,22): error TS6307
All matched files use Prettier code style!
✔ Building registry.
✔ Checked 1 registry file and 86 items.
```

(eslint prints no problem line. 515 after Task 9 + 12 new cases = 527; 79 files. 86 items: 42
`registry:component`, 1 `registry:block`, 43 `registry:example`, the count `CLAUDE.md` now states.)

- [ ] **Step 7: Commit**

`$S/msg-t10.txt`:

```
test(registry-ui): hold each family to one item and each item to one demo

Why: nothing failed when a family file had no item, an item was named
or categorised off its file, an item had no demo or two, or an example
demonstrated no item. The spec now reads the family files from the
tree and reports each of those, with a wrong fragment per report. The
registry line in CLAUDE.md and the spec's text follow what shipped:
86 items, 42 components, 1 block, 43 demos.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
git commit -q -F "$S/msg-t10.txt" -- apps/registry-ui/registry/registry.spec.ts CLAUDE.md docs/superpowers/specs/2026-09-29-registry-items-design.md
git log -1 --format='%h %s'
```

Expected: the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log
shows the subject above.
