'use client';

import { AnchorProvider, useActiveAnchor, type TableOfContents, type TOCItemType } from 'fumadocs-core/toc';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface DocsTocProps extends ComponentProps<'nav'> {
  /** The page's headings, as the MDX compiler lists them. */
  toc: TableOfContents;
}

/** The page's headings as in-page links, with the heading in view marked. Renders nothing for a page without one. */
function DocsToc({ toc, className, ...props }: DocsTocProps): ReactNode {
  if (toc.length === 0) return null;

  return (
    <AnchorProvider toc={toc}>
      <nav aria-label="On this page" className={cn('flex flex-col gap-2 text-sm', className)} {...props}>
        <p className="text-muted-foreground text-xs font-medium">On this page</p>
        {toc.map((item) => (
          <DocsTocLink key={item.url} item={item} />
        ))}
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
      className="text-muted-foreground hover:text-foreground data-[active=true]:text-foreground text-[0.8rem] transition-colors data-[active=true]:font-medium data-[depth=3]:pl-4 data-[depth=4]:pl-6"
    >
      {item.title}
    </a>
  );
}

export { DocsToc };
