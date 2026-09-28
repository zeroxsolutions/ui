import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EmojiPicker } from './emoji-picker';

beforeAll(() => {
  // The category nav scrolls the viewport; jsdom implements neither.
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
  // The virtualizer measures the scroll element via ResizeObserver, absent in
  // jsdom — without it the grid window never seeds.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
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

  it('lets frequentLabel override the frequent-row heading', () => {
    render(<EmojiPicker onSelect={vi.fn()} frequent={['🍕']} frequentLabel="Hay dùng" />);

    expect(screen.getByText('Hay dùng')).toBeTruthy();
    expect(screen.queryByText('Frequently used')).toBeNull();
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

  it('renders the grid in the global Fluent style (3D by default)', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);
    // The picker no longer owns a style control — cells draw in the app-wide
    // style (`setFluentEmojiStyle`), defaulting to the 3D webp set.
    const grinningImg = screen.getByRole('button', { name: 'grinning face' }).querySelector('img');

    expect(grinningImg?.getAttribute('src')).toContain('/3d/');
    expect(grinningImg?.getAttribute('src')).toMatch(/\.webp$/);
  });

  it('virtualizes the grid — mounts only a window of cells, not the whole catalog', () => {
    render(<EmojiPicker onSelect={vi.fn()} />);

    // The catalog is ~1900 emoji; a windowed render mounts ~one screenful of
    // Fluent artwork, so the count stays far below the full catalog.
    const mounted = document.querySelectorAll('img').length;
    expect(mounted).toBeGreaterThan(0);
    expect(mounted).toBeLessThan(300);

    // The first cell of the initial window is present and clickable.
    expect(screen.getByRole('button', { name: 'grinning face' })).toBeTruthy();
  });
});
