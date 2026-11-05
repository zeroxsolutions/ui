import type { ReactNode } from 'react';

import {
  CodeCard,
  CodeCardCode,
  CodeCardContent,
  CodeCardCopy,
  CodeCardLanguage,
} from '@/registry/bases/base-ui/components/data-display/code-card';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';

const SOURCE = 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}';

/** A collapsible TypeScript block with its language, a copy action and a collapse toggle. */
function CodeCardDemo(): ReactNode {
  return (
    <CodeCard code={SOURCE} language="ts">
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>
          <CodeCardLanguage />
        </CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CodeCardCopy />
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CodeCardContent>
        <CodeCardCode />
      </CodeCardContent>
    </CodeCard>
  );
}

export { CodeCardDemo };
