import katex from 'katex';

/**
 * Formula export helpers - best-effort clipboard writes over the LaTeX source,
 * using only the browser Clipboard API so the surface adds no dependency. Each
 * returns a promise that resolves on success and rejects on failure, so the
 * caller can report the outcome inline (a transient check, no toast dependency).
 */

/** Copy the LaTeX source to the clipboard. */
export async function copyLatex(latex: string): Promise<void> {
  await navigator.clipboard.writeText(latex);
}

/**
 * Copy the formula's MathML to the clipboard - KaTeX's MathML-only output,
 * extracted to the bare `<math>` element (best-effort; leniently rendered so an
 * invalid formula still yields markup rather than throwing).
 */
export async function copyMathML(latex: string): Promise<void> {
  const markup = katex.renderToString(latex, {
    output: 'mathml',
    throwOnError: false,
  });
  const math = /<math[\s\S]*<\/math>/.exec(markup);
  await navigator.clipboard.writeText(math ? math[0] : markup);
}
