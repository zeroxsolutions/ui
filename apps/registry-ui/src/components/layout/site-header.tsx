import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

import { ModeSwitcher } from '@/components/general/mode-switcher';
import { DocsSearch } from '@/components/navigation/docs-search';
import { MainNav } from '@/components/navigation/main-nav';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { docsPageUrl } from '@/lib/source';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { blocksRoute, docsRoute, homeRoute } from '@/routes/app-routes';
import type { SiteNavItem } from '@/types/site-nav-item';

interface SiteHeaderProps {
  /** The docs page tree, which the search and the menu on a narrow screen list. */
  tree: Root;
}

/** The bar across the top of every page: the site's sections, the search and the theme switch. */
function SiteHeader({ tree }: SiteHeaderProps): ReactNode {
  const components = docsPageUrl(['components']);
  const navItems: SiteNavItem[] = [
    { href: homeRoute.build(), label: 'Home', pattern: homeRoute.pathname },
    { href: docsRoute.build(), label: 'Docs', pattern: `${docsRoute.pathname}{/*rest}` },
    { href: components, label: 'Components', pattern: `${components}{/*rest}` },
    { href: blocksRoute.build(), label: 'Blocks', pattern: blocksRoute.pathname },
  ];

  return (
    <header className="bg-background sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-(--header-height) w-full items-center gap-2 px-6">
        <div className="lg:hidden">
          <MobileNav tree={tree} items={navItems} />
        </div>
        <MainNav items={navItems} className="hidden lg:flex" />
        <div className="ml-auto flex items-center gap-2">
          <DocsSearch tree={tree} navItems={navItems} />
          <Separator orientation="vertical" className="hidden lg:block" />
          <ModeSwitcher />
        </div>
      </div>
    </header>
  );
}

export { SiteHeader };
