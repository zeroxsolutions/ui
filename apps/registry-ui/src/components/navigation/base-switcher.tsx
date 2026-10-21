'use client';

import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { COMPONENT_BASE_LABELS, COMPONENT_BASES } from '@/constants/component-bases';
import { platformLocation } from '@/lib/platform-nav';
import { blocksRoute, componentRoute, componentsRoute } from '@/routes/app-routes';

import { LinkSwitch, LinkSwitchItem } from './link-switch';

/**
 * The bases a web component is documented on, as links to this page on each, the current one marked,
 * on a page whose path holds a base; nothing elsewhere.
 */
function BaseSwitcher(props: Omit<ComponentProps<typeof LinkSwitch>, 'aria-label'>): ReactNode {
  const location = platformLocation(usePathname());
  if (location.platform !== 'web' || (location.section !== 'components' && location.section !== 'blocks')) return null;

  return (
    <LinkSwitch aria-label="Base" data-slot="base-switcher" {...props}>
      {COMPONENT_BASES.map((base) => {
        const href =
          location.section === 'blocks'
            ? blocksRoute.build({ base })
            : location.name
              ? componentRoute.build({ base, name: location.name })
              : componentsRoute.build({ base });
        return (
          <LinkSwitchItem key={base} href={href} current={location.base === base}>
            {COMPONENT_BASE_LABELS[base]}
          </LinkSwitchItem>
        );
      })}
    </LinkSwitch>
  );
}

export { BaseSwitcher };
