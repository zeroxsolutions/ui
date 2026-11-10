import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { Command, CommandDialog, CommandItem } from '../../ui/command';

/** Reports a chosen item's value and closes the menu. */
const CommandMenuContext = createContext<((value: string) => void) | null>(null);

function useCommandMenuSelect(): (value: string) => void {
  const select = useContext(CommandMenuContext);
  if (!select) throw new Error('CommandMenu parts must be used within <CommandMenu>');
  return select;
}

type CommandMenuProps = Omit<ComponentProps<typeof CommandDialog>, 'onOpenChange'> & {
  /** Called when the dialog asks to open or close, and with `false` after an item is chosen. */
  onOpenChange?: (open: boolean) => void;
  /** Called with the chosen item's value, before the dialog closes. */
  onValueChange?: (value: string) => void;
};

/**
 * A command palette for jumping to a target: a controlled CommandDialog holding a Command. Choosing a
 * `CommandMenuItem` reports its value through `onValueChange` and closes the dialog. Compose `CommandInput`,
 * `CommandList`, `CommandEmpty` and the items as children, and open it from a control of your own, such as a
 * button. The dialog's `title` and `description`, which are not drawn, name it for a screen reader; pass both
 * to say what it jumps to.
 */
function CommandMenu({
  title = 'Command menu',
  description = 'Search for a target to jump to.',
  onOpenChange,
  onValueChange,
  children,
  ...props
}: CommandMenuProps): ReactNode {
  const select = (value: string): void => {
    onValueChange?.(value);
    onOpenChange?.(false);
  };
  // The dialog draws its content in a portal, outside this tree, so the items find the menu from inside it.
  return (
    <CommandDialog title={title} description={description} onOpenChange={onOpenChange} {...props}>
      <CommandMenuContext.Provider value={select}>
        <Command>{children}</Command>
      </CommandMenuContext.Provider>
    </CommandDialog>
  );
}

type CommandMenuItemProps = Omit<ComponentProps<typeof CommandItem>, 'value'> & {
  /** What the typed text is matched against, reported through the menu's `onValueChange` when chosen. */
  value: string;
};

/** An item in a `CommandMenu`; choosing it runs `onSelect`, then reports `value` and closes the menu. */
function CommandMenuItem({ value, onSelect, ...props }: CommandMenuItemProps): ReactNode {
  const select = useCommandMenuSelect();
  return (
    <CommandItem
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
export type { CommandMenuItemProps, CommandMenuProps };
