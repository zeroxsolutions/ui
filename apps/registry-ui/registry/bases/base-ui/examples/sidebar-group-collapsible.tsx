import { ChevronDownIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarProvider,
} from '@/registry/bases/base-ui/ui/sidebar';

/**
 * A collapsible group in a sidebar, as upstream's own Sidebar docs compose it:
 * https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/base/sidebar.mdx
 * ("SidebarGroup" section, base variant, read 2026-09-29).
 */
function SidebarGroupCollapsible(): ReactNode {
  return (
    <SidebarProvider>
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel render={<CollapsibleTrigger />}>
            Help
            <ChevronDownIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <p className="text-muted-foreground px-2 text-sm">Docs, changelog and support.</p>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </SidebarProvider>
  );
}

export { SidebarGroupCollapsible };
