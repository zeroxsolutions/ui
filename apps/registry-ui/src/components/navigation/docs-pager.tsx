import { findNeighbour, type Root } from 'fumadocs-core/page-tree';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';

interface DocsPagerProps extends ComponentProps<'nav'> {
  /** The docs page tree, read in order across its folders. */
  tree: Root;
  /** The current page's URL. */
  url: string;
}

/** Links to the page before and the page after the current one. Renders nothing for a page with neither. */
function DocsPager({ tree, url, className, ...props }: DocsPagerProps): ReactNode {
  const { previous, next } = findNeighbour(tree, url);
  if (!previous && !next) return null;

  return (
    <nav aria-label="Pager" className={cn('flex items-center justify-between gap-2', className)} {...props}>
      {previous ? (
        <Link href={previous.url} rel="prev" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
          <ArrowLeftIcon data-icon="inline-start" />
          <span className="sr-only">Previous: </span>
          {previous.name}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.url} rel="next" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
          <span className="sr-only">Next: </span>
          {next.name}
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      ) : null}
    </nav>
  );
}

export { DocsPager };
