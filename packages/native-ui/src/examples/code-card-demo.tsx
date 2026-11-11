import type { ReactNode } from 'react';

import {
  CodeCard,
  CodeCardCode,
  CodeCardContent,
  CodeCardCopy,
  CodeCardLanguage,
} from '@/components/data-display/code-card';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/components/layout/collapsible-card';

const SOURCE = 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}';

/** A collapsible TypeScript block with its language, a copy action and a collapse toggle. */
function CodeCardDemo(): ReactNode {
  return (
    <CodeCard code={SOURCE} language="ts" className="w-full max-w-sm">
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
