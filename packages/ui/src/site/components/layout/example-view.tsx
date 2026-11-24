'use client';

import { useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';

import { useHost } from '../../../host/host-provider';
import { forceTheme } from '../../hooks/use-forced-theme';
import { useHydrated } from '../../hooks/use-hydrated';
import { viewPageScript, type PageTheme } from '../../lib/view-params';
import { ExampleFrame } from '../data-display/example-frame';
import { ExamplePreviewToolbar, type ExamplePreviewDevice } from '../data-display/example-preview-toolbar';
import { RegistryExample } from '../data-display/registry-example';
import { ArrowLeftIcon } from '../../../../registry/bases/base-ui/icons/lucide/arrow-left-icon';
import { useAnimatedIcon } from '../../../../registry/bases/base-ui/hooks/use-animated-icon';
import { buttonVariants } from '../../../../registry/bases/base-ui/ui/button';
import { ScrollArea, ScrollBar } from '../../../../registry/bases/base-ui/ui/scroll-area';

interface ExampleViewProps {
  /** The demo's or block's name in the examples index. */
  name: string;
  /** This page's own address, which it frames itself at at a tablet's or a phone's width. */
  href: string;
  /** The docs page that previews the demo, or the docs home where none does. */
  docsHref: string;
}

/**
 * One block or demo on a page of its own: a bar with a link back to its docs, its name, and the device and
 * theme it is drawn at, over a muted stage holding the demo. At the desktop width the demo is drawn on the
 * stage; at a tablet's or a phone's the page frames itself, so the demo's breakpoints answer to that width.
 * Under `?embed=1`, as a docs preview frames it, the page draws the demo alone, padded as the docs stage pads
 * it, and a frame sized to the demo reads the demo's height off `[data-slot=example-view]`. `?theme=` draws it
 * in that theme. The page is one viewport tall and scrolls inside its own scroll area, so a frame shows the
 * design system's scrollbars rather than the browser's.
 */
function ExampleView({ name, href, docsHref }: ExampleViewProps): ReactNode {
  const hydrated = useHydrated();
  const { forcedTheme, resolvedTheme } = useTheme();
  const [device, setDevice] = useState<ExamplePreviewDevice>('desktop');
  const theme = hydrated ? ((forcedTheme ?? resolvedTheme) as PageTheme | undefined) : undefined;

  return (
    <>
      {/* The script's text is the same on the server and the client, so hydration keeps it as it is. */}
      <script dangerouslySetInnerHTML={{ __html: viewPageScript() }} />
      <div data-slot="example-view-page" className="flex h-svh flex-col">
        <ExampleViewBar name={name} docsHref={docsHref}>
          <ExamplePreviewToolbar device={device} theme={theme} onDeviceChange={setDevice} onThemeChange={forceTheme} />
        </ExampleViewBar>
        <ScrollArea className="bg-muted/40 min-h-0 flex-1 in-data-embed:bg-transparent">
          {device === 'desktop' || theme === undefined ? (
            <div className="p-6 in-data-embed:p-0">
              <div className="bg-background ring-foreground/10 rounded-xl ring-1 in-data-embed:rounded-none in-data-embed:bg-transparent in-data-embed:ring-0">
                <main
                  data-slot="example-view"
                  className="flex min-h-72 min-w-fit items-center justify-center p-4 sm:p-10"
                >
                  <RegistryExample name={name} />
                </main>
              </div>
            </div>
          ) : (
            <ExampleFrame name={name} viewHref={href} device={device} theme={theme} className="py-2" />
          )}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
}

interface ExampleViewBarProps {
  name: string;
  docsHref: string;
  /** The controls at the bar's end. */
  children: ReactNode;
}

/** The view page's top bar: back to the docs, the demo's name, then `children`. An embedded page draws none. */
function ExampleViewBar({ name, docsHref, children }: ExampleViewBarProps): ReactNode {
  const { Link } = useHost();
  const icon = useAnimatedIcon();
  return (
    <header
      data-slot="example-view-bar"
      className="border-foreground/10 flex shrink-0 items-center gap-2 border-b px-2 py-1.5 in-data-embed:hidden"
    >
      <Link
        href={docsHref}
        aria-label="Back to the docs"
        title="Back to the docs"
        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
        {...icon.handlers}
      >
        <ArrowLeftIcon ref={icon.ref} aria-hidden />
      </Link>
      <h1 className="min-w-0 flex-1 truncate font-mono text-sm">{name}</h1>
      {children}
    </header>
  );
}

export { ExampleView };
