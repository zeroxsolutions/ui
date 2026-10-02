'use client';

import {
  AnchorProvider,
  useActiveAnchor,
  useActiveAnchors,
  type TableOfContents,
  type TOCItemType,
} from 'fumadocs-core/toc';
import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from 'react';

interface DocsTocProps {
  /** The page's headings, as the MDX compiler lists them. */
  toc: TableOfContents;
}

/** The page's headings as in-page links, with the heading in view marked. Renders nothing for a page without one. */
function DocsToc({ toc }: DocsTocProps): ReactNode {
  if (toc.length === 0) return null;

  return (
    <AnchorProvider toc={toc}>
      <DocsTocList toc={toc} />
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

/** The marker's box within the list, in pixels. */
interface MarkerRect {
  top: number;
  height: number;
}

interface DocsTocListProps {
  /** The page's headings; unchanged for the list's lifetime, since a new TOC arrives on a new page. */
  toc: TableOfContents;
}

/**
 * The heading links plus the marker that slides to the one in view. `useMarkedAnchor` is read once
 * here, inside `AnchorProvider`, and passed down, rather than each link subscribing on its own.
 */
function DocsTocList({ toc }: DocsTocListProps): ReactNode {
  const activeId = useMarkedAnchor();
  const linksRef = useRef(new Map<string, HTMLAnchorElement>());
  const [marker, setMarker] = useState<MarkerRect | null>(null);

  // Runs before the browser paints, so the marker's first visible frame already sits at the active
  // link instead of starting at the list's top edge and sliding down to it.
  useLayoutEffect(() => {
    const link = activeId ? linksRef.current.get(activeId) : undefined;
    setMarker(link ? { top: link.offsetTop, height: link.offsetHeight } : null);
  }, [activeId]);

  return (
    <div data-slot="docs-toc" className="relative flex flex-col gap-2 px-6 text-sm">
      <p className="text-muted-foreground text-xs font-medium">On this page</p>
      {toc.map((item) => {
        const id = item.url.slice(1);
        return (
          <DocsTocLink
            key={item.url}
            item={item}
            active={activeId === id}
            ref={(el) => {
              if (el) linksRef.current.set(id, el);
              else linksRef.current.delete(id);
            }}
          />
        );
      })}
      {marker && (
        <span
          aria-hidden
          data-slot="docs-toc-marker"
          className="bg-foreground absolute left-3 w-px transition-[top,height] duration-200 ease-out motion-reduce:transition-none"
          style={{ top: marker.top, height: marker.height }}
        />
      )}
    </div>
  );
}

interface DocsTocLinkProps {
  /** The heading this link points at. */
  item: TOCItemType;
  /** Whether this is the heading the marker tracks. */
  active: boolean;
  ref: Ref<HTMLAnchorElement>;
}

function DocsTocLink({ item, active, ref }: DocsTocLinkProps): ReactNode {
  return (
    <a
      ref={ref}
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
