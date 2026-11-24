'use client';

import { useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';

import { useHydrated } from '../../hooks/use-hydrated';
import type { PageTheme } from '../../lib/view-params';
import { ComponentPreviewStage } from './component-preview';
import { ExampleFrame } from './example-frame';
import { ExamplePreviewToolbar, type ExamplePreviewDevice } from './example-preview-toolbar';
import { ExampleViewLink } from './example-view-link';

interface ExamplePreviewStageProps {
  /** The demo's name in the examples index. */
  name: string;
  /** The demo's page of its own, which the stage frames at another device or theme and a button opens. */
  viewHref: string;
  /** The demo, drawn inline at the desktop width in the site's own theme. */
  children: ReactNode;
}

/**
 * A demo's stage under a bar that picks the device it is drawn at and its theme. At the desktop width in the
 * site's theme the demo is drawn inline; at any other choice the stage frames the demo's own page at the
 * device's width, centred and as tall as the demo, in the chosen theme, since a theme is a class on `<html>`
 * and a part of the page cannot take the other one.
 */
function ExamplePreviewStage({ name, viewHref, children }: ExamplePreviewStageProps): ReactNode {
  const hydrated = useHydrated();
  const site = useTheme().resolvedTheme as PageTheme | undefined;
  const [device, setDevice] = useState<ExamplePreviewDevice>('desktop');
  // `null` follows the site's theme, as a theme picked equal to it does.
  const [picked, setPicked] = useState<PageTheme | null>(null);
  const theme = hydrated ? (picked ?? site) : undefined;
  const framed = theme !== undefined && (device !== 'desktop' || theme !== site);

  return (
    <div data-slot="example-preview-stage" data-device={device} data-framed={framed || undefined}>
      <div className="border-foreground/10 flex items-center justify-end gap-1 border-b p-1.5">
        <ExamplePreviewToolbar
          device={device}
          theme={theme}
          onDeviceChange={setDevice}
          onThemeChange={(next) => setPicked(next === site ? null : next)}
        />
        <ExampleViewLink name={name} href={viewHref} />
      </div>
      {framed ? (
        <ExampleFrame name={name} viewHref={viewHref} device={device} theme={theme} />
      ) : (
        <ComponentPreviewStage>{children}</ComponentPreviewStage>
      )}
    </div>
  );
}

export { ExamplePreviewStage };
