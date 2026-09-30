import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Empty, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from './emoji-picker';

// ScrollArea (upstream) measures its viewport in a `queueMicrotask` its layout
// effect schedules on mount and on each hidden-state change, outside of
// `render`'s own act() batch - awaiting a no-op act() settles it before the
// test's assertions run.
async function settle(): Promise<void> {
  await act(async () => {});
}

beforeAll(() => {
  // The category nav scrolls the viewport; jsdom implements neither.
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
  // The virtualizer measures the scroll element via ResizeObserver, absent in
  // jsdom - without it the grid window never seeds.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  // ScrollArea also waits for subtree animations via getAnimations, absent in
  // jsdom - without a stub, settling past that wait throws once the real
  // (0ms) timer it schedules fires.
  Element.prototype.getAnimations ??= vi.fn(() => []);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('EmojiPicker', () => {
  it('calls onSelect with the chosen emoji', async () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);
    await settle();

    // "grinning face" (😀) is the first emoji in Smileys & people.
    fireEvent.click(screen.getByRole('button', { name: 'grinning face' }));

    expect(onSelect).toHaveBeenCalledWith('😀');
  });

  it('renders the consumer-supplied frequent row', async () => {
    render(<EmojiPicker onSelect={vi.fn()} frequent={['🍕']} />);
    await settle();

    expect(screen.getByText('Frequently used')).toBeTruthy();
  });

  it('lets frequentLabel override the frequent-row heading', async () => {
    render(<EmojiPicker onSelect={vi.fn()} frequent={['🍕']} frequentLabel="Hay dùng" />);
    await settle();

    expect(screen.getByText('Hay dùng')).toBeTruthy();
    expect(screen.queryByText('Frequently used')).toBeNull();
  });

  it('filters the grid by search query', async () => {
    render(<EmojiPicker onSelect={vi.fn()} />);
    await settle();

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'pizza' },
    });
    await settle();

    // The match is shown...
    expect(screen.getByRole('button', { name: 'pizza' })).toBeTruthy();
    // ...and a non-matching emoji is filtered out.
    expect(screen.queryByRole('button', { name: 'grinning face' })).toBeNull();
  });

  it('shows an empty state for a query with no matches', async () => {
    render(<EmojiPicker onSelect={vi.fn()} />);
    await settle();

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'zzzznotanemoji' },
    });
    await settle();

    expect(screen.getByText('No emoji found')).toBeTruthy();
  });

  it('renders the grid in the global Fluent style (3D by default)', async () => {
    render(<EmojiPicker onSelect={vi.fn()} />);
    await settle();
    // The picker no longer owns a style control - cells draw in the app-wide
    // style (`setFluentEmojiStyle`), defaulting to the 3D webp set.
    const grinningImg = screen.getByRole('button', { name: 'grinning face' }).querySelector('img');

    expect(grinningImg?.getAttribute('src')).toContain('/3d/');
    expect(grinningImg?.getAttribute('src')).toMatch(/\.webp$/);
  });

  it('virtualizes the grid - mounts only a window of cells, not the whole catalog', async () => {
    render(<EmojiPicker onSelect={vi.fn()} />);
    await settle();

    // The catalog is ~1900 emoji; a windowed render mounts ~one screenful of
    // Fluent artwork, so the count stays far below the full catalog.
    const mounted = document.querySelectorAll('img').length;
    expect(mounted).toBeGreaterThan(0);
    expect(mounted).toBeLessThan(300);

    // The first cell of the initial window is present and clickable.
    expect(screen.getByRole('button', { name: 'grinning face' })).toBeTruthy();
  });

  it('renders the consumer-composed Empty in place of the default no-results state', async () => {
    render(
      <EmojiPicker onSelect={vi.fn()}>
        <EmojiPickerSearch />
        <EmojiPickerContent>
          <Empty>
            <EmptyTitle>Nothing matches</EmptyTitle>
          </Empty>
        </EmojiPickerContent>
      </EmojiPicker>,
    );
    await settle();

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'zzzznotanemoji' },
    });
    await settle();

    expect(screen.getByText('Nothing matches')).toBeTruthy();
    expect(screen.queryByText('No emoji found')).toBeNull();
  });

  it("sizes the viewport and the rows from one set of spacing steps, a cell row being the preset's icon button", async () => {
    render(
      <EmojiPicker onSelect={vi.fn()}>
        <EmojiPickerContent size="lg" />
      </EmojiPicker>,
    );
    await settle();

    const content = document.querySelector<HTMLElement>('[style*="--emoji-picker-height"]');
    expect(content?.style.getPropertyValue('--emoji-picker-height')).toBe('calc(var(--spacing) * 80)');
    expect(content?.style.getPropertyValue('--emoji-picker-columns')).toBe('repeat(8, minmax(0, 1fr))');
    // The first cell row sits one header below the top: 7 spacing steps at 4px.
    const firstCells = document.querySelector<HTMLElement>('[data-index="1"]');
    expect(firstCells?.style.transform).toBe('translateY(28px)');
    // The next one a cell row further: the size-8 button (32px) plus the half-step gap.
    const secondCells = document.querySelector<HTMLElement>('[data-index="2"]');
    expect(secondCells?.style.transform).toBe('translateY(62px)');
  });
});
