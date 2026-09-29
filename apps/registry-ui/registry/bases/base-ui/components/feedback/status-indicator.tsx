import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

type StatusTone = 'online' | 'offline' | 'busy' | 'idle';

interface StatusIndicatorProps extends React.ComponentProps<'span'> {
  /**
   * online: connected, enabled, active. offline: disconnected, disabled.
   * busy: an error, unavailable. idle: pending, away.
   */
  tone: StatusTone;
  /** Animate the dot, for a state still in progress such as connecting or live. */
  pulse?: boolean;
}

/**
 * A small presence dot coloured by a semantic tone, so every surface reads a
 * status the same way. Decorative: the text beside it carries the status for
 * assistive technology. Not for an identity colour, and not for a modified
 * flag, which is `UnsavedIndicator`.
 */
function StatusIndicator({ tone, pulse = false, className, ...props }: StatusIndicatorProps): React.ReactNode {
  return (
    <span
      data-slot="status-indicator"
      data-tone={tone}
      data-pulse={pulse ? '' : undefined}
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full data-pulse:animate-pulse',
        'data-[tone=busy]:bg-destructive data-[tone=idle]:bg-warning data-[tone=offline]:bg-muted-foreground/30 data-[tone=online]:bg-success',
        className,
      )}
      {...props}
    />
  );
}

export { StatusIndicator };
export type { StatusIndicatorProps, StatusTone };
