import type { ReactNode } from 'react';

import { RegistryExample } from '../data-display/registry-example';
import { ScrollArea, ScrollBar } from '../../../../registry/bases/base-ui/ui/scroll-area';

/**
 * One block or demo alone, with no site chrome: what a docs frame shows, and what a preview's full page
 * button opens. `name` is its name in the examples index. The page is one viewport tall and scrolls inside its own scroll area, so a frame shows
 * the design system's scrollbars rather than the browser's.
 */
function ExampleView({ name }: { name: string }): ReactNode {
  return (
    <ScrollArea className="h-svh w-full">
      <main className="p-6">
        <RegistryExample name={name} />
      </main>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export { ExampleView };
