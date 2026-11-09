import { ChevronDown, X } from 'lucide-react-native';
import { createContext, useContext, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
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
import { Text, TextClassContext } from './text';

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
  /** The chosen values, in the order they were chosen; one at most unless `multiple`. */
  values: readonly string[];
  labelOf: (value: string) => string;
  /** Chooses an item; a `multiple` Combobox lets go of it instead if it is chosen already. */
  choose: (value: string, label: string) => void;
  /** Lets go of one chosen value. */
  remove: (value: string) => void;
  /** Lets go of every chosen value. */
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  options: readonly ComboboxOption[];
}

const ComboboxContext = createContext<ComboboxState | undefined>(undefined);

function useCombobox(part: string): ComboboxState {
  const combobox = useContext(ComboboxContext);
  if (combobox === undefined) throw new Error(`${part} must be inside a Combobox`);
  return combobox;
}

/** A Combobox that chooses one item. */
interface ComboboxSingleProps {
  multiple?: false;
  /**
   * The chosen value, or `null` for none, when its owner holds it; follow `onValueChange` to change it, and
   * set `null` from a ComboboxClear's `onPress`.
   */
  value?: string | null;
  /** The value chosen first, when the Combobox holds its own. */
  defaultValue?: string | null;
  /** Called with an item's value as it is chosen; a ComboboxClear letting go of it calls its own `onPress`. */
  onValueChange?: (value: string) => void;
}

/** A Combobox that chooses any number of items, shown as ComboboxChips. */
interface ComboboxMultipleProps {
  multiple: true;
  /** The chosen values, when their owner holds them; follow `onValueChange` to change them. */
  value?: readonly string[];
  /** The values chosen first, when the Combobox holds its own. */
  defaultValue?: readonly string[];
  /** Called with every chosen value as an item is chosen or let go of. */
  onValueChange?: (value: string[]) => void;
}

type ComboboxProps = (ComboboxSingleProps | ComboboxMultipleProps) & {
  children?: ReactNode;
  /** The choices, which give each value its label and ComboboxList its items. */
  items?: ComboboxItems;
  /** Whether the list is open, when its owner holds the state; follow `onOpenChange` to change it. */
  open?: boolean;
  /** Whether the list starts open, when the Combobox holds its own state. */
  defaultOpen?: boolean;
  /** Called as the list opens and closes. */
  onOpenChange?: (open: boolean) => void;
};

function valuesOf(value: string | null | readonly string[] | undefined): readonly string[] {
  if (value === undefined || value === null) return [];
  return typeof value === 'string' ? [value] : value;
}

/**
 * A field that picks one of a long list of choices, searched by typing: a ComboboxTrigger showing the
 * chosen label, which opens a ComboboxContent holding a ComboboxInput over a ComboboxList. Choosing an item
 * closes the list. With `multiple` it picks any number: ComboboxChips show each chosen item as a ComboboxChip,
 * and a press on an item chooses it, or lets go of it if chosen, leaving the list open.
 */
function Combobox(props: ComboboxProps): ReactNode {
  const { children, items, open, defaultOpen = false, onOpenChange } = props;
  const multiple = props.multiple === true;
  const [ownValues, setOwnValues] = useState(() => valuesOf(props.defaultValue));
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  // The labels of values chosen from items the Combobox was not given.
  const chosenLabels = useRef(new Map<string, string>());
  const options = optionsOf(items);
  const isOpen = open ?? ownOpen;

  const setOpen = (next: boolean): void => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  // `null` is a value its owner holds: nothing chosen.
  const values = props.value === undefined ? ownValues : valuesOf(props.value);

  const report = (next: readonly string[]): void => {
    setOwnValues(next);
    if (props.multiple === true) props.onValueChange?.([...next]);
    else if (next[0] !== undefined) props.onValueChange?.(next[0]);
  };

  const state: ComboboxState = {
    values,
    labelOf: (wanted) =>
      options.find((option) => option.value === wanted)?.label ?? chosenLabels.current.get(wanted) ?? wanted,
    choose: (chosen, label) => {
      chosenLabels.current.set(chosen, label);
      if (!multiple) {
        report([chosen]);
        setOpen(false);
        return;
      }
      report(values.includes(chosen) ? values.filter((value) => value !== chosen) : [...values, chosen]);
    },
    remove: (removed) => report(values.filter((value) => value !== removed)),
    clear: () => report([]),
    open: isOpen,
    setOpen,
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

type ComboboxValueProps = Omit<ComponentProps<typeof Text>, 'children'> & {
  /** Shown, muted, while nothing is chosen. */
  placeholder?: string;
  /**
   * Draws the chosen values in place of their labels, such as a ComboboxChip for each: given every chosen value,
   * one at most without `multiple`, and none while nothing is chosen. What it returns is drawn as it is.
   */
  children?: (values: string[]) => ReactNode;
};

/** The chosen item's label, or with `multiple` the chosen labels, or the placeholder while nothing is chosen. */
function ComboboxValue({ className, placeholder, children, ...props }: ComboboxValueProps): ReactNode {
  const combobox = useCombobox('ComboboxValue');
  const chosen = combobox.values;
  if (children !== undefined) return children([...chosen]);
  return (
    <Text className={cn(chosen.length === 0 && 'text-muted-foreground', className)} {...props}>
      {chosen.length === 0 ? placeholder : chosen.map(combobox.labelOf).join(', ')}
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
            item: 'cn-combobox-item',
            highlighted: 'cn-combobox-item@highlighted',
            text: 'cn-combobox-item/text',
            highlightedText: 'cn-combobox-item/text@highlighted',
            icon: 'cn-combobox-item/icon',
            indicator: 'cn-combobox-item-indicator',
          }}
        >
          {/* The content is drawn afresh at each open, so the chosen item is highlighted each time. */}
          <Command className="p-0" defaultValue={combobox.values[0]}>
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
 * end. Pressing it, or the return key while it is highlighted, chooses it and closes the list; with `multiple`
 * it chooses it, or lets go of it if chosen, and the list stays open.
 */
function ComboboxItem({ className, value, label, children, ...props }: ComboboxItemProps): ReactNode {
  const combobox = useCombobox('ComboboxItem');
  const name = label ?? (isText(children) ? textOf(children) : combobox.labelOf(value));
  return (
    <CommandItem
      value={value}
      // The typed text finds the item by its label too, which the trigger shows.
      keywords={[name]}
      checked={combobox.values.includes(value)}
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

type ComboboxChipsProps = ComponentProps<typeof View> & {
  /** Draws the destructive border. Carry the error in a Text the user can reach, as no screen reader reads it. */
  'aria-invalid'?: boolean;
};

/**
 * The field of a `multiple` Combobox, in place of a ComboboxTrigger: a wrapping row of a ComboboxChip for each
 * chosen item, usually drawn by a function child of ComboboxValue, and a ComboboxChipsInput at the end. A press
 * on it opens the list below it, and it takes the focus border while the list is open and the destructive
 * border while `aria-invalid`.
 */
function ComboboxChips({ className, children, 'aria-invalid': invalid, ...props }: ComboboxChipsProps): ReactNode {
  const combobox = useCombobox('ComboboxChips');
  return (
    <PopoverTrigger asChild>
      {/* The chips input is the one control a screen reader reaches; the chips' remove buttons sit beside it. */}
      <Pressable
        accessible={false}
        className={cn(
          'flex-row cn-combobox-chips',
          combobox.values.length > 0 && 'cn-combobox-chips@slot=combobox-chip',
          combobox.open && 'cn-combobox-chips@focused',
          invalid === true && 'cn-combobox-chips@invalid',
          className,
        )}
        {...props}
      >
        <TextClassContext.Provider value="cn-combobox-chips/text">{children}</TextClassContext.Provider>
      </Pressable>
    </PopoverTrigger>
  );
}

type ComboboxChipProps = ComponentProps<typeof View> & {
  /** The chosen value the chip stands for; its text children when not given. */
  value?: string;
  /** Whether the chip draws a button that lets go of its value. */
  showRemove?: boolean;
};

/**
 * One chosen item in ComboboxChips, its label as text children, with a button at its end, named `Remove`
 * and the label, that lets go of it. Give `value` when the children are not the value or its label.
 */
function ComboboxChip({ className, children, value, showRemove = true, ...props }: ComboboxChipProps): ReactNode {
  const combobox = useCombobox('ComboboxChip');
  const text = textOf(children);
  const chipValue =
    value ?? combobox.values.find((chosen) => chosen === text || combobox.labelOf(chosen) === text) ?? text;
  return (
    <View
      className={cn('flex-row cn-combobox-chip', showRemove && 'cn-combobox-chip@slot=combobox-chip-remove', className)}
      {...props}
    >
      {asText(children, { className: 'cn-combobox-chip/text' })}
      {showRemove && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove ${combobox.labelOf(chipValue)}`}
          className="cn-combobox-chip-remove"
          onPress={() => combobox.remove(chipValue)}
        >
          <Icon as={X} />
        </Button>
      )}
    </View>
  );
}

type ComboboxChipsInputProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  /** Shown, muted, as what the field is for. */
  placeholder?: string;
};

/**
 * The end of ComboboxChips that opens the list, announced as a `combobox` that is expanded while the list is
 * open and showing its placeholder muted; name it with `aria-label`. The list's ComboboxInput takes the typed
 * search.
 */
function ComboboxChipsInput({ className, placeholder, onPress, ...props }: ComboboxChipsInputProps): ReactNode {
  const combobox = useCombobox('ComboboxChipsInput');
  return (
    <Pressable
      role="combobox"
      aria-expanded={combobox.open}
      className={cn('min-w-16 flex-1 justify-center', className)}
      onPress={(event) => {
        combobox.setOpen(!combobox.open);
        onPress?.(event);
      }}
      {...props}
    >
      <Text className="text-muted-foreground">{placeholder}</Text>
    </Pressable>
  );
}

type ComboboxClearProps = Omit<ButtonProps, 'children'>;

/**
 * A ghost icon button, named `Clear`, that lets go of every chosen item; it draws nothing while nothing is
 * chosen. Set it beside a ComboboxTrigger, or at the end of ComboboxChips. A `multiple` Combobox reports the
 * empty list through `onValueChange`; the owner of a single Combobox's `value` sets it to `null` in `onPress`.
 */
function ComboboxClear({ className, onPress, ...props }: ComboboxClearProps): ReactNode {
  const combobox = useCombobox('ComboboxClear');
  if (combobox.values.length === 0) return null;
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Clear"
      className={className}
      onPress={(event) => {
        combobox.clear();
        onPress?.(event);
      }}
      {...props}
    >
      <Icon as={X} />
    </Button>
  );
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
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
  ComboboxChipProps,
  ComboboxChipsInputProps,
  ComboboxChipsProps,
  ComboboxClearProps,
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
