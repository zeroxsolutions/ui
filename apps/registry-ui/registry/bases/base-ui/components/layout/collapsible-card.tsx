import { cva, type VariantProps } from 'class-variance-authority';
import { useRef, type ComponentProps, type ReactNode } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ChevronDownIcon, type ChevronDownIconHandle } from '@/registry/bases/base-ui/ui/chevron-down';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { cn } from '@/registry/bases/base-ui/lib/utils';

const collapsibleCardVariants = cva('group/collapsible-card flex w-full flex-col overflow-hidden text-sm', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground ring-foreground/10 rounded-xl ring-1',
      muted: 'rounded-xl bg-muted/50',
      plain: 'border-b border-border',
      flush: '',
    },
  },
  defaultVariants: { variant: 'default' },
});

type CollapsibleCardProps = ComponentProps<typeof Collapsible> & VariantProps<typeof collapsibleCardVariants>;

/**
 * A header over a collapsible body, open by default. Compose
 * `CollapsibleCardHeader` (holding `CollapsibleCardTitle` and
 * `CollapsibleCardActions`, where `CollapsibleCardTrigger` usually sits) above
 * `CollapsibleCardContent`. `variant` picks the surface, stamped on the root as
 * `data-variant`: `default` the card surface, `muted` a borderless fill for a
 * block nested in another card, `plain` no surface and a rule underneath, for a
 * titled group of rows in a panel, `flush` no surface at all, for a block filling a
 * surface its container draws. `default` and `muted` rule the body off from the
 * header, on the body, so the header keeps its height as the card opens and closes.
 */
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

/** The row above the body: a title, and the actions pushed to the far end when there are any. */
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

/** The header's muted title; a direct svg child is sized as its leading icon. */
function CollapsibleCardTitle({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="collapsible-card-title"
      // As tall as the icon button the actions hold (`size="icon"`, size-8), so the header is one
      // height whether or not it holds actions. A child combinator, so an icon inside a nested
      // control the title holds (a combobox trigger) keeps its own size.
      className={cn(
        "text-muted-foreground flex h-8 min-w-0 items-center gap-1.5 font-medium [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/** The header's trailing controls, such as a copy button and the `CollapsibleCardTrigger`. */
function CollapsibleCardActions({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="collapsible-card-actions" className={cn('flex items-center gap-0.5', className)} {...props} />;
}

/**
 * The ghost icon button that opens and closes the body. With no `children` it
 * shows a chevron that turns over while the body is open and plays while the
 * button is hovered or focused, and is named "Toggle content" unless an
 * `aria-label` is given; `children` replace the chevron and name the button.
 */
function CollapsibleCardTrigger({
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
    <CollapsibleTrigger
      data-slot="collapsible-card-trigger"
      aria-label={children === undefined || children === null ? 'Toggle content' : undefined}
      render={<Button variant="ghost" size="icon" />}
      className={cn('group/collapsible-card-trigger', className)}
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
      {children ?? (
        <ChevronDownIcon
          ref={iconRef}
          aria-hidden
          className="group-aria-expanded/collapsible-card-trigger:rotate-180 motion-safe:transition-transform"
        />
      )}
    </CollapsibleTrigger>
  );
}

/** The body that the trigger opens and closes; unmounted while closed. */
function CollapsibleCardContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return (
    <CollapsibleContent
      data-slot="collapsible-card-content"
      className={cn(
        'overflow-hidden group-data-[variant=default]/collapsible-card:border-t group-data-[variant=muted]/collapsible-card:border-t',
        className,
      )}
      {...props}
    />
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
