/**
 * The internal `CodeMirrorPane` seam — the CodeMirror 6 editing surface
 * (Shiki-highlighted, token-themed) the editor's `code` and Mermaid surfaces
 * compose. Its Shiki foundation is the single highlighter in
 * `@/registry/bases/base-ui/lib/shiki` (design D2).
 */
export { CodeMirrorPane } from './code-mirror-pane.js';
export type { CodeMirrorPaneProps } from './code-mirror-pane.js';
