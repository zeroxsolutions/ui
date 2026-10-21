'use client';

import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { useRememberedEngine } from '@/hooks/use-remembered-choice';
import { platformCounterpart, platformLocation, type PlatformPages } from '@/lib/platform-nav';

import { LinkSwitch, LinkSwitchItem } from './link-switch';

interface PlatformSwitchProps extends Omit<ComponentProps<typeof LinkSwitch>, 'aria-label'> {
  /** Each platform's pages, which decide whether the other platform has this page or only its section. */
  pages: PlatformPages;
}

/**
 * Web and Native as two links, the current platform marked. The other links to the same page there
 * where it has one, else to that section's index; a web page switches into the engine the reader last
 * read native pages under.
 */
function PlatformSwitch({ pages, ...props }: PlatformSwitchProps): ReactNode {
  const pathname = usePathname();
  const location = platformLocation(pathname);
  const counterpart = platformCounterpart(location, pages, useRememberedEngine());

  return (
    <LinkSwitch aria-label="Platform" data-slot="platform-switch" {...props}>
      {(['web', 'native'] as const).map((platform) => {
        const current = location.platform === platform;
        return (
          <LinkSwitchItem key={platform} href={current ? pathname : counterpart} current={current}>
            {platform === 'web' ? 'Web' : 'Native'}
          </LinkSwitchItem>
        );
      })}
    </LinkSwitch>
  );
}

export { PlatformSwitch };
