import { DemoPage } from '@zeroxsolutions/ui/components/pages/demo-page';

import { ComponentPreview } from '@/components/component-preview';
import {
  CompositionTree,
  DocPage,
  PropsTable,
  UsageCode,
} from '@/components/docs';
import type { CompositionNode, PropEntry } from '@/components/docs';

/** Authored from `DemoPageProps` - the page-region's own surface. */
const DEMO_PAGE_PROPS: PropEntry[] = [
  {
    name: 'entries',
    type: 'AiProviderPickerEntry[]',
    default: 'picker default',
    description:
      'Tile data forwarded to the inner AiProviderPicker; omit to use the picker\'s domain-free sample set.',
  },
  {
    name: 'className',
    type: 'string',
    default: '-',
    description:
      'Replaces the default region layout (`mx-auto max-w-3xl flex-col gap-6`).',
  },
];

/**
 * Page composition tree - the page region composes one block
 * (`AiProviderPicker`) and one component (`ChatMessage`).
 */
const DEMO_PAGE_COMPOSITION: CompositionNode = {
  name: 'DemoPage',
  slot: 'Root',
  children: [
    {
      name: 'AiProviderPicker',
      slot: 'picker section',
    },
    {
      name: 'ChatMessage',
      slot: 'chat section',
    },
  ],
};

/**
 * Doc page for the `demo-page` page - the registry's first `registry:page`,
 * composing the `ai-provider-picker` block and the `chat-message` component
 * into a small page region.
 */
export default function DemoPreviewPage() {
  return (
    <DocPage
      title="DemoPage"
      description="A registry:page - a small page region composing the ai-provider-picker block and the chat-message component. Pages assemble blocks and components into a full interface region."
      preview={
        <ComponentPreview>
          <DemoPage />
        </ComponentPreview>
      }
      code={
        <UsageCode
          name="demo-page"
          importPath="components/pages/demo-page"
          exportedAs="DemoPage"
        />
      }
      propsTable={<PropsTable rows={DEMO_PAGE_PROPS} />}
      composition={<CompositionTree tree={DEMO_PAGE_COMPOSITION} />}
    />
  );
}
