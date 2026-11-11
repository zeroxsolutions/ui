/** How far, in px, a finger or pointer travels from where it went down before a resize begins. */
export const RESIZE_DRAG_THRESHOLD = 4;

/**
 * Whether a press has moved far enough from where it went down to begin a resize, either way, so a tap, a
 * jitter or a double tap leaves the size alone.
 * @param threshold - in px; {@link RESIZE_DRAG_THRESHOLD} when left out
 */
export function shouldStartDrag(downX: number, currentX: number, threshold: number = RESIZE_DRAG_THRESHOLD): boolean {
  return Math.abs(currentX - downX) >= threshold;
}
