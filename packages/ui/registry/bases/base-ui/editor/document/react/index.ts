/**
 * React entry points: the editable `<Editor/>`, the static SSR-safe `<Viewer/>`,
 * and the read-only live `<ViewerLive/>` (see `editor-viewer`). Import `<Viewer/>`
 * for server rendering — its module graph is engine-free.
 */
export { Editor, type EditorProps } from './editor';
export { Viewer, type ViewerProps } from './viewer';
export { ViewerLive, type ViewerLiveProps } from './viewer-live';

// The editor chrome (slash / bubble / block menus + toolbar) lives at the
// sibling `document/ui` subpath (task 8).
