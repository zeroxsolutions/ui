'use client';

import type { ReactNode } from 'react';

import { IconGallery } from '@zeroxsolutions/ui/site/components/data-display/icon-gallery';
import { IconGrid } from '@zeroxsolutions/ui/site/components/data-display/icon-grid';
import type { IconSet } from '@zeroxsolutions/ui/site/lib/icon-sets';

/** The gallery of the web icons, each drawn in a tile that plays it; on the client side, since its grid is a function. */
function WebIconGallery({ sets }: { sets: IconSet[] }): ReactNode {
  return (
    <IconGallery
      sets={sets}
      renderGrid={({ query, picked, onPick }) => <IconGrid sets={sets} query={query} picked={picked} onPick={onPick} />}
    />
  );
}

export { WebIconGallery };
