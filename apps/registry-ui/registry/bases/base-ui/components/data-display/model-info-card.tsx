import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The detail panel for one model, meant for the shipped `HoverCardContent`. The
 * consumer composes the identity header from `Item` parts (`ItemMedia` for the
 * logo, `ItemTitle` for the name, `ItemDescription` for the vendor, `ItemFooter`
 * for the mono model id) over `ModelInfoCardSection`s.
 * @example
 * <ModelInfoCard>
 *   <Item size="xs" className="p-0">
 *     <ItemMedia><AiProviderIcon provider="openai" /></ItemMedia>
 *     <ItemContent><ItemTitle>GPT-4o</ItemTitle><ItemDescription>OpenAI</ItemDescription></ItemContent>
 *     <ItemFooter className="text-muted-foreground font-mono text-xs">gpt-4o</ItemFooter>
 *   </Item>
 *   {sections}
 * </ModelInfoCard>
 */
function ModelInfoCard({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-info-card" className={cn('flex flex-col gap-3', className)} {...props} />;
}

/**
 * A titled section inside a `ModelInfoCard`. Its heading row is an `Item`
 * holding a `ModelInfoCardBadge`, an `ItemTitle` and an optional `ItemActions`
 * value, over the detail lines.
 */
function ModelInfoCardSection({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-info-card-section" className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

/**
 * The accent pill beside a section title. Its colour is the consumer's
 * background class (e.g. `bg-blue-500`); without one it is muted.
 */
function ModelInfoCardBadge({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  return (
    <span
      data-slot="model-info-card-badge"
      aria-hidden
      className={cn('bg-muted-foreground h-3.5 w-1 shrink-0 rounded-full', className)}
      {...props}
    />
  );
}

export { ModelInfoCard, ModelInfoCardBadge, ModelInfoCardSection };
