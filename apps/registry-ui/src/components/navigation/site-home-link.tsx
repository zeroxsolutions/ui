'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { platformHome, platformLocation } from '@/lib/platform-nav';

/** A link to the home page of the platform the page is on: `/` from a web page, `/native` from a native one. */
function SiteHomeLink(props: Omit<ComponentProps<typeof Link>, 'href'>): ReactNode {
  const { platform } = platformLocation(usePathname());
  return <Link data-slot="site-home-link" href={platformHome(platform)} {...props} />;
}

export { SiteHomeLink };
