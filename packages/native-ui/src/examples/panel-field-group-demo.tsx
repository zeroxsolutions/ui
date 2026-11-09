import type { ReactNode } from 'react';

import { PanelFieldGroup } from '@/components/layout/panel-field-group';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

/** A three-column PanelFieldGroup for a position's X, Y and Z. */
function PanelFieldGroupDemo(): ReactNode {
  return (
    <PanelFieldGroup cols={3} className="w-full max-w-sm">
      <Field>
        <FieldLabel nativeID="preview-pos-x">X</FieldLabel>
        <Input aria-label="X" aria-labelledby="preview-pos-x" keyboardType="numeric" defaultValue="0" />
      </Field>
      <Field>
        <FieldLabel nativeID="preview-pos-y">Y</FieldLabel>
        <Input aria-label="Y" aria-labelledby="preview-pos-y" keyboardType="numeric" defaultValue="0" />
      </Field>
      <Field>
        <FieldLabel nativeID="preview-pos-z">Z</FieldLabel>
        <Input aria-label="Z" aria-labelledby="preview-pos-z" keyboardType="numeric" defaultValue="0" />
      </Field>
    </PanelFieldGroup>
  );
}

export { PanelFieldGroupDemo };
