import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

interface ImagePreviewProps extends React.ComponentProps<'img'> {
  /** Image source — an asset URL, blob URL, or data URL. */
  src: string;
}

/** A classic light/dark checkerboard so transparent pixels read clearly. */
const CHECKERBOARD: React.CSSProperties = {
  backgroundColor: 'var(--background)',
  backgroundImage:
    'linear-gradient(45deg, var(--muted) 25%, transparent 25%), ' +
    'linear-gradient(-45deg, var(--muted) 25%, transparent 25%), ' +
    'linear-gradient(45deg, transparent 75%, var(--muted) 75%), ' +
    'linear-gradient(-45deg, transparent 75%, var(--muted) 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
};

/**
 * Shows an image asset contained within its container, over a subtle
 * checkerboard backdrop. Fills the space it's given (the consumer sizes the
 * wrapper); `className` and other `img` props apply to the image. Pass `alt` for
 * the accessible name — it defaults to empty (decorative).
 */
function ImagePreview({ src, alt = '', className, ...props }: ImagePreviewProps) {
  return (
    <div
      data-slot="image-preview"
      className="flex size-full items-center justify-center overflow-hidden rounded-md"
      style={CHECKERBOARD}
    >
      <img src={src} alt={alt} className={cn('max-h-full max-w-full object-contain', className)} {...props} />
    </div>
  );
}

export { ImagePreview };
export type { ImagePreviewProps };
