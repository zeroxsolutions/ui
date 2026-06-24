import type { ComponentPropsWithoutRef } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * The shared panel scroll frame — a {@link ScrollArea} sized to fill a docked
 * panel body, so the scrollbar + behaviour match everywhere instead of each
 * panel hand-rolling an `overflow-y-auto` div.
 */
export function PanelScroll({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ScrollArea>) {
  return <ScrollArea className={cn('h-full', className)} {...props} />;
}
