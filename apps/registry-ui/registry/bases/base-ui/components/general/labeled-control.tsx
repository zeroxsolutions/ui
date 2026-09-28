import type { ComponentProps, ReactNode } from 'react';

import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface LabeledControlProps extends Omit<ComponentProps<typeof Field>, 'orientation'> {
  label: ReactNode;
  children: ReactNode;
}

/**
 * The compact inspector field — the design-system `Field` (vertical) with the
 * dense `text-xs` muted label property panels want, for a full-width control
 * that carries no inline label of its own (a colour swatch, a custom picker).
 *
 * It composes `Field` + `FieldLabel` so the label is a real label slot
 * (`role=group`, `data-slot`) rather than a hand-rolled `<span>`. The compact
 * preset lives here once instead of being repainted at all ~50 call sites.
 */
function LabeledControl({ label, className, children, ...props }: LabeledControlProps) {
  return (
    <Field className={cn('gap-1', className)} {...props}>
      <FieldLabel className="text-muted-foreground text-xs font-normal">{label}</FieldLabel>
      {children}
    </Field>
  );
}

export { LabeledControl };
