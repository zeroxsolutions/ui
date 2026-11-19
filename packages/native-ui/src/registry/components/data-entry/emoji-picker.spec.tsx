import { render, screen, userEvent } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import type { EmojiPickerRow } from '../../lib/emoji-picker-rows';
import { Empty, EmptyTitle } from '../../ui/empty';
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerEmpty,
  EmojiPickerNav,
  EmojiPickerSearch,
  type EmojiPickerProps,
} from './emoji-picker';
import { focus, handleOf } from '../../icons/animated-icon.testing';
import { ClockIcon } from '../../icons/clock-icon';
import { SmileIcon } from '../../icons/smile-icon';
import { LeafIcon } from '../../icons/leaf-icon';
import { CoffeeIcon } from '../../icons/coffee-icon';
import { PlaneIcon } from '../../icons/plane-icon';
import { DumbbellIcon } from '../../icons/dumbbell-icon';
import { LightbulbIcon } from '../../icons/lightbulb-icon';
import { HashIcon } from '../../icons/hash-icon';
import { FlagIcon } from '../../icons/flag-icon';

jest.mock('../../icons/clock-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('clock-icon'),
);
jest.mock('../../icons/smile-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('smile-icon'),
);
jest.mock('../../icons/leaf-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('leaf-icon'),
);
jest.mock('../../icons/coffee-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('coffee-icon'),
);
jest.mock('../../icons/plane-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('plane-icon'),
);
jest.mock('../../icons/dumbbell-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('dumbbell-icon'),
);
jest.mock('../../icons/lightbulb-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('lightbulb-icon'),
);
jest.mock('../../icons/hash-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('hash-icon'),
);
jest.mock('../../icons/flag-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('flag-icon'),
);

beforeEach(() => {
  jest.clearAllMocks();
});

/** The picker as its demo composes it: search, the list with an empty state, and the category nav. */
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

describe('EmojiPicker', () => {
  it('calls onSelect with the pressed emoji', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    await render(<Picker onSelect={onSelect} />);

    // The grinning face opens Smileys & people, the first category.
    await user.press(screen.getByRole('button', { name: 'grinning face' }));

    expect(onSelect.mock.calls).toEqual([['\u{1F600}']]);
  });

  it('heads the frequent row with its name, names its nav item after it, and selects from it', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    await render(<Picker onSelect={onSelect} frequent={{ name: 'Hay dung', emojis: ['\u{1F355}'] }} />);

    expect(screen.getByText('Hay dung')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Hay dung' })).toBeEnabled();
    await user.press(screen.getByRole('button', { name: '\u{1F355}' }));
    expect(onSelect.mock.calls).toEqual([['\u{1F355}']]);
  });

  it('offers no frequent nav item without a frequent row, and a disabled one for an empty row', async () => {
    await render(<Picker onSelect={jest.fn()} />);
    expect(screen.queryByRole('radio', { name: 'Frequently used' })).toBeNull();

    await screen.rerender(<Picker onSelect={jest.fn()} frequent={{ name: 'Frequently used', emojis: [] }} />);
    expect(screen.getByRole('radio', { name: 'Frequently used' })).toBeDisabled();
    expect(screen.queryByText('Frequently used')).toBeNull();
  });

  it('checks the category the nav moves to, and keeps it checked when pressed again', async () => {
    const user = userEvent.setup();
    await render(<Picker onSelect={jest.fn()} />);
    const smileys = screen.getByRole('radio', { name: 'Smileys & people' });
    const flags = screen.getByRole('radio', { name: 'Flags' });
    expect(smileys).toBeChecked();

    await user.press(flags);
    expect(flags).toBeChecked();
    expect(smileys).not.toBeChecked();

    await user.press(flags);
    expect(flags).toBeChecked();
  });

  it('asks the list to scroll to the heading of the category the nav moves to', async () => {
    // Jest's list never scrolls, so the spec reads the row the list was asked to bring into view.
    const scrollToIndex = jest.spyOn(FlatList.prototype, 'scrollToIndex');
    const user = userEvent.setup();
    await render(<Picker onSelect={jest.fn()} />);

    await user.press(screen.getByRole('radio', { name: 'Flags' }));

    expect(scrollToIndex).toHaveBeenCalledTimes(1);
    const [{ index }] = scrollToIndex.mock.calls[0];
    const list = scrollToIndex.mock.contexts[0] as FlatList<EmojiPickerRow>;
    expect(list.props.data?.[index]).toMatchObject({ type: 'header', name: 'Flags' });
    scrollToIndex.mockRestore();
  });

  it('narrows the list to the emoji whose search text holds the query, and hides the nav meanwhile', async () => {
    const user = userEvent.setup();
    await render(<Picker onSelect={jest.fn()} />);

    await user.type(screen.getByLabelText('Search emoji'), ' Pizza ');

    expect(screen.getByRole('button', { name: 'pizza' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'grinning face' })).toBeNull();
    expect(screen.queryByLabelText('Categories')).toBeNull();
    expect(screen.queryByText('Smileys & people')).toBeNull();
    expect(screen.queryByText('No emoji found')).toBeNull();

    await user.clear(screen.getByLabelText('Search emoji'));
    expect(screen.getByLabelText('Categories')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'grinning face' })).toBeOnTheScreen();
  });

  it('shows the composed EmojiPickerEmpty only while a query matches nothing', async () => {
    const user = userEvent.setup();
    await render(<Picker onSelect={jest.fn()} />);
    expect(screen.queryByText('No emoji found')).toBeNull();

    await user.type(screen.getByLabelText('Search emoji'), 'zzzznotanemoji');

    expect(screen.getByText('No emoji found')).toBeOnTheScreen();
    expect(screen.queryAllByRole('button')).toEqual([]);
  });
});

describe('EmojiPickerNav motion', () => {
  it.each([
    ['Recent', ClockIcon],
    ['Smileys & people', SmileIcon],
    ['Animals & nature', LeafIcon],
    ['Food & drink', CoffeeIcon],
    ['Travel & places', PlaneIcon],
    ['Activities', DumbbellIcon],
    ['Objects', LightbulbIcon],
    ['Symbols', HashIcon],
    ['Flags', FlagIcon],
  ])('starts the icon of %s on press-in and on focus', async (name, icon) => {
    await render(<Picker onSelect={jest.fn()} frequent={{ name: 'Recent', emojis: ['\u{1F355}'] }} />);
    const control = screen.getByRole('radio', { name });

    await userEvent.setup().press(control);
    await focus(control);

    expect(handleOf(icon).startAnimation).toHaveBeenCalledTimes(2);
    expect(handleOf(icon).stopAnimation).not.toHaveBeenCalled();
    for (const other of [
      ClockIcon,
      SmileIcon,
      LeafIcon,
      CoffeeIcon,
      PlaneIcon,
      DumbbellIcon,
      LightbulbIcon,
      HashIcon,
      FlagIcon,
    ]) {
      if (other !== icon) expect(handleOf(other).startAnimation).not.toHaveBeenCalled();
    }
  });
});
