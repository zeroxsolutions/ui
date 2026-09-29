import type { ReactNode } from 'react';

import { PanelFieldLabel } from '@/registry/bases/base-ui/components/general/panel-field-label';
import { Field } from '@/registry/bases/base-ui/ui/field';

/** A PanelFieldLabel naming a fill swatch that carries no inline label of its own. */
function PanelFieldLabelDemo(): ReactNode {
  return (
    <Field className="w-40 gap-1">
      <PanelFieldLabel htmlFor="fill">Fill</PanelFieldLabel>
      <input id="fill" type="color" defaultValue="#f97316" className="border-input h-8 w-full rounded-md border p-1" />
    </Field>
  );
}

export { PanelFieldLabelDemo };
