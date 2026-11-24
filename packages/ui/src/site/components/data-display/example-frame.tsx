'use client';

import type { ReactNode } from 'react';

import { embeddedViewHref, type PageTheme } from '../../lib/view-params';
import { BlockFrame } from './block-frame';
import { DEVICE_WIDTHS, type ExamplePreviewDevice } from './example-preview-toolbar';
import { ScrollArea, ScrollBar } from '../../../../registry/bases/base-ui/ui/scroll-area';

interface ExampleFrameProps {
  /** The demo's name, which the frame's title names with the device and the theme. */
  name: string;
  /** The demo's view page. */
  viewHref: string;
  device: ExamplePreviewDevice;
  theme: PageTheme;
  className?: string;
}

/**
 * A demo's view page embedded in a frame at `device`'s width, centred, as tall as the demo, in `theme`. The
 * frame is a viewport of its own, so the demo's breakpoints and media queries answer to the device's width;
 * a frame wider than its container scrolls sideways inside it.
 */
function ExampleFrame({ name, viewHref, device, theme, className }: ExampleFrameProps): ReactNode {
  return (
    <ScrollArea data-device={device} className={className}>
      <div
        data-slot="example-frame"
        data-device={device}
        className="group/example-frame min-w-fit p-4 data-[device=desktop]:p-0"
      >
        <BlockFrame
          src={embeddedViewHref(viewHref, theme)}
          title={`${name}, ${device}, ${theme}`}
          fit
          className="ring-foreground/10 mx-auto block h-72 ring-1 group-data-[device=desktop]/example-frame:ring-0"
          style={device === 'desktop' ? undefined : { width: DEVICE_WIDTHS[device] }}
        />
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export { ExampleFrame };
