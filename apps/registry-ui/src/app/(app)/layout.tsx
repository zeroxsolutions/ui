import { SiteFooter } from '@zeroxsolutions/ui/site/components/layout/site-footer';
import { SiteHeader } from '@zeroxsolutions/ui/site/components/layout/site-header';
import type { ReactNode } from 'react';

import { nativeComponentNames, nativeDocsSource, nativePageTree } from '@/lib/native-source';
import type { PlatformPages } from '@/lib/platform-nav';
import { source } from '@/lib/source';
import { PlatformNavProvider } from '@/providers/platform-nav-provider';

/** Each web docs page's slug and each web component's name, read off the docs content. */
function webPages(): PlatformPages['web'] {
  const slugs = source.getPages().map((page) => page.slugs.join('/'));
  const components = slugs.flatMap((slug) => /^components\/[^/]+\/([^/]+)$/.exec(slug)?.[1] ?? []);
  return { docs: slugs, components: [...new Set(components)] };
}

export default function AppLayout({ children }: { children: ReactNode }): ReactNode {
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
    <PlatformNavProvider pages={pages}>
      <div data-slot="layout" className="group/layout bg-background relative z-10 flex min-h-svh flex-col">
        <SiteHeader nav={{ trees, searchApi: '/api/search' }} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </PlatformNavProvider>
  );
}
