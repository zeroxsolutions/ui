import type { ReactNode } from 'react';

import { RegistryExample } from '@zeroxsolutions/ui/site/components/data-display/registry-example';
import { ScrollArea, ScrollBar } from '@zeroxsolutions/ui/registry/bases/base-ui/ui/scroll-area';

/**
 * One block alone, with no site chrome, as the frames on the docs and the blocks page show it. `name` is the
 * block's registry name. The page is one viewport tall and scrolls inside its own scroll area, so a frame shows
 * the design system's scrollbars rather than the browser's.
 */
function ViewPage({ name }: { name: string }): ReactNode {
  return (
    <ScrollArea className="h-svh w-full">
      <main className="p-6">
        <RegistryExample name={name} />
      </main>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export { ViewPage };
