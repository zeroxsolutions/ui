'use client';

import { useState, type ReactNode, type SyntheticEvent } from 'react';

import { cn } from '../../../../registry/bases/base-ui/lib/utils';
import { themedViewHref, type PageTheme } from '../../lib/view-params';
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
}

/** The framed page's background and border tokens, for the address they were read from. */
interface ExampleFrameSurface {
  src: string;
  background: string;
  border: string;
}

/**
 * A demo's view page in a frame at `device`'s width, centred and as tall as the demo, in `theme`, on a stage
 * painted with that theme's background. The frame is a viewport of its own, so the demo's breakpoints and media
 * queries answer to the device's width; a frame wider than the stage scrolls sideways inside it. A tablet's or
 * a phone's frame shows its edges as a 1px border in the theme's border colour.
 */
function ExampleFrame({ name, viewHref, device, theme }: ExampleFrameProps): ReactNode {
  const src = themedViewHref(viewHref, theme);
  const [surface, setSurface] = useState<ExampleFrameSurface | null>(null);
  // Read off the framed page, as a theme's tokens are defined for the whole document and the stage sits in the
  // site's: a `.dark` scope would answer a dark frame, but nothing scopes the light theme inside a dark page.
  const read = (event: SyntheticEvent<HTMLIFrameElement>) => {
    const root = event.currentTarget.contentDocument?.documentElement;
    if (!root) return;
    const tokens = getComputedStyle(root);
    setSurface({
      src,
      background: tokens.getPropertyValue('--background').trim(),
      border: tokens.getPropertyValue('--border').trim(),
    });
  };
  const painted = surface?.src === src ? surface : null;

  return (
    // Until the page has loaded, a dark frame's stage takes the dark tokens from a `.dark` scope.
    <ScrollArea
      data-device={device}
      className={cn('bg-background', theme === 'dark' && 'dark')}
      style={{ background: painted?.background }}
    >
      <div data-slot="example-frame" className="min-w-fit p-4 in-data-[device=desktop]:p-0">
        <BlockFrame
          src={src}
          title={`${name}, ${device}, ${theme}`}
          fit
          onLoad={read}
          // Sized inside its border, so the framed window is the device's width and the demo's height.
          className="mx-auto box-content block h-72 border in-data-[device=desktop]:border-0"
          style={{
            width: device === 'desktop' ? undefined : DEVICE_WIDTHS[device],
            borderColor: painted?.border,
          }}
        />
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export { ExampleFrame };
