'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { pageTreeGroups } from '@/lib/page-tree';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';

/** The docs' page list behind a menu button, for a screen too narrow for the sidebar. A link closes it. */
function MobileNav({ tree }: { tree: Root }): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" />}>
        <MenuIcon />
        <span className="sr-only">Menu</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-(--available-height) w-64 overflow-y-auto">
        <nav aria-label="Docs" className="flex flex-col gap-4">
          {pageTreeGroups(tree).map((group) => (
            <div key={group.pages[0]?.url} className="flex flex-col gap-1">
              {group.name ? <p className="text-muted-foreground text-xs font-medium">{group.name}</p> : null}
              {group.pages.map((page) => (
                <Link key={page.url} href={page.url} onClick={() => setOpen(false)} className="py-1 font-medium">
                  {page.name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </PopoverContent>
    </Popover>
  );
}

export { MobileNav };
