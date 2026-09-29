import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * A header over a collapsible body, open by default. Compose
 * `CollapsibleCardHeader` (holding `CollapsibleCardTitle` and
 * `CollapsibleCardActions`, where `CollapsibleCardTrigger` usually sits) above
 * `CollapsibleCardContent`. `variant` picks the surface: `default` a bordered
 * card, `muted` a borderless fill for a block nested in another card, `plain` no
 * surface and a rule underneath, for a titled group of rows in a panel.
 */
const collapsibleCardVariants = cva('group/collapsible-card flex w-full flex-col overflow-hidden text-sm', {
  variants: {
    variant: {
      default: 'rounded-md border border-border bg-card text-card-foreground',
      muted: 'rounded-md bg-muted/50',
      plain: 'border-b border-border',
    },
  },
  defaultVariants: { variant: 'default' },
});

type CollapsibleCardProps = ComponentProps<typeof Collapsible> & VariantProps<typeof collapsibleCardVariants>;

function CollapsibleCard({
  className,
  variant = 'default',
  defaultOpen = true,
  ...props
}: CollapsibleCardProps): ReactNode {
  return (
    <Collapsible
      data-slot="collapsible-card"
      data-variant={variant}
      defaultOpen={defaultOpen}
      className={cn(collapsibleCardVariants({ variant }), className)}
      {...props}
    />
  );
}

function CollapsibleCardHeader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="collapsible-card-header"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 group-data-[variant=plain]/collapsible-card:px-2.5 has-data-[slot=collapsible-card-actions]:justify-between',
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleCardTitle({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="collapsible-card-title"
      // A child combinator, so an icon inside a nested control the title holds
      // (a combobox trigger) keeps its own size.
      className={cn(
        "text-muted-foreground flex min-w-0 items-center gap-1.5 font-medium [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleCardActions({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="collapsible-card-actions" className={cn('flex items-center gap-0.5', className)} {...props} />;
}

function CollapsibleCardTrigger({
  className,
  children = <ChevronDown className="transition-transform group-aria-expanded/collapsible-card-trigger:rotate-180" />,
  ...props
}: ComponentProps<typeof CollapsibleTrigger>): ReactNode {
  return (
    <CollapsibleTrigger
      data-slot="collapsible-card-trigger"
      aria-label="Toggle"
      render={<Button variant="ghost" size="icon" />}
      className={cn('group/collapsible-card-trigger text-muted-foreground', className)}
      {...props}
    >
      {children}
    </CollapsibleTrigger>
  );
}

function CollapsibleCardContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent data-slot="collapsible-card-content" className={cn('overflow-hidden', className)} {...props} />
  );
}

export {
  CollapsibleCard,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardActions,
  CollapsibleCardTrigger,
  CollapsibleCardContent,
  collapsibleCardVariants,
};
export type { CollapsibleCardProps };
