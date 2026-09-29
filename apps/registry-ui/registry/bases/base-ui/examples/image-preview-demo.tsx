import type { ReactNode } from 'react';

import { ImagePreview } from '@/registry/bases/base-ui/components/data-display/image-preview';

const SAMPLE_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="32" fill="#4f46e5"/></svg>',
  );

/** A small sample graphic over the transparency checkerboard, contained within its sized wrapper. */
function ImagePreviewDemo(): ReactNode {
  return (
    <div className="size-32">
      <ImagePreview src={SAMPLE_IMAGE} alt="Sample circular graphic" />
    </div>
  );
}

export { ImagePreviewDemo };
