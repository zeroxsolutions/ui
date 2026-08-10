/**
 * `@zeroxsolutions/editor-core/math` - the math **engine** half of the editor
 * family. The headless core ships only `math/core` (the KaTeX render engine);
 * the React surfaces (`MathEditor` / `FormulaViewer` / `FormulaPreview`) are
 * editor **chrome** in the ui registry. Import each module at its full subpath
 * via the per-file `./*` map (dist mirrors src), e.g.:
 *
 *   import { renderMath } from '@zeroxsolutions/editor-core/math/core/index';
 *
 * This file is excluded from the build entries; it exists only as documentation.
 */
export {};
