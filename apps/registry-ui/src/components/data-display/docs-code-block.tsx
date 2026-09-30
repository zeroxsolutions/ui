import type { ComponentProps, ReactNode } from 'react';

import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface DocsCodeBlockProps extends ComponentProps<'figure'> {
  /** The source a copy writes to the clipboard: the block's text as the reader sees it. */
  code: string;
}

/**
 * A highlighted `<pre>`, passed as children, with a copy button over its corner. Shiki highlights
 * it with both themes and no default colour, so each token carries only `--shiki-light` and
 * `--shiki-dark`, and this block paints it from the one the page's theme selects.
 */
function DocsCodeBlock({ code, className, children, ...props }: DocsCodeBlockProps): ReactNode {
  return (
    <figure
      data-slot="docs-code-block"
      className={cn(
        'bg-muted/50 relative overflow-hidden rounded-xl border text-sm',
        '[&_pre]:max-h-96 [&_pre]:overflow-auto [&_pre]:px-4 [&_pre]:py-3.5 [&_pre]:font-mono',
        '[&_pre_span]:text-(--shiki-light) dark:[&_pre_span]:text-(--shiki-dark)',
        className,
      )}
      {...props}
    >
      {children}
      <div className="absolute top-2 right-2">
        <CopyButton value={code} />
      </div>
    </figure>
  );
}

export { DocsCodeBlock };
