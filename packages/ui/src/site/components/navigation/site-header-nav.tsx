'use client';

import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

import { useHost } from '../../../host/host-provider';
import { ModeSwitcher } from '../general/mode-switcher';
import { useRememberedEngine } from '../../hooks/use-remembered-choice';
import { useSiteNav } from '../../providers/site-nav-provider';
import { Separator } from '../../../../registry/bases/base-ui/ui/separator';
import type { NativeEngine } from '../../types/native-engine';

import { DocsSearch } from './docs-search';
import { MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { PlatformSwitch } from './platform-switch';
import { StylePicker } from './style-picker';

interface SiteHeaderNavProps {
  /** The web docs tree, and the native one under each engine, which the menu and the search list. */
  trees: { web: Root; native: Record<NativeEngine, Root> };
  /** Where the search index is served, which `DocsSearch` reads. */
  searchApi: string;
}

/**
 * The header's sections and switches for the platform the page is on: Docs, Components and Blocks into
 * its tree, the Web / Native switch, the style picker, the search and the theme switch. A native page
 * whose path holds no engine points into the engine the reader last read. Reads the host and a
 * `SiteNavProvider`.
 */
function SiteHeaderNav({ trees, searchApi }: SiteHeaderNavProps): ReactNode {
  const nav = useSiteNav();
  const location = nav.locate(useHost().usePathname());
  const remembered = useRememberedEngine();
  const engine = location.engine ?? remembered;
  const items = nav.items(location.platform, engine);
  const tree = location.platform === 'native' ? trees.native[engine] : trees.web;

  return (
    <>
      <div className="lg:hidden">
        <MobileNav tree={tree} items={items} platform={location.platform} />
      </div>
      <MainNav items={items} className="hidden lg:flex" />
      <div className="ml-auto flex items-center gap-2">
        <PlatformSwitch />
        <div className="hidden md:block">
          <StylePicker platform={location.platform} />
        </div>
        <DocsSearch
          tree={tree}
          navItems={items}
          platform={location.platform}
          api={searchApi}
          resultHref={location.platform === 'native' ? (url) => nav.withEngine(url, engine) : undefined}
        />
        <Separator orientation="vertical" className="hidden lg:block" />
        <ModeSwitcher />
      </div>
    </>
  );
}

export { SiteHeaderNav };
export type { SiteHeaderNavProps };
