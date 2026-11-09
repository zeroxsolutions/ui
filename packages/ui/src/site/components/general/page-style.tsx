'use client';

import { Suspense, useEffect, type ReactNode } from 'react';

import { useCurrentStyle } from '../../hooks/use-current-style';
import { useHydrated } from '../../hooks/use-hydrated';
import { applyStyleClass, styleClassScript } from '../../lib/style-class';
import type { Platform } from '../../types/platform';

interface PageStyleProps {
  /** Whose picker the page follows. */
  platform: Platform;
}

/**
 * Draws the page in the style the picker names, by its class on `<html>`: the inline script sets it before
 * the first paint, and the page keeps it in step once a link or another tab changes the style. A popup
 * portals to `body`, so a class anywhere below `<html>` would leave it in another style. Rendered first in
 * `body`, so the script runs before the content after it paints.
 */
function PageStyle({ platform }: PageStyleProps): ReactNode {
  return (
    <>
      {/* The script's text is the same on the server and the client, so hydration keeps it as it is. */}
      <script dangerouslySetInnerHTML={{ __html: styleClassScript(platform) }} />
      <Suspense>
        <PageStyleSync platform={platform} />
      </Suspense>
    </>
  );
}

function PageStyleSync({ platform }: PageStyleProps): ReactNode {
  const style = useCurrentStyle(platform);
  // While it hydrates the hook answers the default, which would undo the script's class.
  const hydrated = useHydrated();
  useEffect(() => {
    if (hydrated) applyStyleClass(document.documentElement, platform, style);
  }, [hydrated, platform, style]);
  return null;
}

export { PageStyle };
