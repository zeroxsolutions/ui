'use client';

import { type ReactNode, useId } from 'react';

import { useHost } from '../../../host/host-provider';

interface SectionNotFoundProps {
  /** The section the missing page would sit in, which names the list of its pages: `Docs`, `Components`. */
  section: string;
  /** The section's pages in reading order, each linked at `url` as given. */
  pages: readonly { title: string; url: string }[];
}

/**
 * A section's 404 body: the section's pages in place of the one asked for. The other platform's switch
 * links a page's counterpart without knowing whether this platform has it, so a reader who lands here
 * picks from the section instead. Reads the host.
 */
function SectionNotFound({ section, pages }: SectionNotFoundProps): ReactNode {
  const { Link } = useHost();
  const headingId = useId();

  return (
    <div data-slot="section-not-found" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">No page is published at this address.</p>
      </header>
      <section aria-labelledby={headingId} className="flex flex-col gap-3">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          {section}
        </h2>
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {pages.map((page) => (
            <li key={page.url}>
              <Link href={page.url} className="underline-offset-4 hover:underline">
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export { SectionNotFound };
