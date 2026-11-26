import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { ItemContent, ItemTitle } from '@/registry/bases/base-ui/ui/item';

import { ChatSuggestionItem } from './chat-suggestion-item';

describe('ChatSuggestionItem', () => {
  it('reports its prompt when picked', async () => {
    const onSelectPrompt = vi.fn();
    await render(
      <ChatSuggestionItem prompt="summarise this" onSelectPrompt={onSelectPrompt}>
        <ItemContent>
          <ItemTitle>Summarise</ItemTitle>
        </ItemContent>
      </ChatSuggestionItem>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Summarise' }));
    expect(onSelectPrompt).toHaveBeenCalledWith('summarise this');
  });

  it('runs the caller onClick before reporting the prompt', async () => {
    const calls: string[] = [];
    await render(
      <ChatSuggestionItem prompt="p" onClick={() => calls.push('click')} onSelectPrompt={() => calls.push('select')}>
        Pick
      </ChatSuggestionItem>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Pick' }));
    expect(calls).toEqual(['click', 'select']);
  });

  it('does not report the prompt when the caller prevents the default', async () => {
    const onSelectPrompt = vi.fn();
    await render(
      <ChatSuggestionItem prompt="p" onClick={(event) => event.preventDefault()} onSelectPrompt={onSelectPrompt}>
        Pick
      </ChatSuggestionItem>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Pick' }));
    expect(onSelectPrompt).not.toHaveBeenCalled();
  });

  it('renders disabled when there is no select handler', async () => {
    await render(<ChatSuggestionItem prompt="p">Pick</ChatSuggestionItem>);
    await expect.element(page.getByRole('button', { name: 'Pick' })).toBeDisabled();
  });
});
