import type { ReactNode } from 'react';

import { SiteLogo } from '@/components/general/site-logo';
import { SiteHeaderNav } from '@/components/navigation/site-header-nav';
import { SiteHomeLink } from '@/components/navigation/site-home-link';
import { nativeComponentNames, nativeDocsSource, nativePageTree } from '@/lib/native-source';
import type { PlatformPages } from '@/lib/platform-nav';
import { source } from '@/lib/source';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';

/** Each web docs page's slug and each web component's name, read off the docs content. */
function webPages(): PlatformPages['web'] {
  const slugs = source.getPages().map((page) => page.slugs.join('/'));
  const components = slugs.flatMap((slug) => /^components\/[^/]+\/([^/]+)$/.exec(slug)?.[1] ?? []);
  return { docs: slugs, components: [...new Set(components)] };
}

/** The bar across the top of every page: the logo, then the current platform's sections and switches. */
function SiteHeader(): ReactNode {
  const pages: PlatformPages = {
    web: webPages(),
    native: {
      docs: nativeDocsSource.getPages().map((page) => page.slugs.join('/')),
      components: nativeComponentNames(),
    },
  };
  const trees = {
    web: source.pageTree,
    native: { nativewind: nativePageTree('nativewind'), uniwind: nativePageTree('uniwind') },
  };

  return (
    <header data-slot="site-header" className="bg-background sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-(--header-height) w-full items-center gap-2 px-6">
        <SiteHomeLink className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <SiteLogo />
          ZUI
        </SiteHomeLink>
        <SiteHeaderNav pages={pages} trees={trees} />
      </div>
    </header>
  );
}

export { SiteHeader };
