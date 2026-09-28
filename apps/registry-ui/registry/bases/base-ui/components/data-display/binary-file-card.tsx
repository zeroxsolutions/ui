import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { FileTypeIcon } from './file-type-icon';

export interface BinaryFileCardProps extends React.ComponentProps<'div'> {
  /** File name — drives the type icon and the displayed title. */
  name: string;
}

/**
 * A centered fallback card for a file with no inline viewer (binary or unknown):
 * the type icon + the file name, then any `children` — the place for the file
 * size, a download action, or a "no preview" note, all consumer-owned. Fills the
 * space it's given.
 */
export function BinaryFileCard({ name, className, children, ...props }: BinaryFileCardProps) {
  return (
    <div
      data-slot="binary-file-card"
      className={cn('flex size-full flex-col items-center justify-center gap-3 text-center', className)}
      {...props}
    >
      <FileTypeIcon name={name} className="text-muted-foreground size-12" />
      <span className="text-foreground max-w-xs truncate text-sm font-medium">{name}</span>
      {children}
    </div>
  );
}
