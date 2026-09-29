'use client';

import {
  CodeBlock,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { useMermaidRender } from './use-mermaid-render.js';

export interface DiagramViewerProps {
  /** The Mermaid source to render. */
  source: string;
  /** External layout only. */
  className?: string;
}

/**
 * Read-only diagram render — no pan/zoom chrome, no controls. SSR-safe: the
 * first paint (and any environment without a live DOM) renders the readable
 * source through the design-system read-only `CodeBlock` (Shiki-highlighted,
 * copyable), and the client render effect swaps in the rendered SVG once mounted.
 * Used by the in-document block's read-only viewer.
 */
export function DiagramViewer({ source, className }: DiagramViewerProps) {
  const { svg, status } = useMermaidRender(source);

  if (status === 'ok' && svg) {
    return (
      <div
        data-slot="diagram-viewer"
        className={cn('flex justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full', className)}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <CodeBlock code={source} language="mermaid" className={className}>
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeBlockLanguage />
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CodeBlockCopy />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
    </CodeBlock>
  );
}
