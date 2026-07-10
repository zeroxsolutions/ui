/**
 * Read the browser's own selection geometry — not the engine's. The chrome
 * positions its floating surfaces from the DOM `Selection` rect, which keeps the
 * whole chrome engine-free (no ProseMirror coordinate access).
 */
export interface Point {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/** The bounding rect of the current DOM selection/caret, or null if none. */
export function selectionRect(): Point | null {
  if (typeof window === 'undefined') return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  return { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right };
}

/** Whether the current DOM selection is non-empty and inside `container`. */
export function selectionWithin(container: HTMLElement | null): boolean {
  if (typeof window === 'undefined') return false;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;
  if (!container) return true;
  const range = selection.getRangeAt(0);
  return container.contains(range.commonAncestorContainer);
}
