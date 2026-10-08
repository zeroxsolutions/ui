import katex from 'katex';
import type { MathRenderConfig, MathRenderResult } from './types.js';

/**
 * The KaTeX render seam. KaTeX is synchronous and SSR-safe, so - unlike the
 * mermaid engine - there is no lazy `import()`, no async, and no debounce: a
 * render is an ordinary function call that runs identically on the server and the
 * client. `renderMath` catches so callers can retain the last good render; the
 * lenient `renderMathHtml` never fails and always returns markup, for the
 * read-only viewer and the static export where there is no last-good to keep.
 *
 * `color` from `MathRenderConfig` is deliberately NOT forwarded to KaTeX: KaTeX
 * has no color option and its glyphs inherit `currentColor`, so the themed color
 * is applied by the React container, not here.
 */

/**
 * Render `latex` to KaTeX HTML with `throwOnError: true`, wrapped into a
 * discriminated `MathRenderResult` - never throws - so a live-editing caller can
 * detect a parse error and keep the last good render.
 */
export function renderMath(latex: string, config: MathRenderConfig = {}): MathRenderResult {
  try {
    const html = katex.renderToString(latex, {
      throwOnError: true,
      displayMode: config.displayMode ?? true,
    });
    return { ok: true, html };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Render `latex` to a KaTeX HTML string with `throwOnError: false` - KaTeX's own
 * lenient rendering, which always returns markup (an invalid command renders in
 * its error color, never a throw). Used by the read-only viewer and the static
 * `toReact` export, which render the real formula on first paint with no
 * last-good render to fall back to.
 */
export function renderMathHtml(latex: string, config: MathRenderConfig = {}): string {
  return katex.renderToString(latex, {
    throwOnError: false,
    displayMode: config.displayMode ?? true,
  });
}
