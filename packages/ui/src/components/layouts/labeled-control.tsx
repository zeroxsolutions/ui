import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface LabeledControlProps extends ComponentProps<'div'> {
  label: ReactNode;
  children: ReactNode;
}

/**
 * A label above a full-width control — the row layout for inputs that don't
 * carry their own inline label (a colour swatch, a custom picker). Pairs with
 * inline-labeled fields so a property section can mix both and stay aligned.
 */
export function LabeledControl({
  label,
  className,
  children,
  ...props
}: LabeledControlProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      <span className="flex items-center text-xs text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
