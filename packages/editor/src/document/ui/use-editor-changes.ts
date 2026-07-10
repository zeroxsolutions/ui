import { useEffect, useState } from 'react';
import type { IEditor } from '../core/index.js';

/**
 * Re-render on any editor change — a document delta (`onChange`) or a bare
 * selection move (`selectionchange`) — so a toolbar's active states and a bubble
 * menu's position stay live. Returns a bumping version number; read it to make a
 * component depend on the current editor state without touching the engine.
 */
export function useEditorChanges(editor: IEditor | null | undefined): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setVersion((value) => value + 1);
    const off = editor.onChange(bump);
    document.addEventListener('selectionchange', bump);
    return () => {
      off();
      document.removeEventListener('selectionchange', bump);
    };
  }, [editor]);
  return version;
}
