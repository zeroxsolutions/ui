import { Check, Search } from 'lucide-react-native';
import {
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Platform, Pressable, ScrollView, View, type Role, type TextInputKeyPressEvent } from 'react-native';
import { commandScore } from '../lib/command-score';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import type { DialogProps } from './dialog';
import { Icon, IconClassContext } from './icon';
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group';
import type { InputGroupInputProps } from './input-group';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its
// text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state; the
// registry build replaces each with the classes translated for the target engine.

/**
 * How well an item matches the search: above 0 shows it, 0 hides it.
 * @param value - the item's value
 * @param search - the typed text, never empty
 * @param keywords - the item's other names, when it has some
 */
type CommandFilter = (value: string, search: string, keywords?: readonly string[]) => number;

/** What the Command knows of one of its items, kept up to date as the item draws. */
interface CommandItemRecord {
  value: string;
  keywords?: readonly string[];
  disabled: boolean;
  group?: string;
  select: () => void;
}

/** What a Command's parts read from it and tell it. */
interface CommandState {
  search: string;
  setSearch: (search: string) => void;
  shows: (value: string, keywords?: readonly string[]) => boolean;
  /** The id of the highlighted item, which the return key runs. */
  activeId: string | undefined;
  highlight: (value: string) => void;
  record: (id: string, record: CommandItemRecord) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  shownCount: number;
  groupShown: (group: string) => boolean;
  onKeyPress: (event: TextInputKeyPressEvent) => void;
  runActive: () => void;
  listId: string;
}

const CommandContext = createContext<CommandState | undefined>(undefined);

function useCommand(part: string): CommandState {
  const command = useContext(CommandContext);
  if (command === undefined) throw new Error(`${part} must be inside a Command`);
  return command;
}

/** The text a node draws, which an item with no `value` is searched by, as upstream's reads it. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

/** The web's `document`, through which the highlighted item is scrolled into the list's view. */
interface WebDocument {
  getElementById: (id: string) => { scrollIntoView: (options: { block: 'nearest' }) => void } | null;
}

type CommandProps = ComponentProps<typeof View> & {
  /** The highlighted item's value, when its owner holds it; follow `onValueChange` to change it. */
  value?: string;
  /** The value of the item highlighted first, when the Command holds its own highlight. */
  defaultValue?: string;
  /** Called with an item's value as the highlight moves to it. */
  onValueChange?: (value: string) => void;
  /** Whether the typed text hides the items it does not match; turn it off to filter the items yourself. */
  shouldFilter?: boolean;
  /** Decides which items the typed text shows, in place of upstream's fuzzy match on value and keywords. */
  filter?: CommandFilter;
  /** Whether the arrow keys wrap round from the last item to the first, and back. */
  loop?: boolean;
};

/**
 * A menu of commands searched by typing: a CommandInput over a CommandList of items, which the typed text
 * filters. The first item that matches is highlighted, the arrow keys move the highlight on a keyboard, and
 * the return key runs the highlighted item.
 */
function Command({
  className,
  value,
  defaultValue,
  onValueChange,
  shouldFilter = true,
  filter = commandScore,
  loop = false,
  children,
  ...props
}: CommandProps): ReactNode {
  const listId = useId();
  const [search, setSearchState] = useState('');
  const [ownValue, setOwnValue] = useState(defaultValue);
  const highlighted = value ?? ownValue;
  const records = useRef(new Map<string, CommandItemRecord>());
  const [order, setOrder] = useState<readonly string[]>([]);
  const movedByKey = useRef(false);

  const shows = (itemValue: string, keywords?: readonly string[]): boolean =>
    !shouldFilter || search === '' || filter(itemValue, search, keywords) > 0;
  const shown = order.flatMap((id) => {
    const record = records.current.get(id);
    return record !== undefined && shows(record.value, record.keywords) ? [{ id, ...record }] : [];
  });
  const enabled = shown.filter((item) => !item.disabled);
  const active = enabled.find((item) => item.value === highlighted) ?? enabled[0];

  const highlight = (next: string): void => {
    setOwnValue(next);
    onValueChange?.(next);
  };

  const moveTo = (index: number): void => {
    const item = enabled[index];
    if (item === undefined) return;
    movedByKey.current = true;
    highlight(item.value);
  };

  const onKeyPress = (event: TextInputKeyPressEvent): void => {
    const index = active === undefined ? -1 : enabled.indexOf(active);
    const last = enabled.length - 1;
    const moves: Readonly<Record<string, number>> = {
      ArrowDown: index < last ? index + 1 : loop ? 0 : last,
      ArrowUp: index > 0 ? index - 1 : loop ? last : 0,
      Home: 0,
      End: last,
    };
    const to = moves[event.nativeEvent.key];
    if (to === undefined) return;
    // The arrows would move the caret in the text too.
    event.preventDefault();
    moveTo(to);
  };

  const activeId = active?.id;
  useEffect(() => {
    if (!movedByKey.current || activeId === undefined || Platform.OS !== 'web') return;
    movedByKey.current = false;
    const document = (globalThis as { document?: WebDocument }).document;
    document?.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  const state: CommandState = {
    search,
    setSearch: (next) => {
      setSearchState(next);
      // A new search highlights its first match again, as upstream's does.
      if (value === undefined) setOwnValue(undefined);
    },
    shows,
    activeId,
    highlight,
    record: (id, record) => records.current.set(id, record),
    add: (id) => setOrder((ids) => [...ids, id]),
    remove: (id) => {
      records.current.delete(id);
      setOrder((ids) => ids.filter((other) => other !== id));
    },
    shownCount: shown.length,
    groupShown: (group) => shown.some((item) => item.group === group),
    onKeyPress,
    runActive: () => active?.select(),
    listId,
  };

  return (
    <CommandContext.Provider value={state}>
      <TextClassContext.Provider value="cn-command/text">
        <View className={cn('w-full flex-col overflow-hidden cn-command', className)} {...props}>
          {children}
        </View>
      </TextClassContext.Provider>
    </CommandContext.Provider>
  );
}

type CommandDialogProps = Omit<DialogProps, 'children'> & {
  /** Names the dialog for a screen reader; it is not drawn. */
  title?: string;
  /** Describes the dialog for a screen reader; it is not drawn. */
  description?: string;
  className?: string;
  /** Draws a close button in the top right corner, named Close. */
  showCloseButton?: boolean;
  children: ReactNode;
};

/** A Command in a Dialog, such as a palette opened from a shortcut; it holds the Command it is given. */
function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = false,
  ...props
}: CommandDialogProps): ReactNode {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn('overflow-hidden p-0 cn-command-dialog', className)}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="absolute h-px w-px overflow-hidden">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

type CommandInputProps = Omit<InputGroupInputProps, 'value'> & {
  /** The typed text, when its owner holds it; follow `onValueChange` to change it. */
  value?: string;
  /** Called with the text as it is typed. */
  onValueChange?: (search: string) => void;
};

/**
 * The search field over the list, with a search icon at its start. The typed text filters the Command's
 * items; on a keyboard the arrow keys, Home and End move the highlight and the return key runs it.
 */
function CommandInput({
  className,
  value,
  onValueChange,
  onChangeText,
  onKeyPress,
  onSubmitEditing,
  ...props
}: CommandInputProps): ReactNode {
  const command = useCommand('CommandInput');
  const { setSearch } = command;
  const setSearchRef = useRef(setSearch);
  setSearchRef.current = setSearch;
  useLayoutEffect(() => {
    if (value !== undefined) setSearchRef.current(value);
  }, [value]);

  // The web announces the field as the combobox whose list it filters and whose highlighted item it runs.
  const web =
    Platform.OS === 'web'
      ? {
          role: 'combobox' as Role,
          'aria-expanded': true,
          'aria-controls': command.listId,
          'aria-activedescendant': command.activeId,
          'aria-autocomplete': 'list',
        }
      : { role: 'searchbox' as Role };

  return (
    <View className="cn-command-input-wrapper">
      <InputGroup className="cn-command-input-group">
        <InputGroupInput
          className={cn('cn-command-input cn-command-input/text', className)}
          value={value ?? command.search}
          autoCorrect={false}
          autoCapitalize="none"
          submitBehavior="submit"
          {...web}
          {...props}
          onChangeText={(text) => {
            setSearch(text);
            onValueChange?.(text);
            onChangeText?.(text);
          }}
          onKeyPress={(event) => {
            command.onKeyPress(event);
            onKeyPress?.(event);
          }}
          onSubmitEditing={(event) => {
            command.runActive();
            onSubmitEditing?.(event);
          }}
        />
        <InputGroupAddon className="cn-command-input-group@part=input-group-addon">
          <Icon as={Search} className="cn-command-input-icon" />
        </InputGroupAddon>
      </InputGroup>
    </View>
  );
}

type CommandListProps = ComponentProps<typeof ScrollView>;

/** The items, scrolled once they pass 18rem; announced as a `listbox` on the web and a `list` on a device. */
function CommandList({ className, ...props }: CommandListProps): ReactNode {
  const command = useCommand('CommandList');
  return (
    <ScrollView
      nativeID={command.listId}
      role={(Platform.OS === 'web' ? 'listbox' : 'list') as Role}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className={cn('cn-command-list', className)}
      {...props}
    />
  );
}

type CommandEmptyProps = ComponentProps<typeof View>;

/** What the list says, centred, while the typed text matches no item. */
function CommandEmpty({ className, children, ...props }: CommandEmptyProps): ReactNode {
  const command = useCommand('CommandEmpty');
  if (command.shownCount > 0) return null;
  return (
    <TextClassContext.Provider value="cn-command-empty/text">
      <View className={cn('cn-command-empty', className)} {...props}>
        {typeof children === 'string' || typeof children === 'number' ? <Text>{children}</Text> : children}
      </View>
    </TextClassContext.Provider>
  );
}

/** The Command's id for the group around an item, which shows the group while one of its items does. */
const CommandGroupContext = createContext<string | undefined>(undefined);

type CommandGroupProps = ComponentProps<typeof View> & {
  /** The muted heading over the group, which names it. */
  heading?: ReactNode;
  /** Shows the group even while the typed text matches none of its items. */
  forceMount?: boolean;
};

/**
 * Items that belong together under a heading, announced as a `group` named by it. It is hidden while the
 * typed text matches none of its items.
 */
function CommandGroup({ className, heading, forceMount = false, style, children, ...props }: CommandGroupProps) {
  const command = useCommand('CommandGroup');
  const group = useId();
  const headingId = useId();
  const shown = forceMount || command.groupShown(group);
  return (
    <CommandGroupContext.Provider value={group}>
      <View
        role="group"
        aria-labelledby={heading === undefined ? undefined : headingId}
        className={cn('cn-command-group', className)}
        // Hidden rather than removed, so its items stay to be matched again.
        style={[!shown && { display: 'none' }, style]}
        {...props}
      >
        {shown && heading !== undefined && (
          <Text
            nativeID={headingId}
            className="cn-command-group@part=group-heading cn-command-group/text@part=group-heading"
          >
            {heading}
          </Text>
        )}
        <TextClassContext.Provider value="cn-command-group/text">{children}</TextClassContext.Provider>
      </View>
    </CommandGroupContext.Provider>
  );
}

type CommandSeparatorProps = ComponentProps<typeof View> & {
  /** Keeps the separator while the Command searches, which otherwise hides it. */
  alwaysRender?: boolean;
};

/** A hairline between groups, hidden while the Command searches. */
function CommandSeparator({ className, alwaysRender = false, ...props }: CommandSeparatorProps): ReactNode {
  const command = useCommand('CommandSeparator');
  if (command.search !== '' && !alwaysRender) return null;
  return <View role="separator" className={cn('cn-command-separator', className)} {...props} />;
}

/** Whether the item around a CommandShortcut is highlighted, which the shortcut's colour follows. */
const CommandItemSelectedContext = createContext(false);

/**
 * The classes a CommandItem draws itself with, plain and while highlighted, for its row, its text and its
 * icons. A part built on the Command, such as a Combobox's list, provides its own slots here.
 */
interface CommandItemClasses {
  item: string;
  highlighted: string;
  text: string;
  highlightedText: string;
  icon: string;
}

const CommandItemClassesContext = createContext<CommandItemClasses>({
  item: 'cn-command-item',
  highlighted: 'cn-command-item@selected',
  text: 'cn-command-item/text',
  highlightedText: 'cn-command-item/text@selected',
  icon: 'cn-command-item/icon',
});

type CommandItemProps = Omit<ComponentProps<typeof Pressable>, 'children' | 'onPress'> & {
  children?: ReactNode;
  /** What the typed text is matched against and what `onSelect` gets; the item's text when not given. */
  value?: string;
  /** Other names the typed text finds the item by. */
  keywords?: readonly string[];
  /** Runs the item, when it is pressed or highlighted as the return key is pressed, with its value. */
  onSelect?: (value: string) => void;
  /** Draws a check mark at the item's end, as for the chosen option of a combobox. */
  checked?: boolean;
};

/**
 * A command in the list, announced as an `option`, hidden while the typed text does not match it. It is
 * highlighted as the first match, as the arrow keys or the pointer move to it, or while a finger is on it.
 * A disabled item is dimmed, announced as disabled, and neither highlighted nor run.
 */
function CommandItem({
  className,
  value,
  keywords,
  onSelect,
  checked = false,
  disabled,
  onHoverIn,
  onPressIn,
  onPressOut,
  children,
  ...props
}: CommandItemProps): ReactNode {
  const command = useCommand('CommandItem');
  const classes = useContext(CommandItemClassesContext);
  const group = useContext(CommandGroupContext);
  const id = useId();
  const [pressed, setPressed] = useState(false);
  const itemValue = (value ?? textOf(children)).trim();
  const off = disabled === true;
  const select = (): void => onSelect?.(itemValue);

  // Before the Command draws again, so it counts the item with the record it drew with.
  useLayoutEffect(() => {
    command.record(id, { value: itemValue, keywords, disabled: off, group, select });
  });
  const { add, remove } = command;
  const registry = useRef({ add, remove });
  useLayoutEffect(() => {
    const { add: added, remove: removed } = registry.current;
    added(id);
    return () => removed(id);
  }, [id]);

  if (!command.shows(itemValue, keywords)) return null;
  const active = command.activeId === id;
  const highlighted = active || pressed;

  return (
    <CommandItemSelectedContext.Provider value={highlighted}>
      <TextClassContext.Provider value={cn(classes.text, highlighted && classes.highlightedText)}>
        <IconClassContext.Provider value={classes.icon}>
          <Pressable
            role="option"
            nativeID={id}
            // The input keeps the keyboard's focus on the web, and names the highlighted item itself.
            focusable={false}
            // The web reports the highlighted item as selected, as upstream's does; a device has no highlight
            // a screen reader moves, so there the checked item is the selected one.
            aria-selected={Platform.OS === 'web' ? active : checked}
            aria-checked={Platform.OS === 'web' ? checked : undefined}
            disabled={off}
            aria-disabled={off}
            className={cn(
              'relative flex-row items-center',
              classes.item,
              off && 'opacity-50',
              highlighted && classes.highlighted,
              className,
            )}
            onHoverIn={(event) => {
              if (!off) command.highlight(itemValue);
              onHoverIn?.(event);
            }}
            onPressIn={(event) => {
              setPressed(true);
              onPressIn?.(event);
            }}
            onPressOut={(event) => {
              setPressed(false);
              onPressOut?.(event);
            }}
            onPress={select}
            {...props}
          >
            {children}
            {checked && (
              <View className="ml-auto">
                <Icon as={Check} testID="command-check" />
              </View>
            )}
          </Pressable>
        </IconClassContext.Provider>
      </TextClassContext.Provider>
    </CommandItemSelectedContext.Provider>
  );
}

type CommandShortcutProps = ComponentProps<typeof Text>;

/** The keys that run an item, drawn muted at the item's end. */
function CommandShortcut({ className, ...props }: CommandShortcutProps): ReactNode {
  const selected = useContext(CommandItemSelectedContext);
  return (
    <Text
      className={cn(
        'cn-command-shortcut cn-command-shortcut/text',
        selected && 'cn-command-shortcut/text@selected',
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandItemClassesContext,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
export type {
  CommandDialogProps,
  CommandItemClasses,
  CommandEmptyProps,
  CommandFilter,
  CommandGroupProps,
  CommandInputProps,
  CommandItemProps,
  CommandListProps,
  CommandProps,
  CommandSeparatorProps,
  CommandShortcutProps,
};
