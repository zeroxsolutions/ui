'use client';

import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
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
 * The source under the demo, on the code surface and split from it by a rule. Closed, it shows its
 * `ComponentPreviewExcerpt`; `View code` opens its `ComponentPreviewCode`.
 */
function ComponentPreviewSource({ className, ...props }: ComponentProps<typeof Collapsible>): ReactNode {
  return (
    <Collapsible
      data-slot="component-preview-source"
      className={cn(
        'group/component-preview-source bg-code border-foreground/10 border-t **:data-[slot=code-block-viewport]:max-h-96',
        className,
      )}
      {...props}
    />
  );
}

/** The source's first lines, fading into the code surface under the `View code` trigger; gone once it opens. */
function ComponentPreviewExcerpt({ className, children, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="component-preview-excerpt"
      className={cn('relative group-has-data-[slot=component-preview-code]/component-preview-source:hidden', className)}
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

/** The whole source, shown once `View code` opens it. */
function ComponentPreviewCode(props: ComponentProps<typeof CollapsibleContent>): ReactNode {
  return <CollapsibleContent data-slot="component-preview-code" {...props} />;
}

export {
  ComponentPreview,
  ComponentPreviewStage,
  ComponentPreviewCaption,
  ComponentPreviewSource,
  ComponentPreviewExcerpt,
  ComponentPreviewCode,
};
