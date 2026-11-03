'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useHost } from '@zeroxsolutions/ui/host';
import { COMPONENT_BASE_LABELS, COMPONENT_BASES } from '@zeroxsolutions/ui/site/constants/component-bases';
import { LinkTabs, LinkTabsItem } from '@zeroxsolutions/ui/site/components/navigation/link-tabs';
import type { ComponentBase } from '@zeroxsolutions/ui/site/types/component-base';

import { blocksRoute, componentRoute, componentsRoute } from '../../routes';

/** A page whose path holds a base: a component's page, the components index, or the blocks page. */
interface BaseSwitcherLocation {
  section: 'components' | 'blocks';
  base: string;
  /** The component a component's page shows. */
  name?: string;
}

/** Where `pathname` holds a base; `undefined` on a page whose path holds none. */
function baseSwitcherLocation(pathname: string): BaseSwitcherLocation | undefined {
  const component = componentRoute.matcher(pathname);
  if (component) return { section: 'components', ...component.params };
  const components = componentsRoute.matcher(pathname);
  if (components) return { section: 'components', base: components.params.base };
  const blocks = blocksRoute.matcher(pathname);
  if (blocks) return { section: 'blocks', base: blocks.params.base };
  return undefined;
}

/** This page under `base`, keeping the component it shows. */
function baseSwitcherPath(location: BaseSwitcherLocation, base: ComponentBase): string {
  if (location.section === 'blocks') return blocksRoute.build({ base });
  return location.name ? componentRoute.build({ base, name: location.name }) : componentsRoute.build({ base });
}

/**
 * The bases a web component is documented on, as links to this page on each, the current one marked,
 * keeping the page's query, on a page whose path holds a base; nothing elsewhere.
 */
function BaseSwitcher(props: Omit<ComponentProps<typeof LinkTabs>, 'aria-label'>): ReactNode {
  const location = baseSwitcherLocation(useHost().usePathname());
  if (!location) return null;

  return (
    <LinkTabs aria-label="Base" data-slot="base-switcher" {...props}>
      {COMPONENT_BASES.map((base) => (
        <LinkTabsItem key={base} path={baseSwitcherPath(location, base)} current={location.base === base}>
          {COMPONENT_BASE_LABELS[base]}
        </LinkTabsItem>
      ))}
    </LinkTabs>
  );
}

export { BaseSwitcher };
