'use client';

import { AnchorProvider, useActiveAnchor, type TableOfContents, type TOCItemType } from 'fumadocs-core/toc';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';

interface DocsTocProps extends ComponentProps<'nav'> {
  /** The page's headings, as the MDX compiler lists them. */
  toc: TableOfContents;
}

/**
 * The page's headings as in-page links, with the heading in view marked. Renders nothing for a page without one.
 * It fills the height its container gives it and scrolls its list on its own, never chaining that scroll into the page.
 */
function DocsToc({ toc, className, ...props }: DocsTocProps): ReactNode {
  if (toc.length === 0) return null;

  return (
    <AnchorProvider toc={toc}>
      <nav
        aria-label="On this page"
        className={cn('flex min-h-0 flex-col gap-2 overflow-hidden overscroll-none text-sm', className)}
        {...props}
      >
        <p className="text-muted-foreground text-xs font-medium">On this page</p>
        <ScrollArea className="min-h-0 flex-1 *:data-[slot=scroll-area-viewport]:overscroll-none">
          <div className="flex flex-col gap-2">
            {toc.map((item) => (
              <DocsTocLink key={item.url} item={item} />
            ))}
          </div>
        </ScrollArea>
      </nav>
    </AnchorProvider>
  );
}

function DocsTocLink({ item }: { item: TOCItemType }): ReactNode {
  const active = useActiveAnchor() === item.url.slice(1);

  return (
    <a
      href={item.url}
      aria-current={active ? 'location' : undefined}
      data-active={active}
      data-depth={item.depth}
      className="text-muted-foreground hover:text-foreground data-[active=true]:text-foreground transition-colors data-[active=true]:font-medium data-[depth=3]:pl-4 data-[depth=4]:pl-6"
    >
      {item.title}
    </a>
  );
}

export { DocsToc };
