import { Bot } from 'lucide-react-native';
import type { ReactNode } from 'react';

import { ModelInfoCard, ModelInfoCardIndicator, ModelInfoCardSection } from '@/components/data-display/model-info-card';
import { Icon } from '@/components/ui/icon';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Text } from '@/components/ui/text';

/** The identity header for one model over two detail sections: context length and pricing. */
function ModelInfoCardDemo(): ReactNode {
  return (
    <ModelInfoCard className="w-full max-w-sm">
      <Item size="xs">
        <ItemMedia variant="icon">
          <Icon as={Bot} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>GPT-4o</ItemTitle>
          <ItemDescription>OpenAI</ItemDescription>
        </ItemContent>
        <ItemFooter>
          <Text className="text-muted-foreground font-mono text-xs">gpt-4o</Text>
        </ItemFooter>
      </Item>
      <ModelInfoCardSection>
        <Item size="xs">
          <ItemMedia>
            <ModelInfoCardIndicator tone="chart-2" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Context length</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Text className="text-sm">128K tokens</Text>
          </ItemActions>
        </Item>
      </ModelInfoCardSection>
      <ModelInfoCardSection>
        <Item size="xs">
          <ItemMedia>
            <ModelInfoCardIndicator tone="chart-3" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Pricing</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Text className="text-sm">$5.00 / 1M tokens</Text>
          </ItemActions>
        </Item>
      </ModelInfoCardSection>
    </ModelInfoCard>
  );
}

export { ModelInfoCardDemo };
