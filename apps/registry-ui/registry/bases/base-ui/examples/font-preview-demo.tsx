import type { ReactNode } from 'react';

import { FontPreview } from '@/registry/bases/base-ui/components/data-display/font-preview';

/** Inter's Latin subset, as Fontsource publishes it, so the demo loads a real file wherever it is installed. */
const INTER_URL = 'https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5/files/inter-latin-wght-normal.woff2';

/**
 * A specimen of a variable sans-serif at its four default sizes, in the width a caller gives it.
 * Narrower than other demos' usual `max-w-sm`, because a truncated line never shrinks on its
 * own, so the width here must already clear a phone-width preview stage.
 */
function FontPreviewDemo(): ReactNode {
  return (
    <div className="w-full max-w-72">
      <FontPreview src={INTER_URL} />
    </div>
  );
}

export { FontPreviewDemo };
