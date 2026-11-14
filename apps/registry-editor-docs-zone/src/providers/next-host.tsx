'use client';

import type { Host } from '@zeroxsolutions/ui/host';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ComponentProps, type ReactNode, useMemo } from 'react';

import { inZone } from '@/lib/editor-nav';

/**
 * Next's link for a page of this zone, and a plain anchor for any other: Next's link prefetches and
 * soft-navigates, and this app has no page at another zone's path, so the site components' links into
 * registry-ui's docs, header and home load the whole document.
 */
function ZoneLink({ href, ...props }: ComponentProps<'a'> & { href: string }): ReactNode {
  return inZone(href) ? <Link href={href} {...props} /> : <a href={href} {...props} />;
}

/**
 * Builds the `Host` the site components read from Next's link and router. The router is memoised
 * so `push` and `replace` keep their identity between renders; a path outside this zone is a full load.
 */
function useNextHost(): Host {
  const router = useRouter();
  return useMemo(
    () => ({
      Link: ZoneLink,
      usePathname: () => usePathname(),
      useSearchParams: () => new URLSearchParams(useSearchParams().toString()),
      push: (href) => (inZone(href) ? router.push(href) : window.location.assign(href)),
      replace: (href) => (inZone(href) ? router.replace(href) : window.location.replace(href)),
    }),
    [router],
  );
}

export { useNextHost };
