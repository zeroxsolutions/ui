'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { useRememberedEngine } from '@/hooks/use-remembered-choice';
import { withNativeEngine } from '@/lib/platform-nav';

interface NativeEngineLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  /** A native page under any engine; a link outside the native components and blocks is left as it is. */
  href: string;
}

/**
 * A link into the native tree from a page whose path holds no engine, moved to the engine the reader
 * last read native pages under, so following it does not switch them back to the default engine.
 */
function NativeEngineLink({ href, ...props }: NativeEngineLinkProps): ReactNode {
  return <Link data-slot="native-engine-link" href={withNativeEngine(href, useRememberedEngine())} {...props} />;
}

export { NativeEngineLink };
