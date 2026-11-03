import type { ReactNode } from 'react';

import {
  ToolCallCard,
  ToolCallCardContent,
  ToolCallCardDescription,
  ToolCallCardSection,
  ToolCallCardSectionTitle,
  ToolCallCardStatus,
  ToolCallCardTitle,
  ToolCallCardTrigger,
} from '@/registry/bases/base-ui/components/feedback/tool-call-card';

/** A failed search call, its error shown under the trigger. */
function ToolCallCardErrorDemo(): ReactNode {
  return (
    <ToolCallCard state="output-error" defaultOpen className="max-w-md">
      <ToolCallCardTrigger>
        <ToolCallCardTitle>search</ToolCallCardTitle>
        <ToolCallCardDescription>Request failed</ToolCallCardDescription>
        <ToolCallCardStatus>Failed</ToolCallCardStatus>
      </ToolCallCardTrigger>
      <ToolCallCardContent>
        <ToolCallCardSection>
          <ToolCallCardSectionTitle>Error</ToolCallCardSectionTitle>
          <p className="text-destructive text-sm">The search index did not respond within 10s.</p>
        </ToolCallCardSection>
      </ToolCallCardContent>
    </ToolCallCard>
  );
}

export { ToolCallCardErrorDemo };
