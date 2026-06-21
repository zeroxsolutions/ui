import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EmojiPicker } from './emoji-picker';

// jsdom doesn't implement scrollIntoView (the category nav calls it).
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('EmojiPicker', () => {
  it('selects an emoji and records it as frequently used', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);

    // "grinning face" (😀) is the first emoji in Smileys & People.
    fireEvent.click(screen.getByRole('button', { name: 'grinning face' }));

    expect(onSelect).toHaveBeenCalledWith('😀');
    const frequent = JSON.parse(
      localStorage.getItem('chisel-ui:emoji-frequent') ?? '[]',
    );
    expect(frequent).toContain('😀');
  });

  it('filters the grid by search query', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'pizza' },
    });

    // The match is shown…
    expect(screen.getByRole('button', { name: 'pizza' })).toBeTruthy();
    // …and a non-matching emoji is filtered out.
    expect(screen.queryByRole('button', { name: 'grinning face' })).toBeNull();
  });

  it('shows an empty state for a query with no matches', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'zzzznotanemoji' },
    });

    expect(screen.getByText('No emoji found')).toBeTruthy();
  });
});
