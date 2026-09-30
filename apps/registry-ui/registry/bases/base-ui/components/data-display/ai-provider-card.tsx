import * as React from 'react';

import { Card, CardDescription } from '@/registry/bases/base-ui/ui/card';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { StatusTone } from '@/registry/bases/base-ui/types/status-tone';

interface AiProviderCardProps extends React.ComponentProps<typeof Card> {
  /** Tone of the attention note in `AiProviderCardStatus`; omit for a muted note. */
  status?: StatusTone;
}

/**
 * A tile for one AI provider in an overview grid. The consumer composes
 * `CardHeader` + `CardTitle` (brand mark and name), an `AiProviderCardDescription`,
 * a `CardFooter` holding an `AiProviderCardStatus` and an `AiProviderCardAction`,
 * and, when the tile selects, an `AiProviderCardTrigger` that covers the card.
 * Defaults to the small card size.
 */
function AiProviderCard({ status, size = 'sm', className, ...props }: AiProviderCardProps): React.ReactNode {
  return (
    <Card
      data-slot="ai-provider-card"
      data-status={status}
      size={size}
      className={cn('group/ai-provider-card relative h-full', className)}
      {...props}
    />
  );
}

/** The provider blurb, clamped to two lines. */
function AiProviderCardDescription({
  className,
  ...props
}: React.ComponentProps<typeof CardDescription>): React.ReactNode {
  return <CardDescription className={cn('line-clamp-2', className)} {...props} />;
}

/** The footer note (a model count, or an attention message), toned by the card's `status`. */
function AiProviderCardStatus({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  return (
    <span
      data-slot="ai-provider-card-status"
      className={cn(
        'text-muted-foreground group-data-[status=busy]/ai-provider-card:text-destructive group-data-[status=idle]/ai-provider-card:text-warning group-data-[status=online]/ai-provider-card:text-success truncate text-xs',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A control inside the card (e.g. a `Switch`). It stacks above the
 * `AiProviderCardTrigger`, so activating it does not select the card.
 */
function AiProviderCardAction({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="ai-provider-card-action" className={cn('relative z-20', className)} {...props} />;
}

/**
 * The button that selects the card. It covers the whole card below any
 * `AiProviderCardAction`, so the card is one keyboard stop, and draws its hover
 * and focus rings inside the card's edge; give it an `aria-label` naming the provider.
 */
function AiProviderCardTrigger({
  type = 'button',
  className,
  ...props
}: React.ComponentProps<'button'>): React.ReactNode {
  return (
    <button
      data-slot="ai-provider-card-trigger"
      type={type}
      className={cn(
        'hover:inset-ring-foreground/20 focus-visible:inset-ring-ring/50 absolute inset-0 z-10 cursor-pointer rounded-xl outline-none hover:inset-ring-1 focus-visible:inset-ring-3',
        className,
      )}
      {...props}
    />
  );
}

export { AiProviderCard, AiProviderCardAction, AiProviderCardDescription, AiProviderCardStatus, AiProviderCardTrigger };
export type { AiProviderCardProps };
