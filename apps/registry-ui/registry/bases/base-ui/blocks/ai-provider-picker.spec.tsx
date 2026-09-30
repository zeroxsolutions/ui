import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AI_PROVIDER_PICKER_SAMPLE_ENTRIES, AiProviderPicker } from './ai-provider-picker';

afterEach(cleanup);

const ENTRIES = [
  { provider: 'openai', name: 'OpenAI', description: 'Chat models.', meta: '12 models' },
  { provider: 'claude', name: 'Anthropic Claude', description: 'Long-context models.' },
];

describe('AiProviderPicker', () => {
  it('shows one card per entry, with its name, description and note', () => {
    render(<AiProviderPicker entries={ENTRIES} />);

    expect(screen.getByText('OpenAI', { ignore: 'title' })).toBeTruthy();
    expect(screen.getByText('Chat models.')).toBeTruthy();
    expect(screen.getByText('12 models')).toBeTruthy();
    expect(screen.getByText('Anthropic Claude', { ignore: 'title' })).toBeTruthy();
  });

  it('shows the sample entries when given none', () => {
    render(<AiProviderPicker />);

    for (const entry of AI_PROVIDER_PICKER_SAMPLE_ENTRIES) {
      expect(screen.getByText(entry.name, { ignore: 'title' })).toBeTruthy();
    }
  });

  it('offers no card to select without onSelect', () => {
    render(<AiProviderPicker entries={ENTRIES} />);

    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('calls onSelect with the provider key of the card selected', () => {
    const onSelect = vi.fn();
    render(<AiProviderPicker entries={ENTRIES} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Select Anthropic Claude' }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('claude');
  });
});
