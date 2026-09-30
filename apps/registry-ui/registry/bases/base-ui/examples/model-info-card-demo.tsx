import type { ReactNode } from 'react';

import {
  ModelInfoCard,
  ModelInfoCardBadge,
  ModelInfoCardSection,
} from '@/registry/bases/base-ui/components/data-display/model-info-card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item';
import { AiProviderIcon } from '@zeroxsolutions/icons/ai-provider-icon';

/** The identity header for one model over two detail sections: context length and pricing. */
function ModelInfoCardDemo(): ReactNode {
  return (
    <ModelInfoCard className="w-full max-w-sm">
      <Item size="xs">
        <ItemMedia>
          <AiProviderIcon provider="openai" type="avatar" size={32} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>GPT-4o</ItemTitle>
          <ItemDescription>OpenAI</ItemDescription>
        </ItemContent>
        <ItemFooter>
          <code className="text-muted-foreground text-xs">gpt-4o</code>
        </ItemFooter>
      </Item>
      <ModelInfoCardSection>
        <Item size="xs">
          <ModelInfoCardBadge className="bg-chart-1" />
          <ItemContent>
            <ItemTitle>Context length</ItemTitle>
          </ItemContent>
          <ItemActions>128K tokens</ItemActions>
        </Item>
      </ModelInfoCardSection>
      <ModelInfoCardSection>
        <Item size="xs">
          <ModelInfoCardBadge className="bg-chart-4" />
          <ItemContent>
            <ItemTitle>Pricing</ItemTitle>
          </ItemContent>
          <ItemActions>$5.00 / 1M tokens</ItemActions>
        </Item>
      </ModelInfoCardSection>
    </ModelInfoCard>
  );
}

export { ModelInfoCardDemo };
