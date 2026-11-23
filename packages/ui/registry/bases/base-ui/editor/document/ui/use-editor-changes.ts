import { useEffect, useState } from 'react';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';

/**
 * Re-render on any editor change — a document delta (`onChange`) or a bare
 * selection move (`selectionchange`) — so a toolbar's active states and a bubble
 * menu's position stay live. The engine's own selection event is read too: the
 * DOM's fires before the engine has read the selection, so a mark the caret has
 * just moved into would otherwise show as off. Returns a bumping version number; read it to make a
 * component depend on the current editor state without touching the engine.
 */
export function useEditorChanges(editor: IEditor | null | undefined): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setVersion((value) => value + 1);
    const off = editor.onChange(bump);
    const offSelection = editor.onSelectionUpdate(bump);
    document.addEventListener('selectionchange', bump);
    return () => {
      off();
      offSelection();
      document.removeEventListener('selectionchange', bump);
    };
  }, [editor]);
  return version;
}
