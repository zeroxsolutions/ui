/**
 * React entry points: the editable `<Editor/>`, the static SSR-safe `<Viewer/>`,
 * and the read-only live `<ViewerLive/>` (see `editor-viewer`). Import `<Viewer/>`
 * for server rendering — its module graph is engine-free.
 */
export { Editor, type EditorProps } from './editor.js';
export { Viewer, type ViewerProps } from './viewer.js';
export { ViewerLive, type ViewerLiveProps } from './viewer-live.js';

// The editor chrome (slash / bubble / block menus + toolbar) lives at the
// sibling `document/ui` subpath (task 8).
