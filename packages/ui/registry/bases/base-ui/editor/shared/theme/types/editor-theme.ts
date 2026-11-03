/**
 * The engine-agnostic theme contract (see the `editor-theming` spec). One theme
 * drives every surface — prose, callouts, code highlighting, diagrams, and math
 * — keyed to light/dark. It references no engine type, so it can also theme a
 * future `code` surface. The design-system's `.dark` mechanism flips the CSS
 * tokens; this contract additionally carries the JS-side theme values that
 * non-CSS sub-renderers (Shiki, Mermaid, KaTeX) need and that don't auto-flip.
 */

export type ThemeMode = 'light' | 'dark';

/** A single callout's colors (usually design-system token expressions). */
export interface CalloutPalette {
  background: string;
  border: string;
  foreground: string;
  icon: string;
}

/** Code rendering themes for the two code paths. */
export interface CodeTheme {
  /** Shiki theme name for read-only code-block highlighting. */
  shiki: string;
  /** CodeMirror theme id for the editable code pane / mermaid source. */
  codeMirror: string;
}

/** Mermaid diagram theme. */
export interface MermaidTheme {
  /** Built-in mermaid theme: `default` | `dark` | `neutral` | `forest` | `base`. */
  theme: string;
  themeVariables?: Record<string, string>;
}

/** KaTeX has no themes — only a color, which usually rides a token. */
export interface MathTheme {
  color: string;
}

/** Everything that changes between light and dark for one editor theme. */
export interface ThemeVariant {
  /** Extra class(es) applied to the editor/viewer root for prose styling. */
  proseClassName?: string;
  /** Named callout palettes (info, warning, success, danger, note, …). */
  callouts: Record<string, CalloutPalette>;
  code: CodeTheme;
  mermaid: MermaidTheme;
  math: MathTheme;
}

export interface IEditorTheme {
  name: string;
  light: ThemeVariant;
  dark: ThemeVariant;
}

/** Recursive partial for overriding a subset of theme tokens. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
