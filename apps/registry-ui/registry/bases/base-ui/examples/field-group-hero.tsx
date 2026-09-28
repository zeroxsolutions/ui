import { PanelRow } from '@/registry/bases/base-ui/components/layout/panel-row';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Label } from '@/registry/bases/base-ui/ui/label';

/** A two-column `PanelFieldGroup` - the PanelRow hero. */
export function FieldGroupHero() {
  return (
    <div className="flex w-full flex-col gap-4">
      <PanelRow cols={2}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="preview-x">X</Label>
          <Input id="preview-x" defaultValue="100" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="preview-y">Y</Label>
          <Input id="preview-y" defaultValue="200" />
        </div>
      </PanelRow>
    </div>
  );
}
