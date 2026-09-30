'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Card, CardContent } from '@/registry/bases/base-ui/ui/card';
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';

interface ComponentPreviewCardProps extends ComponentProps<typeof Card> {
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
  /** Its first lines, shown until `View code` opens `source`. */
  sourcePreview?: ReactNode;
}

/** One card: the demo on top, and below it the first lines of its source with a `View code` button that shows it whole. */
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
    <Card data-slot="component-preview" className={cn('mt-4 mb-12', className)} {...props}>
      <CardContent>
        {/* A demo taller or wider than the area scrolls inside it rather than spilling out of the card. */}
        <ScrollArea data-slot="component-preview-demo" className={cn('h-72 w-full', previewClassName)}>
          <div
            data-align={align}
            className="flex min-h-full w-full min-w-fit justify-center data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start"
          >
            {component}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
      {hideCode ? null : (
        <CardContent>
          <div data-slot="component-preview-code" className="flex flex-col gap-2">
            {codeOpen ? (
              source
            ) : (
              // An excerpt to open with `View code`, not a scroller: its overflow clips, and it takes no focus.
              <div inert className="overflow-hidden **:data-[slot=scroll-area-scrollbar]:hidden">
                {sourcePreview}
              </div>
            )}
            {codeOpen ? null : (
              <Button variant="outline" size="sm" className="self-center" onClick={() => setCodeOpen(true)}>
                View code
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export { ComponentPreviewCard };
