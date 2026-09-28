import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Sparkles } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatEmptyState } from './chat-empty-state';
import type { ChatSuggestion } from '../chat/chat-types';

afterEach(cleanup);

const suggestions: ChatSuggestion[] = [
  {
    title: 'Design a login',
    description: 'two-column',
    prompt: 'design login',
  },
  { title: 'Summarise', prompt: 'summarise this' },
];

describe('ChatEmptyState', () => {
  it('renders the consumer-supplied header copy and icon', () => {
    render(
      <ChatEmptyState
        icon={<Sparkles aria-label="sparkles" />}
        title="Start a conversation"
        description="Ask anything"
      />,
    );
    expect(screen.getByText('Start a conversation')).toBeTruthy();
    expect(screen.getByText('Ask anything')).toBeTruthy();
    expect(screen.getByLabelText('sparkles')).toBeTruthy();
  });

  it('renders no suggestion list when none are given', () => {
    render(<ChatEmptyState title="Empty" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reports the chosen suggestion prompt', () => {
    const onSelectPrompt = vi.fn();
    render(<ChatEmptyState title="Start" suggestions={suggestions} onSelectPrompt={onSelectPrompt} />);
    fireEvent.click(screen.getByText('Summarise'));
    expect(onSelectPrompt).toHaveBeenCalledWith('summarise this');
  });

  it('disables the cards when there is no select handler', () => {
    render(<ChatEmptyState title="Start" suggestions={suggestions} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    buttons.forEach((b) => expect((b as HTMLButtonElement).disabled).toBe(true));
  });
});
