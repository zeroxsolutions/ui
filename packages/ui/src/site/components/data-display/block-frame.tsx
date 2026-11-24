'use client';

import { Suspense, useEffect, useRef, useState, type ComponentProps, type ReactNode, type SyntheticEvent } from 'react';

import { useCurrentStyle } from '../../hooks/use-current-style';
import { styleHref } from '../../lib/style-choice';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';

interface BlockFrameProps extends ComponentProps<'iframe'> {
  /** The address of the page that renders the block alone; it may carry a query of its own. */
  src: string;
  /** What the frame shows, which a screen reader announces for it. */
  title: string;
  /**
   * Makes the frame as tall as the page's `[data-slot=example-view]`, following it as it grows, rather than a
   * fixed height. The page has to be on this origin.
   */
  fit?: boolean;
}

/**
 * A published block on its own page, in a frame as wide as its container, so its breakpoints answer to
 * the frame. It draws no surface; a `ComponentPreview` around it does. The frame's address carries the
 * page's style, so a style the page has only from its own URL reaches the frame too.
 */
function BlockFrame(props: BlockFrameProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered page frames the default.
    <Suspense fallback={<BlockFrameAt {...props} />}>
      <BlockFrameInStyle {...props} />
    </Suspense>
  );
}

function BlockFrameInStyle({ src, ...props }: BlockFrameProps): ReactNode {
  const query = src.indexOf('?');
  const pathname = query < 0 ? src : src.slice(0, query);
  const search = query < 0 ? '' : src.slice(query);
  return <BlockFrameAt src={styleHref(pathname, search, 'web', useCurrentStyle('web'))} {...props} />;
}

function BlockFrameAt({ src, fit = false, className, style, onLoad, ...props }: BlockFrameProps): ReactNode {
  const [height, setHeight] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  useEffect(() => () => observer.current?.disconnect(), []);

  const follow = (event: SyntheticEvent<HTMLIFrameElement>) => {
    onLoad?.(event);
    if (!fit) return;
    observer.current?.disconnect();
    const view = event.currentTarget.contentWindow;
    const content = view?.document.querySelector('[data-slot=example-view]');
    if (!view || !content) return;
    // Observed from the frame's own window, which lays out the frame's document.
    const Observer = (view as Window & typeof globalThis).ResizeObserver;
    const watch = new Observer(() => setHeight(Math.ceil(content.getBoundingClientRect().height)));
    watch.observe(content);
    observer.current = watch;
  };

  return (
    <iframe
      data-slot="block-frame"
      src={src}
      loading="lazy"
      className={cn('bg-background h-144 w-full', className)}
      style={fit && height !== null ? { ...style, height } : style}
      onLoad={follow}
      {...props}
    />
  );
}

export { BlockFrame };
export type { BlockFrameProps };
