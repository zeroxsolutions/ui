'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/bases/base-ui/ui/collapsible';
import { Separator } from '@/registry/bases/base-ui/ui/separator';

/**
 * A code block cut to its first lines under a fade, with `Expand` in its header and across its foot,
 * upstream's. Base UI's panel hides itself while closed, even kept mounted, so the panel drops the
 * `hidden` attribute and the closed state is drawn by the height cap alone, as upstream's `forceMount` is.
 */
function CodeCollapsibleWrapper({ className, children, ...props }: ComponentProps<typeof Collapsible>): ReactNode {
  const [isOpened, setIsOpened] = useState(false);

  return (
    <Collapsible
      open={isOpened}
      onOpenChange={setIsOpened}
      className={cn('group/collapsible relative md:-mx-1', className)}
      {...props}
    >
      <div className="absolute top-1.5 right-9 z-10 flex items-center">
        <CollapsibleTrigger
          render={<Button variant="ghost" size="sm" className="text-muted-foreground h-7 rounded-md px-2" />}
        >
          {isOpened ? 'Collapse' : 'Expand'}
        </CollapsibleTrigger>
        <Separator orientation="vertical" className="mx-1.5 h-4!" />
      </div>
      <CollapsibleContent
        keepMounted
        render={(panelProps) => <div {...panelProps} hidden={false} />}
        className="relative mt-6 overflow-hidden data-closed:max-h-64 data-closed:[content-visibility:auto] [&>figure]:mt-0 [&>figure]:md:mx-0!"
      >
        {children}
      </CollapsibleContent>
      <CollapsibleTrigger className="from-code/70 to-code text-muted-foreground absolute inset-x-0 -bottom-2 flex h-20 items-center justify-center rounded-b-lg bg-gradient-to-b text-sm data-panel-open:hidden">
        {isOpened ? 'Collapse' : 'Expand'}
      </CollapsibleTrigger>
    </Collapsible>
  );
}

export { CodeCollapsibleWrapper };
