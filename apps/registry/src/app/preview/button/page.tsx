import { Button } from '@zeroxsolutions/ui/components/ui/button';

import { ComponentPreview } from '@/components/component-preview';
import {
  CompositionTree,
  DocPage,
  PropsTable,
  UsageCode,
} from '@/components/docs';
import type { CompositionNode, PropEntry } from '@/components/docs';

/** Button's own props - the variants, sizes, and the className passthrough. */
const BUTTON_PROPS: PropEntry[] = [
  {
    name: 'variant',
    type: '"default" | "outline" | "secondary" | "ghost" | "destructive" | "link"',
    default: '"default"',
    description: 'Visual style of the button.',
  },
  {
    name: 'size',
    type: '"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"',
    default: '"default"',
    description: 'Sizing preset; the `icon*` sizes are square for icon-only buttons.',
  },
  {
    name: 'className',
    type: 'string',
    default: '-',
    description: 'Class merged into the variant via the `cn` helper.',
  },
  {
    name: '...props',
    type: 'ButtonPrimitive.Props',
    default: '-',
    description: 'Props spread onto the underlying Base UI button element.',
  },
];

/** Button is a leaf - no composed parts - so the tree is a single line. */
const BUTTON_COMPOSITION: CompositionNode = {
  name: 'Button',
  slot: 'Root',
};

/** Reference instance of the doc-page shape: the four tabs over Button. */
export default function ButtonPreviewPage() {
  return (
    <DocPage
      title="Button"
      description="The Button primitive - a Base UI button with class-variance-authority variants and sizes."
      preview={
        <ComponentPreview>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </ComponentPreview>
      }
      code={
        <UsageCode
          name="button"
          importPath="components/ui/button"
          exportedAs="Button"
        />
      }
      propsTable={<PropsTable rows={BUTTON_PROPS} />}
      composition={<CompositionTree tree={BUTTON_COMPOSITION} />}
    />
  );
}
