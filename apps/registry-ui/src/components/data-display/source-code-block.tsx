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
  /** Adds the copy button at the header's end; on by default. */
  copyable?: boolean;
}

/**
 * The registry's `CodeBlock` with a header: the language's icon and its id as the fence spells it
 * (`tsx`, `bash`), the block's children (a file's name) beside them, and the copy button at the
 * header's end, outside the code's scroller. The client boundary the block's hooks need on a
 * server-rendered page.
 */
function SourceCodeBlock({
  children,
  collapsible = false,
  copyable = true,
  ...props
}: SourceCodeBlockProps): ReactNode {
  return (
    <CodeBlock data-not-typeset {...props}>
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeBlockLanguage>{props.language}</CodeBlockLanguage>
          {children ? <span className="min-w-0 truncate font-mono">{children}</span> : null}
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          {copyable ? <CodeBlockCopy /> : null}
          {collapsible ? <CollapsibleCardTrigger /> : null}
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
    </CodeBlock>
  );
}

export { SourceCodeBlock };
