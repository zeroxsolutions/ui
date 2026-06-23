import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@chiselart/ui/sidebar';
import {
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
} from '@chiselart/ui/sidebar-menu-collapsible';
import { SearchInput } from '@chiselart/ui/search-input';
import { MessageSquareIcon, SlidersHorizontalIcon } from 'lucide-react';

const meta: Meta<typeof SidebarMenuCollapsible> = {
  title: 'Primitives/SidebarMenuCollapsible',
  component: SidebarMenuCollapsible,
};
export default meta;

type Story = StoryObj<typeof SidebarMenuCollapsible>;

const topics = ['Pricing page copy', 'Onboarding flow', 'Q3 launch plan'];

export const Default: Story = {
  render: () => (
    <div className="h-[480px] w-64 overflow-hidden rounded-lg border">
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu className="gap-1">
                {/* Open section: header action + above-list search + rows. */}
                <SidebarMenuCollapsible defaultOpen>
                  <SidebarMenuCollapsibleTrigger>
                    <span className="truncate">Topics</span>
                    <span className="ml-1 text-[11px]">{topics.length}</span>
                  </SidebarMenuCollapsibleTrigger>
                  <SidebarMenuAction aria-label="Topic display options">
                    <SlidersHorizontalIcon />
                  </SidebarMenuAction>
                  <SidebarMenuCollapsibleContent>
                    <div className="px-1 pb-1">
                      <SearchInput placeholder="Search topics" className="h-7" />
                    </div>
                    <SidebarMenu className="gap-1 py-0.5 pl-3.5">
                      {topics.map((title) => (
                        <SidebarMenuItem key={title}>
                          <SidebarMenuButton>
                            <MessageSquareIcon />
                            <span>{title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarMenuCollapsibleContent>
                </SidebarMenuCollapsible>

                {/* Collapsed section with an honest empty state. */}
                <SidebarMenuCollapsible>
                  <SidebarMenuCollapsibleTrigger>
                    <span className="truncate">Tasks</span>
                  </SidebarMenuCollapsibleTrigger>
                  <SidebarMenuCollapsibleContent>
                    <SidebarMenu className="gap-1 py-0.5 pl-3.5">
                      <SidebarMenuItem className="px-2 py-1 text-xs text-muted-foreground">
                        No tasks yet
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarMenuCollapsibleContent>
                </SidebarMenuCollapsible>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  ),
};
