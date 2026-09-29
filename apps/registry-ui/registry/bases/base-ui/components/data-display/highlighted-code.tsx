import { Fragment, type ReactNode } from 'react';

import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';

interface HighlightedCodeProps {
  /** Tokenized lines, as `useHighlightedLines` returns them. */
  lines: HighlightLine[];
}

/**
 * The tokens of highlighted source, each styled span in order with a newline
 * between lines. Renders no element of its own; place it inside a `<code>`.
 */
function HighlightedCode({ lines }: HighlightedCodeProps): ReactNode {
  return (
    <>
      {lines.map((line, i) => (
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
      ))}
    </>
  );
}

export { HighlightedCode };
export type { HighlightedCodeProps };
