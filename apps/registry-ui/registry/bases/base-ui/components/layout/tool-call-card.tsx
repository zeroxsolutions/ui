import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { useRef, type ComponentProps, type ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Card, CardContent, CardHeader } from '@/registry/bases/base-ui/ui/card';
import { ChevronDownIcon, type ChevronDownIconHandle } from '@/registry/bases/base-ui/ui/chevron-down';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

type ToolCallCardState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error';

interface ToolCallCardProps extends ComponentProps<typeof Collapsible> {
  /** Where the call is in its lifecycle; set on the root as `data-state`. */
  state: ToolCallCardState;
}

/**
 * ToolCallCard - one tool invocation in a chat transcript, on the small card
 * surface: a trigger row over collapsible sections. The host maps its dispatcher lifecycle onto `state`
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
function ToolCallCard({ state, className, ...props }: ToolCallCardProps): ReactNode {
  return (
    <Collapsible
      data-slot="tool-call-card"
      data-state={state}
      render={<Card size="sm" />}
      className={cn('group/tool-call-card w-full', className)}
      {...props}
    />
  );
}

/**
 * The header row that toggles the sections: a full-width ghost button in the
 * card's header, holding the consumer's icon, title, description and status,
 * then a chevron that turns over while the sections are open and plays while
 * the row is hovered or focused.
 */
function ToolCallCardTrigger({
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ComponentProps<typeof CollapsibleTrigger>): ReactNode {
  const iconRef = useRef<ChevronDownIconHandle>(null);
  return (
    <CardHeader>
      <CollapsibleTrigger
        data-slot="tool-call-card-trigger"
        render={<Button variant="ghost" />}
        className={cn('group/tool-call-card-trigger w-full justify-start text-left', className)}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);
          iconRef.current?.startAnimation();
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          iconRef.current?.stopAnimation();
        }}
        onFocus={(event) => {
          onFocus?.(event);
          iconRef.current?.startAnimation();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          iconRef.current?.stopAnimation();
        }}
        {...props}
      >
        {children}
        <ChevronDownIcon
          ref={iconRef}
          aria-hidden
          className="transition-transform group-aria-expanded/tool-call-card-trigger:rotate-180"
        />
      </CollapsibleTrigger>
    </CardHeader>
  );
}

/** The tool's name, kept whole while the description beside it truncates. */
function ToolCallCardTitle({ className, ...props }: ComponentProps<'span'>): ReactNode {
  return <span data-slot="tool-call-card-title" className={cn('shrink-0', className)} {...props} />;
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
      className={cn('ml-auto', className)}
      {...props}
    >
      {/* Static lucide glyphs, not lucide-animated ones: the Badge sizes only a direct svg
          child, and an animated icon is a div around its svg, so it would render unsized. */}
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

/** The sections under the trigger, in the card's content inset; unmounted while closed. */
function ToolCallCardContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent
      data-slot="tool-call-card-content"
      render={<CardContent />}
      className={cn('flex flex-col gap-3', className)}
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

/** A section's small muted heading, such as `Parameters` or `Result`. */
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
