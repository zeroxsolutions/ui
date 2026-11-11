import { Sparkles } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListRemoveButton,
  ModelListTitle,
} from '@/components/layout/model-list';
import { Icon } from '@/components/ui/icon';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';

interface ModelEntry {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const INITIAL_MODELS: ModelEntry[] = [
  { id: 'gpt-4o', title: 'GPT-4o', description: 'gpt-4o', enabled: true },
  { id: 'claude-opus', title: 'Claude Opus', description: 'claude-opus-4-5', enabled: true },
  { id: 'gemini-pro', title: 'Gemini Pro', description: 'gemini-2.5-pro', enabled: false },
];

/** A model list with two enabled models and one unavailable, each toggleable and removable. */
function ModelListDemo(): ReactNode {
  const [models, setModels] = useState(INITIAL_MODELS);

  return (
    <View className="border-border h-72 w-full flex-col rounded-lg border">
      <ModelList>
        <ModelListHeader>
          <ModelListTitle>Model list</ModelListTitle>
          <ModelListAction>
            <Text className="text-muted-foreground text-xs">{`${models.length} models`}</Text>
          </ModelListAction>
        </ModelListHeader>
        <ModelListContent>
          <ItemGroup>
            {models.map((model) => (
              <Item key={model.id} size="sm" className={model.enabled ? undefined : 'opacity-50'}>
                <ItemMedia variant="icon">
                  <Icon as={Sparkles} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{model.title}</ItemTitle>
                  <ItemDescription>{model.description}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch
                    aria-label={`Enable ${model.title}`}
                    checked={model.enabled}
                    onCheckedChange={(checked) =>
                      setModels((current) =>
                        current.map((entry) => (entry.id === model.id ? { ...entry, enabled: checked } : entry)),
                      )
                    }
                  />
                  <ModelListRemoveButton
                    aria-label={`Remove ${model.title}`}
                    onPress={() => setModels((current) => current.filter((entry) => entry.id !== model.id))}
                  />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </ModelListContent>
      </ModelList>
    </View>
  );
}

export { ModelListDemo };
