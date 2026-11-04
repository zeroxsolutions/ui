'use client';

import type { Host } from '@zeroxsolutions/ui/host';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Builds the `Host` the site components read from Next's link and router. The router is memoised
 * so `push` and `replace` keep their identity between renders.
 */
function useNextHost(): Host {
  const router = useRouter();
  return useMemo(
    () => ({
      Link,
      usePathname: () => usePathname(),
      useSearchParams: () => new URLSearchParams(useSearchParams().toString()),
      push: (href) => router.push(href),
      replace: (href) => router.replace(href),
    }),
    [router],
  );
}

export { useNextHost };
