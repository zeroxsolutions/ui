'use client';

import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type MouseEvent, type ReactNode } from 'react';

import { DocsSidebar } from '@/components/navigation/docs-sidebar';
import { useIconAnimation } from '@/hooks/use-icon-animation';
import { currentSiteNavItem } from '@/lib/site-nav';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { MenuIcon, type MenuIconHandle } from '@/registry/bases/base-ui/icons/menu-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/registry/bases/base-ui/ui/sheet';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/registry/bases/base-ui/ui/sidebar';
import type { SiteNavItem } from '@/types/site-nav-item';

interface MobileNavProps {
  /** The docs page tree, listed group by group under the site's sections. */
  tree: Root;
  items: SiteNavItem[];
}

/**
 * The site's sections and the docs' pages in a sheet from the left, behind a `Menu` button, for a
 * screen too narrow for the header's nav and the sidebar. Following a link closes it. The button's
 * icon plays on its hover or focus.
 */
function MobileNav({ tree, items }: MobileNavProps): ReactNode {
  const pathname = usePathname();
  const current = currentSiteNavItem(items, pathname);
  const [open, setOpen] = useState(false);
  const menuIcon = useIconAnimation<MenuIconHandle>();

  const closeOnLink = (event: MouseEvent<HTMLElement>): void => {
    if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" {...menuIcon.handlers} />}>
        <MenuIcon ref={menuIcon.ref} />
        Menu
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <SidebarProvider className="min-h-0 flex-1">
          <DocsSidebar
            tree={tree}
            className="w-full"
            onClick={closeOnLink}
            // The docs layout's own sidebar keeps the "docs-sidebar-active" name; this sheet copy can be
            // mounted at the same time, below the breakpoint where that sidebar is only CSS-hidden.
            activeViewTransition={false}
          >
            <SidebarGroup>
              <SidebarGroupLabel>Sections</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={item === current}
                        render={<Link href={item.href} aria-current={item === current ? 'page' : undefined} />}
                      >
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </DocsSidebar>
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}

export { MobileNav };
