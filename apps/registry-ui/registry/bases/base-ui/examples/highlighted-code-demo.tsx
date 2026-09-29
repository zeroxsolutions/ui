import type { ReactNode } from 'react';

import { HighlightedCode } from '@/registry/bases/base-ui/components/data-display/highlighted-code';

/** Pre-tokenized lines styled with the same tokens the shared Shiki theme paints with. */
function HighlightedCodeDemo(): ReactNode {
  return (
    <pre className="bg-muted m-0 rounded-md p-3 text-xs leading-relaxed">
      <HighlightedCode
        lines={[
          [
            { content: 'function', style: { color: 'var(--code-keyword)' } },
            { content: ' greet(' },
            { content: 'name', style: { color: 'var(--code-parameter)' } },
            { content: ') {' },
          ],
          [
            { content: '  return', style: { color: 'var(--code-keyword)' } },
            { content: ' `Hello, ' },
            { content: '${name}', style: { color: 'var(--code-string-escape)' } },
            { content: '!`;', style: { color: 'var(--code-string)' } },
          ],
          [{ content: '}' }],
        ]}
      />
    </pre>
  );
}

export { HighlightedCodeDemo };
