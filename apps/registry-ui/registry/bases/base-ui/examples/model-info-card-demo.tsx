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
      <Item size="xs" className="p-0">
        <ItemMedia>
          <AiProviderIcon provider="openai" type="avatar" size={32} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>GPT-4o</ItemTitle>
          <ItemDescription>OpenAI</ItemDescription>
        </ItemContent>
        <ItemFooter className="text-muted-foreground font-mono text-xs">gpt-4o</ItemFooter>
      </Item>
      <ModelInfoCardSection>
        <Item size="xs">
          <ModelInfoCardBadge className="bg-blue-500" />
          <ItemContent>
            <ItemTitle>Context length</ItemTitle>
          </ItemContent>
          <ItemActions>128K tokens</ItemActions>
        </Item>
      </ModelInfoCardSection>
      <ModelInfoCardSection>
        <Item size="xs">
          <ModelInfoCardBadge className="bg-emerald-500" />
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
