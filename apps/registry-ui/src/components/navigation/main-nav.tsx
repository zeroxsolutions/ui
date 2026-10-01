'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { currentSiteNavItem } from '@/lib/site-nav';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import type { SiteNavItem } from '@/types/site-nav-item';

interface MainNavProps extends ComponentProps<'nav'> {
  items: SiteNavItem[];
}

/** The site's sections across the header as links, the one for the current page marked `aria-current`. */
function MainNav({ items, className, ...props }: MainNavProps): ReactNode {
  const pathname = usePathname();
  const current = currentSiteNavItem(items, pathname);

  return (
    <nav aria-label="Main" className={cn('flex items-center', className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item === current ? 'page' : undefined}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export { MainNav };
