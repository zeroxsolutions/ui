import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * A frame that shows an image contained within it, over a checkerboard so transparent pixels read
 * clearly. It fills the space it is given, so the consumer sizes its wrapper. Compose the image
 * as `ImagePreviewImage`:
 *
 * ```tsx
 * <ImagePreview>
 *   <ImagePreviewImage src={src} alt="Logo" />
 * </ImagePreview>
 * ```
 */
function ImagePreview({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="image-preview"
      className={cn('bg-checkerboard flex size-full items-center justify-center overflow-hidden rounded-md', className)}
      {...props}
    />
  );
}

/** The previewed image, scaled down to fit the frame; `alt` defaults to empty (decorative). */
function ImagePreviewImage({ alt = '', className, ...props }: ComponentProps<'img'>): ReactNode {
  return (
    <img
      data-slot="image-preview-image"
      alt={alt}
      className={cn('max-h-full max-w-full object-contain', className)}
      {...props}
    />
  );
}

export { ImagePreview, ImagePreviewImage };
