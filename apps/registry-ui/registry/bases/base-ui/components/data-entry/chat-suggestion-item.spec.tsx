import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ItemContent, ItemTitle } from '@/registry/bases/base-ui/ui/item';

import { ChatSuggestionItem } from './chat-suggestion-item';

afterEach(cleanup);

describe('ChatSuggestionItem', () => {
  it('reports its prompt when picked', () => {
    const onSelectPrompt = vi.fn();
    render(
      <ChatSuggestionItem prompt="summarise this" onSelectPrompt={onSelectPrompt}>
        <ItemContent>
          <ItemTitle>Summarise</ItemTitle>
        </ItemContent>
      </ChatSuggestionItem>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Summarise' }));
    expect(onSelectPrompt).toHaveBeenCalledWith('summarise this');
  });

  it('runs the caller onClick before reporting the prompt', () => {
    const calls: string[] = [];
    render(
      <ChatSuggestionItem prompt="p" onClick={() => calls.push('click')} onSelectPrompt={() => calls.push('select')}>
        Pick
      </ChatSuggestionItem>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
    expect(calls).toEqual(['click', 'select']);
  });

  it('does not report the prompt when the caller prevents the default', () => {
    const onSelectPrompt = vi.fn();
    render(
      <ChatSuggestionItem prompt="p" onClick={(event) => event.preventDefault()} onSelectPrompt={onSelectPrompt}>
        Pick
      </ChatSuggestionItem>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
    expect(onSelectPrompt).not.toHaveBeenCalled();
  });

  it('renders disabled when there is no select handler', () => {
    render(<ChatSuggestionItem prompt="p">Pick</ChatSuggestionItem>);
    expect((screen.getByRole('button', { name: 'Pick' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('passes the caller props through', () => {
    render(
      <ChatSuggestionItem prompt="p" onSelectPrompt={() => {}} aria-describedby="hint">
        Pick
      </ChatSuggestionItem>,
    );
    const button = screen.getByRole('button', { name: 'Pick' });
    expect(button.getAttribute('aria-describedby')).toBe('hint');
  });
});
