'use client';

import type { ComponentProps, ReactNode } from 'react';

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

interface SourceCodeBlockProps extends ComponentProps<typeof CodeBlock> {
  /** What the header names beside the language, such as the file's name. */
  children?: ReactNode;
  /** Adds the card's own trigger, so a long file can be folded away. */
  collapsible?: boolean;
}

/**
 * The registry's `CodeBlock` headed as upstream's code figure is: the language's icon and name, the
 * block's children (a file's name) beside them, and the copy button at the header's end, outside the
 * code's scroller. Highlighting arrives as `lines`, tokenized at build, so nothing highlights in the
 * browser. The client boundary the block's hooks need on a server-rendered page.
 */
function SourceCodeBlock({ children, collapsible = false, ...props }: SourceCodeBlockProps): ReactNode {
  return (
    <CodeBlock data-not-typeset {...props}>
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeBlockLanguage />
          {children ? <span className="text-foreground min-w-0 truncate font-mono text-xs">{children}</span> : null}
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CodeBlockCopy />
          {collapsible ? <CollapsibleCardTrigger /> : null}
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
    </CodeBlock>
  );
}

export { SourceCodeBlock };
