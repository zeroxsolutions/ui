import type { ReactNode } from 'react';

import { FontPreview } from '@/registry/bases/base-ui/components/data-display/font-preview';

/** A specimen of a variable sans-serif at its four default sizes. */
function FontPreviewDemo(): ReactNode {
  return <FontPreview src="/fonts/inter-variable.woff2" />;
}

export { FontPreviewDemo };
