'use client';

import { Suspense, type ComponentProps, type ReactNode } from 'react';

import { useCurrentStyle } from '../../hooks/use-current-style';
import { styleHref } from '../../lib/style-choice';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';

interface BlockFrameProps extends ComponentProps<'iframe'> {
  /** The address of the page that renders the block alone. */
  src: string;
  /** What the frame shows, which a screen reader announces for it. */
  title: string;
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
  return <BlockFrameAt src={styleHref(src, '', 'web', useCurrentStyle('web'))} {...props} />;
}

function BlockFrameAt({ src, className, ...props }: BlockFrameProps): ReactNode {
  return (
    <iframe
      data-slot="block-frame"
      src={src}
      loading="lazy"
      className={cn('bg-background h-144 w-full', className)}
      {...props}
    />
  );
}

export { BlockFrame };
