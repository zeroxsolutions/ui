import { Input } from '@zeroxsolutions/ui/components/ui/input';
import { Label } from '@zeroxsolutions/ui/components/ui/label';
import { FieldGroup } from '@zeroxsolutions/ui/components/layouts/field-group';

import { ComponentPreview } from '@/components/component-preview';

/**
 * Isolated preview for `FieldGroup` (the renamed FieldRow) wrapping a
 * `FieldGrid` (built-in). `registry-e2e` asserts the outer carries
 * `data-slot="field-group"`, the inner grid carries `data-slot="field-grid"`,
 * and no console errors fire.
 */
export default function FieldGroupPreviewPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-lg font-semibold">FieldGroup</h1>
      <ComponentPreview>
        <div className="flex w-full flex-col gap-4">
          <FieldGroup cols={2}>
            <div className="flex flex-col gap-1">
              <Label htmlFor="preview-x">X</Label>
              <Input id="preview-x" defaultValue="100" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="preview-y">Y</Label>
              <Input id="preview-y" defaultValue="200" />
            </div>
          </FieldGroup>
        </div>
      </ComponentPreview>
    </main>
  );
}
