import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@zeroxsolutions/ui/sidebar';
import {
  SidebarGroupCollapsible,
  SidebarGroupCollapsibleContent,
  SidebarGroupCollapsibleTrigger,
} from '@zeroxsolutions/ui/sidebar-group-collapsible';
import { FolderIcon, UserIcon } from 'lucide-react';

/**
 * `SidebarGroupCollapsible` is a group-level disclosure for a sidebar: its trigger
 * is a full-width `SidebarGroupLabel` with a trailing rotating chevron, and its
 * content holds the group body. It is the section-header counterpart to a
 * collapsible menu row; wrap it in a `SidebarGroup` and drive it with
 * `defaultOpen` or the controlled `open` / `onOpenChange` pair.
 */
const meta: Meta<typeof SidebarGroupCollapsible> = {
  title: 'Components/SidebarGroupCollapsible',
  component: SidebarGroupCollapsible,
};
export default meta;

type Story = StoryObj<typeof SidebarGroupCollapsible>;

const workspaces = ['Acme', 'Globex', 'Initech'];

/** The bordered rail shell every story shares. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="h-[480px] w-64 overflow-hidden rounded-lg border">
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>{children}</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}

/** A collapsible group: a full-width header label over a menu of rows. */
function Group({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupCollapsible defaultOpen={defaultOpen}>
        <SidebarGroupCollapsibleTrigger>{label}</SidebarGroupCollapsibleTrigger>
        <SidebarGroupCollapsibleContent>
          <SidebarMenu>{children}</SidebarMenu>
        </SidebarGroupCollapsibleContent>
      </SidebarGroupCollapsible>
    </SidebarGroup>
  );
}

const workspaceRows = workspaces.map((name) => (
  <SidebarMenuItem key={name}>
    <SidebarMenuButton>
      <FolderIcon />
      <span>{name}</span>
    </SidebarMenuButton>
  </SidebarMenuItem>
));

const agentRows = (
  <SidebarMenuItem>
    <SidebarMenuButton>
      <UserIcon />
      <span>Inbox</span>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

/** A realistic mix — one group open, one closed. */
export const Default: Story = {
  render: () => (
    <Frame>
      <Group label="Workspaces" defaultOpen>
        {workspaceRows}
      </Group>
      <Group label="Agents">{agentRows}</Group>
    </Frame>
  ),
};

/** Both groups open — inspect the expanded chevron + content at a glance. */
export const Expanded: Story = {
  name: 'All expanded',
  render: () => (
    <Frame>
      <Group label="Workspaces" defaultOpen>
        {workspaceRows}
      </Group>
      <Group label="Agents" defaultOpen>
        {agentRows}
      </Group>
    </Frame>
  ),
};

/** Both groups closed — inspect the collapsed chevron + headers only. */
export const Collapsed: Story = {
  name: 'All collapsed',
  render: () => (
    <Frame>
      <Group label="Workspaces">{workspaceRows}</Group>
      <Group label="Agents">{agentRows}</Group>
    </Frame>
  ),
};
