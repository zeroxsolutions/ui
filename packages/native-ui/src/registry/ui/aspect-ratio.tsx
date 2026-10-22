import * as AspectRatioPrimitive from '@rn-primitives/aspect-ratio';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type AspectRatioProps = AspectRatioPrimitive.RootProps & {
  /** Width over height, such as `16 / 9`. */
  ratio: number;
};

/**
 * A frame whose height follows its width at `ratio`, for an image, a video or a map. It is as wide as
 * its parent lets it be; a child sized `absolute inset-0` or `size-full` fills it.
 */
function AspectRatio({ className, ...props }: AspectRatioProps): ReactNode {
  return <AspectRatioPrimitive.Root className={cn('relative', className)} {...props} />;
}

export { AspectRatio };
export type { AspectRatioProps };
