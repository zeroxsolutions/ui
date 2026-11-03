'use client';

import { useEditorTheme } from '../../shared/theme/editor-theme-context.js';
import { renderMathHtml } from '@zeroxsolutions/editor-core/math/core/render';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * `<FormulaViewer>` - read-only formula render, no editing chrome. Unlike the
 * mermaid `DiagramViewer`, which SSR-fallbacks to a `CodeBlock` because Mermaid
 * needs a live DOM, KaTeX renders synchronously and SSR-safe: the viewer emits
 * the real formula on the first paint in any environment (leniently, so a stored
 * invalid formula still renders rather than blanking). The color rides the active
 * editor theme's `variant.math`. Used by the in-document block's read-only path.
 */
export interface FormulaViewerProps {
  /** The LaTeX source to render. */
  source: string;
  /** `true` -> display/block (`div`); `false` -> inline (`span`). Default `true`. */
  displayMode?: boolean;
  className?: string;
}

export function FormulaViewer({ source, displayMode = true, className }: FormulaViewerProps) {
  const { variant } = useEditorTheme();
  const html = renderMathHtml(source, { displayMode });

  if (displayMode) {
    return (
      <div
        data-slot="formula-viewer"
        className={cn('flex justify-center overflow-x-auto', className)}
        style={{ color: variant.math.color }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <span
      data-slot="formula-viewer"
      className={cn('inline-block align-middle', className)}
      style={{ color: variant.math.color }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
