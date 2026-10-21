'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useHydrated } from '@/hooks/use-hydrated';
import { useRememberedEngine } from '@/hooks/use-remembered-choice';
import { withNativeEngine } from '@/lib/platform-nav';
import { DEFAULT_NATIVE_ENGINE } from '@/constants/native-engines';

/**
 * A link on a native docs page, which has no engine in its path. A link to a component page follows the
 * engine the reader remembered once the page has hydrated; the server and the first client render use
 * the default engine, as the statically rendered page did.
 */
function NativeDocsLink({ href, ...props }: ComponentProps<'a'>): ReactNode {
  const hydrated = useHydrated();
  const remembered = useRememberedEngine();
  const engine = hydrated ? remembered : DEFAULT_NATIVE_ENGINE;

  return (
    <a
      className="font-medium underline underline-offset-4"
      href={href ? withNativeEngine(href, engine) : href}
      {...props}
    />
  );
}

export { NativeDocsLink };
