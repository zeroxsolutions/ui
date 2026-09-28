import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * `CollapsibleCard` — the house collapsible-block compound: a header (title + actions)
 * over a collapsible body, built on the Base UI `Collapsible` primitive so the
 * open/closed state rides that primitive (never a hand-rolled context). It is the
 * shared chrome many block surfaces compose so their header never drifts — the
 * read-only `CodeBlock`, the editor's editable code-block, the chat
 * `ReasoningCollapsible`/`ToolCallCard` panels, and the Mermaid header — filling its parts rather
 * than re-implementing a header. Author a new block by composing the parts, not by
 * passing slots as props (see `ui-compound-authoring`).
 *
 * Parts: `CollapsibleCard` (root) · `CollapsibleCardHeader` · `CollapsibleCardTitle` ·
 * `CollapsibleCardActions` · `CollapsibleCardTrigger` (the collapse toggle) ·
 * `CollapsibleCardContent` (the collapsible body). Defaults open.
 */
const collapsibleCardVariants = cva('group/collapsible-card flex w-full flex-col overflow-hidden text-sm', {
  variants: {
    variant: {
      default: 'rounded-md border border-border bg-card text-card-foreground',
      // Borderless muted surface — delineated by the fill, not a border, so a
      // block nested inside another card doesn't stack border-inside-border.
      muted: 'rounded-md bg-muted/50',
    },
  },
  defaultVariants: { variant: 'default' },
});

function CollapsibleCard({
  className,
  variant,
  defaultOpen = true,
  ...props
}: CollapsiblePrimitive.Root.Props & VariantProps<typeof collapsibleCardVariants>) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible-card"
      defaultOpen={defaultOpen}
      className={cn(collapsibleCardVariants({ variant, className }))}
      {...props}
    />
  );
}

function CollapsibleCardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="collapsible-card-header"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 has-data-[slot=collapsible-card-actions]:justify-between',
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleCardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="collapsible-card-title"
      // Auto-size icons placed *directly* in the title — a child combinator, not a
      // descendant one, so a nested component's own icons (a LanguageSwitcher or
      // Combobox trigger the title may hold) keep their own sizing instead of being
      // overridden. Mirrors how Button/Badge size their descendant svgs, so a title
      // icon is a bare `<Icon />` with no per-consumer size class.
      className={cn(
        "text-muted-foreground flex min-w-0 items-center gap-1.5 font-medium [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function CollapsibleCardActions({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="collapsible-card-actions" className={cn('flex items-center gap-0.5', className)} {...props} />;
}

function CollapsibleCardTrigger({ className, ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-card-trigger"
      aria-label="Toggle"
      render={<Button variant="ghost" size="icon" />}
      className={cn('group/collapsible-card-trigger text-muted-foreground', className)}
      {...props}
    >
      {/* Default icon-button size (36px) so every control in a disclosure header
          reads at one size, even beside a segmented control with no smaller variant. */}
      <ChevronDown className="transition-transform group-aria-expanded/collapsible-card-trigger:rotate-180" />
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsibleCardContent({ className, ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-card-content"
      className={cn('overflow-hidden', className)}
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
