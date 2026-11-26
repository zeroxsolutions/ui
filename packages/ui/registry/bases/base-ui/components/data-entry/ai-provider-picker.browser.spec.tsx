import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { AI_PROVIDER_PICKER_SAMPLE_ENTRIES, AiProviderPicker } from './ai-provider-picker';

const ENTRIES = [
  { provider: 'openai', name: 'OpenAI', description: 'Chat models.', meta: '12 models' },
  { provider: 'claude', name: 'Anthropic Claude', description: 'Long-context models.' },
];

describe('AiProviderPicker', () => {
  it('shows one card per entry, with its name, description and note', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    await expect.element(page.getByText('OpenAI', { exact: true })).toBeVisible();
    await expect.element(page.getByText('Chat models.')).toBeVisible();
    await expect.element(page.getByText('12 models')).toBeVisible();
    await expect.element(page.getByText('Anthropic Claude', { exact: true })).toBeVisible();
  });

  it('shows the sample entries when given none', async () => {
    await render(<AiProviderPicker />);

    for (const entry of AI_PROVIDER_PICKER_SAMPLE_ENTRIES) {
      await expect.element(page.getByText(entry.name, { exact: true })).toBeVisible();
    }
  });

  it('offers every card as a button, with or without onSelect', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    expect(
      page
        .getByRole('button')
        .elements()
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Select OpenAI', 'Select Anthropic Claude']);
  });

  it('calls onSelect with the provider key of the card selected', async () => {
    const onSelect = vi.fn();
    await render(<AiProviderPicker entries={ENTRIES} onSelect={onSelect} />);

    await userEvent.click(page.getByRole('button', { name: 'Select Anthropic Claude' }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('claude');
  });

  it('draws a footer only for an entry with a meta note', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    expect(page.getByTestId('card-footer').elements()).toHaveLength(1);
    await expect.element(page.getByTestId('card-footer')).toHaveTextContent('12 models');
  });
});
