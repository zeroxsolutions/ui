'use client';

import { isMatch } from '@zeroxsolutions/routing';
import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { isExternal, pageTreeGroups } from '@/lib/page-tree';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';
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

/** The `sessionStorage` key holding the list's last scroll offset and the page it was read on. */
const DOCS_SIDEBAR_SCROLL_KEY = 'docs-sidebar-scroll';

interface DocsSidebarScrollState {
  pathname: string;
  scrollTop: number;
}

// Storage throws where the browser refuses it (a sandboxed frame, blocked site data); the list then starts at the top.
function readScrollState(): DocsSidebarScrollState | null {
  try {
    return JSON.parse(sessionStorage.getItem(DOCS_SIDEBAR_SCROLL_KEY) ?? '') as DocsSidebarScrollState;
  } catch {
    return null;
  }
}

function saveScrollState(viewport: HTMLElement): void {
  try {
    sessionStorage.setItem(
      DOCS_SIDEBAR_SCROLL_KEY,
      JSON.stringify({ pathname: location.pathname, scrollTop: viewport.scrollTop }),
    );
  } catch {
    // Nothing is kept; the next page's list starts on its current item instead.
  }
}

/** Scrolls `viewport` so `item` sits in its middle, when the item is outside it; the page itself does not move. */
function centreInViewport(viewport: HTMLElement, item: HTMLElement): void {
  const box = viewport.getBoundingClientRect();
  const itemBox = item.getBoundingClientRect();
  if (itemBox.top >= box.top && itemBox.bottom <= box.bottom) return;
  viewport.scrollTop += itemBox.top - box.top - (viewport.clientHeight - itemBox.height) / 2;
}

interface DocsSidebarProps extends ComponentProps<'nav'> {
  /** The docs page tree; its separators and folders become the sidebar's groups. */
  tree: Root;
}

/**
 * The docs' page list, grouped as the content's `meta.json` files order it, with the current page marked;
 * a link to another site is listed and never marked. A rail sticky under the header, as tall as
 * `--docs-rail-height` and `--sidebar-width` wide, so a `SidebarProvider` above it declares those.
 * Its list scrolls on its own, keeps its offset across docs navigations in `sessionStorage`, and on a
 * page it has no offset for brings the current item into view.
 */
function DocsSidebar({ tree, className, ...props }: DocsSidebarProps): ReactNode {
  const pathname = usePathname();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;

    const state = readScrollState();
    if (state?.pathname === pathname) {
      viewport.scrollTop = state.scrollTop;
    } else {
      const current = viewport.querySelector<HTMLElement>('[aria-current="page"]');
      if (current) centreInViewport(viewport, current);
    }
    saveScrollState(viewport);
  }, [pathname]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;

    const onScroll = (): void => saveScrollState(viewport);
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Docs"
      className={cn(
        'sticky top-(--docs-rail-top) z-30 hidden h-(--docs-rail-height) overflow-hidden overscroll-none lg:flex',
        className,
      )}
      {...props}
    >
      <Sidebar collapsible="none">
        <SidebarContent>
          <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1 *:data-[slot=scroll-area-viewport]:overscroll-none">
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
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
    </nav>
  );
}

/**
 * The provider the docs layout lays its grid on. The vendored provider carries no `'use client'`, so a
 * server layout reaches it through this module. It binds Ctrl/Cmd+B and writes the `sidebar_state` cookie,
 * which change nothing here: the docs sidebar never collapses.
 */
function DocsSidebarProvider(props: ComponentProps<typeof SidebarProvider>): ReactNode {
  return <SidebarProvider {...props} />;
}

export { DocsSidebar, DocsSidebarProvider };
