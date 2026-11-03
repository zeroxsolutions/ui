'use client';

import type { ComponentProps, ReactNode } from 'react';

import { type Host, useHost } from '../../../host/host-provider';
import { useSiteNav } from '../../providers/site-nav-provider';

/** A link to the home page of the platform the page is on: `/` from a web page, `/native` from a native one. */
function SiteHomeLink(props: Omit<ComponentProps<Host['Link']>, 'href'>): ReactNode {
  const { Link, usePathname } = useHost();
  const nav = useSiteNav();
  return <Link data-slot="site-home-link" href={nav.home(nav.locate(usePathname()).platform)} {...props} />;
}

export { SiteHomeLink };
