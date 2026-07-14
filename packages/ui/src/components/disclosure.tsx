import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * `Disclosure` — the house collapsible-block compound: a header (title + actions)
 * over a collapsible body, built on the Base UI `Collapsible` primitive so the
 * open/closed state rides that primitive (never a hand-rolled context). It is the
 * shared chrome many block surfaces compose so their header never drifts — the
 * read-only `CodeBlock`, the editor's editable code-block, the chat
 * `reasoning`/`tool` panels, and the Mermaid header — filling its parts rather
 * than re-implementing a header. Author a new block by composing the parts, not by
 * passing slots as props (see `ui-compound-authoring`).
 *
 * Parts: `Disclosure` (root) · `DisclosureHeader` · `DisclosureTitle` ·
 * `DisclosureActions` · `DisclosureTrigger` (the collapse toggle) ·
 * `DisclosureContent` (the collapsible body). Defaults open.
 */
const disclosureVariants = cva(
  'group/disclosure flex w-full flex-col overflow-hidden text-sm',
  {
    variants: {
      variant: {
        default: 'rounded-md border border-border bg-card text-card-foreground',
        // Borderless muted surface — delineated by the fill, not a border, so a
        // block nested inside another card doesn't stack border-inside-border.
        muted: 'rounded-md bg-muted/50',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Disclosure({
  className,
  variant,
  defaultOpen = true,
  ...props
}: CollapsiblePrimitive.Root.Props & VariantProps<typeof disclosureVariants>) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="disclosure"
      defaultOpen={defaultOpen}
      className={cn(disclosureVariants({ variant, className }))}
      {...props}
    />
  );
}

function DisclosureHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="disclosure-header"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 has-data-[slot=disclosure-actions]:justify-between',
        className,
      )}
      {...props}
    />
  );
}

function DisclosureTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="disclosure-title"
      // Auto-size icons placed *directly* in the title — a child combinator, not a
      // descendant one, so a nested component's own icons (a LanguageSwitcher or
      // Combobox trigger the title may hold) keep their own sizing instead of being
      // overridden. Mirrors how Button/Badge size their descendant svgs, so a title
      // icon is a bare `<Icon />` with no per-consumer size class.
      className={cn(
        "flex min-w-0 items-center gap-1.5 font-medium text-muted-foreground [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function DisclosureActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="disclosure-actions"
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  );
}

function DisclosureTrigger({
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="disclosure-trigger"
      aria-label="Toggle"
      render={<Button variant="ghost" size="icon-sm" />}
      className={cn('group/disclosure-trigger text-muted-foreground', className)}
      {...props}
    >
      <ChevronDown className="transition-transform group-aria-expanded/disclosure-trigger:rotate-180" />
    </CollapsiblePrimitive.Trigger>
  );
}

function DisclosureContent({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="disclosure-content"
      className={cn('overflow-hidden', className)}
      {...props}
    />
  );
}

export {
  Disclosure,
  DisclosureHeader,
  DisclosureTitle,
  DisclosureActions,
  DisclosureTrigger,
  DisclosureContent,
  disclosureVariants,
};
