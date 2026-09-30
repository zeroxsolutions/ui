import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { ModeSwitcher } from '@/components/general/mode-switcher';
import { CommandMenu } from '@/components/navigation/command-menu';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { docsPageUrl } from '@/lib/source';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { blocksRoute, docsRoute, homeRoute } from '@/routes/app-routes';

interface SiteHeaderProps extends ComponentProps<'header'> {
  /** The docs page tree, which the search lists before a query and the menu lists on a narrow screen. */
  tree: Root;
}

/** The bar across the top of every page: the site's name, its sections, the search and the theme switch. */
function SiteHeader({ tree, className, ...props }: SiteHeaderProps): ReactNode {
  return (
    <header className={cn('bg-background sticky top-0 z-50 w-full border-b', className)} {...props}>
      <div className="flex h-(--header-height) items-center gap-2 px-4 md:px-6">
        <div className="lg:hidden">
          <MobileNav tree={tree} />
        </div>
        <Link href={homeRoute.build()} className="font-semibold">
          ZeroXSolutions UI
        </Link>
        <nav aria-label="Main" className="hidden items-center lg:flex">
          <Link href={docsRoute.build()} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Docs
          </Link>
          <Link href={docsPageUrl(['components'])} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Components
          </Link>
          <Link href={blocksRoute.build()} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Blocks
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-56 md:block">
            <CommandMenu tree={tree} />
          </div>
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}

export { SiteHeader };
