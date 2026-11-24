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
];

/** The engine's own nodes the editor's root rounds, through `cn-editor-content`, as `cn-kbd` is rounded. */
const ROUNDED_FROM_THE_ROOT = ['[&_.slash-active]:', '[&_mark]:'];

/** Which slots, or which design-system component, each piece of the editor's chrome draws with. */
const PIECES: Record<string, string[]> = {
  'document/ui/rect-popover.tsx': ['cn-popover-content', 'cn-popover-content-logical'],
  'document/ui/editor-toolbar.tsx': ['cn-editor-toolbar'],
  'document/ui/bubble-menu.tsx': ['cn-editor-toolbar'],
  'document/ui/slash-menu.tsx': ['cn-editor-menu-item', 'cn-editor-menu-media'],
  'composer/triggers/trigger-menu.tsx': ['cn-editor-menu-item', 'cn-editor-menu-media'],
  'document/features/mention/mention.tsx': ['<Badge'],
  'composer/triggers/inline-token.tsx': ['<Badge'],
  'profiles/variables/variable.tsx': ['<Badge'],
  'profiles/email/nodes/button.tsx': ['buttonVariants'],
  'profiles/email/nodes/html.tsx': ['cn-editor-block'],
  'profiles/email/nodes/unknown.tsx': ['cn-editor-block'],
  'profiles/email/email-link-popover.tsx': ['<RectPopover', '<Button'],
  'profiles/variables/variable-menu.tsx': ['<EditorToolbarComboboxTrigger'],
  'document/ui/editor-toolbar-combobox-trigger.tsx': ['toggleVariants', '<Tooltip'],
  'profiles/problem-marker.tsx': ['<Button', '<Tooltip'],
  'profiles/email/email-editor.tsx': ['<Tooltip', '<TabsList'],
  'profiles/sms/sms-editor.tsx': ['<Tooltip'],
  'document/features/callout/callout.tsx': ['cn-alert'],
  'document/features/toggle/toggle.tsx': ['cn-button cn-button-variant-ghost cn-button-size-icon-sm'],
  'document/react/editor.tsx': [
    'cn-editor-content',
    'cn-button cn-button-variant-ghost cn-button-size-icon-sm',
    '<Button',
  ],
  'document/features/math/math.tsx': ['cn-editor-block', 'cn-editor-inline'],
  'mermaid/react/preview.tsx': ['cn-editor-diagram'],
  'document/features/image/image.tsx': ['cn-editor-block'],
  'document/features/embed/embed.tsx': ['cn-editor-block'],
  'document/react/viewer.tsx': ['cn-editor-content'],
  'composer/chat-input.tsx': ['cn-editor-content'],
  'composer/chat-message-view.tsx': ['cn-editor-content'],
};

/** A radius or a shadow written as a class; a slot names neither. */
const LITERAL =
  /(?<![\w-])(?:rounded(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full))?|shadow-(?:2xs|xs|sm|md|lg|xl|2xl))(?![\w-])/g;

/** The literal radii a file keeps on purpose: a design-system part set flush inside a surface of the editor's own. */
const KEPT: Record<string, string[]> = {
  'code/file-content-router.tsx': ['rounded-none'],
  'document/features/mermaid/mermaid.tsx': ['rounded-none'],
  'mermaid/react/editor.tsx': ['rounded-none'],
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

  it.each(STYLES)('highlights a menu row as cn-combobox-item does, in %s', (style) => {
    const combobox = styleMapOf(ROOT, style)['cn-combobox-item'].split(/\s+/);
    expect(combobox).toEqual(
      expect.arrayContaining(['data-highlighted:bg-accent', 'data-highlighted:text-accent-foreground']),
    );
    for (const menu of ['document/ui/slash-menu.tsx', 'composer/triggers/trigger-menu.tsx']) {
      expect(sources.get(menu)).toContain('data-highlighted:bg-accent data-highlighted:text-accent-foreground');
    }
  });

  it('draws each piece with the slots or the component it stands for', () => {
    const missing = Object.entries(PIECES).flatMap(([path, writes]) =>
      writes.filter((token) => !sources.get(path)?.includes(token)).map((token) => `${path}: ${token}`),
    );
    expect(missing).toEqual([]);
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

  it('writes no radius or shadow of its own in its stylesheet, which no slot reaches', () => {
    const sheet = sources.get('styles.css') ?? '';
    const declared = [...sheet.matchAll(/^\s*(border-radius|box-shadow):\s*([^;]+);/gm)].map(
      ([, property, value]) => `${property}: ${value}`,
    );
    // The code card's inner block, set flat inside the card, and the composer's command pill, whose inset
    // shadow is a hairline in the composer's own accent rather than a surface's shadow.
    expect(declared).toEqual([
      'border-radius: 0',
      'box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--composer-accent) 30%, transparent)',
    ]);
  });
});
