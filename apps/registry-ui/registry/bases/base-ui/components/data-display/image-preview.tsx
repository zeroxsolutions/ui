import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface ImagePreviewProps extends ComponentProps<'img'> {
  /** Image source: an asset URL, blob URL, or data URL. */
  src: string;
}

/**
 * Shows an image contained within its container, over a checkerboard so
 * transparent pixels read clearly. Fills the space it is given (the consumer
 * sizes the wrapper); `className` and other `img` props apply to the image. `alt`
 * defaults to empty (decorative).
 */
function ImagePreview({ src, alt = '', className, ...props }: ImagePreviewProps): ReactNode {
  return (
    <div
      data-slot="image-preview"
      className="flex size-full items-center justify-center overflow-hidden rounded-md bg-[image:repeating-conic-gradient(var(--muted)_0_25%,var(--background)_0_50%)] bg-size-[--spacing(4)_--spacing(4)]"
    >
      <img src={src} alt={alt} className={cn('max-h-full max-w-full object-contain', className)} {...props} />
    </div>
  );
}

export { ImagePreview };
export type { ImagePreviewProps };
