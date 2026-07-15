/**
 * The `math` surface's engine-free type contract. Unlike the `mermaid` surface,
 * no engine is hidden here: KaTeX renders synchronously and SSR-safe, so the
 * render seam is an ordinary function call (see `render.ts`) rather than a lazy
 * `import()`. The one discipline kept from mermaid is that the KaTeX type never
 * reaches a public signature - a render is a discriminated `MathRenderResult`
 * string, so the surface's `.d.ts` stays free of the `katex` type.
 */

/**
 * The outcome of a render attempt: the rendered KaTeX HTML markup, or a
 * parse/render error message. Discriminated on `ok` so a caller can keep the
 * last good render on failure (the mermaid non-destructive-error behavior).
 */
export type MathRenderResult =
  | { ok: true; html: string }
  | { ok: false; error: string };

/**
 * Render configuration for the surface. `displayMode` selects block (centered,
 * large) vs inline math; `color` is the themed formula color the preview
 * container applies. KaTeX has no color option - its glyphs inherit
 * `currentColor` - so `color` is applied by the React container, not passed to
 * KaTeX (see `render.ts`).
 */
export interface MathRenderConfig {
  /** `true` -> display/block math; `false` -> inline. Defaults to `true`. */
  displayMode?: boolean;
  /** Themed formula color (a CSS value, e.g. `var(--foreground)`), from `variant.math`. */
  color?: string;
}

/** A single palette symbol: a human label, the LaTeX it inserts, and a Unicode preview glyph. */
export interface MathSymbol {
  /** Human, searchable name (e.g. `Integral`). */
  label: string;
  /** ASCII LaTeX inserted at the caret (e.g. `\int`). */
  latex: string;
  /** Unicode glyph shown in the palette - content, kept exact (e.g. the integral sign). */
  preview: string;
}

/** A named, searchable group of palette symbols (Greek, Operators, ...). */
export interface MathSymbolGroup {
  /** Group heading shown in the palette (e.g. `Greek`). */
  label: string;
  /** The symbols under this heading. */
  symbols: readonly MathSymbol[];
}

/** A structural LaTeX template (fraction, matrix, ...) with an optional caret hole. */
export interface MathTemplate {
  /** Human, searchable name (e.g. `Fraction`). */
  label: string;
  /** ASCII LaTeX snippet (e.g. `\frac{}{}`). */
  latex: string;
  /**
   * Caret offset, from the start of `latex`, to land inside the first hole on
   * insertion (e.g. between the empty braces of a fraction). Omitted -> caret
   * lands at the end of the inserted snippet.
   */
  caretOffset?: number;
}

/** The layout of `<MathEditor>`: side-by-side split, stacked tabs, or responsive. */
export type MathEditorLayout = 'split' | 'tabs' | 'auto';

/**
 * `<MathEditor>` props - controlled exactly like the in-package `CodeMirrorPane`
 * (`value`/`defaultValue`/`onValueChange`), so a host (including the in-document
 * block) can own the source string with no adapter.
 */
export interface MathEditorProps {
  /** Controlled LaTeX source. Pair with `onValueChange`. */
  value?: string;
  /** Initial source (uncontrolled). */
  defaultValue?: string;
  /** Fired with the full source on every edit. */
  onValueChange?: (source: string) => void;
  /** Render read-only - the source pane is not editable. */
  readOnly?: boolean;
  /** Split >= md, tabs < md when `auto` (default). */
  layout?: MathEditorLayout;
  /** Hide the toolbar (label + palette + export). */
  toolbar?: boolean;
  /** External layout only. */
  className?: string;
}
