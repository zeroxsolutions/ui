import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EmojiPicker } from './emoji-picker';

// jsdom doesn't implement scrollIntoView (the category nav calls it).
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('EmojiPicker', () => {
  it('calls onSelect with the chosen emoji', () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);

    // "grinning face" (😀) is the first emoji in Smileys & People.
    fireEvent.click(screen.getByRole('button', { name: 'grinning face' }));

    expect(onSelect).toHaveBeenCalledWith('😀');
  });

  it('renders the consumer-supplied frequent row', () => {
    render(<EmojiPicker onSelect={vi.fn()} frequent={['🍕']} />);

    expect(screen.getByText('Frequently used')).toBeTruthy();
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

  it('defers a cell’s artwork until it scrolls into view', () => {
    // Mock IntersectionObserver to capture observed cells without auto-firing,
    // so the gated (off-screen) state is what we assert. jsdom has no IO, so the
    // component would otherwise render every cell eagerly.
    const targets: Element[] = [];
    let fire: ((el: Element) => void) | null = null;
    class MockIO {
      constructor(private cb: IntersectionObserverCallback) {
        fire = (el: Element) =>
          this.cb(
            [{ target: el, isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
      }
      observe(el: Element) {
        targets.push(el);
      }
      unobserve() {
        /* no-op */
      }
      disconnect() {
        /* no-op */
      }
    }
    vi.stubGlobal('IntersectionObserver', MockIO);

    render(<EmojiPicker onSelect={vi.fn()} />);

    // Every cell is registered for observation, but none has intersected yet…
    expect(targets.length).toBeGreaterThan(500);
    expect(document.querySelectorAll('img')).toHaveLength(0);
    // …the buttons (accessible name + click target) still exist meanwhile.
    expect(screen.getByRole('button', { name: 'grinning face' })).toBeTruthy();

    // Scrolling a cell into view renders its Fluent artwork.
    act(() => fire?.(targets[0]));
    expect(document.querySelectorAll('img').length).toBeGreaterThan(0);
  });
});
