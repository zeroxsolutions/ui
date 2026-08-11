import * as React from 'react';

import {
  Command,
  CommandDialog,
  CommandItem,
} from '@/registry/bases/base-ui/ui/command';

interface CommandSwitcherContextValue {
  select: (value: string) => void;
}

const CommandSwitcherContext =
  React.createContext<CommandSwitcherContextValue | null>(null);

function useCommandSwitcher(): CommandSwitcherContextValue {
  const ctx = React.useContext(CommandSwitcherContext);
  if (!ctx) {
    throw new Error(
      'CommandSwitcher parts must be used within <CommandSwitcher>',
    );
  }
  return ctx;
}

export interface CommandSwitcherProps
  extends Omit<
    React.ComponentProps<typeof CommandDialog>,
    'children' | 'onOpenChange'
  > {
  /** Open state (controlled). */
  open?: boolean;
  /** Fired when the dialog should open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Fired with the chosen item's value; the dialog then closes. */
  onValueChange?: (value: string) => void;
  /** The palette contents — a `CommandInput`, a `CommandList`, and items. */
  children: React.ReactNode;
}

/**
 * A ⌘K-style **command palette for jumping to a target** — a controlled dialog
 * (`open` / `onOpenChange`) wrapping the `Command` shell. Choosing a
 * `CommandSwitcherItem` reports its value via `onValueChange` and closes the
 * dialog. Compose the contents (`CommandInput`, `CommandList`, `CommandEmpty`,
 * items) as children and own all copy; bind the ⌘K key with `useCommandShortcut`.
 */
export function CommandSwitcher({
  open,
  onOpenChange,
  onValueChange,
  children,
  ...props
}: CommandSwitcherProps) {
  const ctx: CommandSwitcherContextValue = {
    select: (value) => {
      onValueChange?.(value);
      onOpenChange?.(false);
    },
  };
  return (
    <CommandSwitcherContext.Provider value={ctx}>
      <CommandDialog open={open} onOpenChange={onOpenChange} {...props}>
        <Command>{children}</Command>
      </CommandDialog>
    </CommandSwitcherContext.Provider>
  );
}

export interface CommandSwitcherItemProps
  extends Omit<React.ComponentProps<typeof CommandItem>, 'onSelect' | 'value'> {
  /** Reported via the switcher's `onValueChange` when chosen. */
  value: string;
}

/** An item in a `CommandSwitcher`; selecting it reports `value` and closes. */
export function CommandSwitcherItem({
  value,
  ...props
}: CommandSwitcherItemProps) {
  const { select } = useCommandSwitcher();
  return (
    <CommandItem value={value} onSelect={() => select(value)} {...props} />
  );
}
