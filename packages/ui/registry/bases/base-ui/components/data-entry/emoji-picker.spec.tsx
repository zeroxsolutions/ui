import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Empty, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerEmpty,
  EmojiPickerNav,
  EmojiPickerSearch,
  type EmojiPickerProps,
} from './emoji-picker';

/** The picker as its demo composes it: search, the grid with an empty state, and the category nav. */
function Picker(props: Omit<EmojiPickerProps, 'children'>) {
  return (
    <EmojiPicker {...props}>
      <EmojiPickerSearch />
      <EmojiPickerContent>
        <EmojiPickerEmpty>
          <Empty>
            <EmptyTitle>No emoji found</EmptyTitle>
          </Empty>
        </EmojiPickerEmpty>
      </EmojiPickerContent>
      <EmojiPickerNav aria-label="Categories" />
    </EmojiPicker>
  );
}

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
    render(<Picker onSelect={onSelect} />);
    await settle();

    // "grinning face" is the first emoji in Smileys & people.
    fireEvent.click(screen.getByRole('button', { name: 'grinning face' }));

    expect(onSelect).toHaveBeenCalledWith('\u{1F600}');
  });

  it('heads the consumer-supplied frequent row with its name and names its nav item after it', async () => {
    render(<Picker onSelect={vi.fn()} frequent={{ name: 'Hay dung', emojis: ['\u{1F355}'] }} />);
    await settle();

    expect(screen.getByText('Hay dung')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hay dung' })).toBeTruthy();
  });

  it('offers no frequent nav item without a frequent row, and a disabled one for an empty row', async () => {
    const { unmount } = render(<Picker onSelect={vi.fn()} />);
    await settle();
    expect(screen.queryByRole('button', { name: 'Frequently used' })).toBeNull();
    unmount();

    render(<Picker onSelect={vi.fn()} frequent={{ name: 'Frequently used', emojis: [] }} />);
    await settle();
    const item = screen.getByRole('button', { name: 'Frequently used' });
    expect(item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true').toBe(true);
  });

  it('presses the nav item of the category it jumps to, and keeps it pressed when pressed again', async () => {
    render(<Picker onSelect={vi.fn()} />);
    await settle();

    const smileys = screen.getByRole('button', { name: 'Smileys & people' });
    expect(smileys.getAttribute('aria-pressed')).toBe('true');

    const flags = screen.getByRole('button', { name: 'Flags' });
    fireEvent.click(flags);
    expect(flags.getAttribute('aria-pressed')).toBe('true');
    expect(smileys.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(flags);
    expect(flags.getAttribute('aria-pressed')).toBe('true');
  });

  it('filters the grid by search query and hides the nav while searching', async () => {
    render(<Picker onSelect={vi.fn()} />);
    await settle();

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'pizza' },
    });
    await settle();

    // The match is shown...
    expect(screen.getByRole('button', { name: 'pizza' })).toBeTruthy();
    // ...and a non-matching emoji is filtered out.
    expect(screen.queryByRole('button', { name: 'grinning face' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Categories' })).toBeNull();
  });

  it('shows the composed EmojiPickerEmpty only for a query with no matches', async () => {
    render(<Picker onSelect={vi.fn()} />);
    await settle();
    expect(screen.queryByText('No emoji found')).toBeNull();

    fireEvent.change(screen.getByLabelText('Search emoji'), {
      target: { value: 'zzzznotanemoji' },
    });
    await settle();

    expect(screen.getByText('No emoji found')).toBeTruthy();
  });

  it('renders the grid in the global Fluent style (3D by default)', async () => {
    render(<Picker onSelect={vi.fn()} />);
    await settle();
    // The picker no longer owns a style control - cells draw in the app-wide
    // style (`setFluentEmojiStyle`), defaulting to the 3D webp set.
    const grinningImg = screen.getByRole('button', { name: 'grinning face' }).querySelector('img');

    expect(grinningImg?.getAttribute('src')).toContain('/3d/');
    expect(grinningImg?.getAttribute('src')).toMatch(/\.webp$/);
  });

  it('virtualizes the grid - mounts only a window of cells, not the whole catalog', async () => {
    render(<Picker onSelect={vi.fn()} />);
    await settle();

    // The catalog is ~1900 emoji; a windowed render mounts ~one screenful of
    // Fluent artwork, so the count stays far below the full catalog.
    const mounted = document.querySelectorAll('img').length;
    expect(mounted).toBeGreaterThan(0);
    expect(mounted).toBeLessThan(300);

    // The first cell of the initial window is present and clickable.
    expect(screen.getByRole('button', { name: 'grinning face' })).toBeTruthy();
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
    // jsdom resolves no --spacing, so a step measures the default 4px.
    // The first cell row sits one header below the top: 7 spacing steps.
    const firstCells = document.querySelector<HTMLElement>('[data-index="1"]');
    expect(firstCells?.style.transform).toBe('translateY(28px)');
    // The next one a cell row further: the size-8 button (32px) plus the half-step gap.
    const secondCells = document.querySelector<HTMLElement>('[data-index="2"]');
    expect(secondCells?.style.transform).toBe('translateY(62px)');
  });
});
