import registry from '@zeroxsolutions/native-ui/registry.json';
import { iconSets, type IconSet } from '@zeroxsolutions/ui/site/lib/icon-sets';

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

/** Every animated icon the native registry publishes, by set, read from `registry.json` at build. */
export const nativeIconSets: IconSet[] = iconSets(registry.items);

/** The message that hands the gallery demo what the reader typed in the page's search box. */
export function iconGalleryQueryMessage(query: string): { type: typeof ICON_GALLERY_QUERY_MESSAGE; query: string } {
  return { type: ICON_GALLERY_QUERY_MESSAGE, query };
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
