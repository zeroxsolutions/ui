import * as ProgressPrimitive from '@rn-primitives/progress';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

// A `cn-<slot>` token stands for that slot's classes; the registry build replaces each with
// the classes translated for the target engine.

type ProgressProps = Omit<ProgressPrimitive.RootProps, 'max' | 'value'> & {
  /** How far along the task is, from 0 to 100. A value outside that range is held to its nearest end, and none or NaN draws an empty bar. */
  value?: number;
};

/**
 * A bar showing how far a task has got. It is announced as a progress bar from 0 to 100, with the
 * value as a percentage.
 */
function Progress({ className, value = 0, ...props }: ProgressProps): ReactNode {
  const filled = Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
  return (
    <ProgressPrimitive.Root value={filled} className={cn('w-full overflow-hidden cn-progress', className)} {...props}>
      <ProgressPrimitive.Indicator className="cn-progress-indicator h-full" style={{ width: `${filled}%` }} />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
export type { ProgressProps };
