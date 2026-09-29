import { ChevronRightIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from '@/registry/bases/base-ui/ui/sidebar';

/**
 * A collapsible section inside a sidebar menu, as upstream's own Sidebar docs
 * compose it:
 * https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/blocks/sidebar-07/components/nav-main.tsx
 * (`nav-main.tsx`, base variant, read 2026-09-29). The `tooltip` prop `nav-main`
 * passes to `SidebarMenuButton` is specific to that block's icon-collapsed
 * sidebar and is left out here.
 */
function SidebarMenuCollapsible(): ReactNode {
  return (
    <SidebarProvider>
      <SidebarMenu>
        <Collapsible defaultOpen className="group/collapsible" render={<SidebarMenuItem />}>
          <CollapsibleTrigger render={<SidebarMenuButton />}>
            <span>Topics</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#">Getting started</SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton href="#">Installation</SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarProvider>
  );
}

export { SidebarMenuCollapsible };
