import { useEffect, useState } from 'react';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';

/**
 * Re-render on any editor change, a document delta (`onChange`) or a selection move, so a toolbar's active
 * states and a bubble menu's position stay live. A selection move is read from both the engine and the DOM:
 * the DOM's `selectionchange` fires before the engine has read the selection, so on its own a mark the caret
 * has just moved into would show as off. The events of one frame make one re-render, in the next frame.
 * Returns a bumping version number; read it to make a component depend on the current editor state without
 * touching the engine.
 */
export function useEditorChanges(editor: IEditor | null | undefined): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!editor) return;
    let frame: number | null = null;
    const bump = () => {
      frame ??= requestAnimationFrame(() => {
        frame = null;
        setVersion((value) => value + 1);
      });
    };
    const off = editor.onChange(bump);
    const offSelection = editor.onSelectionUpdate(bump);
    document.addEventListener('selectionchange', bump);
    return () => {
      off();
      offSelection();
      document.removeEventListener('selectionchange', bump);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [editor]);
  return version;
}
