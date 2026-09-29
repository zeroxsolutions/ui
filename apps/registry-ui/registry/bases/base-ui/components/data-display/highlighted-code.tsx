import { Fragment, type ComponentProps, type ReactNode } from 'react';

import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface HighlightedCodeProps extends ComponentProps<'code'> {
  /** Tokenized lines, as `useHighlightedLines` returns them; `null` renders `children` instead. */
  lines: HighlightLine[] | null;
}

/**
 * A mono `<code>` holding highlighted source, each styled token span in order
 * with a newline between lines. Until `lines` arrive it renders `children`, the
 * raw source, so the code is readable while the grammar loads.
 */
function HighlightedCode({ lines, className, children, ...props }: HighlightedCodeProps): ReactNode {
  return (
    <code data-slot="highlighted-code" className={cn('font-mono', className)} {...props}>
      {lines
        ? lines.map((line, i) => (
            <Fragment key={i}>
              {line.map((token, j) =>
                token.style ? (
                  <span key={j} style={token.style}>
                    {token.content}
                  </span>
                ) : (
                  <Fragment key={j}>{token.content}</Fragment>
                ),
              )}
              {i < lines.length - 1 ? '\n' : null}
            </Fragment>
          ))
        : children}
    </code>
  );
}

export { HighlightedCode };
export type { HighlightedCodeProps };
