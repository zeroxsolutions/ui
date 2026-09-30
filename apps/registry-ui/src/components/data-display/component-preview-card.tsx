'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Card, CardContent } from '@/registry/bases/base-ui/ui/card';

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
    <Card data-slot="component-preview" data-not-typeset className={cn('mt-4 mb-12', className)} {...props}>
      <CardContent>
        <div
          data-align={align}
          className={cn(
            'flex h-72 w-full justify-center data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start',
            previewClassName,
          )}
        >
          {component}
        </div>
      </CardContent>
      {hideCode ? null : (
        <CardContent>
          <div data-slot="component-preview-code" className="flex flex-col gap-2">
            {codeOpen ? source : sourcePreview}
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
