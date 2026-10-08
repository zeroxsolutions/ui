/**
 * The `code` editor surface — CodeMirror as a standalone, multi-file code
 * editor. `CodeEditor` / `CodeEditorContent` hold the open files and active
 * selection; `FileContentRouter` picks the viewer for a `RoutedFile` (code →
 * `CodeMirrorPane`, else a generic registry preview).
 */
export { CodeEditor, CodeEditorContent, useCodeEditor } from './code-editor.js';
export type { CodeEditorContentProps, CodeEditorProps } from './code-editor.js';

export { FileContentRouter, fileView } from './file-content-router.js';
export type { FileContentRouterProps, FileView, FileViewKind, RoutedFile } from './file-content-router.js';
