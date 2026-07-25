import {
  AiProviderPicker,
  DEFAULT_AI_PROVIDER_ENTRIES,
} from '@zeroxsolutions/ui/components/blocks/ai-provider-picker';

import { ComponentPreview } from '@/components/component-preview';
import {
  CompositionTree,
  DocPage,
  PropsTable,
  UsageCode,
} from '@/components/docs';
import type { CompositionNode, PropEntry } from '@/components/docs';

/**
 * Authored from `AiProviderPickerProps` - the block's own surface, not the
 * composed primitives' (those live under their own pages).
 */
const AI_PROVIDER_PICKER_PROPS: PropEntry[] = [
  {
    name: 'entries',
    type: 'AiProviderPickerEntry[]',
    default: 'DEFAULT_AI_PROVIDER_ENTRIES',
    description:
      'Tile data; one entry per card. Supply your own list, or accept the domain-free sample set (OpenAI, Claude, Gemini, ...).',
  },
  {
    name: 'onSelect',
    type: '(provider: string) => void',
    default: '-',
    description:
      'Whole-card select handler - receives the entry\'s `provider` key (the same string `AiProviderIcon` resolves).',
  },
  {
    name: 'className',
    type: 'string',
    default: '-',
    description:
      'Replaces the default responsive grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`).',
  },
];

/**
 * Block composition tree - the picker composes two existing registry items:
 * `AiProviderCard` (one per entry, in the grid slot) and, inside each card's
 * `icon` slot, an `AiProviderIcon`.
 */
const AI_PROVIDER_PICKER_COMPOSITION: CompositionNode = {
  name: 'AiProviderPicker',
  slot: 'Root',
  children: [
    {
      name: 'AiProviderCard',
      slot: 'Grid tile',
      children: [{ name: 'AiProviderIcon', slot: 'icon' }],
    },
  ],
};

/**
 * Doc page for the `ai-provider-picker` block - the registry's first
 * `registry:block`, composing `registry:component` (`ai-provider-card`) and the
 * `ai-provider-icon` brand resolver into a reusable surface.
 */
export default function AiProviderPickerPreviewPage() {
  return (
    <DocPage
      title="AiProviderPicker"
      description="A registry:block - a responsive grid of AiProviderCard tiles, each showing one AI provider via an AiProviderIcon in the card's icon slot. Composes the ai-provider-card and ai-provider-icon items."
      preview={
        <ComponentPreview>
          <div className="w-full">
            <AiProviderPicker entries={DEFAULT_AI_PROVIDER_ENTRIES} />
          </div>
        </ComponentPreview>
      }
      code={
        <UsageCode
          name="ai-provider-picker"
          importPath="components/blocks/ai-provider-picker"
          exportedAs="AiProviderPicker"
        />
      }
      propsTable={<PropsTable rows={AI_PROVIDER_PICKER_PROPS} />}
      composition={<CompositionTree tree={AI_PROVIDER_PICKER_COMPOSITION} />}
    />
  );
}
