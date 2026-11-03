import type { ReactNode } from 'react';

import { PanelFieldGroup } from '@/registry/bases/base-ui/components/layout/panel-field-group';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';

/** A three-column PanelFieldGroup for a position's X, Y and Z. */
function PanelFieldGroupDemo(): ReactNode {
  return (
    <PanelFieldGroup cols={3} className="w-full max-w-sm">
      <Field>
        <FieldLabel htmlFor="preview-pos-x">X</FieldLabel>
        <Input id="preview-pos-x" defaultValue="0" />
      </Field>
      <Field>
        <FieldLabel htmlFor="preview-pos-y">Y</FieldLabel>
        <Input id="preview-pos-y" defaultValue="0" />
      </Field>
      <Field>
        <FieldLabel htmlFor="preview-pos-z">Z</FieldLabel>
        <Input id="preview-pos-z" defaultValue="0" />
      </Field>
    </PanelFieldGroup>
  );
}

export { PanelFieldGroupDemo };
