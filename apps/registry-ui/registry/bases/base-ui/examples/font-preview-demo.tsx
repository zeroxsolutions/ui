import type { ReactNode } from 'react';

import { FontPreview } from '@/registry/bases/base-ui/components/data-display/font-preview';

/** Inter's Latin subset, as Fontsource publishes it, so the demo loads a real file wherever it is installed. */
const INTER_URL = 'https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5/files/inter-latin-wght-normal.woff2';

/** A specimen of a variable sans-serif at its four default sizes. */
function FontPreviewDemo(): ReactNode {
  return <FontPreview src={INTER_URL} />;
}

export { FontPreviewDemo };
