import { LockIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { PanelFieldGroup } from '@/registry/bases/base-ui/components/layout/panel-field-group';
import { PanelRow, PanelRowAction } from '@/registry/bases/base-ui/components/layout/panel-row';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Label } from '@/registry/bases/base-ui/ui/label';

/** A two-column `PanelFieldGroup` in a `PanelRow` with a trailing lock action. */
function PanelRowDemo(): ReactNode {
  return (
    <div className="flex w-full flex-col gap-4">
      <PanelRow>
        <PanelFieldGroup cols={2}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="preview-x">X</Label>
            <Input id="preview-x" defaultValue="100" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="preview-y">Y</Label>
            <Input id="preview-y" defaultValue="200" />
          </div>
        </PanelFieldGroup>
        <PanelRowAction>
          <Button variant="ghost" size="icon" aria-label="Lock aspect ratio">
            <LockIcon />
          </Button>
        </PanelRowAction>
      </PanelRow>
    </div>
  );
}

export { PanelRowDemo };
