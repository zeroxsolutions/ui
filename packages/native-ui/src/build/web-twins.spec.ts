import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Registry } from 'shadcn/schema';
import { parseSlotMap } from './slot-map';

const PROJECT = join(__dirname, '../..');
const WEB = dirname(require.resolve('@zeroxsolutions/ui/registry.json'));

/** The web items with no native twin, each with what keeps it off a phone. */
/** The editor chrome renders through Tiptap into the DOM; a native editor is a design of its own. */
const EDITOR = 'drawn by Tiptap, which renders only into the DOM';

const NOT_PORTED: ReadonlyMap<string, string> = new Map([
  ['document-editor', EDITOR],
  ['editor-callout', EDITOR],
  ['editor-code-block', EDITOR],
  ['editor-embed', EDITOR],
  ['editor-image', EDITOR],
  ['editor-link', EDITOR],
  ['editor-math', EDITOR],
  ['editor-mention', EDITOR],
  ['editor-mermaid', EDITOR],
  ['editor-table', EDITOR],
  ['editor-toggle', EDITOR],
  ['editor-toggle-heading', EDITOR],
  ['editor-button', EDITOR],
  ['editor-columns', EDITOR],
  ['editor-card', EDITOR],
  ['editor-bookmark', EDITOR],
  ['editor-file', EDITOR],
  ['editor-media', EDITOR],
  ['editor-table-of-contents', EDITOR],
  ['block-library', EDITOR],
  ['block-presets', EDITOR],
  ['editor-uploads', EDITOR],
  ['editor-features', EDITOR],
  ['math-editor', EDITOR],
  ['mermaid-editor', EDITOR],
  ['code-editor', EDITOR],
  ['chat-input', EDITOR],
  ['email-editor', EDITOR],
  ['sms-editor', EDITOR],
]);

/** The web items a later wave of the port brings, which the list loses as each wave lands. */
const PENDING: ReadonlySet<string> = new Set([]);

/** Per ported item, the zui slots its web twin writes that a phone does not draw, each with its reason. */
const UNDRAWN_SLOTS: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map([
  [
    'avatar-picker',
    new Map([['cn-avatar-picker-drop', 'lights a drop target while a file is dragged over it; a phone drags no file']]),
  ],
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

const webItems = readRegistry(WEB).items;
const web = webItems.filter((item) => item.type === 'registry:component' || item.type === 'registry:block');
const nativeItems = readRegistry(PROJECT).items;
const native = new Map(nativeItems.map((item) => [item.name, item]));

/** The `<set>/<file>` an animated icon's first file sits at under `icons/`, which both halves name it by. */
const ICON_FILE = /(?:^|\/)icons\/([a-z0-9-]+\/[a-z0-9-]+)\.tsx$/;
const iconsOf = (items: Registry['items']): string[] =>
  items.flatMap((item) => {
    const match = item.type === 'registry:ui' ? ICON_FILE.exec(item.files?.[0]?.path ?? '') : null;
    return match ? [match[1]] : [];
  });
const webIcons = iconsOf(webItems);
const nativeIcons = new Set(iconsOf(nativeItems));
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

  it('has a native twin of every web animated icon, at the same <set>/<file> under icons/', () => {
    expect(webIcons.length).toBeGreaterThan(0);
    expect(webIcons.filter((icon) => !nativeIcons.has(icon))).toEqual([]);
  });

  it('names each ui item shipping a file under icons/ <set>-<file> after the icons/<set>/<file>.tsx it is', () => {
    const problems = nativeItems
      .filter((item) => item.type === 'registry:ui')
      .flatMap((item) =>
        (item.files ?? [])
          .filter((file) => file.path.startsWith('src/registry/icons/'))
          .flatMap((file) => {
            const match = /^src\/registry\/icons\/([a-z0-9-]+)\/([a-z0-9-]+)\.tsx$/.exec(file.path);
            if (match === null) return [`${item.name}: ${file.path} is not icons/<set>/<file>.tsx`];
            const [, set, name] = match;
            return item.name === `${set}-${name}` ? [] : [`${item.name}: should be ${set}-${name}`];
          }),
      );
    expect(problems).toEqual([]);
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
