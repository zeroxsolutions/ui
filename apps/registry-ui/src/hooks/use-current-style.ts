import { useSearchParams } from 'next/navigation';

import { useHydrated } from '@/hooks/use-hydrated';
import { useRememberedStyle } from '@/hooks/use-remembered-choice';
import { currentStyle, STYLE_PARAM } from '@/lib/style-choice';
import type { Platform, PlatformStyle } from '@/types/platform';

/**
 * The style the page shows on `platform`: the URL's `?style=`, else the reader's last choice, else the
 * default. It is the default while the page hydrates, as the server drew it, and the reader's style once
 * it has. It reads the search params, so on a statically rendered page its caller sits under a
 * `Suspense` boundary.
 */
export function useCurrentStyle<P extends Platform>(platform: P): PlatformStyle<P> {
  const searchParams = useSearchParams();
  // A force-static page is rendered at build with an empty query and no bail-out to the fallback, so the
  // server drew the default; the URL's style drawn before hydration ends is a text mismatch.
  const param = useHydrated() ? searchParams.get(STYLE_PARAM) : null;
  return currentStyle(platform, param, useRememberedStyle(platform));
}
