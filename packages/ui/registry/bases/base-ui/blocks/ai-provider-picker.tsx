import * as React from 'react';
import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';

import {
  AiProviderCard,
  AiProviderCardDescription,
  AiProviderCardLabel,
  AiProviderCardTrigger,
} from '@/registry/bases/base-ui/components/data-display/ai-provider-card';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';

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

interface AiProviderPickerProps extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
  /** The cards, in order; defaults to {@link AI_PROVIDER_PICKER_SAMPLE_ENTRIES}. */
  entries?: readonly AiProviderPickerEntry[];
  /** Called with the `provider` key of the card selected. */
  onSelect?: (provider: string) => void;
}

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
 * A responsive grid of `AiProviderCard` tiles, one per entry, each with the
 * provider's mark beside its name. Each card is one button that calls
 * `onSelect` with its entry's `provider` key. For cards nothing selects,
 * compose `AiProviderCard` without its trigger instead.
 */
function AiProviderPicker({
  entries = AI_PROVIDER_PICKER_SAMPLE_ENTRIES,
  onSelect,
  className,
  ...props
}: AiProviderPickerProps): React.ReactNode {
  return (
    <div
      data-slot="ai-provider-picker"
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
      {...props}
    >
      {entries.map((entry) => (
        <AiProviderCard key={entry.provider}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <AiProviderIcon provider={entry.provider} type="avatar" size={32} />
              <span className="min-w-0 flex-1 truncate">{entry.name}</span>
            </CardTitle>
            <AiProviderCardDescription>{entry.description}</AiProviderCardDescription>
          </CardHeader>
          {entry.meta && (
            <CardFooter className="mt-auto">
              <AiProviderCardLabel>{entry.meta}</AiProviderCardLabel>
            </CardFooter>
          )}
          <AiProviderCardTrigger aria-label={`Select ${entry.name}`} onClick={() => onSelect?.(entry.provider)} />
        </AiProviderCard>
      ))}
    </div>
  );
}

export { AI_PROVIDER_PICKER_SAMPLE_ENTRIES, AiProviderPicker };
export type { AiProviderPickerEntry, AiProviderPickerProps };
