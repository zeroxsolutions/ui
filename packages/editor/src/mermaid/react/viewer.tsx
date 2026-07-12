'use client';

import { cn } from '@zeroxsolutions/ui/lib/utils';
import { useMermaidRender } from './use-mermaid-render.js';

export interface DiagramViewerProps {
  /** The Mermaid source to render. */
  source: string;
  /** External layout only. */
  className?: string;
}

/**
 * Read-only diagram render — no pan/zoom chrome, no controls. SSR-safe: the
 * first paint (and any environment without a live DOM) emits the readable source
 * in a `pre.mermaid`, and the client render effect swaps in the rendered SVG once
 * mounted. Used by the in-document block's read-only viewer.
 */
export function DiagramViewer({ source, className }: DiagramViewerProps) {
  const { svg, status } = useMermaidRender(source);

  if (status === 'ok' && svg) {
    return (
      <div
        data-slot="diagram-viewer"
        className={cn(
          'flex justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full',
          className,
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <pre
      className={cn(
        'mermaid overflow-x-auto rounded-md border bg-card p-4 text-sm',
        className,
      )}
    >
      {source}
    </pre>
  );
}
