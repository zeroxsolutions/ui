// A small movement threshold so a click, pointer jitter, or double-click NEVER
// starts a resize. Without it a handle that begins dragging on pointerdown emits
// a resize on every move (even 1px), so brushing or clicking the edge nudges the
// size. This mirrors what react-resizable-panels does internally.

/** Pixels the pointer must travel from the press point before a resize begins. */
export const RESIZE_DRAG_THRESHOLD = 4;

/** Has the pointer moved far enough from the press point to begin a resize?
 *  Either direction counts. */
export function shouldStartDrag(
  downX: number,
  currentX: number,
  threshold: number = RESIZE_DRAG_THRESHOLD,
): boolean {
  return Math.abs(currentX - downX) >= threshold;
}
