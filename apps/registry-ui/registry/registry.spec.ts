// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
  categories?: string[];
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

const FROM_IMPORT = /^\s*(?:import|export)\s+(type\s+)?[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/gm;
const BARE_IMPORT = /^\s*import\s*['"]([^'"]+)['"]/gm;
const DYNAMIC_IMPORT = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
const SHIPPED = /^registry\/bases\/base-ui\/(lib|hooks|types)\//;
const TOKEN_CLASS = /\b(?:bg|text|border|ring|fill|stroke)-(success|warning)(?![\w-])/g;
const FAMILY = /^registry\/bases\/base-ui\/(?:components\/([^/]+)|(blocks))\/([^/]+)\.tsx$/;
const PUBLISHED = ['registry:component', 'registry:block'];

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

/** Every family file: a component under a kind folder or a block, specs left out. */
function familyFiles(): string[] {
  return ['components', 'blocks']
    .flatMap((dir) =>
      readdirSync(join(APP, BASE, dir), { recursive: true, encoding: 'utf8' }).map((path) => `${BASE}/${dir}/${path}`),
    )
    .filter((path) => FAMILY.test(path) && !path.endsWith('.spec.tsx'))
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
  const examples = items.filter((item) => item.type === 'registry:example');
  return [
    ...names.flatMap((name) => {
      const count = examples.filter((example) => example.name === `${name}-demo`).length;
      if (count === 0) return [`${name}: has no ${name}-demo example`];
      return count === 1 ? [] : [`${name}: has ${count} ${name}-demo examples`];
    }),
    ...examples
      .filter((example) => !names.some((name) => example.name === `${name}-demo`))
      .map((example) => `${example.name}: is the demo of no item`),
    ...examples.flatMap((example) => {
      const expected = { path: `${BASE}/examples/${example.name}.tsx`, type: 'registry:example' };
      return isDeepStrictEqual(example.files[0], expected)
        ? []
        : [`${example.name}: files[0] should be ${JSON.stringify(expected)}`];
    }),
  ];
}

describe('registry.json', () => {
  it('declares exactly the files, upstream items and packages each item imports', () => {
    const owners = ownersOf(REGISTRY.items);
    expect(REGISTRY.items.flatMap((item) => declarationProblems(item, owners))).toEqual([]);
  });

  it('carries the success and warning tokens an item paints with, and no others', () => {
    expect(REGISTRY.items.flatMap(cssVarsProblems)).toEqual([]);
  });

  it('publishes each family file as one item named and categorised after it', () => {
    expect(familyProblems(REGISTRY.items, familyFiles())).toEqual([]);
  });

  it('publishes one demo per item and no other example', () => {
    expect(demoProblems(REGISTRY.items)).toEqual([]);
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

  it('reports a demo whose files[0] names another file', () => {
    const wrongFile = {
      ...treeItemDemo,
      files: [{ path: `${BASE}/examples/button-demo.tsx`, type: 'registry:example' }],
    };
    expect(demoProblems([...familyItems, wrongFile, aiProviderPickerDemo])).toEqual([
      `tree-item-demo: files[0] should be ${JSON.stringify({
        path: `${BASE}/examples/tree-item-demo.tsx`,
        type: 'registry:example',
      })}`,
    ]);
  });
});
