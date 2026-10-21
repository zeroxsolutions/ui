/**
 * The `type` of the message that tells the docs site framing the preview how tall the drawn demo is.
 * The site's `NATIVE_PREVIEW_HEIGHT_MESSAGE` (apps/registry-ui/src/lib/native-preview.ts) reads it, and
 * that module's spec fails while the two differ.
 */
const HEIGHT_MESSAGE = 'zui:native-preview-height';

/** The part of a window this module reads: its origin and the window framing it. */
interface FramedWindow {
  readonly location: { readonly origin: string };
  parent: { postMessage(message: unknown, targetOrigin: string): void };
}

/**
 * Posts `height`, in CSS pixels, to the page framing `self`, so the frame can take the demo's height.
 * Only a page on the preview's own origin receives it. A preview opened on its own, whose parent is
 * itself, posts nothing.
 */
function postHeightToHost(self: FramedWindow, height: number): void {
  if (Object.is(self.parent, self)) return;
  self.parent.postMessage({ type: HEIGHT_MESSAGE, height }, self.location.origin);
}

/**
 * The least height, in CSS pixels, of a frame while its demo shows an overlay. An overlay is drawn over the
 * whole page rather than in the demo's own height, so a frame as tall as a demo's trigger alone would clip
 * the dialog, sheet or popover it opens.
 */
const OVERLAY_FRAME_HEIGHT = 560;

/** The height a frame takes for a demo `contentHeight` tall, in CSS pixels, with or without an open overlay. */
function frameHeightOf(contentHeight: number, overlayOpen: boolean): number {
  return overlayOpen ? Math.max(contentHeight, OVERLAY_FRAME_HEIGHT) : contentHeight;
}

/** The part of a document {@link showsOverlay} reads: the elements directly in its body. */
interface OverlayDocument {
  readonly body: {
    readonly children: ArrayLike<{
      readonly tagName: string;
      readonly id: string;
      readonly style?: { readonly visibility: string; readonly display: string };
    }>;
  };
}

/** The elements of the page itself, which an Expo web export puts in the body beside the app's root. */
const PAGE_ELEMENTS: ReadonlySet<string> = new Set(['SCRIPT', 'NOSCRIPT', 'STYLE', 'TEMPLATE', 'LINK']);

/**
 * Whether the web page shows an overlay. The primitives an overlay is built on render it on the web into
 * an element they append to the body, beside the app's `#root`, and remove when it closes. The safe area
 * provider, which measures the insets with one, and Uniwind keep hidden elements there too.
 */
function showsOverlay(document: OverlayDocument): boolean {
  return Array.from(document.body.children).some(
    (element) =>
      element.id !== 'root' &&
      !PAGE_ELEMENTS.has(element.tagName) &&
      element.style?.visibility !== 'hidden' &&
      element.style?.display !== 'none',
  );
}

export { HEIGHT_MESSAGE, OVERLAY_FRAME_HEIGHT, frameHeightOf, postHeightToHost, showsOverlay };
export type { FramedWindow, OverlayDocument };
