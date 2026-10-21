import type { Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ModeSwitcher } from '@/components/general/mode-switcher';
import { SiteLogo } from '@/components/general/site-logo';
import { DocsSearch } from '@/components/navigation/docs-search';
import { MainNav } from '@/components/navigation/main-nav';
import { MobileNav } from '@/components/navigation/mobile-nav';
import { DEFAULT_COMPONENT_BASE } from '@/constants/component-bases';
import { docsPageHref, docsPageUrl } from '@/lib/source';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import { blocksRoute, componentsRoute, docsRoute, homeRoute } from '@/routes/app-routes';
import type { SiteNavItem } from '@/types/site-nav-item';

interface SiteHeaderProps {
  /** The docs page tree, which the search and the menu on a narrow screen list. */
  tree: Root;
}

/** The bar across the top of every page: the site's sections, the search and the theme switch. */
function SiteHeader({ tree }: SiteHeaderProps): ReactNode {
  const components = docsPageHref(componentsRoute.build({ base: DEFAULT_COMPONENT_BASE }));
  const native = docsPageUrl(['native']);
  const navItems: SiteNavItem[] = [
    { href: docsRoute.build(), label: 'Docs', pattern: `${docsRoute.pathname}{/*rest}` },
    { href: components, label: 'Components', pattern: `${componentsRoute.pathname}{/*rest}` },
    { href: blocksRoute.build({ base: DEFAULT_COMPONENT_BASE }), label: 'Blocks', pattern: blocksRoute.pathname },
    { href: native, label: 'Native', pattern: `${native}{/*rest}` },
  ];

  return (
    <header data-slot="site-header" className="bg-background sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-(--header-height) w-full items-center gap-2 px-6">
        <Link href={homeRoute.build()} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <SiteLogo />
          ZUI
        </Link>
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
