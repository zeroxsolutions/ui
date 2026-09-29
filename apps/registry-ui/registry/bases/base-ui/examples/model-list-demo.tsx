'use client';

import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';
import { useState, type ReactNode } from 'react';

import {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListItemRemove,
  ModelListTitle,
} from '@/registry/bases/base-ui/components/layout/model-list';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item';
import { Switch } from '@/registry/bases/base-ui/ui/switch';

interface ModelEntry {
  id: string;
  provider: string;
  title: string;
  description: string;
  enabled: boolean;
}

const INITIAL_MODELS: ModelEntry[] = [
  { id: 'gpt-4o', provider: 'openai', title: 'GPT-4o', description: 'gpt-4o', enabled: true },
  { id: 'claude-opus', provider: 'claude', title: 'Claude Opus', description: 'claude-opus-4-5', enabled: true },
  { id: 'gemini-pro', provider: 'gemini', title: 'Gemini Pro', description: 'gemini-2.5-pro', enabled: false },
];

/** A model list with two enabled providers, one unavailable, each toggleable and removable. */
function ModelListDemo(): ReactNode {
  const [models, setModels] = useState(INITIAL_MODELS);

  return (
    <div className="flex h-72 w-full flex-col rounded-lg border">
      <ModelList>
        <ModelListHeader>
          <ModelListTitle>Model list</ModelListTitle>
          <ModelListAction>
            <span className="text-muted-foreground text-xs">{models.length} models</span>
          </ModelListAction>
        </ModelListHeader>
        <ModelListContent>
          <ItemGroup>
            {models.map((model) => (
              <Item key={model.id} size="sm" data-unavailable={!model.enabled}>
                <ItemMedia>
                  <AiProviderIcon provider={model.provider} type="avatar" size={24} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{model.title}</ItemTitle>
                  <ItemDescription>{model.description}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch
                    checked={model.enabled}
                    onCheckedChange={(checked) =>
                      setModels((current) =>
                        current.map((entry) => (entry.id === model.id ? { ...entry, enabled: checked } : entry)),
                      )
                    }
                  />
                  <ModelListItemRemove
                    aria-label={`Remove ${model.title}`}
                    onClick={() => setModels((current) => current.filter((entry) => entry.id !== model.id))}
                  />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </ModelListContent>
      </ModelList>
    </div>
  );
}

export { ModelListDemo };
