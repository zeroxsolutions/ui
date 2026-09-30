'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import type { SiteNavItem } from '@/types/site-nav-item';

interface MainNavProps extends ComponentProps<'nav'> {
  items: SiteNavItem[];
}

/** The site's sections across the header, each marked `data-active` on its own page. */
function MainNav({ items, className, ...props }: MainNavProps): ReactNode {
  const pathname = usePathname();

  return (
    <nav className={cn('items-center gap-0', className)} {...props}>
      {items.map((item) => (
        <Button
          key={item.href}
          variant="ghost"
          nativeButton={false}
          render={<Link href={item.href} data-active={pathname === item.href} className="relative items-center" />}
          size="sm"
          className="px-2.5"
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}

export { MainNav };
