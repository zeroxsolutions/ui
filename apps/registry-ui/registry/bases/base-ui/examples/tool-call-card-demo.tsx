'use client';

import { useRef, type ReactNode } from 'react';

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockCopy,
} from '@/registry/bases/base-ui/components/data-display/code-block';
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
import { SearchIcon, type SearchIconHandle } from '@/registry/bases/base-ui/ui/search';

const PARAMETERS = JSON.stringify({ query: 'design system tokens', limit: 5 }, null, 2);

/**
 * A completed search call, its parameters shown under the trigger, its icon playing while the
 * trigger is hovered or focused. Narrower than `max-w-md`, because the trigger row's icon, title
 * and status never shrink, so only `ToolCallCardDescription`'s own truncate can give back the
 * width a phone-width preview stage needs.
 */
function ToolCallCardDemo(): ReactNode {
  const iconRef = useRef<SearchIconHandle>(null);

  return (
    <ToolCallCard state="output-available" defaultOpen className="max-w-60">
      <ToolCallCardTrigger
        onMouseEnter={() => iconRef.current?.startAnimation()}
        onMouseLeave={() => iconRef.current?.stopAnimation()}
        onFocus={() => iconRef.current?.startAnimation()}
        onBlur={() => iconRef.current?.stopAnimation()}
      >
        <SearchIcon ref={iconRef} aria-hidden />
        <ToolCallCardTitle>search</ToolCallCardTitle>
        <ToolCallCardDescription>5 results</ToolCallCardDescription>
        <ToolCallCardStatus>Completed</ToolCallCardStatus>
      </ToolCallCardTrigger>
      <ToolCallCardContent>
        <ToolCallCardSection>
          <ToolCallCardSectionTitle>Parameters</ToolCallCardSectionTitle>
          <CodeBlock code={PARAMETERS} language="json">
            <CodeBlockActions>
              <CodeBlockCopy variant="secondary" />
            </CodeBlockActions>
            <CodeBlockContent>
              <CodeBlockCode />
            </CodeBlockContent>
          </CodeBlock>
        </ToolCallCardSection>
      </ToolCallCardContent>
    </ToolCallCard>
  );
}

export { ToolCallCardDemo };
