import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import {
  AiProviderCard,
  AiProviderCardDescription,
  AiProviderCardLabel,
  AiProviderCardTrigger,
} from '../components/data-display/ai-provider-card';
import { AiProviderIcon } from '../lib/brand-mark';
import { cn } from '../lib/utils';
import { CardFooter, CardHeader, CardTitle } from '../ui/card';

/**
 * One card's data, the shape a host supplies or takes from
 * {@link AI_PROVIDER_PICKER_SAMPLE_ENTRIES}. It holds no key and no endpoint.
 */
interface AiProviderPickerEntry {
  /** The key `AiProviderIcon` resolves, such as `openai` or `claude`; also what `onSelect` receives. */
  provider: string;
  /** The card's title. */
  name: string;
  /** The text under the title, clamped to two lines. */
  description: string;
  /** The muted footer note, such as "12 models"; omitted, the card has no footer. */
  meta?: string;
}

type AiProviderPickerProps = ComponentProps<typeof View> & {
  /** The cards, in order; defaults to {@link AI_PROVIDER_PICKER_SAMPLE_ENTRIES}. */
  entries?: readonly AiProviderPickerEntry[];
  /** Called with the `provider` key of the card selected. */
  onSelect?: (provider: string) => void;
};

/** Sample cards for providers the `@zeroxsolutions/icons` brand set draws a mark for. */
const AI_PROVIDER_PICKER_SAMPLE_ENTRIES: readonly AiProviderPickerEntry[] = [
  {
    provider: 'openai',
    name: 'OpenAI',
    description: 'GPT reasoning and chat models for general-purpose assistance.',
    meta: '12 models',
  },
  {
    provider: 'claude',
    name: 'Anthropic Claude',
    description: 'Claude models for long-context reasoning and tool use.',
    meta: '8 models',
  },
  {
    provider: 'gemini',
    name: 'Google Gemini',
    description: 'Multimodal Gemini models for text, image, and audio.',
    meta: '6 models',
  },
  {
    provider: 'deepseek',
    name: 'DeepSeek',
    description: 'Cost-efficient chat and reasoning models.',
    meta: '4 models',
  },
  {
    provider: 'mistral',
    name: 'Mistral',
    description: 'Open-weight chat and embedding models.',
    meta: '7 models',
  },
  {
    provider: 'grok',
    name: 'xAI Grok',
    description: 'Grok models for real-time-grounded chat.',
    meta: '3 models',
  },
];

/**
 * `AiProviderCard` tiles, one per entry, each with the provider's mark beside its name, in one column, two from
 * the `sm` width and three from `lg`, each tile as tall as the tallest in its row. Each card is one button that
 * calls `onSelect` with its entry's `provider` key. For cards nothing selects, compose `AiProviderCard` without
 * its trigger instead.
 */
function AiProviderPicker({
  entries = AI_PROVIDER_PICKER_SAMPLE_ENTRIES,
  onSelect,
  className,
  ...props
}: AiProviderPickerProps): ReactNode {
  return (
    // A view has no grid: each tile's cell pads half the gap, and the row's negative margin takes the outer half back.
    <View className={cn('-m-2 flex-row flex-wrap', className)} {...props}>
      {entries.map((entry) => (
        <View key={entry.provider} className="w-full p-2 sm:w-1/2 lg:w-1/3">
          <AiProviderCard className="grow">
            <CardHeader>
              <View className="flex-row items-center gap-2.5">
                <AiProviderIcon provider={entry.provider} type="avatar" size={32} />
                <CardTitle numberOfLines={1} className="min-w-0 flex-1">
                  {entry.name}
                </CardTitle>
              </View>
              <AiProviderCardDescription>{entry.description}</AiProviderCardDescription>
            </CardHeader>
            {entry.meta ? (
              <CardFooter className="mt-auto">
                <AiProviderCardLabel>{entry.meta}</AiProviderCardLabel>
              </CardFooter>
            ) : null}
            <AiProviderCardTrigger aria-label={`Select ${entry.name}`} onPress={() => onSelect?.(entry.provider)} />
          </AiProviderCard>
        </View>
      ))}
    </View>
  );
}

export { AI_PROVIDER_PICKER_SAMPLE_ENTRIES, AiProviderPicker };
export type { AiProviderPickerEntry, AiProviderPickerProps };
