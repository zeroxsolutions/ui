'use client';

import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { ScrollArea, ScrollBar } from '@/registry/bases/base-ui/ui/scroll-area';

/**
 * One frame on the card's ring and radius. Compose what it shows: a `ComponentPreviewStage` holding a
 * demo, or a framed page that fills it edge to edge, then a `ComponentPreviewSource` flush beneath.
 */
function ComponentPreview({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="component-preview"
      className={cn('ring-foreground/10 flex flex-col overflow-hidden rounded-xl ring-1', className)}
      {...props}
    />
  );
}

interface ComponentPreviewStageProps extends ComponentProps<typeof ScrollArea> {
  /** Where the demo sits on the cross axis. */
  align?: 'center' | 'start' | 'end';
}

/** The area a demo sits in; a demo taller or wider than it scrolls inside rather than spilling out. */
function ComponentPreviewStage({
  align = 'center',
  className,
  children,
  ...props
}: ComponentPreviewStageProps): ReactNode {
  return (
    <ScrollArea data-slot="component-preview-stage" className={cn('h-72', className)} {...props}>
      <div
        data-align={align}
        className="flex min-h-full min-w-fit justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start"
      >
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/** A line under the stage naming what it shows, split from it by a rule. */
function ComponentPreviewCaption({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="component-preview-caption"
      className={cn(
        'border-foreground/10 flex items-center justify-between gap-2 border-t px-4 py-3 text-sm',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The source under the demo, on the code surface and split from it by a rule. It holds one code
 * block, closed until `View code` opens it and the header's own trigger closes it again: closed, the
 * block shows a `ComponentPreviewExcerpt` under its header; open, its own content.
 */
function ComponentPreviewSource({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="component-preview-source"
      // Measured from `ExampleSource`'s rendered excerpt (its `EXCERPT_LINES` lines plus the code
      // block's own padding) at the default 16px root font size; the open block's panel starts and
      // ends at this height so it grows out of the excerpt rather than from zero.
      className={cn(
        'bg-code border-foreground/10 border-t [--component-preview-excerpt-height:4.90625rem] **:data-[slot=code-block-viewport]:max-h-96',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The source's first lines, fading into the code surface under the `View code` trigger, which opens
 * the code block it sits in. It shows once that block's own panel is gone, not the instant it starts
 * closing, so it never overlaps the panel while the panel is still shrinking.
 */
function ComponentPreviewExcerpt({ className, children, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="component-preview-excerpt"
      // Keyed on the open block's own panel being mounted (a direct child of the collapsible card),
      // not on the card's data-open: that flips at once on close, while the panel stays mounted for
      // its own 200ms exit. The `>` excludes the excerpt's own nested code block, which is always
      // mounted and would otherwise match every time.
      className={cn(
        'relative transition-opacity duration-200 ease-out group-has-[>[data-slot=code-block-content]]/collapsible-card:hidden motion-reduce:transition-none starting:opacity-0',
        className,
      )}
      {...props}
    >
      {/* An excerpt, not a scroller: its overflow clips, and it takes no focus. */}
      <div inert className="overflow-hidden">
        {children}
      </div>
      <div className="from-code via-code/60 absolute inset-0 flex items-center justify-center bg-linear-to-t to-transparent">
        <CollapsibleTrigger render={<Button variant="outline" size="sm" />}>View code</CollapsibleTrigger>
      </div>
    </div>
  );
}

export {
  ComponentPreview,
  ComponentPreviewStage,
  ComponentPreviewCaption,
  ComponentPreviewSource,
  ComponentPreviewExcerpt,
};
