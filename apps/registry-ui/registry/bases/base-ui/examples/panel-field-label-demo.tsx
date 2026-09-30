import type { ReactNode } from 'react';

import { PanelFieldLabel } from '@/registry/bases/base-ui/components/general/panel-field-label';
import { Field } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';

/** A PanelFieldLabel naming a fill swatch that carries no inline label of its own. */
function PanelFieldLabelDemo(): ReactNode {
  return (
    <Field className="w-40">
      <PanelFieldLabel htmlFor="fill">Fill</PanelFieldLabel>
      <Input id="fill" type="color" defaultValue="#f97316" />
    </Field>
  );
}

export { PanelFieldLabelDemo };
