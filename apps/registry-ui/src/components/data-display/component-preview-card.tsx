'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';

interface ComponentPreviewCardProps extends ComponentProps<'div'> {
  /** Placement for the area the demo sits in. */
  previewClassName?: string;
  /** Where the demo sits on the cross axis. */
  align?: 'center' | 'start' | 'end';
  /** Shows the demo alone, with no source under it. */
  hideCode?: boolean;
  /** The rendered demo. */
  component: ReactNode;
  /** The demo's whole source. */
  source: ReactNode;
  /** Its first lines, shown under a fade until `View code` opens `source`. */
  sourcePreview?: ReactNode;
}

/**
 * One frame on the card's surface: the demo on top and its source flush beneath it, split by a rule.
 * Collapsed, the source's first lines fade into the code surface behind a `View code` button.
 */
function ComponentPreviewCard({
  className,
  previewClassName,
  align = 'center',
  hideCode = false,
  component,
  source,
  sourcePreview,
  ...props
}: ComponentPreviewCardProps): ReactNode {
  const [codeOpen, setCodeOpen] = useState(false);

  return (
    <div
      data-slot="component-preview"
      className={cn('ring-foreground/10 mt-4 mb-12 flex flex-col overflow-hidden rounded-xl ring-1', className)}
      {...props}
    >
      {/* A demo taller or wider than the area scrolls inside it rather than spilling out of the frame. */}
      <ScrollArea className={cn('h-72', previewClassName)}>
        <div
          data-align={align}
          className="flex min-h-full min-w-fit justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start"
        >
          {component}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {hideCode ? null : (
        <div
          data-slot="component-preview-code"
          className="bg-code border-foreground/10 border-t **:data-[slot=code-block-viewport]:max-h-96"
        >
          {codeOpen ? (
            source
          ) : (
            <div className="relative">
              {/* An excerpt under the fade, not a scroller: its overflow clips, and it takes no focus. */}
              <div inert className="overflow-hidden">
                {sourcePreview}
              </div>
              <div className="from-code via-code/60 absolute inset-0 flex items-center justify-center bg-linear-to-t to-transparent">
                <Button variant="outline" size="sm" onClick={() => setCodeOpen(true)}>
                  View code
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { ComponentPreviewCard };
