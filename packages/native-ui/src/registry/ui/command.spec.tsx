import { PortalHost } from '@rn-primitives/portal';
import { useState } from 'react';
import { act, configure, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';
import type { CommandProps } from './command';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity a dialog's fade starts at hides
// it from them.
configure({ defaultIncludeHiddenElements: true });

interface PaletteProps {
  root?: CommandProps;
  onSelect?: (value: string) => void;
}

/** Upstream's demo: two groups of commands, a disabled one among them, and shortcuts on the second group. */
function Palette({ root, onSelect }: PaletteProps) {
  return (
    <Command {...root}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList testID="list">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions" testID="suggestions">
          <CommandItem onSelect={onSelect}>
            <Text>Calendar</Text>
          </CommandItem>
          <CommandItem keywords={['smiley']} onSelect={onSelect}>
            <Text>Search Emoji</Text>
          </CommandItem>
          <CommandItem disabled onSelect={onSelect}>
            <Text>Calculator</Text>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator testID="separator" />
        <CommandGroup heading="Settings" testID="settings">
          <CommandItem value="profile" onSelect={onSelect}>
            <Text>Profile</Text>
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
          <CommandItem value="billing" onSelect={onSelect}>
            <Text>Billing</Text>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

const input = () => screen.getByPlaceholderText('Type a command or search...');
// An item's name runs on into its shortcut, as its text does.
const named = (name: string) => new RegExp(`^${name}`);
const option = (name: string) => screen.getByRole('option', { name: named(name) });
const queryOption = (name: string) => screen.queryByRole('option', { name: named(name) });
const classesOf = (name: string) => emittedClasses(option(name).props.className);

describe('Command', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const setUp = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  it('lists every item under its group heading, with no empty message, before anything is typed', async () => {
    await render(<Palette />);

    expect(option('Calendar')).toBeOnTheScreen();
    expect(option('Billing')).toBeOnTheScreen();
    expect(screen.getByText('Suggestions')).toBeOnTheScreen();
    expect(screen.getByTestId('separator')).toBeOnTheScreen();
    expect(screen.queryByText('No results found.')).toBeNull();
  });

  it('filters its items by the typed text, ignoring case, and hides a group left with none', async () => {
    const user = setUp();
    await render(<Palette />);

    await user.type(input(), 'CAL');

    expect(option('Calendar')).toBeOnTheScreen();
    expect(option('Calculator')).toBeOnTheScreen();
    expect(queryOption('Search Emoji')).toBeNull();
    expect(queryOption('Profile')).toBeNull();
    // Hidden rather than removed, so its items keep their place for when the search changes again.
    expect(screen.queryByTestId('settings', { includeHiddenElements: false })).toBeNull();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('matches an item by its keywords, and by its value when it is given one, and hides the separator while it searches', async () => {
    const user = setUp();
    await render(<Palette />);

    await user.type(input(), 'smil');
    expect(option('Search Emoji')).toBeOnTheScreen();
    expect(queryOption('Calendar')).toBeNull();
    expect(screen.queryByTestId('separator')).toBeNull();

    await user.clear(input());
    await user.type(input(), 'bill');
    expect(option('Billing')).toBeOnTheScreen();
    expect(queryOption('Profile')).toBeNull();
  });

  it('says so when nothing matches', async () => {
    const user = setUp();
    await render(<Palette />);

    await user.type(input(), 'zzz');

    expect(screen.getByText('No results found.')).toBeOnTheScreen();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it("runs an item's onSelect with its value when it is pressed", async () => {
    const onSelect = jest.fn();
    const user = setUp();
    await render(<Palette onSelect={onSelect} />);

    await user.press(option('Profile'));
    expect(onSelect).toHaveBeenLastCalledWith('profile');

    await user.press(option('Calendar'));
    expect(onSelect).toHaveBeenLastCalledWith('Calendar');
  });

  it('announces a disabled item as disabled, dims it and ignores a press on it', async () => {
    const onSelect = jest.fn();
    const user = setUp();
    await render(<Palette onSelect={onSelect} />);

    await user.press(option('Calculator'));

    expect(option('Calculator')).toBeDisabled();
    expect(classesOf('Calculator')).toContain('opacity-50');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('highlights the first item that matches, and runs it on the return key', async () => {
    const onSelect = jest.fn();
    const user = setUp();
    await render(<Palette onSelect={onSelect} />);
    expect(classesOf('Calendar')).toContain('bg-muted');
    expect(classesOf('Billing')).not.toContain('bg-muted');

    await user.type(input(), 'bil');
    expect(classesOf('Billing')).toContain('bg-muted');

    await fireEvent(input(), 'submitEditing');
    expect(onSelect).toHaveBeenCalledWith('billing');
  });

  it('moves the highlight with the arrow keys, past a disabled item, and runs it on Enter', async () => {
    const onSelect = jest.fn();
    await render(<Palette onSelect={onSelect} />);
    const press = (key: string) => fireEvent(input(), 'keyPress', { nativeEvent: { key }, preventDefault: jest.fn() });

    await press('ArrowDown');
    expect(classesOf('Search Emoji')).toContain('bg-muted');
    expect(classesOf('Calendar')).not.toContain('bg-muted');

    await press('ArrowDown');
    expect(classesOf('Profile')).toContain('bg-muted');

    await press('ArrowUp');
    // The web's TextInput reports Enter as a submit.
    await fireEvent(input(), 'submitEditing');
    expect(onSelect).toHaveBeenCalledWith('Search Emoji');
  });

  it('stops at the last item, and with loop wraps round to the first', async () => {
    await render(<Palette />);
    const press = (key: string) => fireEvent(input(), 'keyPress', { nativeEvent: { key }, preventDefault: jest.fn() });

    await press('End');
    await press('ArrowDown');
    expect(classesOf('Billing')).toContain('bg-muted');

    await screen.rerender(<Palette root={{ loop: true }} />);
    await press('ArrowDown');
    expect(classesOf('Calendar')).toContain('bg-muted');
  });

  it('draws the shortcut of the highlighted item in the foreground colour', async () => {
    await render(<Palette />);
    const shortcut = () => emittedClasses(screen.getByText('P').props.className);
    expect(shortcut()).toContain('text-muted-foreground');

    await fireEvent(input(), 'keyPress', { nativeEvent: { key: 'ArrowDown' }, preventDefault: jest.fn() });
    await fireEvent(input(), 'keyPress', { nativeEvent: { key: 'ArrowDown' }, preventDefault: jest.fn() });

    expect(classesOf('Profile')).toContain('bg-muted');
    expect(shortcut()).toContain('text-foreground');
    expect(shortcut()).not.toContain('text-muted-foreground');
  });

  it("draws a group's heading muted and small, and names the group by it", async () => {
    await render(<Palette />);

    expect(emittedClasses(screen.getByText('Suggestions').props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-xs']),
    );
    const group = screen.getByTestId('suggestions');
    expect(group.props.role).toBe('group');
    expect(group.props['aria-labelledby']).toBe(screen.getByText('Suggestions').props.nativeID);
  });

  it('follows the search text its owner holds', async () => {
    function OwnedSearch() {
      const [search, setSearch] = useState('emoji');
      return (
        <Command>
          <CommandInput placeholder="Search" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandItem>
              <Text>Calendar</Text>
            </CommandItem>
            <CommandItem>
              <Text>Search Emoji</Text>
            </CommandItem>
          </CommandList>
        </Command>
      );
    }
    const user = setUp();
    await render(<OwnedSearch />);
    expect(queryOption('Calendar')).toBeNull();

    await user.clear(screen.getByPlaceholderText('Search'));

    expect(option('Calendar')).toBeOnTheScreen();
  });

  it('keeps every item with shouldFilter off, and filters by its own filter when it has one', async () => {
    const user = setUp();
    await render(<Palette root={{ shouldFilter: false }} />);
    await user.type(input(), 'zzz');
    expect(option('Calendar')).toBeOnTheScreen();

    await screen.rerender(<Palette root={{ filter: (value) => (value === 'billing' ? 1 : 0) }} />);
    expect(option('Billing')).toBeOnTheScreen();
    expect(queryOption('Calendar')).toBeNull();
  });

  it('announces a checked item as selected, with a check mark at its end', async () => {
    await render(
      <Command>
        <CommandList>
          <CommandItem checked>
            <Text>Next.js</Text>
          </CommandItem>
          <CommandItem>
            <Text>Remix</Text>
          </CommandItem>
        </CommandList>
      </Command>,
    );

    expect(option('Next.js')).toBeSelected();
    expect(option('Remix')).not.toBeSelected();
    expect(screen.getAllByTestId('command-check')).toHaveLength(1);
  });

  it('draws the rounded popover surface around itself', async () => {
    await render(<Palette root={{ testID: 'command' }} />);

    expect(emittedClasses(screen.getByTestId('command').props.className)).toEqual(
      expect.arrayContaining(['bg-popover', 'rounded-xl', 'p-1']),
    );
  });
});

describe('CommandDialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('opens a dialog named by its title, holding the palette, with no close button', async () => {
    await render(
      <>
        <CommandDialog open onOpenChange={jest.fn()}>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandItem>
                <Text>Calendar</Text>
              </CommandItem>
            </CommandList>
          </Command>
        </CommandDialog>
        <PortalHost />
      </>,
    );
    await act(() => jest.advanceTimersByTimeAsync(300));

    expect(screen.getByText('Command Palette')).toBeOnTheScreen();
    expect(screen.getByText('Search for a command to run...')).toBeOnTheScreen();
    expect(option('Calendar')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
