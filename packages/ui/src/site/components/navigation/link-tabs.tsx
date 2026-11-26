'use client';

import { Suspense, type ComponentProps, type ReactNode } from 'react';

import { type Host, useHost } from '../../../host/host-provider';
import { useHydrated } from '../../hooks/use-hydrated';

import { LinkSwitch, LinkSwitchItem } from './link-switch';

/**
 * A row of links to one page in each of its variants, such as its engine or base, under the page's title,
 * drawn as the style's underlined tabs. `aria-label` names what they switch.
 */
function LinkTabs(props: Omit<ComponentProps<typeof LinkSwitch>, 'variant'>): ReactNode {
  return <LinkSwitch data-slot="link-tabs" variant="line" {...props} />;
}

interface LinkTabsItemProps extends Omit<ComponentProps<Host['Link']>, 'href'> {
  /** This page under the item's variant; the link adds the page's query, such as its `?style=`. */
  path: string;
  /** Whether the page is this variant, which marks the link `aria-current`. */
  current: boolean;
}

/** One variant's link in a `LinkTabs`. */
function LinkTabsItem(props: LinkTabsItemProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered link carries no query.
    <Suspense fallback={<LinkTabsItemLink {...props} search="" />}>
      <LinkTabsItemFromUrl {...props} />
    </Suspense>
  );
}

function LinkTabsItemFromUrl(props: LinkTabsItemProps): ReactNode {
  const search = useHost().useSearchParams().toString();
  // A page rendered once at build holds no query, and hydration keeps the server's href over the client's.
  return <LinkTabsItemLink {...props} search={useHydrated() ? search : ''} />;
}

function LinkTabsItemLink({ path, search, ...props }: LinkTabsItemProps & { search: string }): ReactNode {
  return <LinkSwitchItem data-slot="link-tabs-item" href={search ? `${path}?${search}` : path} {...props} />;
}

export { LinkTabs, LinkTabsItem };
