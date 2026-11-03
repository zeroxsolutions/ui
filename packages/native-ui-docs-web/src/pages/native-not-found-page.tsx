'use client';

import type { ReactNode } from 'react';

import { useHost } from '@zeroxsolutions/ui/host';
import { SectionNotFound } from '@zeroxsolutions/ui/site/components/feedback/section-not-found';
import { useRememberedEngine } from '@zeroxsolutions/ui/site/hooks/use-remembered-choice';

import { nativeLocation, withNativeEngine } from '../lib/native-location';

interface NativeNotFoundPageProps {
  /** The section the missing page would sit in, which names the list of its pages: `Docs`, `Components`. */
  section: string;
  /** The section's pages, in reading order; a component or blocks page under any engine. */
  pages: readonly { title: string; url: string }[];
}

/**
 * A native section's 404: the section's pages in place of the one asked for, which the web's platform
 * switch links to without knowing whether the native tree has it. A component or blocks link follows
 * the engine the missing path names, or else the one the reader last read.
 */
function NativeNotFoundPage({ section, pages }: NativeNotFoundPageProps): ReactNode {
  const location = nativeLocation(useHost().usePathname());
  const remembered = useRememberedEngine();
  const engine = (location && 'engine' in location && location.engine) || remembered;

  return (
    <SectionNotFound
      section={section}
      pages={pages.map((page) => ({ title: page.title, url: withNativeEngine(page.url, engine) }))}
    />
  );
}

export { NativeNotFoundPage };
