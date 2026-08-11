import * as React from 'react';
import { ChevronRightIcon } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/registry/bases/base-ui/ui/collapsible';
import { SidebarGroupLabel } from '@/registry/bases/base-ui/ui/sidebar';

/**
 * A collapsible **group** in a sidebar — a group-level disclosure whose trigger
 * is a full-width `SidebarGroupLabel` with a trailing rotating chevron, and whose
 * content is the group body. The group-header counterpart to
 * `SidebarMenuCollapsible`: that one is a menu *row* (renders as a
 * `SidebarMenuItem`); this is a section *header* (renders as a
 * `SidebarGroupLabel`), so the two never collide.
 *
 * Wrap it in your own `<SidebarGroup>` (which can also hold siblings, e.g. a
 * dialog). Controlled via the `open` / `onOpenChange` triad (uncontrolled with
 * `defaultOpen`), forwarded to the underlying Base UI Collapsible. The label is
 * the consumer's `children`, never baked copy. The chevron rotates off Base UI's
 * `aria-expanded` (not the Radix `data-[state=open]`).
 *
 *   <SidebarGroup>
 *     <SidebarGroupCollapsible defaultOpen>
 *       <SidebarGroupCollapsibleTrigger>Workspaces</SidebarGroupCollapsibleTrigger>
 *       <SidebarGroupCollapsibleContent>…group body…</SidebarGroupCollapsibleContent>
 *     </SidebarGroupCollapsible>
 *   </SidebarGroup>
 */
function SidebarGroupCollapsible({
  className,
  ...props
}: React.ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible
      data-slot="sidebar-group-collapsible"
      className={className}
      {...props}
    />
  );
}

function SidebarGroupCollapsibleTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SidebarGroupLabel>) {
  return (
    <SidebarGroupLabel
      data-slot="sidebar-group-collapsible-trigger"
      render={
        <CollapsibleTrigger className="group/sidebar-group-collapsible w-full" />
      }
      className={className}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto transition-transform group-aria-expanded/sidebar-group-collapsible:rotate-90" />
    </SidebarGroupLabel>
  );
}

function SidebarGroupCollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      data-slot="sidebar-group-collapsible-content"
      {...props}
    />
  );
}

export {
  SidebarGroupCollapsible,
  SidebarGroupCollapsibleContent,
  SidebarGroupCollapsibleTrigger,
};
