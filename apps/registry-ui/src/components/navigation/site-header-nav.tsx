'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { ModeSwitcher } from '@/components/general/mode-switcher';
import { useRememberedEngine } from '@/hooks/use-remembered-choice';
import { platformLocation, platformNavItems, type PlatformPages } from '@/lib/platform-nav';
import { Separator } from '@/registry/bases/base-ui/ui/separator';
import type { NativeEngine } from '@/types/native-engine';

import { BaseSwitcher } from './base-switcher';
import { DocsSearch } from './docs-search';
import { EngineSwitcher } from './engine-switcher';
import { MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { PlatformSwitch } from './platform-switch';
import { StylePicker } from './style-picker';

interface SiteHeaderNavProps {
  /** Each platform's pages, for the Web / Native switch. */
  pages: PlatformPages;
  /** The web docs tree, and the native one under each engine, which the menu and the search list. */
  trees: { web: Root; native: Record<NativeEngine, Root> };
}

/**
 * The header's sections and switches for the platform the page is on: Docs, Components and Blocks into
 * its tree, the Web / Native switch, the engine or base switcher where the path holds one, the style
 * picker, the search and the theme switch. A native page whose path holds no engine points into the
 * engine the reader last read.
 */
function SiteHeaderNav({ pages, trees }: SiteHeaderNavProps): ReactNode {
  const location = platformLocation(usePathname());
  const remembered = useRememberedEngine();
  const engine = (location.platform === 'native' && 'engine' in location && location.engine) || remembered;
  const items = platformNavItems(location.platform, engine);
  const tree = location.platform === 'native' ? trees.native[engine] : trees.web;

  return (
    <>
      <div className="lg:hidden">
        <MobileNav tree={tree} items={items} />
      </div>
      <MainNav items={items} className="hidden lg:flex" />
      <div className="ml-auto flex items-center gap-2">
        <PlatformSwitch pages={pages} />
        <div className="hidden md:block">
          <EngineSwitcher />
          <BaseSwitcher />
        </div>
        <div className="hidden md:block">
          <StylePicker platform={location.platform} />
        </div>
        <DocsSearch tree={tree} navItems={items} />
        <Separator orientation="vertical" className="hidden lg:block" />
        <ModeSwitcher />
      </div>
    </>
  );
}

export { SiteHeaderNav };
