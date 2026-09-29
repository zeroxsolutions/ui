'use client';

import { useState, type ReactNode } from 'react';

import { MarkdownView } from '@/registry/bases/base-ui/components/data-display/markdown-view';
import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
  useReasoningCollapsible,
} from '@/registry/bases/base-ui/components/layout/reasoning-collapsible';
import { Button } from '@/registry/bases/base-ui/ui/button';

const REASONING_TEXT = "Checking the last deploy's logs for the timeout, then narrowing it to the retry policy.";

/** The trigger's label, worded from the live reasoning state. */
function ReasoningLabel(): ReactNode {
  const { streaming, duration } = useReasoningCollapsible();
  return streaming ? 'Thinking...' : `Thought for ${duration ?? 'a few'} seconds`;
}

/** A reasoning disclosure the caller starts and stops streaming. */
function ReasoningCollapsibleDemo(): ReactNode {
  const [streaming, setStreaming] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3">
      <Button size="sm" variant="outline" className="w-fit" onClick={() => setStreaming((current) => !current)}>
        {streaming ? 'Stop stream' : 'Start stream'}
      </Button>
      <ReasoningCollapsible streaming={streaming}>
        <ReasoningCollapsibleTrigger>
          <ReasoningLabel />
        </ReasoningCollapsibleTrigger>
        <ReasoningCollapsibleContent>
          <MarkdownView>{REASONING_TEXT}</MarkdownView>
        </ReasoningCollapsibleContent>
      </ReasoningCollapsible>
    </div>
  );
}

export { ReasoningCollapsibleDemo };
