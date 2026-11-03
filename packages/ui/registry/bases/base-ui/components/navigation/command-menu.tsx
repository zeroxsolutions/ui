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

interface CommandMenuProps extends Omit<React.ComponentProps<typeof CommandDialog>, 'onOpenChange'> {
  /**
   * Fired when the dialog asks to open or close, and with `false` after an item
   * is chosen. Choosing an item has no dialog event to hand over, so the
   * callback takes the open state alone.
   */
  onOpenChange?: (open: boolean) => void;
  /** Fired with the chosen item's value, before the dialog closes. */
  onValueChange?: (value: string) => void;
}

/**
 * A command palette for jumping to a target: a controlled `CommandDialog`
 * holding a `Command`. Choosing a `CommandMenuItem` reports its value through
 * `onValueChange` and closes the dialog. The consumer composes `CommandInput`,
 * `CommandList`, `CommandEmpty` and the items as children and owns all copy;
 * `useCommandShortcut` binds the key that opens it. The dialog's hidden `title`
 * and `description` name it for assistive technology; pass both to describe
 * what it jumps to.
 */
function CommandMenu({
  title = 'Command menu',
  description = 'Search for a target to jump to.',
  onOpenChange,
  onValueChange,
  children,
  ...props
}: CommandMenuProps): React.ReactNode {
  const ctx: CommandMenuContextValue = {
    select: (value) => {
      onValueChange?.(value);
      onOpenChange?.(false);
    },
  };
  return (
    <CommandMenuContext.Provider value={ctx}>
      <CommandDialog title={title} description={description} onOpenChange={onOpenChange} {...props}>
        <Command data-slot="command-menu">{children}</Command>
      </CommandDialog>
    </CommandMenuContext.Provider>
  );
}

interface CommandMenuItemProps extends Omit<React.ComponentProps<typeof CommandItem>, 'value'> {
  /** Reported through the menu's `onValueChange` when chosen. */
  value: string;
}

/** An item in a `CommandMenu`; choosing it runs `onSelect`, then reports `value` and closes the menu. */
function CommandMenuItem({ value, onSelect, ...props }: CommandMenuItemProps): React.ReactNode {
  const { select } = useCommandMenu();
  return (
    <CommandItem
      data-slot="command-menu-item"
      value={value}
      onSelect={(itemValue) => {
        onSelect?.(itemValue);
        select(value);
      }}
      {...props}
    />
  );
}

export { CommandMenu, CommandMenuItem };
export type { CommandMenuProps, CommandMenuItemProps };
