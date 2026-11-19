'use client';

import type { Root } from 'fumadocs-core/page-tree';
import type { ComponentProps, ReactNode } from 'react';

import { useHost } from '../../../host/host-provider';
import { useAnimatedIcon } from '../../../../registry/bases/base-ui/hooks/use-animated-icon';

import { pageNeighbours } from '../../lib/page-tree';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';
import { ArrowLeftIcon } from '../../../../registry/bases/base-ui/icons/lucide/arrow-left-icon';
import { ArrowRightIcon } from '../../../../registry/bases/base-ui/icons/lucide/arrow-right-icon';
import { buttonVariants } from '../../../../registry/bases/base-ui/ui/button';

interface DocsPagerProps extends ComponentProps<'nav'> {
  /** The docs page tree, read in order across its folders. */
  tree: Root;
  /** The current page's URL. */
  url: string;
}

/**
 * Links to the page before and the page after the current one at the foot of a page,
 * stepping over a link to another site; each arrow plays on its link's hover or focus. Renders nothing
 * for a page with neither.
 */
function DocsPager({ tree, url, className, ...props }: DocsPagerProps): ReactNode {
  const { Link } = useHost();
  const { previous, next } = pageNeighbours(tree, url);
  const previousIcon = useAnimatedIcon();
  const nextIcon = useAnimatedIcon();
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Pager"
      data-slot="docs-pager"
      className={cn('hidden h-16 w-full items-center gap-2 px-4 sm:flex sm:px-0', className)}
      {...props}
    >
      {previous && (
        <Link
          href={previous.url}
          rel="prev"
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          {...previousIcon.handlers}
        >
          <ArrowLeftIcon ref={previousIcon.ref} />
          <span className="sr-only">Previous: </span>
          {previous.name}
        </Link>
      )}
      {next && (
        <Link
          href={next.url}
          rel="next"
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'ml-auto')}
          {...nextIcon.handlers}
        >
          <span className="sr-only">Next: </span>
          {next.name}
          <ArrowRightIcon ref={nextIcon.ref} />
        </Link>
      )}
    </nav>
  );
}

export { DocsPager };
