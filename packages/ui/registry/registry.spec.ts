// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { describe, expect, it } from 'vitest';

import { BASE, ITEM_PREFIX, registryChecks, type RegistryItem } from '../src/build/registry-checks';

const APP = resolve(import.meta.dirname, '..');

const REGISTRY = JSON.parse(readFileSync(join(APP, 'registry.json'), 'utf8')) as { items: RegistryItem[] };

const {
  ownersOf,
  declarationProblems,
  cssVarsProblems,
  cssProblems,
  familyFiles,
  familyProblems,
  demoProblems,
  targetProblems,
  editorFiles,
  editorProblems,
  editorCssProblems,
} = registryChecks(APP);

describe('registry.json', () => {
  it('names no house item by URL, which would pin it to one style', () => {
    expect(readFileSync(join(APP, 'registry.json'), 'utf8')).not.toContain('https://ui.zeroxsolutions.com/r/');
  });

  it('names no lucide-animated item', () => {
    const named = REGISTRY.items.filter((item) => JSON.stringify(item).includes('lucide-animated.com'));
    expect(named.map((item) => item.name)).toEqual([]);
  });

  it("publishes each icon under icons/<set>/ as the item <set>-<file>, landing in general/<set>/ of the consumer's components alias", () => {
    const iconsDir = join(APP, BASE, 'icons');
    const icons = readdirSync(iconsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((set) =>
        readdirSync(join(iconsDir, set.name))
          .filter((file) => file.endsWith('.tsx') && !file.endsWith('.spec.tsx'))
          .map((file) => ({ set: set.name, file: file.slice(0, -'.tsx'.length) })),
      );
    expect(icons.length).toBeGreaterThan(0);
    const problems = icons.flatMap(({ set, file }) => {
      const name = `${set}-${file}`;
      const item = REGISTRY.items.find((candidate) => candidate.name === name);
      if (item === undefined) return [`${name}: no item`];
      const expected = [
        {
          path: `${BASE}/icons/${set}/${file}.tsx`,
          type: 'registry:ui',
          target: `@components/general/${set}/${file}.tsx`,
        },
      ];
      return [
        ...(item.type === 'registry:ui' ? [] : [`${name}: type ${item.type}`]),
        ...(isDeepStrictEqual(item.files, expected) ? [] : [`${name}: files ${JSON.stringify(item.files)}`]),
      ];
    });
    expect(problems).toEqual([]);
  });

  it('keeps no icon directly in icons/, outside a set', () => {
    const loose = readdirSync(join(APP, BASE, 'icons'), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.spec.tsx'))
      .map((entry) => entry.name);
    expect(loose).toEqual([]);
  });

  it('names each ui item shipping a file under icons/ <set>-<file> after the icons/<set>/<file>.tsx it is', () => {
    const icon = new RegExp(`^${BASE}/icons/([a-z0-9-]+)/([a-z0-9-]+)\\.tsx$`);
    const problems = REGISTRY.items
      .filter((item) => item.type === 'registry:ui')
      .flatMap((item) =>
        item.files
          .filter((file) => file.path.startsWith(`${BASE}/icons/`))
          .flatMap((file) => {
            const match = icon.exec(file.path);
            if (match === null) return [`${item.name}: ${file.path} is not icons/<set>/<file>.tsx`];
            const [, set, name] = match;
            return item.name === `${set}-${name}` ? [] : [`${item.name}: should be ${set}-${name}`];
          }),
      );
    expect(problems).toEqual([]);
  });

  it('declares exactly the files, upstream items and packages each item imports', () => {
    const owners = ownersOf(REGISTRY.items);
    expect(REGISTRY.items.flatMap((item) => declarationProblems(item, owners))).toEqual([]);
  });

  it('carries the success and warning tokens an item paints with, and no others', () => {
    expect(REGISTRY.items.flatMap(cssVarsProblems)).toEqual([]);
  });

  it('ships each css rule exactly as styles.css declares it', () => {
    expect(REGISTRY.items.flatMap(cssProblems)).toEqual([]);
  });

  it('publishes each family file as one item named and categorised after it', () => {
    expect(familyProblems(REGISTRY.items, familyFiles())).toEqual([]);
  });

  it('publishes one demo per item and no other example', () => {
    expect(demoProblems(REGISTRY.items)).toEqual([]);
  });

  it("lands every file through the consumer's aliases, in its own folder", () => {
    expect(targetProblems(REGISTRY.items)).toEqual([]);
  });

  it('ships every editor file in exactly one editor item', () => {
    expect(editorProblems(REGISTRY.items, editorFiles())).toEqual([]);
  });

  it('ships every rule of the editor sheet in the css of exactly one editor item', () => {
    const sheet = readFileSync(join(APP, BASE, 'editor/styles.css'), 'utf8');
    expect(editorCssProblems(REGISTRY.items, sheet)).toEqual([]);
  });

  it('reaches KaTeX through no registry dependency of chat-input or code-editor, and ships the typography plugin with neither', () => {
    const byName = new Map(REGISTRY.items.map((item) => [item.name, item]));
    const closureOf = (name: string): RegistryItem[] => {
      const reached = new Map<string, RegistryItem>();
      for (let pending = [name], next = pending.pop(); next !== undefined; next = pending.pop()) {
        const item = byName.get(next);
        if (item === undefined) throw new Error(`no item ${next}`);
        if (reached.has(next)) continue;
        reached.set(next, item);
        pending.push(
          ...(item.registryDependencies ?? [])
            .filter((dependency) => dependency.startsWith(ITEM_PREFIX))
            .map((dependency) => dependency.slice(ITEM_PREFIX.length)),
        );
      }
      return [...reached.values()];
    };
    const katex = ['chat-input', 'code-editor'].flatMap((name) =>
      closureOf(name)
        .filter(
          (item) =>
            (item.dependencies ?? []).includes('katex') ||
            Object.keys(item.css ?? {}).some((key) => /^@import\s+['"]katex/.test(key)),
        )
        .map((item) => `${name} reaches ${item.name}`),
    );
    expect(katex).toEqual([]);
    const typography = ['chat-input', 'code-editor'].flatMap((name) =>
      Object.keys(byName.get(name)?.css ?? {}).filter((key) => key.includes('typography')),
    );
    expect(typography).toEqual([]);
  });
});
