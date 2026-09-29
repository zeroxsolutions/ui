import type { ComponentProps, ReactNode } from 'react';

import { FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The dense, muted label a property panel puts over a control that has no
 * inline label of its own (a colour swatch, a custom picker). Compose it inside
 * an upstream `Field`:
 *
 *   <Field className="gap-1">
 *     <PanelFieldLabel htmlFor="fill">Fill</PanelFieldLabel>
 *     <ColorSwatch id="fill" />
 *   </Field>
 *
 * It keeps upstream's `data-slot="field-label"`, which the `Field` recipes select on.
 */
function PanelFieldLabel({ className, ...props }: ComponentProps<typeof FieldLabel>): ReactNode {
  return <FieldLabel className={cn('text-muted-foreground text-xs font-normal', className)} {...props} />;
}

export { PanelFieldLabel };
