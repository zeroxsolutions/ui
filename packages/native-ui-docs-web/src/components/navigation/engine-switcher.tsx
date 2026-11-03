'use client';

import { useEffect, type ComponentProps, type ReactNode } from 'react';

import { useHost } from '@zeroxsolutions/ui/host';
import { LinkTabs, LinkTabsItem } from '@zeroxsolutions/ui/site/components/navigation/link-tabs';
import { NATIVE_ENGINE_LABELS, NATIVE_ENGINES } from '@zeroxsolutions/ui/site/constants/native-engines';
import { rememberEngine } from '@zeroxsolutions/ui/site/hooks/use-remembered-choice';

import { nativeLocation, withLocationEngine } from '../../lib/native-location';

/**
 * NativeWind and Uniwind as links to this page under each engine, the current one marked, keeping the
 * page's query, on a page whose path holds an engine; nothing elsewhere. The page's engine is remembered
 * as the reader's, for the native pages whose path holds none.
 */
function EngineSwitcher(props: Omit<ComponentProps<typeof LinkTabs>, 'aria-label'>): ReactNode {
  const pathname = useHost().usePathname();
  const location = nativeLocation(pathname);
  const engine = location && 'engine' in location ? location.engine : undefined;

  useEffect(() => {
    if (engine) rememberEngine(engine);
  }, [engine]);

  if (!location || !engine) return null;

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
