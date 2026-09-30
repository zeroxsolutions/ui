'use client';

import { isMatch } from '@zeroxsolutions/routing';
import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { pageTreeGroups } from '@/lib/page-tree';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/registry/bases/base-ui/ui/sidebar';

interface DocsSidebarProps extends ComponentProps<typeof Sidebar> {
  /** The docs page tree; its separators and folders become the sidebar's groups. */
  tree: Root;
}

/**
 * The docs' page list, grouped as the content's `meta.json` files order it, with the current page marked.
 * It carries its own provider, whose wrapper is a full-height flex box: the sidebar never collapses, so
 * nothing outside it reads the provider, and the wrapper takes the height its container gives it.
 */
function DocsSidebar({ tree, ...props }: DocsSidebarProps): ReactNode {
  const pathname = usePathname();

  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar collapsible="none" {...props}>
        <SidebarContent>
          {pageTreeGroups(tree).map((group) => (
            <SidebarGroup key={group.pages[0]?.url}>
              {group.name ? <SidebarGroupLabel>{group.name}</SidebarGroupLabel> : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.pages.map((page) => {
                    const current = isMatch(page.url, pathname);
                    return (
                      <SidebarMenuItem key={page.url}>
                        <SidebarMenuButton
                          isActive={current}
                          render={<Link href={page.url} aria-current={current ? 'page' : undefined} />}
                        >
                          {page.name}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

export { DocsSidebar };
