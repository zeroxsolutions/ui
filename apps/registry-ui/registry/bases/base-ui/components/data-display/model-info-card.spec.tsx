import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import * as modelInfoCardModule from './model-info-card';
import { ModelInfoCard, ModelInfoCardSection } from './model-info-card';

afterEach(cleanup);

describe('ModelInfoCard', () => {
  it('renders the identity header - media, name, vendor, modelId - over the body', () => {
    render(
      <ModelInfoCard media={<span data-testid="logo" />} name="GPT-4o" vendor="OpenAI" modelId="gpt-4o">
        <div data-testid="body" />
      </ModelInfoCard>,
    );

    const card = document.querySelector('[data-slot="model-info-card"]');
    expect(card?.querySelector('[data-testid="logo"]')).toBeTruthy();
    expect(screen.getByText('GPT-4o')).toBeTruthy();
    expect(screen.getByText('OpenAI')).toBeTruthy();
    expect(screen.getByText('gpt-4o')).toBeTruthy();
    expect(screen.getByTestId('body')).toBeTruthy();
  });

  it('renders with only a name (optional slots omitted)', () => {
    render(<ModelInfoCard name="Custom model" />);

    expect(screen.getByText('Custom model')).toBeTruthy();
  });
});

describe('ModelInfoCardSection', () => {
  it('renders an accent bar, title, value, and children', () => {
    render(
      <ModelInfoCardSection accent="bg-blue-500" title="Context Length" value="128K tokens">
        <div data-testid="line" />
      </ModelInfoCardSection>,
    );

    const section = document.querySelector('[data-slot="model-info-card-section"]');
    expect(section?.querySelector('.bg-blue-500')).toBeTruthy();
    expect(screen.getByText('Context Length')).toBeTruthy();
    expect(screen.getByText('128K tokens')).toBeTruthy();
    expect(screen.getByTestId('line')).toBeTruthy();
  });

  it('omits the trailing value cleanly', () => {
    render(
      <ModelInfoCardSection title="Abilities">
        <div />
      </ModelInfoCardSection>,
    );

    expect(screen.getByText('Abilities')).toBeTruthy();
  });
});

describe('model-info-card module', () => {
  it('exports only the card and section - no line/row or hover-wrapper component', () => {
    expect(Object.keys(modelInfoCardModule).sort()).toEqual(['ModelInfoCard', 'ModelInfoCardSection']);
  });
});
