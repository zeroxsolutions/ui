'use client';

import { isMatch } from '@zeroxsolutions/routing';
import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { DOCS_SIDEBAR_SCROLL_STORAGE_KEY } from '@/lib/docs-sidebar-scroll';
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

interface DocsSidebarScrollState {
  pathname: string;
  scrollTop: number;
}

// Storage throws where the browser refuses it (a sandboxed frame, blocked site data); the list then starts on its current item.
function readScrollState(): DocsSidebarScrollState | null {
  try {
    return JSON.parse(sessionStorage.getItem(DOCS_SIDEBAR_SCROLL_STORAGE_KEY) ?? '') as DocsSidebarScrollState;
  } catch {
    return null;
  }
}

function saveScrollState(container: HTMLElement): void {
  try {
    sessionStorage.setItem(
      DOCS_SIDEBAR_SCROLL_STORAGE_KEY,
      JSON.stringify({ pathname: location.pathname, scrollTop: container.scrollTop }),
    );
  } catch {
    // Nothing is kept; the next page's list starts on its current item instead.
  }
}

/** The marked item with the longest route, since a section also matches by prefix; of equals, the one nearest the list's middle. */
function getActiveItem(container: HTMLElement): HTMLElement | null {
  const items = container.querySelectorAll<HTMLElement>('[data-active]');
  let active: HTMLElement | null = null;
  let activePathLength = -1;
  let activeDistance = Infinity;
  const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;

  for (const item of items) {
    const link = item.querySelector<HTMLAnchorElement>('a[href]');
    const href = item.getAttribute('href') ?? link?.getAttribute('href');
    const pathLength = href?.length ?? 0;
    const itemRect = item.getBoundingClientRect();
    const distance = Math.abs(itemRect.top + itemRect.height / 2 - containerCenter);

    if (pathLength > activePathLength || (pathLength === activePathLength && distance < activeDistance)) {
      active = item;
      activePathLength = pathLength;
      activeDistance = distance;
    }
  }

  return active;
}

interface DocsSidebarProps extends ComponentProps<typeof Sidebar> {
  /** The docs page tree; its separators and folders become the sidebar's groups. */
  tree: Root;
}

/**
 * The docs' page list, grouped as the content's `meta.json` files order it, with the current page marked;
 * a link to another site is listed and never marked. The column is sticky under the header and bounded,
 * and ends any scroll chain from its list, so wheeling past the list's end leaves the page where it is.
 * The list keeps its offset across docs navigations in `sessionStorage`; on a page it has no offset for
 * it brings the current item into view. `DOCS_SIDEBAR_SCROLL_RESTORE_SCRIPT` does the same before paint.
 */
function DocsSidebar({ tree, ...props }: DocsSidebarProps): ReactNode {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const scrollState = readScrollState();
    if (scrollState?.pathname === pathname) {
      container.scrollTop = scrollState.scrollTop;
    } else {
      const active = getActiveItem(container);
      if (active) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        if (activeRect.top < containerRect.top || activeRect.bottom > containerRect.bottom) {
          container.scrollTop += activeRect.top - containerRect.top - (container.clientHeight - activeRect.height) / 2;
        }
      }
    }
    saveScrollState(container);
  }, [pathname]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const onScroll = (): void => saveScrollState(container);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Sidebar
      role="navigation"
      aria-label="Docs"
      className="sticky top-[calc(var(--header-height)+0.6rem)] z-30 hidden h-[calc(100svh-10rem)] overflow-hidden overscroll-none bg-transparent [--sidebar-menu-width:--spacing(56)] lg:flex"
      collapsible="none"
      {...props}
    >
      <div className="absolute top-12 right-2 bottom-0 hidden h-full w-px bg-[linear-gradient(to_bottom,transparent_0%,var(--border)_10%,var(--border)_90%,transparent_100%)] lg:flex" />
      {/* overscroll-none here too, beyond upstream: WebKit chains a wheel past the list's end into the page otherwise. */}
      <SidebarContent
        ref={contentRef}
        data-docs-sidebar-content=""
        className="scroll-fade w-(--sidebar-menu-width) scrollbar-none overflow-x-hidden overscroll-none pl-2.5"
      >
        {pageTreeGroups(tree).map((group, index) => (
          <SidebarGroup key={group.pages[0]?.url} className={index === 0 ? 'pt-12' : undefined}>
            {group.name ? (
              <SidebarGroupLabel className="text-muted-foreground font-medium">{group.name}</SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.pages.map((page) => {
                  const current = !isExternal(page) && isMatch(page.url, pathname);
                  return (
                    <SidebarMenuItem key={page.url}>
                      <SidebarMenuButton
                        isActive={current}
                        className="data-active:border-accent data-active:bg-accent relative h-[30px] w-fit overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md"
                        render={<Link href={page.url} aria-current={current ? 'page' : undefined} />}
                      >
                        <span className="absolute inset-0 flex w-(--sidebar-menu-width) bg-transparent" />
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
