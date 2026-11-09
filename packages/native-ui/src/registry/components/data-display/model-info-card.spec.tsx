import { isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemTitle } from '../../ui/item';
import { Text } from '../../ui/text';
import * as modelInfoCard from './model-info-card';
import { ModelInfoCard, ModelInfoCardIndicator, ModelInfoCardSection } from './model-info-card';

describe('ModelInfoCard', () => {
  it('draws the composed identity header and its sections', async () => {
    await render(
      <ModelInfoCard>
        <Item size="xs">
          <ItemContent>
            <ItemTitle>GPT-4o</ItemTitle>
            <ItemDescription>OpenAI</ItemDescription>
          </ItemContent>
          <ItemFooter>
            <Text>gpt-4o</Text>
          </ItemFooter>
        </Item>
        <ModelInfoCardSection>
          <Item size="xs">
            <ItemContent>
              <ItemTitle>Context length</ItemTitle>
            </ItemContent>
            <ItemActions>
              <Text>128K tokens</Text>
            </ItemActions>
          </Item>
        </ModelInfoCardSection>
      </ModelInfoCard>,
    );

    for (const text of ['GPT-4o', 'OpenAI', 'gpt-4o', 'Context length', '128K tokens']) {
      expect(screen.getByText(text)).toBeOnTheScreen();
    }
  });

  it('exports the card, its section and the accent indicator, and no other part', () => {
    expect(Object.keys(modelInfoCard).sort()).toEqual([
      'ModelInfoCard',
      'ModelInfoCardIndicator',
      'ModelInfoCardSection',
    ]);
  });
});

describe('ModelInfoCardIndicator', () => {
  it('is hidden from a screen reader', async () => {
    await render(<ModelInfoCardIndicator testID="bar" />);

    expect(isHiddenFromAccessibility(screen.getByTestId('bar', { includeHiddenElements: true }))).toBe(true);
  });
});
