/**
 * The `mermaid` surface's engine-free type contract. No `mermaid` type appears
 * here — the engine is loaded lazily inside `engine.ts` and never reaches a
 * public signature, so the surface's `.d.ts` stays engine-free (mirroring the
 * `document/core` engine-hiding discipline).
 */

/** The Mermaid diagram kinds the surface recognizes for its type label + templates. */
export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'pie'
  | 'mindmap'
  | 'gitGraph'
  | 'journey'
  | 'timeline'
  | 'quadrant'
  | 'unknown';

/** The outcome of a render attempt: a rendered SVG string, or a parse/render error. */
export type MermaidRenderResult =
  | { ok: true; svg: string }
  | { ok: false; error: string; line?: number };

/** Theme values passed to the engine — the active editor theme's `variant.mermaid`. */
export interface RenderThemeConfig {
  /** A built-in Mermaid theme id (`default` | `dark` | `neutral` | `forest` | `base`). */
  theme: string;
  themeVariables?: Record<string, string>;
}

/** A starter diagram offered by the surface's template picker. */
export interface DiagramTemplate {
  type: DiagramType;
  label: string;
  source: string;
}

/** The layout of `<MermaidEditor>`: side-by-side split, stacked tabs, or responsive. */
export type MermaidEditorLayout = 'split' | 'tabs' | 'auto';

/**
 * `<MermaidEditor>` props — controlled exactly like the design system's
 * `CodeEditorPane` (`value`/`defaultValue`/`onValueChange`), so a host (including
 * the in-document block) can own the source string with no adapter.
 */
export interface MermaidEditorProps {
  /** Controlled Mermaid source. Pair with `onValueChange`. */
  value?: string;
  /** Initial source (uncontrolled). */
  defaultValue?: string;
  /** Fired with the full source on every edit. */
  onValueChange?: (source: string) => void;
  /** Render read-only — the source pane is not editable. */
  readOnly?: boolean;
  /** Split ≥ md, tabs < md when `auto` (default). */
  layout?: MermaidEditorLayout;
  /** Hide the toolbar (type/template + export). */
  toolbar?: boolean;
  /** External layout only. */
  className?: string;
}
