import type { MathTemplate } from './types.js';

/**
 * Structural LaTeX starters the palette inserts - a known-good skeleton for the
 * shapes that are painful to type from memory (fractions, roots, matrices, cases,
 * limits). Pure data, engine-free. Each `caretOffset` is the index, from the
 * start of `latex`, where the caret should land after insertion so the user types
 * straight into the first hole: for `\frac{}{}` that is between the first empty
 * braces (offset 6), for the multi-cell shapes it is the first sample cell.
 */
export const MATH_TEMPLATES: readonly MathTemplate[] = [
  // `\frac{}{}` - caret 6 sits between the first empty braces (index 5 is `{`, 6 is `}`).
  { label: 'Fraction', latex: '\\frac{}{}', caretOffset: 6 },
  // `\sqrt{}` - caret 6 sits inside the empty braces.
  { label: 'Square root', latex: '\\sqrt{}', caretOffset: 6 },
  // Caret 16 lands on the first cell `a` of the 2x2 matrix.
  {
    label: 'Matrix',
    latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
    caretOffset: 16,
  },
  // Caret 21 lands on the first case value `a`.
  {
    label: 'Cases',
    latex: 'f(x) = \\begin{cases} a & x < 0 \\\\ b & x \\ge 0 \\end{cases}',
    caretOffset: 21,
  },
  // Caret 6 lands on the limit variable `x`.
  { label: 'Limit', latex: '\\lim_{x \\to \\infty}', caretOffset: 6 },
];

/** The default starter source - also the surface's placeholder example. */
export const DEFAULT_MATH_SOURCE = 'E = mc^2';

/** Look up a template by its label, or `undefined` when none matches. */
export function templateFor(label: string): MathTemplate | undefined {
  return MATH_TEMPLATES.find((template) => template.label === label);
}
