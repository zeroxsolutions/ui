/**
 * `@zeroxsolutions/editor/mermaid` — the Mermaid **surface** of the editor
 * family (sibling to `document/` and the reserved `code/`). Like the package
 * root, it has **no root barrel**: import each module at its full subpath via the
 * per-file `./*` map (dist mirrors src), e.g.:
 *
 *   import { MermaidEditor } from '@zeroxsolutions/editor/mermaid/react/editor';
 *   import { DiagramViewer } from '@zeroxsolutions/editor/mermaid/react/viewer';
 *   import { DiagramPreview } from '@zeroxsolutions/editor/mermaid/react/preview';
 *   import { detectDiagramType } from '@zeroxsolutions/editor/mermaid/core/index';
 *
 * This file is excluded from the build entries; it exists only as documentation.
 */
export {};
