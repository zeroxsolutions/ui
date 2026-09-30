'use client';

import Link from 'next/link';
import { useRef, type ReactNode } from 'react';

import { ArrowLeftIcon, type ArrowLeftIconHandle } from '@/registry/bases/base-ui/ui/arrow-left';
import { ArrowRightIcon, type ArrowRightIconHandle } from '@/registry/bases/base-ui/ui/arrow-right';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';

interface DocsNeighbourLinkProps {
  /** Which way the link steps through the docs. */
  direction: 'previous' | 'next';
  /** The page it steps to. */
  href: string;
}

/** The page header's icon link to the previous or the next page, upstream's; its arrow plays on hover or focus. */
function DocsNeighbourLink({ direction, href }: DocsNeighbourLinkProps): ReactNode {
  const iconRef = useRef<ArrowLeftIconHandle & ArrowRightIconHandle>(null);

  return (
    <Link
      href={href}
      aria-label={direction === 'previous' ? 'Previous page' : 'Next page'}
      className={buttonVariants({ variant: 'secondary', size: 'icon-sm' })}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      onFocus={() => iconRef.current?.startAnimation()}
      onBlur={() => iconRef.current?.stopAnimation()}
    >
      {direction === 'previous' ? <ArrowLeftIcon ref={iconRef} /> : <ArrowRightIcon ref={iconRef} />}
    </Link>
  );
}

export { DocsNeighbourLink };
