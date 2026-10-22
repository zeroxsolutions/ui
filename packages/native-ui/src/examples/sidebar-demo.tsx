import {
  AudioWaveform,
  BadgeCheck,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  Command,
  CreditCard,
  Folder,
  Forward,
  Frame,
  GalleryVerticalEnd,
  LogOut,
  Map as MapIcon,
  MoreHorizontal,
  PieChart,
  Plus,
  Settings2,
  Sparkles,
  SquareTerminal,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Text } from '@/components/ui/text';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: 'https://github.com/shadcn.png',
  },
  teams: [
    { name: 'Acme Inc', logo: GalleryVerticalEnd, plan: 'Enterprise' },
    { name: 'Acme Corp.', logo: AudioWaveform, plan: 'Startup' },
    { name: 'Evil Corp.', logo: Command, plan: 'Free' },
  ],
  navMain: [
    {
      title: 'Playground',
      icon: SquareTerminal,
      isActive: true,
      items: [{ title: 'History' }, { title: 'Starred' }, { title: 'Settings' }],
    },
    {
      title: 'Models',
      icon: Bot,
      items: [{ title: 'Genesis' }, { title: 'Explorer' }, { title: 'Quantum' }],
    },
    {
      title: 'Documentation',
      icon: BookOpen,
      items: [{ title: 'Introduction' }, { title: 'Get Started' }, { title: 'Tutorials' }, { title: 'Changelog' }],
    },
    {
      title: 'Settings',
      icon: Settings2,
      items: [{ title: 'General' }, { title: 'Team' }, { title: 'Billing' }, { title: 'Limits' }],
    },
  ],
  projects: [
    { name: 'Design Engineering', icon: Frame },
    { name: 'Sales & Marketing', icon: PieChart },
    { name: 'Travel', icon: MapIcon },
  ],
};

interface Team {
  name: string;
  logo: LucideIcon;
  plan: string;
}

function TeamSwitcher({ teams }: { teams: Team[] }): ReactNode {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = useState(teams[0]);

  if (!activeTeam) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <View className="bg-sidebar-primary aspect-square size-8 items-center justify-center rounded-lg">
                <Icon as={activeTeam.logo} className="text-sidebar-primary-foreground size-4" />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="leading-tight font-medium">
                  {activeTeam.name}
                </Text>
                <Text numberOfLines={1} className="text-xs leading-tight">
                  {activeTeam.plan}
                </Text>
              </View>
              <Icon as={ChevronsUpDown} className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56 rounded-lg" align="start" side={isMobile ? 'bottom' : 'right'}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">Teams</DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem key={team.name} onPress={() => setActiveTeam(team)} className="gap-2 p-2">
                  <View className="border-border size-6 items-center justify-center rounded-md border">
                    <Icon as={team.logo} className="size-3.5 shrink-0" />
                  </View>
                  <Text>{team.name}</Text>
                  <DropdownMenuShortcut>{'\u2318' + String(index + 1)}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 p-2">
                <View className="border-border size-6 items-center justify-center rounded-md border">
                  <Icon as={Plus} className="size-4" />
                </View>
                <Text className="text-muted-foreground font-medium">Add team</Text>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

interface NavItem {
  title: string;
  icon: LucideIcon;
  isActive?: boolean;
  items: { title: string }[];
}

function NavMainItem({ item }: { item: NavItem }): ReactNode {
  const [open, setOpen] = useState(item.isActive === true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            <Icon as={item.icon} />
            <Text numberOfLines={1}>{item.title}</Text>
            <View className="ml-auto" style={open ? { transform: [{ rotate: '90deg' }] } : undefined}>
              <Icon as={ChevronRight} />
            </View>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton>{subItem.title}</SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavMain({ items }: { items: NavItem[] }): ReactNode {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavMainItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavProjects({ projects }: { projects: { name: string; icon: LucideIcon }[] }): ReactNode {
  const { isMobile, state } = useSidebar();

  // Upstream hides the group in a rail of icons.
  if (state === 'collapsed' && !isMobile) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton>
              <Icon as={item.icon} />
              <Text numberOfLines={1}>{item.name}</Text>
            </SidebarMenuButton>
            {/* The menu is a View of its own, which the action is placed in, so it covers the item. */}
            <DropdownMenu className="absolute inset-0" pointerEvents="box-none">
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover aria-label="More">
                  <Icon as={MoreHorizontal} />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}
              >
                <DropdownMenuItem>
                  <Icon as={Folder} className="text-muted-foreground" />
                  <Text>View Project</Text>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icon as={Forward} className="text-muted-foreground" />
                  <Text>Share Project</Text>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Icon as={Trash2} className="text-muted-foreground" />
                  <Text>Delete Project</Text>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Icon as={MoreHorizontal} className="text-sidebar-foreground/70" />
            <Text className="text-sidebar-foreground/70">More</Text>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function UserAvatar({ name, avatar }: { name: string; avatar: string }): ReactNode {
  return (
    <Avatar alt={name} className="h-8 w-8 rounded-lg">
      <AvatarImage source={{ uri: avatar }} />
      <AvatarFallback className="rounded-lg">
        <Text>CN</Text>
      </AvatarFallback>
    </Avatar>
  );
}

function NavUser({ user }: { user: typeof data.user }): ReactNode {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <UserAvatar name={user.name} avatar={user.avatar} />
              <View className="flex-1">
                <Text numberOfLines={1} className="leading-tight font-medium">
                  {user.name}
                </Text>
                <Text numberOfLines={1} className="text-xs leading-tight">
                  {user.email}
                </Text>
              </View>
              <Icon as={ChevronsUpDown} className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? 'bottom' : 'right'} align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <View className="flex-row items-center gap-2 px-1 py-1.5">
                  <UserAvatar name={user.name} avatar={user.avatar} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-sm leading-tight font-medium">
                      {user.name}
                    </Text>
                    <Text numberOfLines={1} className="text-xs leading-tight">
                      {user.email}
                    </Text>
                  </View>
                </View>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon as={Sparkles} />
                <Text>Upgrade to Pro</Text>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon as={BadgeCheck} />
                <Text>Account</Text>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon as={CreditCard} />
                <Text>Billing</Text>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon as={Bell} />
                <Text>Notifications</Text>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon as={LogOut} />
                <Text>Log out</Text>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function Header(): ReactNode {
  const { state, isMobile } = useSidebar();
  return (
    <View
      className={
        state === 'collapsed' && !isMobile
          ? 'h-12 shrink-0 flex-row items-center gap-2'
          : 'h-16 shrink-0 flex-row items-center gap-2'
      }
    >
      <View className="flex-row items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
      </View>
    </View>
  );
}

function SidebarDemo(): ReactNode {
  return (
    // Upstream fills the page; the preview gives the demo a frame of its own to fill.
    <SidebarProvider className="border-border h-[560px] flex-none rounded-lg border">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <TeamSwitcher teams={data.teams} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavProjects projects={data.projects} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <Header />
      </SidebarInset>
    </SidebarProvider>
  );
}

export { SidebarDemo };
