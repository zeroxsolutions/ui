import type { ReactNode } from 'react';

import { WebIconGallery } from '../components/data-display/web-icon-gallery';
import { publishedIconSets } from '../lib/published-items';

/** Every animated icon the registry publishes, by set, each played as the reader points at it or focuses it. */
function IconsPage(): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Icons</h1>
        <p className="text-muted-foreground">
          Animated icons, each its own registry item. Point at an icon or focus it to play it, and pick it for its
          install line and its usage. An icon plays only when the control holding it asks, and stays still for a reader
          who asked for reduced motion.
        </p>
      </header>
      <WebIconGallery sets={publishedIconSets} />
    </div>
  );
}

export { IconsPage };
