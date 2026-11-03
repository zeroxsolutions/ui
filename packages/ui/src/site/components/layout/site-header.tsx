import type { ReactNode } from 'react';

import { SiteLogo } from '../general/site-logo';
import { SiteHeaderNav, type SiteHeaderNavProps } from '../navigation/site-header-nav';
import { SiteHomeLink } from '../navigation/site-home-link';
import { buttonVariants } from '../../../../registry/bases/base-ui/ui/button';

/**
 * The bar across the top of every page: the logo, then the current platform's sections and switches.
 * Renders under the host and a `SiteNavProvider`.
 */
function SiteHeader({ nav }: { nav: SiteHeaderNavProps }): ReactNode {
  return (
    <header data-slot="site-header" className="bg-background sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-(--header-height) w-full items-center gap-2 px-6">
        <SiteHomeLink className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <SiteLogo />
          ZUI
        </SiteHomeLink>
        <SiteHeaderNav {...nav} />
      </div>
    </header>
  );
}

export { SiteHeader };
