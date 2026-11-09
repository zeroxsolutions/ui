import { Lock } from 'lucide-react-native';
import type { ReactNode } from 'react';

import { PanelFieldGroup } from '@/components/layout/panel-field-group';
import { PanelRow, PanelRowAction } from '@/components/layout/panel-row';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

/** A two-column `PanelFieldGroup` in a `PanelRow` with a trailing lock action. */
function PanelRowDemo(): ReactNode {
  return (
    <PanelRow className="w-full">
      <PanelFieldGroup cols={2}>
        <Field>
          <FieldLabel nativeID="preview-x">X</FieldLabel>
          <Input aria-label="X" aria-labelledby="preview-x" keyboardType="numeric" defaultValue="100" />
        </Field>
        <Field>
          <FieldLabel nativeID="preview-y">Y</FieldLabel>
          <Input aria-label="Y" aria-labelledby="preview-y" keyboardType="numeric" defaultValue="200" />
        </Field>
      </PanelFieldGroup>
      <PanelRowAction>
        <Button variant="ghost" size="icon" aria-label="Lock aspect ratio">
          <Icon as={Lock} />
        </Button>
      </PanelRowAction>
    </PanelRow>
  );
}

export { PanelRowDemo };
