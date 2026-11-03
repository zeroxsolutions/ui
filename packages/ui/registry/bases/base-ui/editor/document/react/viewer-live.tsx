'use client';

import { Editor, type EditorProps } from './editor.js';

/**
 * The read-only **live** Viewer (see the `editor-viewer` spec). Unlike the
 * static `<Viewer/>`, it renders through the interactive node views with editing
 * disabled — for content that needs live read interactions a static render
 * cannot provide (collapsible toggles, code copy, diagram interactions). It is
 * the editable surface with `editable={false}`, so feature read-interactions
 * stay available while the document cannot be mutated.
 */
export type ViewerLiveProps = Omit<EditorProps, 'editable' | 'onChange'>;

export function ViewerLive(props: ViewerLiveProps) {
  return <Editor {...props} editable={false} />;
}
