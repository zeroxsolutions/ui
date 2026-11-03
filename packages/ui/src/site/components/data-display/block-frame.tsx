import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../../../../registry/bases/base-ui/lib/utils';

interface BlockFrameProps extends ComponentProps<'iframe'> {
  /** The address of the page that renders the block alone. */
  src: string;
  /** What the frame shows, which a screen reader announces for it. */
  title: string;
}

/**
 * A published block on its own page, in a frame as wide as its container, so its breakpoints answer to
 * the frame. It draws no surface; a `ComponentPreview` around it does.
 */
function BlockFrame({ src, className, ...props }: BlockFrameProps): ReactNode {
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
