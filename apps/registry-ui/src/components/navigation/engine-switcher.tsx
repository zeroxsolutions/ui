'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, type ComponentProps, type ReactNode } from 'react';

import { NATIVE_ENGINE_LABELS, NATIVE_ENGINES } from '@/constants/native-engines';
import { rememberEngine } from '@/hooks/use-remembered-choice';
import { platformLocation, withLocationEngine } from '@/lib/platform-nav';
import type { NativeEngine } from '@/types/native-engine';

import { LinkSwitch, LinkSwitchItem } from './link-switch';

/**
 * NativeWind and Uniwind as links to this page under each engine, the current one marked, on a page
 * whose path holds an engine; nothing elsewhere. The page's engine is remembered as the reader's, for
 * the native pages whose path holds none.
 */
function EngineSwitcher(props: Omit<ComponentProps<typeof LinkSwitch>, 'aria-label'>): ReactNode {
  const pathname = usePathname();
  const location = platformLocation(pathname);
  const engine = location.platform === 'native' && 'engine' in location ? location.engine : undefined;

  useEffect(() => {
    if (engine) rememberEngine(engine);
  }, [engine]);

  if (!engine) return null;

  return (
    <LinkSwitch aria-label="Engine" data-slot="engine-switcher" {...props}>
      {NATIVE_ENGINES.map((option) => {
        const path = withLocationEngine(location, option) ?? pathname;
        return (
          // Until the search params are read on the client, a statically rendered link carries no query.
          <Suspense
            key={option}
            fallback={<EngineSwitcherLink engine={option} current={engine} path={path} search="" />}
          >
            <EngineSwitcherLinkFromUrl engine={option} current={engine} path={path} />
          </Suspense>
        );
      })}
    </LinkSwitch>
  );
}

interface EngineSwitcherLinkProps {
  engine: NativeEngine;
  /** The engine the page is read under. */
  current: NativeEngine;
  /** This page under `engine`. */
  path: string;
  /** The page's query, such as its `?style=`, which the link keeps. */
  search: string;
}

function EngineSwitcherLinkFromUrl(props: Omit<EngineSwitcherLinkProps, 'search'>): ReactNode {
  return <EngineSwitcherLink {...props} search={useSearchParams().toString()} />;
}

function EngineSwitcherLink({ engine, current, path, search }: EngineSwitcherLinkProps): ReactNode {
  return (
    <LinkSwitchItem href={search ? `${path}?${search}` : path} current={engine === current}>
      {NATIVE_ENGINE_LABELS[engine]}
    </LinkSwitchItem>
  );
}

export { EngineSwitcher };
