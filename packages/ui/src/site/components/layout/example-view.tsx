import type { ReactNode } from 'react';

import { RegistryExample } from '../data-display/registry-example';
import { forcedThemeScript } from '../../lib/view-params';
import { ScrollArea, ScrollBar } from '../../../../registry/bases/base-ui/ui/scroll-area';

/**
 * One block or demo alone on the page's background, with no site chrome: what a docs frame shows, and what a
 * preview's full page button opens. `name` is its name in the examples index. The demo sits centred and at the
 * top, padded as the docs stage pads it. A `?theme=` draws it in that theme, and a frame sized to the demo reads
 * the demo's height off `[data-slot=example-view]`. The page is one viewport tall and scrolls inside its own
 * scroll area, so a frame shows the design system's scrollbars rather than the browser's.
 */
function ExampleView({ name }: { name: string }): ReactNode {
  return (
    <>
      {/* The script's text is the same on the server and the client, so hydration keeps it as it is. */}
      <script dangerouslySetInnerHTML={{ __html: forcedThemeScript() }} />
      <ScrollArea className="bg-background h-svh w-full">
        <main data-slot="example-view" className="flex min-w-fit justify-center p-4 sm:p-10">
          <RegistryExample name={name} />
        </main>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
}

export { ExampleView };
