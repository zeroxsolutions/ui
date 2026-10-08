/**
 * `math/core` - the engine-free logic of the math surface: the synchronous,
 * SSR-safe render seam, the structural templates, the symbol catalog, the export
 * helpers, and the shared types. No `katex` type crosses this barrel.
 */
export type {
  MathEditorLayout,
  MathEditorProps,
  MathRenderConfig,
  MathRenderResult,
  MathSymbol,
  MathSymbolGroup,
  MathTemplate,
} from './types.js';
export { renderMath, renderMathHtml } from './render.js';
export { DEFAULT_MATH_SOURCE, MATH_TEMPLATES, templateFor } from './templates.js';
export { SYMBOL_GROUPS } from './symbols.js';
export { copyLatex, copyMathML } from './export.js';
