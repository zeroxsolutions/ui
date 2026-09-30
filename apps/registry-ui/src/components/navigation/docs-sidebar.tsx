'use client';

import { isMatch } from '@zeroxsolutions/routing';
import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { isExternal, pageTreeGroups } from '@/lib/page-tree';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/registry/bases/base-ui/ui/sidebar';

interface DocsSidebarProps extends ComponentProps<typeof Sidebar> {
  /** The docs page tree; its separators and folders become the sidebar's groups. */
  tree: Root;
  /** Groups listed above the docs' own, such as the site's sections on a narrow screen. */
  children?: ReactNode;
}

/**
 * The docs' page list, grouped as the content's `meta.json` files order it, with the current page
 * marked; a link to another site is listed and never marked. Its list scrolls on its own and ends any
 * scroll chain, so wheeling past the list's end leaves the page where it is. Where it sits, and how
 * tall it is, is the caller's: `className` places the column.
 */
function DocsSidebar({ tree, children, ...props }: DocsSidebarProps): ReactNode {
  const pathname = usePathname();

  return (
    <Sidebar role="navigation" aria-label="Docs" collapsible="none" {...props}>
      <SidebarContent className="overscroll-none">
        {children}
        {pageTreeGroups(tree).map((group) => (
          <SidebarGroup key={group.pages[0]?.url}>
            {group.name ? <SidebarGroupLabel>{group.name}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.pages.map((page) => {
                  const current = !isExternal(page) && isMatch(page.url, pathname);
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
  );
}

// The vendored sidebar module carries no 'use client' (components.json has `rsc: false`), so the docs
// layout, a server component, takes the provider through this client module rather than from it directly.
export { SidebarProvider } from '@/registry/bases/base-ui/ui/sidebar';
export { DocsSidebar };
