import * as React from 'react';
import { ChevronRightIcon } from 'lucide-react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/bases/base-ui/ui/collapsible';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/registry/bases/base-ui/ui/sidebar';

/**
 * A collapsible section inside a `SidebarMenu` — a disclosure whose trigger is a
 * `SidebarMenuButton` with an auto-rotating chevron, and whose content holds the
 * nested rows. Extracted from the per-app rails that each hand-rolled the same
 * `Collapsible` + `SidebarMenuItem` + chevron markup.
 *
 * Part of the `SidebarMenu*` family on purpose: it renders as a
 * `SidebarMenuItem` (a `<li>`), so it must sit inside a `SidebarMenu` and never
 * collides with the group-level `SidebarGroup*` parts. Controlled via the
 * `open` / `onOpenChange` triad (uncontrolled with `defaultOpen`), forwarded to
 * the underlying Base UI Collapsible.
 *
 * The label is the consumer's `children`, never baked copy. The content panel is
 * thin: wrap rows in your own `SidebarMenu` (indent with `pl-3.5`) and render any
 * above-list content (a search field) before it — a full-width field and an
 * indented list have different left insets, so the indent can't live on the panel.
 *
 *   <SidebarMenu>
 *     <SidebarMenuCollapsible defaultOpen>
 *       <SidebarMenuCollapsibleTrigger>
 *         <span className="truncate">Topics</span>
 *       </SidebarMenuCollapsibleTrigger>
 *       <SidebarMenuAction aria-label="Options">…</SidebarMenuAction>
 *       <SidebarMenuCollapsibleContent>
 *         <SidebarMenu className="gap-1 py-0.5 pl-3.5">{rows}</SidebarMenu>
 *       </SidebarMenuCollapsibleContent>
 *     </SidebarMenuCollapsible>
 *   </SidebarMenu>
 */
function SidebarMenuCollapsible({
  className,
  ...props
}: React.ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible
      data-slot="sidebar-menu-collapsible"
      render={<SidebarMenuItem />}
      className={className}
      {...props}
    />
  );
}

function SidebarMenuCollapsibleTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SidebarMenuButton>) {
  return (
    <CollapsibleTrigger
      data-slot="sidebar-menu-collapsible-trigger"
      render={
        <SidebarMenuButton
          className={cn(
            'group/sidebar-menu-collapsible text-xs font-medium text-muted-foreground',
            className,
          )}
          {...props}
        />
      }
    >
      <ChevronRightIcon className="transition-transform group-aria-expanded/sidebar-menu-collapsible:rotate-90" />
      {children}
    </CollapsibleTrigger>
  );
}

function SidebarMenuCollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      data-slot="sidebar-menu-collapsible-content"
      {...props}
    />
  );
}

export {
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
};
