/**
 * The messages the icon gallery demo and the docs page framing it pass each other: the page sends the search, and
 * the demo says it is ready for one and which icon was tapped. The site's copies of these types
 * (packages/native-ui-docs-web/src/lib/native-icon-gallery.ts) are checked against these by that module's spec.
 * The demo lives beside the other demos rather than in the preview screen because a demo is copied into each
 * style's sources and imports nothing outside them.
 */

/** Page to demo: `{ type, query }`, what the reader typed in the page's search box. */
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

/** Tells the page framing `self` that the demo listens for its search. Only a page on the demo's own origin receives it. */
function postIconGalleryReady(self: IconGalleryWindow): void {
  self.parent.postMessage({ type: ICON_GALLERY_READY_MESSAGE }, self.location.origin);
}

/** Tells the page framing `self` that the icon with the item name `name` was tapped. */
function postIconGalleryPick(self: IconGalleryWindow, name: string): void {
  self.parent.postMessage({ type: ICON_GALLERY_PICK_MESSAGE, name }, self.location.origin);
}

/**
 * The search a query message carries.
 * @returns `undefined` for any other message, and for one that came from a window other than the page framing
 * `self` or from another origin
 */
function iconGalleryQueryOf(self: IconGalleryWindow, event: IconGalleryMessageEvent): string | undefined {
  if (event.source !== self.parent || event.origin !== self.location.origin) return undefined;
  if (typeof event.data !== 'object' || event.data === null) return undefined;
  const { type, query } = event.data as { type?: unknown; query?: unknown };
  return type === ICON_GALLERY_QUERY_MESSAGE && typeof query === 'string' ? query : undefined;
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
export type { IconGalleryMessageEvent, IconGalleryWindow };
