/**
 * `mermaid/core` — the engine-free logic of the Mermaid surface: the lazy engine
 * seam, diagram-type detection, starter templates, export helpers, and the
 * shared types. No `mermaid` type crosses this barrel.
 */
export type {
  DiagramTemplate,
  DiagramType,
  MermaidEditorLayout,
  MermaidEditorProps,
  MermaidRenderResult,
  RenderThemeConfig,
} from './types.js';
export { detectDiagramType, DIAGRAM_TYPE_LABEL } from './detect.js';
export {
  DEFAULT_DIAGRAM_SOURCE,
  DIAGRAM_TEMPLATES,
  templateFor,
} from './templates.js';
export { renderDiagram } from './engine.js';
export { copySvg, copyText, downloadPng, downloadSvg } from './export.js';
