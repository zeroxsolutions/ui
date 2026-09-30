import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { viewRoute } from '@/routes/app-routes';

interface BlockFrameProps extends ComponentProps<'iframe'> {
  /** A block `registry.json` publishes. */
  name: string;
  /** What the frame shows, which a screen reader announces for it. */
  title: string;
}

/** A published block on its own page, in a frame as wide as its container, so its breakpoints answer to the frame. */
function BlockFrame({ name, className, ...props }: BlockFrameProps): ReactNode {
  return (
    <iframe
      data-slot="block-frame"
      src={viewRoute.build({ name })}
      loading="lazy"
      className={cn('bg-background h-[36rem] w-full rounded-xl border', className)}
      {...props}
    />
  );
}

export { BlockFrame };
