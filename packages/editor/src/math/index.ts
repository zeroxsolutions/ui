/**
 * `@zeroxsolutions/editor/math` - the math **surface** of the editor family
 * (sibling to `document/` and `mermaid/`). Like the package root, it has **no root
 * barrel**: import each module at its full subpath via the per-file `./*` map
 * (dist mirrors src), e.g.:
 *
 *   import { MathEditor } from '@zeroxsolutions/editor/math/react/editor';
 *   import { FormulaViewer } from '@zeroxsolutions/editor/math/react/viewer';
 *   import { FormulaPreview } from '@zeroxsolutions/editor/math/react/preview';
 *   import { renderMath } from '@zeroxsolutions/editor/math/core/index';
 *
 * This file is excluded from the build entries; it exists only as documentation.
 */
export {};
