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
} from '@zeroxsolutions/ui/sidebar';
import { HomeIcon, InboxIcon, SearchIcon, SettingsIcon } from 'lucide-react';

/**
 * `Sidebar` is a collapsible application navigation panel coordinated by
 * `SidebarProvider`, which tracks open/collapsed state, persists it to a cookie,
 * and binds a toggle keyboard shortcut. On desktop it renders inline; on mobile
 * it falls back to a slide-in sheet. Compose it from a header, content groups,
 * menu, and footer, pairing it with `SidebarInset` for the main area and
 * `SidebarTrigger` to toggle it.
 */
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

/**
 * Full layout: a provider-wrapped sidebar with header, a labeled menu group, and
 * footer, alongside a `SidebarInset` main area whose `SidebarTrigger` toggles it.
 */
export const Default: Story = {
  render: () => (
    <div className="h-[480px] w-full overflow-hidden rounded-lg border">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="px-4 py-3 text-sm font-medium">
            My App
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
