'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { useIconAnimation } from '@/hooks/use-icon-animation';

import { ArrowLeftIcon, type ArrowLeftIconHandle } from '@/registry/bases/base-ui/ui/arrow-left';
import { ArrowRightIcon, type ArrowRightIconHandle } from '@/registry/bases/base-ui/ui/arrow-right';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';

interface DocsNeighbourLinkProps {
  /** Which way the link steps through the docs. */
  direction: 'previous' | 'next';
  /** The page it steps to. */
  href: string;
}

/** The page header's icon link to the previous or the next page; its arrow plays on hover or focus. */
function DocsNeighbourLink({ direction, href }: DocsNeighbourLinkProps): ReactNode {
  const arrow = useIconAnimation<ArrowLeftIconHandle | ArrowRightIconHandle>();

  return (
    <Link
      href={href}
      aria-label={direction === 'previous' ? 'Previous page' : 'Next page'}
      className={buttonVariants({ variant: 'secondary', size: 'icon-sm' })}
      {...arrow.handlers}
    >
      {direction === 'previous' ? <ArrowLeftIcon ref={arrow.ref} /> : <ArrowRightIcon ref={arrow.ref} />}
    </Link>
  );
}

export { DocsNeighbourLink };
