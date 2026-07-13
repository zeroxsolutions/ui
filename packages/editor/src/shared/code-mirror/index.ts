/**
 * The internal `CodeMirrorPane` seam — the CodeMirror 6 editing surface
 * (Shiki-highlighted, token-themed) the editor's `code` and Mermaid surfaces
 * compose. Relocated in-package from `@zeroxsolutions/ui`'s former
 * `code-editor-pane` (design D1); its Shiki foundation stays the single
 * highlighter in `@zeroxsolutions/ui/lib/shiki` (design D2).
 */
export { CodeMirrorPane } from './code-mirror-pane.js';
export type { CodeMirrorPaneProps } from './code-mirror-pane.js';
