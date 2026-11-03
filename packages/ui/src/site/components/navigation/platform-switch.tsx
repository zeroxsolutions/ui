'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useHost } from '../../../host/host-provider';
import { useSiteNav } from '../../providers/site-nav-provider';

import { LinkSwitch, LinkSwitchItem } from './link-switch';

/**
 * Web and Native as two links, the current platform marked. The other links to the site nav's
 * counterpart of this page, as a plain anchor, since another app serves the other platform's pages.
 * Reads the host and a `SiteNavProvider`.
 */
function PlatformSwitch(props: Omit<ComponentProps<typeof LinkSwitch>, 'aria-label'>): ReactNode {
  const pathname = useHost().usePathname();
  const nav = useSiteNav();
  const location = nav.locate(pathname);
  const counterpart = nav.counterpart(pathname);

  return (
    <LinkSwitch aria-label="Platform" data-slot="platform-switch" {...props}>
      {(['web', 'native'] as const).map((platform) => {
        const current = location.platform === platform;
        return (
          <LinkSwitchItem
            key={platform}
            href={current ? pathname : counterpart}
            current={current}
            reloadDocument={!current}
          >
            {platform === 'web' ? 'Web' : 'Native'}
          </LinkSwitchItem>
        );
      })}
    </LinkSwitch>
  );
}

export { PlatformSwitch };
