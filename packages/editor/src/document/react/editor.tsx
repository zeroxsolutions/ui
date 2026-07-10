'use client';

import { useEffect, useRef } from 'react';
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
  const mountRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<IEditor | null>(null);
  const callbacks = useRef({ onReady, onChange });
  callbacks.current = { onReady, onChange };

  // Build once on mount; changing `features`/`content` structurally requires a
  // remount (pass a React `key`). Editable is updated imperatively below.
  useEffect(() => {
    const element = mountRef.current;
    if (!element) return;
    const editor = createDocumentEditor({
      features,
      content,
      editable,
      element,
      onChange: (delta) => callbacks.current.onChange?.(delta),
    });
    editorRef.current = editor;
    callbacks.current.onReady?.(editor);
    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // Intentionally build once — see the note above.
  }, []);

  useEffect(() => {
    editorRef.current?.setEditable(editable);
  }, [editable]);

  return <div ref={mountRef} className={className} data-editor="document" />;
}
