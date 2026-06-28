import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@zeroxsolutions/ui/components/ui/command';
import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  SettingsIcon,
  SmileIcon,
  UserIcon,
} from 'lucide-react';

/**
 * `Command` is a searchable command menu built on the `cmdk` primitive: a text
 * input that filters a list of grouped, keyboard-navigable items. Use it for
 * command palettes and quick-action menus, optionally grouping entries with
 * headings and separators and annotating them with trailing `CommandShortcut`
 * hints.
 */
const meta: Meta<typeof Command> = {
  title: 'Primitives/Command',
  component: Command,
};
export default meta;

type Story = StoryObj<typeof Command>;

/**
 * Demonstrates an inline command menu with two labeled groups separated by a
 * divider, icon-prefixed items, and keyboard-shortcut hints on the settings
 * actions.
 */
export const Default: Story = {
  render: () => (
    <Command className="w-80 ring-1 ring-foreground/10">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <CalendarIcon />
            Calendar
          </CommandItem>
          <CommandItem>
            <SmileIcon />
            Search Emoji
          </CommandItem>
          <CommandItem>
            <CalculatorIcon />
            Calculator
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <UserIcon />
            Profile
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCardIcon />
            Billing
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <SettingsIcon />
            Settings
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
