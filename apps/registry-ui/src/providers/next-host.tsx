'use client';

import type { Host } from '@zeroxsolutions/ui/host';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ComponentProps, type ReactNode, useMemo } from 'react';

import { inEditorZone } from '@/lib/editor-nav';

/**
 * Next's link for a page of this app, and a plain anchor for a page of the editor zone: Next's link
 * prefetches and soft-navigates, and this app has no page at the editor zone's paths, so a link there
 * loads the whole document, in the same tab.
 */
function AppLink({ href, ...props }: ComponentProps<'a'> & { href: string }): ReactNode {
  return inEditorZone(href) ? <a href={href} {...props} /> : <Link href={href} {...props} />;
}

/**
 * Builds the `Host` the site components read from Next's link and router. The router is memoised
 * so `push` and `replace` keep their identity between renders; a path in the editor zone is a full load.
 */
function useNextHost(): Host {
  const router = useRouter();
  return useMemo(
    () => ({
      Link: AppLink,
      usePathname: () => usePathname(),
      useSearchParams: () => new URLSearchParams(useSearchParams().toString()),
      push: (href) => (inEditorZone(href) ? window.location.assign(href) : router.push(href)),
      replace: (href) => (inEditorZone(href) ? window.location.replace(href) : router.replace(href)),
    }),
    [router],
  );
}

export { useNextHost };
