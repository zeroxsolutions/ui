import { FieldGroup } from '@zeroxsolutions/ui/components/layouts/field-group';
import { Input } from '@zeroxsolutions/ui/components/ui/input';
import { Label } from '@zeroxsolutions/ui/components/ui/label';

import { ComponentPreview } from '@/components/component-preview';
import {
  CompositionTree,
  DocPage,
  PropsTable,
  UsageCode,
} from '@/components/docs';
import type { CompositionNode, PropEntry } from '@/components/docs';

/** Authored from `FieldGroupProps` - the wrapper's own surface. */
const FIELD_GROUP_PROPS: PropEntry[] = [
  {
    name: 'cols',
    type: 'number',
    default: '2',
    description:
      'Column count for the inner FieldGrid; forwarded as a computed grid-template-columns.',
  },
  {
    name: 'action',
    type: 'ReactNode',
    default: '-',
    description:
      'Optional trailing action (an aspect-lock toggle, a reset button) in a fixed icon-button-width slot; a narrower control is centred.',
  },
  {
    name: 'children',
    type: 'ReactNode',
    default: '-',
    description: 'Inputs laid out by the inner FieldGrid.',
  },
  {
    name: 'className',
    type: 'string',
    default: '-',
    description: 'Merged into the outer flex row via the cn helper.',
  },
  {
    name: '...props',
    type: 'ComponentProps<"div">',
    default: '-',
    description: 'Spread onto the outer wrapper div.',
  },
];

/**
 * FieldGroup composes a FieldGrid internally, but the consumer surface is one
 * component - so the tree is a single line.
 */
const FIELD_GROUP_COMPOSITION: CompositionNode = {
  name: 'FieldGroup',
  slot: 'Root',
};

/**
 * Doc page for `FieldGroup`. The Preview keeps the live render `renames.spec.ts`
 * reads (data-slot="field-group" wrapping a data-slot="field-grid"); this
 * retrofit adds Code/Props/Composition around it without touching the component.
 */
export default function FieldGroupPreviewPage() {
  return (
    <DocPage
      title="FieldGroup"
      description="A field grid plus a fixed trailing action slot. Use it for any property row that mixes inputs with a side action - the slot is always reserved at one icon-button width so every row shares the same right edge."
      preview={
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
      }
      code={
        <UsageCode
          name="field-group"
          importPath="components/layouts/field-group"
          exportedAs="FieldGroup"
        />
      }
      propsTable={<PropsTable rows={FIELD_GROUP_PROPS} />}
      composition={<CompositionTree tree={FIELD_GROUP_COMPOSITION} />}
    />
  );
}
