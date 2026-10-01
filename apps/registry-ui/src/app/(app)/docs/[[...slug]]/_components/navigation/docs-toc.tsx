'use client';

import {
  AnchorProvider,
  useActiveAnchor,
  useActiveAnchors,
  type TableOfContents,
  type TOCItemType,
} from 'fumadocs-core/toc';
import { useSyncExternalStore, type ReactNode } from 'react';

interface DocsTocProps {
  /** The page's headings, as the MDX compiler lists them. */
  toc: TableOfContents;
}

/** The page's headings as in-page links, with the heading in view marked. Renders nothing for a page without one. */
function DocsToc({ toc }: DocsTocProps): ReactNode {
  if (toc.length === 0) return null;

  return (
    <AnchorProvider toc={toc}>
      <div data-slot="docs-toc" className="flex flex-col gap-2 px-6 text-sm">
        <p className="text-muted-foreground text-xs font-medium">On this page</p>
        {toc.map((item) => (
          <DocsTocLink key={item.url} item={item} />
        ))}
      </div>
    </AnchorProvider>
  );
}

function subscribeToHash(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** The heading the URL points at. Read again on every render too, since a client-side push sets it silently. */
function readHash(): string {
  return decodeURIComponent(window.location.hash.slice(1));
}

/**
 * The heading to mark: the one the URL points at while it is in view, else the one fumadocs estimates.
 * A landing near a page's end cannot scroll its heading to the top, so the heading above it enters view
 * in the same report, and fumadocs then marks the first of the two rather than the one landed on.
 */
function useMarkedAnchor(): string | undefined {
  const inView = useActiveAnchors();
  const estimated = useActiveAnchor();
  const hash = useSyncExternalStore(subscribeToHash, readHash, () => '');

  return hash && inView.includes(hash) ? hash : estimated;
}

function DocsTocLink({ item }: { item: TOCItemType }): ReactNode {
  const active = useMarkedAnchor() === item.url.slice(1);

  return (
    <a
      href={item.url}
      aria-current={active ? 'location' : undefined}
      data-active={active}
      data-depth={item.depth}
      className="text-muted-foreground hover:text-foreground data-[active=true]:text-foreground data-[depth=3]:pl-4 data-[depth=4]:pl-6"
    >
      {item.title}
    </a>
  );
}

export { DocsToc };
