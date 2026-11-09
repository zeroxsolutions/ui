import { isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemTitle } from '../../ui/item';
import { Text } from '../../ui/text';
import * as modelInfoCard from './model-info-card';
import { ModelInfoCard, ModelInfoCardIndicator, ModelInfoCardSection } from './model-info-card';

function classesOf(testID: string): string[] {
  return emittedClasses(screen.getByTestId(testID, { includeHiddenElements: true }).props.className);
}

describe('ModelInfoCard', () => {
  it('draws the composed identity header over its sections, spaced as a column', async () => {
    await render(
      <ModelInfoCard testID="card">
        <Item size="xs">
          <ItemContent>
            <ItemTitle>GPT-4o</ItemTitle>
            <ItemDescription>OpenAI</ItemDescription>
          </ItemContent>
          <ItemFooter>
            <Text>gpt-4o</Text>
          </ItemFooter>
        </Item>
        <ModelInfoCardSection testID="section">
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
    expect(classesOf('card')).toEqual(expect.arrayContaining(['flex-col', 'gap-3']));
    expect(classesOf('section')).toEqual(expect.arrayContaining(['flex-col', 'gap-1.5']));
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
  it('is a muted bar unless given a tone, hidden from a screen reader', async () => {
    await render(<ModelInfoCardIndicator testID="bar" />);

    expect(classesOf('bar')).toEqual(
      expect.arrayContaining(['h-3.5', 'w-1', 'shrink-0', 'rounded-full', 'bg-muted-foreground']),
    );
    expect(isHiddenFromAccessibility(screen.getByTestId('bar', { includeHiddenElements: true }))).toBe(true);
  });

  it.each(['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const)(
    'fills a %s bar with that chart colour',
    async (tone) => {
      await render(<ModelInfoCardIndicator testID="bar" tone={tone} />);

      expect(classesOf('bar')).toContain(`bg-${tone}`);
      expect(classesOf('bar')).not.toContain('bg-muted-foreground');
    },
  );
});
