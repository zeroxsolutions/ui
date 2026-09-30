'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';

interface ComponentPreviewTabsProps extends ComponentProps<'div'> {
  /** Classes for the area the demo sits in. */
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
 * One card, upstream's: the demo on top and its source below it, cut to its first lines under a fade
 * with a `View code` button that shows it whole. Upstream's RTL and language switch are left out: this
 * site has no right-to-left demo.
 */
function ComponentPreviewTabs({
  className,
  previewClassName,
  align = 'center',
  hideCode = false,
  component,
  source,
  sourcePreview,
  ...props
}: ComponentPreviewTabsProps): ReactNode {
  const [isMobileCodeVisible, setIsMobileCodeVisible] = useState(false);

  return (
    <div
      data-slot="component-preview"
      data-not-typeset
      className={cn('group relative mt-4 mb-12 flex flex-col overflow-hidden rounded-2xl border', className)}
      {...props}
    >
      <div data-slot="preview">
        <div
          data-align={align}
          className={cn(
            'preview relative flex h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-start data-[align=start]:items-start sm:data-[align=end]:items-end',
            previewClassName,
          )}
        >
          {component}
        </div>
      </div>
      {!hideCode && (
        <div
          data-slot="code"
          data-mobile-code-visible={isMobileCodeVisible}
          className="relative overflow-hidden **:data-[slot=code-block]:m-0! **:data-[slot=code-block]:rounded-none **:data-[slot=code-block]:border-t **:data-[slot=code-block-copy]:hidden data-[mobile-code-visible=true]:**:data-[slot=code-block-copy]:flex **:data-[slot=code-block-viewport]:max-h-72"
        >
          {isMobileCodeVisible ? (
            source
          ) : (
            <div className="relative">
              {sourcePreview}
              <div className="absolute inset-0 flex items-center justify-center pb-4">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      // The code block's surface (the card's background under `bg-muted/50`), fading up into the code.
                      'linear-gradient(to top, color-mix(in oklab, var(--color-muted) 50%, var(--color-background)), color-mix(in oklab, var(--color-muted) 30%, transparent), transparent)',
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-background text-foreground hover:bg-muted dark:bg-background dark:text-foreground dark:hover:bg-muted relative z-10 rounded-lg shadow-none"
                  onClick={() => setIsMobileCodeVisible(true)}
                >
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

export { ComponentPreviewTabs };
