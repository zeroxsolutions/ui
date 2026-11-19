import { glyphQuery, iconExportName } from '@zeroxsolutions/ui/site/lib/icon-sets';

/**
 * The `type` of each message the native Icons page and the gallery demo in its frame pass each other. The demo's
 * own (packages/native-ui/src/examples/icon-gallery-channel.ts) are the same, and this module's spec fails while
 * they differ.
 */
export const ICON_GALLERY_QUERY_MESSAGE = 'zui:icon-gallery:query';
export const ICON_GALLERY_READY_MESSAGE = 'zui:icon-gallery:ready';
export const ICON_GALLERY_PICK_MESSAGE = 'zui:icon-gallery:pick';

/** The name of the demo that draws the native icons, in `@zeroxsolutions/native-ui/examples`. */
export const ICON_GALLERY_DEMO = 'icon-gallery-demo';

/** The message that hands the gallery demo the search and the icon picked on the page. */
export interface IconGalleryQueryMessage {
  type: typeof ICON_GALLERY_QUERY_MESSAGE;
  /** What the reader typed, read as a glyph name, so the demo keeps the icons whose glyph holds it. */
  query: string;
  /** What the reader typed, trimmed, which the demo prints when no glyph holds `query`. */
  typed: string;
  /** The item name of the icon picked, whose tile the demo marks; absent before a pick. */
  picked?: string;
}

/**
 * The message that hands the gallery demo what the reader typed in the page's search box, read as the page's own
 * count reads it and as the page's own status prints it, and the icon picked, so a frame loaded again in another
 * style or mode marks the same tile.
 */
export function iconGalleryQueryMessage(query: string, picked?: string): IconGalleryQueryMessage {
  return {
    type: ICON_GALLERY_QUERY_MESSAGE,
    query: glyphQuery(query),
    typed: query.trim(),
    ...(picked === undefined ? {} : { picked }),
  };
}

/** How a React Native app imports the icon `glyph` of `set`, draws it through Icon, and plays it from a control. */
export function nativeIconUsage(set: string, glyph: string): string {
  const name = iconExportName(glyph);
  return [
    "import { useRef } from 'react';",
    "import { Pressable } from 'react-native';",
    '',
    `import { ${name}, type ${name}Handle } from '@/components/general/${set}/${glyph}-icon';`,
    "import { Icon } from '@/components/ui/icon';",
    "import { iconTrigger } from '@/lib/icon-motion';",
    '',
    `const icon = useRef<${name}Handle>(null);`,
    '',
    '// iconTrigger plays the icon once, out and back, as the control is pressed in or',
    '// focused; nothing stops it on press-out.',
    '<Pressable {...iconTrigger([icon], {})} onPress={onPress}>',
    `  <Icon as={${name}} ref={icon} />`,
    '</Pressable>',
  ].join('\n');
}

/** What the gallery demo told the page: that it listens for the search, or the item name of the icon tapped. */
export type IconGalleryMessage = { kind: 'ready' } | { kind: 'pick'; name: string };

/**
 * Reads a message the gallery demo posts.
 * @returns `undefined` for any other message, such as the frame's height
 */
export function iconGalleryMessageOf(data: unknown): IconGalleryMessage | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const { type, name } = data as { type?: unknown; name?: unknown };
  if (type === ICON_GALLERY_READY_MESSAGE) return { kind: 'ready' };
  if (type === ICON_GALLERY_PICK_MESSAGE && typeof name === 'string') return { kind: 'pick', name };
  return undefined;
}
