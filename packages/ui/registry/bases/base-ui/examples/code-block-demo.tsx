import type { ReactNode } from 'react';

import {
  CodeBlock,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockCopy,
  CodeBlockLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';

const SOURCE = 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}';

/** A collapsible TypeScript block with its language, a copy action and a collapse toggle. */
function CodeBlockDemo(): ReactNode {
  return (
    <CodeBlock code={SOURCE} language="ts">
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeBlockLanguage />
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CodeBlockCopy />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CodeBlockContent>
        <CodeBlockCode />
      </CodeBlockContent>
    </CodeBlock>
  );
}

export { CodeBlockDemo };
