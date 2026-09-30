'use client';

import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';

import { pageTreeGroups } from '@/lib/page-tree';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { MenuIcon, type MenuIconHandle } from '@/registry/bases/base-ui/ui/menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import type { SiteNavItem } from '@/types/site-nav-item';

interface MobileNavProps {
  /** The docs page tree, listed group by group under the site's sections. */
  tree: Root;
  items: SiteNavItem[];
  className?: string;
}

/**
 * The site's sections and the docs' pages behind a `Menu` button, for a screen too narrow for the
 * header's nav and the sidebar. Its icon turns into a cross while the menu is open. A link closes it.
 */
function MobileNav({ tree, items, className }: MobileNavProps): ReactNode {
  const [open, setOpen] = useState(false);
  const iconRef = useRef<MenuIconHandle>(null);

  useEffect(() => {
    if (open) iconRef.current?.startAnimation();
    else iconRef.current?.stopAnimation();
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              'extend-touch-target h-8 touch-manipulation items-center justify-start gap-2.5 p-0! hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 active:bg-transparent dark:hover:bg-transparent',
              className,
            )}
          />
        }
      >
        <div className="relative flex h-8 w-4 items-center justify-center">
          <MenuIcon ref={iconRef} className="relative size-4" />
          <span className="sr-only">Toggle menu</span>
        </div>
        <span className="flex h-8 items-center text-lg leading-none font-medium">Menu</span>
      </PopoverTrigger>
      <PopoverContent
        className="no-scrollbar bg-background/90 h-(--available-height) w-(--available-width) overflow-y-auto rounded-none border-none p-0 shadow-none ring-0 backdrop-blur duration-100 data-open:animate-none!"
        align="start"
        side="bottom"
        alignOffset={-16}
        sideOffset={14}
      >
        <div className="flex flex-col gap-12 overflow-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="text-muted-foreground text-sm font-medium">Menu</div>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <MobileLink key={item.href} href={item.href} onOpenChange={setOpen}>
                  {item.label}
                </MobileLink>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-8">
            {pageTreeGroups(tree).map((group) => (
              <div key={group.pages[0]?.url} className="flex flex-col gap-4">
                {group.name ? <div className="text-muted-foreground text-sm font-medium">{group.name}</div> : null}
                <div className="flex flex-col gap-3">
                  {group.pages.map((page) => (
                    <MobileLink
                      key={page.url}
                      href={page.url}
                      onOpenChange={setOpen}
                      className="flex items-center gap-2"
                    >
                      {page.name}
                    </MobileLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface MobileLinkProps extends ComponentProps<typeof Link> {
  href: string;
  onOpenChange?: (open: boolean) => void;
}

function MobileLink({ href, onOpenChange, className, children, ...props }: MobileLinkProps): ReactNode {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href);
        onOpenChange?.(false);
      }}
      className={cn('flex items-center gap-2 text-2xl font-medium', className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export { MobileNav };
