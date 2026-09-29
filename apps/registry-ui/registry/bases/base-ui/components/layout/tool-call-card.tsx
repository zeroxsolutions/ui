import { CheckCircle2, ChevronDown, Circle, Clock, XCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * ToolCallCard - one tool invocation in a chat transcript: a trigger row over
 * collapsible sections. The host maps its dispatcher lifecycle onto `state`
 * (pending, running, completed, error), which the root carries as
 * `data-state`; `ToolCallCardStatus` picks its icon from it. Every word is the
 * consumer's:
 *
 *   <ToolCallCard state="output-available">
 *     <ToolCallCardTrigger>
 *       <Wrench />
 *       <ToolCallCardTitle>search</ToolCallCardTitle>
 *       <ToolCallCardDescription>3 results</ToolCallCardDescription>
 *       <ToolCallCardStatus>Completed</ToolCallCardStatus>
 *     </ToolCallCardTrigger>
 *     <ToolCallCardContent>
 *       <ToolCallCardSection>
 *         <ToolCallCardSectionTitle>Parameters</ToolCallCardSectionTitle>
 *         <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
 *       </ToolCallCardSection>
 *     </ToolCallCardContent>
 *   </ToolCallCard>
 */
type ToolCallCardState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error';

interface ToolCallCardProps extends ComponentProps<typeof Collapsible> {
  /** Where the call is in its lifecycle; set on the root as `data-state`. */
  state: ToolCallCardState;
}

function ToolCallCard({ state, className, ...props }: ToolCallCardProps): ReactNode {
  return (
    <Collapsible
      data-slot="tool-call-card"
      data-state={state}
      className={cn('group/tool-call-card bg-muted w-full overflow-hidden rounded-md', className)}
      {...props}
    />
  );
}

/** The header row that toggles the sections; a leading svg child is sized and muted as the tool's icon. */
function ToolCallCardTrigger({ className, children, ...props }: ComponentProps<typeof CollapsibleTrigger>): ReactNode {
  return (
    <CollapsibleTrigger
      data-slot="tool-call-card-trigger"
      className={cn(
        'group/tool-call-card-trigger [&>svg:first-child]:text-muted-foreground flex w-full items-center gap-2 px-3 py-2 text-left [&>svg:first-child]:size-3.5 [&>svg:first-child]:shrink-0',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden
        className="text-muted-foreground size-4 shrink-0 transition-transform group-aria-expanded/tool-call-card-trigger:rotate-180"
      />
    </CollapsibleTrigger>
  );
}

function ToolCallCardTitle({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return <span data-slot="tool-call-card-title" className={cn('shrink-0 text-sm font-medium', className)} {...props} />;
}

/** A one-line summary of the call, truncated to the row. */
function ToolCallCardDescription({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="tool-call-card-description"
      className={cn('text-muted-foreground min-w-0 flex-1 truncate text-xs', className)}
      {...props}
    />
  );
}

/** The status badge: its children are the word, its icon follows the root's `data-state`. */
function ToolCallCardStatus({ className, children, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <Badge
      variant="secondary"
      render={<span data-slot="tool-call-card-status" />}
      className={cn('ml-auto rounded-full', className)}
      {...props}
    >
      <Circle aria-hidden className="hidden group-data-[state=input-streaming]/tool-call-card:block" />
      <Clock aria-hidden className="hidden animate-pulse group-data-[state=input-available]/tool-call-card:block" />
      <CheckCircle2
        aria-hidden
        className="text-success hidden group-data-[state=output-available]/tool-call-card:block"
      />
      <XCircle aria-hidden className="text-destructive hidden group-data-[state=output-error]/tool-call-card:block" />
      {children}
    </Badge>
  );
}

function ToolCallCardContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent
      data-slot="tool-call-card-content"
      className={cn('text-popover-foreground flex flex-col gap-3 border-t p-3', className)}
      {...props}
    />
  );
}

/** One labelled block of the call, such as its parameters, its result or its error. */
function ToolCallCardSection({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div data-slot="tool-call-card-section" className={cn('flex min-w-0 flex-col gap-1.5', className)} {...props} />
  );
}

function ToolCallCardSectionTitle({ className, ...props }: ComponentProps<'h4'>): ReactNode {
  return (
    <h4
      data-slot="tool-call-card-section-title"
      className={cn('text-muted-foreground text-xs font-medium', className)}
      {...props}
    />
  );
}

export {
  ToolCallCard,
  ToolCallCardTrigger,
  ToolCallCardTitle,
  ToolCallCardDescription,
  ToolCallCardStatus,
  ToolCallCardContent,
  ToolCallCardSection,
  ToolCallCardSectionTitle,
};
export type { ToolCallCardState, ToolCallCardProps };
