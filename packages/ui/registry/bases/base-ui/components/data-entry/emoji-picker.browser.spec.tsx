import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { Empty, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

import { drawingIn, expectPlaying, playMotion, settled } from '../../../../../test/motion';

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

// "grinning face" is the first emoji in Smileys & people.
/** The category nav's item named `name`. */
const navItem = (name: string) =>
  page.getByRole('group', { name: 'Categories' }).getByRole('button', { name, exact: true });

const grinning = () => page.getByRole('button', { name: 'grinning face', exact: true });

describe('EmojiPicker', () => {
  it('calls onSelect with the chosen emoji', async () => {
    const onSelect = vi.fn();
    await render(<Picker onSelect={onSelect} />);

    await userEvent.click(grinning());

    expect(onSelect).toHaveBeenCalledWith('\u{1F600}');
  });

  it('heads the consumer-supplied frequent row with its name and names its nav item after it', async () => {
    await render(<Picker onSelect={vi.fn()} frequent={{ name: 'Hay dung', emojis: ['\u{1F355}'] }} />);

    await expect.element(page.getByText('Hay dung', { exact: true })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Hay dung' })).toBeVisible();
  });

  it('offers no frequent nav item without a frequent row', async () => {
    await render(<Picker onSelect={vi.fn()} />);

    await expect.element(grinning()).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Frequently used' })).not.toBeInTheDocument();
  });

  it('offers a disabled frequent nav item for an empty row', async () => {
    await render(<Picker onSelect={vi.fn()} frequent={{ name: 'Frequently used', emojis: [] }} />);

    await expect.element(page.getByRole('button', { name: 'Frequently used' })).toBeDisabled();
  });

  it('presses the nav item of the category it jumps to, and keeps it pressed when pressed again', async () => {
    await render(<Picker onSelect={vi.fn()} />);
    const smileys = navItem('Smileys & people');
    const flags = navItem('Flags');

    await expect.element(smileys).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(flags);
    await expect.element(flags).toHaveAttribute('aria-pressed', 'true');
    await expect.element(smileys).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(flags);
    await expect.element(flags).toHaveAttribute('aria-pressed', 'true');
  });

  it('filters the grid by search query and hides the nav while searching', async () => {
    await render(<Picker onSelect={vi.fn()} />);

    await userEvent.fill(page.getByLabelText('Search emoji'), 'pizza');

    await expect.element(page.getByRole('button', { name: 'pizza' })).toBeVisible();
    await expect.element(grinning()).not.toBeInTheDocument();
    await expect.element(page.getByRole('group', { name: 'Categories' })).not.toBeInTheDocument();
  });

  it('shows the composed EmojiPickerEmpty only for a query with no matches', async () => {
    await render(<Picker onSelect={vi.fn()} />);
    await expect.element(grinning()).toBeVisible();
    await expect.element(page.getByText('No emoji found')).not.toBeInTheDocument();

    await userEvent.fill(page.getByLabelText('Search emoji'), 'zzzznotanemoji');

    await expect.element(page.getByText('No emoji found')).toBeVisible();
  });

  it('draws the grid in the global Fluent style, 3D by default', async () => {
    await render(<Picker onSelect={vi.fn()} />);
    await expect.element(grinning()).toBeVisible();

    const src = grinning().element().querySelector('img')?.getAttribute('src');
    expect(src).toContain('/3d/');
    expect(src).toMatch(/\.webp$/);
  });

  it('mounts only the window of cells in view, not the whole catalog', async () => {
    await render(<Picker onSelect={vi.fn()} />);
    await expect.element(grinning()).toBeVisible();

    // The catalog holds about 1900 emoji.
    const mounted = page.getByTestId('emoji-picker-cell').elements().length;
    expect(mounted).toBeGreaterThan(0);
    expect(mounted).toBeLessThan(300);
  });
});

describe('EmojiPickerNav category icons, for a reader who allows motion', () => {
  playMotion();

  it('plays a category icon while the pointer or the focus is on its nav item', async () => {
    await render(<Picker onSelect={vi.fn()} />);
    const flags = navItem('Flags');
    await expect.element(flags).toBeVisible();

    await userEvent.hover(flags);
    await expectPlaying(flags.element(), drawingIn(flags.element()));
    await userEvent.unhover(flags);
    const rest = await settled(flags.element());

    await userEvent.click(navItem('Symbols'));
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(flags).toHaveFocus();
    await expectPlaying(flags.element(), rest);
  });
});
