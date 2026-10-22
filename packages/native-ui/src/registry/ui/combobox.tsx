import { ChevronDown } from 'lucide-react-native';
import { createContext, useContext, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { asText, isText, textOf } from '../lib/text-children';
import { cn } from '../lib/utils';
import { Button } from './button';
import type { ButtonProps } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemClassesContext,
  CommandList,
  CommandSeparator,
} from './command';
import type {
  CommandEmptyProps,
  CommandGroupProps,
  CommandInputProps,
  CommandItemProps,
  CommandListProps,
  CommandSeparatorProps,
} from './command';
import { Icon } from './icon';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import type { PopoverContentProps } from './popover';
import { Text } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes the style puts behind that state; the registry build replaces each
// with the classes translated for the target engine.

/** One choice of a Combobox: the label it shows and the value it reports. */
interface ComboboxOption {
  label: string;
  value: string;
}

/** A Combobox's choices: labels that are their own values, or labels with values. */
type ComboboxItems = readonly string[] | readonly ComboboxOption[];

function optionsOf(items: ComboboxItems | undefined): readonly ComboboxOption[] {
  return (items ?? []).map((item) => (typeof item === 'string' ? { label: item, value: item } : item));
}

/** What a Combobox's parts read from it. */
interface ComboboxState {
  value: string | undefined;
  labelOf: (value: string) => string;
  choose: (value: string, label: string) => void;
  open: boolean;
  options: readonly ComboboxOption[];
}

const ComboboxContext = createContext<ComboboxState | undefined>(undefined);

function useCombobox(part: string): ComboboxState {
  const combobox = useContext(ComboboxContext);
  if (combobox === undefined) throw new Error(`${part} must be inside a Combobox`);
  return combobox;
}

type ComboboxProps = {
  children?: ReactNode;
  /** The choices, which give each value its label and ComboboxList its items. */
  items?: ComboboxItems;
  /** The chosen value, when its owner holds it; follow `onValueChange` to change it. */
  value?: string;
  /** The value chosen first, when the Combobox holds its own. */
  defaultValue?: string;
  /** Called with an item's value as it is chosen. */
  onValueChange?: (value: string) => void;
  /** Whether the list is open, when its owner holds the state; follow `onOpenChange` to change it. */
  open?: boolean;
  /** Whether the list starts open, when the Combobox holds its own state. */
  defaultOpen?: boolean;
  /** Called as the list opens and closes. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * A field that picks one of a long list of choices, searched by typing: a ComboboxTrigger showing the
 * chosen label, which opens a ComboboxContent holding a ComboboxInput over a ComboboxList. Choosing an item
 * closes the list.
 */
function Combobox({
  children,
  items,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
}: ComboboxProps): ReactNode {
  const [ownValue, setOwnValue] = useState(defaultValue);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  // The labels of values chosen from items the Combobox was not given.
  const chosenLabels = useRef(new Map<string, string>());
  const options = optionsOf(items);
  const isOpen = open ?? ownOpen;

  const setOpen = (next: boolean): void => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  const state: ComboboxState = {
    value: value ?? ownValue,
    labelOf: (wanted) =>
      options.find((option) => option.value === wanted)?.label ?? chosenLabels.current.get(wanted) ?? wanted,
    choose: (chosen, label) => {
      chosenLabels.current.set(chosen, label);
      setOwnValue(chosen);
      onValueChange?.(chosen);
      setOpen(false);
    },
    open: isOpen,
    options,
  };

  return (
    <ComboboxContext.Provider value={state}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        {children}
      </Popover>
    </ComboboxContext.Provider>
  );
}

type ComboboxTriggerProps = Omit<ButtonProps, 'children'> & { children?: ReactNode };

/**
 * An outline Button that opens the list, with a chevron at its end, announced as a `combobox` that is
 * expanded while the list is open; name it with `aria-label`.
 */
function ComboboxTrigger({ className, children, ...props }: ComboboxTriggerProps): ReactNode {
  const combobox = useCombobox('ComboboxTrigger');
  return (
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={combobox.open}
        className={cn('justify-between cn-combobox-trigger', className)}
        {...props}
      >
        {children}
        <Icon as={ChevronDown} className="cn-combobox-trigger-icon cn-combobox-trigger-icon/text" />
      </Button>
    </PopoverTrigger>
  );
}

type ComboboxValueProps = ComponentProps<typeof Text> & {
  /** Shown, muted, while nothing is chosen. */
  placeholder?: string;
};

/** The chosen item's label, or the placeholder while nothing is chosen. */
function ComboboxValue({ className, placeholder, ...props }: ComboboxValueProps): ReactNode {
  const combobox = useCombobox('ComboboxValue');
  const chosen = combobox.value;
  return (
    <Text className={cn(chosen === undefined && 'text-muted-foreground', className)} {...props}>
      {chosen === undefined ? placeholder : combobox.labelOf(chosen)}
    </Text>
  );
}

type ComboboxContentProps = PopoverContentProps;

/**
 * The list's panel, drawn 6px below the trigger and lined up with its start by default, as a Popover is:
 * a press outside it, the back button and Escape close it. It opens with the chosen item highlighted.
 */
function ComboboxContent({
  className,
  children,
  align = 'start',
  sideOffset = 6,
  ...props
}: ComboboxContentProps): ReactNode {
  const combobox = useCombobox('ComboboxContent');
  return (
    <PopoverContent
      align={align}
      sideOffset={sideOffset}
      className={cn('gap-0 p-0 cn-combobox-content', className)}
      {...props}
    >
      {/* The portal draws outside this tree, so the Combobox is handed in again. */}
      <ComboboxContext.Provider value={combobox}>
        {/* The items draw with the combobox's own slots in place of a Command's. */}
        <CommandItemClassesContext.Provider
          value={{
            // The check mark is drawn in the row rather than over upstream's pr-8, so that padding goes.
            item: 'cn-combobox-item pr-2',
            highlighted: 'cn-combobox-item@highlighted',
            text: 'cn-combobox-item/text',
            highlightedText: 'cn-combobox-item/text@highlighted',
            icon: 'cn-combobox-item/icon',
          }}
        >
          {/* The content is drawn afresh at each open, so the chosen item is highlighted each time. */}
          <Command className="p-0" defaultValue={combobox.value}>
            {children}
          </Command>
        </CommandItemClassesContext.Provider>
      </ComboboxContext.Provider>
    </PopoverContent>
  );
}

type ComboboxInputProps = CommandInputProps;

/** The search field at the top of the list, focused as the list opens; the typed text filters the items. */
function ComboboxInput({ autoFocus = true, ...props }: ComboboxInputProps): ReactNode {
  return <CommandInput autoFocus={autoFocus} {...props} />;
}

type ComboboxListProps = Omit<CommandListProps, 'children'> & {
  /** The items, or a function drawing one item from each of the Combobox's `items`. */
  children?: ReactNode | ((option: ComboboxOption) => ReactNode);
};

/** The items, scrolled once they pass the list's height. */
function ComboboxList({ className, children, ...props }: ComboboxListProps): ReactNode {
  const combobox = useCombobox('ComboboxList');
  return (
    <CommandList className={cn('cn-combobox-list', className)} {...props}>
      {typeof children === 'function' ? combobox.options.map((option) => children(option)) : children}
    </CommandList>
  );
}

type ComboboxItemProps = Omit<CommandItemProps, 'value' | 'onSelect' | 'checked' | 'keywords'> & {
  /** The value choosing the item reports. */
  value: string;
  /** What the typed text is matched against and the trigger shows; text children when not given. */
  label?: string;
};

/**
 * A choice in the list, announced as an `option` that is selected while chosen, with a check mark at its
 * end. Pressing it, or the return key while it is highlighted, chooses it and closes the list.
 */
function ComboboxItem({ className, value, label, children, ...props }: ComboboxItemProps): ReactNode {
  const combobox = useCombobox('ComboboxItem');
  const name = label ?? (isText(children) ? textOf(children) : combobox.labelOf(value));
  return (
    <CommandItem
      value={value}
      // The typed text finds the item by its label too, which the trigger shows.
      keywords={[name]}
      checked={combobox.value === value}
      onSelect={() => combobox.choose(value, name)}
      className={className}
      {...props}
    >
      {asText(children)}
    </CommandItem>
  );
}

type ComboboxGroupProps = Omit<CommandGroupProps, 'heading'>;

/** Items that belong together, hidden while the typed text matches none of them; a ComboboxLabel names them. */
function ComboboxGroup(props: ComboboxGroupProps): ReactNode {
  return <CommandGroup {...props} />;
}

type ComboboxLabelProps = ComponentProps<typeof Text>;

/** The muted heading over a group of items. */
function ComboboxLabel({ className, ...props }: ComboboxLabelProps): ReactNode {
  return <Text className={cn('cn-combobox-label cn-combobox-label/text', className)} {...props} />;
}

type ComboboxEmptyProps = CommandEmptyProps;

/** What the list says, muted, while the typed text matches no item. */
function ComboboxEmpty({ className, children, ...props }: ComboboxEmptyProps): ReactNode {
  return (
    <CommandEmpty className={cn('cn-combobox-empty cn-combobox-empty@empty', className)} {...props}>
      {asText(children, { className: 'cn-combobox-empty/text' })}
    </CommandEmpty>
  );
}

type ComboboxSeparatorProps = CommandSeparatorProps;

/** A hairline between groups, hidden while the list is searched. */
function ComboboxSeparator({ className, ...props }: ComboboxSeparatorProps): ReactNode {
  return <CommandSeparator className={cn('cn-combobox-separator', className)} {...props} />;
}

export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
};
export type {
  ComboboxContentProps,
  ComboboxEmptyProps,
  ComboboxGroupProps,
  ComboboxInputProps,
  ComboboxItemProps,
  ComboboxItems,
  ComboboxLabelProps,
  ComboboxListProps,
  ComboboxOption,
  ComboboxProps,
  ComboboxSeparatorProps,
  ComboboxTriggerProps,
  ComboboxValueProps,
};
