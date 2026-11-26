'use client';

import { useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';

import { forceTheme } from '../../hooks/use-forced-theme';
import { useHydrated } from '../../hooks/use-hydrated';
import { viewPageScript, type PageTheme } from '../../lib/view-params';
import { ExampleFrame } from '../data-display/example-frame';
import { ExamplePreviewToolbar, type ExamplePreviewDevice } from '../data-display/example-preview-toolbar';
import { RegistryExample } from '../data-display/registry-example';
import { ScrollArea, ScrollBar } from '../../../../registry/bases/base-ui/ui/scroll-area';

interface ExampleViewProps {
  /** The demo's or block's name in the examples index. */
  name: string;
  /** This page's own address, which it frames itself at at a tablet's or a phone's width. */
  href: string;
}

/**
 * One block or demo alone on the page's background, with no site chrome: what a docs frame shows, and what a
 * preview's full page button opens. At the desktop width the demo sits centred and at the top, padded as the
 * docs stage pads it; at a tablet's or a phone's the page frames itself, so the demo's breakpoints answer to
 * that width. The device and theme controls float at the top right; under `?embed=1`, as a docs preview's frame
 * loads the page, they stay hidden, as the preview has its own. `?theme=` draws the page in that theme, and a
 * frame sized to the demo reads the demo's height off `[data-slot=example-view]`. The page is one viewport tall
 * and scrolls inside its own scroll area, so a frame shows the design system's scrollbars rather than the
 * browser's.
 */
function ExampleView({ name, href }: ExampleViewProps): ReactNode {
  const hydrated = useHydrated();
  const { forcedTheme, resolvedTheme } = useTheme();
  const [device, setDevice] = useState<ExamplePreviewDevice>('desktop');
  const theme = hydrated ? ((forcedTheme ?? resolvedTheme) as PageTheme | undefined) : undefined;

  return (
    <>
      {/* The script's text is the same on the server and the client, so hydration keeps it as it is. */}
      <script dangerouslySetInnerHTML={{ __html: viewPageScript() }} />
      <div
        data-slot="example-view-controls"
        className="cn-example-view-controls bg-background/80 fixed top-3 right-3 z-50 backdrop-blur in-data-embed:hidden"
      >
        <ExamplePreviewToolbar device={device} theme={theme} onDeviceChange={setDevice} onThemeChange={forceTheme} />
      </div>
      {device === 'desktop' || theme === undefined ? (
        <ScrollArea className="bg-background h-svh w-full">
          <main data-slot="example-view" className="flex min-w-fit justify-center p-4 sm:p-10">
            <RegistryExample name={name} />
          </main>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <ExampleFrame name={name} viewHref={href} device={device} theme={theme} className="h-svh" />
      )}
    </>
  );
}

export { ExampleView };
