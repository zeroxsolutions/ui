import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Registry } from 'shadcn/schema';
import { parseSlotMap } from './slot-map';

const PROJECT = join(__dirname, '../..');
const WEB = dirname(require.resolve('@zeroxsolutions/ui/registry.json'));

/** The web items with no native twin, each with what keeps it off a phone. */
const NOT_PORTED: ReadonlyMap<string, string> = new Map([
  ['ai-provider-picker', 'a block; the native registries publish no block and the native docs have no blocks page'],
]);

/** The web items a later wave of the port brings, which the list loses as each wave lands. */
const PENDING: ReadonlySet<string> = new Set([
  // wave 3
  'file-tree',
  'code-card',
  'markdown-view',
  'data-table',
  // wave 4
  'emoji-picker',
  'avatar-picker',
]);

/** Per ported item, the zui slots its web twin writes that a phone does not draw, each with its reason. */
const UNDRAWN_SLOTS: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map([
  [
    'password-input',
    new Map([
      [
        'cn-password-input',
        "redraws InputGroup's focus ring for the web's own input slot; native InputGroup rings itself from its focused state",
      ],
    ]),
  ],
  [
    'number-field',
    new Map([
      [
        'cn-number-field',
        "redraws InputGroup's focus ring for the web's own input slot; native InputGroup rings itself from its focused state",
      ],
    ]),
  ],
]);

function readRegistry(root: string): Registry {
  return JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')) as Registry;
}

const web = readRegistry(WEB).items.filter(
  (item) => item.type === 'registry:component' || item.type === 'registry:block',
);
const native = new Map(readRegistry(PROJECT).items.map((item) => [item.name, item]));
const zuiSlots = new Set(
  parseSlotMap(readFileSync(require.resolve('@zeroxsolutions/ui/registry/styles/style-nova.css'), 'utf8')).keys(),
);

/** The zui slots the first file of an item writes. */
function zuiSlotsOf(root: string, path: string): Set<string> {
  const source = readFileSync(join(root, path), 'utf8');
  return new Set((source.match(/\bcn-[a-z0-9-]+/g) ?? []).filter((token) => zuiSlots.has(token)));
}

describe("zui's own items on native", () => {
  it('reads both registries', () => {
    expect(web.length).toBeGreaterThan(0);
    expect(zuiSlots.size).toBeGreaterThan(0);
  });

  it('ports every web item, unless it is named as not ported or pending', () => {
    expect(
      web.map((item) => item.name).filter((name) => !native.has(name) && !NOT_PORTED.has(name) && !PENDING.has(name)),
    ).toEqual([]);
  });

  it('names no item as not ported or pending that is ported', () => {
    expect([...NOT_PORTED.keys(), ...PENDING].filter((name) => native.has(name))).toEqual([]);
  });

  it('writes the zui slots its web twin writes, but those a phone does not draw', () => {
    const differences = web.flatMap((item) => {
      const twin = native.get(item.name);
      const webPath = item.files?.[0]?.path;
      const nativePath = twin?.files?.[0]?.path;
      if (!webPath || !nativePath) return [];
      const undrawn = UNDRAWN_SLOTS.get(item.name) ?? new Map<string, string>();
      const expected = [...zuiSlotsOf(WEB, webPath)].filter((slot) => !undrawn.has(slot)).sort();
      const written = [...zuiSlotsOf(PROJECT, nativePath)].sort();
      return expected.join() === written.join() ? [] : [`${item.name}: ${written.join(' ')} != ${expected.join(' ')}`];
    });
    expect(differences).toEqual([]);
  });
});
