'use client';

import { useState, type ReactNode } from 'react';

import {
  AiProviderCard,
  AiProviderCardAction,
  AiProviderCardDescription,
  AiProviderCardLabel,
  AiProviderCardTrigger,
} from '@/registry/bases/base-ui/components/data-display/ai-provider-card';
import { CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
import { Switch } from '@/registry/bases/base-ui/ui/switch';

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

/** Two AiProviderCard tiles - one online, one idle - each toggled independently and reporting the last selection. */
function AiProviderCardDemo(): ReactNode {
  const [selected, setSelected] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ OpenAI: true, 'Local model': false });

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  checked={enabled[provider.name]}
                  onCheckedChange={(checked) => setEnabled((current) => ({ ...current, [provider.name]: checked }))}
                />
              </AiProviderCardAction>
            </CardFooter>
            <AiProviderCardTrigger aria-label={`Select ${provider.name}`} onClick={() => setSelected(provider.name)} />
          </AiProviderCard>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">{selected ? `Selected: ${selected}` : 'No provider selected'}</p>
    </div>
  );
}

export { AiProviderCardDemo };
