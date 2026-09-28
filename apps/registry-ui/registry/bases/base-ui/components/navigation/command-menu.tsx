import * as React from 'react';

import { Command, CommandDialog, CommandItem } from '@/registry/bases/base-ui/ui/command';

interface CommandMenuContextValue {
  select: (value: string) => void;
}

const CommandMenuContext = React.createContext<CommandMenuContextValue | null>(null);

function useCommandMenu(): CommandMenuContextValue {
  const ctx = React.useContext(CommandMenuContext);
  if (!ctx) {
    throw new Error('CommandMenu parts must be used within <CommandMenu>');
  }
  return ctx;
}

interface CommandMenuProps extends Omit<React.ComponentProps<typeof CommandDialog>, 'children' | 'onOpenChange'> {
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
 * `CommandMenuItem` reports its value via `onValueChange` and closes the
 * dialog. Compose the contents (`CommandInput`, `CommandList`, `CommandEmpty`,
 * items) as children and own all copy; bind the ⌘K key with `useCommandShortcut`.
 */
function CommandMenu({ open, onOpenChange, onValueChange, children, ...props }: CommandMenuProps) {
  const ctx: CommandMenuContextValue = {
    select: (value) => {
      onValueChange?.(value);
      onOpenChange?.(false);
    },
  };
  return (
    <CommandMenuContext.Provider value={ctx}>
      <CommandDialog open={open} onOpenChange={onOpenChange} {...props}>
        <Command>{children}</Command>
      </CommandDialog>
    </CommandMenuContext.Provider>
  );
}

interface CommandMenuItemProps extends Omit<React.ComponentProps<typeof CommandItem>, 'onSelect' | 'value'> {
  /** Reported via the switcher's `onValueChange` when chosen. */
  value: string;
}

/** An item in a `CommandMenu`; selecting it reports `value` and closes. */
function CommandMenuItem({ value, ...props }: CommandMenuItemProps) {
  const { select } = useCommandMenu();
  return <CommandItem value={value} onSelect={() => select(value)} {...props} />;
}

export { CommandMenu, CommandMenuItem };
export type { CommandMenuProps, CommandMenuItemProps };
