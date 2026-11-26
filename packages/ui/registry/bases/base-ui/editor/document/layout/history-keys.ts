import type { KeyboardEvent } from 'react';

/** Undo (Mod+Z), redo (Mod+Shift+Z, Mod+Y): the keys the editor's history answers. */
function isHistoryKey(event: KeyboardEvent<HTMLElement>): boolean {
  const key = event.key.toLowerCase();
  return (event.metaKey || event.ctrlKey) && !event.altKey && (key === 'z' || key === 'y');
}

/**
 * Hands an undo or a redo pressed on a handle drawn inside a block, such as a width handle or a column border, to the
 * editor's text, and answers whether it did. The engine leaves the keys of a block's own controls to them, so on a
 * handle, which holds the focus after a drag or its arrow keys, Mod+Z would undo nothing. The focus moves to the
 * text, as the editor's history then sets the selection there.
 */
export function passHistoryKey(event: KeyboardEvent<HTMLElement>): boolean {
  const text = event.currentTarget.closest<HTMLElement>('[contenteditable=true]');
  if (!text || !isHistoryKey(event)) return false;
  event.preventDefault();
  event.stopPropagation();
  text.focus({ preventScroll: true });
  const { key, code, metaKey, ctrlKey, shiftKey } = event;
  text.dispatchEvent(
    new globalThis.KeyboardEvent('keydown', { key, code, metaKey, ctrlKey, shiftKey, bubbles: true, cancelable: true }),
  );
  return true;
}
