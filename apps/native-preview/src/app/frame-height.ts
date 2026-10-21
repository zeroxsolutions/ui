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

export { HEIGHT_MESSAGE, postHeightToHost };
export type { FramedWindow };
