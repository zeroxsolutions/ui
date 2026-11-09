import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  AiProviderCard,
  AiProviderCardAction,
  AiProviderCardDescription,
  AiProviderCardLabel,
  AiProviderCardTrigger,
} from '@/components/data-display/ai-provider-card';
import { CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';

const PROVIDERS = [
  {
    name: 'OpenAI',
    description: 'GPT reasoning and chat models for general-purpose assistance.',
    status: 'online' as const,
    note: '12 models',
  },
  {
    name: 'Local model',
    description: 'Runs on this machine, no network required.',
    status: 'idle' as const,
    note: 'Starting up',
  },
];

/** Two AiProviderCard tiles, one online and one idle, each toggled on its own and reporting the last selection. */
function AiProviderCardDemo(): ReactNode {
  const [selected, setSelected] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ OpenAI: true, 'Local model': false });

  return (
    <View className="w-full gap-3">
      <View className="gap-4">
        {PROVIDERS.map((provider) => (
          <AiProviderCard key={provider.name}>
            <CardHeader>
              <CardTitle>{provider.name}</CardTitle>
              <AiProviderCardDescription>{provider.description}</AiProviderCardDescription>
            </CardHeader>
            <CardFooter className="mt-auto justify-between">
              <AiProviderCardLabel tone={provider.status}>{provider.note}</AiProviderCardLabel>
              <AiProviderCardAction>
                <Switch
                  size="sm"
                  aria-label={`Enable ${provider.name}`}
                  checked={enabled[provider.name] ?? false}
                  onCheckedChange={(checked) => setEnabled((current) => ({ ...current, [provider.name]: checked }))}
                />
              </AiProviderCardAction>
            </CardFooter>
            <AiProviderCardTrigger aria-label={`Select ${provider.name}`} onPress={() => setSelected(provider.name)} />
          </AiProviderCard>
        ))}
      </View>
      <Text className="text-muted-foreground text-sm">
        {selected ? `Selected: ${selected}` : 'No provider selected'}
      </Text>
    </View>
  );
}

export { AiProviderCardDemo };
