import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@chiselart/ui';
import { HomeIcon, InboxIcon, SearchIcon, SettingsIcon } from 'lucide-react';

const meta: Meta<typeof Sidebar> = {
  title: 'Primitives/Sidebar',
  component: Sidebar,
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

const items = [
  { title: 'Home', icon: HomeIcon },
  { title: 'Inbox', icon: InboxIcon },
  { title: 'Search', icon: SearchIcon },
  { title: 'Settings', icon: SettingsIcon },
];

export const Default: Story = {
  render: () => (
    <div className="h-[480px] w-full overflow-hidden rounded-lg border">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="px-4 py-3 text-sm font-medium">
            Chisel
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton>
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-4 py-3 text-xs text-muted-foreground">
            v1.0.0
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">Dashboard</span>
          </header>
          <main className="p-4 text-sm text-muted-foreground">
            Main content area. Use the trigger to toggle the sidebar.
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  ),
};
