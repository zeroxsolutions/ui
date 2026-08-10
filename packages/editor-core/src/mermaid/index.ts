/**
 * `@zeroxsolutions/editor-core/mermaid` - the Mermaid **engine** half of the
 * editor family. The headless core ships only `mermaid/core` (the diagram
 * detection + render engine); the React surfaces (`MermaidEditor` /
 * `DiagramViewer` / `DiagramPreview`) are editor **chrome** in the ui registry.
 * Import each module at its full subpath via the per-file `./*` map (dist mirrors
 * src), e.g.:
 *
 *   import { detectDiagramType } from '@zeroxsolutions/editor-core/mermaid/core/index';
 *
 * This file is excluded from the build entries; it exists only as documentation.
 */
export {};
