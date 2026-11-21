import { useCallback, useEffect, useRef } from 'react';

/** The DOM node the caret sits in, to find the problem after it. */
export function caretNode(): Node | null {
  return document.getSelection()?.focusNode ?? null;
}

/** The marker after `from` in document order, or before it going `backwards`, wrapping round the ends. */
export function nextMarker(markers: readonly HTMLElement[], from: Node, backwards: boolean): HTMLElement {
  const after = (element: Element) =>
    element !== from && (from.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  return backwards
    ? (markers.filter((element) => element !== from && !after(element)).pop() ?? markers[markers.length - 1])
    : (markers.find(after) ?? markers[0]);
}

/**
 * Focus is inside while it is in the editor or in a popup it opened, which React bubbles through its portal: a
 * blur waits a tick for focus to come back before it tells the host. Spread the result on the editor's root.
 */
export function useFocusLeave(onLeave: () => void): { onFocus(): void; onBlur(): void } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leave = useRef(onLeave);
  leave.current = onLeave;
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);
  const onBlur = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => {
      timer.current = null;
      leave.current();
    }, 0);
  }, [cancel]);
  return { onFocus: cancel, onBlur };
}
