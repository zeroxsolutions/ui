'use client';

import { usePathname } from 'next/navigation';
import { useEffect, type ComponentProps, type ReactNode } from 'react';

import { NATIVE_ENGINE_LABELS, NATIVE_ENGINES } from '@/constants/native-engines';
import { rememberEngine } from '@/hooks/use-remembered-choice';
import { platformLocation, withLocationEngine } from '@/lib/platform-nav';

import { LinkTabs, LinkTabsItem } from './link-tabs';

/**
 * NativeWind and Uniwind as links to this page under each engine, the current one marked, keeping the
 * page's query, on a page whose path holds an engine; nothing elsewhere. The page's engine is remembered
 * as the reader's, for the native pages whose path holds none.
 */
function EngineSwitcher(props: Omit<ComponentProps<typeof LinkTabs>, 'aria-label'>): ReactNode {
  const pathname = usePathname();
  const location = platformLocation(pathname);
  const engine = location.platform === 'native' && 'engine' in location ? location.engine : undefined;

  useEffect(() => {
    if (engine) rememberEngine(engine);
  }, [engine]);

  if (!engine) return null;

  return (
    <LinkTabs aria-label="Engine" data-slot="engine-switcher" {...props}>
      {NATIVE_ENGINES.map((option) => (
        <LinkTabsItem key={option} path={withLocationEngine(location, option) ?? pathname} current={option === engine}>
          {NATIVE_ENGINE_LABELS[option]}
        </LinkTabsItem>
      ))}
    </LinkTabs>
  );
}

export { EngineSwitcher };
