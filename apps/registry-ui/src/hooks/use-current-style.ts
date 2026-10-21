import { useSearchParams } from 'next/navigation';

import { useRememberedStyle } from '@/hooks/use-remembered-choice';
import { currentStyle, STYLE_PARAM } from '@/lib/style-choice';
import type { Platform, PlatformStyle } from '@/types/platform';

/**
 * The style the page shows on `platform`: the URL's `?style=`, else the reader's last choice, else the
 * default. It reads the search params, so on a statically rendered page its caller sits under a
 * `Suspense` boundary, whose fallback renders the default.
 */
export function useCurrentStyle<P extends Platform>(platform: P): PlatformStyle<P> {
  const searchParams = useSearchParams();
  return currentStyle(platform, searchParams.get(STYLE_PARAM), useRememberedStyle(platform));
}
