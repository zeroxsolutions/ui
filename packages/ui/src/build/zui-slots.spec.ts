import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { createStyleMap } from 'shadcn/utils';

import { STYLES, styleMapOf, styleSheets, styleSource } from './style-source';

const ROOT = resolve(import.meta.dirname, '../..');

interface RegistryItem {
  name: string;
  type: string;
  files: { path: string }[];
}

const items = (JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as { items: RegistryItem[] }).items;

/** Each file the registry publishes, by path, with its source. */
function published(type: (itemType: string) => boolean): Map<string, string> {
  return new Map(
    items
      .filter((item) => type(item.type))
      .flatMap((item) => item.files.map((file) => [file.path, readFileSync(join(ROOT, file.path), 'utf8')] as const)),
  );
}

const shipped = published((type) => type !== 'registry:example');
const examples = published((type) => type === 'registry:example');

/** The `cn-` tokens `source` writes. */
function tokens(source: string): Set<string> {
  return new Set(source.match(/\bcn-[a-z0-9-]+/g) ?? []);
}

/** The slots a sheet defines. */
function slots(sheet: string): Set<string> {
  return new Set(Object.keys(createStyleMap(sheet)));
}

describe("zui's own slots", () => {
  it('are the same slots in each of the eight sheets', () => {
    const [first, ...rest] = STYLES.map((style) => [...slots(styleSheets(ROOT, style).zui)].sort());
    expect(first.length).toBeGreaterThan(0);
    for (const other of rest) expect(other).toEqual(first);
  });

  it("name no slot upstream's sheets already draw", () => {
    for (const style of STYLES) {
      const { upstream, zui } = styleSheets(ROOT, style);
      const theirs = slots(upstream);
      expect([...slots(zui)].filter((slot) => theirs.has(slot))).toEqual([]);
    }
  });

  it('are each written by a published item', () => {
    const written = new Set([...shipped.values()].flatMap((source) => [...tokens(source)]));
    expect([...slots(styleSheets(ROOT, 'nova').zui)].filter((slot) => !written.has(slot))).toEqual([]);
  });
});

describe('the published files', () => {
  it('write only slots each style draws', () => {
    for (const style of STYLES) {
      const map = styleMapOf(ROOT, style);
      const undrawn = [...shipped].flatMap(([path, source]) =>
        [...tokens(source)].filter((token) => !(token in map)).map((token) => `${path}: ${token} (${style})`),
      );
      expect(undrawn).toEqual([]);
    }
  });

  it('keep no slot once a style is written into them, so none sits outside a className, cn() or cva()', async () => {
    const left: string[] = [];
    for (const style of STYLES) {
      const map = styleMapOf(ROOT, style);
      for (const [path, source] of shipped) {
        for (const token of tokens(await styleSource(source, map))) left.push(`${path}: ${token} (${style})`);
      }
    }
    expect(left).toEqual([]);
  }, 120_000);

  it('hold no slot in an example, whose source is then the same in every style', () => {
    expect([...examples].filter(([, source]) => tokens(source).size > 0).map(([path]) => path)).toEqual([]);
  });
});
