/**
 * The messages the icon gallery demo and the docs page framing it pass each other: the page sends the search, and
 * the demo says it is ready for one and which icon was tapped. The site's copies of these types
 * (packages/native-ui-docs-web/src/lib/native-icon-gallery.ts) are checked against these by that module's spec.
 * The demo lives beside the other demos rather than in the preview screen because a demo is copied into each
 * style's sources and imports nothing outside them.
 */

/**
 * Page to demo: `{ type, query, typed, picked? }`. `query` is what the reader typed in the page's search box, already
 * read as a glyph name (`Arrow Up` as `arrow-up`), so the demo keeps the icons whose glyph holds it. `typed` is the
 * same text as the reader typed it, trimmed, which the demo prints when no glyph holds `query`. `picked` is the item
 * name of the icon picked on the page, absent before a pick.
 */
const ICON_GALLERY_QUERY_MESSAGE = 'zui:icon-gallery:query';

/** Demo to page: `{ type }`, posted once the demo listens, so the page sends the search it already holds. */
const ICON_GALLERY_READY_MESSAGE = 'zui:icon-gallery:ready';

/** Demo to page: `{ type, name }`, the registry item name of the icon tapped, such as `lucide-copy-icon`. */
const ICON_GALLERY_PICK_MESSAGE = 'zui:icon-gallery:pick';

/** A message event as far as the demo reads it. */
interface IconGalleryMessageEvent {
  readonly data: unknown;
  readonly origin: string;
  readonly source: unknown;
}

/** The demo's window in a frame: its origin, the page framing it, and the messages that page posts. */
interface IconGalleryWindow {
  readonly location: { readonly origin: string };
  readonly parent: { postMessage(message: unknown, targetOrigin: string): void };
  addEventListener(type: 'message', listener: (event: IconGalleryMessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: IconGalleryMessageEvent) => void): void;
}

/**
 * The window of a demo drawn in a frame, as the web export draws it in a docs page.
 * @returns `undefined` on a device, which has no page around the app, and for a preview opened on its own page
 */
function iconGalleryFrame(): IconGalleryWindow | undefined {
  const self = (globalThis as { window?: Partial<IconGalleryWindow> }).window;
  if (!self?.parent || Object.is(self.parent, self) || typeof self.addEventListener !== 'function') return undefined;
  return self as IconGalleryWindow;
}

/**
 * Tells the page framing `self` that the demo listens for its search. Only a page on the demo's own origin
 * receives it.
 */
function postIconGalleryReady(self: IconGalleryWindow): void {
  self.parent.postMessage({ type: ICON_GALLERY_READY_MESSAGE }, self.location.origin);
}

/** Tells the page framing `self` that the icon with the item name `name` was tapped. */
function postIconGalleryPick(self: IconGalleryWindow, name: string): void {
  self.parent.postMessage({ type: ICON_GALLERY_PICK_MESSAGE, name }, self.location.origin);
}

/**
 * What a query message carries: the search, as a glyph name and as the reader typed it, and the icon picked on the
 * page, if any.
 */
interface IconGalleryQuery {
  query: string;
  typed: string;
  picked?: string;
}

/**
 * The search and the pick a query message carries.
 * @returns `undefined` for any other message, and for one that came from a window other than the page framing
 * `self` or from another origin
 */
function iconGalleryQueryOf(self: IconGalleryWindow, event: IconGalleryMessageEvent): IconGalleryQuery | undefined {
  if (event.source !== self.parent || event.origin !== self.location.origin) return undefined;
  if (typeof event.data !== 'object' || event.data === null) return undefined;
  const { type, query, typed, picked } = event.data as {
    type?: unknown;
    query?: unknown;
    typed?: unknown;
    picked?: unknown;
  };
  if (type !== ICON_GALLERY_QUERY_MESSAGE || typeof query !== 'string' || typeof typed !== 'string') return undefined;
  return typeof picked === 'string' ? { query, typed, picked } : { query, typed };
}

export {
  ICON_GALLERY_PICK_MESSAGE,
  ICON_GALLERY_QUERY_MESSAGE,
  ICON_GALLERY_READY_MESSAGE,
  iconGalleryFrame,
  iconGalleryQueryOf,
  postIconGalleryPick,
  postIconGalleryReady,
};
export type { IconGalleryMessageEvent, IconGalleryQuery, IconGalleryWindow };
