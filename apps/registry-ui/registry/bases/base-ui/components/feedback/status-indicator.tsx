import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { StatusTone } from '@/registry/bases/base-ui/types/status-tone';

interface StatusIndicatorProps extends React.ComponentProps<'span'> {
  /** The status the dot's colour reports. */
  tone: StatusTone;
  /** Animate the dot, for a state still in progress such as connecting or live. */
  pulse?: boolean;
}

/**
 * A small presence dot coloured by a semantic tone, so every surface reads a
 * status the same way. Decorative: the text beside it carries the status for
 * assistive technology. Not for an identity colour, and not for a modified
 * flag, which is `UnsavedIndicator`. Offline draws as a hollow ring, so it
 * reads as a shape where a faint fill would vanish.
 */
function StatusIndicator({ tone, pulse = false, className, ...props }: StatusIndicatorProps): React.ReactNode {
  return (
    <span
      data-slot="status-indicator"
      data-tone={tone}
      data-pulse={pulse ? '' : undefined}
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full data-pulse:motion-safe:animate-pulse',
        'data-[tone=busy]:bg-destructive data-[tone=idle]:bg-warning data-[tone=offline]:ring-muted-foreground data-[tone=online]:bg-success data-[tone=offline]:ring-1 data-[tone=offline]:ring-inset',
        className,
      )}
      {...props}
    />
  );
}

export { StatusIndicator };
export type { StatusIndicatorProps };
