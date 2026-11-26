import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { STYLES, styleMapOf } from './style-source';

const ROOT = resolve(import.meta.dirname, '../..');
const EDITOR = join(ROOT, 'registry/bases/base-ui/editor');

/** Every source the editor publishes, by its path under `editor/`; a spec is none. */
function editorSources(directory = EDITOR): Map<string, string> {
  return new Map(
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return [...editorSources(path)];
      if (!/\.(ts|tsx|css)$/.test(entry.name) || /\.spec\.tsx?$/.test(entry.name)) return [];
      return [[relative(EDITOR, path), readFileSync(path, 'utf8')] as const];
    }),
  );
}

/** A slot's classes with no variant, as the slot draws them on the element itself. */
function plain(classes: string): string[] {
  return classes.split(/\s+/).filter((name) => name !== '' && !name.includes(':'));
}

/** What a slot draws for one property; an empty answer is the property's initial value, which no class draws. */
const PROPERTIES = {
  radius: (classes: string[]) => only(classes, /^rounded(-|$)/, 'rounded-none'),
  padding: (classes: string[]) => only(classes, /^p[xytrbl]?-/, 'p-0'),
  shadow: (classes: string[]) => only(classes, /^shadow-/, 'shadow-none'),
  ring: (classes: string[]) => only(classes, /^ring-(foreground|1$)/, 'ring-0'),
} as const;

function only(classes: string[], property: RegExp, initial: string): string[] {
  const drawn = classes.filter((name) => property.test(name));
  return drawn.length > 0 ? drawn.sort() : [initial];
}

type Property = keyof typeof PROPERTIES;

/** Each editor slot, the design-system slot it stands for, and what it draws as that slot does. */
const STANDS_FOR: [editor: string, component: string, properties: Property[]][] = [
  ['cn-editor-toolbar', 'cn-dropdown-menu-content', ['radius', 'padding', 'shadow', 'ring']],
  ['cn-editor-menu-item', 'cn-combobox-item', ['radius']],
  ['cn-editor-menu-media', 'cn-item-media-variant-image', ['radius']],
  ['cn-editor-block', 'cn-alert', ['radius']],
  ['cn-editor-inline', 'cn-kbd', ['radius']],
  ['cn-editor-diagram', 'cn-card', ['radius', 'shadow', 'ring']],
  ['cn-editor-lane', 'cn-alert', ['radius', 'padding']],
];

/** The size a slot's rule draws an unsized svg at, as `[&_svg:not([class*='size-'])]:size-4` reads `size-4`. */
function svgSize(classes: string): string | undefined {
  return /\[&_svg:not\(\[class\*='size-'\]\)\]:(size-[0-9.]+)/.exec(classes)?.[1];
}

/** A slot's type: its size, weight, case and tracking. */
function type(classes: string): string[] {
  return classes
    .split(/\s+/)
    .filter((name) => /^(text-(xs|sm|\[[^\]]+\])$|font-|uppercase$|tracking-)/.test(name))
    .sort();
}

/** The engine's own nodes the editor's root rounds, through `cn-editor-content`, as `cn-kbd` is rounded. */
const ROUNDED_FROM_THE_ROOT = ['[&_.slash-active]:', '[&_mark]:'];

/** The engine's own blocks the editor's root rounds, through `cn-editor-content`, as `cn-alert` is rounded. */
const BLOCKS_ROUNDED_FROM_THE_ROOT = ['[&_.ProseMirror-selectednode:not(span)]:', '[&_table]:'];

/**
 * Each focus slot, the design-system slot whose ring it draws, and how that slot's state variants read on the
 * editor's element: a control the editor draws takes `cn-button`'s as they are, and a field whose focus sits on
 * the text inside it takes `cn-input`'s on its focus within and its `data-invalid`.
 */
const FOCUS: [editor: string, component: string, variant: (name: string) => string | null][] = [
  ['cn-editor-control', 'cn-button', (name) => (name.startsWith('focus-visible:') ? name : null)],
  [
    'cn-editor-field',
    'cn-input',
    (name) =>
      /^(dark:)?(focus-visible|aria-invalid):/.test(name)
        ? name.replace('focus-visible:', 'focus-within:').replace('aria-invalid:', 'data-invalid:')
        : null,
  ],
];

/** A radius or a shadow written as a class; a slot names neither. */
const LITERAL =
  /(?<![\w-])(?:rounded(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full))?|shadow-(?:2xs|xs|sm|md|lg|xl|2xl))(?![\w-])/g;

/** The literal radii a file keeps on purpose: a design-system part set flush inside a surface of the editor's own. */
const KEPT: Record<string, string[]> = {
  'code/file-content-router.tsx': ['rounded-none'],
};

/** A source with its comments dropped, since a comment may name a class it does not write. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1');
}

describe("the editor's chrome", () => {
  const sources = editorSources();

  it.each(STYLES)('draws each editor slot as the design-system slot it stands for, in %s', (style) => {
    const map = styleMapOf(ROOT, style);
    const drift = STANDS_FOR.flatMap(([editor, component, properties]) =>
      properties.flatMap((property) => {
        if (map[editor] === undefined) return [`${editor} is drawn by no sheet`];
        const ours = PROPERTIES[property](plain(map[editor] ?? ''));
        const theirs = PROPERTIES[property](plain(map[component]));
        return ours.join(' ') === theirs.join(' ')
          ? []
          : [`${editor} ${property} ${ours.join(' ')}, ${component} ${theirs.join(' ')}`];
      }),
    );
    expect(drift).toEqual([]);
  });

  it.each(STYLES)('rounds the trigger highlight and the highlight mark as cn-kbd, in %s', (style) => {
    const map = styleMapOf(ROOT, style);
    const kbd = PROPERTIES.radius(plain(map['cn-kbd'])).join(' ');
    const content = (map['cn-editor-content'] ?? '').split(/\s+/);
    const drift = ROUNDED_FROM_THE_ROOT.flatMap((variant) => {
      const drawn = content.filter((name) => name.startsWith(variant)).map((name) => name.slice(variant.length));
      // Unlike a slot's own element, the node the root reaches is rounded by nothing else, so a radius is owed.
      if (drawn.length === 0) return [`${variant} draws no radius`];
      const ours = PROPERTIES.radius(drawn).join(' ');
      return ours === kbd ? [] : [`${variant} ${ours}, cn-kbd ${kbd}`];
    });
    expect(drift).toEqual([]);
  });

  it.each(STYLES)('rounds the block it selects and a table as cn-alert, in %s', (style) => {
    const map = styleMapOf(ROOT, style);
    const alert = PROPERTIES.radius(plain(map['cn-alert'])).join(' ');
    const content = (map['cn-editor-content'] ?? '').split(/\s+/);
    const drift = BLOCKS_ROUNDED_FROM_THE_ROOT.flatMap((variant) => {
      const drawn = content.filter((name) => name.startsWith(variant)).map((name) => name.slice(variant.length));
      if (drawn.length === 0) return [`${variant} draws no radius`];
      const ours = PROPERTIES.radius(drawn).join(' ');
      return ours === alert ? [] : [`${variant} ${ours}, cn-alert ${alert}`];
    });
    expect(drift).toEqual([]);
  });

  it.each(STYLES)('draws each focus slot as the ring of the design-system slot it stands for, in %s', (style) => {
    const map = styleMapOf(ROOT, style);
    for (const [editor, component, variant] of FOCUS) {
      const theirs = map[component].split(/\s+/).flatMap((name) => variant(name) ?? []);
      expect(theirs.length, component).toBeGreaterThan(0);
      expect((map[editor] ?? '').split(/\s+/).sort(), editor).toEqual(theirs.sort());
    }
  });

  it.each(STYLES)('draws a chrome icon at the size cn-dropdown-menu-item draws its icon, in %s', (style) => {
    const map = styleMapOf(ROOT, style);
    const size = svgSize(map['cn-dropdown-menu-item']);
    expect(size).toBeDefined();
    // The svg is held to the size with `!`, as a toggle's or a menu row's own rule would otherwise size it.
    expect((map['cn-editor-icon'] ?? '').split(/\s+/).sort()).toEqual([size, `[&_svg]:${size}!`].sort());
  });

  it.each(STYLES)("draws a toolbar's icon at the size cn-toggle draws its icon, in %s", (style) => {
    const map = styleMapOf(ROOT, style);
    const size = svgSize(map['cn-toggle']);
    expect(size).toBeDefined();
    // The small toggles and icon buttons of a toolbar would draw it smaller than the style's toggles do.
    expect((map['cn-editor-toolbar-icon'] ?? '').split(/\s+/).sort()).toEqual([size, `[&_svg]:${size}!`].sort());
  });

  it.each(STYLES)(
    "draws a width handle with cn-button's radius and focus ring at its default height, in %s",
    (style) => {
      const map = styleMapOf(ROOT, style);
      const handle = (map['cn-editor-handle'] ?? '').split(/\s+/);
      expect(PROPERTIES.radius(plain(map['cn-editor-handle'] ?? ''))).toEqual(
        PROPERTIES.radius(plain(map['cn-button'])),
      );
      const ring = map['cn-button'].split(/\s+/).filter((name) => name.startsWith('focus-visible:'));
      expect(ring.length).toBeGreaterThan(0);
      expect(handle).toEqual(expect.arrayContaining(ring));
      const height = (classes: string) => classes.split(/\s+/).filter((name) => /^h-[0-9.]+$/.test(name));
      expect(height(map['cn-editor-handle'] ?? '')).toEqual(height(map['cn-button-size-default']));
    },
  );

  it('passes a separator no size or space of its own, only its slot', () => {
    const sized = [...sources]
      .filter(([path]) => !path.endsWith('.css'))
      .flatMap(([path, source]) =>
        [...code(source).matchAll(/<Separator[^>]*className="([^"]*)"/g)]
          .filter(([, classes]) => /(?:^|\s)(?:m[xy]?|h|w|size)-/.test(classes))
          .map(([tag]) => `${path}: ${tag}`),
      );
    expect(sized).toEqual([]);
  });

  it.each(STYLES)('sets a caption in the type of cn-badge, in %s', (style) => {
    const map = styleMapOf(ROOT, style);
    expect(type(map['cn-editor-caption'] ?? '')).toEqual(type(map['cn-badge']));
  });

  it.each(STYLES)('highlights a menu row as cn-combobox-item does, in %s', (style) => {
    const map = styleMapOf(ROOT, style);
    const highlight = (slot: string) =>
      (map[slot] ?? '')
        .split(/\s+/)
        .filter((name) => name.startsWith('data-highlighted:'))
        .sort();
    expect(highlight('cn-combobox-item').length).toBeGreaterThan(0);
    expect(highlight('cn-editor-menu-item')).toEqual(highlight('cn-combobox-item'));
  });

  it('writes no radius or shadow of its own outside a slot', () => {
    const literal = [...sources]
      .filter(([path]) => !path.endsWith('.css'))
      .flatMap(([path, source]) =>
        [...code(source).matchAll(LITERAL)]
          .map(([name]) => name)
          .filter((name) => !KEPT[path]?.includes(name))
          .map((name) => `${path}: ${name}`),
      );
    expect(literal).toEqual([]);
  });
});
