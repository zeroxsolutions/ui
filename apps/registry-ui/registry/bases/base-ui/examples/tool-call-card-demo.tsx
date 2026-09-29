import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { CodeBlock } from '@/registry/bases/base-ui/components/data-display/code-block';
import {
  ToolCallCard,
  ToolCallCardContent,
  ToolCallCardDescription,
  ToolCallCardSection,
  ToolCallCardSectionTitle,
  ToolCallCardStatus,
  ToolCallCardTitle,
  ToolCallCardTrigger,
} from '@/registry/bases/base-ui/components/layout/tool-call-card';

const PARAMETERS = JSON.stringify({ query: 'design system tokens', limit: 5 }, null, 2);

/** A completed search call, its parameters shown under the trigger. */
function ToolCallCardDemo(): ReactNode {
  return (
    <ToolCallCard state="output-available" defaultOpen className="w-full max-w-md">
      <ToolCallCardTrigger>
        <Search />
        <ToolCallCardTitle>search</ToolCallCardTitle>
        <ToolCallCardDescription>5 results</ToolCallCardDescription>
        <ToolCallCardStatus>Completed</ToolCallCardStatus>
      </ToolCallCardTrigger>
      <ToolCallCardContent>
        <ToolCallCardSection>
          <ToolCallCardSectionTitle>Parameters</ToolCallCardSectionTitle>
          <CodeBlock code={PARAMETERS} language="json" />
        </ToolCallCardSection>
      </ToolCallCardContent>
    </ToolCallCard>
  );
}

export { ToolCallCardDemo };
