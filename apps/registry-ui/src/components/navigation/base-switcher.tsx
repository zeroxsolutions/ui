'use client';

import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { COMPONENT_BASE_LABELS, COMPONENT_BASES } from '@/constants/component-bases';
import { platformLocation } from '@/lib/platform-nav';
import { blocksRoute, componentRoute, componentsRoute } from '@/routes/app-routes';

import { LinkTabs, LinkTabsItem } from './link-tabs';

/**
 * The bases a web component is documented on, as links to this page on each, the current one marked,
 * keeping the page's query, on a page whose path holds a base; nothing elsewhere.
 */
function BaseSwitcher(props: Omit<ComponentProps<typeof LinkTabs>, 'aria-label'>): ReactNode {
  const location = platformLocation(usePathname());
  if (location.platform !== 'web' || (location.section !== 'components' && location.section !== 'blocks')) return null;

  return (
    <LinkTabs aria-label="Base" data-slot="base-switcher" {...props}>
      {COMPONENT_BASES.map((base) => {
        const path =
          location.section === 'blocks'
            ? blocksRoute.build({ base })
            : location.name
              ? componentRoute.build({ base, name: location.name })
              : componentsRoute.build({ base });
        return (
          <LinkTabsItem key={base} path={path} current={location.base === base}>
            {COMPONENT_BASE_LABELS[base]}
          </LinkTabsItem>
        );
      })}
    </LinkTabs>
  );
}

export { BaseSwitcher };
