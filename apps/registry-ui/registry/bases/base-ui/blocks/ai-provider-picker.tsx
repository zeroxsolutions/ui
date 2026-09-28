import { AiProviderCard } from '@/registry/bases/base-ui/components/data-display/ai-provider-card';
import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';

/**
 * One tile's source data - the domain-free shape a host supplies (or takes from
 * the `DEFAULT_AI_PROVIDER_ENTRIES` sample). No API keys, no endpoints - just
 * what the picker needs to render one card.
 */
export interface AiProviderPickerEntry {
  /** AI provider key resolved by `AiProviderIcon` (e.g. `openai`, `claude`). */
  provider: string;
  /** Display name shown as the card title. */
  name: string;
  /** Short blurb rendered under the name; clamps to two lines per card. */
  description: string;
  /** Muted footer note (e.g. "12 models"). */
  meta?: string;
}

export interface AiProviderPickerProps {
  /** Tile data; defaults to {@link DEFAULT_AI_PROVIDER_ENTRIES}. */
  entries?: AiProviderPickerEntry[];
  /** Whole-card select handler - receives the provider key. */
  onSelect?: (provider: string) => void;
  className?: string;
}

/**
 * Sample tile data covering the providers the vendored `@zeroxsolutions/icons`
 * brand set resolves. Domain-free: names, blurbs, and model counts only - no
 * endpoints, no auth. The `provider` value is the icon-resolver key.
 */
export const DEFAULT_AI_PROVIDER_ENTRIES: AiProviderPickerEntry[] = [
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
 * A `registry:block` - a responsive grid of `AiProviderCard` tiles, each
 * showing one AI provider via an `AiProviderIcon` in the card's `icon` slot.
 * Composes two existing registry items (`ai-provider-card`, `ai-provider-icon`)
 * into one reusable surface; the host supplies tile data or takes the default
 * sample, and gets a `provider` key back on select.
 */
export function AiProviderPicker({
  entries = DEFAULT_AI_PROVIDER_ENTRIES,
  onSelect,
  className,
}: AiProviderPickerProps) {
  return (
    <div data-slot="ai-provider-picker" className={className ?? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
      {entries.map((entry) => (
        <AiProviderCard
          key={entry.provider}
          name={entry.name}
          description={entry.description}
          meta={entry.meta}
          icon={<AiProviderIcon provider={entry.provider} type="avatar" size={32} />}
          onSelect={onSelect ? () => onSelect(entry.provider) : undefined}
        />
      ))}
    </div>
  );
}
