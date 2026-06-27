import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { SearchInput } from '@zeroxsolutions/ui/search-input';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@zeroxsolutions/ui/sidebar';
import {
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
} from '@zeroxsolutions/ui/sidebar-menu-collapsible';
import { MessageSquareIcon, SlidersHorizontalIcon } from 'lucide-react';

/**
 * `SidebarMenuCollapsible` is a disclosure section for use inside a
 * `SidebarMenu`: its trigger renders as a `SidebarMenuButton` with an
 * auto-rotating chevron, and its content panel holds the nested rows. It renders
 * as a `SidebarMenuItem` (`<li>`), so it must live within a `SidebarMenu`, and is
 * driven by the `open` / `onOpenChange` pair (or uncontrolled via `defaultOpen`).
 * The label and rows come from `children`; indent nested lists with `pl-3.5` and
 * render any above-list content (such as a search field) before the list.
 */
const meta: Meta<typeof SidebarMenuCollapsible> = {
  title: 'Components/SidebarMenuCollapsible',
  component: SidebarMenuCollapsible,
};
export default meta;

type Story = StoryObj<typeof SidebarMenuCollapsible>;

const topics = ['Pricing page copy', 'Onboarding flow', 'Q3 launch plan'];

/** The bordered rail shell every story shares. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="h-[480px] w-64 overflow-hidden rounded-lg border">
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu className="gap-1">{children}</SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}

/** Topics: a header action + above-list search + rows. */
function TopicsSection({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <SidebarMenuCollapsible defaultOpen={defaultOpen}>
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
  );
}

/** Tasks: an honest empty state. */
function TasksSection({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <SidebarMenuCollapsible defaultOpen={defaultOpen}>
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
  );
}

/** A realistic mix — one section open, one closed. */
export const Default: Story = {
  render: () => (
    <Frame>
      <TopicsSection defaultOpen />
      <TasksSection />
    </Frame>
  ),
};

/** Both sections open — inspect the expanded chevron + content at a glance. */
export const Expanded: Story = {
  name: 'All expanded',
  render: () => (
    <Frame>
      <TopicsSection defaultOpen />
      <TasksSection defaultOpen />
    </Frame>
  ),
};

/** Both sections closed — inspect the collapsed chevron + headers only. */
export const Collapsed: Story = {
  name: 'All collapsed',
  render: () => (
    <Frame>
      <TopicsSection />
      <TasksSection />
    </Frame>
  ),
};
