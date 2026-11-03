'use client';

import { type ReactNode, useId } from 'react';

import { useHost } from '@zeroxsolutions/ui/host';
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
  const { Link, usePathname } = useHost();
  const location = nativeLocation(usePathname());
  const remembered = useRememberedEngine();
  const engine = (location && 'engine' in location && location.engine) || remembered;
  const headingId = useId();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">No native page is published at this address.</p>
      </header>
      <section aria-labelledby={headingId} className="flex flex-col gap-3">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          {section}
        </h2>
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {pages.map((page) => (
            <li key={page.url}>
              <Link href={withNativeEngine(page.url, engine)} className="underline-offset-4 hover:underline">
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export { NativeNotFoundPage };
