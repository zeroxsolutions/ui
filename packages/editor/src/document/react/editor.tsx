'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import { createDocumentEditor } from '../core/create-document-editor.js';
import type { Delta } from '../core/types/delta.js';
import type { IEditor } from '../core/types/editor.js';
import type { EditorFeature } from '../core/types/feature.js';
import type { DocJSON } from '../core/types/json.js';

/**
 * The editable `<Editor/>` surface. It mounts the engine-backed editor into a
 * DOM element on mount and tears it down on unmount, exposing only the `IEditor`
 * façade to callers (`onReady`) — no engine type crosses the props boundary. The
 * engine lives in this component's module graph (as expected for the editable
 * surface); the static `<Viewer/>` deliberately does not import it.
 */
export interface EditorProps {
  features?: EditorFeature[];
  content?: DocJSON;
  editable?: boolean;
  className?: string;
  /** Called once with the façade when the editor is ready. */
  onReady?(editor: IEditor): void;
  /** Called with each step-sized delta as the document changes. */
  onChange?(delta: Delta): void;
}

export function Editor({
  features,
  content,
  editable = true,
  className,
  onReady,
  onChange,
}: EditorProps) {
  // The raw engine instance — needed only to hand to `@tiptap/react`'s
  // `EditorContent`, which hosts the React node-view portals (without it, custom
  // node views never mount and render as bare `<div>`s). Typed `unknown`: no
  // engine type crosses this component's props/exports.
  const [engine, setEngine] = useState<unknown>(null);
  const editorRef = useRef<IEditor | null>(null);
  const callbacks = useRef({ onReady, onChange });
  callbacks.current = { onReady, onChange };

  // Build once on mount; changing `features`/`content` structurally requires a
  // remount (pass a React `key`). Editable is updated imperatively below.
  useEffect(() => {
    const editor = createDocumentEditor({
      features,
      content,
      editable,
      // Mount into a detached holder; `EditorContent` below adopts the view DOM
      // and calls `createNodeViews()` once its portal host exists.
      element: document.createElement('div'),
      onEngine: (raw) => setEngine(raw),
      onChange: (delta) => callbacks.current.onChange?.(delta),
    });
    editorRef.current = editor;
    callbacks.current.onReady?.(editor);
    return () => {
      editor.destroy();
      editorRef.current = null;
      setEngine(null);
    };
    // Intentionally build once — see the note above.
  }, []);

  useEffect(() => {
    editorRef.current?.setEditable(editable);
  }, [editable]);

  return (
    <EditorContent
      editor={engine as never}
      data-editor="document"
      className={[
        'document-editor prose max-w-none text-base leading-relaxed focus:outline-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
