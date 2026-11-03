import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/registry/bases/base-ui/ui/item';
import * as modelInfoCardModule from './model-info-card';
import { ModelInfoCard, ModelInfoCardIndicator, ModelInfoCardSection } from './model-info-card';

afterEach(cleanup);

describe('ModelInfoCard', () => {
  it('renders the composed identity header - media, name, vendor, modelId - over the body', () => {
    render(
      <ModelInfoCard>
        <Item size="xs">
          <ItemMedia>
            <span data-testid="logo" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>GPT-4o</ItemTitle>
            <ItemDescription>OpenAI</ItemDescription>
          </ItemContent>
          <ItemFooter>gpt-4o</ItemFooter>
        </Item>
        <div data-testid="body" />
      </ModelInfoCard>,
    );

    expect(screen.getByTestId('logo')).toBeTruthy();
    expect(screen.getByText('GPT-4o')).toBeTruthy();
    expect(screen.getByText('OpenAI')).toBeTruthy();
    expect(screen.getByText('gpt-4o')).toBeTruthy();
    expect(screen.getByTestId('body')).toBeTruthy();
  });
});

describe('ModelInfoCardSection', () => {
  it('renders the title, value and children it composes', () => {
    render(
      <ModelInfoCardSection>
        <Item size="xs">
          <ItemMedia>
            <ModelInfoCardIndicator />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Context length</ItemTitle>
          </ItemContent>
          <ItemActions>128K tokens</ItemActions>
        </Item>
        <div data-testid="line" />
      </ModelInfoCardSection>,
    );

    expect(screen.getByText('Context length')).toBeTruthy();
    expect(screen.getByText('128K tokens')).toBeTruthy();
    expect(screen.getByTestId('line')).toBeTruthy();
  });
});

describe('model-info-card module', () => {
  it('exports the card, its section and the accent indicator - no line/row or hover-wrapper component', () => {
    expect(Object.keys(modelInfoCardModule).sort()).toEqual([
      'ModelInfoCard',
      'ModelInfoCardIndicator',
      'ModelInfoCardSection',
    ]);
  });
});
