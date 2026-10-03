import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The detail panel for one model, meant for the shipped `HoverCardContent`. The
 * consumer composes the identity header from `Item` parts (`ItemMedia` for the
 * logo, `ItemTitle` for the name, `ItemDescription` for the vendor, `ItemFooter`
 * for the model id) over `ModelInfoCardSection`s.
 * @example
 * <ModelInfoCard>
 *   <Item size="xs">
 *     <ItemMedia><AiProviderIcon provider="openai" /></ItemMedia>
 *     <ItemContent><ItemTitle>GPT-4o</ItemTitle><ItemDescription>OpenAI</ItemDescription></ItemContent>
 *     <ItemFooter><code className="text-muted-foreground text-xs">gpt-4o</code></ItemFooter>
 *   </Item>
 *   {sections}
 * </ModelInfoCard>
 */
function ModelInfoCard({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-info-card" className={cn('flex flex-col gap-3', className)} {...props} />;
}

/**
 * A titled section inside a `ModelInfoCard`. Its heading row is an `Item`
 * holding an `ItemMedia` with a `ModelInfoCardIndicator`, an `ItemTitle` and an
 * optional `ItemActions` value, over the detail lines:
 *
 *   <ModelInfoCardSection>
 *     <Item size="xs">
 *       <ItemMedia><ModelInfoCardIndicator tone="chart-2" /></ItemMedia>
 *       <ItemContent><ItemTitle>Context length</ItemTitle></ItemContent>
 *       <ItemActions>128K tokens</ItemActions>
 *     </Item>
 *   </ModelInfoCardSection>
 */
function ModelInfoCardSection({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="model-info-card-section" className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

const modelInfoCardIndicatorVariants = cva('h-3.5 w-1 shrink-0 rounded-full', {
  variants: {
    tone: {
      muted: 'bg-muted-foreground',
      'chart-1': 'bg-chart-1',
      'chart-2': 'bg-chart-2',
      'chart-3': 'bg-chart-3',
      'chart-4': 'bg-chart-4',
      'chart-5': 'bg-chart-5',
    },
  },
  defaultVariants: { tone: 'muted' },
});

type ModelInfoCardIndicatorProps = React.ComponentProps<'span'> & VariantProps<typeof modelInfoCardIndicatorVariants>;

/** The accent bar beside a section title, in one of the theme's chart colours; `muted` when no `tone` is given. */
function ModelInfoCardIndicator({ tone, className, ...props }: ModelInfoCardIndicatorProps): React.ReactNode {
  return (
    <span
      data-slot="model-info-card-indicator"
      aria-hidden
      className={cn(modelInfoCardIndicatorVariants({ tone }), className)}
      {...props}
    />
  );
}

export { ModelInfoCard, ModelInfoCardIndicator, ModelInfoCardSection };
export type { ModelInfoCardIndicatorProps };
