import type { ComponentProps, ReactNode } from 'react';

import { FieldLabel } from '@/registry/bases/base-ui/ui/field';

/**
 * The label a property panel puts over a control that has no inline label of
 * its own (a colour swatch, a custom picker). It is upstream's `FieldLabel` as
 * the preset draws it, so it keeps `data-slot="field-label"`, which the `Field`
 * recipes select on. Compose it inside an upstream `Field`:
 *
 *   <Field>
 *     <PanelFieldLabel htmlFor="fill">Fill</PanelFieldLabel>
 *     <ColorSwatch id="fill" />
 *   </Field>
 */
function PanelFieldLabel(props: ComponentProps<typeof FieldLabel>): ReactNode {
  return <FieldLabel {...props} />;
}

export { PanelFieldLabel };
