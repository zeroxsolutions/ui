import type { ReactNode } from 'react';

import { PanelFieldGroup } from '@/registry/bases/base-ui/components/layout/panel-field-group';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Label } from '@/registry/bases/base-ui/ui/label';

/** A three-column PanelFieldGroup for a position's X, Y and Z. */
function PanelFieldGroupDemo(): ReactNode {
  return (
    <PanelFieldGroup cols={3} className="w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <Label htmlFor="preview-pos-x">X</Label>
        <Input id="preview-pos-x" defaultValue="0" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="preview-pos-y">Y</Label>
        <Input id="preview-pos-y" defaultValue="0" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="preview-pos-z">Z</Label>
        <Input id="preview-pos-z" defaultValue="0" />
      </div>
    </PanelFieldGroup>
  );
}

export { PanelFieldGroupDemo };
