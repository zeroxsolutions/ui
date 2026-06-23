import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@chiselart/ui/sidebar';
import {
  SidebarGroupCollapsible,
  SidebarGroupCollapsibleContent,
  SidebarGroupCollapsibleTrigger,
} from '@chiselart/ui/sidebar-group-collapsible';
import { FolderIcon, UserIcon } from 'lucide-react';

const meta: Meta<typeof SidebarGroupCollapsible> = {
  title: 'Components/SidebarGroupCollapsible',
  component: SidebarGroupCollapsible,
};
export default meta;

type Story = StoryObj<typeof SidebarGroupCollapsible>;

const workspaces = ['Acme', 'Globex', 'Initech'];

export const Default: Story = {
  render: () => (
    <div className="h-[480px] w-64 overflow-hidden rounded-lg border">
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupCollapsible defaultOpen>
                <SidebarGroupCollapsibleTrigger>
                  Workspaces
                </SidebarGroupCollapsibleTrigger>
                <SidebarGroupCollapsibleContent>
                  <SidebarMenu>
                    {workspaces.map((name) => (
                      <SidebarMenuItem key={name}>
                        <SidebarMenuButton>
                          <FolderIcon />
                          <span>{name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupCollapsibleContent>
              </SidebarGroupCollapsible>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupCollapsible>
                <SidebarGroupCollapsibleTrigger>
                  Agents
                </SidebarGroupCollapsibleTrigger>
                <SidebarGroupCollapsibleContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <UserIcon />
                        <span>Inbox</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupCollapsibleContent>
              </SidebarGroupCollapsible>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  ),
};
